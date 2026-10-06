begin;
create extension if not exists pgtap with schema extensions;
set local search_path=extensions,public;
grant usage on schema extensions to authenticated;
select no_plan();

select ok(not has_function_privilege('anon','public.inspect_staff_removal(uuid)','EXECUTE'),'anonymous removal inspection denied');
select ok(not has_function_privilege('authenticated','public.get_staff_removal_cleanup(uuid,uuid)','EXECUTE'),'browser cannot obtain Auth cleanup identifiers');
select ok(not has_table_privilege('authenticated','pulse_private.staff_removal_jobs','SELECT'),'removal job table is private');
select ok(not has_function_privilege('anon','public.list_admin_agents(text,uuid,text,text,integer)','EXECUTE'),'anonymous Agent directory denied');
select ok(not has_function_privilege('anon','public.remove_staff_invitation(uuid,timestamptz,text)','EXECUTE'),'anonymous invitation deletion denied');
select is((select count(*) from public.role_permissions grant_row join public.permissions permission on permission.id=grant_row.permission_id join public.roles role on role.id=grant_row.role_id where permission.key='users.remove' and role.key<>'super_admin'),0::bigint,'new removal permission is not silently given to ordinary Admin');

insert into public.departments(id,code,name) values('d2500000-0000-4000-8000-000000000001','admin2_disposable','ADMIN-2 Disposable');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('a2500000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,'authenticated','authenticated',
  'admin2.'||number||'@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now() from generate_series(1,5) number;
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
select ('b2500000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,
  ('a2500000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,'KK-92500'||number,
  'admin2.'||number||'@example.test','ADMIN-2 Fixture '||number,
  case when number=4 then 'blocked' else 'active' end,'d2500000-0000-4000-8000-000000000001',now()
from generate_series(1,5) number;
insert into public.user_roles(user_id,role_id,scope_type,assigned_by_user_id)
select ('b2500000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,
  case when number=1 then '10000000-0000-0000-0000-000000000010'::uuid when number=5 then '10000000-0000-0000-0000-000000000009'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,
  'global','b2500000-0000-4000-8000-000000000001' from generate_series(1,5) number;
insert into auth.sessions(id,user_id,created_at,updated_at) values
 ('c2500000-0000-4000-8000-000000000002','a2500000-0000-4000-8000-000000000002',now(),now()),
 ('c2500000-0000-4000-8000-000000000003','a2500000-0000-4000-8000-000000000003',now(),now());
insert into public.audit_events(actor_user_id,target_type,target_id,action,source)
values('b2500000-0000-4000-8000-000000000001','user','b2500000-0000-4000-8000-000000000003','account.approved','server');
-- A newly discovered reference must fail closed, even when not named by the feature.
create table pulse_private.admin2_test_dependency(staff_id uuid references public.users(id) on delete restrict);
insert into pulse_private.admin2_test_dependency values('b2500000-0000-4000-8000-000000000003');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.inspect_staff_removal('b2500000-0000-4000-8000-000000000002')$$,'28000',null,'real authentication required');
select set_config('request.jwt.claim.sub','a2500000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.inspect_staff_removal('b2500000-0000-4000-8000-000000000003')$$,'42501',null,'ordinary Staff removal denied');
select throws_ok($$select public.list_admin_agents()$$,'42501',null,'ordinary Staff cannot enumerate Agents');
select set_config('request.jwt.claim.sub','a2500000-0000-4000-8000-000000000005',true);
select throws_ok($$select public.inspect_staff_removal('b2500000-0000-4000-8000-000000000002')$$,'42501',null,'Admin cannot use new destructive permission');
select set_config('request.jwt.claim.sub','a2500000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.inspect_staff_removal('b2500000-0000-4000-8000-000000000002')$$,'42501',null,'blocked operator denied');
select set_config('request.jwt.claim.sub','a2500000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.inspect_staff_removal('b2500000-0000-4000-8000-000000000001')$$,'42501',null,'self-removal denied');
select throws_ok($$delete from public.users where id='b2500000-0000-4000-8000-000000000001'$$,'55000',null,'final active Super Admin deletion stays protected');
select is(public.inspect_staff_removal('b2500000-0000-4000-8000-000000000002')->>'kind','purge','dependency-free Staff can be fully purged');
select is(public.inspect_staff_removal('b2500000-0000-4000-8000-000000000003')->>'kind','historical','discovered shared foreign key requires a reviewed deletion plan');
select ok(pulse_private.staff_removal_dependencies('b2500000-0000-4000-8000-000000000003') ? 'pulse_private.admin2_test_dependency.staff_id','generic foreign key discovery is exercised');
select throws_ok($$select public.prepare_staff_removal('b2500000-0000-4000-8000-000000000002',now(),'DELETE','e2500000-0000-4000-8000-000000000001')$$,'22023',null,'exact REMOVE confirmation required');
select throws_ok($$select public.prepare_staff_removal('b2500000-0000-4000-8000-000000000002','2000-01-01','REMOVE','e2500000-0000-4000-8000-000000000001')$$,'55000',null,'stale browser version denied');
select lives_ok($$select public.prepare_staff_removal('b2500000-0000-4000-8000-000000000002',(select updated_at from public.users where id='b2500000-0000-4000-8000-000000000002'),'REMOVE','e2500000-0000-4000-8000-000000000002')$$,'authorized purge preparation succeeds transactionally');
select is((select count(*) from public.users where id='b2500000-0000-4000-8000-000000000002'),0::bigint,'purge removes public identity');
select is((select count(*) from public.user_roles where user_id='b2500000-0000-4000-8000-000000000002'),0::bigint,'purge removes role grants');
select is((select count(*) from auth.sessions where user_id='a2500000-0000-4000-8000-000000000002'),0::bigint,'purge invalidates refresh sessions');
select lives_ok($$select public.prepare_staff_removal('b2500000-0000-4000-8000-000000000002',now(),'REMOVE','e2500000-0000-4000-8000-000000000002')$$,'same request resumes after the identity is already gone');
select is((select count(*) from public.audit_events where target_id='b2500000-0000-4000-8000-000000000002'),0::bigint,'permanent removal leaves no own account history');
select lives_ok($$delete from auth.users where id='a2500000-0000-4000-8000-000000000002'$$,'Auth identity is physically deletable after dependency-free purge');
select throws_ok($$select public.prepare_staff_removal('b2500000-0000-4000-8000-000000000003',(select updated_at from public.users where id='b2500000-0000-4000-8000-000000000003'),'REMOVE','e2500000-0000-4000-8000-000000000003')$$,'55000',null,'shared history blocks permanent deletion instead of silently keeping a removed account');
select ok((select status='active' and removed_at is null from public.users where id='b2500000-0000-4000-8000-000000000003'),'blocked deletion leaves the account unchanged');
select is((select full_name from public.users where id='b2500000-0000-4000-8000-000000000003'),'ADMIN-2 Fixture 3','shared attribution is not deleted implicitly');
select is((select count(*) from public.user_roles where user_id='b2500000-0000-4000-8000-000000000003'),1::bigint,'blocked deletion preserves existing roles');
select is((select count(*) from auth.sessions where user_id='a2500000-0000-4000-8000-000000000003'),1::bigint,'blocked deletion preserves existing sessions');
select is((select count(*) from public.list_managed_users(null) where id='b2500000-0000-4000-8000-000000000003'),1::bigint,'unchanged account remains in the directory');
select is((select count(*) from public.get_managed_user('b2500000-0000-4000-8000-000000000003')),1::bigint,'unchanged profile remains available');
select is((select count(*) from pulse_private.admin2_test_dependency),1::bigint,'unknown dependent record is preserved');
select is((select count(*) from pulse_private.staff_removal_jobs where target_user_id='b2500000-0000-4000-8000-000000000003'),0::bigint,'blocked deletion creates no cleanup job');
select is(jsonb_array_length(public.list_own_staff_removal_tasks()),1,'only actual unfinished deletion remains recoverable');
select throws_ok($$delete from public.audit_events where target_id='b2500000-0000-4000-8000-000000000003'$$,'P0001',null,'append-only audit protection remains intact');
select set_config('request.jwt.claim.sub','a2500000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(*) from public.users where id='b2500000-0000-4000-8000-000000000002'),0::bigint,'old access JWT cannot read its removed profile through RLS');
select throws_ok($$select public.list_admin_agents()$$,'42501',null,'old access JWT cannot use Staff permissions');
reset role;
select set_config('request.jwt.claim.sub','a2500000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.complete_staff_removal_cleanup('e2500000-0000-4000-8000-000000000002','a2500000-0000-4000-8000-000000000001',true,true)$$,'trusted cleanup can mark completion');
select ok((select completed_at is not null from pulse_private.staff_purge_receipts where request_key='e2500000-0000-4000-8000-000000000002'),'completion nonce contains no deleted-person identifiers');
select is(jsonb_array_length(public.list_own_staff_removal_tasks()),0,'completed job leaves the recovery list');
select throws_ok($$select public.get_staff_removal_cleanup('e2500000-0000-4000-8000-000000000002','a2500000-0000-4000-8000-000000000005')$$,'42501',null,'cleanup cannot be reassigned by a different identity');
select ok(jsonb_array_length(public.get_admin_role_catalog())=(select count(*) from public.roles where is_active),'role catalog uses real active RBAC roles');
select ok(exists(select 1 from jsonb_array_elements(public.get_admin_role_catalog()) role where role->>'key'='super_admin' and exists(select 1 from jsonb_array_elements(role->'permissions') permission where permission->>'key'='users.remove')),'current human catalog includes actual removal capability');

select * from finish();
rollback;
