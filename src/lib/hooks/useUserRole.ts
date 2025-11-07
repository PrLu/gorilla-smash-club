import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/lib/useUser';

/**
 * Hook to fetch current user's role from user_roles table
 * Returns the highest role (root > admin > participant)
 */
export function useUserRole() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('profile_id', user.id)
        .eq('scope_type', 'global')
        .order('role', { ascending: true }); // 'admin' < 'root' alphabetically

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      if (!userRoles || userRoles.length === 0) {
        return 'participant'; // Default role
      }

      // Return highest role (root > admin > participant)
      const roles = userRoles.map(r => r.role);
      if (roles.includes('root')) return 'root';
      if (roles.includes('admin')) return 'admin';
      return 'participant';
    },
    enabled: !!user, // Only run query if user exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Helper hook to check if user has admin or root role
 */
export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return {
    isAdmin: role === 'admin' || role === 'root',
    isRoot: role === 'root',
    role,
    isLoading,
  };
}


