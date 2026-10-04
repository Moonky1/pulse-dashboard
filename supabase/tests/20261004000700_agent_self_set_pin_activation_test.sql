begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public','agent_activations','one-time activations have a separate table');
select ok((select relrowsecurity from pg_class where oid='public.agent_activations'::regclass),
  'activation records have RLS');
select ok(not has_table_privilege('authenticated','public.agent_activations','SELECT'),
  'Staff browser cannot read activation hashes');
select ok(not has_function_privilege('anon','public.agent_activate_with_code(text,text,text)','EXECUTE'),
  'anonymous browser cannot call the activation verifier directly');
select ok(not has_function_privilege('authenticated','public.agent_activate_with_code(text,text,text)','EXECUTE'),
  'Staff browser cannot call the activation verifier directly');
select ok(not has_function_privilege('authenticated','public.admin_provision_agent(text,text,uuid,text,text,uuid)','EXECUTE'),
  'old Staff-set-PIN provisioning contract is retired');
select ok(not has_function_privilege('authenticated','public.admin_reset_agent_pin(uuid,text)','EXECUTE'),
  'old Staff-set-PIN reset contract is retired');

insert into public.business_areas(id,code,name,is_active)
values ('ba470000-0000-4000-8000-000000000002','agent1_activation','Activation Test Area',true);
insert into public.campaigns(id,business_area_id,code,name,is_active)
values ('ca470000-0000-4000-8000-000000000001','ba470000-0000-4000-8000-000000000002',
  'agent1_activation','Activation Test Campaign',true);
insert into public.operating_units(id,business_area_id,campaign_id,code,name,is_active)
values ('0a470000-0000-4000-8000-000000000001','ba470000-0000-4000-8000-000000000002',
  'ca470000-0000-4000-8000-000000000001','openers','Openers',true);
insert into public.operating_units(id,business_area_id,campaign_id,code,name,is_active)
values ('0a470000-0000-4000-8000-000000000002','ba470000-0000-4000-8000-000000000002',
  'ca470000-0000-4000-8000-000000000001','closers','Closers',true);
insert into public.teams(id,business_area_id,campaign_id,operating_unit_id,code,name,is_active)
values ('ea470000-0000-4000-8000-000000000001','ba470000-0000-4000-8000-000000000002',
  'ca470000-0000-4000-8000-000000000001','0a470000-0000-4000-8000-000000000001',
  'agent1_activation','Activation Test Team',true);
insert into public.teams(id,business_area_id,campaign_id,code,name,is_active)
values ('ea470000-0000-4000-8000-000000000002','ba470000-0000-4000-8000-000000000002',
  'ca470000-0000-4000-8000-000000000001','non_opener','Non-opener Test Team',true);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('aa470000-0000-4000-8000-000000000001','authenticated','authenticated',
  'agent1.activation@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at)
values ('ba470000-0000-4000-8000-000000000001','aa470000-0000-4000-8000-000000000001',
  'agent1.activation@example.test','Activation Admin','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type)
values ('fa470000-0000-4000-8000-000000000001','ba470000-0000-4000-8000-000000000001',
  '10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','aa470000-0000-4000-8000-000000000001',true);

select throws_ok($$select public.admin_prepare_agent_activation('4790','Wrong Team',
  'ea470000-0000-4000-8000-000000000002',null,null)$$,'22023',null,
  'an administrator cannot provision an Agent outside an opener team');
select throws_ok($$select public.admin_prepare_agent_activation('4791','Wrong Unit',
  'ea470000-0000-4000-8000-000000000001',null,
  '0a470000-0000-4000-8000-000000000002')$$,'22023',null,
  'an administrator cannot attach an opener Agent to a different operating unit');

create temporary table activation_fixture(agent_id uuid,agent_code text,activation_code text);
insert into activation_fixture
select (result->>'agent_id')::uuid,result->>'agent_code',result->>'activation_code'
from (select public.admin_prepare_agent_activation('4747','Activation Agent',
  'ea470000-0000-4000-8000-000000000001',null,null) result) created;

select is((select operating_unit_id from public.agents
  where id=(select agent_id from activation_fixture)),
  '0a470000-0000-4000-8000-000000000001'::uuid,
  'Agent inherits the opener operating unit from the selected team');
select throws_ok($$select public.admin_update_agent(
  (select agent_id from activation_fixture where agent_code='4747'),
  'active','ea470000-0000-4000-8000-000000000002',null)$$,'22023',null,
  'an administrator cannot move an Agent outside an opener team');

select ok((select activation_code ~ '^[0-9a-f]{16}$' from activation_fixture),
  'Staff receives a 64-bit one-time code');
select ok((select pin_hash is null from public.agent_credentials
  where agent_id=(select agent_id from activation_fixture)),
  'Staff never chooses or stores the initial PIN');
select ok((select activation.code_hash <> fixture.activation_code
  and length(activation.code_hash)=64 and activation.expires_at <= now()+interval '24 hours'
  from public.agent_activations activation join activation_fixture fixture
  on fixture.agent_id=activation.agent_id),'only a hash is stored with a short expiry');
select is(public.agent_login_with_pin('4747','123456',repeat('a',64))->>'authenticated','false',
  'Agent cannot sign in before creating a PIN');
select is(public.agent_activate_with_code('4747','0000000000000000','731482')->>'activated','false',
  'wrong activation code is denied');
select is((select failed_attempts from public.agent_activations
  where agent_id=(select agent_id from activation_fixture)),1,
  'wrong code is counted');
select public.agent_activate_with_code('4747','0000000000000000','731482');
select public.agent_activate_with_code('4747','0000000000000000','731482');
select public.agent_activate_with_code('4747','0000000000000000','731482');
select is(public.agent_activate_with_code('4747','0000000000000000','731482')->>'activated','false',
  'fifth failure is denied');
select ok((select locked_until > now() from public.agent_activations
  where agent_id=(select agent_id from activation_fixture)),
  'activation is temporarily locked after five wrong codes');
select is((select public.agent_activate_with_code('4747',activation_code,'731482')->>'activated'
  from activation_fixture),'false','correct code cannot bypass an active lock');
update public.agent_activations set failed_attempts=0,locked_until=null
where agent_id=(select agent_id from activation_fixture);
select is((select public.agent_activate_with_code('4747',activation_code,'731482')->>'activated'
  from activation_fixture),'true','Agent sets their own PIN with the issued code');
select is((select public.agent_activate_with_code('4747',activation_code,'000000')->>'activated'
  from activation_fixture),'false','activation code cannot be reused');
select is(public.agent_login_with_pin('4747','731482',repeat('b',64))->>'authenticated','true',
  'self-selected PIN opens a session');

alter table activation_fixture add column old_code text;
update activation_fixture set old_code=activation_code;
update activation_fixture set activation_code=(
  select result->>'activation_code' from (
    select public.admin_reissue_agent_activation('4747') result) issued);
select throws_ok($$select public.agent_session_profile(repeat('b',64))$$,'28000',null,
  'reissue immediately revokes open sessions');
select is(public.agent_login_with_pin('4747','731482',repeat('c',64))->>'authenticated','false',
  'reissue immediately invalidates the old PIN');
select is((select public.agent_activate_with_code('4747',old_code,'654321')->>'activated'
  from activation_fixture),'false','reissue invalidates the old activation code');
select is((select public.agent_activate_with_code('4747',activation_code,'654321')->>'activated'
  from activation_fixture),'true','Agent can choose a replacement PIN');
select is(public.agent_login_with_pin('4747','654321',repeat('d',64))->>'authenticated','true',
  'replacement PIN works');
select is((select count(*) from public.audit_events where target_id=(select agent_id from activation_fixture)
  and action in ('agent.provisioned','agent.activated','agent.activation_reissued')),4::bigint,
  'provisioning, reissue, and both activations are audited');
select is((select count(*) from public.users where email='agent1.activation@example.test'),1::bigint,
  'Agent activation does not create a Staff identity');

insert into activation_fixture(agent_id,agent_code,activation_code)
select (result->>'agent_id')::uuid,result->>'agent_code',result->>'activation_code'
from (select public.admin_prepare_agent_activation('4748','Expired Agent',
  'ea470000-0000-4000-8000-000000000001',null,null) result) created;
update public.agent_activations set issued_at=now()-interval '25 hours',
  expires_at=now()-interval '1 hour'
where agent_id=(select agent_id from activation_fixture where agent_code='4748');
select is((select public.agent_activate_with_code('4748',activation_code,'731482')->>'activated'
  from activation_fixture where agent_code='4748'),'false','expired code cannot activate an Agent');

select * from finish();
rollback;
