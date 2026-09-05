begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('aa000000-0000-4000-8000-000000000001','authenticated','authenticated','super.operator@example.test','',now(),'{}','{}',now(),now()),
 ('aa000000-0000-4000-8000-000000000002','authenticated','authenticated','admin.operator@example.test','',now(),'{}','{}',now(),now()),
 ('aa000000-0000-4000-8000-000000000003','authenticated','authenticated','ordinary@example.test','',now(),'{}','{}',now(),now()),
 ('aa000000-0000-4000-8000-000000000004','authenticated','authenticated','target@example.test','',now(),'{}','{}',now(),now()),
 ('aa000000-0000-4000-8000-000000000005','authenticated','authenticated','pending@example.test','',now(),'{}','{}',now(),now()),
 ('aa000000-0000-4000-8000-000000000006','authenticated','authenticated','unplaced@example.test','',now(),'{}','{}',now(),now());

insert into public.departments(id,code,name)
values('dd000000-0000-4000-8000-000000000001','admin2b','ADMIN-2B Department');

insert into public.teams(id,department_id,code,name)
values('ee000000-0000-4000-8000-000000000001','dd000000-0000-4000-8000-000000000001','admin2b_team','ADMIN-2B Team');

insert into public.users(id,auth_user_id,employee_id,email,full_name,department_id,team_id,status,approved_at)
values
 ('bb000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001','KK-910001','super.operator@example.test','Super Operator','dd000000-0000-4000-8000-000000000001','ee000000-0000-4000-8000-000000000001','active',now()),
 ('bb000000-0000-4000-8000-000000000002','aa000000-0000-4000-8000-000000000002','KK-910002','admin.operator@example.test','Admin Operator','dd000000-0000-4000-8000-000000000001','ee000000-0000-4000-8000-000000000001','active',now()),
 ('bb000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000003','KK-910003','ordinary@example.test','Ordinary User','dd000000-0000-4000-8000-000000000001','ee000000-0000-4000-8000-000000000001','active',now()),
 ('bb000000-0000-4000-8000-000000000004','aa000000-0000-4000-8000-000000000004','KK-910004','target@example.test','Target User','dd000000-0000-4000-8000-000000000001','ee000000-0000-4000-8000-000000000001','active',now()),
 ('bb000000-0000-4000-8000-000000000005','aa000000-0000-4000-8000-000000000005',null,'pending@example.test','Pending User','dd000000-0000-4000-8000-000000000001','ee000000-0000-4000-8000-000000000001','pending_approval',null),
 ('bb000000-0000-4000-8000-000000000006','aa000000-0000-4000-8000-000000000006','KK-910006','unplaced@example.test','Unplaced User',null,null,'active',now());

insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values
 ('cc000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','bb000000-0000-4000-8000-000000000001'),
 ('cc000000-0000-4000-8000-000000000002','bb000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global','bb000000-0000-4000-8000-000000000001'),
 ('cc000000-0000-4000-8000-000000000003','bb000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000001','global','bb000000-0000-4000-8000-000000000001'),
 ('cc000000-0000-4000-8000-000000000004','bb000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000001','global','bb000000-0000-4000-8000-000000000001');

select ok(not has_function_privilege('anon','public.list_assignable_role_options(uuid)','EXECUTE'),'anon cannot execute the role catalog RPC');
select ok(has_function_privilege('authenticated','public.list_assignable_role_options(uuid)','EXECUTE'),'authenticated may execute the protected RPC');
select ok(not has_function_privilege('service_role','public.list_assignable_role_options(uuid)','EXECUTE'),'service_role has no explicit RPC execution grant');
select is((select prosecdef from pg_proc where oid='public.list_assignable_role_options(uuid)'::regprocedure),true,'RPC is SECURITY DEFINER');
select is((select proowner::regrole::text from pg_proc where oid='public.list_assignable_role_options(uuid)'::regprocedure),'postgres','RPC is owned by postgres');
select is((select proconfig[1] from pg_proc where oid='public.list_assignable_role_options(uuid)'::regprocedure),'search_path=pg_catalog','RPC fixes search_path');
select ok(not has_table_privilege('authenticated','public.role_grant_rules','SELECT'),'grant rules remain unreadable directly');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004')$$,'28000',null,'anonymous JWT context is rejected');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004')$$,'42501',null,'missing canonical permissions are rejected');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.list_assignable_role_options('bb999999-0000-4000-8000-000000000099')$$,'P0002',null,'invalid target is rejected');
select is((select count(*) from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000001')),0::bigint,'self-protected target returns no options');
select is((select count(*) from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000005')),0::bigint,'pending target returns no options');
select ok(exists(select 1 from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where role_key='admin' and scope_type='global' and department_id is null and team_id is null),'Super Admin receives a resolved Global option');
select ok(exists(select 1 from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where role_key='supervisor' and scope_type='department' and department_name='ADMIN-2B Department' and team_id is null),'Super Admin receives a resolved Department option');
select ok(exists(select 1 from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where role_key='team_leader' and scope_type='team' and department_name='ADMIN-2B Department' and team_name='ADMIN-2B Team'),'Super Admin receives a resolved Team option');
select ok(not exists(select 1 from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where role_key='employee' and scope_type='global'),'already-assigned exact combination is excluded');

select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000002',true);
select ok(not exists(select 1 from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where role_key in ('super_admin','admin','human_resources')),'lower operator cannot browse privileged grants');
select is((select count(*) from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000006') where scope_type in ('department','team')),0::bigint,'organization mismatch removes unresolved scopes');

update public.roles set is_active=false where key='qa';
select ok(not exists(select 1 from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where role_key='qa'),'inactive roles are filtered');
update public.roles set is_active=true where key='qa';
update public.teams set is_active=false where id='ee000000-0000-4000-8000-000000000001';
select is((select count(*) from public.list_assignable_role_options('bb000000-0000-4000-8000-000000000004') where scope_type='team'),0::bigint,'inactive target team filters Team scope options');
update public.teams set is_active=true where id='ee000000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.users where id::text like 'bb000000-%'),6::bigint,'catalog read does not mutate users');
select is((select count(*) from public.user_roles where id::text like 'cc000000-%'),4::bigint,'catalog read does not mutate role assignments');
select is((select count(*) from public.audit_events where target_id in ('bb000000-0000-4000-8000-000000000004','bb000000-0000-4000-8000-000000000005')),0::bigint,'catalog read writes no audit events');

select * from finish();
rollback;
