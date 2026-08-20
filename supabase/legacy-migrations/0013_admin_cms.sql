-- Admin CMS: campaign publishing, homepage copy, email templates, recipient
-- snapshots, audit log, site settings. Does not change is_active on existing rows.

alter table public.campaigns
  add column if not exists publish_status text not null default 'draft',
  add column if not exists homepage_intro_ml text not null default '',
  add column if not exists homepage_intro_en text not null default '',
  add column if not exists reference_url text,
  add column if not exists body_template_ml text not null default '',
  add column if not exists body_template_en text not null default '',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_publish_status_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_publish_status_check
      check (publish_status in ('draft', 'preview', 'live', 'closed', 'archived'));
  end if;
end $$;

update public.campaigns
set
  publish_status = case when is_active then 'live' else coalesce(nullif(publish_status, ''), 'draft') end,
  homepage_intro_ml = case when homepage_intro_ml = '' then summary_ml else homepage_intro_ml end,
  homepage_intro_en = case when homepage_intro_en = '' then summary_en else homepage_intro_en end,
  body_template_ml = case when body_template_ml = '' then $ml$Sir,

{{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

ആദരപൂർവ്വം,

പേര്: {{full_name}}
വിലാസം: {{address}}
പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി: {{panchayat}}
ജില്ല: {{district}}
പിൻകോഡ്: {{pincode}}
ഫോൺ: {{phone}}
ഇമെയിൽ: {{email}}$ml$ else body_template_ml end,
  body_template_en = case when body_template_en = '' then $en$Sir,

{{intro}}

{{concerns}}

{{custom_text}}

{{closing}}

Regards,

Name: {{full_name}}
Address: {{address}}
Panchayat / Municipality: {{panchayat}}
District: {{district}}
PIN: {{pincode}}
Phone: {{phone}}
Email: {{email}}$en$ else body_template_en end
where true;

alter table public.objection_clauses
  add column if not exists full_text_ml text not null default '',
  add column if not exists full_text_en text not null default '';

alter table public.submissions
  add column if not exists custom_text_public boolean not null default false,
  add column if not exists generated_to text[] not null default '{}',
  add column if not exists generated_cc text[] not null default '{}';

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_entity on public.admin_audit_log (entity_type, entity_id);

alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from public, anon, authenticated;
grant all on table public.admin_audit_log to service_role;

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  default_language text not null default 'ml',
  site_title_ml text not null default 'ജനശബ്ദം',
  site_title_en text not null default 'Janashabdam',
  support_email text,
  public_disclaimer_ml text not null default '',
  public_disclaimer_en text not null default '',
  public_footer_ml text not null default '',
  public_footer_en text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from public, anon, authenticated;
grant all on table public.site_settings to service_role;

create or replace function public.touch_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
before update on public.campaigns
for each row execute function public.touch_campaigns_updated_at();

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
begin
  select * into rec
  from public.campaigns
  where slug = p_slug
  limit 1;

  if not found then
    select * into rec
    from public.campaigns
    order by created_at desc
    limit 1;
  end if;

  if found then
    payload := to_jsonb(rec) - 'preview_token' - 'updated_by';
    if rec.is_active then
      return jsonb_build_object('state', 'live', 'campaign', payload);
    end if;

    if rec.publish_status = 'preview'
       and rec.preview_token is not null
       and tok is not null
       and rec.preview_token = tok then
      return jsonb_build_object('state', 'preview', 'campaign', payload);
    end if;

    if rec.is_active is not true
       and rec.preview_token is not null
       and tok is not null
       and rec.preview_token = tok then
      return jsonb_build_object('state', 'preview', 'campaign', payload);
    end if;
  end if;

  if tok is not null then
    select * into rec
    from public.campaigns
    where is_active is not true
      and preview_token is not null
      and preview_token = tok
    limit 1;

    if found then
      return jsonb_build_object(
        'state', 'preview',
        'campaign', to_jsonb(rec) - 'preview_token' - 'updated_by'
      );
    end if;
  end if;

  return jsonb_build_object('state', 'dormant');
end;
$$;

revoke all on function public.campaign_public_state(text, text) from public;
grant execute on function public.campaign_public_state(text, text) to anon, authenticated, service_role;

create or replace function public.campaign_stats(p_slug text)
returns table (confirmed bigint, opened bigint, districts bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) filter (where s.is_test = false and s.status in ('confirmed_sent', 'server_sent')),
    count(*) filter (where s.is_test = false and s.status in ('handoff_opened', 'confirmed_sent', 'server_sent')),
    count(distinct s.district) filter (where s.is_test = false and s.status in ('confirmed_sent', 'server_sent'))
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id
  where c.slug = p_slug;
$$;

create or replace function public.clause_breakdown(p_slug text)
returns table (code text, title_ml text, title_en text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select oc.code, oc.title_ml, oc.title_en, count(distinct s.id)
  from public.objection_clauses oc
  join public.campaigns c on c.id = oc.campaign_id and c.slug = p_slug
  left join public.submission_clauses sc on sc.clause_id = oc.id
  left join public.submissions s
    on s.id = sc.submission_id
   and s.is_test = false
   and s.status in ('confirmed_sent', 'server_sent')
  group by oc.code, oc.title_ml, oc.title_en, oc.sort_order
  order by oc.sort_order;
$$;

create or replace function public.constituency_breakdown(p_slug text)
returns table (name_ml text, name_en text, district text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select con.name_ml, con.name_en, con.district, count(distinct s.id)
  from public.constituencies con
  join public.campaigns c on c.slug = p_slug
  left join public.submissions s
    on s.constituency_id = con.id
   and s.campaign_id = c.id
   and s.is_test = false
   and s.status in ('confirmed_sent', 'server_sent')
  group by con.name_ml, con.name_en, con.district
  having count(distinct s.id) > 0
  order by count(distinct s.id) desc;
$$;

create or replace function public.district_breakdown(p_slug text)
returns table (district text, cnt bigint)
language sql
security definer
set search_path = public
stable
as $$
  select s.district, count(distinct s.id)
  from public.submissions s
  join public.campaigns c on c.id = s.campaign_id and c.slug = p_slug
  where s.is_test = false
    and s.status in ('confirmed_sent', 'server_sent')
  group by s.district
  having count(distinct s.id) > 0
  order by count(distinct s.id) desc;
$$;

create or replace function public.participation_timeline(p_slug text)
returns table (day date, prepared bigint, opened bigint, confirmed bigint)
language sql
security definer
set search_path = public
stable
as $$
  with bounds as (
    select
      coalesce(
        min((timezone('Asia/Kolkata', s.created_at))::date),
        (timezone('Asia/Kolkata', now()))::date
      ) as first_day,
      (timezone('Asia/Kolkata', now()))::date as last_day
    from public.submissions s
    join public.campaigns c on c.id = s.campaign_id and c.slug = p_slug
    where s.is_test = false
  ),
  days as (
    select generate_series(b.first_day, b.last_day, interval '1 day')::date as day
    from bounds b
  )
  select
    d.day,
    (
      select count(distinct s.id)
      from public.submissions s
      join public.campaigns c on c.id = s.campaign_id and c.slug = p_slug
      where s.is_test = false
        and s.status in ('verified', 'handoff_opened', 'confirmed_sent', 'server_sent')
        and (timezone('Asia/Kolkata', coalesce(s.verified_at, s.handoff_at, s.confirmed_at, s.created_at)))::date = d.day
    ) as prepared,
    (
      select count(distinct s.id)
      from public.submissions s
      join public.campaigns c on c.id = s.campaign_id and c.slug = p_slug
      where s.is_test = false
        and s.handoff_at is not null
        and (timezone('Asia/Kolkata', s.handoff_at))::date = d.day
    ) as opened,
    (
      select count(distinct s.id)
      from public.submissions s
      join public.campaigns c on c.id = s.campaign_id and c.slug = p_slug
      where s.is_test = false
        and s.status in ('confirmed_sent', 'server_sent')
        and s.confirmed_at is not null
        and (timezone('Asia/Kolkata', s.confirmed_at))::date = d.day
    ) as confirmed
  from days d
  order by d.day;
$$;

grant execute on function public.campaign_stats(text) to anon, authenticated, service_role;
grant execute on function public.clause_breakdown(text) to anon, authenticated, service_role;
grant execute on function public.constituency_breakdown(text) to anon, authenticated, service_role;
grant execute on function public.district_breakdown(text) to anon, authenticated, service_role;
grant execute on function public.participation_timeline(text) to anon, authenticated, service_role;

drop function if exists public.create_submission(
  text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, uuid, uuid[], boolean
);

create function public.create_submission(
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
  v_submission_id uuid;
begin
  select id, is_active into v_campaign_id, v_is_active
  from public.campaigns
  where slug = p_campaign_slug;

  if v_campaign_id is null then
    raise exception 'campaign_not_active';
  end if;

  if p_is_test is not true and v_is_active is not true then
    raise exception 'campaign_not_active';
  end if;

  insert into public.submissions (
    campaign_id, full_name, email, phone_e164, address_line, panchayat,
    district, pincode, language, custom_text, generated_subject, generated_body,
    ip_hash, user_agent, consent_version, constituency_id, cc_representative_ids,
    is_test, generated_to, generated_cc
  ) values (
    v_campaign_id, p_full_name, p_email, p_phone, p_address, p_panchayat,
    p_district, p_pincode, p_language, p_custom_text, p_subject, p_body,
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
