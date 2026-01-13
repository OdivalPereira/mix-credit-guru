-- Split Silver Layer: Rules and NCMs

-- 1. Rules (Definitions) from classTrib
drop materialized view if exists public.tax_rules_gov cascade;

create materialized view public.tax_rules_gov as
with flat_rules as (
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
    (item ->> 'cClassTrib')::text as codigo,
    (item ->> 'DescricaoClassTrib')::text as descricao,
    (item ->> 'TipoAliquota')::text as tipo_aliquota,
    coalesce((item ->> 'Anexo')::int, 0) as anexo_id,
    f.raw_id,
    f.fetched_at as updated_at
from
    flat_rules f;

create index idx_tax_rules_gov_codigo on public.tax_rules_gov (codigo);
comment on materialized view public.tax_rules_gov is 'Silver Layer: Tax Rule Definitions (classTrib)';

-- 2. NCMs (Codes) from anexos
drop materialized view if exists public.tax_ncms_gov cascade;

create materialized view public.tax_ncms_gov as
with flat_anexos as (
    select
        id as raw_id,
        fetched_at,
        source_api,
        jsonb_array_elements(payload_json) as item
    from
        public.raw_gov_tax_data
    where
        source_api = 'anexos'
)
select
    (item ->> 'codNcmNbs')::text as ncm,
    (item ->> 'nroAnexo')::int as anexo_id,
    (item ->> 'TipoAnexo')::text as tipo,
    f.raw_id,
    f.fetched_at as updated_at
from
    flat_anexos f
where
    (item ->> 'TipoAnexo') = 'NCM';

create index idx_tax_ncms_gov_ncm on public.tax_ncms_gov (ncm);
create index idx_tax_ncms_gov_anexo on public.tax_ncms_gov (anexo_id);
comment on materialized view public.tax_ncms_gov is 'Silver Layer: Valid NCMs and Annex mappings';
