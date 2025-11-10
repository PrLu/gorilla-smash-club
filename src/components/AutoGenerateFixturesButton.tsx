'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Sparkles, Zap } from 'lucide-react';
import { AutoGenerateConfirmationModal } from './AutoGenerateConfirmationModal';
import { FixtureGenerationProgress } from './FixtureGenerationProgress';
import { FixtureGenerationSummary } from './FixtureGenerationSummary';
import { useDetectCategories } from '@/lib/hooks/useDetectCategories';
import { useGenerateFixtures } from '@/lib/hooks/useGenerateFixtures';
import toast from 'react-hot-toast';

interface AutoGenerateFixturesButtonProps {
  tournamentId: string;
  onSuccess?: () => void;
}

interface CategoryProgress {
  category: string;
  displayName: string;
  status: 'pending' | 'processing' | 'completed' | 'skipped' | 'error';
  matchesCreated?: number;
  byes?: number;
  error?: string;
}

/**
 * Automatic Multi-Category Fixture Generation Component
 * Handles the complete flow: detection → confirmation → generation → summary
 */
export function AutoGenerateFixturesButton({
  tournamentId,
  onSuccess,
}: AutoGenerateFixturesButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(true); // Start with confirmation
  const [showProgress, setShowProgress] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [generationResult, setGenerationResult] = useState<any>(null);

  const { data: detectionData, isLoading: isDetecting, refetch } = useDetectCategories(tournamentId);
  const generateFixtures = useGenerateFixtures();

  const handleStartAutoGeneration = () => {
    refetch(); // Refresh category detection
    setShowConfirmation(true);
  };

  const handleConfirmGeneration = async (options: any) => {
    if (!detectionData) return;

    // Close confirmation, show progress
    setShowConfirmation(false);
    setShowProgress(true);

    // Initialize progress tracking
    const eligible = detectionData.categories.filter(c => c.eligible);
    const initialProgress: CategoryProgress[] = eligible.map(cat => ({
      category: cat.category,
      displayName: cat.displayName,
      status: 'pending',
    }));
    setCategoryProgress(initialProgress);

    try {
      // Simulate per-category processing with status updates
      // Mark first category as processing
      if (eligible.length > 0) {
        setCategoryProgress(prev => prev.map((cat, idx) => 
          idx === 0 ? { ...cat, status: 'processing' } : cat
        ));
      }

      console.log('Calling generateFixtures with options:', options);
      
      const result = await generateFixtures.mutateAsync({
        tournamentId,
        fixtureType: options.fixtureType,
        seedOrder: options.seedingType,
        replaceExisting: options.replaceExisting,
        autoAdvanceByes: options.autoAdvanceByes,
        poolOptions: options.poolOptions,
        // Pass all options as well
        options: {
          fixtureType: options.fixtureType,
          seedOrder: options.seedingType,
          replaceExisting: options.replaceExisting,
          autoAdvanceByes: options.autoAdvanceByes,
          poolOptions: options.poolOptions,
        },
      });

      // Update all categories to completed
      const completedProgress: CategoryProgress[] = Object.entries(result.divisionBreakdown || {}).map(
        ([key, division]: [string, any]) => ({
          category: division.division,
          displayName: division.division.charAt(0).toUpperCase() + division.division.slice(1),
          status: 'completed',
          matchesCreated: division.matches,
          byes: division.autoAdvanced,
        })
      );
      
      setCategoryProgress(completedProgress);
      setGenerationResult(result);

      // Show summary after a brief delay
      setTimeout(() => {
        setShowProgress(false);
        setShowSummary(true);
      }, 1000);

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate fixtures');
      setShowProgress(false);
      
      // Mark all as error
      setCategoryProgress(prev =>
        prev.map(cat => ({
          ...cat,
          status: 'error',
          error: error.message,
        }))
      );
    }
  };

  const handleDownloadSummary = () => {
    if (!generationResult) return;

    const csvContent = [
      ['Category', 'Participants', 'Matches Created', 'Byes', 'Status'].join(','),
      ...Object.entries(generationResult.divisionBreakdown || {}).map(
        ([key, division]: [string, any]) =>
          [
            division.division,
            division.participants,
            division.matches,
            division.autoAdvanced || 0,
            'Success',
          ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixtures-summary-${tournamentId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Summary downloaded!');
  };

  const handleViewFixtures = () => {
    setShowSummary(false);
    window.location.reload(); // Refresh to show new fixtures
  };

  return (
    <>
      {/* Confirmation Modal */}
      {detectionData && (
        <AutoGenerateConfirmationModal
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            onSuccess?.(); // Close parent flow
          }}
          categories={detectionData.categories}
          summary={detectionData.summary}
          onConfirm={handleConfirmGeneration}
          isLoading={generateFixtures.isPending}
        />
      )}

      {/* Progress Modal */}
      <FixtureGenerationProgress
        isOpen={showProgress}
        categories={categoryProgress}
        currentCategory={categoryProgress.find(c => c.status === 'processing')?.category}
        onClose={() => {
          setShowProgress(false);
          setShowSummary(true);
        }}
      />

      {/* Summary Modal */}
      {generationResult && (
        <FixtureGenerationSummary
          isOpen={showSummary}
          onClose={() => {
            setShowSummary(false);
            onSuccess?.();
          }}
          totalMatches={generationResult.matchesCreated || 0}
          totalAutoAdvanced={generationResult.autoAdvancedCount || 0}
          divisionsCreated={generationResult.divisionsCreated || 0}
          divisionBreakdown={generationResult.divisionBreakdown || {}}
          categories={generationResult.categories || []}
          onViewFixtures={handleViewFixtures}
          onDownloadSummary={handleDownloadSummary}
        />
      )}
    </>
  );
}

