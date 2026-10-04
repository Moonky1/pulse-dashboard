begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public','agents','Agent identity is separate from Staff users');
select has_table('public','training_agent_learner_links','canonical Agent learner bridge exists');
select has_table('public','agent_sessions','revocable Agent sessions exist');
select ok((select relrowsecurity from pg_class where oid='public.agents'::regclass),'Agent RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.agent_credentials'::regclass),'PIN RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.agent_sessions'::regclass),'session RLS enabled');
select ok(not has_table_privilege('anon','public.agents','SELECT'),'anonymous browser cannot enumerate Agents');
select ok(not has_table_privilege('authenticated','public.agent_credentials','SELECT'),'Staff browser cannot read PIN hashes');
select ok(not has_table_privilege('authenticated','public.agent_sessions','SELECT'),'Staff browser cannot read sessions');
select ok(not has_function_privilege('anon','public.agent_login_with_pin(text,text,text)','EXECUTE'),'anonymous browser cannot call login verifier');
select ok(not has_function_privilege('authenticated','public.agent_login_with_pin(text,text,text)','EXECUTE'),'Staff browser cannot call login verifier');
select ok(not has_function_privilege('anon','public.admin_provision_agent(text,text,uuid,text,text,uuid)','EXECUTE'),'anonymous caller cannot provision an Agent');

insert into public.business_areas(id,code,name,is_active)
values ('ba410000-0000-4000-8000-000000000002','agent1_test','Agent-1 Test Area',true);
insert into public.campaigns(id,business_area_id,code,name,is_active)
values ('ca410000-0000-4000-8000-000000000001','ba410000-0000-4000-8000-000000000002',
  'agent1_campaign','Agent-1 Test Campaign',true);
insert into public.operating_units(id,business_area_id,campaign_id,code,name,is_active)
values ('0a410000-0000-4000-8000-000000000001','ba410000-0000-4000-8000-000000000002',
  'ca410000-0000-4000-8000-000000000001','openers','Openers',true);
insert into public.teams(id,business_area_id,campaign_id,operating_unit_id,code,name,is_active) values
  ('ea410000-0000-4000-8000-000000000001','ba410000-0000-4000-8000-000000000002',
    'ca410000-0000-4000-8000-000000000001','0a410000-0000-4000-8000-000000000001',
    'agent1_team_a','Agent-1 Team A',true),
  ('ea410000-0000-4000-8000-000000000002','ba410000-0000-4000-8000-000000000002',
    'ca410000-0000-4000-8000-000000000001','0a410000-0000-4000-8000-000000000001',
    'agent1_team_b','Agent-1 Team B',true);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('aa410000-0000-4000-8000-000000000001','authenticated','authenticated','agent1.admin@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at)
values ('ba410000-0000-4000-8000-000000000001','aa410000-0000-4000-8000-000000000001','agent1.admin@example.test','Agent-1 Admin','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type)
values ('fa410000-0000-4000-8000-000000000001','ba410000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','aa410000-0000-4000-8000-000000000001',true);

select lives_ok($$select public.admin_provision_agent('3248','QA Agent 3248',
  'ea410000-0000-4000-8000-000000000001','123456',null,null)$$,
  'authorized Staff can provision approved Agent');
select is((select count(*) from public.agents where agent_code='3248'),1::bigint,
  'canonical Agent row exists');
select ok((select pin_hash <> '123456' and length(pin_hash) > 40
  from public.agent_credentials where agent_id=(select id from public.agents where agent_code='3248')),
  'PIN is hashed, not stored as plaintext');
select is((select count(*) from public.training_agent_learner_links link
  join public.agents agent on agent.id=link.agent_id where agent.agent_code='3248'),1::bigint,
  'Agent has exactly one canonical learner link');
select is((select count(*) from public.users where email='agent1.admin@example.test'),1::bigint,
  'provisioning Agent did not create a Staff user');
select throws_ok($$select public.admin_provision_agent('3248','Duplicate Agent',
  'ea410000-0000-4000-8000-000000000001','123456')$$,'23505',null,
  'Agent ID is unique');

select is(public.agent_login_with_pin('3248','999999',repeat('a',64))->>'authenticated','false',
  'wrong PIN denied without revealing whether ID exists');
select is(public.agent_login_with_pin('9999','999999',repeat('b',64))->>'authenticated','false',
  'unknown ID uses same generic result');
select is((select failed_attempts from public.agent_login_throttle where agent_code='3248'),1,
  'wrong PIN is persisted for throttling');
select public.agent_login_with_pin('3248','999999',repeat('c',64));
select public.agent_login_with_pin('3248','999999',repeat('d',64));
select public.agent_login_with_pin('3248','999999',repeat('e',64));
select is(public.agent_login_with_pin('3248','999999',repeat('f',64))->>'authenticated','false',
  'fifth failure locks the credential temporarily');
select is(public.agent_login_with_pin('3248','123456',repeat('1',64))->>'authenticated','false',
  'correct PIN cannot bypass temporary lock');
select ok((select locked_until > now() from public.agent_login_throttle where agent_code='3248'),
  'temporary lock deadline is recorded');

update public.agent_login_throttle set failed_attempts=0,locked_until=null where agent_code='3248';
select is(public.agent_login_with_pin('3248','123456',repeat('2',64))->>'authenticated','true',
  'valid PIN creates an Agent session');
select is(public.agent_session_profile(repeat('2',64))->>'display_name','QA Agent 3248',
  'session resolves the canonical display identity');
select is((select token_hash from public.agent_sessions where agent_id=(select id from public.agents where agent_code='3248')),
  repeat('2',64),'only token hash is stored');
select public.agent_logout(repeat('2',64));
select throws_ok($$select public.agent_session_profile(repeat('2',64))$$,'28000',null,
  'logout revokes session');

select public.admin_reset_agent_pin((select id from public.agents where agent_code='3248'),'654321');
select is(public.agent_login_with_pin('3248','123456',repeat('3',64))->>'authenticated','false',
  'old PIN is invalid after reset');
select is(public.agent_login_with_pin('3248','654321',repeat('4',64))->>'authenticated','true',
  'new PIN works after reset');
select public.admin_update_agent((select id from public.agents where agent_code='3248'),
  'blocked','ea410000-0000-4000-8000-000000000002',null);
select throws_ok($$select public.agent_session_profile(repeat('4',64))$$,'28000',null,
  'blocked Agent loses existing session');
select throws_ok($$select public.agent_login_with_pin('3248','654321',repeat('5',64))$$,'42501',null,
  'blocked Agent cannot create a session');
select is((select count(*) from public.audit_events where target_type='agent'
  and target_id=(select id from public.agents where agent_code='3248')),
  4::bigint,'provision, PIN, status, and team changes are audited');

select * from finish();
rollback;
