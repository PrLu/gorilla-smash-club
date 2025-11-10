import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PATCH: Bulk update category sort orders
 * Used for drag-and-drop reordering
 */
export async function PATCH(request: NextRequest) {
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
    const { categoryOrders } = body; // Array of { id, sort_order }

    if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
      return NextResponse.json(
        { error: 'categoryOrders must be a non-empty array' },
        { status: 400 }
      );
    }

    // Use service role for bulk update
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update each category's sort_order
    const updatePromises = categoryOrders.map(({ id, sort_order }) =>
      supabaseAdmin
        .from('categories')
        .update({ sort_order })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Some updates failed', details: errors.map(e => e.error?.message) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category order updated successfully',
      updated: categoryOrders.length,
    });
  } catch (error: any) {
    console.error('Reorder categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









