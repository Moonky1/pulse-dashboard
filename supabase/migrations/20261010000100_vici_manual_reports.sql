-- DASHBOARD manual CSV checkpoint. Preview only until a separate Production approval.
begin;
alter table public.vici_sync_runs
  add column ingestion_method text not null default 'automatic' check(ingestion_method in ('automatic','manual')),
  add column uploaded_by uuid references public.users(id),
  add column validation_summary jsonb,
  add constraint vici_manual_actor check((ingestion_method='manual')=(uploaded_by is not null));
-- Raw CSV/files and credentials are never persisted.
create function pulse_private.vici_import_actor(actor uuid)
returns uuid language sql stable security definer set search_path=pg_catalog as $$
  select u.id from public.users u where u.auth_user_id=actor and u.status='active'
    and exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id and r.is_active
      join public.role_permissions rp on rp.role_id=r.id
      join public.permissions p on p.id=rp.permission_id and p.is_active and p.key='dashboard.view'
      where ur.user_id=u.id and ur.scope_type='global' and r.key in ('admin','super_admin'));
$$;
revoke all on function pulse_private.vici_import_actor(uuid) from public,anon,authenticated,service_role;
create function public.can_import_vici_reports(requested_scope uuid)
returns boolean language sql stable security definer set search_path=pg_catalog as $$
  select pulse_private.vici_import_actor(auth.uid()) is not null
    and exists(select 1 from public.vici_report_scopes where id=requested_scope and enabled);
$$;
revoke all on function public.can_import_vici_reports(uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_import_vici_reports(uuid) to authenticated;

create or replace function public.complete_vici_sync(requested_run uuid,pair jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.vici_sync_runs; h public.vici_integration_health; existing public.vici_sync_runs;
  perf jsonb; pauses jsonb; fingerprint text; perf_time timestamp; pause_time timestamp; item jsonb;
begin
  select * into r from public.vici_sync_runs where id=requested_run;
  if not found then raise exception 'Run unavailable' using errcode='22023'; end if;
  select * into h from public.vici_integration_health where scope_id=r.scope_id for update;
  if r.status<>'running' or (r.ingestion_method='automatic' and
    (h.active_run_id is distinct from r.id or h.lease_until<=clock_timestamp())) then
    raise exception 'Stale run' using errcode='40001';
  end if;
  if jsonb_typeof(pair) is distinct from 'object' or
    pair - array['performance','pause','warning_categories'] <> '{}'::jsonb then
    raise exception 'Invalid normalized pair' using errcode='22023';
  end if;
  perf=pair->'performance'; pauses=pair->'pause';
  foreach item in array array[perf,pauses] loop
    if jsonb_typeof(item) is distinct from 'object' or
      item - array['source_generated_at','ingested_at','rows'] <> '{}'::jsonb or
      jsonb_typeof(item->'rows') is distinct from 'array' or
      jsonb_array_length(item->'rows') not between 1 and 20000 or
      item->>'source_generated_at' is null or item->>'ingested_at' is null then
      raise exception 'Invalid normalized report' using errcode='22023';
    end if;
  end loop;
  if pg_column_size(pair)>10000000 or jsonb_typeof(pair->'warning_categories') is distinct from 'array' or
    exists(select 1 from jsonb_array_elements_text(pair->'warning_categories') w
      where w not in ('unnamed_columns','extra_disposition_columns','extra_pause_columns','missing_totals','totals_mismatch','unmapped_totals_not_comparable','report_agent_sets_differ')) then
    raise exception 'Invalid normalized metadata' using errcode='22023';
  end if;
  perf_time=(perf->>'source_generated_at')::timestamp; pause_time=(pauses->>'source_generated_at')::timestamp;
  if (perf->>'ingested_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' or (pauses->>'ingested_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' then
    raise exception 'Ingestion offset required' using errcode='22023';
  end if;
  -- SQL derives identity and hash. Row order and ingestion time do not affect idempotency.
  select encode(extensions.digest(convert_to(jsonb_build_array(
    (select jsonb_agg(v order by v->>'agent_code') from jsonb_array_elements(perf->'rows') v),
    (select jsonb_agg(v order by v->>'agent_code') from jsonb_array_elements(pauses->'rows') v))::text,'UTF8'),'sha256'),'hex') into fingerprint;
  select * into existing from public.vici_sync_runs where scope_id=r.scope_id and status='success'
    and requested_from=r.requested_from and requested_to=r.requested_to
    and performance_generated_at=perf_time and pause_generated_at=pause_time;
  if found and existing.content_hash<>fingerprint then raise exception 'Source identity conflict' using errcode='22023'; end if;
  if existing.id is null then
    if exists(select 1 from jsonb_array_elements(perf->'rows') v where v -
      array['agent_code','vici_user_name','current_user_group','most_recent_user_group','calls','time_seconds','pause_seconds','pause_avg_seconds','wait_seconds','wait_avg_seconds','talk_seconds','talk_avg_seconds','dispo_seconds','dispo_avg_seconds','dead_seconds','dead_avg_seconds','customer_seconds','customer_avg_seconds','xfer_count','dispositions','unmapped_columns'] <> '{}'::jsonb)
      or exists(select 1 from jsonb_array_elements(pauses->'rows') v where v -
      array['agent_code','vici_user_name','current_user_group','most_recent_user_group','total_seconds','nonpause_seconds','pause_seconds','break_seconds','cb_seconds','dcmx_seconds','dismx_seconds','lagged_seconds','login_seconds','lunch_seconds','manage_seconds','rr_seconds','tech_seconds','other_pause_seconds','unmapped_columns'] <> '{}'::jsonb) then
      raise exception 'Unexpected normalized fields' using errcode='22023';
    end if;
    insert into public.vici_agent_performance_snapshots(sync_run_id,agent_code,vici_user_name,current_user_group,most_recent_user_group,calls,time_seconds,pause_seconds,pause_avg_seconds,wait_seconds,wait_avg_seconds,talk_seconds,talk_avg_seconds,dispo_seconds,dispo_avg_seconds,dead_seconds,dead_avg_seconds,customer_seconds,customer_avg_seconds,xfer_count,dispositions,unmapped_columns)
      select r.id,agent_code,vici_user_name,current_user_group,most_recent_user_group,calls,time_seconds,pause_seconds,pause_avg_seconds,wait_seconds,wait_avg_seconds,talk_seconds,talk_avg_seconds,dispo_seconds,dispo_avg_seconds,dead_seconds,dead_avg_seconds,customer_seconds,customer_avg_seconds,xfer_count,dispositions,unmapped_columns
      from jsonb_populate_recordset(null::public.vici_agent_performance_snapshots,perf->'rows');
    insert into public.vici_agent_pause_snapshots(sync_run_id,agent_code,vici_user_name,current_user_group,most_recent_user_group,total_seconds,nonpause_seconds,pause_seconds,break_seconds,cb_seconds,dcmx_seconds,dismx_seconds,lagged_seconds,login_seconds,lunch_seconds,manage_seconds,rr_seconds,tech_seconds,other_pause_seconds,unmapped_columns)
      select r.id,agent_code,vici_user_name,current_user_group,most_recent_user_group,total_seconds,nonpause_seconds,pause_seconds,break_seconds,cb_seconds,dcmx_seconds,dismx_seconds,lagged_seconds,login_seconds,lunch_seconds,manage_seconds,rr_seconds,tech_seconds,other_pause_seconds,unmapped_columns
      from jsonb_populate_recordset(null::public.vici_agent_pause_snapshots,pauses->'rows');
  end if;
  update public.vici_sync_runs set status=case when existing.id is null then 'success' else 'duplicate' end,
    completed_at=clock_timestamp(),performance_generated_at=perf_time,pause_generated_at=pause_time,
    performance_ingested_at=(perf->>'ingested_at')::timestamptz,pause_ingested_at=(pauses->>'ingested_at')::timestamptz,
    performance_row_count=jsonb_array_length(perf->'rows'),pause_row_count=jsonb_array_length(pauses->'rows'),
    content_hash=fingerprint,warning_categories=array(select jsonb_array_elements_text(pair->'warning_categories')),
    duplicate_of=existing.id where id=r.id;
  update public.vici_integration_health set active_run_id=null,lease_until=null,
    last_success_at=clock_timestamp(),last_error_category=null,consecutive_failures=0 where scope_id=r.scope_id and r.ingestion_method='automatic';
  return jsonb_build_object('status',case when existing.id is null then 'success' else 'duplicate' end,
    'snapshot_run_id',coalesce(existing.id,r.id));
end $$;


-- Only the server parser may call this; actor_auth_id comes from auth.getUser(),
-- not the upload payload. The role is rechecked in the committing transaction.
create function public.import_vici_reports(requested_scope uuid, report_date date, actor_auth_id uuid, pair jsonb, verification jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor_id uuid; s public.vici_report_scopes; run_id uuid; result jsonb;
begin
  actor_id=pulse_private.vici_import_actor(actor_auth_id);
  if actor_id is null then raise exception 'Import access denied' using errcode='42501'; end if;
  select * into s from public.vici_report_scopes where id=requested_scope and enabled;
  if not found or report_date is null then raise exception 'Invalid import scope' using errcode='22023'; end if;
  if jsonb_typeof(verification) is distinct from 'object' or
    verification - array['performance','pause','scope_attested'] <> '{}'::jsonb or
    verification->>'scope_attested' is distinct from 'true' or
    jsonb_typeof(verification->'performance') is distinct from 'object' or
    jsonb_typeof(verification->'pause') is distinct from 'object' or
    pg_column_size(verification)>100000 then
    raise exception 'Invalid import verification' using errcode='22023';
  end if;
  -- Group membership is enforceable from these exports; campaign filters are
  -- not encoded in the CSV and are explicitly attested by the uploader.
  if exists(select 1 from (
      select v from jsonb_array_elements(pair#>'{performance,rows}') v
      union all select v from jsonb_array_elements(pair#>'{pause,rows}') v) q
      where v->>'current_user_group' is null or not (v->>'current_user_group'=any(s.user_groups))) then
    raise exception 'Report group differs from scope' using errcode='22023';
  end if;
  if (select array_agg(v->>'agent_code' order by v->>'agent_code') from jsonb_array_elements(pair#>'{performance,rows}') v)
     is distinct from
     (select array_agg(v->>'agent_code' order by v->>'agent_code') from jsonb_array_elements(pair#>'{pause,rows}') v) then
    raise exception 'Report agent sets differ' using errcode='22023';
  end if;
  -- Share the collector lock, but never reset its failure/backoff/lease/health.
  insert into public.vici_integration_health(scope_id) values(s.id) on conflict do nothing;
  perform 1 from public.vici_integration_health where scope_id=s.id for update;
  if exists(select 1 from public.vici_sync_runs where scope_id=s.id and ingestion_method='manual'
      and started_at>clock_timestamp()-interval '5 seconds') then
    raise exception 'Import cooldown' using errcode='P0001';
  end if;
  insert into public.vici_sync_runs(scope_id,requested_from,requested_to,scope_definition,ingestion_method,uploaded_by,validation_summary)
    values(s.id,report_date::timestamp,report_date::timestamp+interval '23:59:59',
      jsonb_build_object('source_key',s.source_key,'campaigns',s.campaigns,'user_groups',s.user_groups,'source_time_zone',s.source_time_zone),
      'manual',actor_id,verification) returning id into run_id;
  result=public.complete_vici_sync(run_id,pair);
  return result||jsonb_build_object('report_date',report_date,'ingestion_method','manual');
end $$;
revoke all on function public.import_vici_reports(uuid,date,uuid,jsonb,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.import_vici_reports(uuid,date,uuid,jsonb,jsonb) to service_role;
create or replace function public.get_vici_dashboard(requested_scope uuid,report_date date)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare s public.vici_report_scopes; r public.vici_sync_runs; h public.vici_integration_health;
begin
  perform pulse_private.current_training_staff_user_id();
  if not pulse_private.vici_scope_reader(requested_scope) then raise exception 'Dashboard access denied' using errcode='42501'; end if;
  if report_date is null then raise exception 'Explicit source date required' using errcode='22023'; end if;
  select * into s from public.vici_report_scopes where id=requested_scope;
  select * into h from public.vici_integration_health where scope_id=s.id;
  select * into r from public.vici_sync_runs where scope_id=s.id and status='success'
    and requested_from=report_date::timestamp and requested_to=report_date::timestamp+interval '23:59:59'
    order by performance_generated_at desc,pause_generated_at desc,completed_at desc limit 1;
  -- Do not leak moved/unmapped identities through a group's scoped grant.
  if exists(select 1 from (
      select current_user_group,most_recent_user_group from public.vici_agent_performance_snapshots where sync_run_id=r.id
      union all select current_user_group,most_recent_user_group from public.vici_agent_pause_snapshots where sync_run_id=r.id) v
    where not pulse_private.vici_group_reader(s.id,v.current_user_group)
       or not pulse_private.vici_group_reader(s.id,v.most_recent_user_group)) then
    raise exception 'Dashboard mapping incomplete' using errcode='42501';
  end if;
  return jsonb_build_object('scope',jsonb_build_object('id',s.id,'label',s.label,'user_groups',s.user_groups,
      'source_time_zone',s.source_time_zone),'date',report_date,
    'health',jsonb_build_object('connected',h.last_success_at is not null and not coalesce(h.halted,false)
        and (h.last_failure_at is null or h.last_failure_at<h.last_success_at)
        and h.last_success_at>now()-interval '150 seconds',
      'last_successful_sync',h.last_success_at,'last_failed_sync',h.last_failure_at,
      'last_error_category',h.last_error_category,'requires_ip_validation',coalesce(h.last_error_category='requires_ip_validation',false),
      'halted',coalesce(h.halted,false)),
    'snapshot',case when r.id is null then null else jsonb_build_object('id',r.id,
      'performance_generated_at',r.performance_generated_at,'pause_generated_at',r.pause_generated_at,
      'performance_ingested_at',r.performance_ingested_at,'pause_ingested_at',r.pause_ingested_at,
      'captured_at',r.completed_at,'warnings',r.warning_categories,
      'ingestion_method',r.ingestion_method,'uploaded_by',case when r.uploaded_by is not null then
        (select u.full_name from public.users u where u.id=r.uploaded_by) end,
      'validation_summary',r.validation_summary) end,
    'performance',coalesce((select jsonb_agg((to_jsonb(p)-'sync_run_id') ||
      jsonb_build_object('linked',a.id is not null,'profile_agent_code',case when a.id is not null then a.agent_code end,
        'team_name',t.name) order by p.agent_code)
      from public.vici_agent_performance_snapshots p
      left join public.agents a on a.agent_code=p.agent_code
      left join public.vici_group_mappings m on m.scope_id=s.id and m.vici_user_group=p.current_user_group
      left join public.teams t on t.id=m.team_id
      where p.sync_run_id=r.id),'[]'::jsonb),
    'pause',coalesce((select jsonb_agg(to_jsonb(p)-'sync_run_id' order by p.agent_code)
      from public.vici_agent_pause_snapshots p where p.sync_run_id=r.id),'[]'::jsonb));
end $$;

create or replace function public.list_vici_dashboard_scopes()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  perform pulse_private.current_training_staff_user_id();
  return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'label',s.label,'user_groups',s.user_groups,
      'source_time_zone',s.source_time_zone,'campaigns',s.campaigns,'can_import',public.can_import_vici_reports(s.id)) order by s.label)
    from public.vici_report_scopes s where pulse_private.vici_scope_reader(s.id)),'[]'::jsonb);
end $$;


create function public.get_vici_dashboard_snapshot(requested_scope uuid,requested_snapshot uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare s public.vici_report_scopes; r public.vici_sync_runs; h public.vici_integration_health; report_date date;
begin
  perform pulse_private.current_training_staff_user_id();
  if not pulse_private.vici_scope_reader(requested_scope) then raise exception 'Dashboard access denied' using errcode='42501'; end if;

  select * into s from public.vici_report_scopes where id=requested_scope;
  select * into h from public.vici_integration_health where scope_id=s.id;
  select * into r from public.vici_sync_runs where scope_id=s.id and status='success'
    and id=requested_snapshot;
  if not found then raise exception 'Snapshot unavailable' using errcode='22023'; end if;
  report_date=r.requested_from::date;
  -- Do not leak moved/unmapped identities through a group's scoped grant.
  if exists(select 1 from (
      select current_user_group,most_recent_user_group from public.vici_agent_performance_snapshots where sync_run_id=r.id
      union all select current_user_group,most_recent_user_group from public.vici_agent_pause_snapshots where sync_run_id=r.id) v
    where not pulse_private.vici_group_reader(s.id,v.current_user_group)
       or not pulse_private.vici_group_reader(s.id,v.most_recent_user_group)) then
    raise exception 'Dashboard mapping incomplete' using errcode='42501';
  end if;
  return jsonb_build_object('scope',jsonb_build_object('id',s.id,'label',s.label,'user_groups',s.user_groups,
      'source_time_zone',s.source_time_zone),'date',report_date,
    'health',jsonb_build_object('connected',h.last_success_at is not null and not coalesce(h.halted,false)
        and (h.last_failure_at is null or h.last_failure_at<h.last_success_at)
        and h.last_success_at>now()-interval '150 seconds',
      'last_successful_sync',h.last_success_at,'last_failed_sync',h.last_failure_at,
      'last_error_category',h.last_error_category,'requires_ip_validation',coalesce(h.last_error_category='requires_ip_validation',false),
      'halted',coalesce(h.halted,false)),
    'snapshot',case when r.id is null then null else jsonb_build_object('id',r.id,
      'performance_generated_at',r.performance_generated_at,'pause_generated_at',r.pause_generated_at,
      'performance_ingested_at',r.performance_ingested_at,'pause_ingested_at',r.pause_ingested_at,
      'captured_at',r.completed_at,'warnings',r.warning_categories,
      'ingestion_method',r.ingestion_method,'uploaded_by',case when r.uploaded_by is not null then
        (select u.full_name from public.users u where u.id=r.uploaded_by) end,
      'validation_summary',r.validation_summary) end,
    'performance',coalesce((select jsonb_agg((to_jsonb(p)-'sync_run_id') ||
      jsonb_build_object('linked',a.id is not null,'profile_agent_code',case when a.id is not null then a.agent_code end,
        'team_name',t.name) order by p.agent_code)
      from public.vici_agent_performance_snapshots p
      left join public.agents a on a.agent_code=p.agent_code
      left join public.vici_group_mappings m on m.scope_id=s.id and m.vici_user_group=p.current_user_group
      left join public.teams t on t.id=m.team_id
      where p.sync_run_id=r.id),'[]'::jsonb),
    'pause',coalesce((select jsonb_agg(to_jsonb(p)-'sync_run_id' order by p.agent_code)
      from public.vici_agent_pause_snapshots p where p.sync_run_id=r.id),'[]'::jsonb));
end $$;



create function public.list_vici_report_history(requested_scope uuid,report_date date,page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  perform pulse_private.current_training_staff_user_id();
  if not pulse_private.vici_scope_reader(requested_scope) then raise exception 'Dashboard access denied' using errcode='42501'; end if;
  if report_date is null or page_offset is null or page_offset<0 or page_offset>100000 then raise exception 'Invalid history request' using errcode='22023'; end if;
  return coalesce((select jsonb_agg(to_jsonb(h) order by performance_generated_at desc,pause_generated_at desc,id) from (
    select r.id,r.performance_generated_at,r.pause_generated_at,r.completed_at as captured_at,r.ingestion_method,
      r.performance_row_count as agents,(select sum(p.calls) from public.vici_agent_performance_snapshots p where p.sync_run_id=r.id) as calls,
      (select u.full_name from public.users u where u.id=r.uploaded_by) as uploaded_by
    from public.vici_sync_runs r
    where r.scope_id=requested_scope and r.status='success' and r.requested_from=report_date::timestamp
      and not exists(select 1 from (
        select current_user_group,most_recent_user_group from public.vici_agent_performance_snapshots where sync_run_id=r.id
        union all select current_user_group,most_recent_user_group from public.vici_agent_pause_snapshots where sync_run_id=r.id) v
        where not pulse_private.vici_group_reader(requested_scope,v.current_user_group)
           or not pulse_private.vici_group_reader(requested_scope,v.most_recent_user_group))
    order by r.performance_generated_at desc,r.pause_generated_at desc,r.id limit 51 offset page_offset
  ) h),'[]'::jsonb);
end $$;
revoke all on function public.get_vici_dashboard_snapshot(uuid,uuid),public.list_vici_report_history(uuid,date,integer) from public,anon,authenticated,service_role;
grant execute on function public.get_vici_dashboard_snapshot(uuid,uuid),public.list_vici_report_history(uuid,date,integer) to authenticated;

commit;
