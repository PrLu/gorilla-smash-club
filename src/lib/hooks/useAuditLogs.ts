import { useQuery } from '@tanstack/react-query';

export interface AuditLog {
  id: string;
  actor_profile_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  old_data: any;
  new_data: any;
  metadata: any;
  created_at: string;
  actor: {
    full_name: string;
    email: string;
  } | null;
}

interface UseAuditLogsParams {
  actorId?: string;
  action?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch audit logs with optional filters
 * Requires admin or support role
 */
export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.actorId) queryParams.set('actorId', params.actorId);
  if (params.action) queryParams.set('action', params.action);
  if (params.targetTable) queryParams.set('targetTable', params.targetTable);
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.offset) queryParams.set('offset', params.offset.toString());

  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      return response.json();
    },
  });
}

