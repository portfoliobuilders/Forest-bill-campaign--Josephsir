-- Smart PIN lookup, campaign feature settings, optional identity fields,
-- and AI-assisted mail cache. Does not invent taluk data.

-- ---------------------------------------------------------------------------
-- Postal directory (India Post / data.gov.in shaped)
-- ---------------------------------------------------------------------------

create table if not exists public.postal_directory (
  id uuid primary key default gen_random_uuid(),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  office_name text not null,
  office_type text,
  delivery_status text,
  circle_name text,
  region_name text,
  division_name text,
  district_name text,
  state_name text,
  taluk_name text,
  source text not null default 'seed',
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists postal_directory_pincode_idx
  on public.postal_directory (pincode);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'postal_directory_pin_office_key'
  ) then
    alter table public.postal_directory
      add constraint postal_directory_pin_office_key unique (pincode, office_name);
  end if;
end $$;

alter table public.postal_directory enable row level security;
revoke all on table public.postal_directory from public, anon, authenticated;
grant select on table public.postal_directory to anon, authenticated;
grant all on table public.postal_directory to service_role;

drop policy if exists postal_directory_public_read on public.postal_directory;
create policy postal_directory_public_read
  on public.postal_directory
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Campaign feature settings (jsonb, not a parallel form-config system)
-- ---------------------------------------------------------------------------

alter table public.campaigns
  add column if not exists feature_settings jsonb not null default '{}'::jsonb;

alter table public.objection_clauses
  add column if not exists ai_body_en text not null default '',
  add column if not exists ai_body_ml text not null default '',
  add column if not exists ai_body_en_status text not null default 'none',
  add column if not exists ai_body_ml_status text not null default 'none';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'objection_clauses_ai_body_en_status_check'
  ) then
    alter table public.objection_clauses
      add constraint objection_clauses_ai_body_en_status_check
      check (ai_body_en_status in ('none', 'draft', 'approved'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'objection_clauses_ai_body_ml_status_check'
  ) then
    alter table public.objection_clauses
      add constraint objection_clauses_ai_body_ml_status_check
      check (ai_body_ml_status in ('none', 'draft', 'approved'));
  end if;
end $$;

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  period_day date not null,
  count int not null default 0,
  unique (campaign_id, period_day)
);

alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from public, anon, authenticated;
grant all on table public.ai_usage to service_role;

-- ---------------------------------------------------------------------------
-- Seed Kerala postal rows used by the ESA campaign tests / first lookups.
-- Taluk is omitted: api.postalpincode.in Block is not a verified taluk.
-- ---------------------------------------------------------------------------

insert into public.postal_directory (
  pincode, office_name, office_type, delivery_status,
  circle_name, region_name, division_name, district_name, state_name,
  taluk_name, source, source_updated_at
) values
  ('685561', 'Adimali', 'SO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Anaviratty', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Koompanpara', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Korangatti', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Machiplavu', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Mannamkandam', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Padicap', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685561', 'Valara', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Glenmary', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Karadikuzhy', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Kuttikanam', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Lakshmi Coil', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Pallikunnu', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Pambanar', 'BO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('685531', 'Peermade', 'SO', 'Delivery', 'Kerala', 'Kochi', 'Idukki', 'Idukki', 'Kerala', null, 'api.postalpincode.in', now()),
  ('695001', 'Thiruvananthapuram GPO', 'HO', 'Delivery', 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', null, 'seed', now()),
  ('682001', 'Ernakulam', 'HO', 'Delivery', 'Kerala', 'Kochi', 'Ernakulam', 'Ernakulam', 'Kerala', null, 'seed', now()),
  ('673001', 'Kozhikode', 'HO', 'Delivery', 'Kerala', 'Kozhikode', 'Kozhikode', 'Kozhikode', 'Kerala', null, 'seed', now())
on conflict (pincode, office_name) do nothing;

-- ---------------------------------------------------------------------------
-- ESA recommended public form + features
-- ---------------------------------------------------------------------------

do $$
declare
  v_id uuid;
begin
  select id into v_id from public.campaigns where slug = 'esa-draft-notification';
  if v_id is null then
    return;
  end if;

  update public.campaigns
  set
    concern_selection_mode = 'single',
    allow_multiple_concerns = false,
    allow_custom_concern = true,
    custom_concern_label_en = 'Anything else to say?',
    custom_concern_label_ml = 'കൂടുതൽ എന്തെങ്കിലും പറയാനുണ്ടോ?',
    custom_concern_placeholder_en = 'Write your concern here…',
    custom_concern_placeholder_ml = 'നിങ്ങളുടെ ആശങ്ക ഇവിടെ എഴുതുക…',
    body_template_en = $en${{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

{{identity_block}}$en$,
    body_template_ml = $ml${{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

{{identity_block}}$ml$,
    feature_settings = jsonb_build_object(
      'identity_mode', 'required',
      'enable_pin_lookup', true,
      'allow_privacy_mode', false,
      'enable_voice_input', true,
      'enable_mail_read_aloud', true,
      'enable_ai_mail', false,
      'ai_provider', 'disabled',
      'ai_model', 'gemini-2.5-flash',
      'ai_daily_limit', 40,
      'ai_monthly_limit', 1000,
      'ai_free_only', true
    )
  where id = v_id;

  delete from public.campaign_form_fields where campaign_id = v_id;
  insert into public.campaign_form_fields (
    campaign_id, field_key, label_en, label_ml, is_enabled, is_required, display_order
  ) values
    (v_id, 'name',           'Name',         'പേര്',           true,  true,  1),
    (v_id, 'pincode',        'PIN Code',     'പിൻ കോഡ്',       true,  true,  2),
    (v_id, 'phone',          'Phone Number', 'ഫോൺ നമ്പർ',      false, false, 3),
    (v_id, 'address',        'Address',      'വിലാസം',         false, false, 4),
    (v_id, 'email',          'Email',        'ഇമെയിൽ',         false, false, 5),
    (v_id, 'district',       'District',     'ജില്ല',           false, false, 6),
    (v_id, 'local_body',     'Panchayat',    'പഞ്ചായത്ത്',      false, false, 7),
    (v_id, 'village',        'Village',      'വില്ലേജ്',        false, false, 8),
    (v_id, 'custom_message', 'Additional concern', 'അധിക ആശങ്ക', false, false, 9);
end $$;
