import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
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

    // Create admin client with service role
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

    // Check user role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'root'])
      .single();

    if (!roleData) {
      return NextResponse.json({ error: 'Insufficient permissions - Admin or Root access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, full_name, phone, gender, dupr_id } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user!.id,
        email,
        full_name,
        phone: phone || null,
        gender: gender || null,
        dupr_id: dupr_id || null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Explicitly assign participant role (player only, not admin)
    // Note: Trigger won't run because created_by is set
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        profile_id: authData.user!.id,
        role: 'participant',
        scope_type: 'global',
        granted_by: user.id,
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Don't rollback for role error, but log it
    }

    return NextResponse.json({ 
      success: true, 
      player: {
        id: authData.user!.id,
        email,
        full_name,
      }
    });

  } catch (error: any) {
    console.error('Create player error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

