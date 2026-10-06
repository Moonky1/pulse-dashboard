begin;
create extension if not exists pgtap with schema extensions;
set local search_path=extensions,public;
select no_plan();

select ok(not has_table_privilege('authenticated','pulse_private.staff_audit_purge_context','INSERT'),'browser cannot manufacture audit deletion authority');
select ok(not has_table_privilege('service_role','pulse_private.staff_audit_purge_context','INSERT'),'service client cannot manufacture audit deletion authority');
select ok(not has_function_privilege('authenticated','pulse_private.admin2_prepare_staff_removal_base(uuid,timestamptz,text,uuid)','EXECUTE'),'browser cannot bypass permanent removal checks');
select ok(not has_function_privilege('anon','public.prepare_staff_removal(uuid,timestamptz,text,uuid)','EXECUTE'),'anonymous deletion denied');
select ok(not has_function_privilege('authenticated','public.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean)','EXECUTE'),'browser cannot falsely complete Auth cleanup');

insert into public.departments(id,code,name) values('d2600000-0000-4000-8000-000000000001','purge_review','Purge review');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('a2600000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,'authenticated','authenticated',
  'purge.'||number||'@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now() from generate_series(1,4) number;
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
select ('b2600000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,
  ('a2600000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,'KK-92600'||number,
  'purge.'||number||'@example.test','Purge fixture '||number,'active','d2600000-0000-4000-8000-000000000001',now()
from generate_series(1,4) number;
insert into public.user_roles(user_id,role_id,scope_type,assigned_by_user_id)
select ('b2600000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,
  case when number=1 then '10000000-0000-0000-0000-000000000010'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,
  'global','b2600000-0000-4000-8000-000000000001' from generate_series(1,4) number;
insert into auth.sessions(id,user_id,created_at,updated_at)
values('c2600000-0000-4000-8000-000000000002','a2600000-0000-4000-8000-000000000002',now(),now());
insert into public.audit_events(actor_user_id,target_type,target_id,action,source) values
 ('b2600000-0000-4000-8000-000000000002','user','b2600000-0000-4000-8000-000000000002','account.pending_created','server'),
 ('b2600000-0000-4000-8000-000000000001','user','b2600000-0000-4000-8000-000000000002','account.approved','server'),
 ('b2600000-0000-4000-8000-000000000004','user','b2600000-0000-4000-8000-000000000003','role.assigned','server');
create table pulse_private.purge_test_shared(staff_id uuid references public.users(id) on delete restrict);
insert into pulse_private.purge_test_shared values('b2600000-0000-4000-8000-000000000003');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002',now(),'REMOVE','e2600000-0000-4000-8000-000000000002')$$,'28000',null,'real authentication required');
select set_config('request.jwt.claim.sub','a2600000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002',now(),'REMOVE','e2600000-0000-4000-8000-000000000002')$$,'42501',null,'ordinary Staff cannot purge');
select set_config('request.jwt.claim.sub','a2600000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000001',now(),'REMOVE','e2600000-0000-4000-8000-000000000001')$$,'42501',null,'self-deletion denied');
select throws_ok($$delete from public.users where id='b2600000-0000-4000-8000-000000000001'$$,'55000',null,'last Super Admin remains protected');
select is(public.inspect_staff_removal('b2600000-0000-4000-8000-000000000002')->>'kind','purge','own account audit is removable, not a retained identity');
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002',now(),'YES','e2600000-0000-4000-8000-000000000002')$$,'22023',null,'typed confirmation remains mandatory');
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002','2000-01-01','REMOVE','e2600000-0000-4000-8000-000000000002')$$,'55000',null,'stale account version denied before deleting audit');
select is((select count(*) from public.audit_events where target_id='b2600000-0000-4000-8000-000000000002'),2::bigint,'failed preparation preserves own history');
select throws_ok($$delete from public.audit_events where target_id='b2600000-0000-4000-8000-000000000002'$$,'P0001',null,'direct audit deletion remains denied even for database owner');
select throws_ok($$update public.audit_events set source='database' where target_id='b2600000-0000-4000-8000-000000000002'$$,'P0001',null,'audit updates remain append-only');
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000003',(select updated_at from public.users where id='b2600000-0000-4000-8000-000000000003'),'REMOVE','e2600000-0000-4000-8000-000000000003')$$,'55000',null,'unknown shared dependency is blocked rather than deleted');
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000004',(select updated_at from public.users where id='b2600000-0000-4000-8000-000000000004'),'REMOVE','e2600000-0000-4000-8000-000000000004')$$,'55000',null,'actions about another person remain protected');
select lives_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002',(select updated_at from public.users where id='b2600000-0000-4000-8000-000000000002'),'REMOVE','e2600000-0000-4000-8000-000000000002')$$,'confirmed permanent purge succeeds');
select is((select count(*) from public.users where id='b2600000-0000-4000-8000-000000000002'),0::bigint,'Staff profile physically deleted');
select is((select count(*) from public.audit_events where target_id='b2600000-0000-4000-8000-000000000002' or actor_user_id='b2600000-0000-4000-8000-000000000002'),0::bigint,'all own account history physically deleted, including removal event');
select is((select count(*) from public.user_roles where user_id='b2600000-0000-4000-8000-000000000002'),0::bigint,'role grants deleted');
select is((select count(*) from auth.sessions where user_id='a2600000-0000-4000-8000-000000000002'),0::bigint,'refresh sessions revoked');
select is((select count(*) from pulse_private.staff_audit_purge_context),0::bigint,'audit deletion authority does not persist past the operation');
select is((select count(*) from public.audit_events where target_id='b2600000-0000-4000-8000-000000000003'),1::bigint,'other person audit unchanged');
select is((select count(*) from public.users),3::bigint,'other Staff identities preserved');
select is(jsonb_array_length(public.list_own_staff_removal_tasks()),1,'Auth cleanup remains recoverable until it actually completes');
select lives_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002',now(),'REMOVE','e2600000-0000-4000-8000-000000000002')$$,'same request resumes safely');
select lives_ok($$delete from auth.users where id='a2600000-0000-4000-8000-000000000002'$$,'Auth is physically deletable after profile purge');
select lives_ok($$select public.complete_staff_removal_cleanup('e2600000-0000-4000-8000-000000000002','a2600000-0000-4000-8000-000000000001',true,true)$$,'privileged cleanup completion succeeds');
select is((select count(*) from pulse_private.staff_removal_jobs where target_user_id='b2600000-0000-4000-8000-000000000002'),0::bigint,'completed jobs retain no deleted-person identifiers');
select is(jsonb_array_length(public.list_own_staff_removal_tasks()),0,'completed cleanup leaves no pending task');
select lives_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000002',now(),'REMOVE','e2600000-0000-4000-8000-000000000002')$$,'completed anonymous nonce is idempotent');
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000003',now(),'REMOVE','e2600000-0000-4000-8000-000000000002')$$,'42501',null,'completed nonce cannot be retargeted to another person');
select is(public.get_staff_removal_cleanup('e2600000-0000-4000-8000-000000000002','a2600000-0000-4000-8000-000000000001')->>'auth_done','true','completed nonce does not retry Auth deletion');
select throws_ok($$select public.get_staff_removal_cleanup('e2600000-0000-4000-8000-000000000002','a2600000-0000-4000-8000-000000000004')$$,'42501',null,'different operator cannot reuse cleanup');
select lives_ok($$select public.claim_staff_invitation_send_v2('purge.2@example.test','Rejoined person','d2600000-0000-4000-8000-000000000001',null,null,null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'f2600000-0000-4000-8000-000000000002',null)$$,'same email can create a fresh invitation after complete purge');
select is((select count(*) from public.staff_invitations where email_normalized='purge.2@example.test'),1::bigint,'exactly one fresh invitation is created, without sending mail in this test');
select lives_ok($$select public.apply_org3a_business_catalog()$$,'catalog can still be applied');
select is((select count(*) from public.operating_units where code='to'),0::bigint,'TO is absent and is never recreated by catalog application');
select is((select count(*) from public.operating_units where code='openers'),1::bigint,'Openers preserved');
select is((select count(*) from public.operating_units where code='closers'),2::bigint,'existing Closers preserved');
select ok(not exists(select 1 from jsonb_array_elements(public.get_staff_invitation_options()->'operating_units') unit where unit->>'code'='to'),'invitation options never expose TO');

-- Reviewed recovery for an account retired by the previous historical contract.
-- This recipe is owner-only, exact-target and transactional, not a browser bypass.
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,banned_until)
values('a2600000-0000-4000-8000-000000000005','authenticated','authenticated','purge.5@example.test','',now(),'{}','{}',now(),now(),now()+interval '100 years');
insert into public.users(id,auth_user_id,email,full_name,status,removed_at)
values('b2600000-0000-4000-8000-000000000005','a2600000-0000-4000-8000-000000000005','purge.5@example.test','Retired fixture','inactive',now());
insert into pulse_private.staff_removal_jobs(request_key,actor_user_id,actor_auth_user_id,target_user_id,target_auth_user_id,removal_kind,completed_at,auth_cleanup_done,media_cleanup_done)
values('e2600000-0000-4000-8000-000000000005','b2600000-0000-4000-8000-000000000001','a2600000-0000-4000-8000-000000000001','b2600000-0000-4000-8000-000000000005','a2600000-0000-4000-8000-000000000005','historical',now(),true,true);
insert into public.audit_events(actor_user_id,target_type,target_id,action,source)
select case when number=1 then 'b2600000-0000-4000-8000-000000000005'::uuid else 'b2600000-0000-4000-8000-000000000001'::uuid end,
 'user','b2600000-0000-4000-8000-000000000005',case number when 1 then 'account.pending_created' when 2 then 'account.approved' when 3 then 'role.assigned' else 'account.removed' end,'server'
from generate_series(1,4) number;
select is(pulse_private.staff_removal_dependencies('b2600000-0000-4000-8000-000000000005'),'{}'::jsonb,'retired account has only its own removable history');
select throws_ok($$select public.prepare_staff_removal('b2600000-0000-4000-8000-000000000005',now(),'REMOVE',gen_random_uuid())$$,'P0002',null,'a new browser request cannot silently upgrade an old historical removal');
select lives_ok($$do $recipe$
declare target public.users%rowtype; job pulse_private.staff_removal_jobs%rowtype;
begin
  lock table public.users,public.user_roles,public.audit_events in share row exclusive mode;
  select * into strict target from public.users where id='b2600000-0000-4000-8000-000000000005' for update;
  select * into strict job from pulse_private.staff_removal_jobs where request_key='e2600000-0000-4000-8000-000000000005' for update;
  if target.auth_user_id<>'a2600000-0000-4000-8000-000000000005' or target.status<>'inactive' or target.removed_at is null
    or job.target_user_id<>target.id or job.target_auth_user_id<>target.auth_user_id or job.removal_kind<>'historical'
    or job.completed_at is null or job.actor_user_id=target.id or job.avatar_path is not null
    or pulse_private.staff_removal_dependencies(target.id)<>'{}'::jsonb
    or (select count(*) from public.audit_events where target_type='user' and target_id=target.id)<>4 then
    raise exception 'retired target changed'; end if;
  insert into pulse_private.staff_audit_purge_context values(pg_backend_pid(),txid_current(),target.id,job.actor_user_id);
  delete from public.audit_events where target_type='user' and target_id=target.id;
  delete from public.users where id=target.id;
  delete from pulse_private.staff_audit_purge_context where backend_pid=pg_backend_pid() and transaction_id=txid_current();
  update pulse_private.staff_removal_jobs set removal_kind='purge',completed_at=null,auth_cleanup_done=false where request_key=job.request_key;
end $recipe$;$$,'exact-target recovery deletes a retired profile without disabling audit guards');
select is((select count(*) from public.users where id='b2600000-0000-4000-8000-000000000005'),0::bigint,'retired profile physically deleted');
select is((select count(*) from public.audit_events where target_id='b2600000-0000-4000-8000-000000000005' or actor_user_id='b2600000-0000-4000-8000-000000000005'),0::bigint,'all four retired account events deleted');
select is(public.get_staff_removal_cleanup('e2600000-0000-4000-8000-000000000005','a2600000-0000-4000-8000-000000000001')->>'auth_done','false','old ban is not mistaken for physical Auth deletion');
select lives_ok($$delete from auth.users where id='a2600000-0000-4000-8000-000000000005'; select public.complete_staff_removal_cleanup('e2600000-0000-4000-8000-000000000005','a2600000-0000-4000-8000-000000000001',true,true);$$,'Auth cleanup deletes the retired identity and completes its anonymous receipt');
select is((select count(*) from pulse_private.staff_removal_jobs where target_user_id='b2600000-0000-4000-8000-000000000005'),0::bigint,'legacy completed job retains no removed identity');
select is((select count(*) from public.audit_events where target_id='b2600000-0000-4000-8000-000000000003'),1::bigint,'retired recovery preserves other peoples account history');
select lives_ok($$select public.claim_staff_invitation_send_v2('purge.5@example.test','New invitation','d2600000-0000-4000-8000-000000000001',null,null,null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'f2600000-0000-4000-8000-000000000005',null)$$,'same retired email can be reinvited after complete cleanup');
select * from finish();
rollback;
