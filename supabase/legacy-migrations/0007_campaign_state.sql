-- Public campaign state for the Next.js server. Does not return preview_token.
-- SECURITY DEFINER is required so anon can resolve preview without reading the token column.
-- Execute is revoked from PUBLIC, then granted only to anon / authenticated / service_role.

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
  now_ts timestamptz := now();
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
    if rec.is_active and now_ts >= rec.opens_at and now_ts <= rec.deadline_at then
      return jsonb_build_object(
        'state', 'live',
        'campaign', to_jsonb(rec) - 'preview_token'
      );
    end if;

    if rec.is_active is not true and rec.preview_token is not null and tok is not null and rec.preview_token = tok then
      return jsonb_build_object(
        'state', 'preview',
        'campaign', to_jsonb(rec) - 'preview_token'
      );
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
        'campaign', to_jsonb(rec) - 'preview_token'
      );
    end if;
  end if;

  return jsonb_build_object('state', 'dormant');
end;
$$;

revoke all on function public.campaign_public_state(text, text) from public;
grant execute on function public.campaign_public_state(text, text) to anon, authenticated, service_role;

-- Stop REST clients from reading preview_token. The RPC above is the public path.
revoke select, insert, update, delete on table public.campaigns from anon, authenticated;
grant all on table public.campaigns to service_role;
