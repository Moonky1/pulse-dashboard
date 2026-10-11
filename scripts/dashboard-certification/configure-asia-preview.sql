-- Explicit Preview configuration, not a schema migration or a production seed.
-- Target only Pulse Preview (sgshbawggqapuyqzkyhs). Operator-confirmed 2026-10-11.
-- Does not create users, assign roles, link identities or rewrite saved reports.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare
  a uuid := '426ab519-b87b-4410-bd42-e255b240bea1';
  b uuid := '2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285';
  campaign uuid := '32000000-0000-4000-8000-000000000001';
  team_a uuid := '34000000-0000-4000-8000-000000000011';
  team_b uuid := '34000000-0000-4000-8000-000000000012';
  expected_campaigns text[] := array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'];
  s public.vici_report_scopes;
begin
  perform pg_advisory_xact_lock(hashtext('pulse-asia-preview-20261011'));
  select * into s from public.vici_report_scopes where id=a for update;
  if not found or s.code<>'garrett-openers-preview' or s.source_key<>'alwaysbeclosing'
    or s.user_groups<>array['OpenersAsia'] or s.campaigns<>expected_campaigns
    or s.source_time_zone is not null or not s.enabled then
    raise exception 'Preview Asia A source differs from the reviewed configuration';
  end if;
  if not exists(select 1 from public.teams where id=team_a and code='asia_team_a' and name='Asia Team A' and campaign_id=campaign and is_active)
    or not exists(select 1 from public.teams where id=team_b and code='asia_team_b' and name='Asia Team B' and campaign_id=campaign and is_active) then
    raise exception 'Canonical Asia teams differ from reviewed Preview configuration';
  end if;
  if exists(select 1 from public.vici_report_scopes where id<>b and
      (code='garrett-asia-b-preview' or (source_key=s.source_key and user_groups @> array['OpenersAsia1']))) then
    raise exception 'Another Asia B scope already exists; review instead of duplicating';
  end if;
  if exists(select 1 from public.vici_report_scopes where id=b and
      (code<>'garrett-asia-b-preview' or source_key<>s.source_key or campaigns<>s.campaigns
       or user_groups<>array['OpenersAsia1'] or source_time_zone is distinct from s.source_time_zone or not enabled)) then
    raise exception 'Preview Asia B source differs from the reviewed configuration';
  end if;
  if exists(select 1 from public.vici_group_mappings where scope_id in (a,b) and
      ((scope_id=a and vici_user_group='OpenersAsia' and team_id=team_a and campaign_id=campaign)
       or (scope_id=b and vici_user_group='OpenersAsia1' and team_id=team_b and campaign_id=campaign)) is not true) then
    raise exception 'Existing mapping conflicts with the confirmed Asia teams';
  end if;
  insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,source_time_zone,enabled)
    values(b,'garrett-asia-b-preview','Asia B · OpenersAsia1',s.source_key,s.campaigns,array['OpenersAsia1'],s.source_time_zone,true)
    on conflict(id) do nothing;
  insert into public.vici_group_mappings(scope_id,vici_user_group,campaign_id,team_id)
    values(a,'OpenersAsia',campaign,team_a),(b,'OpenersAsia1',campaign,team_b)
    on conflict(scope_id,vici_user_group) do nothing;
  update public.vici_report_scopes set label='Asia A · OpenersAsia' where id=a;
end $$;
commit;
