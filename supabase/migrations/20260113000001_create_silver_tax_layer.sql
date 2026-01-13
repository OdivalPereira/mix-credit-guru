-- Create a Materialized View to flatten the JSON structure from raw_gov_tax_data
-- This assumes the payload_json has a specific structure (based on CFF API).
-- We will handle both "classTrib" and "credPresumido" structures if possible, or focus on Classification first.

create materialized view if not exists public.tax_rules_gov as
with flat_data as (
    select
        id as raw_id,
        fetched_at,
        source_api,
        jsonb_array_elements(payload_json) as item
    from
        public.raw_gov_tax_data
    where
        source_api = 'classTrib' -- Focus on Classification API first
)
select
    (item ->> 'codigoNcm')::text as ncm,
    (item ->> 'descricao')::text as descricao,
    (item ->> 'exIpi')::text as ex_ipi,
    (item ->> 'aliqNac')::numeric as aliq_nac,
    (item ->> 'aliqImp')::numeric as aliq_imp,
    (item ->> 'motivo')::text as motivo, -- Sometimes present in other APIs
    fetched_at as updated_at,
    raw_id
from
    flat_data;

-- Index for fast lookup by NCM
create index if not exists idx_tax_rules_gov_ncm on public.tax_rules_gov (ncm);

-- Function to refresh the view
create or replace function public.refresh_tax_rules_gov()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view public.tax_rules_gov;
end;
$$;

comment on materialized view public.tax_rules_gov is 'Silver Layer: Flattened tax rules from Government API (Classificação Tributária)';
