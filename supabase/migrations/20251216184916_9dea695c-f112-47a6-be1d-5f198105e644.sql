-- Add scenario column to ncm_rules for supporting multiple tax scenarios
ALTER TABLE public.ncm_rules 
  ADD COLUMN IF NOT EXISTS scenario TEXT NOT NULL DEFAULT 'default';