-- Campaign content is owned by migrations.
-- 20260820053000_replace_forest_bill_with_esa.sql creates the live ESA campaign.
--
-- This file previously inserted the Kerala Forest (Amendment) Bill, 2024 campaign.
-- That seed is retired so `supabase db reset` cannot restore the old campaign.

delete from public.campaigns
where slug in ('kerala-forest-amendment-2024', 'demo')
   or title_en ilike '%Kerala Forest%'
   or title_en ilike '%Forest (Amendment)%'
   or title_en ilike '%Forest Amendment%';
