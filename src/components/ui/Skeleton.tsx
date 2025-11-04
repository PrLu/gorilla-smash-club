'use client';

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton loader component for async content
 * Provides visual feedback while data is loading
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  animate = true,
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200';
  const animationStyles = animate ? 'animate-shimmer' : '';

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const inlineStyle = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], animationStyles, className))}
      style={inlineStyle}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
}

/**
 * Pre-composed skeleton patterns
 */
export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow">
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="40%" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonAvatar() {
  return <Skeleton variant="circular" width={40} height={40} />;
}

