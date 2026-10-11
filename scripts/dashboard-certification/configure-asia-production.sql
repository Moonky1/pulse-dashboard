-- Production release configuration explicitly authorized 2026-10-11.
-- Target: lhgnbcaundgjeofjrscg. Canonical teams verified read-only before release.
-- No users, grants, identity links, reports, schedules, credentials or timezone guesses.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare
  campaign uuid := '32000000-0000-4000-8000-000000000001';
  a uuid := '426ab519-b87b-4410-bd42-e255b240bea1';
  b uuid := '2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285';
  team_a uuid := '34000000-0000-4000-8000-000000000011';
  team_b uuid := '34000000-0000-4000-8000-000000000012';
  expected_campaigns text[] := array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'];
begin
  perform pg_advisory_xact_lock(hashtext('pulse-dashboard-production-20261011'));
  if (select count(*) from supabase_migrations.schema_migrations where version in ('20261009000100','20261010000100','20261010000200','20261010000300','20261011000100'))<>5 then
    raise exception 'Dashboard schema release incomplete';
  end if;
  if not exists(select 1 from public.campaigns where id=campaign and code='auto_warranty_garrett' and name='Auto Warranty Garrett' and is_active)
    or not exists(select 1 from public.teams where id=team_a and code='asia_team_a' and name='Asia Team A' and campaign_id=campaign and is_active)
    or not exists(select 1 from public.teams where id=team_b and code='asia_team_b' and name='Asia Team B' and campaign_id=campaign and is_active) then
    raise exception 'Canonical Production teams differ from reviewed configuration';
  end if;
  if exists(select 1 from public.vici_report_scopes where source_key='alwaysbeclosing' and id not in(a,b)
    and user_groups && array['OpenersAsia','OpenersAsia1']) then
    raise exception 'Another Asia scope already exists; review before duplicating';
  end if;
  if exists(select 1 from public.vici_report_scopes s where s.id in(a,b) and
    (s.code<>case when s.id=a then 'garrett-asia-a' else 'garrett-asia-b' end or s.source_key<>'alwaysbeclosing'
      or s.campaigns<>expected_campaigns or s.user_groups<>case when s.id=a then array['OpenersAsia'] else array['OpenersAsia1'] end
      or s.source_time_zone is not null or not s.enabled)) then
    raise exception 'Existing Production scope differs from approved definition';
  end if;
  if exists(select 1 from public.vici_group_mappings where scope_id in(a,b) and
    ((scope_id=a and vici_user_group='OpenersAsia' and team_id=team_a and campaign_id=campaign)
     or (scope_id=b and vici_user_group='OpenersAsia1' and team_id=team_b and campaign_id=campaign)) is not true) then
    raise exception 'Existing Production mapping differs from approved definition';
  end if;
  insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,source_time_zone,enabled) values
    (a,'garrett-asia-a','Asia A · OpenersAsia','alwaysbeclosing',expected_campaigns,array['OpenersAsia'],null,true),
    (b,'garrett-asia-b','Asia B · OpenersAsia1','alwaysbeclosing',expected_campaigns,array['OpenersAsia1'],null,true)
    on conflict(id) do nothing;
  insert into public.vici_group_mappings(scope_id,vici_user_group,campaign_id,team_id) values
    (a,'OpenersAsia',campaign,team_a),(b,'OpenersAsia1',campaign,team_b)
    on conflict(scope_id,vici_user_group) do nothing;
end $$;
notify pgrst,'reload schema';
commit;
select s.id,s.label,s.enabled,m.vici_user_group,t.name team from public.vici_report_scopes s
join public.vici_group_mappings m on m.scope_id=s.id join public.teams t on t.id=m.team_id where s.id in
('426ab519-b87b-4410-bd42-e255b240bea1','2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285');
