create type rep_level as enum ('mla','mp_lok_sabha','mp_rajya_sabha','minister','local_body');

create table constituencies (
  id        uuid primary key default gen_random_uuid(),
  code      text unique not null,
  name_en   text not null,
  name_ml   text not null,
  district  text not null,
  level     rep_level not null default 'mla',
  is_active boolean not null default true
);

create table representatives (
  id              uuid primary key default gen_random_uuid(),
  constituency_id uuid references constituencies(id) on delete set null,
  name_en         text not null,
  name_ml         text not null,
  level           rep_level not null,
  party           text,
  front           text,
  official_email  text,
  office_phone    text,
  portfolio       text,
  term_start      date not null,
  term_end        date,
  source_url      text not null,
  verified_at     timestamptz not null,
  is_current      boolean not null default true
);
create index representatives_current on representatives (constituency_id) where is_current = true;

create table locality_constituency (
  id              uuid primary key default gen_random_uuid(),
  pincode         text,
  panchayat_name  text,
  district        text not null,
  constituency_id uuid not null references constituencies(id) on delete cascade,
  confidence      text not null default 'exact'
);
create index locality_pincode on locality_constituency (pincode);

alter table submissions
  add column constituency_id uuid references constituencies(id),
  add column cc_representative_ids uuid[] not null default '{}';

create index submissions_constituency on submissions (campaign_id, constituency_id);
