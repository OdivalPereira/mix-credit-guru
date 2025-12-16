-- Migration to align ncm_rules with Technical Specs (Hydration support)

ALTER TABLE public.ncm_rules
ADD COLUMN IF NOT EXISTS municipio text,
ADD COLUMN IF NOT EXISTS item_id text,
ADD COLUMN IF NOT EXISTS scenario text DEFAULT 'default';

-- Rename columns to match specs if they differ, or add aliases via view. 
-- Specs use valid_from/valid_to. Dictionary uses date_start/date_end.
-- Let's standardize on valid_from/valid_to as per specs.

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'ncm_rules' AND column_name = 'date_start') THEN
    ALTER TABLE public.ncm_rules RENAME COLUMN date_start TO valid_from;
  END IF;

  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'ncm_rules' AND column_name = 'date_end') THEN
    ALTER TABLE public.ncm_rules RENAME COLUMN date_end TO valid_to;
  END IF;
  
   IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'ncm_rules' AND column_name = 'explanation_markdown') THEN
    ALTER TABLE public.ncm_rules RENAME COLUMN explanation_markdown TO descricao;
  END IF;
END $$;

-- Make fields nullable as per spec (Global rules might not have NCM or UF)
ALTER TABLE public.ncm_rules ALTER COLUMN ncm DROP NOT NULL;
ALTER TABLE public.ncm_rules ALTER COLUMN uf DROP NOT NULL;

-- Index for sync performance
CREATE INDEX IF NOT EXISTS idx_ncm_rules_sync ON public.ncm_rules (created_at);
CREATE INDEX IF NOT EXISTS idx_ncm_rules_lookup ON public.ncm_rules (ncm, uf, item_id, scenario);
