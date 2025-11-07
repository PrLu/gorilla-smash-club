'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card } from '@/components/ui';
import { useCategories } from '@/lib/hooks/useCategories';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users, Trophy } from 'lucide-react';
import { useState } from 'react';

interface TournamentFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  formats: string[];
  entry_fees: { [key: string]: number }; // Format-specific fees
  max_participants: number | null;
  status: 'draft' | 'open' | 'closed';
}

/**
 * Enhanced tournament creation form using design system components
 * Now supports multiple format selection
 */
export function TournamentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  // Get current system date dynamically (YYYY-MM-DD format)
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TournamentFormData>({
    defaultValues: {
      status: 'draft',
      entry_fees: { singles: 0, doubles: 0, mixed: 0 },
      start_date: getCurrentDate(),
      end_date: getCurrentDate(),
      formats: ['singles'],
    },
  });

  const selectedFormats = watch('formats') || [];
  const entryFees = watch('entry_fees') || {};

  const toggleFormat = (format: string) => {
    const current = selectedFormats;
    if (current.includes(format)) {
      setValue('formats', current.filter((f) => f !== format));
    } else {
      setValue('formats', [...current, format]);
    }
  };

  const updateEntryFee = (format: string, fee: number) => {
    setValue('entry_fees', {
      ...entryFees,
      [format]: fee,
    });
  };

  const createTournament = useMutation({
    mutationFn: async (data: TournamentFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Ensure at least one format selected
      if (!data.formats || data.formats.length === 0) {
        throw new Error('Please select at least one format');
      }

      // Validate formats against active categories from master data
      const { data: activeCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true);

      const validCategoryNames = activeCategories?.map(c => c.name) || ['singles', 'doubles', 'mixed'];
      const invalidFormats = data.formats.filter(f => !validCategoryNames.includes(f));

      if (invalidFormats.length > 0) {
        throw new Error(`Invalid categories: ${invalidFormats.join(', ')}. Please refresh the page and select from available categories.`);
      }

      // Calculate minimum entry fee (for backward compatibility)
      const minFee = Math.min(...Object.values(data.entry_fees).filter(Boolean));

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          title: data.title,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
          location: data.location,
          formats: data.formats,
          format: data.formats[0], // First format for backward compatibility
          entry_fee: minFee || 0, // Minimum fee for backward compatibility
          entry_fees: data.entry_fees, // Format-specific fees
          max_participants: data.max_participants,
          status: data.status,
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
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tournament Formats *
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Select one or more)</span>
        </label>
        <div className="space-y-2">
          {categoriesLoading ? (
            <div className="text-center py-4 text-gray-500">Loading categories...</div>
          ) : (categories || []).length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No categories available. Please contact administrator.
            </div>
          ) : (
            // Show all active categories from master data
            (categories || []).map((category) => (
              <label
                key={category.name}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedFormats.includes(category.name)}
                  onChange={() => toggleFormat(category.name)}
                  className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {category.display_name}
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
        {selectedFormats.length === 0 && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400">Please select at least one format</p>
        )}
      </div>

      {/* Entry Fees - One per Selected Format */}
      {selectedFormats.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Entry Fees (INR)
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              Set fee for each format
            </span>
          </label>
          <div className="space-y-3">
            {selectedFormats.map((format) => (
              <div key={format} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                  {format}:
                </span>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-2.5 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entryFees[format] || 0}
                    onChange={(e) => updateEntryFee(format, parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Different formats can have different entry fees
          </p>
        </div>
      )}

      <Input
        {...register('max_participants', { valueAsNumber: true })}
        label="Max Participants"
        type="number"
        min="2"
        placeholder="No limit"
        leftIcon={<Users className="h-5 w-5" />}
        helperText="Total participants across all formats"
      />

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
          disabled={selectedFormats.length === 0}
        >
          Create Tournament
        </Button>
      </div>
    </form>
  );
}
