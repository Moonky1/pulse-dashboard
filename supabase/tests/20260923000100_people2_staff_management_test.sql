begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config(
  'search_path',
  quote_ident((
    select namespace.nspname
    from pg_extension extension
    join pg_namespace namespace on namespace.oid = extension.extnamespace
    where extension.extname = 'pgtap'
  )) || ', public',
  true
);
select extensions.no_plan();

select extensions.ok(exists(select 1 from public.permissions where key='staff_work.manage' and is_active),'Staff work management has a dedicated active permission');
select extensions.ok(has_function_privilege('authenticated','public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'authenticated operators may invoke the protected work-details contract');
select extensions.ok(not has_function_privilege('anon','public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'anonymous callers cannot invoke work-details mutation');
select extensions.ok(not has_function_privilege('service_role','public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'service role has no explicit work-details execution grant');
select extensions.ok(has_function_privilege('authenticated','public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid)','EXECUTE'),'authenticated operators may invoke atomic access replacement');
select extensions.ok(not has_function_privilege('anon','public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid)','EXECUTE'),'anonymous callers cannot replace access');
select extensions.is((select proowner::regrole::text from pg_proc where oid='public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure),'postgres','work-details contract is owned by postgres');
select extensions.ok((select prosecdef from pg_proc where oid='public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure),'work-details contract is SECURITY DEFINER');
select extensions.is((select proconfig[1] from pg_proc where oid='public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid)'::regprocedure),'search_path=pg_catalog','work-details contract fixes search_path');
select extensions.ok((select prosecdef from pg_proc where oid='public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid)'::regprocedure),'access replacement is SECURITY DEFINER');
select extensions.is((select proconfig[1] from pg_proc where oid='public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid)'::regprocedure),'search_path=pg_catalog','access replacement fixes search_path');

create temporary table people2_test_context on commit drop as
select count(*)::integer as existing_active_super_admins
from public.user_roles assignment
join public.roles role on role.id = assignment.role_id and role.key = 'super_admin'
join public.users staff on staff.id = assignment.user_id and staff.status = 'active';

insert into public.departments(id,code,name,is_active)
values ('d2300000-0000-4000-8000-000000000001','people2_certification','PEOPLE-2 Certification',true);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a2300000-0000-4000-8000-000000000001','authenticated','authenticated','people2.super@example.test','',now(),'{}','{}',now(),now()),
 ('a2300000-0000-4000-8000-000000000002','authenticated','authenticated','people2.hr@example.test','',now(),'{}','{}',now(),now()),
 ('a2300000-0000-4000-8000-000000000003','authenticated','authenticated','people2.denied@example.test','',now(),'{}','{}',now(),now()),
 ('a2300000-0000-4000-8000-000000000004','authenticated','authenticated','people2.target@example.test','',now(),'{}','{}',now(),now()),
 ('a2300000-0000-4000-8000-000000000005','authenticated','authenticated','people2.replace@example.test','',now(),'{}','{}',now(),now()),
 ('a2300000-0000-4000-8000-000000000006','authenticated','authenticated','people2.blocked@example.test','',now(),'{}','{}',now(),now()),
 ('a2300000-0000-4000-8000-000000000007','authenticated','authenticated','people2.super2@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values
 ('b2300000-0000-4000-8000-000000000001','a2300000-0000-4000-8000-000000000001','KK-923001','people2.super@example.test','PEOPLE-2 Super','active','d2300000-0000-4000-8000-000000000001',now()),
 ('b2300000-0000-4000-8000-000000000002','a2300000-0000-4000-8000-000000000002','KK-923002','people2.hr@example.test','PEOPLE-2 HR','active','d2300000-0000-4000-8000-000000000001',now()),
 ('b2300000-0000-4000-8000-000000000003','a2300000-0000-4000-8000-000000000003','KK-923003','people2.denied@example.test','PEOPLE-2 Denied','active','d2300000-0000-4000-8000-000000000001',now()),
 ('b2300000-0000-4000-8000-000000000004','a2300000-0000-4000-8000-000000000004','KK-923004','people2.target@example.test','PEOPLE-2 Target','active','d2300000-0000-4000-8000-000000000001',now()),
 ('b2300000-0000-4000-8000-000000000005','a2300000-0000-4000-8000-000000000005','KK-923005','people2.replace@example.test','PEOPLE-2 Replace','active','d2300000-0000-4000-8000-000000000001',now()),
 ('b2300000-0000-4000-8000-000000000006','a2300000-0000-4000-8000-000000000006','KK-923006','people2.blocked@example.test','PEOPLE-2 Blocked','blocked','d2300000-0000-4000-8000-000000000001',now()),
 ('b2300000-0000-4000-8000-000000000007','a2300000-0000-4000-8000-000000000007','KK-923007','people2.super2@example.test','PEOPLE-2 Super Two','active','d2300000-0000-4000-8000-000000000001',now());

insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values
 ('c2300000-0000-4000-8000-000000000001','b2300000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','b2300000-0000-4000-8000-000000000001'),
 ('c2300000-0000-4000-8000-000000000002','b2300000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000006','global','b2300000-0000-4000-8000-000000000001'),
 ('c2300000-0000-4000-8000-000000000003','b2300000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000001','global','b2300000-0000-4000-8000-000000000001'),
 ('c2300000-0000-4000-8000-000000000004','b2300000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000001','global','b2300000-0000-4000-8000-000000000001'),
 ('c2300000-0000-4000-8000-000000000005','b2300000-0000-4000-8000-000000000005','10000000-0000-0000-0000-000000000001','global','b2300000-0000-4000-8000-000000000001'),
 ('c2300000-0000-4000-8000-000000000006','b2300000-0000-4000-8000-000000000006','10000000-0000-0000-0000-000000000001','global','b2300000-0000-4000-8000-000000000001'),
 ('c2300000-0000-4000-8000-000000000007','b2300000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000010','global','b2300000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub','a2300000-0000-4000-8000-000000000001',true);
select extensions.lives_ok($$select public.apply_org3a_business_catalog()$$,'Super Admin may prepare the approved catalog fixture');

select set_config('request.jwt.claim.sub','',true);
select extensions.throws_ok(
  $$select * from public.update_staff_work_details('b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001',null,null,null,null,'f2300000-0000-4000-8000-000000000001')$$,
  '28000',null,'anonymous work-detail mutation is rejected'
);
select set_config('request.jwt.claim.sub','a2300000-0000-4000-8000-000000000003',true);
select extensions.throws_ok(
  $$select * from public.update_staff_work_details('b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001','34000000-0000-4000-8000-000000000011','35000000-0000-4000-8000-000000000002','f2300000-0000-4000-8000-000000000002')$$,
  '42501',null,'operator without Staff work permission is denied'
);

select set_config('request.jwt.claim.sub','a2300000-0000-4000-8000-000000000001',true);
select extensions.is(
  (select changed from public.update_staff_work_details(
    'b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000011','35000000-0000-4000-8000-000000000002',
    'f2300000-0000-4000-8000-000000000003'
  )),true,'authorized Staff work update is confirmed'
);
select extensions.ok(exists(
  select 1 from public.users staff
  join public.user_operational_assignments assignment on assignment.user_id=staff.id and assignment.ended_at is null and assignment.is_primary
  where staff.id='b2300000-0000-4000-8000-000000000004'
    and staff.department_id='d2300000-0000-4000-8000-000000000001'
    and staff.position_id='35000000-0000-4000-8000-000000000002'
    and assignment.campaign_id='32000000-0000-4000-8000-000000000001'
    and assignment.team_id='34000000-0000-4000-8000-000000000011'
    and assignment.position_id='35000000-0000-4000-8000-000000000002'
),'Position and operational placement are stored separately and exactly');
select extensions.ok(exists(
  select 1 from public.get_managed_user('b2300000-0000-4000-8000-000000000004') profile
  where profile.position_name='Team Leader'
    and profile.primary_campaign_name='Auto Warranty Garrett'
    and profile.primary_operating_unit_name='Openers'
    and profile.primary_team_name='Asia Team A'
),'protected Staff profile resolves human-facing work details');
select extensions.is(
  (select changed from public.update_staff_work_details(
    'b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001',
    '34000000-0000-4000-8000-000000000011','35000000-0000-4000-8000-000000000002',
    'f2300000-0000-4000-8000-000000000003'
  )),false,'identical retry is idempotent'
);
select extensions.is((select count(*) from public.audit_events where target_id='b2300000-0000-4000-8000-000000000004' and action='staff.work_details.updated'),1::bigint,'idempotent work retry creates no audit spam');
select extensions.throws_ok(
  $$select * from public.update_staff_work_details('b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000002','33000000-0000-4000-8000-000000000005','34000000-0000-4000-8000-000000000011','35000000-0000-4000-8000-000000000002','f2300000-0000-4000-8000-000000000004')$$,
  '23503',null,'invalid Team and Campaign relation is denied'
);
select extensions.throws_ok(
  $$select * from public.update_staff_work_details('b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000005','34000000-0000-4000-8000-000000000011','35000000-0000-4000-8000-000000000002','f2300000-0000-4000-8000-000000000005')$$,
  '23503',null,'invalid Operating Unit relation is denied'
);
select extensions.throws_ok(
  $$select * from public.update_staff_work_details('b2300000-0000-4000-8000-000000000004','d2300000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001','34000000-0000-4000-8000-000000000011','35999999-0000-4000-8000-000000000099','f2300000-0000-4000-8000-000000000006')$$,
  '23503',null,'unknown Position is denied'
);
select extensions.throws_ok(
  $$select * from public.update_staff_work_details('b2300000-0000-4000-8000-000000000006','d2300000-0000-4000-8000-000000000001',null,null,null,null,'f2300000-0000-4000-8000-000000000007')$$,
  '55000',null,'blocked Staff work details cannot be changed'
);

select extensions.is(
  (select replaced from public.replace_user_role(
    'b2300000-0000-4000-8000-000000000005','c2300000-0000-4000-8000-000000000005',
    '10000000-0000-0000-0000-000000000009','global',null,null,null
  )),true,'single Role is replaced atomically'
);
select extensions.is((select count(*) from public.user_roles where user_id='b2300000-0000-4000-8000-000000000005'),1::bigint,'atomic replacement leaves exactly one Role');
select extensions.ok(exists(select 1 from public.user_roles where user_id='b2300000-0000-4000-8000-000000000005' and role_id='10000000-0000-0000-0000-000000000009' and scope_type='global'),'replacement Role is exact and active');
select extensions.is(
  (select replaced from public.replace_user_role(
    'b2300000-0000-4000-8000-000000000005','c2300000-0000-4000-8000-000000000005',
    '10000000-0000-0000-0000-000000000009','global',null,null,null
  )),false,'replayed replacement is idempotent'
);
select extensions.is((select count(*) from public.audit_events where target_id='b2300000-0000-4000-8000-000000000005' and action in ('role.assigned','role.removed')),2::bigint,'atomic replacement creates one assign and one remove audit event');
select extensions.throws_ok(
  $$select * from public.remove_user_role('b2300000-0000-4000-8000-000000000004','c2300000-0000-4000-8000-000000000004')$$,
  '55000',null,'active Staff cannot accidentally lose their final Role'
);

select set_config('request.jwt.claim.sub','a2300000-0000-4000-8000-000000000002',true);
select extensions.throws_ok(
  $$select * from public.replace_user_role('b2300000-0000-4000-8000-000000000004','c2300000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000009','global',null,null,null)$$,
  '42501',null,'HR cannot grant privileged access beyond grant authority'
);
select extensions.ok(exists(select 1 from public.user_roles where id='c2300000-0000-4000-8000-000000000004' and role_id='10000000-0000-0000-0000-000000000001'),'failed privileged replacement leaves original Role intact');
select set_config('request.jwt.claim.sub','a2300000-0000-4000-8000-000000000003',true);
select extensions.throws_ok(
  $$select * from public.replace_user_role('b2300000-0000-4000-8000-000000000004','c2300000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000009','global',null,null,null)$$,
  '42501',null,'operator without roles.assign cannot change access'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','a2300000-0000-4000-8000-000000000001',true);
select extensions.throws_ok(
  $$update public.users set position_id='35000000-0000-4000-8000-000000000003' where id='b2300000-0000-4000-8000-000000000004'$$,
  '42501',null,'browser cannot bypass work-details contract with a direct table update'
);
select extensions.throws_ok(
  $$delete from public.user_roles where id='c2300000-0000-4000-8000-000000000004'$$,
  '42501',null,'browser cannot bypass access contracts with a direct table delete'
);
set local role postgres;

-- Trigger-level last-Super-Admin protection remains absolute even for a
-- privileged database path. Remove the second fixture first, then prove the
-- final active Super Admin assignment cannot disappear.
delete from public.user_roles where id='c2300000-0000-4000-8000-000000000007';
select case
  when context.existing_active_super_admins = 0 then extensions.throws_ok(
    $$delete from public.user_roles where id='c2300000-0000-4000-8000-000000000001'$$,
    '55000',null,'last active Super Admin assignment remains protected'
  )
  else extensions.ok(exists(
    select 1
    from pg_trigger trigger
    where trigger.tgrelid = 'public.user_roles'::regclass
      and trigger.tgname = 'user_roles_protect_last_super_admin'
      and trigger.tgenabled <> 'D'
  ),'deployed last-Super-Admin protection trigger remains active without touching real Preview admins')
end
from people2_test_context context;
select extensions.ok(exists(select 1 from public.user_roles where id='c2300000-0000-4000-8000-000000000001'),'synthetic Super Admin Role remains present after protection certification');

select * from extensions.finish();
rollback;
