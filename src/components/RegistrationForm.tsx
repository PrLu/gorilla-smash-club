'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface RegistrationFormData {
  first_name: string;
  last_name: string;
  rating?: string;
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
  } = useForm<RegistrationFormData>();

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

      // Create registration
      const { data: registration, error } = await supabase
        .from('registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: player?.id,
          status: 'pending',
          payment_status: 'pending',
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
          <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            {...register('first_name', { required: 'First name is required' })}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            {...register('last_name', { required: 'Last name is required' })}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="rating" className="mb-1 block text-sm font-medium text-gray-700">
          Rating (optional)
        </label>
        <input
          {...register('rating')}
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., 4.0, 4.5, 5.0"
        />
      </div>

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

