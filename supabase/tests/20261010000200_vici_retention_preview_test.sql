begin;
set local search_path=public,extensions;
select no_plan();
insert into public.business_areas(id,code,name) values('bd910000-0000-4000-8000-000000000001','dashboard_test','Dashboard Test');
insert into public.campaigns(id,business_area_id,code,name) values('cd910000-0000-4000-8000-000000000001','bd910000-0000-4000-8000-000000000001','dashboard_test','Dashboard Test');
insert into public.teams(id,business_area_id,campaign_id,code,name) values
('ed910000-0000-4000-8000-000000000001','bd910000-0000-4000-8000-000000000001','cd910000-0000-4000-8000-000000000001','dashboard_a','Dashboard A'),
('ed910000-0000-4000-8000-000000000002','bd910000-0000-4000-8000-000000000001','cd910000-0000-4000-8000-000000000001','dashboard_b','Dashboard B');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('ad910000-0000-4000-8000-000000000001','authenticated','authenticated','dashboard.global@example.test','',now(),'{}','{}',now(),now()),
('ad910000-0000-4000-8000-000000000002','authenticated','authenticated','dashboard.scoped@example.test','',now(),'{}','{}',now(),now()),
('ad910000-0000-4000-8000-000000000003','authenticated','authenticated','dashboard.no_staff@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values
('bd910000-0000-4000-8000-000000000011','ad910000-0000-4000-8000-000000000001','dashboard.global@example.test','Dashboard Global','active',now()),
('bd910000-0000-4000-8000-000000000012','ad910000-0000-4000-8000-000000000002','dashboard.scoped@example.test','Dashboard Scoped','active',now());
insert into public.user_roles(user_id,role_id,scope_type) select 'bd910000-0000-4000-8000-000000000011',id,'global' from public.roles where key='admin';
insert into public.user_roles(user_id,role_id,scope_type,team_id) select 'bd910000-0000-4000-8000-000000000012',id,'team','ed910000-0000-4000-8000-000000000001' from public.roles where key='team_leader';

insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled) values
('dd910000-0000-4000-8000-000000000001','fixture','Unmapped fixture','fixture',array['FixtureCampaign'],array['FixtureGroup'],true),
('dd910000-0000-4000-8000-000000000002','mapped','Mapped A','fixture',array['FixtureCampaign'],array['MappedA'],true),
('dd910000-0000-4000-8000-000000000003','mixed','A and B','fixture',array['FixtureCampaign'],array['MappedA','MappedB'],true),
('dd910000-0000-4000-8000-000000000004','disabled','Disabled','fixture',array['FixtureCampaign'],array['FixtureGroup'],false);
insert into public.vici_group_mappings(scope_id,vici_user_group,team_id) values
('dd910000-0000-4000-8000-000000000002','MappedA','ed910000-0000-4000-8000-000000000001'),
('dd910000-0000-4000-8000-000000000003','MappedA','ed910000-0000-4000-8000-000000000001'),
('dd910000-0000-4000-8000-000000000003','MappedB','ed910000-0000-4000-8000-000000000002');


create temp table dashboard_test_state(run uuid,first_run uuid,pair jsonb);
insert into dashboard_test_state(pair) values('{"performance":{"source_generated_at":"2026-10-09 12:00:00","ingested_at":"2026-10-09T19:00:00Z","rows":[{"agent_code":"0001","vici_user_name":"Synthetic Agent","current_user_group":"FixtureGroup","most_recent_user_group":"FixtureGroup","calls":11,"time_seconds":60,"pause_seconds":60,"pause_avg_seconds":60,"wait_seconds":60,"wait_avg_seconds":60,"talk_seconds":60,"talk_avg_seconds":60,"dispo_seconds":60,"dispo_avg_seconds":60,"dead_seconds":60,"dead_avg_seconds":60,"customer_seconds":60,"customer_avg_seconds":60,"xfer_count":1,"dispositions":{"A":1,"BLANK":1,"CALLBK":1,"DAIR":1,"DC":1,"DCMX":1,"DISMX":1,"DNC":1,"LANG":1,"NI":1,"SPANIS":4,"WRGNUM":1,"WRGVEH":1,"XFER":1},"unmapped_columns":{}}]},"pause":{"source_generated_at":"2026-10-09 12:00:01","ingested_at":"2026-10-09T19:00:01Z","rows":[{"agent_code":"0001","vici_user_name":"Synthetic Agent","current_user_group":"FixtureGroup","most_recent_user_group":"FixtureGroup","total_seconds":60,"nonpause_seconds":60,"pause_seconds":60,"break_seconds":60,"cb_seconds":60,"dcmx_seconds":60,"dismx_seconds":60,"lagged_seconds":60,"login_seconds":60,"lunch_seconds":60,"manage_seconds":60,"rr_seconds":60,"tech_seconds":60,"other_pause_seconds":{},"unmapped_columns":{"column_9":3}}]},"warning_categories":["unnamed_columns"]}'::jsonb);
grant all on dashboard_test_state to service_role,authenticated;

-- Synthetic review only: every record rolls back.
create function pg_temp.retention_seed(n integer,d date,h integer,st text default 'success',s uuid default 'dd910000-0000-4000-8000-000000000001')
returns uuid language plpgsql as $seed$
declare rid uuid=('ff920000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid; pair_value jsonb;
begin
  select pair into pair_value from dashboard_test_state limit 1;
  insert into public.vici_sync_runs(id,scope_id,requested_from,requested_to,scope_definition,status,completed_at,performance_generated_at,pause_generated_at,performance_row_count,pause_row_count)
  values(rid,s,d,d+interval '23:59:59','{}',st,now(),d+h*interval '1 hour',d+h*interval '1 hour'+interval '1 second',
    case when st='success' then 1 end,case when st='success' then 1 end);
  if st='success' then
    insert into public.vici_agent_performance_snapshots select x.* from jsonb_populate_record(null::public.vici_agent_performance_snapshots,
      (pair_value#>'{performance,rows,0}')||jsonb_build_object('sync_run_id',rid,'captured_at',now())) x;
    insert into public.vici_agent_pause_snapshots select x.* from jsonb_populate_record(null::public.vici_agent_pause_snapshots,
      (pair_value#>'{pause,rows,0}')||jsonb_build_object('sync_run_id',rid,'captured_at',now())) x;
  end if;
  return rid;
end $seed$;
select pg_temp.retention_seed(n, date '2026-10-10'-age,h) from (values
 (1,0,10),(2,0,11),(3,6,10),(4,6,11),(5,7,10),(6,7,11),
 (7,89,10),(8,89,11),(9,90,10),(10,90,11),(11,91,10),
 (13,-1,10),(14,10,10),(15,11,10)) v(n,age,h);
select pg_temp.retention_seed(12,'2026-07-01',10,'running');
select pg_temp.retention_seed(16,'2026-07-01',11,'duplicate');
update public.vici_sync_runs set duplicate_of='ff920000-0000-4000-8000-000000000011' where id='ff920000-0000-4000-8000-000000000016';
update public.vici_sync_runs set requested_to=requested_from+interval '12 hours' where id='ff920000-0000-4000-8000-000000000014';
update public.vici_sync_runs set pause_row_count=2 where id='ff920000-0000-4000-8000-000000000015';
select pg_temp.retention_seed(17,'2026-07-01',12,'failed');
insert into public.vici_integration_health(scope_id,active_run_id,lease_until,halted,last_error_category)
values('dd910000-0000-4000-8000-000000000001','ff920000-0000-4000-8000-000000000017',now()-interval '1 day',true,'source_network_error');
select pg_temp.retention_seed(18,'2026-01-01',10,'success','dd910000-0000-4000-8000-000000000002');

create temp table retention_before as select
  (select jsonb_agg(to_jsonb(r) order by id) from public.vici_sync_runs r) as runs,
  (select jsonb_agg(to_jsonb(p) order by sync_run_id,agent_code) from public.vici_agent_performance_snapshots p) as performance,
  (select jsonb_agg(to_jsonb(p) order by sync_run_id,agent_code) from public.vici_agent_pause_snapshots p) as pause,
  (select jsonb_agg(to_jsonb(h) order by scope_id) from public.vici_integration_health h) as health;
select ok(not has_function_privilege('anon','public.preview_vici_retention(uuid,date,integer)','EXECUTE'),'anonymous simulation denied');
select ok(not has_function_privilege('service_role','public.preview_vici_retention(uuid,date,integer)','EXECUTE'),'simulation requires real Staff session');
select ok(not has_function_privilege('authenticated','pulse_private.vici_retention_plan(uuid,date)','EXECUTE'),'private planner not browser callable');
select is((select provolatile::text from pg_proc where oid='public.preview_vici_retention(uuid,date,integer)'::regprocedure),'s','public simulator is stable read-only');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
create temp table retention_result as select public.preview_vici_retention('dd910000-0000-4000-8000-000000000001','2026-10-10') as value;
select is((select value->>'dry_run' from retention_result),'true','dry-run explicitly true');
select is((select value->>'deletion_enabled' from retention_result),'false','no deletion enabled');
select is((select value->>'source_time_zone' from retention_result),null,'unknown timezone stays unknown');
select is((select value#>>'{policy,recent_from}' from retention_result),'2026-10-04','seven calendar dates inclusive');
select is((select value#>>'{policy,daily_from}' from retention_result),'2026-07-13','ninety calendar dates inclusive');
select is((select value#>>'{totals,versions}' from retention_result),'17','other scope excluded');
select is((select value#>>'{totals,candidates}' from retention_result),'4','only unprotected expired/intermediate pairs qualify');
create temp table retention_rows as select x.* from retention_result,jsonb_to_recordset(value->'rows')
  x(id uuid,decision text,reason text);
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000003'),'recent_detail','age six all cuts retained');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000005'),'intermediate_cut','age seven intermediate cut is candidate');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000006'),'daily_close','age seven last successful pair retained');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000008'),'daily_close','age eighty-nine final pair retained');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000010'),'expired_day','age ninety outside window');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000011'),'duplicate_reference','duplicate parents protected');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000012'),'active_run','running run protected without live lease');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000017'),'active_run','expired lease reference still protected');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000013'),'future_date','future source date protected');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000014'),'incomplete_pair','partial-day report not compacted');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000015'),'incomplete_pair','inconsistent pair counts protected');
select is((select reason from retention_rows where id='ff920000-0000-4000-8000-000000000016'),'audit_metadata','duplicate metadata outside cleanup');
select is(public.preview_vici_retention('dd910000-0000-4000-8000-000000000002','2026-10-10')#>>'{rows,0,reason}','latest_success','latest valid pair protected beyond ninety dates');
select is(public.preview_vici_retention('dd910000-0000-4000-8000-000000000001','2026-10-10',100)#>>'{totals,versions}','17','pagination preserves whole-scope totals');
select is(jsonb_array_length(public.preview_vici_retention('dd910000-0000-4000-8000-000000000001','2026-10-10',100)->'rows'),0,'empty page bounded');
select throws_ok($$select public.preview_vici_retention('dd910000-0000-4000-8000-000000000001',null)$$,'22023',null,'explicit date required');
select throws_ok($$select public.preview_vici_retention('dd910000-0000-4000-8000-000000000001','2026-10-10',-1)$$,'22023',null,'negative offset rejected');
select throws_ok($$select public.preview_vici_retention('dd910000-0000-4000-8000-000000000004','2026-10-10')$$,'42501',null,'disabled scope denied');
reset role;
select is((select jsonb_agg(to_jsonb(r) order by id) from public.vici_sync_runs r),(select runs from retention_before),'all runs unchanged');
select is((select jsonb_agg(to_jsonb(p) order by sync_run_id,agent_code) from public.vici_agent_performance_snapshots p),(select performance from retention_before),'all performance data unchanged');
select is((select jsonb_agg(to_jsonb(p) order by sync_run_id,agent_code) from public.vici_agent_pause_snapshots p),(select pause from retention_before),'all pause data unchanged');
select is((select jsonb_agg(to_jsonb(h) order by scope_id) from public.vici_integration_health h),(select health from retention_before),'lease and health unchanged');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.preview_vici_retention('dd910000-0000-4000-8000-000000000002','2026-10-10')$$,'42501',null,'scoped reader cannot inspect retention');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000003',true);
set local role authenticated;
select throws_ok($$select public.preview_vici_retention('dd910000-0000-4000-8000-000000000001','2026-10-10')$$,'42501',null,'Auth without Staff denied');
reset role;
update public.users set status='blocked' where auth_user_id='ad910000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.preview_vici_retention('dd910000-0000-4000-8000-000000000001','2026-10-10')$$,'42501',null,'blocked global admin denied');
reset role;
select * from finish();
rollback;
