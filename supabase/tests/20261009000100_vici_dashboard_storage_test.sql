begin;
set local search_path=public,extensions;
select no_plan();

select ok((select relrowsecurity from pg_class where oid='public.vici_report_scopes'::regclass),'vici_report_scopes has RLS');
select ok(not has_table_privilege('authenticated','public.vici_report_scopes','SELECT'),'Staff cannot read vici_report_scopes directly');
select ok(not has_table_privilege('anon','public.vici_report_scopes','SELECT'),'anonymous cannot read vici_report_scopes');
select ok((select relrowsecurity from pg_class where oid='public.vici_group_mappings'::regclass),'vici_group_mappings has RLS');
select ok(not has_table_privilege('authenticated','public.vici_group_mappings','SELECT'),'Staff cannot read vici_group_mappings directly');
select ok(not has_table_privilege('anon','public.vici_group_mappings','SELECT'),'anonymous cannot read vici_group_mappings');
select ok((select relrowsecurity from pg_class where oid='public.vici_sync_runs'::regclass),'vici_sync_runs has RLS');
select ok(not has_table_privilege('authenticated','public.vici_sync_runs','SELECT'),'Staff cannot read vici_sync_runs directly');
select ok(not has_table_privilege('anon','public.vici_sync_runs','SELECT'),'anonymous cannot read vici_sync_runs');
select ok((select relrowsecurity from pg_class where oid='public.vici_integration_health'::regclass),'vici_integration_health has RLS');
select ok(not has_table_privilege('authenticated','public.vici_integration_health','SELECT'),'Staff cannot read vici_integration_health directly');
select ok(not has_table_privilege('anon','public.vici_integration_health','SELECT'),'anonymous cannot read vici_integration_health');
select ok((select relrowsecurity from pg_class where oid='public.vici_agent_performance_snapshots'::regclass),'vici_agent_performance_snapshots has RLS');
select ok(not has_table_privilege('authenticated','public.vici_agent_performance_snapshots','SELECT'),'Staff cannot read vici_agent_performance_snapshots directly');
select ok(not has_table_privilege('anon','public.vici_agent_performance_snapshots','SELECT'),'anonymous cannot read vici_agent_performance_snapshots');
select ok((select relrowsecurity from pg_class where oid='public.vici_agent_pause_snapshots'::regclass),'vici_agent_pause_snapshots has RLS');
select ok(not has_table_privilege('authenticated','public.vici_agent_pause_snapshots','SELECT'),'Staff cannot read vici_agent_pause_snapshots directly');
select ok(not has_table_privilege('anon','public.vici_agent_pause_snapshots','SELECT'),'anonymous cannot read vici_agent_pause_snapshots');
select ok(not has_function_privilege('authenticated','public.begin_vici_sync(uuid,date)','EXECUTE'),'Staff cannot trigger collection');
select ok(not has_function_privilege('anon','public.complete_vici_sync(uuid,jsonb)','EXECUTE'),'anonymous cannot insert snapshots');
select ok(not has_function_privilege('authenticated','public.fail_vici_sync(uuid,text,integer)','EXECUTE'),'Staff cannot change health');
select ok(not has_function_privilege('anon','public.get_vici_dashboard(uuid,date)','EXECUTE'),'anonymous cannot read Dashboard');
select ok(not has_function_privilege('service_role','public.get_vici_dashboard(uuid,date)','EXECUTE'),'collector does not use Staff reads');

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

select throws_ok($$update public.vici_report_scopes set source_time_zone='Guessed/Timezone' where code='fixture'$$,'22023',null,'unknown timezone rejected');
select throws_ok($$update public.vici_report_scopes set user_groups=array['Different'] where code='fixture'$$,'22023',null,'source definition cannot silently rewrite snapshot ownership');
create temp table dashboard_test_state(run uuid,first_run uuid,pair jsonb);
insert into dashboard_test_state(pair) values('{"performance":{"source_generated_at":"2026-10-09 12:00:00","ingested_at":"2026-10-09T19:00:00Z","rows":[{"agent_code":"0001","vici_user_name":"Synthetic Agent","current_user_group":"FixtureGroup","most_recent_user_group":"FixtureGroup","calls":11,"time_seconds":60,"pause_seconds":60,"pause_avg_seconds":60,"wait_seconds":60,"wait_avg_seconds":60,"talk_seconds":60,"talk_avg_seconds":60,"dispo_seconds":60,"dispo_avg_seconds":60,"dead_seconds":60,"dead_avg_seconds":60,"customer_seconds":60,"customer_avg_seconds":60,"xfer_count":1,"dispositions":{"A":1,"BLANK":1,"CALLBK":1,"DAIR":1,"DC":1,"DCMX":1,"DISMX":1,"DNC":1,"LANG":1,"NI":1,"SPANIS":4,"WRGNUM":1,"WRGVEH":1,"XFER":1},"unmapped_columns":{}}]},"pause":{"source_generated_at":"2026-10-09 12:00:01","ingested_at":"2026-10-09T19:00:01Z","rows":[{"agent_code":"0001","vici_user_name":"Synthetic Agent","current_user_group":"FixtureGroup","most_recent_user_group":"FixtureGroup","total_seconds":60,"nonpause_seconds":60,"pause_seconds":60,"break_seconds":60,"cb_seconds":60,"dcmx_seconds":60,"dismx_seconds":60,"lagged_seconds":60,"login_seconds":60,"lunch_seconds":60,"manage_seconds":60,"rr_seconds":60,"tech_seconds":60,"other_pause_seconds":{},"unmapped_columns":{"column_9":3}}]},"warning_categories":["unnamed_columns"]}'::jsonb);
grant all on dashboard_test_state to service_role,authenticated;

set local role service_role;
select throws_ok($$select public.begin_vici_sync('dd910000-0000-4000-8000-000000000004','2026-10-09')$$,'22023',null,'disabled scope cannot collect');
select throws_ok($$select public.begin_vici_sync('dd910000-0000-4000-8000-000000000001',null)$$,'22023',null,'unknown timezone does not invent Today');
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
select ok((select run is not null from dashboard_test_state),'service acquires run');
select is(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'acquired','false','overlapping collector cannot acquire same scope');
select throws_ok($$select public.complete_vici_sync(run,jsonb_set(pair,'{pause,rows,0,break_seconds}','-1')) from dashboard_test_state$$,'23514',null,'invalid pause rejects the complete pair');
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),0::bigint,'failed pause rolled back performance insert');
set local role service_role;
select throws_ok($$select public.complete_vici_sync(run,pair||'{"password":"never-store-this"}') from dashboard_test_state$$,'22023',null,'unexpected payload secrets rejected');
select throws_ok($$select public.complete_vici_sync(run,jsonb_set(pair,'{performance,rows,0,auth_header}','"never-store-this"')) from dashboard_test_state$$,'22023',null,'unexpected row fields rejected');
select is((select public.complete_vici_sync(run,pair)->>'status' from dashboard_test_state),'success','normalized pair committed');
update dashboard_test_state set first_run=run;
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),1::bigint,'one performance observation');
select is((select count(*) from public.vici_agent_pause_snapshots),1::bigint,'one pause observation');
select is((select agent_code from public.vici_agent_performance_snapshots),'0001','leading zero identity preserved');
select is((select xfer_count from public.vici_agent_performance_snapshots),1::bigint,'XFER stored canonically');
select is((select dispositions->>'SPANIS' from public.vici_agent_performance_snapshots),'4','SPANIS remains independent');
select is((select unmapped_columns->>'column_9' from public.vici_agent_pause_snapshots),'3','unnamed pause retained without guessed meaning');
select is((select time_seconds from public.vici_agent_performance_snapshots),60::bigint,'durations are integer seconds');
select ok((select source_time_zone is null from public.vici_report_scopes where code='fixture'),'unconfirmed timezone stays null');

-- A retry of the same generated pair changes neither rows nor logical observation.
update public.vici_integration_health set next_attempt_at=clock_timestamp()-interval '1 second';
set local role service_role;
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
select is((select public.complete_vici_sync(run,pair)->>'status' from dashboard_test_state),'duplicate','same source pair deduplicated');
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),1::bigint,'retry created no duplicate performance');
select is((select count(*) from public.vici_sync_runs where status='duplicate'),1::bigint,'retry attempt remains auditable');
update public.vici_integration_health set next_attempt_at=clock_timestamp()-interval '1 second';
set local role service_role;
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
select throws_ok($$select public.complete_vici_sync(run,jsonb_set(pair,'{performance,rows,0,calls}','99')) from dashboard_test_state$$,'22023',null,'same generation with changed values raises conflict');
select public.fail_vici_sync(run,'source_unavailable',60) from dashboard_test_state;
select is(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'acquired','false','failure backoff blocks a new source request');
reset role;
select is((select count(*) from public.vici_agent_performance_snapshots),1::bigint,'failed sync preserves prior success');
select ok((select last_success_at is not null and last_failure_at is not null from public.vici_integration_health where scope_id='dd910000-0000-4000-8000-000000000001'),'both success and failure clocks retained');
update public.vici_integration_health set next_attempt_at=clock_timestamp()-interval '1 second';
set local role service_role;
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
select public.fail_vici_sync(run,'requires_ip_validation',60) from dashboard_test_state;
select is(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'halted','true','IP validation halts collection');
select throws_ok($$select public.fail_vici_sync(run,'raw-password-text',60) from dashboard_test_state$$,'22023',null,'raw error text is not accepted as category');
reset role;

select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(jsonb_array_length(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')->'performance'),1,'authorized global Staff retains last data after failure');
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{health,requires_ip_validation}','true','protected health reports IP validation');
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{performance,0,linked}','false','unlinked Vici identity is still visible');
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-08')->'snapshot','null'::jsonb,'historical date does not borrow another day');
select throws_ok($$select * from public.vici_agent_performance_snapshots$$,'42501',null,'even global Staff cannot bypass protected reads');
reset role;
insert into public.agents(agent_code,display_name,team_id) values('0001','Different roster name','ed910000-0000-4000-8000-000000000001');
set local role authenticated;
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{performance,0,linked}','true','later roster resolves by code without matching names');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is(jsonb_array_length(public.list_vici_dashboard_scopes()),1,'team-scoped Staff only lists fully mapped authorized scopes');
select lives_ok($$select public.get_vici_dashboard('dd910000-0000-4000-8000-000000000002','2026-10-09')$$,'correct mapped Team is allowed');
select throws_ok($$select public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')$$,'42501',null,'unmapped group cannot inherit caller Team');
select throws_ok($$select public.get_vici_dashboard('dd910000-0000-4000-8000-000000000003','2026-10-09')$$,'42501',null,'mixed A/B scope cannot leak the other Team');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000003',true);
set local role authenticated;
select throws_ok($$select public.list_vici_dashboard_scopes()$$,'42501',null,'authenticated non-Staff identity denied');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
-- Exercise recovery, expiry and out-of-order reads with synthetic Staff.
select ok(not has_function_privilege('authenticated','public.resume_vici_sync(uuid)','EXECUTE'),'Staff cannot bypass a halted collector');
set local role service_role;
select public.resume_vici_sync('dd910000-0000-4000-8000-000000000001');
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
reset role;
update public.vici_integration_health set lease_until=clock_timestamp()-interval '1 second',next_attempt_at=clock_timestamp()-interval '1 second';
set local role service_role;
select throws_ok($$select public.complete_vici_sync(run,pair) from dashboard_test_state$$,'40001',null,'expired lease cannot commit');
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
select is((select public.complete_vici_sync(run,jsonb_set(jsonb_set(pair,'{performance,source_generated_at}','"2026-10-09 13:00:00"'),'{pause,source_generated_at}','"2026-10-09 13:00:01"'))->>'status' from dashboard_test_state),'success','replacement lease commits a newer complete pair');
reset role;
select is((select count(*) from public.vici_sync_runs where error_category='collector_timeout'),1::bigint,'abandoned lease becomes a recorded timeout');
select is((select count(*) from public.vici_agent_performance_snapshots),2::bigint,'new generation creates exactly one new observation');
update public.vici_integration_health set next_attempt_at=clock_timestamp()-interval '1 second';
set local role service_role;
update dashboard_test_state set run=(public.begin_vici_sync('dd910000-0000-4000-8000-000000000001','2026-10-09')->>'run_id')::uuid;
select is((select public.complete_vici_sync(run,jsonb_set(jsonb_set(pair,'{performance,source_generated_at}','"2026-10-09 11:00:00"'),'{pause,source_generated_at}','"2026-10-09 11:00:01"'))->>'status' from dashboard_test_state),'success','older source generation can be retained as history');
reset role;
set local role authenticated;
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{snapshot,performance_generated_at}','2026-10-09T13:00:00','out-of-order response cannot replace latest source generation');
select is(public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')#>>'{health,requires_ip_validation}','false','successful recovery clears current IP error');
reset role;
-- Exact canonical mappings are required for every group appearing in a scoped report.
insert into public.vici_group_mappings(scope_id,vici_user_group,team_id) values
('dd910000-0000-4000-8000-000000000001','FixtureGroup','ed910000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select lives_ok($$select public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')$$,'explicit group mapping enables scoped reader');
reset role;
update public.vici_agent_performance_snapshots set most_recent_user_group='UnmappedMovedGroup';
set local role authenticated;
select throws_ok($$select public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')$$,'42501',null,'moved or unrecognized row group cannot leak across scoped grants');
reset role;
update public.users set status='blocked' where auth_user_id='ad910000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select throws_ok($$select public.get_vici_dashboard('dd910000-0000-4000-8000-000000000001','2026-10-09')$$,'42501',null,'blocked Staff loses access immediately');
reset role;
select * from finish();
rollback;
