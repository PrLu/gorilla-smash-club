import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRoles, assignRole, removeRole, isAdmin } from '@/lib/roles';
import { recordAudit } from '@/lib/audit';

/**
 * Roles Management API
 * GET: List user roles
 * POST: Assign role to user
 * DELETE: Remove role from user
 * Requires super_admin role
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 });
    }

    const roles = await getUserRoles(profileId);

    return NextResponse.json({ roles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { profileId, roleName, scopeType, scopeId, expiresAt } = body;

    if (!profileId || !roleName) {
      return NextResponse.json(
        { error: 'profileId and roleName are required' },
        { status: 400 }
      );
    }

    const result = await assignRole({
      profileId,
      roleName,
      scopeType,
      scopeId,
      grantedBy: user.id,
      expiresAt,
    });

    // Log the role assignment
    await recordAudit({
      action: 'ASSIGN_ROLE',
      targetTable: 'user_roles',
      targetId: result.id,
      metadata: { profileId, roleName, scopeType },
      actorId: user.id,
    });

    return NextResponse.json({ success: true, userRole: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userRoleId = searchParams.get('userRoleId');

    if (!userRoleId) {
      return NextResponse.json({ error: 'userRoleId required' }, { status: 400 });
    }

    await removeRole(userRoleId);

    // Log the role removal
    await recordAudit({
      action: 'REMOVE_ROLE',
      targetTable: 'user_roles',
      targetId: userRoleId,
      metadata: {},
      actorId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

