begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a5000000-0000-4000-8000-000000000001','authenticated','authenticated','super.organization@example.test','',now(),'{}','{}',now(),now()),
 ('a5000000-0000-4000-8000-000000000002','authenticated','authenticated','employee.organization@example.test','',now(),'{}','{}',now(),now()),
 ('a5000000-0000-4000-8000-000000000003','authenticated','authenticated','target.organization@example.test','',now(),'{}','{}',now(),now()),
 ('a5000000-0000-4000-8000-000000000004','authenticated','authenticated','pending.organization@example.test','',now(),'{}','{}',now(),now());

insert into public.departments(id,code,name,is_active)
values
 ('d5000000-0000-4000-8000-000000000001','admin4a_root','ADMIN-4A Root',true),
 ('d5000000-0000-4000-8000-000000000002','admin4a_empty','ADMIN-4A Empty',true),
 ('d5000000-0000-4000-8000-000000000003','admin4a_inactive','ADMIN-4A Inactive',false),
 ('d5000000-0000-4000-8000-000000000004','admin4a_user_ref','ADMIN-4A User Reference',true),
 ('d5000000-0000-4000-8000-000000000005','admin4a_pending_ref','ADMIN-4A Pending Reference',true),
 ('d5000000-0000-4000-8000-000000000006','admin4a_role_ref','ADMIN-4A Role Reference',true);

insert into public.teams(id,department_id,code,name,is_active)
values
 ('e5000000-0000-4000-8000-000000000001','d5000000-0000-4000-8000-000000000001','admin4a_team','ADMIN-4A Team',true),
 ('e5000000-0000-4000-8000-000000000002','d5000000-0000-4000-8000-000000000001','admin4a_team_empty','ADMIN-4A Empty Team',true),
 ('e5000000-0000-4000-8000-000000000003','d5000000-0000-4000-8000-000000000003','admin4a_inactive_parent','ADMIN-4A Inactive Parent Team',false);

insert into public.users(id,auth_user_id,employee_id,email,full_name,department_id,team_id,status,approved_at)
values
 ('b5000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001','KK-950001','super.organization@example.test','ADMIN-4A Super Operator','d5000000-0000-4000-8000-000000000001',null,'active',now()),
 ('b5000000-0000-4000-8000-000000000002','a5000000-0000-4000-8000-000000000002','KK-950002','employee.organization@example.test','ADMIN-4A Employee Operator','d5000000-0000-4000-8000-000000000001',null,'active',now()),
 ('b5000000-0000-4000-8000-000000000003','a5000000-0000-4000-8000-000000000003','KK-950003','target.organization@example.test','ADMIN-4A Active Target','d5000000-0000-4000-8000-000000000004',null,'active',now()),
 ('b5000000-0000-4000-8000-000000000004','a5000000-0000-4000-8000-000000000004',null,'pending.organization@example.test','ADMIN-4A Pending Target','d5000000-0000-4000-8000-000000000005',null,'pending_approval',null);

insert into public.user_roles(id,user_id,role_id,scope_type,department_id,assigned_by_user_id)
values
 ('c5000000-0000-4000-8000-000000000001','b5000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global',null,'b5000000-0000-4000-8000-000000000001'),
 ('c5000000-0000-4000-8000-000000000002','b5000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','global',null,'b5000000-0000-4000-8000-000000000001'),
 ('c5000000-0000-4000-8000-000000000003','b5000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000004','department','d5000000-0000-4000-8000-000000000006','b5000000-0000-4000-8000-000000000001');

select ok(not has_function_privilege('anon','public.list_managed_departments()','EXECUTE'),'anon cannot list departments');
select ok(not has_function_privilege('anon','public.list_managed_teams()','EXECUTE'),'anon cannot list teams');
select ok(not has_function_privilege('anon','public.create_department(text,text,text)','EXECUTE'),'anon cannot create departments');
select ok(not has_function_privilege('anon','public.update_department(uuid,timestamptz,text,text,text)','EXECUTE'),'anon cannot update departments');
select ok(not has_function_privilege('anon','public.set_department_active(uuid,boolean,timestamptz)','EXECUTE'),'anon cannot change department state');
select ok(not has_function_privilege('anon','public.create_team(uuid,text,text,text)','EXECUTE'),'anon cannot create teams');
select ok(not has_function_privilege('anon','public.update_team(uuid,timestamptz,text,text,text)','EXECUTE'),'anon cannot update teams');
select ok(not has_function_privilege('anon','public.set_team_active(uuid,boolean,timestamptz)','EXECUTE'),'anon cannot change team state');
select ok(has_function_privilege('authenticated','public.list_managed_departments()','EXECUTE'),'authenticated can invoke protected department list');
select ok(has_function_privilege('authenticated','public.list_managed_teams()','EXECUTE'),'authenticated can invoke protected team list');
select ok(not has_function_privilege('service_role','public.create_department(text,text,text)','EXECUTE'),'service_role has no explicit organization mutation execution');
select is((select proowner::regrole::text from pg_proc where oid='public.create_department(text,text,text)'::regprocedure),'postgres','department mutation owner is postgres');
select is((select proconfig[1] from pg_proc where oid='public.create_department(text,text,text)'::regprocedure),'search_path=pg_catalog','department mutation fixes search_path');
select is((select proowner::regrole::text from pg_proc where oid='public.create_team(uuid,text,text,text)'::regprocedure),'postgres','team mutation owner is postgres');
select is((select proconfig[1] from pg_proc where oid='public.create_team(uuid,text,text,text)'::regprocedure),'search_path=pg_catalog','team mutation fixes search_path');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.list_managed_departments()$$,'28000',null,'anonymous JWT context is rejected');
select throws_ok($$select * from public.create_department('denied','Denied',null)$$,'28000',null,'anonymous mutation is rejected');

select set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.list_managed_departments()$$,'42501',null,'missing admin access prevents department listing');
select throws_ok($$select * from public.list_managed_teams()$$,'42501',null,'missing admin access prevents team listing');
select throws_ok($$select * from public.create_department('denied','Denied',null)$$,'42501',null,'missing department management prevents creation');
select throws_ok($$select * from public.create_team('d5000000-0000-4000-8000-000000000001','denied','Denied',null)$$,'42501',null,'missing team management prevents creation');

select set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000001',true);
select ok(exists(select 1 from public.list_managed_departments() where id='d5000000-0000-4000-8000-000000000001' and team_count=2 and active_team_count=2),'department list exposes authoritative team counts');
select ok(exists(select 1 from public.list_managed_departments() where id='d5000000-0000-4000-8000-000000000004' and active_user_count=1),'department list exposes authoritative active-user counts');
select ok(exists(select 1 from public.list_managed_teams() where id='e5000000-0000-4000-8000-000000000001' and department_id='d5000000-0000-4000-8000-000000000001'),'team list preserves exact parent ownership');

select is((select created from public.create_department(' admin4a_created ',' ADMIN-4A Created ',' A local fixture ')),true,'authorized department creation succeeds');
select is((select created from public.create_department('admin4a_created','ADMIN-4A Created','A local fixture')),false,'identical department creation is idempotent');
select throws_ok($$select * from public.create_department('admin4a_created','Different Name',null)$$,'23505',null,'duplicate department code is rejected');
select throws_ok($$select * from public.create_department('admin4a_other','ADMIN-4A Created',null)$$,'23505',null,'case-insensitive duplicate department name is rejected');
select throws_ok($$select * from public.create_department('Bad Code','Valid Name',null)$$,'22023',null,'invalid department code is rejected');
select is((select count(*) from public.audit_events where action='department.created' and target_id=(select id from public.departments where code='admin4a_created')),1::bigint,'department creation is audited once');

select is((select changed from public.update_department(
  (select id from public.departments where code='admin4a_created'),
  (select updated_at from public.departments where code='admin4a_created'),
  'admin4a_renamed','ADMIN-4A Renamed','Updated fixture'
)),true,'department update succeeds');
select is((select changed from public.update_department(
  (select id from public.departments where code='admin4a_renamed'),
  (select updated_at from public.departments where code='admin4a_renamed'),
  'admin4a_renamed','ADMIN-4A Renamed','Updated fixture'
)),false,'identical department update is idempotent');
select throws_ok($$select * from public.update_department(
  (select id from public.departments where code='admin4a_renamed'),
  '2000-01-01T00:00:00Z','admin4a_stale','ADMIN-4A Stale',null
)$$,'55000',null,'stale department update is rejected');
select is((select count(*) from public.audit_events where action='department.updated' and target_id=(select id from public.departments where code='admin4a_renamed')),1::bigint,'department update is audited once');

select is((select changed from public.set_department_active(
  'd5000000-0000-4000-8000-000000000002',false,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000002')
)),true,'empty department deactivation succeeds');
select is((select changed from public.set_department_active(
  'd5000000-0000-4000-8000-000000000002',false,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000002')
)),false,'department deactivation is idempotent');
select is((select changed from public.set_department_active(
  'd5000000-0000-4000-8000-000000000002',true,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000002')
)),true,'department reactivation succeeds');
select throws_ok($$select * from public.set_department_active(
  'd5000000-0000-4000-8000-000000000001',false,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000001')
)$$,'55000',null,'department with active teams cannot be deactivated');
select throws_ok($$select * from public.set_department_active(
  'd5000000-0000-4000-8000-000000000004',false,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000004')
)$$,'55000',null,'department with active users cannot be deactivated');
select throws_ok($$select * from public.set_department_active(
  'd5000000-0000-4000-8000-000000000005',false,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000005')
)$$,'55000',null,'department with pending users cannot be deactivated');
select throws_ok($$select * from public.set_department_active(
  'd5000000-0000-4000-8000-000000000006',false,
  (select updated_at from public.departments where id='d5000000-0000-4000-8000-000000000006')
)$$,'55000',null,'department with active scoped roles cannot be deactivated');
select is((select count(*) from public.audit_events where action in ('department.deactivated','department.reactivated') and target_id='d5000000-0000-4000-8000-000000000002'),2::bigint,'department lifecycle changes are audited and idempotent retries are not');

select is((select created from public.create_team('d5000000-0000-4000-8000-000000000002','admin4a_created_team','ADMIN-4A Created Team','Fixture')),true,'team creation under active department succeeds');
select is((select created from public.create_team('d5000000-0000-4000-8000-000000000002','admin4a_created_team','ADMIN-4A Created Team','Fixture')),false,'identical team creation is idempotent');
select throws_ok($$select * from public.create_team('d5000000-0000-4000-8000-000000000002','admin4a_created_team','Different Team',null)$$,'23505',null,'duplicate team code in a department is rejected');
select throws_ok($$select * from public.create_team('d5000000-0000-4000-8000-000000000002','admin4a_other_team','ADMIN-4A Created Team',null)$$,'23505',null,'case-insensitive duplicate team name in a department is rejected');
select throws_ok($$select * from public.create_team('d5999999-0000-4000-8000-000000000099','missing','Missing Department',null)$$,'23503',null,'missing team parent is rejected');
select throws_ok($$select * from public.create_team('d5000000-0000-4000-8000-000000000003','inactive','Inactive Parent',null)$$,'55000',null,'inactive team parent is rejected');
select is((select count(*) from public.audit_events where action='team.created' and target_id=(select id from public.teams where code='admin4a_created_team')),1::bigint,'team creation is audited once');

select is((select changed from public.update_team(
  (select id from public.teams where code='admin4a_created_team'),
  (select updated_at from public.teams where code='admin4a_created_team'),
  'admin4a_renamed_team','ADMIN-4A Renamed Team','Updated fixture'
)),true,'team update succeeds without reparenting');
select is((select changed from public.update_team(
  (select id from public.teams where code='admin4a_renamed_team'),
  (select updated_at from public.teams where code='admin4a_renamed_team'),
  'admin4a_renamed_team','ADMIN-4A Renamed Team','Updated fixture'
)),false,'identical team update is idempotent');
select throws_ok($$select * from public.update_team(
  (select id from public.teams where code='admin4a_renamed_team'),
  '2000-01-01T00:00:00Z','admin4a_stale_team','ADMIN-4A Stale Team',null
)$$,'55000',null,'stale team update is rejected');
select is((select department_id from public.teams where code='admin4a_renamed_team'),'d5000000-0000-4000-8000-000000000002'::uuid,'team update cannot reparent the record');
select is((select count(*) from public.audit_events where action='team.updated' and target_id=(select id from public.teams where code='admin4a_renamed_team')),1::bigint,'team update is audited once');

select is((select changed from public.set_team_active(
  'e5000000-0000-4000-8000-000000000002',false,
  (select updated_at from public.teams where id='e5000000-0000-4000-8000-000000000002')
)),true,'empty team deactivation succeeds');
select is((select changed from public.set_team_active(
  'e5000000-0000-4000-8000-000000000002',true,
  (select updated_at from public.teams where id='e5000000-0000-4000-8000-000000000002')
)),true,'team reactivation under active parent succeeds');
update public.users set team_id='e5000000-0000-4000-8000-000000000001', department_id='d5000000-0000-4000-8000-000000000001' where id='b5000000-0000-4000-8000-000000000003';
select throws_ok($$select * from public.set_team_active(
  'e5000000-0000-4000-8000-000000000001',false,
  (select updated_at from public.teams where id='e5000000-0000-4000-8000-000000000001')
)$$,'55000',null,'team with active users cannot be deactivated');
update public.users set team_id=null, department_id='d5000000-0000-4000-8000-000000000004' where id='b5000000-0000-4000-8000-000000000003';
insert into public.user_roles(id,user_id,role_id,scope_type,team_id,assigned_by_user_id)
values('c5000000-0000-4000-8000-000000000004','b5000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000004','team','e5000000-0000-4000-8000-000000000001','b5000000-0000-4000-8000-000000000001');
select throws_ok($$select * from public.set_team_active(
  'e5000000-0000-4000-8000-000000000001',false,
  (select updated_at from public.teams where id='e5000000-0000-4000-8000-000000000001')
)$$,'55000',null,'team with active scoped roles cannot be deactivated');
select throws_ok($$select * from public.set_team_active(
  'e5000000-0000-4000-8000-000000000003',true,
  (select updated_at from public.teams where id='e5000000-0000-4000-8000-000000000003')
)$$,'55000',null,'team under inactive parent cannot be reactivated');
select is((select count(*) from public.audit_events where action in ('team.deactivated','team.reactivated') and target_id='e5000000-0000-4000-8000-000000000002'),2::bigint,'team lifecycle changes are audited');

set local role authenticated;
select set_config('request.jwt.claim.sub','a5000000-0000-4000-8000-000000000001',true);
select throws_ok($$insert into public.departments(code,name) values('browser_write','Browser Write')$$,'42501',null,'authenticated browser cannot write departments directly');
select throws_ok($$insert into public.teams(department_id,code,name) values('d5000000-0000-4000-8000-000000000001','browser_write','Browser Write')$$,'42501',null,'authenticated browser cannot write teams directly');
reset role;

select ok(not exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname like '%delete%department%'),'organization surface exposes no department hard-delete function');
select ok(not exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname like '%delete%team%'),'organization surface exposes no team hard-delete function');
select is((select count(*) from public.user_roles where id::text like 'c5000000-%'),4::bigint,'organization operations do not create role assignments or escalate privileges');
select is((select count(*) from public.users where id::text like 'b5000000-%'),4::bigint,'organization operations do not create or remove users');

select * from finish();
rollback;
