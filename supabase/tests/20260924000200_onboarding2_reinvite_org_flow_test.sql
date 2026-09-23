begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_column('public','staff_invitations','campaign_id','invitation stores operational Campaign separately');
select has_column('public','staff_invitations','operating_unit_id','invitation stores Operating Unit separately');
select has_column('public','staff_invitations','previous_invitation_id','new invitation can reference immutable terminal history');
select ok(has_function_privilege('authenticated','public.claim_staff_invitation_send_v2(text,text,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'only authenticated operators can reach the V2 claim boundary');
select ok(not has_function_privilege('anon','public.claim_staff_invitation_send_v2(text,text,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'anonymous callers cannot claim invitations');

insert into public.business_areas(id,code,name) values ('0b020000-0000-4000-8000-000000000001','onboarding2_ops','ONBOARDING-2 Operations');
insert into public.departments(id,business_area_id,code,name,is_active) values ('0d020000-0000-4000-8000-000000000001','0b020000-0000-4000-8000-000000000001','onboarding2_people','ONBOARDING-2 People',true);
insert into public.campaigns(id,business_area_id,code,name,is_active) values ('0c020000-0000-4000-8000-000000000001','0b020000-0000-4000-8000-000000000001','onboarding2_campaign','ONBOARDING-2 Campaign',true);
insert into public.operating_units(id,business_area_id,campaign_id,code,name,is_active) values ('0e020000-0000-4000-8000-000000000001','0b020000-0000-4000-8000-000000000001','0c020000-0000-4000-8000-000000000001','onboarding2_unit','ONBOARDING-2 Unit',true);
insert into public.teams(id,business_area_id,campaign_id,operating_unit_id,code,name,is_active) values ('0f020000-0000-4000-8000-000000000001','0b020000-0000-4000-8000-000000000001','0c020000-0000-4000-8000-000000000001','0e020000-0000-4000-8000-000000000001','onboarding2_team','ONBOARDING-2 Team',true);
insert into public.positions(id,code,name,is_active) values ('0a020000-0000-4000-8000-000000000001','onboarding2_agent','ONBOARDING-2 Agent',true);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('01020000-0000-4000-8000-000000000001','authenticated','authenticated','onboarding2.admin@example.test','',now(),'{}','{}',now(),now()),
 ('01020000-0000-4000-8000-000000000002','authenticated','authenticated','onboarding2.reinvite@example.test','',now(),'{}','{}',now(),now()),
 ('01020000-0000-4000-8000-000000000003','authenticated','authenticated','onboarding2.wrong@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at) values
 ('02020000-0000-4000-8000-000000000001','01020000-0000-4000-8000-000000000001','KK-922001','onboarding2.admin@example.test','ONBOARDING-2 Admin','active','0d020000-0000-4000-8000-000000000001',now()),
 ('02020000-0000-4000-8000-000000000002','01020000-0000-4000-8000-000000000002',null,'onboarding2.reinvite@example.test','ONBOARDING-2 Pending','pending_approval',null,null);
insert into public.user_roles(id,user_id,role_id,scope_type) values ('03020000-0000-4000-8000-000000000001','02020000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');

insert into public.staff_invitations(
 id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,campaign_id,operating_unit_id,team_id,position_id,
 role_id,scope_type,auth_user_id,request_key,sent_at,revoked_at
) values (
 '04020000-0000-4000-8000-000000000001','onboarding2.reinvite@example.test','Original Name','revoked',now()+interval '72 hours',
 '02020000-0000-4000-8000-000000000001','0d020000-0000-4000-8000-000000000001','0c020000-0000-4000-8000-000000000001',
 '0e020000-0000-4000-8000-000000000001','0f020000-0000-4000-8000-000000000001','0a020000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000001','global','01020000-0000-4000-8000-000000000002','05020000-0000-4000-8000-000000000001',now(),now()
);

select set_config('request.jwt.claim.sub','01020000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select ok((select delivery_required from public.claim_staff_invitation_send_v2(
 'onboarding2.reinvite@example.test','Reinvited Person','0d020000-0000-4000-8000-000000000001','0c020000-0000-4000-8000-000000000001',
 '0e020000-0000-4000-8000-000000000001','0f020000-0000-4000-8000-000000000001','0a020000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000001','global',null,null,null,'05020000-0000-4000-8000-000000000002','04020000-0000-4000-8000-000000000001'
)),'revoked invitation creates a new delivery claim');
select ok((select existing_auth_identity from public.claim_staff_invitation_send_v2(
 'onboarding2.reinvite@example.test','Reinvited Person','0d020000-0000-4000-8000-000000000001','0c020000-0000-4000-8000-000000000001',
 '0e020000-0000-4000-8000-000000000001','0f020000-0000-4000-8000-000000000001','0a020000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000001','global',null,null,null,'05020000-0000-4000-8000-000000000002','04020000-0000-4000-8000-000000000001'
)),'idempotent retry reports exact Auth identity reuse');
reset role;
select is((select count(*) from public.staff_invitations where email_normalized='onboarding2.reinvite@example.test'),2::bigint,'terminal history coexists with one new invitation');
select is((select full_name from public.staff_invitations where id='04020000-0000-4000-8000-000000000001'),'Original Name','revoked record remains immutable');
select is((select previous_invitation_id from public.staff_invitations where request_key='05020000-0000-4000-8000-000000000002'),'04020000-0000-4000-8000-000000000001'::uuid,'new invitation links to the prior terminal record');
set local role authenticated;
select throws_ok($$select * from public.claim_staff_invitation_send_v2(
 'onboarding2.reinvite@example.test','Duplicate','0d020000-0000-4000-8000-000000000001','0c020000-0000-4000-8000-000000000001',
 '0e020000-0000-4000-8000-000000000001','0f020000-0000-4000-8000-000000000001','0a020000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000001','global',null,null,null,'05020000-0000-4000-8000-000000000003',null
)$$,'23505',null,'a second active invitation for the email is denied');
reset role;
select ok(exists(select 1 from public.audit_events where target_type='staff_invitation' and action='staff_invitation.created' and metadata->>'previous_invitation_id'='04020000-0000-4000-8000-000000000001'),'re-invite creation audit retains safe lineage');

select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select throws_ok($$select public.complete_staff_invitation_delivery(
 (select id from public.staff_invitations where request_key='05020000-0000-4000-8000-000000000002'),
 (select delivery_claim_id from public.staff_invitations where request_key='05020000-0000-4000-8000-000000000002'),true,
 '01020000-0000-4000-8000-000000000003',null
)$$,'23514',null,'wrong Auth identity cannot complete delivery');
select ok(public.complete_staff_invitation_delivery(
 (select id from public.staff_invitations where request_key='05020000-0000-4000-8000-000000000002'),
 (select delivery_claim_id from public.staff_invitations where request_key='05020000-0000-4000-8000-000000000002'),true,
 '01020000-0000-4000-8000-000000000002',null
),'exact reconciled Auth identity completes delivery');
reset role;

select set_config('request.jwt.claim.sub','01020000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select ok((select accepted from public.accept_own_staff_invitation()),'correct identity accepts the new invitation');
reset role;
select is((select count(*) from auth.users where lower(email)='onboarding2.reinvite@example.test'),1::bigint,'re-invite creates no duplicate Auth user');
select ok(exists(select 1 from public.users where auth_user_id='01020000-0000-4000-8000-000000000002' and status='active' and department_id='0d020000-0000-4000-8000-000000000001' and team_id is null and position_id='0a020000-0000-4000-8000-000000000001'),'employment Department stays separate from operational Team');
select ok(exists(select 1 from public.user_operational_assignments where user_id='02020000-0000-4000-8000-000000000002' and campaign_id='0c020000-0000-4000-8000-000000000001' and team_id='0f020000-0000-4000-8000-000000000001' and position_id='0a020000-0000-4000-8000-000000000001' and is_primary),'accepted invitation creates the canonical operational placement');
select set_config('request.jwt.claim.sub','01020000-0000-4000-8000-000000000001',true);
set local role authenticated;
select throws_ok($$select * from public.claim_staff_invitation_send_v2(
 'onboarding2.reinvite@example.test','Active Again','0d020000-0000-4000-8000-000000000001',null,null,null,null,
 '10000000-0000-0000-0000-000000000001','global',null,null,null,'05020000-0000-4000-8000-000000000004',null
)$$,'23505',null,'accepted active Staff cannot be re-invited');
reset role;

select * from finish();
rollback;
