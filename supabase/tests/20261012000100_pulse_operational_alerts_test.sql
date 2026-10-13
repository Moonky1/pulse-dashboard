begin;
set local search_path=public,extensions;
select no_plan();
select is((select count(*) from public.pulse_schedule_events),5::bigint,'five canonical initial events');
select ok(not(select enabled from public.pulse_alert_settings),'dispatch OFF by default');
select is(public.pulse_alert_scheduler_tick(),0,'no dispatch before activation');
select ok((select relpersistence='u' from pg_class where oid='pulse_private.pulse_alert_leases'::regclass),'presence uses unlogged ephemeral leases');
select ok((select relrowsecurity from pg_class where oid='public.pulse_alert_deliveries'::regclass),'delivery RLS enabled');
select ok(not has_table_privilege('authenticated','public.pulse_alert_deliveries','SELECT,INSERT,UPDATE,DELETE'),'browser has no raw delivery access');
select ok(not has_table_privilege('service_role','pulse_private.pulse_alert_leases','SELECT,INSERT,UPDATE,DELETE'),'service uses bounded functions only');
select ok(not has_function_privilege('anon','public.get_pulse_schedule()','EXECUTE'),'anonymous schedule denied');
select ok(not has_function_privilege('authenticated','public.agent_get_pulse_schedule(uuid)','EXECUTE'),'Agent methods cannot be called with Staff/browser credentials');
select ok(not has_function_privilege('authenticated','public.pulse_alert_scheduler_tick()','EXECUTE'),'browser cannot dispatch');
select ok(not has_function_privilege('authenticated','public.agent_pending_pulse_alerts(text,uuid)','EXECUTE'),'reconnect recovery cannot bypass cookie API');
select ok(not has_function_privilege('service_role','public.save_pulse_schedule_event(uuid,integer,jsonb)','EXECUTE'),'Agent server cannot edit schedule');
select ok(not has_function_privilege('authenticated','pulse_private.collect_pulse_alerts(timestamptz)','EXECUTE'),'client cannot set scheduler clock');
select ok(pulse_private.valid_pulse_schedule((select config from public.pulse_schedule_events limit 1)),'initial event validates');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"timezone":"UTC"}' from public.pulse_schedule_events limit 1)),'fixed/noncanonical zone rejected');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"volume":101}' from public.pulse_schedule_events limit 1)),'gain bounded');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"duration_seconds":15,"repeat":3}' from public.pulse_schedule_events limit 1)),'total sound duration bounded');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"sound":null}' from public.pulse_schedule_events limit 1)),'null cannot bypass sound constraint');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"days":[1,1]}' from public.pulse_schedule_events limit 1)),'duplicate weekdays rejected');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"start":"26:00"}' from public.pulse_schedule_events limit 1)),'invalid clock rejected');
select ok(not pulse_private.valid_pulse_schedule((select config||'{"end":"00:00"}' from public.pulse_schedule_events limit 1)),'overnight event rejected in V1');

insert into public.business_areas(id,code,name) values('b1120000-0000-4000-8000-000000000001','alerts_test','Alerts Test');
insert into public.campaigns(id,business_area_id,code,name) values('c1120000-0000-4000-8000-000000000001','b1120000-0000-4000-8000-000000000001','alerts_test','Alerts Test');
insert into public.teams(id,business_area_id,campaign_id,code,name) values('d1120000-0000-4000-8000-000000000001','b1120000-0000-4000-8000-000000000001','c1120000-0000-4000-8000-000000000001','alerts_test','Alerts Team');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('e1120000-0000-4000-8000-000000000001','authenticated','authenticated','alerts.master@example.test','',now(),'{}','{}',now(),now()),
 ('e1120000-0000-4000-8000-000000000002','authenticated','authenticated','alerts.viewer@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values
 ('f1120000-0000-4000-8000-000000000001','e1120000-0000-4000-8000-000000000001','alerts.master@example.test','Synthetic Master','active',now()),
 ('f1120000-0000-4000-8000-000000000002','e1120000-0000-4000-8000-000000000002','alerts.viewer@example.test','Synthetic Viewer','active',now());
insert into public.user_roles(user_id,role_id,scope_type) select 'f1120000-0000-4000-8000-000000000001',id,'global' from public.roles where key='super_admin';
insert into public.agents(id,agent_code,display_name,team_id) values
 ('a2120000-0000-4000-8000-000000000001','9801','Synthetic Agent A','d1120000-0000-4000-8000-000000000001'),
 ('a2120000-0000-4000-8000-000000000002','9802','Synthetic Agent B','d1120000-0000-4000-8000-000000000001');
insert into public.agent_sessions(token_hash,agent_id,expires_at) values
 (repeat('a',64),'a2120000-0000-4000-8000-000000000001',now()+interval '1 hour'),
 (repeat('b',64),'a2120000-0000-4000-8000-000000000002',now()+interval '1 hour');
create temp table alerts_test_state(lease uuid,other_lease uuid,occurrence uuid,config jsonb);
insert into alerts_test_state(config) select config from public.pulse_schedule_events where id='a1120000-0000-4000-8000-000000000002';
grant all on alerts_test_state to authenticated,service_role;

select set_config('request.jwt.claim.sub','e1120000-0000-4000-8000-000000000002',true);
set local role authenticated;
select lives_ok($$select public.get_pulse_schedule()$$,'active Staff can view schedule');
select throws_ok($$select public.save_pulse_schedule_event('a1120000-0000-4000-8000-000000000002',1,(select config from alerts_test_state))$$,'42501',null,'unauthorized Staff cannot edit');
select throws_ok($$select public.list_pulse_alert_occurrences()$$,'42501',null,'unauthorized Staff cannot view delivery');
reset role;
select set_config('request.jwt.claim.sub','e1120000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(public.save_pulse_schedule_event('a1120000-0000-4000-8000-000000000002',1,(select config from alerts_test_state))->>'revision','2','Master edit increments revision');
select throws_ok($$select public.save_pulse_schedule_event('a1120000-0000-4000-8000-000000000002',1,(select config from alerts_test_state))$$,'40001',null,'stale edit rejected');
reset role;
select is((select count(*) from public.pulse_schedule_versions where event_id='a1120000-0000-4000-8000-000000000002'),2::bigint,'edit audit retained');
select throws_ok($$select public.agent_open_pulse_alert_connection(repeat('c',64),'a3120000-0000-4000-8000-000000000001')$$,'28000',null,'unknown session denied');
update alerts_test_state set lease=(public.agent_open_pulse_alert_connection(repeat('a',64),'a3120000-0000-4000-8000-000000000001')->>'lease_id')::uuid;
update alerts_test_state set other_lease=(public.agent_open_pulse_alert_connection(repeat('a',64),'a3120000-0000-4000-8000-000000000002')->>'lease_id')::uuid;
select is((public.agent_open_pulse_alert_connection(repeat('a',64),'a3120000-0000-4000-8000-000000000001')->>'lease_id')::uuid,(select lease from alerts_test_state),'renewal preserves connection lease');
select set_config('request.jwt.claim.sub',(select lease::text from alerts_test_state),true);
select set_config('request.jwt.claims',(select jsonb_build_object('sub',lease,'pulse_alert_lease',lease)::text from alerts_test_state),true);
select set_config('realtime.topic','pulse-alerts-v1',true);
insert into realtime.messages(topic,extension,event,payload,private) values('pulse-alerts-v1','broadcast','alarm','{"test":true}',true);
set local role authenticated;
select ok(pulse_private.can_receive_pulse_alerts(),'server-bound lease can receive');
select ok((select count(*)>0 from realtime.messages where topic='pulse-alerts-v1'),'actual receive RLS accepts bound connection');
select throws_ok($$insert into realtime.messages(topic,extension,event,payload,private) values('pulse-alerts-v1','broadcast','alarm','{}',true)$$,'42501',null,'Agent cannot forge a broadcast');
select throws_ok($$select public.get_pulse_schedule()$$,'42501',null,'capability is not a Staff identity');
select throws_ok($$select public.agent_get_pulse_schedule('a2120000-0000-4000-8000-000000000001')$$,'42501',null,'capability cannot call service Agent RPC');
reset role;
select set_config('request.jwt.claims','{}',true);
select ok(not pulse_private.can_receive_pulse_alerts(),'unbound/fake identity cannot receive');

update public.pulse_alert_settings set enabled=true;
select is(pulse_private.collect_pulse_alerts('2026-10-12T15:55:00Z'),1,'weekday break pre-alert');
select is(pulse_private.collect_pulse_alerts('2026-10-12T16:00:00Z'),1,'weekday break start');
select is(pulse_private.collect_pulse_alerts('2026-10-12T16:00:20Z'),0,'retry does not duplicate occurrence');
select is(pulse_private.collect_pulse_alerts('2026-10-12T16:15:00Z'),1,'weekday break end');
select is(pulse_private.collect_pulse_alerts('2026-10-12T19:00:00Z'),1,'lunch start');
select is(pulse_private.collect_pulse_alerts('2026-10-12T20:00:00Z'),1,'lunch return');
select is(pulse_private.collect_pulse_alerts('2026-10-12T21:30:00Z'),1,'second break start');
select is(pulse_private.collect_pulse_alerts('2026-10-12T21:40:00Z'),1,'second break return');
select is(pulse_private.collect_pulse_alerts('2026-10-12T13:45:00Z'),1,'weekday shift start');
select is(pulse_private.collect_pulse_alerts('2026-10-13T00:00:00Z'),1,'weekday shift end uses Pacific date');
select is(pulse_private.collect_pulse_alerts('2026-10-17T15:45:00Z'),1,'Saturday shift starts 8:45 PT');
select is(pulse_private.collect_pulse_alerts('2026-10-17T16:00:00Z'),0,'Saturday has no break');
select is(pulse_private.collect_pulse_alerts('2026-10-17T21:00:00Z'),1,'Saturday shift ends 2 PT');
select is(pulse_private.collect_pulse_alerts('2026-10-18T16:00:00Z'),0,'Sunday has no initial schedule');
select is(pulse_private.collect_pulse_alerts('2026-03-06T17:00:00Z'),1,'winter 9 AM uses PST');
select is(pulse_private.collect_pulse_alerts('2026-03-09T16:00:00Z'),1,'spring change uses PDT, no missed break');
select is(pulse_private.collect_pulse_alerts('2026-11-02T17:00:00Z'),1,'fall change returns to PST');
select is(pulse_private.collect_pulse_alerts('2026-11-02T17:00:30Z'),0,'DST retry does not duplicate break');
select is(('2026-10-12T16:00:00Z'::timestamptz at time zone 'America/Managua')::text,'2026-10-12 10:00:00','Nicaragua conversion');
select is(('2026-10-12T16:00:00Z'::timestamptz at time zone 'America/Bogota')::text,'2026-10-12 11:00:00','Colombia conversion');
select is(('2026-10-12T16:00:00Z'::timestamptz at time zone 'Asia/Manila')::text,'2026-10-13 00:00:00','Philippines next-day conversion');
update public.pulse_schedule_events set config=config||'{"enabled":false}' where id='a1120000-0000-4000-8000-000000000002';
select is(pulse_private.collect_pulse_alerts('2026-10-19T16:00:00Z'),0,'disabled event produces no alarm');

-- A current synthetic occurrence tests the actual claim and receipt time gates.
insert into public.pulse_alert_occurrences(id,event_id,event_revision,pacific_date,phase,scheduled_at,expires_at,payload)
values('a4120000-0000-4000-8000-000000000001','a1120000-0000-4000-8000-000000000002',2,current_date,'start',clock_timestamp(),clock_timestamp()+interval '90 seconds','{"test":true}');
update alerts_test_state set occurrence='a4120000-0000-4000-8000-000000000001';
insert into public.pulse_alert_deliveries(occurrence_id,agent_id,agent_code,agent_name,team_name,pulse_open)
select 'a4120000-0000-4000-8000-000000000001',id,agent_code,display_name,'Alerts Team',id='a2120000-0000-4000-8000-000000000001' from public.agents;
select is(jsonb_array_length(public.agent_pending_pulse_alerts(repeat('a',64),(select lease from alerts_test_state))),1,'reconnecting current connection recovers unclaimed fresh occurrence');
select throws_ok($$select public.agent_pending_pulse_alerts(repeat('b',64),(select lease from alerts_test_state))$$,'42501',null,'reconnect recovery cannot use another Agent lease');
select ok(public.agent_claim_pulse_alert(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'a5120000-0000-4000-8000-000000000001') is not null,'own active connection claims current occurrence');
select is(jsonb_array_length(public.agent_pending_pulse_alerts(repeat('a',64),(select lease from alerts_test_state))),0,'claimed alarm is not replayed by reconnection');
select ok(public.agent_claim_pulse_alert(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'a5120000-0000-4000-8000-000000000001') is not null,'same request retry returns same claim');
select ok(public.agent_claim_pulse_alert(repeat('a',64),(select other_lease from alerts_test_state),(select occurrence from alerts_test_state),'a5120000-0000-4000-8000-000000000002') is null,'second tab cannot claim duplicate sound');
select throws_ok($$select public.agent_claim_pulse_alert(repeat('b',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'a5120000-0000-4000-8000-000000000003')$$,'42501',null,'another Agent cannot claim lease');
select throws_ok($$select public.agent_record_pulse_alert_receipt(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'sound_started')$$,'22023',null,'sound cannot be reported before visual');
select lives_ok($$select public.agent_record_pulse_alert_receipt(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'visual_displayed')$$,'own visual receipt accepted');
select lives_ok($$select public.agent_record_pulse_alert_receipt(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'audio_blocked')$$,'blocked audio reported');
select throws_ok($$select public.agent_record_pulse_alert_receipt(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'sound_started')$$,'40001',null,'cannot contradict audio outcome');
select throws_ok($$select public.agent_record_pulse_alert_receipt(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'heard')$$,'22023',null,'no Heard state');
select set_config('request.jwt.claim.sub','e1120000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(public.get_pulse_alert_report((select occurrence from alerts_test_state))->'counts'->>'targeted','2','Master report snapshots eligible Agent audience');
select is(public.get_pulse_alert_report((select occurrence from alerts_test_state))->'counts'->>'audio_blocked','1','Master sees blocked sound');
select is(public.get_pulse_alert_report((select occurrence from alerts_test_state))->'counts'->>'sound_started','0','blocked is not Sound started');
select throws_ok($$select public.get_pulse_alert_report((select occurrence from alerts_test_state),-1)$$,'22023',null,'report paging bounded');
reset role;
update public.pulse_alert_occurrences set expires_at=clock_timestamp()-interval '40 minutes' where id=(select occurrence from alerts_test_state);
select ok(public.agent_claim_pulse_alert(repeat('a',64),(select lease from alerts_test_state),(select occurrence from alerts_test_state),'a5120000-0000-4000-8000-000000000001') is null,'40-minute stale alarm never returned');
select is(jsonb_array_length(public.agent_pending_pulse_alerts(repeat('a',64),(select lease from alerts_test_state))),0,'stale reconnect alarm never returned');
update public.agent_sessions set revoked_at=clock_timestamp() where token_hash=repeat('a',64);
select set_config('request.jwt.claim.sub',(select lease::text from alerts_test_state),true);
select set_config('request.jwt.claims',(select jsonb_build_object('sub',lease,'pulse_alert_lease',lease)::text from alerts_test_state),true);
select ok(not pulse_private.can_receive_pulse_alerts(),'session revocation denies Realtime renew/rejoin');
select throws_ok($$select public.agent_open_pulse_alert_connection(repeat('a',64),'a3120000-0000-4000-8000-000000000001')$$,'28000',null,'revoked session cannot renew');
select throws_ok($$select public.activate_preview_pulse_alert_scheduler()$$,'42501',null,'activation requires an actual isolated Preview credential');
insert into public.agents(agent_code,display_name,team_id)
 select (990000+i)::text,'Synthetic load '||i,'d1120000-0000-4000-8000-000000000001' from generate_series(1,998) i;
update public.pulse_schedule_events set config=config||'{"enabled":true}' where id='a1120000-0000-4000-8000-000000000002';
select is(pulse_private.collect_pulse_alerts('2026-10-20T16:00:00Z'),1,'1000 Agents produce one occurrence, not 1000 jobs');
select is((select count(*) from public.pulse_alert_deliveries where occurrence_id=(select id from public.pulse_alert_occurrences where pacific_date='2026-10-20' and phase='start')),1000::bigint,'1000 bounded per-occurrence delivery targets');
select ok(not exists(select 1 from public.pulse_alert_deliveries where occurrence_id=(select id from public.pulse_alert_occurrences where pacific_date='2026-10-20' and phase='start') and pulse_open),'missing/expired presence does not invent open clients');
select * from finish();
rollback;
