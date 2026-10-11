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



-- Synthetic identities exist only in this disposable local transaction.
select ok(not has_function_privilege('authenticated','public.import_vici_reports(uuid,date,uuid,jsonb,jsonb)','EXECUTE'),'browser cannot submit normalized rows or forged actor');
select ok(not has_function_privilege('anon','public.list_vici_report_history(uuid,date,integer)','EXECUTE'),'anonymous history denied');
select ok(not has_function_privilege('anon','public.get_vici_dashboard_snapshot(uuid,uuid)','EXECUTE'),'anonymous snapshot denied');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select ok(public.can_import_vici_reports('dd910000-0000-4000-8000-000000000001'),'active global admin may import');
select ok(not public.can_import_vici_reports('dd910000-0000-4000-8000-000000000004'),'disabled scope cannot import');
select is(public.list_vici_dashboard_scopes()#>>'{0,can_import}','true','catalog exposes server-owned import capability');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select ok(not public.can_import_vici_reports('dd910000-0000-4000-8000-000000000002'),'scoped reader cannot import');
reset role;
insert into public.vici_integration_health(scope_id,halted,last_failure_at,last_error_category,consecutive_failures,next_attempt_at)
values('dd910000-0000-4000-8000-000000000001',true,'2026-10-09T19:00:00Z','source_network_error',4,now()+interval '1 day');
create temp table health_before as select * from public.vici_integration_health;
create temp table import_verification(value jsonb);
insert into import_verification values('{"performance":{},"pause":{},"scope_attested":true}');
grant all on import_verification to service_role;
set local role service_role;
select throws_ok($$select public.import_vici_reports('dd910000-0000-4000-8000-000000000001','2026-10-09','ad910000-0000-4000-8000-000000000002',pair,(select value from import_verification)) from dashboard_test_state$$,'42501',null,'reader denied again at commit');
select throws_ok($$select public.import_vici_reports('dd910000-0000-4000-8000-000000000001','2026-10-09','ad910000-0000-4000-8000-000000000001',jsonb_set(pair,'{pause,rows,0,break_seconds}','-1'),(select value from import_verification)) from dashboard_test_state$$,'23514',null,'invalid pause rolls back manual pair');
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),0::bigint,'no partial performance on failed import');
select is((select count(*) from public.vici_sync_runs),0::bigint,'failed transaction does not leave a running manual entry');
set local role service_role;
update dashboard_test_state set first_run=(public.import_vici_reports('dd910000-0000-4000-8000-000000000001','2026-10-09','ad910000-0000-4000-8000-000000000001',pair,(select value from import_verification))->>'snapshot_run_id')::uuid;
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),1::bigint,'manual report stored');
select is((select ingestion_method from public.vici_sync_runs),'manual','manual provenance stored');
select is((select uploaded_by::text from public.vici_sync_runs),'bd910000-0000-4000-8000-000000000011','verified actor retained');
select is((select to_jsonb(h) from public.vici_integration_health h),(select to_jsonb(h) from health_before h),'manual upload preserves entire automatic health including halt/backoff');
-- A second generation keeps the first and independent source clocks.
update public.vici_sync_runs set started_at=started_at-interval '10 seconds';
update dashboard_test_state set pair=jsonb_set(jsonb_set(jsonb_set(pair,'{performance,source_generated_at}','"2026-10-09 12:30:00"'),'{pause,source_generated_at}','"2026-10-09 12:30:05"'),'{performance,rows,0,calls}','21');
set local role service_role;
update dashboard_test_state set run=(public.import_vici_reports('dd910000-0000-4000-8000-000000000001','2026-10-09','ad910000-0000-4000-8000-000000000001',pair,(select value from import_verification))->>'snapshot_run_id')::uuid;
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),2::bigint,'second generation preserves first generation');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(jsonb_array_length(public.list_vici_report_history('dd910000-0000-4000-8000-000000000001','2026-10-09')),2,'history lists both versions');
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{performance,0,calls}','21','latest generation selected');
select is((select public.get_vici_dashboard_snapshot('dd910000-0000-4000-8000-000000000001',first_run)#>>'{performance,0,calls}' from dashboard_test_state),'11','old generation readable unchanged');
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{health,connected}','false','manual success not live');
select throws_ok($$select public.get_vici_dashboard_snapshot('dd910000-0000-4000-8000-000000000002',first_run) from dashboard_test_state$$,'22023',null,'snapshot ID cannot cross scope');
reset role;
update public.vici_sync_runs set started_at=started_at-interval '10 seconds';
set local role service_role;
select is((select public.import_vici_reports('dd910000-0000-4000-8000-000000000001','2026-10-09','ad910000-0000-4000-8000-000000000001',pair,(select value from import_verification))->>'status' from dashboard_test_state),'duplicate','same report pair deduplicated');
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),2::bigint,'retry does not double figures');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.list_vici_report_history('dd910000-0000-4000-8000-000000000001','2026-10-09')$$,'42501',null,'history enforces scope permissions');
select throws_ok($$select public.get_vici_dashboard_snapshot('dd910000-0000-4000-8000-000000000001',first_run) from dashboard_test_state$$,'42501',null,'old snapshot enforces scope permissions');
reset role;
update public.users set status='blocked' where auth_user_id='ad910000-0000-4000-8000-000000000001';
set local role service_role;
select throws_ok($$select public.import_vici_reports('dd910000-0000-4000-8000-000000000001','2026-10-09','ad910000-0000-4000-8000-000000000001',pair,(select value from import_verification)) from dashboard_test_state$$,'42501',null,'blocked admin denied during commit');
reset role;
select * from finish();
rollback;
