'use client';

import { useForm } from 'react-hook-form';
import { useInviteParticipant } from '@/lib/hooks/useInviteParticipant';
import { useCategories } from '@/lib/hooks/useCategories';
import { Button, Input, Select, Card } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Mail, UserPlus, Info, Search, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ManualParticipantFormData {
  email: string;
  display_name: string;
  category: 'singles' | 'doubles' | 'mixed';
  rating: '<3.2' | '<3.6' | '<3.8' | 'open';
  gender: 'male' | 'female';
  partner_email?: string;
  partner_display_name?: string;
  partner_rating?: '<3.2' | '<3.6' | '<3.8' | 'open';
  partner_gender?: 'male' | 'female';
  team_id?: string;
  role: 'player' | 'team_leader';
  sendInvite: boolean;
}

interface ManualParticipantFormProps {
  tournamentId: string;
  onSuccess?: () => void;
}

/**
 * Enhanced participant invitation form with email search
 * Searches for existing users and auto-fills their data
 * Requires Category, Rating, and Gender selection
 */
export function ManualParticipantForm({ tournamentId, onSuccess }: ManualParticipantFormProps) {
  const inviteParticipant = useInviteParticipant();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [searchingEmail, setSearchingEmail] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  
  // Partner search states
  const [searchingPartnerEmail, setSearchingPartnerEmail] = useState(false);
  const [partnerExists, setPartnerExists] = useState<boolean | null>(null);
  const [existingPartnerData, setExistingPartnerData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ManualParticipantFormData>({
    defaultValues: {
      category: 'singles',
      rating: 'open',
      gender: 'male',
      role: 'player',
      sendInvite: true,
    },
  });

  const email = watch('email');
  const category = watch('category');
  const partnerEmail = watch('partner_email');
  const sendInvite = watch('sendInvite');
  
  // Check if selected category is team-based
  const selectedCategory = categories?.find(cat => cat.name === category);
  const isDoublesOrMixed = selectedCategory?.is_team_based || false;

  // Search for existing user when email changes
  useEffect(() => {
    const searchEmail = async () => {
      if (!email || !email.includes('@')) {
        setUserExists(null);
        setExistingUserData(null);
        return;
      }

      setSearchingEmail(true);

      try {
        // Search for profile by email
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, player:players(*)')
          .ilike('email', email)
          .single();

        if (profile) {
          setUserExists(true);
          setExistingUserData(profile);

          // Auto-fill display name if found
          if (profile.full_name) {
            setValue('display_name', profile.full_name);
          }

          // Auto-fill from player data if available
          if (profile.player) {
            const player = Array.isArray(profile.player) ? profile.player[0] : profile.player;
            if (player) {
              const fullName = `${player.first_name} ${player.last_name}`.trim();
              if (fullName) {
                setValue('display_name', fullName);
              }
              if (player.rating) {
                // Map existing rating to our options
                setValue('rating', 'open'); // Default, could be smarter
              }
            }
          }

          toast.success(`Found existing user: ${profile.full_name || profile.email}`);
        } else {
          setUserExists(false);
          setExistingUserData(null);
        }
      } catch (error) {
        setUserExists(false);
        setExistingUserData(null);
      } finally {
        setSearchingEmail(false);
      }
    };

    // Debounce email search
    const timeoutId = setTimeout(searchEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email, setValue]);

  // Search for partner when partner email changes
  useEffect(() => {
    const searchPartnerEmail = async () => {
      if (!partnerEmail || !partnerEmail.includes('@') || !isDoublesOrMixed) {
        setPartnerExists(null);
        setExistingPartnerData(null);
        return;
      }

      setSearchingPartnerEmail(true);

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, player:players(*)')
          .ilike('email', partnerEmail)
          .single();

        if (profile) {
          setPartnerExists(true);
          setExistingPartnerData(profile);

          // Auto-fill partner display name
          if (profile.full_name) {
            setValue('partner_display_name', profile.full_name);
          }

          // Auto-fill partner data
          if (profile.player) {
            const player = Array.isArray(profile.player) ? profile.player[0] : profile.player;
            if (player) {
              const fullName = `${player.first_name} ${player.last_name}`.trim();
              if (fullName) setValue('partner_display_name', fullName);
              if (player.player_rating) setValue('partner_rating', player.player_rating as any);
              if (player.gender) setValue('partner_gender', player.gender as any);
            }
          }

          toast.success(`Found partner: ${profile.full_name || profile.email}`);
        } else {
          setPartnerExists(false);
          setExistingPartnerData(null);
        }
      } catch (error) {
        setPartnerExists(false);
        setExistingPartnerData(null);
      } finally {
        setSearchingPartnerEmail(false);
      }
    };

    const timeoutId = setTimeout(searchPartnerEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [partnerEmail, isDoublesOrMixed, setValue]);

  const onSubmit = async (data: ManualParticipantFormData) => {
    try {
      const result = await inviteParticipant.mutateAsync({
        tournamentId,
        ...data,
      });

      if (result.isPlaceholder && data.sendInvite) {
        toast.success(`✉️ Invitation sent to ${data.email}`);
      } else if (!result.isPlaceholder) {
        toast.success(`✓ ${data.email} added to tournament`);
      } else {
        toast.success('✓ Participant added');
      }

      reset();
      setUserExists(null);
      setExistingUserData(null);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite participant');
    }
  };

  return (
    <Card variant="bordered" padding="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Search */}
        <div>
          <Input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            label="Email Address"
            type="email"
            leftIcon={<Mail className="h-5 w-5" />}
            rightIcon={
              searchingEmail ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              ) : null
            }
            placeholder="player@example.com"
            error={errors.email?.message}
            helperText="Enter email to search for existing users"
            required
          />

          {/* User Exists Status */}
          {userExists === true && existingUserData && (
            <div className="mt-3 flex items-start gap-3 rounded-lg bg-success-50 border border-success-200 p-4">
              <UserCheck className="h-5 w-5 flex-shrink-0 text-success-600" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-success-800">User Found!</p>
                <p className="mt-1 text-success-700">
                  {existingUserData.full_name || existingUserData.email}
                </p>
                <p className="mt-1 text-xs text-success-600">
                  Data auto-filled. Review and submit to add to tournament.
                </p>
              </div>
            </div>
          )}

          {userExists === false && email && email.includes('@') && !searchingEmail && (
            <div className="mt-3 flex items-start gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
              <UserX className="h-5 w-5 flex-shrink-0 text-warning-600" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-warning-800">New User</p>
                <p className="mt-1 text-warning-700">
                  This email is not in the system. A new account invitation will be created.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Display Name */}
        <Input
          {...register('display_name', { required: 'Display name is required' })}
          label="Display Name"
          leftIcon={<UserPlus className="h-5 w-5" />}
          placeholder="Full name"
          error={errors.display_name?.message}
          required
        />

        {/* Category, Rating, Gender - All Required */}
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            {...register('category', { required: 'Category is required' })}
            label="Category"
            required
            options={
              categoriesLoading
                ? [{ value: '', label: 'Loading categories...' }]
                : (categories || []).map(cat => ({
                    value: cat.name,
                    label: cat.display_name,
                  }))
            }
            error={errors.category?.message}
            disabled={categoriesLoading}
          />

          <Select
            {...register('rating', { required: 'Rating is required' })}
            label="Rating"
            required
            options={[
              { value: '<3.2', label: 'Below 3.2' },
              { value: '<3.6', label: 'Below 3.6' },
              { value: '<3.8', label: 'Below 3.8' },
              { value: 'open', label: 'Open' },
            ]}
            error={errors.rating?.message}
          />

          <Select
            {...register('gender', { required: 'Gender is required' })}
            label="Gender"
            required
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            error={errors.gender?.message}
          />
        </div>

        {/* Partner Details - Only for Doubles/Mixed */}
        {isDoublesOrMixed && (
          <div className="space-y-4 rounded-lg border-2 border-primary-200 bg-primary-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-primary-900">
              <UsersIcon className="h-5 w-5" />
              Partner Details (Required for Doubles/Mixed)
            </h3>

            {/* Partner Email */}
            <Input
              {...register('partner_email', {
                required: isDoublesOrMixed ? 'Partner email is required for doubles/mixed' : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              label="Partner Email Address"
              type="email"
              leftIcon={<Mail className="h-5 w-5" />}
              rightIcon={
                searchingPartnerEmail ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                ) : null
              }
              placeholder="partner@example.com"
              error={errors.partner_email?.message}
              helperText="Search for your partner by email"
              required={isDoublesOrMixed}
            />

            {/* Partner Found/Not Found Status */}
            {partnerExists === true && existingPartnerData && (
              <div className="flex items-start gap-3 rounded-lg bg-success-50 border border-success-200 p-3">
                <UserCheck className="h-5 w-5 flex-shrink-0 text-success-600" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-success-800">Partner Found!</p>
                  <p className="mt-1 text-success-700">
                    {existingPartnerData.full_name || existingPartnerData.email}
                  </p>
                </div>
              </div>
            )}

            {partnerExists === false && partnerEmail && partnerEmail.includes('@') && !searchingPartnerEmail && (
              <div className="flex items-start gap-3 rounded-lg bg-warning-50 border border-warning-200 p-3">
                <UserX className="h-5 w-5 flex-shrink-0 text-warning-600" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-warning-800">New Partner</p>
                  <p className="mt-1 text-warning-700">
                    Partner will receive an invitation to join.
                  </p>
                </div>
              </div>
            )}

            {/* Partner Display Name */}
            <Input
              {...register('partner_display_name', {
                required: isDoublesOrMixed ? 'Partner name is required' : false,
              })}
              label="Partner Display Name"
              leftIcon={<UserPlus className="h-5 w-5" />}
              placeholder="Partner's full name"
              error={errors.partner_display_name?.message}
              required={isDoublesOrMixed}
            />

            {/* Partner Rating & Gender */}
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                {...register('partner_rating', {
                  required: isDoublesOrMixed ? 'Partner rating is required' : false,
                })}
                label="Partner Rating"
                required={isDoublesOrMixed}
                options={[
                  { value: '<3.2', label: 'Below 3.2' },
                  { value: '<3.6', label: 'Below 3.6' },
                  { value: '<3.8', label: 'Below 3.8' },
                  { value: 'open', label: 'Open' },
                ]}
                error={errors.partner_rating?.message}
              />

              <Select
                {...register('partner_gender', {
                  required: isDoublesOrMixed ? 'Partner gender is required' : false,
                })}
                label="Partner Gender"
                required={isDoublesOrMixed}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
                error={errors.partner_gender?.message}
              />
            </div>
          </div>
        )}

        {/* Role - Hidden, defaults to 'player' */}
        <input type="hidden" {...register('role')} value="player" />

        {/* Send Invite Toggle */}
        <div className="rounded-lg border border-gray-200 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              {...register('sendInvite')}
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <Mail className="h-4 w-4" />
                Send invitation email
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {userExists
                  ? 'Notify the user about being added to this tournament'
                  : 'Send a secure invitation link to create an account and join'}
              </p>
            </div>
          </label>
        </div>

        {/* Info Box - New User */}
        {!sendInvite && userExists === false && (
          <div className="flex gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
            <Info className="h-5 w-5 flex-shrink-0 text-warning-600" />
            <div className="text-sm text-warning-800">
              <p className="font-medium">No email will be sent</p>
              <p className="mt-1">
                A placeholder account will be created, but the user won&apos;t receive an invitation link.
              </p>
            </div>
          </div>
        )}

        {/* Required Fields Notice */}
        <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
          <p className="text-sm text-primary-800">
            <strong>Required:</strong> All fields marked with * must be filled before submission.
            Category, Rating, and Gender are mandatory for tournament registration.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={inviteParticipant.isPending || searchingEmail}
            leftIcon={<UserPlus className="h-5 w-5" />}
            className="flex-1"
            disabled={
              !email || 
              !watch('display_name') || 
              !watch('category') || 
              !watch('rating') || 
              !watch('gender') ||
              (isDoublesOrMixed && (!partnerEmail || !watch('partner_display_name') || !watch('partner_rating') || !watch('partner_gender')))
            }
          >
            {inviteParticipant.isPending
              ? 'Adding...'
              : userExists
              ? 'Add Existing User'
              : 'Create & Invite'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
