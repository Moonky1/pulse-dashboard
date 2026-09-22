begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public','business_areas','business areas are canonical entities');
select has_table('public','operating_units','operating units are canonical entities');
select has_column('public','departments','business_area_id','Departments may be placed under a business area');
select has_column('public','campaigns','business_area_id','Campaigns may be placed under a business area');
select has_column('public','teams','operating_unit_id','Teams may be placed under an operating unit');
select ok((select is_nullable='YES' from information_schema.columns where table_schema='public' and table_name='teams' and column_name='department_id'),'operational Teams do not require a fake employment Department');
select ok(exists(select 1 from public.permissions where key='business_catalog.view' and is_active),'business catalog read permission exists');
select ok(exists(select 1 from public.permissions where key='business_catalog.manage' and is_active),'business catalog mutation permission exists');
select ok(not has_table_privilege('authenticated','public.business_areas','SELECT'),'browser cannot read business area rows directly');
select ok(not has_table_privilege('authenticated','public.operating_units','INSERT'),'browser cannot insert operating units directly');
select ok(has_function_privilege('authenticated','public.list_business_catalog()','EXECUTE'),'authenticated operators may invoke the protected read projection');
select ok(has_function_privilege('authenticated','public.apply_org3a_business_catalog()','EXECUTE'),'authenticated operators may invoke the protected seed contract');
select ok(not has_function_privilege('anon','public.apply_org3a_business_catalog()','EXECUTE'),'anonymous callers cannot invoke the seed contract');
select ok(not has_function_privilege('service_role','public.apply_org3a_business_catalog()','EXECUTE'),'service role has no explicit seed-contract execution');
select is((select proowner::regrole::text from pg_proc where oid='public.apply_org3a_business_catalog()'::regprocedure),'postgres','seed contract owner is postgres');
select ok((select prosecdef from pg_proc where oid='public.apply_org3a_business_catalog()'::regprocedure),'seed contract is SECURITY DEFINER');
select is((select proconfig[1] from pg_proc where oid='public.apply_org3a_business_catalog()'::regprocedure),'search_path=pg_catalog','seed contract fixes search_path');

insert into public.departments(id,code,name,is_active)
values ('d2200000-0000-4000-8000-000000000001','corporate','Corporate',true);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a2200000-0000-4000-8000-000000000001','authenticated','authenticated','org3a.super@example.test','',now(),'{}','{}',now(),now()),
 ('a2200000-0000-4000-8000-000000000002','authenticated','authenticated','org3a.denied@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values
 ('b2200000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000001','KK-922001','org3a.super@example.test','ORG-3A Super','active','d2200000-0000-4000-8000-000000000001',now()),
 ('b2200000-0000-4000-8000-000000000002','a2200000-0000-4000-8000-000000000002','KK-922002','org3a.denied@example.test','ORG-3A Denied','active','d2200000-0000-4000-8000-000000000001',now());

insert into public.roles(id,key,name,is_system,is_active)
values ('12200000-0000-4000-8000-000000000001','org3a_denied','ORG-3A Denied',false,true);
insert into public.role_scopes(role_id,scope_type)
values ('12200000-0000-4000-8000-000000000001','global');
insert into public.role_permissions(role_id,permission_id)
select '12200000-0000-4000-8000-000000000001',id from public.permissions where key='admin.access';
insert into public.user_roles(id,user_id,role_id,scope_type)
values
 ('c2200000-0000-4000-8000-000000000001','b2200000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
 ('c2200000-0000-4000-8000-000000000002','b2200000-0000-4000-8000-000000000002','12200000-0000-4000-8000-000000000001','global');

select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.list_business_catalog()$$,'28000',null,'anonymous catalog reads are rejected');
select throws_ok($$select public.apply_org3a_business_catalog()$$,'28000',null,'anonymous catalog mutations are rejected');

select set_config('request.jwt.claim.sub','a2200000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.list_business_catalog()$$,'42501',null,'operator without catalog view is rejected');
select throws_ok($$select public.apply_org3a_business_catalog()$$,'42501',null,'operator without catalog manage is rejected');

create temporary table org3a_before as
select
  (select count(*) from public.users) users,
  (select count(*) from public.user_roles) user_roles,
  (select count(*) from public.user_operational_assignments) assignments,
  (select count(*) from public.training_content) training_contents,
  (select count(*) from public.go_sessions) go_rooms;

select set_config('request.jwt.claim.sub','a2200000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.apply_org3a_business_catalog()$$,'Super Admin may apply the approved catalog');
select is((select count(*) from public.business_areas where code in ('corporate','operations')),2::bigint,'two approved business areas exist');
select is((select count(*) from public.departments where code in ('corporate','human_resources','legal','accounting','quality_assurance','customer_service')),6::bigint,'approved Departments exist and Corporate is preserved');
select is((select count(*) from public.campaigns where code in ('auto_warranty_garrett','auto_warranty_joe')),2::bigint,'two approved Campaigns exist');
select is((select count(*) from public.operating_units),5::bigint,'five approved Campaign operating units exist');
select is((select count(*) from public.teams where id::text like '34000000-0000-4000-8000-%'),24::bigint,'twenty-four approved Teams/functions exist');
select is((select count(*) from public.positions where id::text like '35000000-0000-4000-8000-%'),12::bigint,'twelve approved Positions exist');
select ok(not exists(select 1 from public.positions where code='support'),'generic Support Position remains deliberately held');
select ok(exists(select 1 from public.departments where code='corporate' and business_area_id=(select id from public.business_areas where code='corporate')),'historical Corporate Department is linked without replacement');
select ok(exists(select 1 from public.teams where code='administrative_support' and department_id is null and campaign_id is null),'Administrative Support is a Corporate function, not a Department');
select ok(exists(select 1 from public.teams where code='dialer_management' and department_id is null and campaign_id is null),'Dialer Management is an Operations function, not a Department');
select ok(exists(
  select 1 from public.teams team
  join public.operating_units unit on unit.id=team.operating_unit_id
  join public.campaigns campaign on campaign.id=team.campaign_id
  where campaign.code='auto_warranty_garrett' and unit.code='openers' and team.code='asia_team_a'
),'Garrett Openers hierarchy is canonical');
select ok(exists(
  select 1 from public.teams team
  join public.campaigns campaign on campaign.id=team.campaign_id
  where campaign.code='auto_warranty_joe' and team.code='latam' and team.operating_unit_id is null
),'Joe LATAM is a direct Campaign Team');

select is((select users from org3a_before),(select count(*) from public.users),'seed does not create or modify Staff rows');
select is((select user_roles from org3a_before),(select count(*) from public.user_roles),'seed does not create role assignments');
select is((select assignments from org3a_before),(select count(*) from public.user_operational_assignments),'seed does not create operational assignments');
select is((select training_contents from org3a_before),(select count(*) from public.training_content),'seed does not mutate Training content');
select is((select go_rooms from org3a_before),(select count(*) from public.go_sessions),'seed does not mutate GO rooms');
select is((select count(*) from public.audit_events where action='business_catalog.applied'),1::bigint,'first seed creates one meaningful audit event');

select lives_ok($$select public.apply_org3a_business_catalog()$$,'approved catalog is rerunnable');
select is((select count(*) from public.audit_events where action='business_catalog.applied'),1::bigint,'idempotent rerun creates no audit spam');
select is((public.apply_org3a_business_catalog()->>'changed_rows')::integer,0,'third application reports no catalog delta');

select is((public.list_business_catalog()->>'catalog_version'),'org-3a-2026-09','protected projection exposes the canonical version');
select is(jsonb_array_length(public.list_business_catalog()->'campaigns'),2,'protected projection exposes both Campaigns');
select ok(exists(
  select 1 from public.get_staff_invitation_options() options
  where jsonb_array_length(options->'departments')=6
    and jsonb_array_length(options->'positions')=12
),'AUTH-12 options consume approved Departments and Positions without sending invitations');
select ok(exists(
  select 1 from public.training_content_position_targets target right join public.positions position on position.id=target.position_id
  where position.code='qa_analyst'
),'Training Position targeting references the canonical Position catalog');
select ok(exists(
  select 1 from public.teams team join public.campaigns campaign on campaign.id=team.campaign_id
  where campaign.code='auto_warranty_garrett' and team.code='asia_team_a'
),'Training Campaign/Team targeting can resolve the canonical relationship');

select throws_ok(
  $$insert into public.operating_units(business_area_id,campaign_id,code,name) values ((select id from public.business_areas where code='corporate'),(select id from public.campaigns where code='auto_warranty_garrett'),'bad_unit','Bad Unit')$$,
  '23514',null,'cross-area operating units are rejected'
);
select throws_ok(
  $$insert into public.teams(business_area_id,campaign_id,operating_unit_id,code,name) values ((select id from public.business_areas where code='operations'),(select id from public.campaigns where code='auto_warranty_joe'),(select id from public.operating_units where code='openers' and campaign_id=(select id from public.campaigns where code='auto_warranty_garrett')),'bad_team','Bad Team')$$,
  '23514',null,'cross-Campaign Team/unit links are rejected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','a2200000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.business_areas$$,'42501',null,'authenticated browser cannot bypass the business catalog RPC');
select throws_ok($$insert into public.operating_units(business_area_id,code,name) values ('30000000-0000-4000-8000-000000000001','browser_unit','Browser Unit')$$,'42501',null,'authenticated browser cannot write operating units directly');
reset role;

select * from finish();
rollback;
