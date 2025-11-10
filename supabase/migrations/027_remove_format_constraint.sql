-- Remove the restrictive format constraint to allow custom categories
-- Migration: 027_remove_format_constraint.sql
-- Date: 2025-01-09
-- Purpose: Allow tournaments to use custom categories from categories table

-- Drop the old restrictive constraint on format field
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_format_check;

-- The format field is kept for backward compatibility but no longer constrained
-- Modern tournaments use the formats[] array field instead
-- Custom categories are validated against the categories table in application code



