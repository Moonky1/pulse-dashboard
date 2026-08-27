begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a4000000-0000-4000-8000-000000000001','authenticated','authenticated','super.catalog@example.test','',now(),'{}','{}',now(),now()),
 ('a4000000-0000-4000-8000-000000000002','authenticated','authenticated','admin.catalog@example.test','',now(),'{}','{}',now(),now()),
 ('a4000000-0000-4000-8000-000000000003','authenticated','authenticated','inactive.catalog@example.test','',now(),'{}','{}',now(),now()),
 ('a4000000-0000-4000-8000-000000000004','authenticated','authenticated','pending.catalog@example.test','',now(),'{}','{}',now(),now()),
 ('a4000000-0000-4000-8000-000000000005','authenticated','authenticated','active.target@example.test','',now(),'{}','{}',now(),now()),
 ('a4000000-0000-4000-8000-000000000006','authenticated','authenticated','unverified.catalog@example.test','',null,'{}','{}',now(),now());

insert into public.departments(id,code,name,is_active)
values
 ('d4000000-0000-4000-8000-000000000001','admin3b_a','ADMIN-3B Department A',true),
 ('d4000000-0000-4000-8000-000000000002','admin3b_b','ADMIN-3B Department B',true),
 ('d4000000-0000-4000-8000-000000000003','admin3b_inactive','ADMIN-3B Inactive Department',false);

insert into public.teams(id,department_id,code,name,is_active)
values
 ('e4000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000001','admin3b_a1','ADMIN-3B Team A1',true),
 ('e4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000001','admin3b_inactive','ADMIN-3B Inactive Team',false),
 ('e4000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000002','admin3b_b1','ADMIN-3B Team B1',true),
 ('e4000000-0000-4000-8000-000000000004','d4000000-0000-4000-8000-000000000003','admin3b_inactive_department','ADMIN-3B Team In Inactive Department',true);

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b4000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001','KK-940001','super.catalog@example.test','ADMIN-3B Super Operator','active',now()),
 ('b4000000-0000-4000-8000-000000000002','a4000000-0000-4000-8000-000000000002','KK-940002','admin.catalog@example.test','ADMIN-3B Admin Operator','active',now()),
 ('b4000000-0000-4000-8000-000000000003','a4000000-0000-4000-8000-000000000003','KK-940003','inactive.catalog@example.test','ADMIN-3B Inactive Operator','inactive',now()),
 ('b4000000-0000-4000-8000-000000000004','a4000000-0000-4000-8000-000000000004',null,'pending.catalog@example.test','ADMIN-3B Pending Target','pending_approval',null),
 ('b4000000-0000-4000-8000-000000000005','a4000000-0000-4000-8000-000000000005','KK-940005','active.target@example.test','ADMIN-3B Active Target','active',now()),
 ('b4000000-0000-4000-8000-000000000006','a4000000-0000-4000-8000-000000000006',null,'unverified.catalog@example.test','ADMIN-3B Unverified Target','pending_approval',null);

insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values
 ('c4000000-0000-4000-8000-000000000001','b4000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','b4000000-0000-4000-8000-000000000001'),
 ('c4000000-0000-4000-8000-000000000002','b4000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global','b4000000-0000-4000-8000-000000000001'),
 ('c4000000-0000-4000-8000-000000000003','b4000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000010','global','b4000000-0000-4000-8000-000000000001');

select ok(not has_function_privilege('anon','public.get_pending_approval_options(uuid)','EXECUTE'),'anon cannot execute the pending approval catalog');
select ok(has_function_privilege('authenticated','public.get_pending_approval_options(uuid)','EXECUTE'),'authenticated may execute the protected pending approval catalog');
select ok(not has_function_privilege('service_role','public.get_pending_approval_options(uuid)','EXECUTE'),'service_role has no explicit execution grant');
select is((select prosecdef from pg_proc where oid='public.get_pending_approval_options(uuid)'::regprocedure),true,'catalog is SECURITY DEFINER');
select is((select proowner::regrole::text from pg_proc where oid='public.get_pending_approval_options(uuid)'::regprocedure),'postgres','catalog is owned by postgres');
select is((select proconfig[1] from pg_proc where oid='public.get_pending_approval_options(uuid)'::regprocedure),'search_path=pg_catalog','catalog fixes search_path');
select ok(not has_table_privilege('authenticated','public.role_grant_rules','SELECT'),'protected grant rules remain unreadable directly');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')$$,'28000',null,'anonymous JWT context is rejected');
select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')$$,'42501',null,'inactive operator is rejected');

select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000001',true);
delete from public.role_permissions where role_id='10000000-0000-0000-0000-000000000010' and permission_id='20000000-0000-0000-0000-000000000031';
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')$$,'42501',null,'missing admin.access is rejected');
insert into public.role_permissions(role_id,permission_id) values('10000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000031');
delete from public.role_permissions where role_id='10000000-0000-0000-0000-000000000010' and permission_id='20000000-0000-0000-0000-000000000004';
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')$$,'42501',null,'missing users.view is rejected');
insert into public.role_permissions(role_id,permission_id) values('10000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000004');
delete from public.role_permissions where role_id='10000000-0000-0000-0000-000000000010' and permission_id='20000000-0000-0000-0000-000000000005';
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')$$,'42501',null,'missing users.approve is rejected');
insert into public.role_permissions(role_id,permission_id) values('10000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000005');
delete from public.role_permissions where role_id='10000000-0000-0000-0000-000000000010' and permission_id='20000000-0000-0000-0000-000000000012';
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')$$,'42501',null,'missing roles.assign is rejected');
insert into public.role_permissions(role_id,permission_id) values('10000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000012');

select throws_ok($$select * from public.get_pending_approval_options('b4999999-0000-4000-8000-000000000099')$$,'P0002',null,'missing target is rejected');
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000005')$$,'55000',null,'non-pending target is rejected');
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000001')$$,'42501',null,'self target is rejected before catalog disclosure');
select throws_ok($$select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000006')$$,'23514',null,'unverified target Auth identity is rejected');

select cmp_ok((select count(*) from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')),'>',0::bigint,'authorized Super Admin receives approval options');
select ok(not exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where department_id='d4000000-0000-4000-8000-000000000003'),'inactive departments are filtered');
select ok(exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where team_id='e4000000-0000-4000-8000-000000000001' and department_id='d4000000-0000-4000-8000-000000000001'),'active teams retain their exact department relationship');
select ok(not exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where team_id in ('e4000000-0000-4000-8000-000000000002','e4000000-0000-4000-8000-000000000004')),'inactive teams and teams in inactive departments are filtered');
select ok(not exists(
  select 1
  from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') approval_option
  where approval_option.team_id is not null
    and not exists (
      select 1 from public.teams team
      where team.id=approval_option.team_id
        and team.department_id=approval_option.department_id
    )
),'no team can escape its returned department');
select ok(exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='employee' and scope_type='global' and team_id is null),'Global role option is returned with an exact department placement');
select ok(exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='supervisor' and scope_type='department' and team_id is null),'Department role option is returned');
select ok(exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='agent' and scope_type='team' and team_id='e4000000-0000-4000-8000-000000000001'),'Team role option is returned only with an exact team placement');
select ok(not exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='employee' and scope_type='team'),'unsupported role scopes are filtered by the canonical role_scopes catalog');

select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000002',true);
select ok(exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='agent' and scope_type='team'),'Admin grant rules expose operational roles');
select ok(not exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key in ('super_admin','admin','human_resources')),'lower operator cannot browse privileged roles outside grant rules');

select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000001',true);
update public.roles set is_active=false where key='qa';
select ok(not exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='qa'),'inactive roles are filtered');
update public.roles set is_active=true where key='qa';
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values('c4000000-0000-4000-8000-000000000004','b4000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000001','global','b4000000-0000-4000-8000-000000000001');
select ok(not exists(select 1 from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004') where role_key='employee' and scope_type='global'),'an exact existing assignment is excluded from every placement');

select is((select count(*) from public.users where id::text like 'b4000000-%'),6::bigint,'catalog reads do not mutate users');
select is((select count(*) from public.user_roles where id::text like 'c4000000-%'),4::bigint,'catalog reads do not mutate role assignments');
select is((select count(*) from public.audit_events where target_id='b4000000-0000-4000-8000-000000000004'),0::bigint,'catalog reads create no audit event');

set local role authenticated;
select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.role_grant_rules$$,'42501',null,'authenticated browser still cannot read protected grant rules directly');
reset role;

select set_config('request.jwt.claim.sub','a4000000-0000-4000-8000-000000000001',true);
select lives_ok($parity$
do $do$
declare
  approval_option record;
  fixture_auth_id uuid;
  fixture_user_id uuid;
  fixture_email text;
  fixture_number integer := 0;
begin
  for approval_option in
    select * from public.get_pending_approval_options('b4000000-0000-4000-8000-000000000004')
  loop
    fixture_number := fixture_number + 1;
    fixture_auth_id := gen_random_uuid();
    fixture_user_id := gen_random_uuid();
    fixture_email := 'parity.' || fixture_number || '@example.test';

    insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    values(fixture_auth_id,'authenticated','authenticated',fixture_email,'',now(),'{}','{}',now(),now());
    insert into public.users(id,auth_user_id,email,full_name,status)
    values(fixture_user_id,fixture_auth_id,fixture_email,'ADMIN-3B Parity Target ' || fixture_number,'pending_approval');

    perform * from public.approve_pending_user(
      fixture_user_id,
      approval_option.department_id,
      approval_option.team_id,
      jsonb_build_array(jsonb_build_object('role_id',approval_option.role_id,'scope_type',approval_option.scope_type))
    );

    if (select status from public.users where id=fixture_user_id) <> 'active' then
      raise exception 'returned approval option did not activate its fixture target';
    end if;

    drop table if exists pg_temp.requested_role_assignments;
  end loop;

  if fixture_number = 0 then
    raise exception 'parity fixture returned no approval options';
  end if;
end
$do$
$parity$,'every returned option is accepted by approve_pending_user under the same fixture');

select * from finish();
rollback;
