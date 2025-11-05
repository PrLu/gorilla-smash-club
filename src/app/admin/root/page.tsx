'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

export default function RootDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  // Check if current user is root
  const { data: isRoot, isLoading: checkingRoot } = useQuery({
    queryKey: ['is-root'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('user_roles')
        .select('*')
        .eq('profile_id', user.id)
        .eq('role', 'root')
        .eq('scope_type', 'global')
        .single();

      return !!data;
    },
  });

  // Fetch all admins
  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          role,
          scope_type,
          scope_id,
          granted_at,
          profiles (
            id,
            email,
            full_name,
            is_placeholder
          )
        `)
        .eq('role', 'admin')
        .order('granted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (adminEmail: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', adminEmail)
        .maybeSingle();

      let profileId = existingProfile?.id;

      // Create placeholder profile if doesn't exist
      if (!profileId) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            email: adminEmail,
            full_name: adminEmail.split('@')[0],
            is_placeholder: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        profileId = newProfile.id;
      }

      // Assign admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert({
          profile_id: profileId,
          role: 'admin',
          scope_type: 'global',
          granted_by: user.id,
          metadata: { created_via: 'root_dashboard' },
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Log audit
      await supabase.from('audit_logs').insert({
        actor_profile_id: user.id,
        action: 'ASSIGN_ROLE',
        target_table: 'user_roles',
        target_id: roleData.id,
        new_data: roleData,
        metadata: { role: 'admin', target_email: adminEmail },
      });

      return roleData;
    },
    onSuccess: () => {
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setShowCreateModal(false);
      setEmail('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create admin');
    },
  });

  // Revoke admin mutation
  const revokeAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Admin role revoked');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke admin');
    },
  });

  const handleCreateAdmin = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    createAdminMutation.mutate(email);
  };

  const handleRevokeAdmin = (roleId: string, adminEmail: string) => {
    if (confirm(`Are you sure you want to revoke admin access for ${adminEmail}?`)) {
      revokeAdminMutation.mutate(roleId);
    }
  };

  if (checkingRoot) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isRoot) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have Root permissions.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Root Dashboard</h1>
        <p className="text-gray-600">Manage platform administrators</p>
      </div>

      {/* Create Admin Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Create Admin
        </button>
      </div>

      {/* Admins List */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Platform Administrators</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <span className="ml-3">Loading admins...</span>
          </div>
        ) : admins && admins.length > 0 ? (
          <div className="space-y-4">
            {admins.map((admin: any) => (
              <div
                key={admin.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {admin.profiles?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {admin.profiles?.full_name || 'No name'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Scope: {admin.scope_type}
                    {admin.scope_id && ` (${admin.scope_id})`}
                  </p>
                  <p className="text-xs text-gray-400">
                    Granted: {new Date(admin.granted_at).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={() => handleRevokeAdmin(admin.id, admin.profiles?.email)}
                  disabled={revokeAdminMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No admins found</p>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Create New Admin</h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Send invitation email</span>
              </label>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEmail('');
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAdmin}
                  disabled={createAdminMutation.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

