'use client';

import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserCog, Plus, Trash2, Shield } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';

interface Admin {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role?: string;
}

export default function AdminsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadAdmins();
    }
  }, [user]);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      // Query user_roles table joined with profiles to get only admins
      // Use user_roles_profile_id_fkey to specify which foreign key relationship to use
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          profile_id,
          role,
          created_at,
          profiles!user_roles_profile_id_fkey (
            id,
            email,
            full_name
          )
        `)
        .eq('role', 'admin')
        .eq('scope_type', 'global')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading admins:', error);
        
        // Check if it's a permission error
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          toast.error('You do not have permission to view admin roles. Please sign out and sign back in.');
        } else {
          toast.error(`Failed to load admins: ${error.message}`);
        }
      } else {
        // Transform the data to match our Admin interface
        const adminsList = (data || []).map((item: any) => ({
          id: item.profiles.id,
          email: item.profiles.email,
          full_name: item.profiles.full_name,
          created_at: item.created_at,
          role: item.role, // Include the role (root or admin)
        }));
        setAdmins(adminsList);
      }
    } catch (err) {
      console.error('Admins load exception:', err);
      toast.error('Failed to load admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAdding(true);
    try {
      // Find user by email
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', newAdminEmail.trim())
        .single();

      if (findError || !profile) {
        toast.error('User not found with this email');
        setAdding(false);
        return;
      }

      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingRole) {
        toast.error('User is already an admin');
        setAdding(false);
        return;
      }

      // First, remove any existing participant role (if they were a player before)
      await supabase
        .from('user_roles')
        .delete()
        .eq('profile_id', profile.id)
        .eq('role', 'participant');

      // Add admin role to user_roles table (exclusive - they're admin only, not participant)
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          profile_id: profile.id,
          role: 'admin',
          scope_type: 'global',
          granted_by: user!.id,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        
        // Check if it's a permission error
        if (insertError.code === '42501' || insertError.message?.includes('permission') || insertError.message?.includes('policy')) {
          toast.error('Only root users can assign admin roles. You need root access to perform this action.');
        } else {
          toast.error(`Failed to add admin: ${insertError.message}`);
        }
      } else {
        toast.success('Admin added successfully!');
        setNewAdminEmail('');
        setShowAddModal(false);
        loadAdmins();
      }
    } catch (err) {
      console.error('Add admin exception:', err);
      toast.error('Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${adminEmail}?\n\nThey will be converted to a regular player.`)) {
      return;
    }

    try {
      // Delete the admin role from user_roles table
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('profile_id', adminId)
        .eq('role', 'admin');

      if (deleteError) {
        console.error('Delete error:', deleteError);
        toast.error('Failed to remove admin');
        return;
      }

      // Assign participant role (convert to player)
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          profile_id: adminId,
          role: 'participant',
          scope_type: 'global',
          granted_by: user!.id,
        });

      if (insertError) {
        console.error('Insert participant error:', insertError);
        // Continue anyway - they just won't have any role
      }

      toast.success('Admin removed and converted to player');
      loadAdmins();
    } catch (err) {
      console.error('Remove admin exception:', err);
      toast.error('Failed to remove admin');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
              <UserCog className="h-8 w-8 text-primary-600" />
              Admin Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage system administrators and their permissions
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Admin
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          {loadingAdmins ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading admins...</span>
            </div>
          ) : admins.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No admins found</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get started by adding your first admin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Role
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Added On
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 text-sm text-gray-900 dark:text-white">
                        {admin.full_name || 'N/A'}
                      </td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        {admin.email}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          admin
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Admin Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setNewAdminEmail('');
          }}
          title="Add New Admin"
        >
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the email address of the user you want to promote to admin.
            </p>
            <Input
              type="email"
              label="Email Address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setNewAdminEmail('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={adding} className="flex-1">
                {adding ? 'Adding...' : 'Add Admin'}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}

