-- Per-campaign concern selection: single vs multiple, optional max,
-- and whether citizens can add a free-text concern.

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
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_concern_selection_mode_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_concern_selection_mode_check
      check (concern_selection_mode in ('single', 'multiple'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_max_concern_selections_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_max_concern_selections_check
      check (max_concern_selections is null or max_concern_selections >= 1);
  end if;
end $$;

-- ESA draft notification: one predefined concern + optional custom concern.
update public.campaigns
set
  concern_selection_mode = 'single',
  max_concern_selections = null,
  allow_custom_concern = true
where
  slug ilike '%esa%'
  or title_en ilike '%ecologically sensitive%'
  or title_en ilike '%ESA%';
