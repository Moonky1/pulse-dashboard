begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Schema and catalog policy.
select has_column('public','user_roles','campaign_id','user roles expose one exact Campaign target');
select ok(exists(select 1 from pg_constraint where conname='user_roles_campaign_fk' and confdeltype='r' and confupdtype='r'),'Campaign assignments use a restrictive foreign key');
select ok(exists(select 1 from pg_constraint where conname='user_roles_team_fk' and confdeltype='r' and confupdtype='r'),'Team assignments retain a restrictive direct foreign key');
select ok(exists(select 1 from pg_constraint where conname='user_roles_scope_valid'),'one-target scope constraint exists');
select is((select count(*) from public.role_scopes scope join public.roles role on role.id=scope.role_id where scope.scope_type='campaign'),2::bigint,'exactly two roles support Campaign scope');
select results_eq(
  $$select role.key from public.role_scopes scope join public.roles role on role.id=scope.role_id where scope.scope_type='campaign' order by role.key$$,
  $$values ('qa'::text),('supervisor'::text)$$,
  'only QA and Supervisor support Campaign scope'
);
select ok(not exists(
  select 1 from public.role_scopes scope join public.roles role on role.id=scope.role_id
  where scope.scope_type='campaign' and role.key in ('super_admin','admin','it','human_resources','payroll','team_leader','agent','employee')
),'unsupported roles receive no Campaign scope');
select is((select count(*) from public.role_grant_rules where scope_type='campaign'),6::bigint,'exactly six Campaign grant rules exist');
select results_eq(
  $$select grantor.key||'>'||grantable.key from public.role_grant_rules rule join public.roles grantor on grantor.id=rule.grantor_role_id join public.roles grantable on grantable.id=rule.grantable_role_id where rule.scope_type='campaign' order by 1$$,
  $$values ('admin>qa'::text),('admin>supervisor'::text),('human_resources>qa'::text),('human_resources>supervisor'::text),('super_admin>qa'::text),('super_admin>supervisor'::text)$$,
  'Campaign grantors exactly mirror existing authority for QA and Supervisor'
);
select ok(not exists(
  select 1 from public.role_grant_rules rule join public.roles grantor on grantor.id=rule.grantor_role_id
  where rule.scope_type='campaign' and grantor.key not in ('super_admin','admin','human_resources')
),'Campaign introduces no lower-privilege grantor');

-- Fictitious isolated organization.
insert into public.departments(id,code,name,is_active) values
 ('d8000000-0000-4000-8000-000000000001','admin6b_operations','ADMIN-6B Operations',true),
 ('d8000000-0000-4000-8000-000000000002','admin6b_quality','ADMIN-6B Quality Assurance',true);

insert into public.campaigns(id,code,name,is_active) values
 ('f8000000-0000-4000-8000-000000000001','admin6b_garrett','ADMIN-6B Garrett',true),
 ('f8000000-0000-4000-8000-000000000002','admin6b_joe','ADMIN-6B Joe',true),
 ('f8000000-0000-4000-8000-000000000003','admin6b_inactive','ADMIN-6B Inactive',false);

insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('e8000000-0000-4000-8000-000000000001','d8000000-0000-4000-8000-000000000001','f8000000-0000-4000-8000-000000000001','admin6b_garrett_team','ADMIN-6B Garrett Team',true),
 ('e8000000-0000-4000-8000-000000000002','d8000000-0000-4000-8000-000000000001','f8000000-0000-4000-8000-000000000002','admin6b_joe_team','ADMIN-6B Joe Team',true),
 ('e8000000-0000-4000-8000-000000000003','d8000000-0000-4000-8000-000000000001',null,'admin6b_legacy_team','ADMIN-6B Legacy Team',true),
 ('e8000000-0000-4000-8000-000000000004','d8000000-0000-4000-8000-000000000001','f8000000-0000-4000-8000-000000000001','admin6b_inactive_team','ADMIN-6B Inactive Team',false);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('a8000000-0000-4000-8000-000000000001','authenticated','authenticated','admin6b.super@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000002','authenticated','authenticated','admin6b.admin@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000003','authenticated','authenticated','admin6b.denied@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000004','authenticated','authenticated','admin6b.campaign.permission@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000005','authenticated','authenticated','admin6b.department.permission@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000006','authenticated','authenticated','admin6b.team.permission@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000007','authenticated','authenticated','admin6b.assign.target@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000008','authenticated','authenticated','admin6b.catalog.target@example.test','',now(),'{}','{}',now(),now()),
 ('a8000000-0000-4000-8000-000000000009','authenticated','authenticated','admin6b.pending@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,team_id,approved_at) values
 ('b8000000-0000-4000-8000-000000000001','a8000000-0000-4000-8000-000000000001','KK-980001','admin6b.super@example.test','ADMIN-6B Super','active','d8000000-0000-4000-8000-000000000001',null,now()),
 ('b8000000-0000-4000-8000-000000000002','a8000000-0000-4000-8000-000000000002','KK-980002','admin6b.admin@example.test','ADMIN-6B Admin','active','d8000000-0000-4000-8000-000000000001',null,now()),
 ('b8000000-0000-4000-8000-000000000003','a8000000-0000-4000-8000-000000000003','KK-980003','admin6b.denied@example.test','ADMIN-6B Denied','active','d8000000-0000-4000-8000-000000000001',null,now()),
 ('b8000000-0000-4000-8000-000000000004','a8000000-0000-4000-8000-000000000004','KK-980004','admin6b.campaign.permission@example.test','ADMIN-6B Cross Department QA','active','d8000000-0000-4000-8000-000000000002',null,now()),
 ('b8000000-0000-4000-8000-000000000005','a8000000-0000-4000-8000-000000000005','KK-980005','admin6b.department.permission@example.test','ADMIN-6B Department QA','active','d8000000-0000-4000-8000-000000000001',null,now()),
 ('b8000000-0000-4000-8000-000000000006','a8000000-0000-4000-8000-000000000006','KK-980006','admin6b.team.permission@example.test','ADMIN-6B Team QA','active','d8000000-0000-4000-8000-000000000001','e8000000-0000-4000-8000-000000000001',now()),
 ('b8000000-0000-4000-8000-000000000007','a8000000-0000-4000-8000-000000000007','KK-980007','admin6b.assign.target@example.test','ADMIN-6B Assign Target','active','d8000000-0000-4000-8000-000000000002',null,now()),
 ('b8000000-0000-4000-8000-000000000008','a8000000-0000-4000-8000-000000000008','KK-980008','admin6b.catalog.target@example.test','ADMIN-6B Catalog Target','active','d8000000-0000-4000-8000-000000000002',null,now()),
 ('b8000000-0000-4000-8000-000000000009','a8000000-0000-4000-8000-000000000009',null,'admin6b.pending@example.test','ADMIN-6B Pending','pending_approval',null,null,null);

insert into public.user_roles(id,user_id,role_id,scope_type,department_id,campaign_id,team_id) values
 ('c8000000-0000-4000-8000-000000000001','b8000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global',null,null,null),
 ('c8000000-0000-4000-8000-000000000002','b8000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global',null,null,null),
 ('c8000000-0000-4000-8000-000000000003','b8000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000008','global',null,null,null),
 ('c8000000-0000-4000-8000-000000000004','b8000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000005','campaign',null,'f8000000-0000-4000-8000-000000000001',null),
 ('c8000000-0000-4000-8000-000000000005','b8000000-0000-4000-8000-000000000005','10000000-0000-0000-0000-000000000005','department','d8000000-0000-4000-8000-000000000001',null,null),
 ('c8000000-0000-4000-8000-000000000006','b8000000-0000-4000-8000-000000000006','10000000-0000-0000-0000-000000000005','team',null,null,'e8000000-0000-4000-8000-000000000001'),
 ('c8000000-0000-4000-8000-000000000007','b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000001','global',null,null,null),
 ('c8000000-0000-4000-8000-000000000008','b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000001','global',null,null,null);

-- Strict one-target integrity.
select lives_ok($$insert into public.user_roles(user_id,role_id,scope_type,campaign_id) values ('b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000004','campaign','f8000000-0000-4000-8000-000000000002')$$,'valid Campaign assignment is stored');
select throws_ok($$insert into public.user_roles(user_id,role_id,scope_type,department_id,campaign_id) values ('b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000005','campaign','d8000000-0000-4000-8000-000000000002','f8000000-0000-4000-8000-000000000001')$$,'23514',null,'mixed Campaign and Department assignment is rejected');
select throws_ok($$insert into public.user_roles(user_id,role_id,scope_type,campaign_id,team_id) values ('b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000005','team','f8000000-0000-4000-8000-000000000001','e8000000-0000-4000-8000-000000000001')$$,'23514',null,'mixed Campaign and Team assignment is rejected');
select throws_ok($$insert into public.user_roles(user_id,role_id,scope_type) values ('b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000005','campaign')$$,'23514',null,'Campaign assignment requires a Campaign target');
select throws_ok($$insert into public.user_roles(user_id,role_id,scope_type,campaign_id) values ('b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000005','campaign','ffffffff-ffff-4fff-8fff-ffffffffffff')$$,'23503',null,'missing Campaign target is rejected');
select ok(exists(select 1 from public.user_roles where scope_type='team' and department_id is null and team_id is not null),'Team assignments use only their canonical Team ID');
delete from public.user_roles
where user_id='b8000000-0000-4000-8000-000000000008'
  and role_id='10000000-0000-0000-0000-000000000004'
  and campaign_id='f8000000-0000-4000-8000-000000000002';

-- Permission semantics: Global/Department/Team stay unchanged; Campaign is orthogonal to employment.
select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000001',true);
select ok(pulse_private.has_permission('users.view',null,'f8000000-0000-4000-8000-000000000001',null),'Global authority still matches a Campaign resource');

select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000005',true);
select ok(pulse_private.has_permission('users.view','d8000000-0000-4000-8000-000000000001',null,null),'Department exact behavior is unchanged');
select ok(pulse_private.has_permission('users.view','d8000000-0000-4000-8000-000000000001',null,'e8000000-0000-4000-8000-000000000001'),'Department still contains its Team');
select ok(not pulse_private.has_permission('users.view',null,'f8000000-0000-4000-8000-000000000001',null),'Department does not automatically contain Campaign');

select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000006',true);
select ok(pulse_private.has_permission('users.view',null,null,'e8000000-0000-4000-8000-000000000001'),'Team exact behavior is unchanged');
select ok(not pulse_private.has_permission('users.view',null,null,'e8000000-0000-4000-8000-000000000002'),'Team does not match another Team');

select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000004',true);
select ok(pulse_private.has_permission('users.view',null,'f8000000-0000-4000-8000-000000000001',null),'Campaign exact permission succeeds across employment Departments');
select ok(pulse_private.has_permission('users.view',null,null,'e8000000-0000-4000-8000-000000000001'),'Campaign authority reaches its active canonical Team');
select ok(not pulse_private.has_permission('users.view',null,'f8000000-0000-4000-8000-000000000002',null),'Campaign authority rejects another Campaign');
select ok(not pulse_private.has_permission('users.view',null,null,'e8000000-0000-4000-8000-000000000002'),'Campaign authority rejects another Campaign Team');
select ok(not pulse_private.has_permission('users.view',null,null,'e8000000-0000-4000-8000-000000000003'),'Campaign authority rejects a campaign-null legacy Team');
select ok(not pulse_private.has_permission('users.view',null,'f8000000-0000-4000-8000-000000000001','e8000000-0000-4000-8000-000000000002'),'forged Campaign and Team context fails closed');
select ok(not pulse_private.has_permission('users.view',null,null,'e8000000-0000-4000-8000-000000000004'),'Campaign authority rejects an inactive Team');
update public.campaigns set is_active=false where id='f8000000-0000-4000-8000-000000000001';
select ok(not pulse_private.has_permission('users.view',null,'f8000000-0000-4000-8000-000000000001',null),'inactive Campaign makes stored Campaign authority ineffective');
select ok(exists(select 1 from public.user_roles where id='c8000000-0000-4000-8000-000000000004'),'inactive Campaign assignment remains historically stored');
update public.campaigns set is_active=true where id='f8000000-0000-4000-8000-000000000001';

-- Canonical assignment, grants, idempotency, removal, and audit.
select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000002',true);
select ok((select created from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000005','campaign',null,'f8000000-0000-4000-8000-000000000001',null)),'Admin may assign QA Campaign under an existing comparable grant');
select ok(not (select created from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000005','campaign',null,'f8000000-0000-4000-8000-000000000001',null)),'duplicate exact Campaign assignment is idempotent');
select ok((select created from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000004','campaign',null,'f8000000-0000-4000-8000-000000000002',null)),'Admin may assign Supervisor Campaign under existing comparable authority');
select throws_ok($$select * from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000002','campaign',null,'f8000000-0000-4000-8000-000000000001',null)$$,'23503',null,'unsupported Agent Campaign assignment is rejected');
select throws_ok($$select * from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000005','campaign',null,'f8000000-0000-4000-8000-000000000003',null)$$,'23503',null,'new assignment to inactive Campaign is rejected');
select throws_ok($$select * from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000005','campaign','d8000000-0000-4000-8000-000000000002','f8000000-0000-4000-8000-000000000001',null)$$,'23514',null,'assignment rejects mixed scope targets');
select throws_ok($$select * from public.assign_user_role('b8000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000005','campaign',null,'f8000000-0000-4000-8000-000000000001',null)$$,'42501',null,'self role mutation protection remains active');

select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.assign_user_role('b8000000-0000-4000-8000-000000000007','10000000-0000-0000-0000-000000000005','campaign',null,'f8000000-0000-4000-8000-000000000002',null)$$,'42501',null,'unauthorized grantor cannot assign Campaign authority');

select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000002',true);
select lives_ok($$select * from public.remove_user_role('b8000000-0000-4000-8000-000000000007',(select id from public.user_roles where user_id='b8000000-0000-4000-8000-000000000007' and role_id='10000000-0000-0000-0000-000000000005' and campaign_id='f8000000-0000-4000-8000-000000000001'))$$,'exact Campaign assignment can be removed');
select ok(not exists(select 1 from public.user_roles where user_id='b8000000-0000-4000-8000-000000000007' and role_id='10000000-0000-0000-0000-000000000005' and campaign_id='f8000000-0000-4000-8000-000000000001'),'removal deletes only the exact Campaign assignment');
select ok(exists(select 1 from public.user_roles where user_id='b8000000-0000-4000-8000-000000000007' and role_id='10000000-0000-0000-0000-000000000004' and campaign_id='f8000000-0000-4000-8000-000000000002'),'related Campaign assignment remains untouched');
select ok(exists(select 1 from public.audit_events where target_id='b8000000-0000-4000-8000-000000000007' and action='role.assigned' and metadata->>'campaign_id'='f8000000-0000-4000-8000-000000000001'),'Campaign assignment audit is backend-owned');
select ok(exists(select 1 from public.audit_events where target_id='b8000000-0000-4000-8000-000000000007' and action='role.removed' and metadata->>'campaign_id'='f8000000-0000-4000-8000-000000000001'),'Campaign removal audit is backend-owned');

-- Server-authoritative catalogs and parity.
select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.list_assignable_role_options('b8000000-0000-4000-8000-000000000008') where scope_type='campaign'),4::bigint,'assignable catalog returns QA and Supervisor for each active Campaign');
select ok(exists(select 1 from public.list_assignable_role_options('b8000000-0000-4000-8000-000000000008') where role_key='qa' and scope_type='campaign' and campaign_code='admin6b_garrett'),'assignable catalog resolves exact active Campaign identity');
select ok(not exists(select 1 from public.list_assignable_role_options('b8000000-0000-4000-8000-000000000008') where scope_type='campaign' and role_key not in ('qa','supervisor')),'assignable catalog omits unsupported Campaign roles');
select ok(not exists(select 1 from public.list_assignable_role_options('b8000000-0000-4000-8000-000000000008') where campaign_id='f8000000-0000-4000-8000-000000000003'),'assignable catalog omits inactive Campaigns');
select lives_ok($$
  do $parity$ declare option_row record; begin
    select * into option_row from public.list_assignable_role_options('b8000000-0000-4000-8000-000000000008') where role_key='qa' and scope_type='campaign' order by campaign_code limit 1;
    perform public.assign_user_role('b8000000-0000-4000-8000-000000000008',option_row.role_id,option_row.scope_type,option_row.department_id,option_row.campaign_id,option_row.team_id);
  end $parity$
$$,'every selected assignable Campaign option is accepted by the canonical mutation');

select is((select count(*) from public.get_pending_approval_options('b8000000-0000-4000-8000-000000000009') where scope_type='campaign' and department_id='d8000000-0000-4000-8000-000000000002' and team_id is null),4::bigint,'pending catalog separates Quality employment from four active Campaign authorization options');
select ok(exists(select 1 from public.get_pending_approval_options('b8000000-0000-4000-8000-000000000009') where role_key='qa' and scope_type='campaign' and campaign_code='admin6b_garrett' and department_code='admin6b_quality'),'pending catalog returns cross-department QA Campaign option');
select ok(not exists(select 1 from public.get_pending_approval_options('b8000000-0000-4000-8000-000000000009') where scope_type='campaign' and campaign_id='f8000000-0000-4000-8000-000000000003'),'pending catalog omits inactive Campaign');
select throws_ok($$select * from public.approve_pending_user('b8000000-0000-4000-8000-000000000009','d8000000-0000-4000-8000-000000000002',null,'[{"role_id":"10000000-0000-0000-0000-000000000005","scope_type":"campaign","campaign_id":"ffffffff-ffff-4fff-8fff-ffffffffffff"}]'::jsonb)$$,'23503',null,'pending approval rejects arbitrary Campaign ID');
select lives_ok($$
  do $parity$ declare option_row record; begin
    select * into option_row from public.get_pending_approval_options('b8000000-0000-4000-8000-000000000009') where department_id='d8000000-0000-4000-8000-000000000002' and team_id is null and role_key='qa' and scope_type='campaign' and campaign_code='admin6b_garrett' limit 1;
    perform public.approve_pending_user('b8000000-0000-4000-8000-000000000009',option_row.department_id,option_row.team_id,jsonb_build_array(jsonb_build_object('role_id',option_row.role_id,'scope_type',option_row.scope_type,'campaign_id',option_row.campaign_id)));
  end $parity$
$$,'pending Campaign option is accepted by approve_pending_user under unchanged state');
select ok(exists(select 1 from public.users where id='b8000000-0000-4000-8000-000000000009' and status='active' and department_id='d8000000-0000-4000-8000-000000000002' and team_id is null),'approval preserves independent employment placement');
select ok(exists(select 1 from public.user_roles where user_id='b8000000-0000-4000-8000-000000000009' and role_id='10000000-0000-0000-0000-000000000005' and scope_type='campaign' and campaign_id='f8000000-0000-4000-8000-000000000001' and department_id is null and team_id is null),'approval creates only the exact Campaign authorization assignment');
select ok(exists(select 1 from public.audit_events where target_id='b8000000-0000-4000-8000-000000000009' and action='account.approved'),'approval audit remains backend-owned');
select ok(exists(select 1 from public.audit_events where target_id='b8000000-0000-4000-8000-000000000009' and action='role.assigned' and metadata->>'campaign_id'='f8000000-0000-4000-8000-000000000001'),'approval Campaign role audit is exact');

-- Managed-user and safe audit projections.
select ok(exists(
  select 1 from public.list_managed_users(null) managed
  cross join lateral jsonb_array_elements(managed.roles) role
  where managed.id='b8000000-0000-4000-8000-000000000004'
    and role->>'scope_type'='campaign'
    and role->>'campaign_code'='admin6b_garrett'
    and role->>'campaign_name'='ADMIN-6B Garrett'
),'managed-user projection resolves Campaign scope safely');
select ok(not exists(
  select 1 from public.list_managed_users(null) managed
  cross join lateral jsonb_array_elements(managed.roles) role
  where role ? 'operational_assignment'
),'managed-user projection fabricates no operational assignment');
select ok(exists(
  select 1 from public.list_audit_events(requested_action=>'role.assigned',requested_target_type=>'user',requested_target_id=>'b8000000-0000-4000-8000-000000000009') event
  where event.scope_type='campaign' and event.safe_metadata->>'campaign_name'='ADMIN-6B Garrett' and event.safe_metadata->>'campaign_code'='admin6b_garrett'
),'audit projection resolves safe Campaign display fields');
select ok(not exists(
  select 1 from public.list_audit_events(requested_action=>'role.assigned',requested_target_type=>'user',requested_target_id=>'b8000000-0000-4000-8000-000000000009') event
  where event.safe_metadata ? 'campaign_id' or event.safe_metadata ? 'role_id'
),'audit projection does not expose arbitrary identifiers in metadata');

-- Direct security and function hardening.
select ok(has_function_privilege('authenticated','public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid)','EXECUTE'),'authenticated may invoke canonical Campaign assignment RPC');
select ok(not has_function_privilege('anon','public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid)','EXECUTE'),'anon cannot invoke Campaign assignment RPC');
select ok(not has_function_privilege('service_role','public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid)','EXECUTE'),'Campaign assignment needs no frontend service-role grant');
select is((select proowner::regrole::text from pg_proc where oid='public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid)'::regprocedure),'postgres','Campaign assignment RPC owner is postgres');
select ok((select prosecdef from pg_proc where oid='public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid)'::regprocedure),'Campaign assignment RPC is SECURITY DEFINER');
select is((select proconfig[1] from pg_proc where oid='public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid)'::regprocedure),'search_path=pg_catalog','Campaign assignment RPC fixes search_path');
select ok(not has_table_privilege('authenticated','public.user_roles','INSERT'),'browser cannot write protected role assignments directly');
select ok(not has_table_privilege('authenticated','public.role_scopes','INSERT'),'browser cannot broaden role scopes directly');
select ok(not has_table_privilege('authenticated','public.role_grant_rules','INSERT'),'browser cannot broaden grant rules directly');

set local role authenticated;
select set_config('request.jwt.claim.sub','a8000000-0000-4000-8000-000000000001',true);
select throws_ok($$insert into public.user_roles(user_id,role_id,scope_type,campaign_id) values ('b8000000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000005','campaign','f8000000-0000-4000-8000-000000000002')$$,'42501',null,'authenticated browser protected write is denied');
reset role;

select * from finish();
rollback;
