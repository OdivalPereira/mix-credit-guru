-- Definitive Fix: Shotgun approach for keys
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
),
unnested_rules as (
    select
        raw_id,
        fetched_at,
        jsonb_array_elements(item -> 'classificacoesTributarias') as rule
    from
        flat_data
    where
        jsonb_typeof(item -> 'classificacoesTributarias') = 'array'
)
select
    -- Shotgun approach: Try all likely variations
    coalesce(
        (rule ->> 'CodigoNcm'), 
        (rule ->> 'codigoNcm'),
        (rule ->> 'codigoncm')
    )::text as ncm,
    
    coalesce(
        (rule ->> 'Descricao'), 
        (rule ->> 'DescricaoNcm'),
        (rule ->> 'descricao'),
        (rule ->> 'descricaoNcm')
    )::text as descricao,
    
    (rule ->> 'ExIpi')::text as ex_ipi,
    (rule ->> 'AliqNac')::numeric as aliq_nac,
    (rule ->> 'AliqImp')::numeric as aliq_imp,
    (rule ->> 'Motivo')::text as motivo,
    
    u.raw_id,
    u.fetched_at as updated_at
from
    unnested_rules u;

create index idx_tax_rules_gov_ncm on public.tax_rules_gov (ncm);

comment on materialized view public.tax_rules_gov is 'Silver Layer (Shotgun Fix)';
