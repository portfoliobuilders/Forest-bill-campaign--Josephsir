-- Preview mode, homepage explainers, and dormant notify list.
-- 0005_admin_and_public_stats.sql already exists; this is the next migration.

alter table campaigns
  add column if not exists preview_token text,
  add column if not exists explainer_ml text[] not null default '{}',
  add column if not exists explainer_en text[] not null default '{}';

create unique index if not exists campaigns_preview_token
  on campaigns (preview_token)
  where preview_token is not null;

create table if not exists notify_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  created_at timestamptz not null default now()
);

create unique index if not exists notify_signups_email_normalized
  on notify_signups (email_normalized);

alter table notify_signups enable row level security;

revoke all on table notify_signups from public, anon, authenticated;
grant all on table notify_signups to service_role;

-- Honest demo copy. Never sets is_active. Applies to any seeded campaign row.
update campaigns
set
  preview_token = coalesce(preview_token, encode(gen_random_bytes(24), 'hex')),
  explainer_ml = case
    when cardinality(explainer_ml) = 0 then array[
      'വാച്ചർമാരെ ഫോറസ്റ്റ് ഓഫീസറാക്കി നിയമാധികാരം നൽകും.',
      'വീടിനടുത്തുള്ള പുഴകളെ വനപുഴയായി കാണാം.',
      'സംശയം മാത്രം മതി, വനത്തിന് പുറത്ത് വീട് പരിശോധിക്കാം.',
      'താഴെത്തട്ടിലുള്ള ഉദ്യോഗസ്ഥർക്ക് വാഹനം തടയാനുള്ള അധികാരം കൂടും.',
      'വാറന്റില്ലാതെ അറസ്റ്റ് വനത്തിന് പുറത്തും നടക്കാം.',
      'അറസ്റ്റ് ചെയ്ത ആളെ ഫോറസ്റ്റ് സ്റ്റേഷനിൽ നിർത്താം.'
    ]
    else explainer_ml
  end,
  explainer_en = case
    when cardinality(explainer_en) = 0 then array[
      'Watchers would be treated as Forest Officers with legal powers.',
      'Rivers near homes could be labelled forest rivers.',
      'Homes outside the forest could be searched on mere suspicion.',
      'Junior staff would get wider power to stop vehicles.',
      'Warrantless arrest could happen anywhere, not only in forest.',
      'Arrested people could be held at a forest station.'
    ]
    else explainer_en
  end;

