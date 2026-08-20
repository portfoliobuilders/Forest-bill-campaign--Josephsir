create extension if not exists pgcrypto;

create type send_method       as enum ('gmail_web','mailto','copy','server','print');
create type submission_status as enum ('draft','verified','handoff_opened','confirmed_sent','server_sent','failed');

create table campaigns (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title_ml        text not null,
  title_en        text not null,
  summary_ml      text not null,
  summary_en      text not null,
  recipient_email text not null,
  cc_emails       text[] not null default '{}',
  subject_ml      text not null,
  subject_en      text not null,
  intro_ml        text not null,
  intro_en        text not null,
  closing_ml      text not null,
  closing_en      text not null,
  source_url      text not null,
  opens_at        timestamptz not null default now(),
  deadline_at     timestamptz not null,
  is_active       boolean not null default false,
  created_at      timestamptz not null default now()
);

create table objection_clauses (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  code        text not null,
  section_ref text,
  title_ml    text not null,
  title_en    text not null,
  explain_ml  text not null,
  explain_en  text not null,
  email_ml    text not null,
  email_en    text not null,
  full_url    text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  unique (campaign_id, code),
  constraint email_ml_len check (char_length(email_ml) <= 220),
  constraint email_en_len check (char_length(email_en) <= 220)
);

create table submissions (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references campaigns(id) on delete cascade,
  full_name         text not null,
  email             text not null,
  email_normalized  text generated always as (lower(trim(email))) stored,
  phone_e164        text,
  address_line      text not null,
  panchayat         text,
  district          text not null,
  pincode           text,
  language          text not null default 'ml',
  custom_text       text,
  generated_subject text not null,
  generated_body    text not null,
  send_method       send_method,
  status            submission_status not null default 'draft',
  show_name_public  boolean not null default false,
  verified_at       timestamptz,
  handoff_at        timestamptz,
  confirmed_at      timestamptz,
  ip_hash           text,
  user_agent        text,
  consent_version   text not null,
  consent_at        timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create unique index submissions_dedupe
  on submissions (campaign_id, email_normalized)
  where status in ('verified','handoff_opened','confirmed_sent','server_sent');

create index submissions_campaign_status on submissions (campaign_id, status);
create index submissions_district        on submissions (campaign_id, district);
create index submissions_created         on submissions (created_at desc);

create table submission_clauses (
  submission_id uuid not null references submissions(id) on delete cascade,
  clause_id     uuid not null references objection_clauses(id) on delete cascade,
  primary key (submission_id, clause_id)
);

create table otp_codes (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  code_hash     text not null,
  attempts      int not null default 0,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index otp_submission on otp_codes (submission_id);

create table rate_limits (
  bucket       text not null,
  identifier   text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (bucket, identifier, window_start)
);

create table deletion_requests (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  reason     text,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
