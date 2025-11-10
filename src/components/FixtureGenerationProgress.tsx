'use client';

import { Modal, Button } from '@/components/ui';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface CategoryProgress {
  category: string;
  displayName: string;
  status: 'pending' | 'processing' | 'completed' | 'skipped' | 'error';
  matchesCreated?: number;
  byes?: number;
  error?: string;
}

interface FixtureGenerationProgressProps {
  isOpen: boolean;
  categories: CategoryProgress[];
  currentCategory?: string;
  onClose?: () => void;
}

/**
 * Progress Modal for Multi-Category Fixture Generation
 * Shows real-time progress as fixtures are generated for each category
 */
export function FixtureGenerationProgress({
  isOpen,
  categories,
  currentCategory,
  onClose,
}: FixtureGenerationProgressProps) {
  const completedCount = categories.filter(c => c.status === 'completed').length;
  const processingCount = categories.filter(c => c.status === 'processing').length;
  const totalCount = categories.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Generating Fixtures..."
      size="md"
      showCloseButton={false}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Animated Progress Circle */}
        <div className="flex items-center justify-center py-6">
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-pulse"></div>
            
            {/* Animated spinner (while not complete) */}
            {!isComplete && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
            )}
            
            {/* Progress circle */}
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-4 border-blue-300 dark:border-blue-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {progressPercentage}%
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  {completedCount}/{totalCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {isComplete ? '✅ Complete' : processingCount > 0 ? '⚡ Processing...' : '⏳ Starting...'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {completedCount} / {totalCount} categories
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                isComplete 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-gradient'
              }`}
              style={{ 
                width: `${progressPercentage}%`,
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          {!isComplete && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 animate-pulse">
              Generating fixtures for all categories...
            </p>
          )}
        </div>

        {/* Category List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className={`flex items-center justify-between rounded-lg p-3 border transition-all duration-300 ${
                cat.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 scale-[0.98]'
                  : cat.status === 'processing'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400 shadow-lg scale-105 animate-pulse'
                  : cat.status === 'skipped'
                  ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                  : cat.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shake'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {cat.status === 'completed' && (
                  <div className="relative">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 animate-bounce" />
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50"></div>
                  </div>
                )}
                {cat.status === 'processing' && (
                  <div className="relative">
                    <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
                  </div>
                )}
                {cat.status === 'skipped' && (
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                )}
                {cat.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 animate-pulse" />
                )}
                
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {cat.displayName}
                  </div>
                  {cat.status === 'completed' && cat.matchesCreated !== undefined && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      ✓ {cat.matchesCreated} matches created
                      {cat.byes ? ` • ${cat.byes} byes` : ''}
                    </div>
                  )}
                  {cat.status === 'processing' && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 animate-pulse">
                      <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      Generating fixtures...
                    </div>
                  )}
                  {cat.status === 'skipped' && (
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Skipped - Not enough participants
                    </div>
                  )}
                  {cat.status === 'error' && cat.error && (
                    <div className="text-xs text-red-700 dark:text-red-300">
                      Error: {cat.error}
                    </div>
                  )}
                </div>
              </div>

              {cat.status === 'completed' && (
                <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg className="h-4 w-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Done
                </span>
              )}
              {cat.status === 'processing' && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                  ⚡ Active
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Complete Message with Animation */}
        {isComplete && (
          <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="relative">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 animate-bounce" />
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
              </div>
              <div>
                <p className="font-bold text-green-900 dark:text-green-200 text-lg">
                  🎉 Generation Complete!
                </p>
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                  All eligible categories have been processed successfully.
                  {categories.reduce((sum, cat) => sum + (cat.matchesCreated || 0), 0) > 0 && (
                    <span className="font-semibold ml-1">
                      {categories.reduce((sum, cat) => sum + (cat.matchesCreated || 0), 0)} matches created!
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button (only show close when complete) */}
        {isComplete && onClose && (
          <div className="flex justify-end pt-4">
            <Button variant="primary" onClick={onClose}>
              View Fixtures
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

