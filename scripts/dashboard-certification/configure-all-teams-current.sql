-- Explicitly authorized environment only. Existing immutable definition and
-- its history remain untouched. No schema, identities, mappings or role grants.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare
  target uuid := '542b1474-29c7-4000-a1be-b0496fd9809d';
  source public.vici_report_scopes;
  previous_groups text[] := array['OpenersAsia','OpenersAsia1','OpenersCA','OpenersCO','OpenersMXBJ','OpenersMXBJ1','OpenersNIC','OpenersPH','OpenersTraining','OpenersVZ'];
  expected_groups text[] := array['OpenersAsia','OpenersAsia1','OpenersCA','OpenersCO','OpenersMXBJ','OpenersMXBJ1','OpenersNIC','OpenersPH','OpenersTraining','OpenersVZ','ADMIN'];
begin
  perform pg_advisory_xact_lock(hashtext('pulse-dashboard-all-teams-20261013'));
  select * into source from public.vici_report_scopes where id='98991d5e-5cc2-4257-966a-f5865a288f6f';
  if not found or source.source_key<>'alwaysbeclosing' or source.code<>'garrett-all-teams'
    or source.label<>'All teams' or not source.enabled or source.user_groups<>previous_groups
    or source.source_time_zone is not null
    or source.campaigns<>array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'] then
    raise exception 'Reviewed earlier general-report definition required';
  end if;
  if exists(select 1 from public.vici_group_mappings where scope_id in (target,source.id)) then
    raise exception 'All teams requires existing global access; unexpected group mapping';
  end if;
  if exists(select 1 from public.vici_report_scopes s where s.id=target and
    (s.code<>'garrett-all-teams-20261013' or s.label<>'All teams' or s.source_key<>source.source_key
     or s.campaigns<>source.campaigns or s.user_groups<>expected_groups or s.source_time_zone is not null or not s.enabled)) then
    raise exception 'Current All teams definition differs; review required';
  end if;
  -- ADMIN is a source group observed in the original Oct 12 export, not a
  -- Pulse role. Only already-global Dashboard readers can access this scope.
  insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,source_time_zone,enabled)
    values(target,'garrett-all-teams-20261013','All teams',source.source_key,source.campaigns,expected_groups,null,true)
    on conflict(id) do nothing;
end $$;
commit;
