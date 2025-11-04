'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTournament } from '@/lib/hooks/useTournament';
import { useUpdateTournament } from '@/lib/hooks/useUpdateTournament';
import { Button, Input, Select, Card, Skeleton } from '@/components/ui';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, MapPin, Users, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface EditTournamentFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  formats: string[];
  entry_fee: number;
  max_participants: number | null;
  status: string;
}

/**
 * Edit Tournament Page
 * Allows organizers to update tournament details
 */
export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;

  const { data: tournament, isLoading } = useTournament(tournamentId);
  const updateTournament = useUpdateTournament();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditTournamentFormData>();

  const selectedFormats = watch('formats') || [];

  // Load tournament data into form
  useEffect(() => {
    if (tournament) {
      reset({
        title: tournament.title,
        description: tournament.description || '',
        start_date: tournament.start_date.split('T')[0],
        end_date: tournament.end_date.split('T')[0],
        location: tournament.location,
        formats: tournament.formats || [tournament.format],
        entry_fee: tournament.entry_fee,
        max_participants: tournament.max_participants,
        status: tournament.status,
      });
    }
  }, [tournament, reset]);

  const toggleFormat = (format: string) => {
    const current = selectedFormats;
    if (current.includes(format)) {
      setValue('formats', current.filter((f) => f !== format));
    } else {
      setValue('formats', [...current, format]);
    }
  };

  const onSubmit = async (data: EditTournamentFormData) => {
    try {
      await updateTournament.mutateAsync({
        tournamentId,
        ...data,
      });

      toast.success('Tournament updated successfully!');
      router.push(`/tournament/${tournamentId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tournament');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton height={600} />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-12 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Tournament Not Found</h1>
          <Link href="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href={`/tournament/${tournamentId}`}>
            <Button variant="ghost" leftIcon={<ArrowLeft className="h-5 w-5" />}>
              Back
            </Button>
          </Link>

          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Edit Tournament</h1>
            <p className="mt-1 text-gray-700">{tournament.title}</p>
          </div>
        </div>

        {/* Edit Form */}
        <Card padding="lg">
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

            {/* Multiple Format Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tournament Formats *
                <span className="ml-2 text-xs text-gray-500">(Select one or more)</span>
              </label>
              <div className="space-y-2">
                {['singles', 'doubles', 'mixed'].map((format) => (
                  <label
                    key={format}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(format)}
                      onChange={() => toggleFormat(format)}
                      className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium capitalize text-gray-900">
                        {format} {format === 'mixed' && 'Doubles'}
                      </div>
                      <p className="text-sm text-gray-600">
                        {format === 'singles' && 'Individual players compete'}
                        {format === 'doubles' && 'Teams of 2 players (same gender)'}
                        {format === 'mixed' && 'Teams of 2 players (mixed gender)'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedFormats.length === 0 && (
                <p className="mt-1 text-sm text-error-600">Please select at least one format</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                    className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              label="Tournament Status"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'open', label: 'Open for Registration' },
                { value: 'closed', label: 'Registration Closed' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={updateTournament.isPending}
                leftIcon={<Save className="h-5 w-5" />}
                className="flex-1"
                disabled={selectedFormats.length === 0}
              >
                {updateTournament.isPending ? 'Saving...' : 'Save Changes'}
              </Button>

              <Link href={`/tournament/${tournamentId}`}>
                <Button variant="ghost" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

