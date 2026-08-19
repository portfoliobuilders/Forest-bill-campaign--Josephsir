-- SECURITY DEFINER functions in public must not be callable with the Data API
-- anon/authenticated keys. The Next.js server uses the service role.
-- rls_auto_enable is an event-trigger helper (ensure_rls); it is not an RPC.

revoke all on function public.campaign_public_state(text, text) from public, anon, authenticated;
grant execute on function public.campaign_public_state(text, text) to service_role;

revoke all on function public.campaign_stats(text) from public, anon, authenticated;
grant execute on function public.campaign_stats(text) to service_role;

revoke all on function public.clause_breakdown(text) from public, anon, authenticated;
grant execute on function public.clause_breakdown(text) to service_role;

revoke all on function public.constituency_breakdown(text) from public, anon, authenticated;
grant execute on function public.constituency_breakdown(text) to service_role;

revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role;
