'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface RegistrationFormData {
  first_name: string;
  last_name: string;
  rating?: string;
  gender?: string;
  category?: string;
  partner_email?: string;
  partner_name?: string;
}

interface RegistrationFormProps {
  tournamentId: string;
  onSuccess?: () => void;
}

export function RegistrationForm({ tournamentId, onSuccess }: RegistrationFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegistrationFormData>({
    defaultValues: {
      category: 'singles',
    },
  });

  const category = watch('category');

  const registerForTournament = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get or create player profile
      let { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!player) {
        const { data: newPlayer, error: playerError } = await supabase
          .from('players')
          .insert({
            profile_id: user.id,
            first_name: data.first_name,
            last_name: data.last_name,
            rating: data.rating,
          })
          .select()
          .single();

        if (playerError) throw playerError;
        player = newPlayer;
      }

      // Prepare metadata
      const metadata: any = {
        category: data.category || 'singles',
        rating: data.rating || null,
        gender: data.gender || null,
      };

      // Add partner info for doubles/mixed
      if ((data.category === 'doubles' || data.category === 'mixed') && data.partner_email) {
        metadata.partner_email = data.partner_email;
        metadata.partner_display_name = data.partner_name;
      }

      // Create registration with metadata
      const { data: registration, error } = await supabase
        .from('registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: player?.id,
          status: 'pending',
          payment_status: 'pending',
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return registration;
    },
    onSuccess: () => {
      toast.success('Registration submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['registrations', tournamentId] });
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to register');
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    registerForTournament.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name *
          </label>
          <input
            {...register('first_name', { required: 'First name is required' })}
            type="text"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name *
          </label>
          <input
            {...register('last_name', { required: 'Last name is required' })}
            type="text"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="gender" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Gender *
          </label>
          <select
            {...register('gender', { required: 'Gender is required' })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="rating" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rating
          </label>
          <select
            {...register('rating')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select rating</option>
            <option value="<3.2">&lt;3.2</option>
            <option value="<3.6">&lt;3.6</option>
            <option value="<3.8">&lt;3.8</option>
            <option value="open">Open</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category *
        </label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          <option value="singles">Singles</option>
          <option value="doubles">Doubles</option>
          <option value="mixed">Mixed Doubles</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {category === 'singles' && 'Individual competition'}
          {category === 'doubles' && 'Team of 2 players (same gender)'}
          {category === 'mixed' && 'Team of 2 players (mixed gender)'}
        </p>
      </div>

      {/* Partner fields for doubles/mixed */}
      {(category === 'doubles' || category === 'mixed') && (
        <div className="rounded-lg border-2 border-primary-100 bg-primary-50 p-4 dark:border-primary-900 dark:bg-primary-950">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">Partner Information</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="partner_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Partner Name
              </label>
              <input
                {...register('partner_name')}
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="Partner's full name"
              />
            </div>
            <div>
              <label htmlFor="partner_email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Partner Email
              </label>
              <input
                {...register('partner_email')}
                type="email"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="partner@example.com"
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Your partner will receive an invitation to confirm
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={registerForTournament.isPending}
        className="w-full rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {registerForTournament.isPending ? 'Submitting...' : 'Register for Tournament'}
      </button>
    </form>
  );
}

