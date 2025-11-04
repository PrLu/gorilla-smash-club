'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface TournamentFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  format: 'singles' | 'doubles' | 'mixed';
  entry_fee: number;
  max_participants: number | null;
  status: 'draft' | 'open' | 'closed';
}

export function TournamentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TournamentFormData>({
    defaultValues: {
      status: 'draft',
      entry_fee: 0,
      start_date: today,
      end_date: today,
    },
  });

  const createTournament = useMutation({
    mutationFn: async (data: TournamentFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          ...data,
          organizer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return tournament;
    },
    onSuccess: (tournament) => {
      toast.success('Tournament created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      router.push(`/tournament/${tournament.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tournament');
    },
  });

  const onSubmit = (data: TournamentFormData) => {
    createTournament.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
          Tournament Name *
        </label>
        <input
          {...register('title', { required: 'Title is required' })}
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="Summer Pickleball Championship"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="Tournament description..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            {...register('start_date', { required: 'Start date is required' })}
            type="date"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-gray-700">
            End Date *
          </label>
          <input
            {...register('end_date', { required: 'End date is required' })}
            type="date"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
          Location *
        </label>
        <input
          {...register('location', { required: 'Location is required' })}
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="City Sports Complex"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="format" className="mb-1 block text-sm font-medium text-gray-700">
            Format *
          </label>
          <select
            {...register('format', { required: true })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label htmlFor="entry_fee" className="mb-1 block text-sm font-medium text-gray-700">
            Entry Fee (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
            <input
              {...register('entry_fee', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="max_participants"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Max Participants
          </label>
          <input
            {...register('max_participants', { valueAsNumber: true })}
            type="number"
            min="2"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="No limit"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          {...register('status')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          <option value="draft">Draft</option>
          <option value="open">Open for Registration</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={createTournament.isPending}
          className="flex-1 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createTournament.isPending ? 'Creating...' : 'Create Tournament'}
        </button>
      </div>
    </form>
  );
}
