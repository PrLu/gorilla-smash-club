import { createClient } from '@supabase/supabase-js';

/**
 * Role-based access control utilities
 * Checks user permissions for various operations
 */

export type RoleName = 'super_admin' | 'organizer' | 'referee' | 'finance' | 'support';

/**
 * Check if user has a specific role
 */
export async function hasRole(
  profileId: string,
  roleName: RoleName
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('user_roles')
    .select('id, roles!inner(name)')
    .eq('profile_id', profileId)
    .eq('roles.name', roleName)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .single();

  return !!data;
}

/**
 * Check if user is admin (super_admin role)
 */
export async function isAdmin(profileId: string): Promise<boolean> {
  return hasRole(profileId, 'super_admin');
}

/**
 * Check if user is organizer of a specific tournament
 */
export async function isOrganizerOfTournament(
  profileId: string,
  tournamentId: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('tournaments')
    .select('id')
    .eq('id', tournamentId)
    .eq('organizer_id', profileId)
    .single();

  return !!data;
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(profileId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('user_roles')
    .select('*, role:roles(*)')
    .eq('profile_id', profileId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) throw error;

  return data;
}

/**
 * Assign role to user
 */
export async function assignRole({
  profileId,
  roleName,
  scopeType = 'global',
  scopeId,
  grantedBy,
  expiresAt,
}: {
  profileId: string;
  roleName: RoleName;
  scopeType?: 'global' | 'tournament' | 'organization';
  scopeId?: string;
  grantedBy: string;
  expiresAt?: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get role ID
  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (!role) throw new Error(`Role ${roleName} not found`);

  // Insert user_role
  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      profile_id: profileId,
      role_id: role.id,
      scope_type: scopeType,
      scope_id: scopeId,
      granted_by: grantedBy,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Remove role from user
 */
export async function removeRole(userRoleId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('user_roles').delete().eq('id', userRoleId);

  if (error) throw error;

  return { success: true };
}

/**
 * Check multiple permissions at once
 */
export async function checkPermissions(
  profileId: string,
  requiredRoles: RoleName[]
): Promise<{ hasPermission: boolean; matchedRoles: RoleName[] }> {
  const roles = await getUserRoles(profileId);
  const userRoleNames = roles.map((r) => r.role.name) as RoleName[];
  const matchedRoles = requiredRoles.filter((r) => userRoleNames.includes(r));

  return {
    hasPermission: matchedRoles.length > 0,
    matchedRoles,
  };
}

