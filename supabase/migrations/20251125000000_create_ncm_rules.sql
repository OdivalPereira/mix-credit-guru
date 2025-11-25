create table "public"."ncm_rules" (
    "id" uuid not null default gen_random_uuid(),
    "ncm" text not null,
    "uf" text not null,
    "date_start" date not null,
    "date_end" date,
    "aliquota_ibs" numeric not null,
    "aliquota_cbs" numeric not null,
    "aliquota_is" numeric not null,
    "explanation_markdown" text,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."ncm_rules" enable row level security;

create policy "Enable read access for all users"
on "public"."ncm_rules"
as permissive
for select
to public
using (true);

create policy "Enable insert for authenticated users only"
on "public"."ncm_rules"
as permissive
for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users only"
on "public"."ncm_rules"
as permissive
for update
to authenticated
using (true);

CREATE UNIQUE INDEX ncm_rules_pkey ON public.ncm_rules USING btree (id);

alter table "public"."ncm_rules" add constraint "ncm_rules_pkey" PRIMARY KEY using index "ncm_rules_pkey";
