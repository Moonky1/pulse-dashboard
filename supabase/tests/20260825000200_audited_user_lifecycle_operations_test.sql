begin;
create extension if not exists pgtap with schema extensions;
select plan(56);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a0000000-0000-4000-8000-000000000001','authenticated','authenticated','operator@example.test','',now(),'{}','{}',now(),now()),
 ('a0000000-0000-4000-8000-000000000002','authenticated','authenticated','target@example.test','',now(),'{}','{}',now(),now()),
 ('a0000000-0000-4000-8000-000000000003','authenticated','authenticated','ordinary@example.test','',now(),'{}','{}',now(),now()),
 ('a0000000-0000-4000-8000-000000000004','authenticated','authenticated','admin@example.test','',now(),'{}','{}',now(),now());

insert into public.departments(id,code,name)
values('d0000000-0000-4000-8000-000000000001','test_auth8','AUTH-8 Test');

insert into public.users(id,auth_user_id,employee_id,email,full_name,department_id,status,approved_at)
values
 ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','KK-900001','operator@example.test','Operator Fixture','d0000000-0000-4000-8000-000000000001','active',now()),
 ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000002','KK-900002','target@example.test','Target Fixture','d0000000-0000-4000-8000-000000000001','active',now()),
 ('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000003','KK-900003','ordinary@example.test','Ordinary Fixture','d0000000-0000-4000-8000-000000000001','active',now()),
 ('b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000004','KK-900004','admin@example.test','Admin Fixture','d0000000-0000-4000-8000-000000000001','active',now());

insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values
 ('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','b0000000-0000-4000-8000-000000000001'),
 ('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','global','b0000000-0000-4000-8000-000000000001'),
 ('c0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000001','global','b0000000-0000-4000-8000-000000000001'),
 ('c0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000009','global','b0000000-0000-4000-8000-000000000001');

-- The last-Super-Admin assertions below require an isolated database. A
-- pre-existing active Super Admin makes the destructive statements valid,
-- which causes pgTAP to report a failed throws_ok() while retaining the
-- successful mutation for the remainder of the transaction.
do $fixture_guard$
begin
  if exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.roles r on r.id = ur.role_id
    where u.id not in (
      'b0000000-0000-4000-8000-000000000001'::uuid,
      'b0000000-0000-4000-8000-000000000002'::uuid,
      'b0000000-0000-4000-8000-000000000003'::uuid,
      'b0000000-0000-4000-8000-000000000004'::uuid
    )
      and u.status = 'active'
      and ur.scope_type = 'global'
      and r.id = '10000000-0000-0000-0000-000000000010'::uuid
      and r.key = 'super_admin'
      and r.is_active
  ) then
    raise exception 'AUTH lifecycle fixture requires an isolated database without pre-existing active Super Admins';
  end if;
end
$fixture_guard$;

select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select is((select status from public.block_user('b0000000-0000-4000-8000-000000000002','fixture block')),'blocked','active user is blocked');
select is((select changed from public.block_user('b0000000-0000-4000-8000-000000000002','retry')),false,'block retry is idempotent');
select is((select count(*) from public.user_roles where user_id='b0000000-0000-4000-8000-000000000002'),1::bigint,'block preserves roles');
select ok(exists(select 1 from public.audit_events where target_id='b0000000-0000-4000-8000-000000000002' and action='account.blocked'),'block is audited');
select is((select employee_id||'|'||department_id::text||'|'||coalesce(team_id::text,'none') from public.users where id='b0000000-0000-4000-8000-000000000002'),'KK-900002|d0000000-0000-4000-8000-000000000001|none','block preserves employee and organization');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select is(pulse_private.current_user_is_active(),false,'blocked user is not active');
select is(pulse_private.has_permission('dashboard.view'),false,'blocked user loses effective permissions');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select is((select status from public.reactivate_user('b0000000-0000-4000-8000-000000000002','fixture reactivate')),'active','blocked user reactivates');
select ok(exists(select 1 from public.audit_events where target_id='b0000000-0000-4000-8000-000000000002' and action='account.reactivated'),'reactivation is audited');
update public.users set status='inactive' where id='b0000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.block_user('b0000000-0000-4000-8000-000000000002','inactive approver')$$,'42501',null,'inactive approver is rejected');
update public.users set status='active' where id='b0000000-0000-4000-8000-000000000004';
select throws_ok($$select * from public.block_user('b0000000-0000-4000-8000-000000000004','self')$$,'42501',null,'self-block is rejected');
select throws_ok($$select * from public.block_user('b0000000-0000-4000-8000-000000000001','protect super admin')$$,'42501',null,'non-Super-Admin cannot block a Super Admin');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select is((select status from public.inactivate_user('b0000000-0000-4000-8000-000000000002','fixture offboard')),'inactive','active user becomes inactive');
select ok(exists(select 1 from public.audit_events where target_id='b0000000-0000-4000-8000-000000000002' and action='account.inactivated'),'inactivation is audited');
select is((select employee_id from public.users where id='b0000000-0000-4000-8000-000000000002'),'KK-900002','inactivation preserves employee ID');
select is((select count(*) from public.user_roles where user_id='b0000000-0000-4000-8000-000000000002'),1::bigint,'inactivation preserves roles');
update auth.users set email='mismatch@example.test' where id='a0000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','mismatch')$$,'23514',null,'email mismatch is rejected');
update auth.users set email='target@example.test' where id='a0000000-0000-4000-8000-000000000002';
update auth.users set banned_until=now()+interval '1 day' where id='a0000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','banned')$$,'23514',null,'banned Auth identity is rejected');
update auth.users set banned_until=null,deleted_at=now() where id='a0000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','deleted')$$,'23514',null,'deleted Auth identity is rejected');
update auth.users set deleted_at=null where id='a0000000-0000-4000-8000-000000000002';
update public.users set employee_id=null where id='b0000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','missing employee')$$,'23514',null,'missing employee ID is rejected');
update public.users set employee_id='KK-900002' where id='b0000000-0000-4000-8000-000000000002';
update public.departments set is_active=false where id='d0000000-0000-4000-8000-000000000001';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','inactive department')$$,'23503',null,'inactive department is rejected');
update public.departments set is_active=true where id='d0000000-0000-4000-8000-000000000001';
insert into public.teams(id,department_id,code,name,is_active) values('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','test_team','Test Team',false);
update public.users set team_id='e0000000-0000-4000-8000-000000000001' where id='b0000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','inactive team')$$,'23503',null,'inactive team is rejected');
update public.users set team_id=null where id='b0000000-0000-4000-8000-000000000002';
delete from public.user_roles where id='c0000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','missing role')$$,'23514',null,'missing valid role is rejected');
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id) values('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','global','b0000000-0000-4000-8000-000000000001');
update public.roles set is_active=false where id='10000000-0000-0000-0000-000000000001';
select throws_ok($$select * from public.reactivate_user('b0000000-0000-4000-8000-000000000002','inactive role')$$,'23514',null,'inactive role is rejected');
update public.roles set is_active=true where id='10000000-0000-0000-0000-000000000001';
select throws_ok($$delete from auth.users where id='a0000000-0000-4000-8000-000000000002'$$,'23503',null,'Auth identity cannot disappear while profile exists');
select is((select status from public.reactivate_user('b0000000-0000-4000-8000-000000000002','valid inactive reactivation')),'active','inactive user reactivates');
select throws_ok($$select * from public.inactivate_user('b0000000-0000-4000-8000-000000000001','self')$$,'42501',null,'self-inactivation is rejected');
select is((select status from public.block_user('b0000000-0000-4000-8000-000000000002','block before inactive')),'blocked','target blocks before blocked-to-inactive test');
select is((select status from public.inactivate_user('b0000000-0000-4000-8000-000000000002','blocked offboard')),'inactive','blocked user becomes inactive');
select throws_ok($$select * from public.block_user('b0000000-0000-4000-8000-000000000002','conflict')$$,'55000',null,'conflicting lifecycle change fails closed');
select is((select status from public.reactivate_user('b0000000-0000-4000-8000-000000000002','prepare roles')),'active','target restored for role tests');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select is((select created from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global',null,null)),true,'authorized role assignment succeeds');
select is((select created from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global',null,null)),false,'duplicate role assignment is idempotent');
select ok((select removed from public.remove_user_role('b0000000-0000-4000-8000-000000000002',(select id from public.user_roles where user_id='b0000000-0000-4000-8000-000000000002' and role_id='10000000-0000-0000-0000-000000000009'))),'exact role removal succeeds');
select ok(exists(select 1 from public.audit_events where target_id='b0000000-0000-4000-8000-000000000002' and action='role.removed'),'role removal is audited');
select throws_ok($$select * from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000004','planet',null,null)$$,'22023',null,'invalid role scope is rejected');
select throws_ok($$select * from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000004','department',null,null)$$,'23514',null,'organization scope mismatch is rejected');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000010','global',null,null)$$,'42501',null,'Admin cannot grant Super Admin');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global',null,null)$$,'42501',null,'unauthorized role assignment is rejected');
select throws_ok($$select * from public.remove_user_role('b0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000002')$$,'42501',null,'unauthorized role removal is rejected');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.remove_user_role('b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001')$$,'42501',null,'self-role manipulation is rejected');
select throws_ok($$select * from public.remove_user_role('b0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000002')$$,'55000',null,'active user retains a last active role');
select throws_ok($$update public.users set status='blocked' where id='b0000000-0000-4000-8000-000000000001'$$,'55000',null,'last active Super Admin status is protected');
update public.users set status='active' where id='b0000000-0000-4000-8000-000000000001';
select throws_ok($$delete from public.user_roles where id='c0000000-0000-4000-8000-000000000001'$$,'55000',null,'last active Super Admin role is protected');
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','b0000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;
select throws_ok($$delete from public.users where id='b0000000-0000-4000-8000-000000000001'$$,'55000',null,'last active Super Admin profile deletion is protected');
select throws_ok($$update public.roles set key='renamed_super_admin' where id='10000000-0000-0000-0000-000000000010'$$,'55000',null,'Super Admin role cannot be renamed');
select throws_ok($$update public.roles set is_active=false where id='10000000-0000-0000-0000-000000000010'$$,'55000',null,'Super Admin role cannot be deactivated');
select throws_ok($$delete from public.roles where id='10000000-0000-0000-0000-000000000010'$$,'55000',null,'Super Admin role cannot be deleted');
select is((select created from public.assign_user_role('b0000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000010','global',null,null)),true,'second active Super Admin assignment succeeds');
update public.users set status='blocked' where id='b0000000-0000-4000-8000-000000000001';
select is((select status from public.users where id='b0000000-0000-4000-8000-000000000001'),'blocked','one Super Admin may be blocked when another remains active');
update public.users set status='active' where id='b0000000-0000-4000-8000-000000000001';
select ok((select removed from public.remove_user_role('b0000000-0000-4000-8000-000000000002',(select id from public.user_roles where user_id='b0000000-0000-4000-8000-000000000002' and role_id='10000000-0000-0000-0000-000000000010'))),'Super Admin assignment may be removed when another remains active');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.block_user('b0000000-0000-4000-8000-000000000001','unauthorized')$$,'42501',null,'unauthorized lifecycle mutation is rejected');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select ok(not exists(select 1 from public.audit_events where actor_user_id is null or target_id is null or action is null),'sensitive audit events contain actor, target, and action');
select ok(not exists(select 1 from public.audit_events where metadata::text ~* '(password|token|secret)'),'audit metadata contains no secret-like fields');
select throws_ok($$update public.audit_events set metadata='{}' where id=(select id from public.audit_events limit 1)$$,'P0001','audit events are append-only','audit UPDATE is rejected');
select throws_ok($$delete from public.audit_events where id=(select id from public.audit_events limit 1)$$,'P0001','audit events are append-only','audit DELETE is rejected');
select * from finish();
rollback;
