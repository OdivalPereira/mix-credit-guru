-- Rename explanation_markdown to explanation_md for consistency
ALTER TABLE public.ncm_rules 
RENAME COLUMN explanation_markdown TO explanation_md;