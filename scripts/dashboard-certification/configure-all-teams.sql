-- Apply only to an explicitly authorized environment. No CSVs or identities.
-- The existing global dashboard.view permission is required: intentionally no
-- group mappings, wildcard groups, role grants or changes to Asia scopes.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare
  target uuid := '98991d5e-5cc2-4257-966a-f5865a288f6f';
  source public.vici_report_scopes;
  expected_groups text[] := array['OpenersAsia','OpenersAsia1','OpenersCA','OpenersCO','OpenersMXBJ','OpenersMXBJ1','OpenersNIC','OpenersPH','OpenersTraining','OpenersVZ'];
begin
  perform pg_advisory_xact_lock(hashtext('pulse-dashboard-all-teams-20261011'));
  select * into source from public.vici_report_scopes where id='426ab519-b87b-4410-bd42-e255b240bea1';
  if not found or source.source_key<>'alwaysbeclosing' or not source.enabled
    or source.user_groups<>array['OpenersAsia']
    or source.campaigns<>array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'] then
    raise exception 'Reviewed source configuration required';
  end if;
  if exists(select 1 from public.vici_report_scopes s where s.id=target and
    (s.code<>'garrett-all-teams' or s.label<>'All teams' or s.source_key<>source.source_key
     or s.campaigns<>source.campaigns or s.user_groups<>expected_groups or s.source_time_zone is not null or not s.enabled)) then
    raise exception 'Existing All teams definition differs; review required';
  end if;
  if exists(select 1 from public.vici_group_mappings where scope_id=target) then
    raise exception 'All teams requires existing global access; unexpected group mapping';
  end if;
  insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,source_time_zone,enabled)
    values(target,'garrett-all-teams','All teams',source.source_key,source.campaigns,expected_groups,null,true)
    on conflict(id) do nothing;
end $$;
commit;
