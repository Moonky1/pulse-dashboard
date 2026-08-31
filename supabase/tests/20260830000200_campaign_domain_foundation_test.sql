begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public','campaigns','campaign catalog exists');
select has_column('public','teams','campaign_id','teams expose an optional campaign relationship');
select ok(not exists(
  select 1 from information_schema.columns
  where table_schema='public' and table_name='campaigns' and column_name='department_id'
),'campaign identity is independent from employment departments');
select ok((select is_nullable='YES' from information_schema.columns where table_schema='public' and table_name='teams' and column_name='campaign_id'),'team campaign relationship is transitional and nullable');
select ok(exists(
  select 1 from pg_constraint
  where conname='teams_campaign_fk'
    and confdeltype='r'
    and confupdtype='r'
),'team campaign relationship restricts destructive parent changes');
select ok(exists(select 1 from public.permissions where key='campaigns.view' and is_active),'campaigns.view is canonical and active');
select ok(exists(select 1 from public.permissions where key='campaigns.manage' and is_active),'campaigns.manage is canonical and active');
select ok(exists(
  select 1 from public.role_permissions role_permission
  join public.roles role on role.id=role_permission.role_id
  join public.permissions permission on permission.id=role_permission.permission_id
  where role.key='super_admin' and permission.key='campaigns.view'
),'Super Admin receives campaign read authority');
select ok(exists(
  select 1 from public.role_permissions role_permission
  join public.roles role on role.id=role_permission.role_id
  join public.permissions permission on permission.id=role_permission.permission_id
  where role.key='super_admin' and permission.key='campaigns.manage'
),'Super Admin receives reserved campaign management authority');
select throws_ok(
  $$insert into public.role_scopes(role_id,scope_type) values ('10000000-0000-0000-0000-000000000010','campaign')$$,
  '23514',null,'campaign authorization scope is not partially activated'
);

insert into public.departments(id,code,name,is_active)
values ('d7000000-0000-4000-8000-000000000001','admin6_department','ADMIN-6 Department',true);

insert into public.campaigns(id,code,name,description,is_active,created_at,updated_at)
values
 ('f7000000-0000-4000-8000-000000000001','admin6_primary','ADMIN-6 Primary','Primary local fixture',true,'2020-01-01T00:00:00Z','2020-01-01T00:00:00Z'),
 ('f7000000-0000-4000-8000-000000000002','admin6_inactive','ADMIN-6 Inactive',null,false,now(),now());

insert into public.teams(id,department_id,campaign_id,code,name,is_active)
values
 ('e7000000-0000-4000-8000-000000000001','d7000000-0000-4000-8000-000000000001','f7000000-0000-4000-8000-000000000001','admin6_active','ADMIN-6 Active Team',true),
 ('e7000000-0000-4000-8000-000000000002','d7000000-0000-4000-8000-000000000001','f7000000-0000-4000-8000-000000000001','admin6_inactive','ADMIN-6 Inactive Team',false),
 ('e7000000-0000-4000-8000-000000000003','d7000000-0000-4000-8000-000000000001',null,'admin6_unlinked','ADMIN-6 Unlinked Team',true);

select throws_ok(
  $$insert into public.campaigns(code,name) values ('Bad Code','Valid Campaign')$$,
  '23514',null,'campaign code normalization is enforced'
);
select throws_ok(
  $$insert into public.campaigns(code,name) values ('admin6_duplicate','ADMIN-6 Primary')$$,
  '23505',null,'campaign names are case-insensitively unique'
);
select throws_ok(
  $$insert into public.campaigns(code,name) values ('admin6_primary','Different Campaign')$$,
  '23505',null,'campaign codes are unique'
);
select throws_ok(
  $$insert into public.campaigns(code,name) values ('admin6_blank',' ')$$,
  '23514',null,'blank campaign names are rejected'
);
select throws_ok(
  $$delete from public.campaigns where id='f7000000-0000-4000-8000-000000000001'$$,
  '23503',null,'a campaign referenced by teams cannot be deleted'
);
select lives_ok(
  $$update public.campaigns set description='Updated local fixture' where id='f7000000-0000-4000-8000-000000000001'$$,
  'campaign descriptive fields can be updated locally'
);
select ok((select updated_at > '2020-01-01T00:00:00Z' from public.campaigns where id='f7000000-0000-4000-8000-000000000001'),'campaign update timestamp is database-owned');
select throws_ok(
  $$update public.campaigns set created_at=now() where id='f7000000-0000-4000-8000-000000000001'$$,
  'P0001',null,'campaign creation timestamp is immutable'
);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a7000000-0000-4000-8000-000000000001','authenticated','authenticated','campaign.super@example.test','',now(),'{}','{}',now(),now()),
 ('a7000000-0000-4000-8000-000000000002','authenticated','authenticated','campaign.viewer@example.test','',now(),'{}','{}',now(),now()),
 ('a7000000-0000-4000-8000-000000000003','authenticated','authenticated','campaign.denied@example.test','',now(),'{}','{}',now(),now()),
 ('a7000000-0000-4000-8000-000000000004','authenticated','authenticated','campaign.inactive@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b7000000-0000-4000-8000-000000000001','a7000000-0000-4000-8000-000000000001','KK-970001','campaign.super@example.test','Campaign Super','active',now()),
 ('b7000000-0000-4000-8000-000000000002','a7000000-0000-4000-8000-000000000002','KK-970002','campaign.viewer@example.test','Campaign Viewer','active',now()),
 ('b7000000-0000-4000-8000-000000000003','a7000000-0000-4000-8000-000000000003','KK-970003','campaign.denied@example.test','Campaign Denied','active',now()),
 ('b7000000-0000-4000-8000-000000000004','a7000000-0000-4000-8000-000000000004','KK-970004','campaign.inactive@example.test','Campaign Inactive','inactive',now());

insert into public.roles(id,key,name,is_system,is_active)
values
 ('17000000-0000-4000-8000-000000000001','admin6_campaign_viewer','ADMIN-6 Campaign Viewer',false,true),
 ('17000000-0000-4000-8000-000000000002','admin6_campaign_denied','ADMIN-6 Campaign Denied',false,true);
insert into public.role_scopes(role_id,scope_type)
values
 ('17000000-0000-4000-8000-000000000001','global'),
 ('17000000-0000-4000-8000-000000000002','global');
insert into public.role_permissions(role_id,permission_id)
select '17000000-0000-4000-8000-000000000001',id from public.permissions where key in ('admin.access','campaigns.view');
insert into public.role_permissions(role_id,permission_id)
select '17000000-0000-4000-8000-000000000002',id from public.permissions where key='admin.access';
insert into public.user_roles(id,user_id,role_id,scope_type)
values
 ('c7000000-0000-4000-8000-000000000001','b7000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
 ('c7000000-0000-4000-8000-000000000002','b7000000-0000-4000-8000-000000000002','17000000-0000-4000-8000-000000000001','global'),
 ('c7000000-0000-4000-8000-000000000003','b7000000-0000-4000-8000-000000000003','17000000-0000-4000-8000-000000000002','global'),
 ('c7000000-0000-4000-8000-000000000004','b7000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000010','global');

select ok(not has_table_privilege('authenticated','public.campaigns','SELECT'),'browser has no direct campaign-table read');
select ok(not has_table_privilege('authenticated','public.campaigns','INSERT'),'browser has no direct campaign-table mutation');
select ok(has_function_privilege('authenticated','public.list_managed_campaigns()','EXECUTE'),'authenticated may invoke the protected campaign list');
select ok(not has_function_privilege('anon','public.list_managed_campaigns()','EXECUTE'),'anon cannot invoke the campaign list');
select ok(not has_function_privilege('service_role','public.list_managed_campaigns()','EXECUTE'),'service_role has no explicit campaign RPC execution');
select is((select proowner::regrole::text from pg_proc where oid='public.list_managed_campaigns()'::regprocedure),'postgres','campaign RPC owner is postgres');
select ok((select prosecdef from pg_proc where oid='public.list_managed_campaigns()'::regprocedure),'campaign RPC is SECURITY DEFINER');
select is((select proconfig[1] from pg_proc where oid='public.list_managed_campaigns()'::regprocedure),'search_path=pg_catalog','campaign RPC fixes search_path');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.list_managed_campaigns()$$,'28000',null,'anonymous JWT context is rejected');

select set_config('request.jwt.claim.sub','a7000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.list_managed_campaigns()$$,'42501',null,'missing campaigns.view is rejected');

select set_config('request.jwt.claim.sub','a7000000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.list_managed_campaigns()$$,'42501',null,'inactive operators are rejected');

select set_config('request.jwt.claim.sub','a7000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.list_managed_campaigns()),2::bigint,'campaign viewer receives the protected catalog');
select ok(exists(select 1 from public.list_managed_campaigns() where code='admin6_primary' and team_count=2 and active_team_count=1),'campaign team counts are resolved server-side');
select is((select name from public.list_managed_campaigns() limit 1),'ADMIN-6 Inactive','campaign catalog has stable name ordering');

select set_config('request.jwt.claim.sub','a7000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.list_managed_campaigns()),2::bigint,'Super Admin may read campaigns through canonical permissions');
select is((select count(*) from public.audit_events where target_type='campaign'),0::bigint,'campaign reads create no audit side effects');

set local role authenticated;
select set_config('request.jwt.claim.sub','a7000000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.campaigns$$,'42501',null,'authenticated browser cannot bypass the campaign RPC');
select throws_ok($$insert into public.campaigns(code,name) values ('browser_denied','Browser Denied')$$,'42501',null,'authenticated browser cannot insert campaigns');
select throws_ok($$update public.campaigns set name='Browser Tamper'$$,'42501',null,'authenticated browser cannot update campaigns');
select throws_ok($$delete from public.campaigns$$,'42501',null,'authenticated browser cannot delete campaigns');
reset role;

select * from finish();
rollback;
