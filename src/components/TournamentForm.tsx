'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, Trophy, DollarSign } from 'lucide-react';

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

/**
 * Enhanced tournament creation form using design system components
 * Includes validation, loading states, and better UX
 */
export function TournamentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
      toast.success('🎉 Tournament created successfully!');
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
      <Input
        {...register('title', { required: 'Tournament name is required' })}
        label="Tournament Name"
        placeholder="Summer Pickleball Championship"
        error={errors.title?.message}
        leftIcon={<Trophy className="h-5 w-5" />}
        required
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Tell participants about your tournament..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          {...register('start_date', { required: 'Start date is required' })}
          label="Start Date"
          type="date"
          error={errors.start_date?.message}
          leftIcon={<Calendar className="h-5 w-5" />}
          required
        />

        <Input
          {...register('end_date', { required: 'End date is required' })}
          label="End Date"
          type="date"
          error={errors.end_date?.message}
          leftIcon={<Calendar className="h-5 w-5" />}
          required
        />
      </div>

      <Input
        {...register('location', { required: 'Location is required' })}
        label="Location"
        placeholder="City Sports Complex, Downtown"
        error={errors.location?.message}
        leftIcon={<MapPin className="h-5 w-5" />}
        required
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Select
          {...register('format', { required: true })}
          label="Format"
          required
          options={[
            { value: 'singles', label: 'Singles' },
            { value: 'doubles', label: 'Doubles' },
            { value: 'mixed', label: 'Mixed Doubles' },
          ]}
        />

        <div>
          <label htmlFor="entry_fee" className="mb-1 block text-sm font-medium text-gray-700">
            Entry Fee (INR)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2.5 text-gray-500">₹</span>
            <input
              {...register('entry_fee', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <Input
          {...register('max_participants', { valueAsNumber: true })}
          label="Max Participants"
          type="number"
          min="2"
          placeholder="No limit"
          leftIcon={<Users className="h-5 w-5" />}
        />
      </div>

      <Select
        {...register('status')}
        label="Initial Status"
        options={[
          { value: 'draft', label: 'Draft (not visible to others)' },
          { value: 'open', label: 'Open for Registration' },
          { value: 'closed', label: 'Closed' },
        ]}
      />

      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={createTournament.isPending}
          className="flex-1"
        >
          Create Tournament
        </Button>
      </div>
    </form>
  );
}
