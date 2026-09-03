begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a3000000-0000-4000-8000-000000000001','authenticated','authenticated','admin.operator@example.test','',now(),'{}','{}',now(),now()),
 ('a3000000-0000-4000-8000-000000000002','authenticated','authenticated','ordinary.operator@example.test','',now(),'{}','{}',now(),now()),
 ('a3000000-0000-4000-8000-000000000003','authenticated','authenticated','pending.approval@example.test','',now(),'{}','{}',now(),now()),
 ('a3000000-0000-4000-8000-000000000004','authenticated','authenticated','pending.block@example.test','',now(),'{}','{}',now(),now()),
 ('a3000000-0000-4000-8000-000000000005','authenticated','authenticated','unverified@example.test','',null,'{}','{}',now(),now());

insert into public.departments(id,code,name)
values
 ('d3000000-0000-4000-8000-000000000001','admin3a','ADMIN-3A Department'),
 ('d3000000-0000-4000-8000-000000000002','admin3a_other','ADMIN-3A Other Department');

insert into public.teams(id,department_id,code,name)
values
 ('e3000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000001','admin3a_team','ADMIN-3A Team'),
 ('e3000000-0000-4000-8000-000000000002','d3000000-0000-4000-8000-000000000002','admin3a_other_team','ADMIN-3A Other Team');

insert into public.users(id,auth_user_id,employee_id,email,full_name,department_id,team_id,status,approved_at)
values
 ('b3000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','KK-930001','admin.operator@example.test','ADMIN-3A Admin Operator','d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','active',now()),
 ('b3000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002','KK-930002','ordinary.operator@example.test','ADMIN-3A Ordinary Operator','d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','active',now());

insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values
 ('c3000000-0000-4000-8000-000000000001','b3000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000009','global','b3000000-0000-4000-8000-000000000001'),
 ('c3000000-0000-4000-8000-000000000002','b3000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','global','b3000000-0000-4000-8000-000000000001');

select ok(not has_function_privilege('anon','public.create_pending_profile(text)','EXECUTE'),'anon cannot execute registration RPC');
select ok(has_function_privilege('authenticated','public.create_pending_profile(text)','EXECUTE'),'authenticated may execute registration RPC');
select ok(not has_function_privilege('anon','public.approve_pending_user(uuid,uuid,uuid,jsonb)','EXECUTE'),'anon cannot execute approval RPC');
select ok(has_function_privilege('authenticated','public.approve_pending_user(uuid,uuid,uuid,jsonb)','EXECUTE'),'authenticated may execute approval RPC');
select ok(not has_function_privilege('anon','public.block_pending_user(uuid,text)','EXECUTE'),'anon cannot execute pending block RPC');
select ok(has_function_privilege('authenticated','public.block_pending_user(uuid,text)','EXECUTE'),'authenticated may execute pending block RPC');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.create_pending_profile('Anonymous Person')$$,'28000',null,'anonymous registration is rejected');
select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000005',true);
select throws_ok($$select * from public.create_pending_profile('Unverified Person')$$,'28000',null,'unverified Auth identity is rejected');

select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000003',true);
select is((select status from public.create_pending_profile('Pending Approval')), 'pending_approval', 'verified Auth identity creates a pending profile');
select is((select employee_id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),null,'registration does not invent an employee ID');
select is((select count(*) from public.create_pending_profile('Ignored Retry Name')),1::bigint,'registration retry returns the existing profile');
select is((select count(*) from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),1::bigint,'registration retry remains idempotent');
select ok(exists(select 1 from public.audit_events where target_id=(select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003') and action='account.pending_created'),'pending registration is audited');

select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','[{"role_id":"10000000-0000-0000-0000-000000000003","scope_type":"team"}]')$$,'42501',null,'operator without approval permissions is rejected');

select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3999999-0000-4000-8000-000000000099',null,'[{"role_id":"10000000-0000-0000-0000-000000000001","scope_type":"global"}]')$$,'23503',null,'inactive or missing department is rejected');
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000002','[{"role_id":"10000000-0000-0000-0000-000000000003","scope_type":"team"}]')$$,'23503',null,'team outside the selected department is rejected');
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001',null,'[]')$$,'22023',null,'approval requires at least one initial role');
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001',null,'[{"role_id":"10000000-0000-0000-0000-000000000010","scope_type":"global"}]')$$,'42501',null,'grant rules prevent a prohibited privileged assignment');
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','[{"role_id":"10000000-0000-0000-0000-000000000001","scope_type":"team"}]')$$,'23503',null,'unsupported role scope is rejected');

select is((select status from public.approve_pending_user(
  (select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),
  'd3000000-0000-4000-8000-000000000001',
  'e3000000-0000-4000-8000-000000000001',
  '[{"role_id":"10000000-0000-0000-0000-000000000003","scope_type":"team"}]'
)), 'active', 'authorized approval activates the pending profile');
select is((select department_id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001'::uuid,'approval stores the selected department');
select is((select team_id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'e3000000-0000-4000-8000-000000000001'::uuid,'approval stores the selected team');
select matches((select employee_id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'^KK-[0-9]{6}$','approval generates a valid employee ID');
select ok(exists(select 1 from public.user_roles where user_id=(select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003') and role_id='10000000-0000-0000-0000-000000000003' and scope_type='team' and team_id='e3000000-0000-4000-8000-000000000001'),'approval creates the exact initial role assignment');
select ok(exists(select 1 from public.audit_events where target_id=(select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003') and action='account.approved'),'approval is audited');
select ok(exists(select 1 from public.audit_events where target_id=(select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003') and action='role.assigned'),'initial role assignment is audited');
select throws_ok($$select * from public.approve_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000003'),'d3000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','[{"role_id":"10000000-0000-0000-0000-000000000003","scope_type":"team"}]')$$,'55000',null,'concurrent or duplicate approval fails closed');

select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000004',true);
select is((select status from public.create_pending_profile('Pending Block')), 'pending_approval', 'second verified identity creates a pending profile for block certification');
select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.block_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000004'),'unauthorized')$$,'42501',null,'operator without users.approve cannot block pending user');
select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000001',true);
select is((select status from public.block_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000004'),'fixture review')), 'blocked', 'authorized reviewer blocks the pending user');
select ok(exists(select 1 from public.audit_events where target_id=(select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000004') and action='account.blocked' and metadata->>'reason'='fixture review'),'pending block reason is audited by the database');
select throws_ok($$select * from public.block_pending_user((select id from public.users where auth_user_id='a3000000-0000-4000-8000-000000000004'),'retry')$$,'55000',null,'repeat pending block fails closed on stale lifecycle');

set local role authenticated;
select set_config('request.jwt.claim.sub','a3000000-0000-4000-8000-000000000002',true);
select throws_ok($$update public.users set status='active' where auth_user_id='a3000000-0000-4000-8000-000000000004'$$,'42501',null,'authenticated browser cannot directly mutate lifecycle state');
reset role;
select is((select status from public.users where auth_user_id='a3000000-0000-4000-8000-000000000004'),'blocked','direct-write denial preserves blocked state');

select * from finish();
rollback;
