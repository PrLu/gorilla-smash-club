'use client';

import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { Zap, Edit, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FixtureGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onSystemGenerate: (options: SystemGenerateOptions) => void;
  onManualMode: () => void;
}

export interface SystemGenerateOptions {
  fixtureType: 'single_elim' | 'double_elim' | 'pool_knockout';
  category?: string;
  poolOptions?: {
    numberOfPools: number;
    playersPerPool: number;
    advancePerPool: number;
  };
  seedingType: 'random' | 'registered' | 'manual';
  replaceExisting: boolean;
  autoAdvanceByes: boolean;
}

export function FixtureGenerationModal({
  isOpen,
  onClose,
  tournamentId,
  onSystemGenerate,
  onManualMode,
}: FixtureGenerationModalProps) {
  const [mode, setMode] = useState<'select' | 'system' | 'manual'>('select');
  
  // System generator form state
  const [fixtureType, setFixtureType] = useState<'single_elim' | 'double_elim' | 'pool_knockout'>('single_elim');
  const [numberOfPools, setNumberOfPools] = useState(2);
  const [playersPerPool, setPlayersPerPool] = useState(4);
  const [advancePerPool, setAdvancePerPool] = useState(2);
  const [seedingType, setSeedingType] = useState<'random' | 'registered' | 'manual'>('registered');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [autoAdvanceByes, setAutoAdvanceByes] = useState(true);

  const handleSystemGenerate = () => {
    const options: SystemGenerateOptions = {
      fixtureType,
      poolOptions: fixtureType === 'pool_knockout' ? {
        numberOfPools,
        playersPerPool,
        advancePerPool,
      } : undefined,
      seedingType,
      replaceExisting,
      autoAdvanceByes,
    };
    onSystemGenerate(options);
  };

  const handleReset = () => {
    setMode('select');
    setFixtureType('single_elim');
    setNumberOfPools(2);
    setPlayersPerPool(4);
    setAdvancePerPool(2);
    setSeedingType('registered');
    setReplaceExisting(false);
    setAutoAdvanceByes(true);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        handleReset();
        onClose();
      }} 
      title="Generate Fixtures" 
      size="lg"
    >
      <div className="space-y-6">
        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Choose how you want to create fixtures for this tournament:
            </p>

            {/* System Generator Option */}
            <button
              onClick={() => setMode('system')}
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 p-6 text-left transition-all hover:border-primary-400 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:hover:border-primary-600"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary-600 p-3 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    System Generator (Automatic)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Let the system automatically create fixtures based on your tournament format.
                    Supports single elimination, double elimination, and pool-based tournaments.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-800 dark:text-primary-300">
                      Fast Setup
                    </span>
                    <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-800 dark:text-primary-300">
                      Pool Support
                    </span>
                    <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-800 dark:text-primary-300">
                      Auto Seeding
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Manual Generator Option */}
            <button
              onClick={() => {
                onManualMode();
                handleReset();
                onClose();
              }}
              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-left transition-all hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-gray-600 p-3 text-white dark:bg-gray-700">
                  <Edit className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Manual Generator (Drag & Drop)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Customize your fixtures with full control. Create pools, assign players via
                    drag-and-drop, and design your own bracket structure.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Full Control
                    </span>
                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Drag & Drop
                    </span>
                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Custom Pools
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* System Generator Form */}
        {mode === 'system' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Fixture Type */}
            <Select
              label="Fixture Type"
              value={fixtureType}
              onChange={(e) => setFixtureType(e.target.value as any)}
              options={[
                { value: 'single_elim', label: 'Single Elimination' },
                { value: 'double_elim', label: 'Double Elimination' },
                { value: 'pool_knockout', label: 'Pool + Knockout' },
              ]}
              helperText="Tournament format structure"
            />

            {/* Pool Options (only show for pool_knockout) */}
            <AnimatePresence>
              {fixtureType === 'pool_knockout' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
                >
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300">Pool Settings</h4>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      label="Number of Pools"
                      type="number"
                      min={2}
                      max={16}
                      value={numberOfPools}
                      onChange={(e) => setNumberOfPools(parseInt(e.target.value) || 2)}
                    />
                    
                    <Input
                      label="Players per Pool"
                      type="number"
                      min={2}
                      max={32}
                      value={playersPerPool}
                      onChange={(e) => setPlayersPerPool(parseInt(e.target.value) || 4)}
                      helperText="Target size"
                    />
                    
                    <Input
                      label="Advance per Pool"
                      type="number"
                      min={1}
                      max={playersPerPool - 1}
                      value={advancePerPool}
                      onChange={(e) => setAdvancePerPool(parseInt(e.target.value) || 2)}
                      helperText="To knockout"
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                    <Info className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      System will distribute participants evenly across pools and generate round-robin matches within each pool.
                      Top {advancePerPool} from each pool will advance to knockout rounds.
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
                { value: 'random', label: 'Random' },
                { value: 'manual', label: 'Manual (Coming Soon)' },
              ]}
              helperText="How to order participants in the bracket"
            />

            {/* Options Checkboxes */}
            <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Replace Existing Fixtures</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Delete all current matches and generate new ones
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoAdvanceByes}
                  onChange={(e) => setAutoAdvanceByes(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Auto Advance Byes</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically advance players with no opponent
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setMode('select')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSystemGenerate}
                className="flex-1"
              >
                Generate Fixtures
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}

