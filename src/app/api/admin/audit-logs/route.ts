import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuditLogs } from '@/lib/audit';
import { hasRole } from '@/lib/roles';

/**
 * Audit Logs API
 * GET: Fetch paginated audit logs with filters
 * Requires super_admin or support role
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or support role
    const isAdminUser = await hasRole(user.id, 'super_admin');
    const isSupportUser = await hasRole(user.id, 'support');

    if (!isAdminUser && !isSupportUser) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Support role required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const actorId = searchParams.get('actorId') || undefined;
    const action = searchParams.get('action') || undefined;
    const targetTable = searchParams.get('targetTable') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getAuditLogs({
      actorId,
      action,
      targetTable,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

