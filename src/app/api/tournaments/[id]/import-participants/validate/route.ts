import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Validation-only endpoint for CSV import preview
 * POST /api/tournaments/:id/import-participants/validate
 * 
 * Does NOT save any data - only validates and returns preview
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No auth token' }, { status: 401 });
    }

    // Create client to verify user
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check user role using service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'root'])
      .single();

    if (!roleData) {
      return NextResponse.json({ error: 'Insufficient permissions - Admin or Root access required' }, { status: 403 });
    }

    const tournamentId = params.id;
    const body = await request.json();
    const { participants } = body;

    // Validate input
    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: 'Participants array is required and must not be empty' }, { status: 400 });
    }

    const validationResults = {
      valid: [] as any[],
      invalid: [] as any[],
      warnings: [] as any[],
      statistics: {
        total: participants.length,
        validCount: 0,
        invalidCount: 0,
        warningCount: 0,
        duplicateEmails: 0,
        existingUsers: 0,
        newUsers: 0,
        alreadyRegistered: 0,
        categoriesUsed: new Set<string>(),
      },
    };

    // Track email duplicates within the CSV
    const emailCounts = new Map<string, number>();
    participants.forEach((p: any) => {
      if (p.email) {
        emailCounts.set(p.email.toLowerCase(), (emailCounts.get(p.email.toLowerCase()) || 0) + 1);
      }
    });

    // Get all active categories
    const { data: activeCategories } = await supabaseAdmin
      .from('categories')
      .select('name, display_name, is_team_based')
      .eq('is_active', true);

    const categoryMap = new Map(activeCategories?.map(c => [c.name, c]) || []);
    const validCategoryNames = Array.from(categoryMap.keys());

    // Get existing profiles and registrations in one query for efficiency
    const allEmails = participants.map((p: any) => p.email?.toLowerCase()).filter(Boolean);
    
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('email', allEmails);

    const existingEmailSet = new Set(existingProfiles?.map(p => p.email.toLowerCase()) || []);

    const { data: existingRegistrations } = await supabaseAdmin
      .from('registrations')
      .select('id, player:players(profile:profiles(email))')
      .eq('tournament_id', tournamentId);

    const registeredEmailSet = new Set(
      existingRegistrations
        ?.map((r: any) => r.player?.profile?.email?.toLowerCase())
        .filter(Boolean) || []
    );

    // Validate each participant
    for (const participant of participants) {
      const { email, full_name, phone, gender, dupr_id, category, rating, partner_email, payment_status } = participant;
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const info: any = {
        email,
        full_name,
        category,
        rating,
        gender,
        partner_email,
        payment_status: payment_status || 'pending',
      };

      // Required field validation
      if (!email) {
        errors.push('Email is required');
      } else {
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push('Invalid email format');
        } else {
          info.emailLower = email.toLowerCase();
          
          // Duplicate email in CSV
          if (emailCounts.get(email.toLowerCase())! > 1) {
            warnings.push(`Email appears ${emailCounts.get(email.toLowerCase())} times in CSV`);
            validationResults.statistics.duplicateEmails++;
          }

          // Existing user check
          if (existingEmailSet.has(email.toLowerCase())) {
            info.existingUser = true;
            validationResults.statistics.existingUsers++;
          } else {
            info.existingUser = false;
            validationResults.statistics.newUsers++;
          }

          // Already registered check
          if (registeredEmailSet.has(email.toLowerCase())) {
            warnings.push('Already registered in this tournament');
            validationResults.statistics.alreadyRegistered++;
          }
        }
      }

      if (!full_name || full_name.trim() === '') {
        errors.push('Full name is required');
      }

      if (!category) {
        errors.push('Category is required');
      } else if (!validCategoryNames.includes(category)) {
        errors.push(`Invalid category: "${category}". Valid options: ${validCategoryNames.join(', ')}`);
      } else {
        validationResults.statistics.categoriesUsed.add(category);
        const categoryData = categoryMap.get(category);
        info.isTeamBased = categoryData?.is_team_based || false;
        
        // Partner validation for team-based categories
        if (categoryData?.is_team_based) {
          if (!partner_email) {
            warnings.push(`Category "${category}" is team-based but no partner email provided`);
          } else if (partner_email === email) {
            errors.push('Partner email cannot be the same as participant email');
          }
        }
      }

      // Gender validation
      if (gender && !['male', 'female'].includes(gender.toLowerCase())) {
        errors.push(`Invalid gender: "${gender}". Valid options: male, female`);
      }

      // Rating validation
      if (rating && !['<3.2', '<3.6', '<3.8', 'open'].includes(rating)) {
        warnings.push(`Non-standard rating: "${rating}". Standard options: <3.2, <3.6, <3.8, open`);
      }

      // Payment status validation
      if (payment_status && !['pending', 'paid', 'waived'].includes(payment_status)) {
        warnings.push(`Invalid payment status: "${payment_status}". Will default to "pending"`);
        info.payment_status = 'pending';
      }

      // Categorize result
      if (errors.length > 0) {
        validationResults.invalid.push({
          ...info,
          errors,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
        validationResults.statistics.invalidCount++;
      } else {
        if (warnings.length > 0) {
          validationResults.warnings.push({
            ...info,
            warnings,
          });
          validationResults.statistics.warningCount++;
        }
        validationResults.valid.push({
          ...info,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
        validationResults.statistics.validCount++;
      }
    }

    // Convert Set to Array for JSON response
    validationResults.statistics.categoriesUsed = Array.from(validationResults.statistics.categoriesUsed) as any;

    return NextResponse.json({
      success: true,
      validation: validationResults,
      message: validationResults.statistics.invalidCount === 0
        ? `✅ All ${validationResults.statistics.validCount} participants are valid and ready to import`
        : `⚠️ Found ${validationResults.statistics.invalidCount} invalid entries. Please fix errors before importing.`,
      canImport: validationResults.statistics.invalidCount === 0,
    });

  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate participants' },
      { status: 500 }
    );
  }
}

