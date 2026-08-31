begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Schema, Position policy, and restrictive references.
select has_table('public','positions','canonical Position catalog exists');
select has_table('public','user_operational_assignments','operational assignment history exists');
select has_column('public','users','position_id','users expose an optional current general Position');
select ok(exists(select 1 from pg_constraint where conname='users_position_fk' and confdeltype='r' and confupdtype='r'),'current Position uses a restrictive foreign key');
select ok(exists(select 1 from pg_constraint where conname='user_operational_assignments_team_campaign_fk' and confdeltype='r' and confupdtype='r'),'assignment Team and Campaign are proven by one restrictive composite foreign key');
select ok(exists(select 1 from pg_constraint where conname='user_operational_assignments_period_valid'),'assignment period constraint exists');
select ok(exists(select 1 from pg_indexes where schemaname='public' and indexname='user_operational_assignments_active_primary_unique'),'one-active-primary index exists');
select ok(exists(select 1 from pg_indexes where schemaname='public' and indexname='user_operational_assignments_user_history_idx'),'user history query index exists');
select ok(exists(select 1 from public.permissions where key='positions.view' and is_active),'positions.view is canonical and active');
select ok(exists(select 1 from public.permissions where key='assignments.view' and is_active),'assignments.view is canonical and active');
select is((select count(*) from public.permissions where key in ('positions.manage','assignments.manage')),0::bigint,'read-only foundation adds no mutation permissions');
select results_eq(
  $$select role.key from public.role_permissions role_permission join public.roles role on role.id=role_permission.role_id join public.permissions permission on permission.id=role_permission.permission_id where permission.key in ('positions.view','assignments.view') order by permission.key,role.key$$,
  $$values ('super_admin'::text),('super_admin'::text)$$,
  'new read permissions are initially granted only to Super Admin'
);
select ok((select relrowsecurity from pg_class where oid='public.positions'::regclass),'Position RLS is enabled');
select ok((select relrowsecurity from pg_class where oid='public.user_operational_assignments'::regclass),'assignment RLS is enabled');

-- Entirely fictitious isolated foundation.
insert into public.departments(id,code,name,is_active) values
 ('d9000000-0000-4000-8000-000000000001','admin7_operations','ADMIN-7 Operations',true),
 ('d9000000-0000-4000-8000-000000000002','admin7_quality','ADMIN-7 Quality',true);

insert into public.campaigns(id,code,name,is_active) values
 ('f9000000-0000-4000-8000-000000000001','admin7_primary','ADMIN-7 Primary Campaign',true),
 ('f9000000-0000-4000-8000-000000000002','admin7_secondary','ADMIN-7 Secondary Campaign',true),
 ('f9000000-0000-4000-8000-000000000003','admin7_inactive','ADMIN-7 Inactive Campaign',false);

insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('e9000000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000001','admin7_primary_team','ADMIN-7 Primary Team',true),
 ('e9000000-0000-4000-8000-000000000002','d9000000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000002','admin7_secondary_team','ADMIN-7 Secondary Team',true),
 ('e9000000-0000-4000-8000-000000000003','d9000000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000001','admin7_inactive_team','ADMIN-7 Inactive Team',false),
 ('e9000000-0000-4000-8000-000000000004','d9000000-0000-4000-8000-000000000001',null,'admin7_unlinked_team','ADMIN-7 Unlinked Team',true);

insert into public.positions(id,code,name,description,is_active,created_at,updated_at) values
 ('19000000-0000-4000-8000-000000000001','admin7_qa_analyst','ADMIN-7 QA Analyst','Fictitious local Position',true,'2020-01-01T00:00:00Z','2020-01-01T00:00:00Z'),
 ('19000000-0000-4000-8000-000000000002','admin7_trainer','ADMIN-7 Trainer',null,true,now(),now()),
 ('19000000-0000-4000-8000-000000000003','admin7_inactive_position','ADMIN-7 Inactive Position',null,false,now(),now());

select throws_ok($$insert into public.positions(code,name) values ('Bad Code','Valid Position')$$,'23514',null,'Position code normalization is enforced');
select throws_ok($$insert into public.positions(code,name) values ('admin7_blank',' ')$$,'23514',null,'blank Position names are rejected');
select throws_ok($$insert into public.positions(code,name) values ('admin7_qa_analyst','Different Position')$$,'23505',null,'Position codes are case-insensitively unique');
select throws_ok($$insert into public.positions(code,name) values ('admin7_duplicate_name','admin-7 qa analyst')$$,'23505',null,'Position names are case-insensitively unique');
select lives_ok($$update public.positions set description='Updated local description' where id='19000000-0000-4000-8000-000000000001'$$,'Position descriptive fields can change without replacing identity');
select ok((select updated_at > '2020-01-01T00:00:00Z' from public.positions where id='19000000-0000-4000-8000-000000000001'),'Position updated_at is database-owned');
select throws_ok($$update public.positions set created_at=now() where id='19000000-0000-4000-8000-000000000001'$$,'P0001',null,'Position creation identity is immutable');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('a9000000-0000-4000-8000-000000000001','authenticated','authenticated','admin7.super@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000002','authenticated','authenticated','admin7.position.viewer@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000003','authenticated','authenticated','admin7.assignment.viewer@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000004','authenticated','authenticated','admin7.denied@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000005','authenticated','authenticated','admin7.inactive@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000006','authenticated','authenticated','admin7.target@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000007','authenticated','authenticated','admin7.no.assignment@example.test','',now(),'{}','{}',now(),now()),
 ('a9000000-0000-4000-8000-000000000008','authenticated','authenticated','admin7.pending@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,team_id,position_id,approved_at) values
 ('b9000000-0000-4000-8000-000000000001','a9000000-0000-4000-8000-000000000001','KK-990001','admin7.super@example.test','ADMIN-7 Super','active','d9000000-0000-4000-8000-000000000001',null,null,now()),
 ('b9000000-0000-4000-8000-000000000002','a9000000-0000-4000-8000-000000000002','KK-990002','admin7.position.viewer@example.test','ADMIN-7 Position Viewer','active','d9000000-0000-4000-8000-000000000001',null,null,now()),
 ('b9000000-0000-4000-8000-000000000003','a9000000-0000-4000-8000-000000000003','KK-990003','admin7.assignment.viewer@example.test','ADMIN-7 Assignment Viewer','active','d9000000-0000-4000-8000-000000000001',null,null,now()),
 ('b9000000-0000-4000-8000-000000000004','a9000000-0000-4000-8000-000000000004','KK-990004','admin7.denied@example.test','ADMIN-7 Denied','active','d9000000-0000-4000-8000-000000000001',null,null,now()),
 ('b9000000-0000-4000-8000-000000000005','a9000000-0000-4000-8000-000000000005','KK-990005','admin7.inactive@example.test','ADMIN-7 Inactive','inactive','d9000000-0000-4000-8000-000000000001',null,null,now()),
 ('b9000000-0000-4000-8000-000000000006','a9000000-0000-4000-8000-000000000006','KK-990006','admin7.target@example.test','ADMIN-7 Cross Department Target','active','d9000000-0000-4000-8000-000000000002',null,'19000000-0000-4000-8000-000000000001',now()),
 ('b9000000-0000-4000-8000-000000000007','a9000000-0000-4000-8000-000000000007','KK-990007','admin7.no.assignment@example.test','ADMIN-7 No Assignment','active','d9000000-0000-4000-8000-000000000002',null,'19000000-0000-4000-8000-000000000002',now());

insert into public.users(id,auth_user_id,email,full_name,status)
values ('b9000000-0000-4000-8000-000000000008','a9000000-0000-4000-8000-000000000008','admin7.pending@example.test','ADMIN-7 Pending','pending_approval');

insert into public.roles(id,key,name,is_system,is_active) values
 ('17000000-0000-4000-8000-000000007001','admin7_position_viewer','ADMIN-7 Position Viewer',false,true),
 ('17000000-0000-4000-8000-000000007002','admin7_assignment_viewer','ADMIN-7 Assignment Viewer',false,true),
 ('17000000-0000-4000-8000-000000007003','admin7_assignment_denied','ADMIN-7 Assignment Denied',false,true);
insert into public.role_scopes(role_id,scope_type) values
 ('17000000-0000-4000-8000-000000007001','global'),
 ('17000000-0000-4000-8000-000000007002','global'),
 ('17000000-0000-4000-8000-000000007003','global');
insert into public.role_permissions(role_id,permission_id)
select '17000000-0000-4000-8000-000000007001',id from public.permissions where key in ('admin.access','positions.view');
insert into public.role_permissions(role_id,permission_id)
select '17000000-0000-4000-8000-000000007002',id from public.permissions where key in ('admin.access','users.view','assignments.view');
insert into public.role_permissions(role_id,permission_id)
select '17000000-0000-4000-8000-000000007003',id from public.permissions where key in ('admin.access','users.view');

insert into public.user_roles(id,user_id,role_id,scope_type) values
 ('c9000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
 ('c9000000-0000-4000-8000-000000000002','b9000000-0000-4000-8000-000000000002','17000000-0000-4000-8000-000000007001','global'),
 ('c9000000-0000-4000-8000-000000000003','b9000000-0000-4000-8000-000000000003','17000000-0000-4000-8000-000000007002','global'),
 ('c9000000-0000-4000-8000-000000000004','b9000000-0000-4000-8000-000000000004','17000000-0000-4000-8000-000000007003','global'),
 ('c9000000-0000-4000-8000-000000000005','b9000000-0000-4000-8000-000000000005','10000000-0000-0000-0000-000000000010','global'),
 ('c9000000-0000-4000-8000-000000000006','b9000000-0000-4000-8000-000000000006','10000000-0000-0000-0000-000000000001','global'),
 ('c9000000-0000-4000-8000-000000000007','b9000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000001','global');

-- Assignment integrity, active-state checks, history, duplicates, and primary.
select lives_ok($$insert into public.user_operational_assignments(id,user_id,campaign_id,position_id,is_primary,started_at) values ('19000000-0000-4000-8000-000000000010','b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000001',true,'2026-01-01T00:00:00Z')$$,'Campaign-level primary assignment is valid');
select lives_ok($$insert into public.user_operational_assignments(id,user_id,campaign_id,team_id,position_id,started_at) values ('19000000-0000-4000-8000-000000000011','b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000001','2026-02-01T00:00:00Z')$$,'Campaign and canonical Team assignment is valid');
select lives_ok($$insert into public.user_operational_assignments(id,user_id,campaign_id,team_id,position_id,started_at) values ('19000000-0000-4000-8000-000000000012','b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000002','e9000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000002','2026-03-01T00:00:00Z')$$,'one user can hold a cross-Campaign assignment');
select is((select count(*) from public.user_operational_assignments where user_id='b9000000-0000-4000-8000-000000000006'),3::bigint,'multiple assignments are stored for one user');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,position_id) values ('b9000000-0000-4000-8000-000000000006','ffffffff-ffff-4fff-8fff-ffffffffffff','19000000-0000-4000-8000-000000000001')$$,'55000',null,'missing Campaign is rejected for an active assignment');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,team_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','ffffffff-ffff-4fff-8fff-ffffffffffff','19000000-0000-4000-8000-000000000001')$$,'55000',null,'missing Team is rejected for an active assignment');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,team_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000002')$$,'55000',null,'Team from another Campaign is rejected server-side');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,team_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000004','19000000-0000-4000-8000-000000000002')$$,'55000',null,'campaign-null legacy Team is rejected');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000003','19000000-0000-4000-8000-000000000001')$$,'55000',null,'inactive Campaign is rejected for a new active assignment');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,team_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000003','19000000-0000-4000-8000-000000000001')$$,'55000',null,'inactive Team is rejected for a new active assignment');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000003')$$,'55000',null,'inactive Position is rejected for a new active assignment');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,position_id) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000001')$$,'23505',null,'duplicate active Campaign-level assignment is rejected');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,position_id,is_primary) values ('b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000002',true)$$,'23505',null,'a second active primary assignment is rejected');
select lives_ok($$insert into public.user_operational_assignments(id,user_id,campaign_id,position_id,started_at) values ('19000000-0000-4000-8000-000000000013','b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000001','2026-04-01T00:00:00Z')$$,'additional active secondary assignment is allowed');
select throws_ok($$update public.user_operational_assignments set ended_at='2025-12-31T00:00:00Z' where id='19000000-0000-4000-8000-000000000010'$$,'23514',null,'assignment end cannot precede start');
select lives_ok($$update public.user_operational_assignments set ended_at='2026-06-01T00:00:00Z' where id='19000000-0000-4000-8000-000000000010'$$,'active assignment can be ended without deletion');
select ok(exists(select 1 from public.user_operational_assignments where id='19000000-0000-4000-8000-000000000010' and ended_at is not null and is_primary),'ended historical primary assignment remains stored');
select lives_ok($$insert into public.user_operational_assignments(id,user_id,campaign_id,position_id,is_primary,started_at) values ('19000000-0000-4000-8000-000000000014','b9000000-0000-4000-8000-000000000006','f9000000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000001',true,'2026-06-02T00:00:00Z')$$,'same combination may start again after prior history ended');
select throws_ok($$update public.user_operational_assignments set campaign_id='f9000000-0000-4000-8000-000000000002' where id='19000000-0000-4000-8000-000000000014'$$,'P0001',null,'assignment target fields are immutable');

-- Independence: assignment, employment, approval, and RBAC never imply each other.
select is((select count(*) from public.user_roles where user_id='b9000000-0000-4000-8000-000000000006'),1::bigint,'creating assignments does not create user_roles');
select is((select department_id from public.users where id='b9000000-0000-4000-8000-000000000006'),'d9000000-0000-4000-8000-000000000002'::uuid,'cross-Campaign assignments do not change employment Department');
select is((select team_id from public.users where id='b9000000-0000-4000-8000-000000000006'),null::uuid,'operational Team does not become employment Team');
select is((select count(*) from public.user_operational_assignments where user_id='b9000000-0000-4000-8000-000000000007'),0::bigint,'a user_role does not create an operational assignment');
delete from public.user_roles where id='c9000000-0000-4000-8000-000000000006';
select is((select count(*) from public.user_operational_assignments where user_id='b9000000-0000-4000-8000-000000000006'),5::bigint,'role removal does not remove operational assignment history');
select ok(exists(select 1 from public.user_roles where id='c9000000-0000-4000-8000-000000000007'),'ending an assignment does not remove a role');

select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000001',true);
select lives_ok($$select * from public.approve_pending_user('b9000000-0000-4000-8000-000000000008','d9000000-0000-4000-8000-000000000002',null,'[{"role_id":"10000000-0000-0000-0000-000000000001","scope_type":"global"}]'::jsonb)$$,'isolated pending approval remains compatible');
select is((select count(*) from public.user_operational_assignments where user_id='b9000000-0000-4000-8000-000000000008'),0::bigint,'pending approval does not create an operational assignment');

-- Protected reads, safe resolved projections, and deterministic history.
select ok(has_function_privilege('authenticated','public.list_managed_positions()','EXECUTE'),'authenticated may invoke protected Position catalog');
select ok(not has_function_privilege('anon','public.list_managed_positions()','EXECUTE'),'anon cannot invoke Position catalog');
select ok(has_function_privilege('authenticated','public.get_user_operational_assignments(uuid)','EXECUTE'),'authenticated may invoke protected assignment history');
select ok(not has_function_privilege('anon','public.get_user_operational_assignments(uuid)','EXECUTE'),'anon cannot invoke assignment history');
select is((select proowner::regrole::text from pg_proc where oid='public.list_managed_positions()'::regprocedure),'postgres','Position RPC owner is postgres');
select is((select proowner::regrole::text from pg_proc where oid='public.get_user_operational_assignments(uuid)'::regprocedure),'postgres','assignment RPC owner is postgres');
select ok((select prosecdef from pg_proc where oid='public.list_managed_positions()'::regprocedure),'Position RPC is SECURITY DEFINER');
select ok((select prosecdef from pg_proc where oid='public.get_user_operational_assignments(uuid)'::regprocedure),'assignment RPC is SECURITY DEFINER');
select is((select proconfig[1] from pg_proc where oid='public.list_managed_positions()'::regprocedure),'search_path=pg_catalog','Position RPC fixes search_path');
select is((select proconfig[1] from pg_proc where oid='public.get_user_operational_assignments(uuid)'::regprocedure),'search_path=pg_catalog','assignment RPC fixes search_path');
select ok(not has_table_privilege('authenticated','public.positions','SELECT'),'browser has no direct Position-table read');
select ok(not has_table_privilege('authenticated','public.user_operational_assignments','SELECT'),'browser has no direct assignment-table read');
select ok(not has_table_privilege('authenticated','public.positions','INSERT'),'browser has no direct Position write');
select ok(not has_table_privilege('authenticated','public.user_operational_assignments','INSERT'),'browser has no direct assignment write');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.list_managed_positions()$$,'28000',null,'anonymous Position read is rejected');
select throws_ok($$select * from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000006')$$,'28000',null,'anonymous assignment read is rejected');
select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.list_managed_positions()$$,'42501',null,'missing positions.view is rejected');
select throws_ok($$select * from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000006')$$,'42501',null,'missing assignments.view is rejected');
select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000005',true);
select throws_ok($$select * from public.list_managed_positions()$$,'42501',null,'inactive Position reader is rejected');

select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.list_managed_positions()),3::bigint,'authorized Position reader receives catalog');
select ok(exists(select 1 from public.list_managed_positions() where code='admin7_qa_analyst' and current_user_count=1 and active_assignment_count=3 and assignment_count=4),'Position counts are resolved server-side');

select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000006')),5::bigint,'authorized reader receives complete assignment history');
select ok(exists(select 1 from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000006') where team_id is null and team_name is null and campaign_code='admin7_primary'),'Campaign-level assignment has no fabricated Team');
select ok(exists(select 1 from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000006') where team_code='admin7_primary_team' and position_code='admin7_qa_analyst'),'Team and Position displays resolve server-side');
select ok((select is_active and is_primary from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000006') limit 1),'active primary assignment sorts first deterministically');
select is((select count(*) from public.get_user_operational_assignments('b9000000-0000-4000-8000-000000000007')),0::bigint,'assignment history empty state is exact');

select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000001',true);
select ok(exists(select 1 from public.get_managed_user('b9000000-0000-4000-8000-000000000007') where position_code='admin7_trainer' and position_name='ADMIN-7 Trainer'),'managed user detail resolves general Position without a Campaign assignment');
select ok(not exists(select 1 from public.get_managed_user('b9000000-0000-4000-8000-000000000001') where position_id is not null),'managed user detail preserves honest unassigned Position state');
select is((select count(*) from public.audit_events where target_type in ('position','operational_assignment')),0::bigint,'read-only foundation creates no Position or assignment audit events');

-- Historical rows survive later catalog inactivation and restrictive deletion.
update public.campaigns set is_active=false where id='f9000000-0000-4000-8000-000000000001';
update public.positions set is_active=false where id='19000000-0000-4000-8000-000000000001';
select ok(exists(select 1 from public.user_operational_assignments where id='19000000-0000-4000-8000-000000000010'),'historical assignment survives Campaign and Position inactivation');
select throws_ok($$delete from public.positions where id='19000000-0000-4000-8000-000000000001'$$,'23503',null,'referenced Position cannot be hard-deleted');
select throws_ok($$delete from public.campaigns where id='f9000000-0000-4000-8000-000000000001'$$,'23503',null,'referenced Campaign cannot be hard-deleted');

set local role authenticated;
select set_config('request.jwt.claim.sub','a9000000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.positions$$,'42501',null,'authenticated browser cannot bypass Position RPC');
select throws_ok($$select count(*) from public.user_operational_assignments$$,'42501',null,'authenticated browser cannot bypass assignment RPC');
select throws_ok($$insert into public.positions(code,name) values ('browser_position','Browser Position')$$,'42501',null,'authenticated browser cannot create Position');
select throws_ok($$insert into public.user_operational_assignments(user_id,campaign_id,position_id) values ('b9000000-0000-4000-8000-000000000007','f9000000-0000-4000-8000-000000000002','19000000-0000-4000-8000-000000000002')$$,'42501',null,'authenticated browser cannot create assignment');
reset role;

select * from finish();
rollback;
