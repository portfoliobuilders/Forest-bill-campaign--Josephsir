-- Idempotent repair: campaign platform schema + ESA as the only active campaign.
-- Safe to re-run. Archives the Forest Bill campaign without deleting submissions.
-- Remote history used timestamped versions; this file is the next applied version.

-- Campaign management platform: statuses, recipients, form fields, branding,
-- and the ESA draft-notification campaign. Archives the Forest Bill campaign
-- without deleting historical submissions.

-- ---------------------------------------------------------------------------
-- Campaign columns
-- ---------------------------------------------------------------------------

alter table public.campaigns
  add column if not exists status text,
  add column if not exists bcc_emails text[] not null default '{}',
  add column if not exists reply_to_email text,
  add column if not exists allow_multiple_concerns boolean not null default false,
  add column if not exists og_title_en text not null default '',
  add column if not exists og_title_ml text not null default '',
  add column if not exists og_description_en text not null default '',
  add column if not exists og_description_ml text not null default '',
  add column if not exists social_image_url text,
  add column if not exists created_by text;
alter table public.campaigns
  add column if not exists concern_selection_mode text not null default 'single',
  add column if not exists max_concern_selections integer,
  add column if not exists allow_custom_concern boolean not null default true,
  add column if not exists custom_concern_label_en text,
  add column if not exists custom_concern_label_ml text,
  add column if not exists custom_concern_placeholder_en text,
  add column if not exists custom_concern_placeholder_ml text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_concern_selection_mode_check') then
    alter table public.campaigns
      add constraint campaigns_concern_selection_mode_check
      check (concern_selection_mode in ('single', 'multiple'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'campaigns_max_concern_selections_check') then
    alter table public.campaigns
      add constraint campaigns_max_concern_selections_check
      check (max_concern_selections is null or max_concern_selections >= 1);
  end if;
end $$;


alter table public.campaigns
  alter column deadline_at drop not null;

update public.campaigns
set status = case
  when status is not null then status
  when is_active then 'active'
  when publish_status = 'archived' then 'archived'
  when publish_status = 'closed' then 'expired'
  when publish_status in ('draft', 'preview') then 'draft'
  else 'draft'
end
where status is null;

alter table public.campaigns
  alter column status set default 'draft';

alter table public.campaigns
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_status_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_status_check
      check (status in ('draft', 'active', 'inactive', 'expired', 'archived'));
  end if;
end $$;

create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_deadline_idx on public.campaigns (deadline_at);

create or replace function public.sync_campaign_flags()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' then
    new.is_active := true;
    new.publish_status := 'live';
  elsif new.status = 'archived' then
    new.is_active := false;
    new.publish_status := 'archived';
  elsif new.status = 'draft' then
    new.is_active := false;
    new.publish_status := 'draft';
  elsif new.status = 'inactive' then
    new.is_active := false;
    new.publish_status := 'closed';
  else
    new.is_active := false;
    new.publish_status := 'closed';
  end if;
  return new;
end;
$$;

drop trigger if exists campaigns_sync_flags on public.campaigns;
create trigger campaigns_sync_flags
before insert or update of status on public.campaigns
for each row execute function public.sync_campaign_flags();

-- ---------------------------------------------------------------------------
-- Concerns: longer copy, optional email subject/body
-- ---------------------------------------------------------------------------

alter table public.objection_clauses
  drop constraint if exists email_ml_len,
  drop constraint if exists email_en_len;

alter table public.objection_clauses
  add column if not exists email_subject_ml text not null default '',
  add column if not exists email_subject_en text not null default '',
  add column if not exists email_body_ml text not null default '',
  add column if not exists email_body_en text not null default '',
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Recipients (TO / CC / BCC)
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('to', 'cc', 'bcc')),
  email text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists campaign_recipients_unique
  on public.campaign_recipients (campaign_id, recipient_type, lower(email));
create index if not exists campaign_recipients_campaign_idx
  on public.campaign_recipients (campaign_id, recipient_type, display_order);

alter table public.campaign_recipients enable row level security;
revoke all on table public.campaign_recipients from public, anon, authenticated;
grant all on table public.campaign_recipients to service_role;

-- ---------------------------------------------------------------------------
-- Form field configuration
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_form_fields (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  field_key text not null,
  label_en text not null,
  label_ml text not null,
  is_enabled boolean not null default true,
  is_required boolean not null default false,
  display_order int not null default 0,
  unique (campaign_id, field_key)
);

create index if not exists campaign_form_fields_campaign_idx
  on public.campaign_form_fields (campaign_id, display_order);

alter table public.campaign_form_fields enable row level security;
revoke all on table public.campaign_form_fields from public, anon, authenticated;
grant all on table public.campaign_form_fields to service_role;

-- Public may read form fields for currently active campaigns (server still
-- prefers the service role; this keeps the model honest if a page uses anon).
drop policy if exists campaign_form_fields_public_read on public.campaign_form_fields;
create policy campaign_form_fields_public_read
  on public.campaign_form_fields
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.campaigns c
      where c.id = campaign_id
        and c.is_active
        and c.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Submissions: optional village + BCC snapshot
-- ---------------------------------------------------------------------------

alter table public.submissions
  add column if not exists village text,
  add column if not exists generated_bcc text[] not null default '{}';

alter table public.submissions
  alter column address_line set default '';

alter table public.submissions
  alter column district set default '';

-- ---------------------------------------------------------------------------
-- Site branding
-- ---------------------------------------------------------------------------

alter table public.site_settings
  add column if not exists tagline_en text not null default '',
  add column if not exists tagline_ml text not null default '',
  add column if not exists logo_url text,
  add column if not exists favicon_url text,
  add column if not exists og_image_url text;

-- Public branding RPC — no updated_by, no support internals beyond titles.
create or replace function public.public_site_branding()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'brand_name_en', site_title_en,
    'brand_name_ml', site_title_ml,
    'tagline_en', tagline_en,
    'tagline_ml', tagline_ml,
    'logo_url', logo_url,
    'favicon_url', favicon_url,
    'og_image_url', og_image_url,
    'default_language', default_language,
    'public_disclaimer_ml', public_disclaimer_ml,
    'public_disclaimer_en', public_disclaimer_en,
    'public_footer_ml', public_footer_ml,
    'public_footer_en', public_footer_en,
    'support_email', support_email
  )
  from public.site_settings
  where id = 1;
$$;

revoke all on function public.public_site_branding() from public;
grant execute on function public.public_site_branding() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Public campaign resolver
-- ---------------------------------------------------------------------------

create or replace function public.campaign_public_state(p_slug text, p_preview text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec public.campaigns%rowtype;
  tok text := nullif(btrim(coalesce(p_preview, '')), '');
  payload jsonb;
  now_ts timestamptz := now();
  effective text;
begin
  if nullif(btrim(coalesce(p_slug, '')), '') is not null then
    select * into rec from public.campaigns where slug = p_slug limit 1;
  end if;

  if rec.id is null then
    select * into rec
    from public.campaigns
    where status = 'active'
      and (opens_at is null or opens_at <= now_ts)
      and (deadline_at is null or deadline_at >= now_ts)
    order by opens_at desc nulls last, updated_at desc
    limit 1;
  end if;

  if rec.id is null then
    if tok is not null then
      select * into rec
      from public.campaigns
      where preview_token is not null and preview_token = tok
      limit 1;
    end if;
  end if;

  if rec.id is null then
    return jsonb_build_object('state', 'dormant');
  end if;

  payload := to_jsonb(rec) - 'preview_token' - 'updated_by' - 'created_by';
  -- BCC stays available to the mail composer on the server; omit from the
  -- anonymous RPC payload so listing pages do not advertise the mailbox.
  payload := payload - 'bcc_emails';

  effective := rec.status;
  if rec.status = 'active' and rec.deadline_at is not null and rec.deadline_at < now_ts then
    effective := 'expired';
  elsif rec.status = 'active' and rec.opens_at is not null and rec.opens_at > now_ts then
    effective := 'inactive';
  end if;

  if effective = 'active' then
    return jsonb_build_object('state', 'live', 'campaign', payload);
  end if;

  if tok is not null and rec.preview_token is not null and rec.preview_token = tok then
    return jsonb_build_object('state', 'preview', 'campaign', payload);
  end if;

  if effective = 'expired' then
    return jsonb_build_object('state', 'expired', 'campaign', payload);
  end if;

  if effective = 'inactive' then
    return jsonb_build_object('state', 'inactive', 'campaign', payload);
  end if;

  return jsonb_build_object('state', 'dormant');
end;
$$;

-- Keep the security posture from 20260819125807: the Next.js server uses the
-- service role. Do not re-expose this SECURITY DEFINER RPC to the Data API.
revoke all on function public.campaign_public_state(text, text) from public, anon, authenticated;
grant execute on function public.campaign_public_state(text, text) to service_role;

-- Tighten create_submission so expired campaigns cannot accept live writes.
create or replace function public.create_submission(
  p_campaign_slug   text,
  p_full_name       text,
  p_email           text,
  p_phone           text,
  p_address         text,
  p_panchayat       text,
  p_district        text,
  p_pincode         text,
  p_language        text,
  p_custom_text     text,
  p_clause_codes    text[],
  p_subject         text,
  p_body            text,
  p_ip_hash         text,
  p_user_agent      text,
  p_consent_version text,
  p_constituency_id uuid,
  p_cc_rep_ids      uuid[],
  p_is_test         boolean default false,
  p_generated_to    text[] default '{}',
  p_generated_cc    text[] default '{}'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id   uuid;
  v_is_active     boolean;
  v_status        text;
  v_deadline      timestamptz;
  v_opens         timestamptz;
  v_submission_id uuid;
begin
  select id, is_active, status, deadline_at, opens_at
    into v_campaign_id, v_is_active, v_status, v_deadline, v_opens
  from public.campaigns
  where slug = p_campaign_slug;

  if v_campaign_id is null then
    raise exception 'campaign_not_active';
  end if;

  if p_is_test is not true then
    if v_is_active is not true or v_status is distinct from 'active' then
      raise exception 'campaign_not_active';
    end if;
    if v_deadline is not null and v_deadline < now() then
      raise exception 'campaign_not_active';
    end if;
    if v_opens is not null and v_opens > now() then
      raise exception 'campaign_not_active';
    end if;
  end if;

  insert into public.submissions (
    campaign_id, full_name, email, phone_e164, address_line, panchayat,
    district, pincode, language, custom_text, generated_subject, generated_body,
    ip_hash, user_agent, consent_version, constituency_id, cc_representative_ids,
    is_test, generated_to, generated_cc
  ) values (
    v_campaign_id, p_full_name, p_email, p_phone, coalesce(p_address, ''), p_panchayat,
    coalesce(p_district, ''), p_pincode, p_language, p_custom_text, p_subject, p_body,
    p_ip_hash, p_user_agent, p_consent_version, p_constituency_id,
    coalesce(p_cc_rep_ids, '{}'),
    coalesce(p_is_test, false),
    coalesce(p_generated_to, '{}'),
    coalesce(p_generated_cc, '{}')
  ) returning id into v_submission_id;

  insert into public.submission_clauses (submission_id, clause_id)
  select v_submission_id, oc.id
  from public.objection_clauses oc
  where oc.campaign_id = v_campaign_id
    and oc.code = any(p_clause_codes)
    and oc.is_active;

  return v_submission_id;
end;
$$;

revoke all on function public.create_submission(
  text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, uuid, uuid[], boolean, text[], text[]
) from public, anon, authenticated;
grant execute on function public.create_submission(
  text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, uuid, uuid[], boolean, text[], text[]
) to service_role;

-- ---------------------------------------------------------------------------
-- Branding storage bucket
-- ---------------------------------------------------------------------------

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'branding',
    'branding',
    true,
    2097152,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
exception
  when others then
    raise notice 'storage.buckets branding skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'branding_public_read'
  ) then
    create policy branding_public_read
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'branding');
  end if;
exception
  when others then
    raise notice 'storage policy branding_public_read skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Archive the Forest Bill campaign (keep rows + submissions)
-- ---------------------------------------------------------------------------

update public.campaigns
set
  status = 'archived',
  is_active = false,
  publish_status = 'archived'
where slug in ('kerala-forest-amendment-2024', 'demo');

-- ---------------------------------------------------------------------------
-- Seed ESA campaign
-- ---------------------------------------------------------------------------

do $$
declare
  v_id uuid;
begin
    insert into public.campaigns (
      slug,
      title_ml,
      title_en,
      summary_ml,
      summary_en,
      homepage_intro_ml,
      homepage_intro_en,
      recipient_email,
      recipient_emails,
      cc_emails,
      bcc_emails,
      subject_ml,
      subject_en,
      intro_ml,
      intro_en,
      closing_ml,
      closing_en,
      body_template_ml,
      body_template_en,
      source_url,
      reference_url,
      opens_at,
      deadline_at,
      status,
      is_active,
      publish_status,
      allow_multiple_concerns,
      concern_selection_mode,
      allow_custom_concern,
      og_title_ml,
      og_title_en,
      og_description_ml,
      og_description_en,
      explainer_ml,
      explainer_en
    ) values (
      'esa-draft-notification',
      'പരിസ്ഥിതിലോല പ്രദേശം (ESA) — കരട് വിജ്ഞാപനം',
      'Ecologically Sensitive Area (ESA) — Draft Notification',
      'കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് കേന്ദ്ര സർക്കാർ പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക ഉയർന്നിട്ടുണ്ട്.',
      'Concerns have been raised regarding the boundary demarcation and maps contained in the seventh draft notification relating to Ecologically Sensitive Areas (ESA), issued by the Central Government on July 27 based on the recommendations associated with the Kasturirangan Report.',
      $ml$കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് കേന്ദ്ര സർക്കാർ പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക ഉയർന്നിട്ടുണ്ട്.

പശ്ചിമഘട്ടത്തിലെ 56,825.7 ചതുരശ്ര കിലോമീറ്റർ പ്രദേശം പരിസ്ഥിതിലോല മേഖലയായി നിർദേശിക്കുന്ന കരട് വിജ്ഞാപനത്തിൽ കേരളത്തിലെ 131 ഗ്രാമങ്ങളിലായി 9,993.7 ചതുരശ്ര കിലോമീറ്റർ പ്രദേശമാണ് ഉൾപ്പെടുത്തിയിരിക്കുന്നത്.

സമർപ്പിച്ച രേഖകളിലോ അതിർത്തിനിർണയത്തിലോ ഉണ്ടായിട്ടുള്ള തെറ്റുകൾ പരിശോധിച്ച് ആവശ്യമായ തിരുത്തലുകൾ വരുത്തുന്നതിനുള്ള നടപടികൾ സർക്കാർ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തുന്നതിന് പകരം യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ ശാസ്ത്രീയമായും കൃത്യമായും നിർണയിക്കണമെന്നതാണ് പ്രധാന ആവശ്യം.

കരട് വിജ്ഞാപനത്തിലെ അപാകതകളെക്കുറിച്ചുള്ള പരാതികളും അഭിപ്രായങ്ങളും വിജ്ഞാപനം പ്രസിദ്ധീകരിച്ചതിന് ശേഷം അനുവദിച്ചിരിക്കുന്ന സമയപരിധിക്കുള്ളിൽ സമർപ്പിക്കേണ്ടതാണ്.

താഴെ നൽകിയിരിക്കുന്ന വിഷയങ്ങളിൽ നിങ്ങളുടെ ആശങ്കയുമായി ബന്ധപ്പെട്ട വിഷയം തിരഞ്ഞെടുക്കുകയും ബന്ധപ്പെട്ട അധികാരികൾക്ക് ഇമെയിൽ മുഖേന നിങ്ങളുടെ അഭിപ്രായം അറിയിക്കുകയും ചെയ്യുക.$ml$,
      $en$Concerns have been raised regarding the boundary demarcation and maps contained in the seventh draft notification relating to Ecologically Sensitive Areas (ESA), issued by the Central Government on July 27 based on the recommendations associated with the Kasturirangan Report.

The draft notification proposes approximately 56,825.7 sq. km. of the Western Ghats as Ecologically Sensitive Area, including approximately 9,993.7 sq. km. across 131 villages in Kerala.

The Government is requested to review the submitted records, boundaries, and maps and take the necessary steps to rectify any inaccuracies.

Instead of automatically treating an entire revenue village as an ESA, the actual ecologically sensitive areas should be identified accurately through appropriate scientific and administrative assessment.

Citizens may submit their objections, concerns, and representations regarding the draft notification within the applicable period prescribed for public feedback.

Select one of the concerns below and use the platform to prepare an email to the relevant authorities.$en$,
      'min.for@kerala.gov.in',
      array['min.for@kerala.gov.in']::text[],
      array[
        'min.for@kerala.gov.in',
        'prlsecy.forest@kerala.gov.in',
        'pccf.for@kerala.gov.in',
        'www.for@kerala.gov.in',
        'pccf-d.for@kerala.gov.in',
        'pccf-flr.for@kerala.gov.in'
      ]::text[],
      array['esacomplaints2026@gmail.com']::text[],
      'പരിസ്ഥിതിലോല പ്രദേശം (ESA) കരട് വിജ്ഞാപനവുമായി ബന്ധപ്പെട്ട നിവേദനം',
      'Representation regarding Ecologically Sensitive Area (ESA) Draft Notification',
      'കരട് ഇ.എസ്.എ. വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തെയും ഭൂപടങ്ങളെയും കുറിച്ച് ഞാൻ താഴെപ്പറയുന്ന ആശങ്ക രേഖപ്പെടുത്തുന്നു.',
      'I submit the following representation regarding the draft Ecologically Sensitive Area (ESA) notification.',
      'ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.',
      'Necessary steps are requested to be taken in this regard.',
      $mlt${{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

ആദരപൂർവ്വം,
{{full_name}}$mlt$,
      $ent${{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

Regards,
{{full_name}}$ent$,
      'https://moef.gov.in/',
      null,
      timestamptz '2026-07-27 00:00:00+05:30',
      timestamptz '2026-09-25 18:29:59+05:30',
      'active',
      true,
      'live',
      false,
      'single',
      true,
      'പരിസ്ഥിതിലോല പ്രദേശം (ESA) — കരട് വിജ്ഞാപനം',
      'Ecologically Sensitive Area (ESA) — Draft Notification',
      'കസ്തൂരിരംഗൻ റിപ്പോർട്ടിന്റെ അടിസ്ഥാനത്തിൽ ജൂലൈ 27-ന് പുറപ്പെടുവിച്ച ഏഴാമത് ഇ.എസ്.എ. കരട് വിജ്ഞാപനത്തിലെ അതിർത്തിനിർണയത്തിലും ഭൂപടങ്ങളിലും അപാകതകളുണ്ടെന്ന ആശങ്ക.',
      'Concerns about boundary demarcation and maps in the seventh ESA draft notification issued on 27 July.',
      '{}'::text[],
      '{}'::text[]
    )
    on conflict (slug) do update set
      title_ml = excluded.title_ml,
      title_en = excluded.title_en,
      summary_ml = excluded.summary_ml,
      summary_en = excluded.summary_en,
      homepage_intro_ml = excluded.homepage_intro_ml,
      homepage_intro_en = excluded.homepage_intro_en,
      recipient_email = excluded.recipient_email,
      recipient_emails = excluded.recipient_emails,
      cc_emails = excluded.cc_emails,
      bcc_emails = excluded.bcc_emails,
      subject_ml = excluded.subject_ml,
      subject_en = excluded.subject_en,
      intro_ml = excluded.intro_ml,
      intro_en = excluded.intro_en,
      closing_ml = excluded.closing_ml,
      closing_en = excluded.closing_en,
      body_template_ml = excluded.body_template_ml,
      body_template_en = excluded.body_template_en,
      source_url = excluded.source_url,
      reference_url = excluded.reference_url,
      opens_at = excluded.opens_at,
      deadline_at = excluded.deadline_at,
      status = 'active',
      is_active = true,
      publish_status = 'live',
      allow_multiple_concerns = false,
      concern_selection_mode = 'single',
      allow_custom_concern = true,
      og_title_ml = excluded.og_title_ml,
      og_title_en = excluded.og_title_en,
      og_description_ml = excluded.og_description_ml,
      og_description_en = excluded.og_description_en,
      explainer_ml = excluded.explainer_ml,
      explainer_en = excluded.explainer_en
    returning id into v_id;

  -- Recipients: TO = Forest Minister; remaining officials as CC; campaign mailbox as BCC.
  delete from public.campaign_recipients where campaign_id = v_id;
  insert into public.campaign_recipients (campaign_id, recipient_type, email, display_order) values
      (v_id, 'to',  'min.for@kerala.gov.in', 1),
      (v_id, 'cc',  'min.for@kerala.gov.in', 1),
      (v_id, 'cc',  'prlsecy.forest@kerala.gov.in', 2),
      (v_id, 'cc',  'pccf.for@kerala.gov.in', 3),
      (v_id, 'cc',  'www.for@kerala.gov.in', 4),
      (v_id, 'cc',  'pccf-d.for@kerala.gov.in', 5),
      (v_id, 'cc',  'pccf-flr.for@kerala.gov.in', 6),
      (v_id, 'bcc', 'esacomplaints2026@gmail.com', 1);

  begin
    delete from public.campaign_form_fields where campaign_id = v_id;
    insert into public.campaign_form_fields (campaign_id, field_key, label_en, label_ml, is_enabled, is_required, display_order) values
      (v_id, 'name',            'Full name',                 'പൂർണ്ണ നാമം',                         true,  true,  1),
      (v_id, 'pincode',         'PIN code',                  'പിൻകോഡ്',                             true,  true,  2),
      (v_id, 'email',           'Email',                     'ഇമെയിൽ',                             false, false, 3),
      (v_id, 'phone',           'Mobile number',             'മൊബൈൽ നമ്പർ',                         false, false, 4),
      (v_id, 'district',        'District',                  'ജില്ല',                               false, false, 5),
      (v_id, 'local_body',      'Panchayat / Municipality',  'പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി',       false, false, 6),
      (v_id, 'village',         'Village',                   'വില്ലേജ്',                            false, false, 7),
      (v_id, 'address',         'Address',                   'വിലാസം',                              false, false, 8),
      (v_id, 'custom_message',  'Additional message',        'അധിക സന്ദേശം',                        false, false, 9);
  end;

    insert into public.objection_clauses (
      campaign_id, code, section_ref, sort_order, is_active,
      title_en, title_ml, explain_en, explain_ml, full_text_en, full_text_ml,
      email_en, email_ml, email_subject_en, email_subject_ml, email_body_en, email_body_ml
    ) values
    (
      v_id, 'ESA1', null, 1, true,
      'Do not designate ESA areas solely on the basis of revenue-village boundaries.',
      'റവന്യൂ വില്ലേജിന്റെ അതിർത്തി മാത്രം അടിസ്ഥാനമാക്കി ഒരു പ്രദേശത്തെ മുഴുവനായും ഇ.എസ്.എ. ആയി പ്രഖ്യാപിക്കരുത്.',
      'Identify ESA areas through accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village.',
      'യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണം.',
      $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
      $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$,
      $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
      $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$,
      'Do not designate ESA areas solely on the basis of revenue-village boundaries.',
      'റവന്യൂ വില്ലേജിന്റെ അതിർത്തി മാത്രം അടിസ്ഥാനമാക്കി ഒരു പ്രദേശത്തെ മുഴുവനായും ഇ.എസ്.എ. ആയി പ്രഖ്യാപിക്കരുത്.',
      $c1e$I request that Ecologically Sensitive Areas be identified based on accurate geographical, environmental, and ground-level assessment rather than automatically including an entire revenue village within the ESA boundary.

Necessary steps are requested to be taken in this regard.$c1e$,
      $c1m$യഥാർത്ഥ ഭൂമിശാസ്ത്ര, പരിസ്ഥിതി, സ്ഥലപരിശോധന വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ പരിസ്ഥിതിലോല പ്രദേശങ്ങൾ കൃത്യമായി നിർണയിക്കണമെന്നും ഒരു റവന്യൂ വില്ലേജിനെ മുഴുവനായും സ്വമേധയാ ഇ.എസ്.എ. പരിധിയിൽ ഉൾപ്പെടുത്തരുതെന്നും അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c1m$
    ),
    (
      v_id, 'ESA2', null, 2, true,
      'Protect legally occupied homes, agricultural land, and livelihoods.',
      'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ സംരക്ഷിക്കുക.',
      'No administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, farms, or livelihoods.',
      'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ അനാവശ്യമായി നഷ്ടപ്പെടരുത്.',
      $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
      $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ ഞാൻ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$,
      $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
      $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ ഞാൻ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$,
      'Protect legally occupied homes, agricultural land, and livelihoods.',
      'നിയമാനുസൃതമായി കൈവശമുള്ള വീടുകൾ, കൃഷിയിടങ്ങൾ, ഉപജീവന മാർഗങ്ങൾ എന്നിവ സംരക്ഷിക്കുക.',
      $c2e$I have been residing on my property for years with the relevant legal documents and have been regularly paying land tax.

I request that no administrative action connected with the ESA notification should unnecessarily result in the loss of legally occupied homes, agricultural land, farming activities, or legitimate sources of livelihood.

Necessary steps are requested to be taken in this regard.$c2e$,
      $c2m$മതിയായ നിയമാനുസൃത രേഖകളോടെ ഞാൻ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുകയും കൃഷി നടത്തുകയും ചെയ്യുന്ന വീടും ഭൂമിയും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ ഉപജീവന മാർഗങ്ങളും അനാവശ്യമായി നഷ്ടപ്പെടുന്ന സാഹചര്യം ഉണ്ടാകാതിരിക്കാനുള്ള നടപടികൾ സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.$c2m$
    ),
    (
      v_id, 'ESA3', null, 3, true,
      'Exclude residential and inhabited areas from the ESA boundary.',
      'ജനവാസ കേന്ദ്രങ്ങളെ ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കുക.',
      'Residential and inhabited areas should be excluded from the ESA boundary before the final notification is issued.',
      'ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കണം.',
      $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
      $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$,
      $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
      $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$,
      'Exclude residential and inhabited areas from the ESA boundary.',
      'ജനവാസ കേന്ദ്രങ്ങളെ ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കുക.',
      $c3e$I request that residential and inhabited areas be excluded from the ESA boundary and that the final notification be issued only after accurately identifying the areas that genuinely require ecological protection.

Necessary steps are requested to be taken in this regard.$c3e$,
      $c3m$ജനവാസ കേന്ദ്രങ്ങളെ പൂർണ്ണമായും ഇ.എസ്.എ. പരിധിയിൽ നിന്ന് ഒഴിവാക്കി, യഥാർത്ഥ പരിസ്ഥിതിലോല പ്രദേശങ്ങളെ കൃത്യമായി നിർണയിച്ച ശേഷം അന്തിമ വിജ്ഞാപനം പ്രസിദ്ധീകരിക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c3m$
    ),
    (
      v_id, 'ESA4', null, 4, true,
      'Prevent actions that could unnecessarily affect legally held homes, farms, and livelihoods.',
      'വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന സാഹചര്യം ഒഴിവാക്കുക.',
      'Safeguards are needed so that ESA-related actions do not unnecessarily affect legally held homes, farms, and livelihoods.',
      'നിയമാനുസൃതമായ വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന നടപടികൾ ഒഴിവാക്കണം.',
      $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
      $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$,
      $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
      $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$,
      'Prevent actions that could unnecessarily affect legally held homes, farms, and livelihoods.',
      'വീടുകളും കൃഷിയിടങ്ങളും വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന സാഹചര്യം ഒഴിവാക്കുക.',
      $c4e$I have been residing on my property for years with the relevant documents and have regularly paid the applicable land tax.

I request that appropriate safeguards be implemented so that actions arising from the ESA process do not unnecessarily affect my legally held home, agricultural land, farming activities, or legitimate sources of income.$c4e$,
      $c4m$മതിയായ രേഖകളോടെ വർഷങ്ങളായി ഭൂനികുതി അടച്ച് സ്ഥിരമായി താമസിക്കുന്ന എന്റെ വീടും കൃഷിയിടങ്ങളും നിയമാനുസൃതമായ വരുമാന മാർഗങ്ങളും നഷ്ടപ്പെടുന്ന രീതിയിലുള്ള നടപടികൾ ഒഴിവാക്കണമെന്ന് അഭ്യർത്ഥിക്കുന്നു.

ഇതിനാവശ്യമായ നടപടികൾ സ്വീകരിക്കണം.$c4m$
    )
    on conflict (campaign_id, code) do update set
      section_ref = excluded.section_ref,
      sort_order = excluded.sort_order,
      is_active = excluded.is_active,
      title_en = excluded.title_en,
      title_ml = excluded.title_ml,
      explain_en = excluded.explain_en,
      explain_ml = excluded.explain_ml,
      full_text_en = excluded.full_text_en,
      full_text_ml = excluded.full_text_ml,
      email_en = excluded.email_en,
      email_ml = excluded.email_ml,
      email_subject_en = excluded.email_subject_en,
      email_subject_ml = excluded.email_subject_ml,
      email_body_en = excluded.email_body_en,
      email_body_ml = excluded.email_body_ml;
end $$;


-- Only one publicly active campaign at a time.
update public.campaigns
set status = 'archived', is_active = false, publish_status = 'archived'
where slug in ('kerala-forest-amendment-2024', 'demo')
   or (slug <> 'esa-draft-notification' and status = 'active');

update public.campaigns
set status = 'active', is_active = true, publish_status = 'live',
    concern_selection_mode = 'single', allow_custom_concern = true, allow_multiple_concerns = false,
    subject_en = 'Representation regarding Ecologically Sensitive Area (ESA) Draft Notification',
    subject_ml = 'പരിസ്ഥിതിലോല പ്രദേശം (ESA) കരട് വിജ്ഞാപനവുമായി ബന്ധപ്പെട്ട നിവേദനം'
where slug = 'esa-draft-notification';

create unique index if not exists campaigns_one_active_idx
  on public.campaigns ((true))
  where status = 'active';
