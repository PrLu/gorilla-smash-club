'use client';

import { useState } from 'react';
import { Button, Modal, Select } from '@/components/ui';
import { useGenerateFixtures } from '@/lib/hooks/useGenerateFixtures';
import { Trophy, Shuffle, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface GenerateFixturesButtonProps {
  tournamentId: string;
  hasExistingMatches?: boolean;
  disabled?: boolean;
}

/**
 * Generate Fixtures Button Component
 * Admin/Organizer tool to create tournament fixtures
 * Includes confirmation modal with options
 */
export function GenerateFixturesButton({
  tournamentId,
  hasExistingMatches = false,
  disabled = false,
}: GenerateFixturesButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seedOrder, setSeedOrder] = useState<'registered' | 'random'>('registered');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [autoAdvanceByes, setAutoAdvanceByes] = useState(true);

  const generateFixtures = useGenerateFixtures();

  const handleGenerate = async () => {
    try {
      const result = await generateFixtures.mutateAsync({
        tournamentId,
        fixtureType: 'single_elim',
        replaceExisting,
        autoAdvanceByes,
        seedOrder,
      });

      toast.success(
        <div>
          <p className="font-semibold">✨ Fixtures Generated!</p>
          <p className="text-sm">
            {result.matchesCreated} matches created
            {result.autoAdvancedCount > 0 && ` • ${result.autoAdvancedCount} auto-advanced`}
          </p>
        </div>
      );

      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate fixtures');
    }
  };

  return (
    <>
          <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        leftIcon={<Trophy className="h-5 w-5" />}
      >
        Generate Fixtures
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Tournament Fixtures"
        size="md"
      >
        <div className="space-y-6">
          {/* Warning if matches exist */}
          {hasExistingMatches && (
            <div className="flex gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-600" />
              <div className="text-sm">
                <p className="font-semibold text-warning-800">Fixtures Already Exist</p>
                <p className="mt-1 text-warning-700">
                  Enable &quot;Replace Existing&quot; below to regenerate. This will delete all current
                  matches and scores.
                </p>
              </div>
            </div>
          )}

          {/* Fixture Type (currently only single_elim) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fixture Type
            </label>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success-600" />
                <span className="font-medium text-gray-900">Single Elimination</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Winners advance, losers are eliminated
              </p>
            </div>
          </div>

          {/* Seed Order */}
          <Select
            label="Seeding Order"
            value={seedOrder}
            onChange={(e) => setSeedOrder(e.target.value as 'registered' | 'random')}
            options={[
              { value: 'registered', label: 'Registration Order (Default)' },
              { value: 'random', label: 'Random Draw' },
            ]}
            helperText="How to order participants in the bracket"
          />

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdvanceByes}
                onChange={(e) => setAutoAdvanceByes(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Auto-advance Byes</div>
                <div className="text-gray-600">
                  Automatically advance players who receive byes to the next round
                </div>
              </div>
            </label>

            {hasExistingMatches && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-error-600 focus:ring-error-500"
                />
                <div className="text-sm">
                  <div className="font-medium text-error-900">Replace Existing Fixtures</div>
                  <div className="text-error-700">
                    ⚠️ Delete current matches and regenerate (cannot be undone)
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
            <p className="text-sm text-primary-800">
              <strong>What happens next:</strong>
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-primary-700">
              <li>Confirmed participants will be placed in the bracket</li>
              <li>If participant count is not a power of 2, byes will be added</li>
              <li>Matches will be created for all rounds up to the final</li>
              <li>Tournament status will change to &quot;In Progress&quot;</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleGenerate}
              isLoading={generateFixtures.isPending}
              leftIcon={<Trophy className="h-5 w-5" />}
              className="flex-1"
            >
              {generateFixtures.isPending ? 'Generating...' : 'Generate Fixtures'}
            </Button>

            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={generateFixtures.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

