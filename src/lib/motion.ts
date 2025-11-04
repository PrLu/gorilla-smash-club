import { Variants } from 'framer-motion';
import tokens from '@/styles/tokens.json';

/**
 * Reusable Framer Motion variants and helpers
 * All animations respect prefers-reduced-motion
 */

// Standard fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: parseFloat(tokens.motion.duration.normal) / 1000 } },
};

// Slide up animation
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: parseFloat(tokens.motion.duration.normal) / 1000 },
  },
};

// Slide down animation
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: parseFloat(tokens.motion.duration.normal) / 1000 },
  },
};

// Scale animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: parseFloat(tokens.motion.duration.normal) / 1000 },
  },
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// List item animation for staggered lists
export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: parseFloat(tokens.motion.duration.fast) / 1000 },
  },
};

/**
 * Motion wrapper helper with reduced motion support
 */
export const getMotionProps = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    };
  }
  return {};
};

/**
 * Common transition configs
 */
export const transitions = {
  fast: { duration: parseFloat(tokens.motion.duration.fast) / 1000 },
  normal: { duration: parseFloat(tokens.motion.duration.normal) / 1000 },
  slow: { duration: parseFloat(tokens.motion.duration.slow) / 1000 },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 10 },
};

