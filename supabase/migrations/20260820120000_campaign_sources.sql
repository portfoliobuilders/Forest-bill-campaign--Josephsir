-- Campaign supporting sources / newspaper clippings.
-- These are public-page references only. They must never be copied into composed emails.

create table if not exists public.campaign_sources (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  publication_name text not null,
  publication_date date,
  title_ml text not null default '',
  title_en text not null default '',
  description_ml text not null default '',
  description_en text not null default '',
  source_url text,
  file_url text,
  file_path text,
  file_mime text,
  file_name text,
  is_public boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text
);

create index if not exists campaign_sources_campaign_idx
  on public.campaign_sources (campaign_id, sort_order, created_at);

create index if not exists campaign_sources_public_idx
  on public.campaign_sources (campaign_id, is_public, sort_order)
  where is_public;

alter table public.campaign_sources enable row level security;
revoke all on table public.campaign_sources from public, anon, authenticated;
grant all on table public.campaign_sources to service_role;
grant select on table public.campaign_sources to anon, authenticated;

drop policy if exists campaign_sources_public_read on public.campaign_sources;
create policy campaign_sources_public_read
  on public.campaign_sources
  for select
  to anon, authenticated
  using (
    is_public = true
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_id
        and c.is_active
        and c.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket for clippings (images / PDFs)
-- ---------------------------------------------------------------------------

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'campaign-sources',
    'campaign-sources',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
exception
  when others then
    raise notice 'storage.buckets campaign-sources skipped: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'campaign_sources_public_read'
  ) then
    create policy campaign_sources_public_read
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'campaign-sources');
  end if;
exception
  when others then
    raise notice 'storage policy campaign_sources_public_read skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Seed ESA supporting clippings (metadata only; files uploaded in Admin)
-- ---------------------------------------------------------------------------

insert into public.campaign_sources (
  campaign_id,
  publication_name,
  publication_date,
  title_ml,
  title_en,
  description_ml,
  description_en,
  source_url,
  is_public,
  sort_order,
  created_by
)
select
  c.id,
  'Deepika',
  date '2026-08-16',
  'ഇഎസ്എ: ആപകടങ്ങൾ തിരുത്തി ജനപങ്കാളിത്തത്തോടെ വരട്ടെ അന്തിമ വിജ്ഞാപനം',
  'ESA: Let the final notification come with public participation after correcting the errors',
  '16 ഓഗസ്റ്റ് 2026-ലെ ദീപിക (കോഴിക്കോട് പതിപ്പ്) ലേഖനം, പശ്ചിമഘട്ടത്തിൽ 56,825.7 ച.കി.മീ. ESA ആയി നിർദ്ദേശിച്ചതും കേരളത്തിൽ 131 വില്ലേജുകളിലായി 9,993.7 ച.കി.മീ. ഉൾപ്പെടുന്നതും രേഖപ്പെടുത്തുന്നു. അതിർത്തി പിശകുകൾ തിരുത്തി ജനപങ്കാളിത്തത്തോടെ അന്തിമ വിജ്ഞാപനം വരണമെന്ന് ആവശ്യപ്പെടുന്നു.',
  'The 16 August 2026 Deepika (Kozhikode edition) article records the draft ESA figures of 56,825.7 sq. km across the Western Ghats and 9,993.7 sq. km in 131 Kerala villages, and calls for scientific boundary correction with public participation before the final notification.',
  null,
  true,
  1,
  'seed'
from public.campaigns c
where c.slug = 'esa-draft-notification'
  and not exists (
    select 1
    from public.campaign_sources s
    where s.campaign_id = c.id
      and s.publication_name = 'Deepika'
      and s.publication_date = date '2026-08-16'
  );

insert into public.campaign_sources (
  campaign_id,
  publication_name,
  publication_date,
  title_ml,
  title_en,
  description_ml,
  description_en,
  source_url,
  is_public,
  sort_order,
  created_by
)
select
  c.id,
  'Mathrubhumi',
  date '2026-08-12',
  'ഇ.എസ്.എ. അതിർത്തിനിർണയം ശാസ്ത്രീയമായി പുനഃപരിശോധിക്കണം',
  'ESA boundary demarcation should be reviewed scientifically',
  '12 ഓഗസ്റ്റ് 2026-ലെ മാതൃഭൂമി (കോഴിക്കോട്, പേജ് 02) റിപ്പോർട്ട്, കേന്ദ്ര സർക്കാരിന്റെ കരട് വിജ്ഞാപനത്തിലെ ESA അതിർത്തി ഭൂപടങ്ങൾ ശാസ്ത്രീയമായി പുനഃപരിശോധിക്കണമെന്ന് പശ്ചിമഘട്ട ജന സംരക്ഷണ സമിതി ആവശ്യപ്പെട്ടതായി രേഖപ്പെടുത്തുന്നു. നിർദ്ദേശം: പശ്ചിമഘട്ടത്തിൽ 56,825.7 ച.കി.മീ.; കേരളത്തിൽ 131 വില്ലേജുകളിലായി 9,993.7 ച.കി.മീ.',
  'A 12 August 2026 Mathrubhumi report (Kozhikode, page 02) records that Paschimaghatta Jana Samrakshana Samiti asked for a scientific review of ESA boundary maps in the draft notification, citing 56,825.7 sq. km across the Western Ghats and 9,993.7 sq. km in 131 Kerala villages.',
  null,
  true,
  2,
  'seed'
from public.campaigns c
where c.slug = 'esa-draft-notification'
  and not exists (
    select 1
    from public.campaign_sources s
    where s.campaign_id = c.id
      and s.publication_name = 'Mathrubhumi'
      and s.publication_date = date '2026-08-12'
  );
