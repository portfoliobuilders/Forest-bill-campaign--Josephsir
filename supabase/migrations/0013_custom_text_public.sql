-- Production is missing this column (0005 was not fully applied).
-- Safe to re-run: IF NOT EXISTS.
alter table submissions
  add column if not exists custom_text_public boolean not null default false;
