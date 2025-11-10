'use client';

import { useState } from 'react';
import { Modal, Button, Select, Input } from '@/components/ui';
import { AlertTriangle, CheckCircle, XCircle, Trophy, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CategoryInfo {
  category: string;
  displayName: string;
  participantCount: number;
  eligible: boolean;
  reason?: string;
  isTeamBased: boolean;
}

export interface AutoGenerateOptions {
  fixtureType: 'single_elim' | 'pool_knockout';
  seedingType: 'random' | 'registered';
  poolOptions?: {
    numberOfPools: number;
    playersPerPool: number;
    advancePerPool: number;
  };
  autoAdvanceByes: boolean;
  replaceExisting: boolean;
}

interface AutoGenerateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  summary: {
    total: number;
    eligible: number;
    skipped: number;
    totalParticipants: number;
  };
  onConfirm: (options: AutoGenerateOptions) => void;
  isLoading?: boolean;
}

/**
 * Confirmation Modal for Automatic Multi-Category Fixture Generation
 * Shows category summary before generation
 */
export function AutoGenerateConfirmationModal({
  isOpen,
  onClose,
  categories,
  summary,
  onConfirm,
  isLoading = false,
}: AutoGenerateConfirmationModalProps) {
  const eligibleCategories = categories.filter(c => c.eligible);
  const skippedCategories = categories.filter(c => !c.eligible);

  // Configuration state
  const [fixtureType, setFixtureType] = useState<'single_elim' | 'pool_knockout'>('pool_knockout');
  const [seedingType, setSeedingType] = useState<'random' | 'registered'>('registered');
  const [advancePerPool, setAdvancePerPool] = useState(2);
  const [autoAdvanceByes, setAutoAdvanceByes] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(true);
  
  // Pool count is now automatic - these are just for passing to backend
  // Backend will calculate optimal pools per category
  const numberOfPools = 4; // Placeholder - backend calculates actual value
  const playersPerPool = 4; // Placeholder - backend calculates actual value

  const handleConfirm = () => {
    const options: AutoGenerateOptions = {
      fixtureType,
      seedingType,
      poolOptions: fixtureType === 'pool_knockout' ? {
        numberOfPools,
        playersPerPool,
        advancePerPool,
      } : undefined,
      autoAdvanceByes,
      replaceExisting,
    };
    onConfirm(options);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧮 Automatic Fixture Generation"
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Fixture Configuration Options */}
        <div className="space-y-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Fixture Configuration
          </h3>

          {/* Fixture Type */}
          <Select
            label="Fixture Type"
            value={fixtureType}
            onChange={(e) => setFixtureType(e.target.value as any)}
            options={[
              { value: 'single_elim', label: 'Single Elimination (Knockout)' },
              { value: 'pool_knockout', label: 'Pool + Knockout' },
            ]}
          />

          {/* Pool Options (only show for pool_knockout) */}
          <AnimatePresence>
            {fixtureType === 'pool_knockout' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4"
              >
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Smart Pool Configuration
                </h4>
                
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-900 dark:text-green-300 mb-2">
                    <strong>🧠 Intelligent Sizing:</strong> The system automatically determines the optimal number of pools for each category based on participant count.
                  </p>
                  <ul className="text-xs text-green-800 dark:text-green-400 space-y-1 ml-4">
                    <li>• Small (≤6 participants) → 1 pool</li>
                    <li>• Medium (7-12) → 2-3 pools</li>
                    <li>• Large (13+) → 3-6 pools</li>
                    <li>• Pool sizes: 3-6 players (ideal: 4)</li>
                  </ul>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-1">
                  <Input
                    label="Advance Per Pool (Top Players)"
                    type="number"
                    min={1}
                    max={5}
                    value={advancePerPool}
                    onChange={(e) => setAdvancePerPool(parseInt(e.target.value) || 2)}
                    helperText="How many players qualify from each pool to knockout stage"
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2 border border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    <strong>Pool stage:</strong> Round-robin within pools. Top {advancePerPool} from each pool advance to knockout brackets. Pool count is automatically optimized per category.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seeding Type */}
          <Select
            label="Seeding Strategy"
            value={seedingType}
            onChange={(e) => setSeedingType(e.target.value as any)}
            options={[
              { value: 'registered', label: 'Registration Order (First-come)' },
              { value: 'random', label: 'Random Draw' },
            ]}
          />

          {/* Options Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdvanceByes}
                onChange={(e) => setAutoAdvanceByes(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">Auto Advance Byes</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  (Automatically advance players with no opponent)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">Replace Existing Fixtures</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  (Delete current matches and regenerate)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.total}
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-300 font-medium">
              Categories Found
            </div>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.eligible}
            </div>
            <div className="text-xs text-green-800 dark:text-green-300 font-medium">
              Will Generate
            </div>
          </div>
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.skipped}
            </div>
            <div className="text-xs text-orange-800 dark:text-orange-300 font-medium">
              Will Skip
            </div>
          </div>
        </div>

        {/* Eligible Categories */}
        {eligibleCategories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              Categories to Generate ({eligibleCategories.length})
            </h3>
            <div className="space-y-2">
              {eligibleCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {cat.displayName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {cat.isTeamBased ? 'Teams' : 'Players'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      {cat.participantCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {cat.isTeamBased ? 'teams' : 'players'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skipped Categories */}
        {skippedCategories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Categories to Skip ({skippedCategories.length})
            </h3>
            <div className="space-y-2">
              {skippedCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-3"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {cat.displayName}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">
                        {cat.reason}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600 dark:text-orange-400">
                      {cat.participantCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {cat.isTeamBased ? 'teams' : 'players'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning if no eligible categories */}
        {eligibleCategories.length === 0 && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">
                  Cannot Generate Fixtures
                </p>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                  No categories have enough participants (minimum 2 required per category).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>What will happen:</strong> The system will automatically generate fixtures for all eligible categories using your selected format{' '}
            {fixtureType === 'pool_knockout' 
              ? `(Pool Stage → Knockout). The system will intelligently determine the optimal number of pools for each category based on participant count. Participants will play round-robin in their pools, then top ${advancePerPool} from each pool advance to knockout brackets.`
              : '(Single Elimination knockout brackets).'
            }
            {' '}Each category will have its own optimized structure.
          </p>
        </div>
        
        {fixtureType === 'pool_knockout' && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
            <p className="text-xs text-green-800 dark:text-green-200">
              <strong>💡 Smart Pool Sizing:</strong> The system automatically calculates optimal pools per category:
              <br />• Small categories (≤6): 1 pool
              <br />• Medium categories (7-12): 2-3 pools  
              <br />• Large categories (13+): 3-6 pools
              <br />Pool sizes aim for 3-6 players each for best gameplay balance.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className="flex-1"
            disabled={eligibleCategories.length === 0 || isLoading}
            isLoading={isLoading}
          >
            Generate Fixtures for {eligibleCategories.length} {eligibleCategories.length === 1 ? 'Category' : 'Categories'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


