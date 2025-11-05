'use client';

import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, Mail, Phone, Calendar, Plus, Edit, Trash2, User as UserIcon, Upload } from 'lucide-react';
import { Input, Button, Modal, Select } from '@/components/ui';
import { BulkImportModal } from '@/components/BulkImportModal';

interface Participant {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  dupr_id: string | null;
  created_at: string;
  created_by: string | null;
  roles: string[];
}

export default function ParticipantsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk Import Modal State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    dupr_id: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadUserRole();
      loadParticipants();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredParticipants(participants);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = participants.filter(
        (p) =>
          p.email.toLowerCase().includes(query) ||
          (p.full_name && p.full_name.toLowerCase().includes(query)) ||
          (p.phone && p.phone.includes(query)) ||
          (p.dupr_id && p.dupr_id.toLowerCase().includes(query))
      );
      setFilteredParticipants(filtered);
    }
  }, [searchQuery, participants]);

  const loadUserRole = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('profile_id', user.id)
        .in('role', ['root', 'admin'])
        .single();

      setUserRole(data?.role || null);
    } catch (err) {
      console.error('Error loading user role:', err);
    }
  };

  const loadParticipants = async () => {
    setLoadingParticipants(true);
    try {
      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, gender, dupr_id, created_at, created_by')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error loading players:', profilesError);
        toast.error('Failed to load players');
        setLoadingParticipants(false);
        return;
      }

      // Get all user roles (admin and root)
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('profile_id, role')
        .in('role', ['admin', 'root']);

      // Create a set of profile IDs that have admin or root roles
      const adminRootIds = new Set<string>();
      (rolesData || []).forEach((roleEntry: any) => {
        adminRootIds.add(roleEntry.profile_id);
      });

      // Filter out users with admin or root roles - only show participants
      const participantsList = (profilesData || [])
        .filter((profile) => !adminRootIds.has(profile.id))
        .map((profile) => ({
          ...profile,
          roles: ['participant'],
        }));

      setParticipants(participantsList);
      setFilteredParticipants(participantsList);
    } catch (err) {
      console.error('Players load exception:', err);
      toast.error('Failed to load players');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingParticipant(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: '',
      dupr_id: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (participant: Participant) => {
    setModalMode('edit');
    setEditingParticipant(participant);
    setFormData({
      full_name: participant.full_name || '',
      email: participant.email,
      phone: participant.phone || '',
      gender: participant.gender || '',
      dupr_id: participant.dupr_id || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingParticipant(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: '',
      dupr_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);

    try {
      if (modalMode === 'add') {
        await handleAddParticipant();
      } else {
        await handleUpdateParticipant();
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!user) return;

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please sign in again');
        return;
      }

      const response = await fetch('/api/participants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          gender: formData.gender || null,
          dupr_id: formData.dupr_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('already')) {
          toast.error('A user with this email already exists');
        } else {
          toast.error(`Failed to create player: ${data.error || 'Unknown error'}`);
        }
        return;
      }

      toast.success('Player added successfully!');
      handleCloseModal();
      loadParticipants();
    } catch (err) {
      console.error('Add participant exception:', err);
      toast.error('Failed to add player');
    }
  };

  const handleUpdateParticipant = async () => {
    if (!editingParticipant) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          gender: formData.gender || null,
          dupr_id: formData.dupr_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingParticipant.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update player');
        return;
      }

      toast.success('Player updated successfully!');
      handleCloseModal();
      loadParticipants();
    } catch (err) {
      console.error('Update participant exception:', err);
      toast.error('Failed to update participant');
    }
  };

  const handleDeleteParticipant = async (participant: Participant) => {
    if (userRole !== 'root') {
      toast.error('Only root users can delete players');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${participant.full_name || participant.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please sign in again');
        return;
      }

      const response = await fetch(`/api/participants/${participant.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to delete player: ${data.error || 'Unknown error'}`);
        return;
      }

      toast.success('Player deleted successfully!');
      loadParticipants();
    } catch (err) {
      console.error('Delete participant exception:', err);
      toast.error('Failed to delete player');
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
              <Users className="h-8 w-8 text-primary-600" />
              Players
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all registered players
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => setShowBulkImportModal(true)}
            >
              Bulk Import
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAddModal}
            >
              Add Player
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name, email, phone, or DUPR ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          {loadingParticipants ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading players...</span>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {searchQuery ? 'No players found' : 'No players yet'}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding your first player.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredParticipants.length} of {participants.length} players
              </div>
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
                        Phone
                      </th>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Gender
                      </th>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        DUPR ID
                      </th>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Joined
                      </th>
                      <th className="pb-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredParticipants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                          {participant.full_name || 'N/A'}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4" />
                            {participant.email}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {participant.phone ? (
                              <>
                                <Phone className="h-4 w-4" />
                                {participant.phone}
                              </>
                            ) : (
                              'N/A'
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {participant.gender ? (
                            <span className="capitalize">{participant.gender}</span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {participant.dupr_id || 'N/A'}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {new Date(participant.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Edit className="h-4 w-4" />}
                              onClick={() => handleOpenEditModal(participant)}
                            >
                              Edit
                            </Button>
                            {userRole === 'root' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Trash2 className="h-4 w-4 text-red-600" />}
                                onClick={() => handleDeleteParticipant(participant)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Bulk Import Modal */}
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={() => {
            loadParticipants();
            setShowBulkImportModal(false);
          }}
        />

        {/* Add/Edit Participant Modal */}
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={modalMode === 'add' ? 'Add New Player' : 'Edit Player'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              disabled={modalMode === 'edit'} // Email cannot be edited
              helperText={modalMode === 'edit' ? 'Email cannot be changed' : ''}
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />

            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={[
                { value: '', label: 'Select gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Input
              label="DUPR ID"
              type="text"
              value={formData.dupr_id}
              onChange={(e) => setFormData({ ...formData, dupr_id: e.target.value })}
              placeholder="Enter DUPR ID"
              helperText="Dynamic Universal Pickleball Rating ID"
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : modalMode === 'add' ? 'Add Player' : 'Update Player'}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
