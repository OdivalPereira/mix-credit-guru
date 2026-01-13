-- Debug View
drop view if exists public.debug_tax_rules;

create view public.debug_tax_rules as
with flat_data as (
    select
        jsonb_array_elements(payload_json) as item
    from
        public.raw_gov_tax_data
    where
        source_api = 'classTrib'
),
unnested_rules as (
    select
        jsonb_array_elements(item -> 'classificacoesTributarias') as rule
    from
        flat_data
    where
        jsonb_typeof(item -> 'classificacoesTributarias') = 'array'
)
select
    rule,
    (rule ->> 'CodigoNcm') as extracted_ncm,
    (rule -> 'CodigoNcm') as raw_ncm,
    jsonb_typeof(rule) as rule_type
from
    unnested_rules
limit 5;
