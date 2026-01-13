-- Fix Silver Layer: Drop and Recreate Materialized View with PascalCase keys
-- Based on verification, keys seem to be PascalCase (IndRedBC, CodigoNcm, etc.)

drop materialized view if exists public.tax_rules_gov;

create materialized view public.tax_rules_gov as
with flat_data as (
    select
        id as raw_id,
        fetched_at,
        source_api,
        jsonb_array_elements(payload_json) as item
    from
        public.raw_gov_tax_data
    where
        source_api = 'classTrib'
)
select
    -- Trying PascalCase keys found in SVRS documentation usually
    (item ->> 'CodigoNcm')::text as ncm,
    (item ->> 'DescricaoNcm')::text as descricao, -- Sometimes Descricao is DescricaoNcm
    (item ->> 'ExIpi')::text as ex_ipi,
    (item ->> 'AliqNac')::numeric as aliq_nac,
    (item ->> 'AliqImp')::numeric as aliq_imp,
    f.raw_id,
    f.fetched_at as updated_at
from
    flat_data f;

-- Re-create index
create index idx_tax_rules_gov_ncm on public.tax_rules_gov (ncm);

comment on materialized view public.tax_rules_gov is 'Silver Layer: Flattened tax rules from Gov API (PascalCase Fix)';
