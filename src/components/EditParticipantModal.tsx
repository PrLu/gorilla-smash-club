'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    id: string;
    display_name?: string;
    email: string;
    category?: string;
    rating?: string;
    gender?: string;
    partner_name?: string;
    partner_email?: string;
    status: string;
  };
  onSuccess: () => void;
}

/**
 * Modal to edit participant details (Admin/Root only)
 * Allows editing category, rating, gender, partner info
 */
export function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  onSuccess,
}: EditParticipantModalProps) {
  const [formData, setFormData] = useState({
    category: participant.category || 'singles',
    rating: participant.rating || '',
    gender: participant.gender || '',
    partner_name: participant.partner_name || '',
    partner_email: participant.partner_email || '',
    status: participant.status || 'pending',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (participant) {
      setFormData({
        category: participant.category || 'singles',
        rating: participant.rating || '',
        gender: participant.gender || '',
        partner_name: participant.partner_name || '',
        partner_email: participant.partner_email || '',
        status: participant.status || 'pending',
      });
    }
  }, [participant]);

  const isTeamCategory = formData.category === 'doubles' || formData.category === 'mixed';

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update registration metadata
      const metadata: any = {
        category: formData.category,
        rating: formData.rating || null,
        gender: formData.gender || null,
      };

      // Add partner info for team-based categories
      if (isTeamCategory) {
        metadata.partner_display_name = formData.partner_name || null;
        metadata.partner_email = formData.partner_email || null;
      }

      const { error } = await supabase
        .from('registrations')
        .update({
          metadata,
          status: formData.status,
        })
        .eq('id', participant.id);

      if (error) throw error;

      toast.success('Participant updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update participant');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Participant"
      size="md"
    >
      <div className="space-y-4">
        {/* Participant Name (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Participant
          </label>
          <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100">
            {participant.display_name || participant.email}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {participant.email}
          </p>
        </div>

        {/* Category */}
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'singles', label: 'Singles' },
            { value: 'doubles', label: 'Doubles' },
            { value: 'mixed', label: 'Mixed Doubles' },
          ]}
        />

        {/* Partner Fields (for doubles/mixed) */}
        {isTeamCategory && (
          <div className="space-y-3 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Partner Information
            </h4>
            
            <Input
              label="Partner Name"
              value={formData.partner_name}
              onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
              placeholder="Partner's full name"
            />
            
            <Input
              label="Partner Email"
              type="email"
              value={formData.partner_email}
              onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
              placeholder="partner@example.com"
              helperText="Used for communication and team pairing"
            />
          </div>
        )}

        {/* Rating */}
        <Select
          label="Rating"
          value={formData.rating}
          onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
          options={[
            { value: '', label: 'Not specified' },
            { value: '<3.2', label: '<3.2' },
            { value: '<3.6', label: '<3.6' },
            { value: '<3.8', label: '<3.8' },
            { value: 'open', label: 'Open' },
          ]}
        />

        {/* Gender */}
        <Select
          label="Gender"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          options={[
            { value: '', label: 'Not specified' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />

        {/* Status */}
        <Select
          label="Registration Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

