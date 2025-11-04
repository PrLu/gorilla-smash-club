import { createClient } from '@supabase/supabase-js';

/**
 * Audit logging utility
 * Records all significant actions for compliance and debugging
 */

interface AuditLogEntry {
  action: string;
  targetTable: string;
  targetId?: string;
  metadata?: Record<string, any>;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record an audit log entry
 * Uses service role to bypass RLS
 */
export async function recordAudit({
  action,
  targetTable,
  targetId,
  metadata = {},
  actorId,
  ipAddress,
  userAgent,
}: AuditLogEntry): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('audit_logs').insert({
      actor_profile_id: actorId,
      action,
      target_table: targetTable,
      target_id: targetId,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error('Audit log error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Audit log exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs({
  actorId,
  action,
  targetTable,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}: {
  actorId?: string;
  action?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('audit_logs')
    .select('*, actor:profiles!audit_logs_actor_profile_id_fkey(full_name, email)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (actorId) query = query.eq('actor_profile_id', actorId);
  if (action) query = query.eq('action', action);
  if (targetTable) query = query.eq('target_table', targetTable);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data, error, count } = await query;

  if (error) throw error;

  return { data, count, limit, offset };
}

