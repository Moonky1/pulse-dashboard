-- DASHBOARD-1: additive storage and protected reads. No source scope is enabled here.
-- No credentials, raw CSV, scheduled jobs or business roster are created.
begin;

create function pulse_private.vici_counts_valid(value jsonb)
returns boolean language sql immutable set search_path=pg_catalog as $$
  select case when jsonb_typeof(value)='object' then not exists (
    select 1 from jsonb_each(value) e where length(e.key)>100 or e.key=''
      or jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[0-9]+$'
      or length(e.value::text)>16 or e.value::numeric>9007199254740991
  ) else false end
$$;
revoke all on function pulse_private.vici_counts_valid(jsonb) from public,anon,authenticated,service_role;

create table public.vici_report_scopes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check(code ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  label text not null check(length(btrim(label)) between 1 and 120),
  source_key text not null check(source_key ~ '^[a-z0-9_-]{1,64}$'),
  campaigns text[] not null check(cardinality(campaigns) between 1 and 100 and array_position(campaigns,null) is null),
  user_groups text[] not null check(cardinality(user_groups) between 1 and 100 and array_position(user_groups,null) is null),
  source_time_zone text,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);
create function pulse_private.vici_scope_guard()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  if new.source_time_zone is not null and not exists(select 1 from pg_timezone_names where name=new.source_time_zone) then
    raise exception 'Invalid source timezone' using errcode='22023';
  end if;
  if exists(select 1 from unnest(new.campaigns||new.user_groups) v where length(btrim(v)) not between 1 and 100 or v<>btrim(v) or v ~ '[[:cntrl:]]') then
    raise exception 'Invalid report scope' using errcode='22023';
  end if;
  if tg_op='UPDATE' and (new.source_key,new.campaigns,new.user_groups,new.source_time_zone) is distinct from
    (old.source_key,old.campaigns,old.user_groups,old.source_time_zone) then
    raise exception 'Create a new scope for a different source definition' using errcode='22023';
  end if;
  return new;
end $$;
revoke all on function pulse_private.vici_scope_guard() from public,anon,authenticated,service_role;
create trigger vici_scope_guard before insert or update on public.vici_report_scopes
for each row execute function pulse_private.vici_scope_guard();

create table public.vici_group_mappings (
  scope_id uuid not null references public.vici_report_scopes(id),
  vici_user_group text not null check(length(btrim(vici_user_group)) between 1 and 100),
  campaign_id uuid references public.campaigns(id),
  team_id uuid references public.teams(id),
  primary key(scope_id,vici_user_group),
  check(campaign_id is not null or team_id is not null)
);

create table public.vici_sync_runs (
  id uuid primary key default gen_random_uuid(),
  scope_id uuid not null references public.vici_report_scopes(id),
  report_type text not null default 'performance_and_pause' check(report_type='performance_and_pause'),
  requested_from timestamp not null,
  requested_to timestamp not null,
  scope_definition jsonb not null,
  started_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  status text not null default 'running' check(status in ('running','success','duplicate','failed')),
  performance_generated_at timestamp,
  pause_generated_at timestamp,
  performance_ingested_at timestamptz,
  pause_ingested_at timestamptz,
  performance_row_count integer check(performance_row_count between 1 and 20000),
  pause_row_count integer check(pause_row_count between 1 and 20000),
  content_hash text check(content_hash ~ '^[a-f0-9]{64}$'),
  warning_categories text[] not null default '{}',
  error_category text,
  duplicate_of uuid references public.vici_sync_runs(id),
  check(requested_from::date=requested_to::date and requested_from<=requested_to)
);
create unique index vici_success_identity on public.vici_sync_runs(scope_id,requested_from,requested_to,performance_generated_at,pause_generated_at)
where status='success';
create index vici_runs_latest on public.vici_sync_runs(scope_id,requested_from,performance_generated_at desc,pause_generated_at desc) where status='success';

create table public.vici_integration_health (
  scope_id uuid primary key references public.vici_report_scopes(id),
  active_run_id uuid references public.vici_sync_runs(id),
  lease_until timestamptz,
  next_attempt_at timestamptz,
  halted boolean not null default false,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error_category text,
  consecutive_failures integer not null default 0 check(consecutive_failures>=0)
);
create table public.vici_agent_performance_snapshots (
  sync_run_id uuid not null references public.vici_sync_runs(id) on delete cascade,
  agent_code text not null check(agent_code ~ '^[0-9]{1,32}$'),
  captured_at timestamptz not null default clock_timestamp(),
  vici_user_name text not null check(length(btrim(vici_user_name)) between 1 and 240),
  current_user_group text check(length(current_user_group)<=100),
  most_recent_user_group text check(length(most_recent_user_group)<=100),
  calls bigint not null check(calls between 0 and 9007199254740991),
  time_seconds bigint not null check(time_seconds between 0 and 9007199254740991),
  pause_seconds bigint not null check(pause_seconds between 0 and 9007199254740991),
  pause_avg_seconds bigint not null check(pause_avg_seconds between 0 and 9007199254740991),
  wait_seconds bigint not null check(wait_seconds between 0 and 9007199254740991),
  wait_avg_seconds bigint not null check(wait_avg_seconds between 0 and 9007199254740991),
  talk_seconds bigint not null check(talk_seconds between 0 and 9007199254740991),
  talk_avg_seconds bigint not null check(talk_avg_seconds between 0 and 9007199254740991),
  dispo_seconds bigint not null check(dispo_seconds between 0 and 9007199254740991),
  dispo_avg_seconds bigint not null check(dispo_avg_seconds between 0 and 9007199254740991),
  dead_seconds bigint not null check(dead_seconds between 0 and 9007199254740991),
  dead_avg_seconds bigint not null check(dead_avg_seconds between 0 and 9007199254740991),
  customer_seconds bigint not null check(customer_seconds between 0 and 9007199254740991),
  customer_avg_seconds bigint not null check(customer_avg_seconds between 0 and 9007199254740991),
  xfer_count bigint not null check(xfer_count between 0 and 9007199254740991),
  dispositions jsonb not null check(pulse_private.vici_counts_valid(dispositions)),
  unmapped_columns jsonb not null default '{}' check(pulse_private.vici_counts_valid(unmapped_columns)),
  primary key(sync_run_id,agent_code),
  check(dispositions ?& array['A','BLANK','CALLBK','DAIR','DC','DCMX','DISMX','DNC','LANG','NI','SPANIS','WRGNUM','WRGVEH','XFER']),
  check((dispositions->>'XFER')::bigint=xfer_count)
);
create table public.vici_agent_pause_snapshots (
  sync_run_id uuid not null references public.vici_sync_runs(id) on delete cascade,
  agent_code text not null check(agent_code ~ '^[0-9]{1,32}$'),
  captured_at timestamptz not null default clock_timestamp(),
  vici_user_name text not null check(length(btrim(vici_user_name)) between 1 and 240),
  current_user_group text check(length(current_user_group)<=100),
  most_recent_user_group text check(length(most_recent_user_group)<=100),
  total_seconds bigint not null check(total_seconds between 0 and 9007199254740991),
  nonpause_seconds bigint not null check(nonpause_seconds between 0 and 9007199254740991),
  pause_seconds bigint not null check(pause_seconds between 0 and 9007199254740991),
  break_seconds bigint not null check(break_seconds between 0 and 9007199254740991),
  cb_seconds bigint not null check(cb_seconds between 0 and 9007199254740991),
  dcmx_seconds bigint not null check(dcmx_seconds between 0 and 9007199254740991),
  dismx_seconds bigint not null check(dismx_seconds between 0 and 9007199254740991),
  lagged_seconds bigint not null check(lagged_seconds between 0 and 9007199254740991),
  login_seconds bigint not null check(login_seconds between 0 and 9007199254740991),
  lunch_seconds bigint not null check(lunch_seconds between 0 and 9007199254740991),
  manage_seconds bigint not null check(manage_seconds between 0 and 9007199254740991),
  rr_seconds bigint not null check(rr_seconds between 0 and 9007199254740991),
  tech_seconds bigint not null check(tech_seconds between 0 and 9007199254740991),
  other_pause_seconds jsonb not null default '{}' check(pulse_private.vici_counts_valid(other_pause_seconds)),
  unmapped_columns jsonb not null default '{}' check(pulse_private.vici_counts_valid(unmapped_columns)),
  primary key(sync_run_id,agent_code)
);

-- No browser table access, including configuration and raw integration health.
alter table public.vici_report_scopes enable row level security;
revoke all on public.vici_report_scopes from public,anon,authenticated;
revoke all on public.vici_report_scopes from service_role;
alter table public.vici_group_mappings enable row level security;
revoke all on public.vici_group_mappings from public,anon,authenticated;
revoke all on public.vici_group_mappings from service_role;
alter table public.vici_sync_runs enable row level security;
revoke all on public.vici_sync_runs from public,anon,authenticated;
revoke all on public.vici_sync_runs from service_role;
alter table public.vici_integration_health enable row level security;
revoke all on public.vici_integration_health from public,anon,authenticated;
revoke all on public.vici_integration_health from service_role;
alter table public.vici_agent_performance_snapshots enable row level security;
revoke all on public.vici_agent_performance_snapshots from public,anon,authenticated;
revoke all on public.vici_agent_performance_snapshots from service_role;
alter table public.vici_agent_pause_snapshots enable row level security;
revoke all on public.vici_agent_pause_snapshots from public,anon,authenticated;
revoke all on public.vici_agent_pause_snapshots from service_role;
grant select,insert,update on public.vici_report_scopes,public.vici_group_mappings to service_role;

create function pulse_private.vici_global_reader()
returns boolean language sql stable security definer set search_path=pg_catalog as $$
  select exists(select 1 from public.users u
    join public.user_roles ur on ur.user_id=u.id and ur.scope_type='global'
    join public.roles r on r.id=ur.role_id and r.is_active
    join public.role_permissions rp on rp.role_id=r.id
    join public.permissions p on p.id=rp.permission_id and p.is_active and p.key='dashboard.view'
    where u.auth_user_id=auth.uid() and u.status='active');
$$;
create function pulse_private.vici_group_reader(scope uuid,group_name text)
returns boolean language sql stable security definer set search_path=pg_catalog as $$
  select pulse_private.vici_global_reader() or exists(
    select 1 from public.vici_group_mappings m where m.scope_id=scope and m.vici_user_group=group_name
      and pulse_private.has_permission('dashboard.view',null,m.campaign_id,m.team_id));
$$;
create function pulse_private.vici_scope_reader(scope uuid)
returns boolean language sql stable security definer set search_path=pg_catalog as $$
  select exists(select 1 from public.vici_report_scopes s where s.id=scope and
    (pulse_private.vici_global_reader() or not exists(
      select 1 from unnest(s.user_groups) g where not pulse_private.vici_group_reader(s.id,g))));
$$;
revoke all on function pulse_private.vici_global_reader(),pulse_private.vici_group_reader(uuid,text),pulse_private.vici_scope_reader(uuid) from public,anon,authenticated,service_role;

-- Acquire a database lease BEFORE a Vici request. No browser receives this RPC.
create function public.begin_vici_sync(requested_scope uuid,report_date date)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare s public.vici_report_scopes; h public.vici_integration_health; run_id uuid;
begin
  select * into s from public.vici_report_scopes where id=requested_scope;
  if not found or not s.enabled then raise exception 'Scope unavailable' using errcode='22023'; end if;
  if report_date is null then raise exception 'Explicit source date required' using errcode='22023'; end if;
  insert into public.vici_integration_health(scope_id) values(s.id) on conflict do nothing;
  select * into h from public.vici_integration_health where scope_id=s.id for update;
  if h.halted or h.next_attempt_at>clock_timestamp() or h.lease_until>clock_timestamp() then
    return jsonb_build_object('acquired',false,'halted',h.halted);
  end if;
  if h.active_run_id is not null then
    update public.vici_sync_runs set status='failed',completed_at=clock_timestamp(),error_category='collector_timeout'
      where id=h.active_run_id and status='running';
    update public.vici_integration_health set last_failure_at=clock_timestamp(),
      last_error_category='collector_timeout',consecutive_failures=consecutive_failures+1 where scope_id=s.id;
  end if;
  insert into public.vici_sync_runs(scope_id,requested_from,requested_to,scope_definition)
    values(s.id,report_date::timestamp,report_date::timestamp+interval '23:59:59',
      jsonb_build_object('source_key',s.source_key,'campaigns',s.campaigns,'user_groups',s.user_groups,'source_time_zone',s.source_time_zone))
    returning id into run_id;
  update public.vici_integration_health set active_run_id=run_id,lease_until=clock_timestamp()+interval '120 seconds',
    next_attempt_at=clock_timestamp()+interval '60 seconds' where scope_id=s.id;
  return jsonb_build_object('acquired',true,'run_id',run_id,'source_key',s.source_key,'campaigns',s.campaigns,
    'user_groups',s.user_groups,'source_time_zone',s.source_time_zone,'report_date',report_date);
end $$;

-- Sanitized pair only. Both snapshots commit atomically; an invalid pause aborts performance too.
create function public.complete_vici_sync(requested_run uuid,pair jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.vici_sync_runs; h public.vici_integration_health; existing public.vici_sync_runs;
  perf jsonb; pauses jsonb; fingerprint text; perf_time timestamp; pause_time timestamp; item jsonb;
begin
  select * into r from public.vici_sync_runs where id=requested_run;
  if not found then raise exception 'Run unavailable' using errcode='22023'; end if;
  select * into h from public.vici_integration_health where scope_id=r.scope_id for update;
  if h.active_run_id is distinct from r.id or h.lease_until<=clock_timestamp() or r.status<>'running' then
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
    last_success_at=clock_timestamp(),last_error_category=null,consecutive_failures=0 where scope_id=r.scope_id;
  return jsonb_build_object('status',case when existing.id is null then 'success' else 'duplicate' end,
    'snapshot_run_id',coalesce(existing.id,r.id));
end $$;

create function public.fail_vici_sync(requested_run uuid,category text,retry_seconds integer default 60)
returns void language plpgsql security definer set search_path=pg_catalog as $$
declare r public.vici_sync_runs; h public.vici_integration_health; stop_sync boolean;
begin
  if category is null or category not in ('authentication_failed','access_denied','requires_ip_validation','unexpected_redirect',
    'rate_limited','source_unavailable','source_network_error','request_timeout','source_http_error',
    'invalid_report','persistence_failed','collector_timeout','configuration_error') then
    raise exception 'Invalid failure category' using errcode='22023';
  end if;
  select * into r from public.vici_sync_runs where id=requested_run;
  if not found then raise exception 'Run unavailable' using errcode='22023'; end if;
  select * into h from public.vici_integration_health where scope_id=r.scope_id for update;
  if h.active_run_id is distinct from r.id or r.status<>'running' then raise exception 'Stale run' using errcode='40001'; end if;
  stop_sync=category in ('authentication_failed','access_denied','requires_ip_validation','unexpected_redirect','configuration_error');
  update public.vici_sync_runs set status='failed',completed_at=clock_timestamp(),error_category=category where id=r.id;
  update public.vici_integration_health set active_run_id=null,lease_until=null,halted=stop_sync,
    next_attempt_at=clock_timestamp()+make_interval(secs=>greatest(60,least(86400,coalesce(retry_seconds,60)),least(3600,60*power(2,least(consecutive_failures,6))::integer))),
    last_failure_at=clock_timestamp(),last_error_category=category,consecutive_failures=least(100,consecutive_failures+1)
    where scope_id=r.scope_id;
end $$;

-- Explicit operator action after fixing auth/IP/configuration. Never called by the scheduler.
create function public.resume_vici_sync(requested_scope uuid)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
  update public.vici_integration_health set halted=false,next_attempt_at=clock_timestamp()
    where scope_id=requested_scope and (lease_until is null or lease_until<=clock_timestamp());
  if not found then raise exception 'Scope unavailable or busy' using errcode='22023'; end if;
end $$;

create function public.get_vici_dashboard(requested_scope uuid,report_date date)
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
      'captured_at',r.completed_at,'warnings',r.warning_categories) end,
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

create function public.list_vici_dashboard_scopes()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  perform pulse_private.current_training_staff_user_id();
  return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'label',s.label,'user_groups',s.user_groups,
      'source_time_zone',s.source_time_zone) order by s.label)
    from public.vici_report_scopes s where pulse_private.vici_scope_reader(s.id)),'[]'::jsonb);
end $$;

revoke all on function public.begin_vici_sync(uuid,date),public.complete_vici_sync(uuid,jsonb),public.fail_vici_sync(uuid,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.begin_vici_sync(uuid,date),public.complete_vici_sync(uuid,jsonb),public.fail_vici_sync(uuid,text,integer) to service_role;
revoke all on function public.resume_vici_sync(uuid) from public,anon,authenticated,service_role;
grant execute on function public.resume_vici_sync(uuid) to service_role;
revoke all on function public.get_vici_dashboard(uuid,date),public.list_vici_dashboard_scopes() from public,anon,authenticated,service_role;
grant execute on function public.get_vici_dashboard(uuid,date),public.list_vici_dashboard_scopes() to authenticated;

-- Retention deliberately inactive in Preview. See the documented pre-Production plan.
-- Auth/IP halts require explicit operator review; no automatic IP validation.
commit;
