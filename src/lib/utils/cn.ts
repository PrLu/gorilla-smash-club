import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class composition
 * 
 * @example
 * cn('px-2 py-1', className, isActive && 'bg-primary-600')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

