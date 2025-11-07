import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PUT: Update a category (admin/root only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
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

    // Use service role for update
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.toLowerCase().trim();
    if (display_name !== undefined) updateData.display_name = display_name.trim();
    if (description !== undefined) updateData.description = description;
    if (is_team_based !== undefined) updateData.is_team_based = is_team_based;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data: category, error: updateError } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a category (admin/root only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
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

    // Use service role for deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if category is in use
    const { count: registrationCount } = await supabaseAdmin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>category', categoryId);

    if (registrationCount && registrationCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category',
          message: `This category is used in ${registrationCount} registrations. Set it as inactive instead.`
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

