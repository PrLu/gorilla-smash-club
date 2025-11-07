import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: Fetch all categories (active only for non-admins, all for admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get auth header
    const authHeader = request.headers.get('authorization');
    let isAdmin = false;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (user) {
        // Check if user is admin or root
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        isAdmin = profile?.role === 'admin' || profile?.role === 'root';
      }
    }

    // Fetch categories
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('display_name', { ascending: true });

    // Non-admins only see active categories
    if (!isAdmin) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new category (admin/root only)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or root
    const { data: userRoles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .eq('scope_type', 'global')
      .in('role', ['admin', 'root']);

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or root access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, display_name, description, is_team_based, is_active, sort_order } = body;

    // Validate required fields
    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'name and display_name are required' },
        { status: 400 }
      );
    }

    // Use service role for insertion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: category, error: insertError } = await supabaseAdmin
      .from('categories')
      .insert({
        name: name.toLowerCase().trim(),
        display_name: display_name.trim(),
        description: description || null,
        is_team_based: is_team_based ?? false,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

