-- New immutable source definition. No changes to users, grants or old reports.
begin;
do $$
declare source public.vici_report_scopes;
  target uuid := '829f3d68-fbcb-43ec-b6f7-f12e8bcca76f';
  previous_groups text[] := array['OpenersAsia','OpenersAsia1','OpenersCA','OpenersCO','OpenersMXBJ','OpenersMXBJ1','OpenersNIC','OpenersPH','OpenersTraining','OpenersVZ','ADMIN'];
  expected_groups text[] := previous_groups||array['Monitors'];
begin
  perform pg_advisory_xact_lock(hashtext('pulse-dashboard-datasets-20261013'));
  select * into source from public.vici_report_scopes where id='542b1474-29c7-4000-a1be-b0496fd9809d';
  if not found or source.source_key<>'alwaysbeclosing' or source.code<>'garrett-all-teams-20261013'
    or source.label<>'All teams' or not source.enabled or source.user_groups<>previous_groups
    or source.source_time_zone is not null
    or source.campaigns<>array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'] then
    raise exception 'Reviewed general-report definition required';
  end if;
  if exists(select 1 from public.vici_group_mappings where scope_id in (source.id,target)) then
    raise exception 'General reports require existing global access, not new team mappings';
  end if;
  if exists(select 1 from public.vici_report_scopes s where id=target and
    (s.code<>'garrett-all-teams-datasets' or s.label<>'All teams' or s.source_key<>source.source_key
      or s.campaigns<>source.campaigns or s.user_groups<>expected_groups or s.source_time_zone is not null or not s.enabled)) then
    raise exception 'Dataset source differs; review required';
  end if;
  insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled)
    values(target,'garrett-all-teams-datasets','All teams',source.source_key,source.campaigns,expected_groups,true)
    on conflict(id) do nothing;
end $$;
commit;
