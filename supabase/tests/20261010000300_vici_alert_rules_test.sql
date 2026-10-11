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

-- All test identities/configuration are synthetic and roll back.
select ok((select relrowsecurity from pg_class where oid='public.vici_alert_rule_versions'::regclass),'alert table has RLS');
select ok(not has_table_privilege('authenticated','public.vici_alert_rule_versions','SELECT,INSERT,UPDATE,DELETE'),'no raw browser table access');
select ok(not has_table_privilege('service_role','public.vici_alert_rule_versions','SELECT,INSERT,UPDATE,DELETE'),'no raw service table access');
select ok(not has_function_privilege('anon','public.get_vici_alert_rules(uuid)','EXECUTE'),'anonymous read denied');
select ok(not has_function_privilege('anon','public.save_vici_alert_rules(uuid,integer,jsonb)','EXECUTE'),'anonymous write denied');
select ok(not has_function_privilege('service_role','public.save_vici_alert_rules(uuid,integer,jsonb)','EXECUTE'),'service role write denied');
select ok(not has_function_privilege('authenticated','pulse_private.require_vici_alert_reader(uuid)','EXECUTE'),'private helper hidden');
create temp table alert_test_state(rules jsonb);
insert into alert_test_state values(pulse_private.default_vici_alert_rules());
grant select,update on alert_test_state to authenticated;
select ok(pulse_private.valid_vici_alert_rules((select rules from alert_test_state)),'empty defaults valid');
select ok(not pulse_private.valid_vici_alert_rules(null),'SQL null rejected');
select ok(not pulse_private.valid_vici_alert_rules('{}'),'object rejected');
select ok(not pulse_private.valid_vici_alert_rules('[]'),'missing rules rejected');
select ok(not pulse_private.valid_vici_alert_rules((select rules||(rules->0) from alert_test_state)),'extra rules rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,enabled}','true') from alert_test_state)),'enabled rule needs limit');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,threshold_seconds}','-1') from alert_test_state)),'negative threshold rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,threshold_seconds}','0.5') from alert_test_state)),'fraction rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,threshold_seconds}','31536001') from alert_test_state)),'huge threshold rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,threshold_seconds}','"20"') from alert_test_state)),'string threshold rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,spoof}','true') from alert_test_state)),'extra property rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0,id}','"sales"') from alert_test_state)),'unknown metric rejected');
select ok(not pulse_private.valid_vici_alert_rules((select jsonb_set(rules,'{0}',rules->1) from alert_test_state)),'duplicate metric rejected');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is((public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000001')->>'revision')::integer,0,'read-only defaults revision zero');
select is((public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000001')->>'can_manage')::boolean,true,'global admin can manage');
select is(jsonb_array_length(public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001')),0,'defaults do not create history');
select is((public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',0,(select rules from alert_test_state))->>'revision')::integer,0,'saving unchanged defaults is no-op');
select throws_ok($$select public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',0,'[]')$$,'22023',null,'invalid config rejected server-side');
update alert_test_state set rules=jsonb_set(jsonb_set(rules,'{0,threshold_seconds}','0'),'{0,enabled}','true');
select is((public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',0,(select rules from alert_test_state))->>'revision')::integer,1,'first valid change saves one version');
select is(public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000001')->>'changed_by_name','Dashboard Global','actor comes from verified Staff');
select is((public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',1,(select rules from alert_test_state))->>'revision')::integer,1,'identical retry creates no duplicate history');
select throws_ok($$select public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',0,(select rules from alert_test_state))$$,'40001',null,'stale administrator cannot overwrite');
select throws_ok($$select public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',null,(select rules from alert_test_state))$$,'22023',null,'null revision rejected');
update alert_test_state set rules=jsonb_set(rules,'{0,enabled}','false');
select is((public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',1,(select rules from alert_test_state))->>'revision')::integer,2,'disable appends version');
select is(jsonb_array_length(public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001')),2,'both full versions retained');
select is((public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001')#>>'{1,rules,0,enabled}')::boolean,true,'old enabled version is immutable');
select is((public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001',2)#>>'{0,revision}')::integer,1,'history cursor exclusive');
select throws_ok($$select public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001',0)$$,'22023',null,'invalid history cursor denied');
select is((public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000002')->>'revision')::integer,0,'another scope unaffected');
select throws_ok($$select public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000004')$$,'42501',null,'disabled scope denied');
select throws_ok($$select public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000099')$$,'42501',null,'unknown scope denied');
select throws_ok($$select * from public.vici_alert_rule_versions$$,'42501',null,'direct reads denied at runtime');
select throws_ok($$delete from public.vici_alert_rule_versions$$,'42501',null,'direct deletes denied at runtime');
reset role;
select is((select count(*)::integer from public.vici_alert_rule_versions),2,'only explicit version changes written');
select is((select count(*)::integer from public.vici_sync_runs),0,'report runs untouched');
select is((select count(*)::integer from public.vici_agent_performance_snapshots),0,'performance untouched');
select is((select count(*)::integer from public.vici_agent_pause_snapshots),0,'pauses untouched');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000002')->>'can_manage')::boolean,false,'scoped Staff read-only');
select throws_ok($$select public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000002',0,(select rules from alert_test_state))$$,'42501',null,'scoped Staff cannot edit');
select throws_ok($$select public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000001')$$,'42501',null,'unmapped scope denied to scoped Staff');
select throws_ok($$select public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000003')$$,'42501',null,'mixed unauthorized scope history denied');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000003',true);
set local role authenticated;
select throws_ok($$select public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000001')$$,'42501',null,'Auth without active Staff denied');
reset role;
-- Bounded keyset history uses synthetic owner inserts only.
insert into public.vici_alert_rule_versions select 'dd910000-0000-4000-8000-000000000001',n,(select rules from alert_test_state),'bd910000-0000-4000-8000-000000000011','Synthetic history',now() from generate_series(3,23) n;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(jsonb_array_length(public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001')),20,'history pages bounded to twenty');
select is(jsonb_array_length(public.list_vici_alert_rule_history('dd910000-0000-4000-8000-000000000001',4)),3,'next page has remaining older versions');
reset role;
update public.users set status='blocked' where id='bd910000-0000-4000-8000-000000000011';
set local role authenticated;
select throws_ok($$select public.get_vici_alert_rules('dd910000-0000-4000-8000-000000000001')$$,'42501',null,'blocked admin denied');
select throws_ok($$select public.save_vici_alert_rules('dd910000-0000-4000-8000-000000000001',2,(select rules from alert_test_state))$$,'42501',null,'blocked admin cannot save');
reset role;
select * from finish();
rollback;
