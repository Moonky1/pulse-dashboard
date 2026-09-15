begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public','staff_invitations','protected Staff invitation ledger exists');
select has_column('public','staff_invitations','position_id','invitation stores an optional proposed Position');
select ok(exists(select 1 from pg_class where oid='public.staff_invitations'::regclass and relrowsecurity),'Staff invitation RLS is enabled');
select is((select count(*) from public.role_permissions rp join public.roles r on r.id=rp.role_id join public.permissions p on p.id=rp.permission_id where p.key='users.invite'),3::bigint,'users.invite is granted to exactly three roles');
select results_eq(
  $$select r.key from public.role_permissions rp join public.roles r on r.id=rp.role_id join public.permissions p on p.id=rp.permission_id where p.key='users.invite' order by r.key$$,
  $$values ('admin'::text),('human_resources'::text),('super_admin'::text)$$,
  'users.invite belongs only to Admin, HR, and Super Admin'
);
select ok(has_function_privilege('authenticated','public.get_staff_invitation_options()','EXECUTE'),'authenticated may execute protected options');
select ok(not has_function_privilege('anon','public.get_staff_invitation_options()','EXECUTE'),'anon cannot execute protected options');
select ok(has_function_privilege('service_role','public.complete_staff_invitation_delivery(uuid,uuid,boolean,uuid,text)','EXECUTE'),'service role may complete delivery');
select ok(not has_function_privilege('authenticated','public.complete_staff_invitation_delivery(uuid,uuid,boolean,uuid,text)','EXECUTE'),'browser cannot complete delivery');

insert into public.departments(id,code,name,is_active) values
 ('da120000-0000-4000-8000-000000000001','auth12_people','AUTH-12 People',true),
 ('da120000-0000-4000-8000-000000000002','auth12_inactive','AUTH-12 Inactive',false);
insert into public.campaigns(id,code,name,is_active) values
 ('ca120000-0000-4000-8000-000000000001','auth12_campaign','AUTH-12 Campaign',true),
 ('ca120000-0000-4000-8000-000000000002','auth12_inactive_campaign','AUTH-12 Inactive Campaign',false);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('ea120000-0000-4000-8000-000000000001','da120000-0000-4000-8000-000000000001','ca120000-0000-4000-8000-000000000001','auth12_team','AUTH-12 Team',true),
 ('ea120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001',null,'auth12_inactive_team','AUTH-12 Inactive Team',false);
insert into public.positions(id,code,name,is_active) values
 ('fa120000-0000-4000-8000-000000000001','auth12_analyst','AUTH-12 Analyst',true),
 ('fa120000-0000-4000-8000-000000000002','auth12_inactive_position','AUTH-12 Inactive Position',false);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa120000-0000-4000-8000-000000000001','authenticated','authenticated','auth12.super@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000002','authenticated','authenticated','auth12.admin@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000003','authenticated','authenticated','auth12.employee@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000004','authenticated','authenticated','auth12.existing.active@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000005','authenticated','authenticated','auth12.existing.pending@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000006','authenticated','authenticated','auth12.existing.blocked@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000007','authenticated','authenticated','auth12.existing.inactive@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000008','authenticated','authenticated','auth12.blocked.operator@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000009','authenticated','authenticated','auth12.inactive.operator@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000010','authenticated','authenticated','auth12.scoped.operator@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at) values
 ('ba120000-0000-4000-8000-000000000001','aa120000-0000-4000-8000-000000000001','KK-912001','auth12.super@example.test','AUTH-12 Super','active','da120000-0000-4000-8000-000000000001',now()),
 ('ba120000-0000-4000-8000-000000000002','aa120000-0000-4000-8000-000000000002','KK-912002','auth12.admin@example.test','AUTH-12 Admin','active','da120000-0000-4000-8000-000000000001',now()),
 ('ba120000-0000-4000-8000-000000000003','aa120000-0000-4000-8000-000000000003','KK-912003','auth12.employee@example.test','AUTH-12 Employee','active','da120000-0000-4000-8000-000000000001',now()),
 ('ba120000-0000-4000-8000-000000000004','aa120000-0000-4000-8000-000000000004','KK-912004','auth12.existing.active@example.test','Existing Active','active','da120000-0000-4000-8000-000000000001',now()),
 ('ba120000-0000-4000-8000-000000000005','aa120000-0000-4000-8000-000000000005',null,'auth12.existing.pending@example.test','Existing Pending','pending_approval',null,null),
 ('ba120000-0000-4000-8000-000000000006','aa120000-0000-4000-8000-000000000006',null,'auth12.existing.blocked@example.test','Existing Blocked','blocked',null,null),
 ('ba120000-0000-4000-8000-000000000007','aa120000-0000-4000-8000-000000000007',null,'auth12.existing.inactive@example.test','Existing Inactive','inactive',null,null),
 ('ba120000-0000-4000-8000-000000000008','aa120000-0000-4000-8000-000000000008',null,'auth12.blocked.operator@example.test','Blocked Operator','blocked',null,null),
 ('ba120000-0000-4000-8000-000000000009','aa120000-0000-4000-8000-000000000009',null,'auth12.inactive.operator@example.test','Inactive Operator','inactive',null,null),
 ('ba120000-0000-4000-8000-000000000010','aa120000-0000-4000-8000-000000000010','KK-912010','auth12.scoped.operator@example.test','Scoped Operator','active','da120000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type,department_id) values
 ('ab120000-0000-4000-8000-000000000001','ba120000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global',null),
 ('ab120000-0000-4000-8000-000000000002','ba120000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000009','global',null),
 ('ab120000-0000-4000-8000-000000000003','ba120000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000001','global',null),
 ('ab120000-0000-4000-8000-000000000004','ba120000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000001','global',null),
 ('ab120000-0000-4000-8000-000000000005','ba120000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000009','global',null),
 ('ab120000-0000-4000-8000-000000000006','ba120000-0000-4000-8000-000000000009','10000000-0000-0000-0000-000000000009','global',null),
 ('ab120000-0000-4000-8000-000000000007','ba120000-0000-4000-8000-000000000010','10000000-0000-0000-0000-000000000004','department','da120000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000002',true);
set local role authenticated;
select ok(jsonb_array_length(public.get_staff_invitation_options()->'departments')=1,'options return only active Departments');
select ok(jsonb_array_length(public.get_staff_invitation_options()->'positions')=1,'options return only active Positions');
select ok(exists(select 1 from jsonb_array_elements(public.get_staff_invitation_options()->'role_options') o where o->>'role_key'='qa' and o->>'scope_type'='campaign' and o->>'campaign_name'='AUTH-12 Campaign'),'options include exact active Campaign scope');
select ok(not exists(select 1 from jsonb_array_elements(public.get_staff_invitation_options()->'role_options') o where o->>'role_key' in ('admin','super_admin')),'Admin cannot propose privileged roles');

select ok((select delivery_required from public.claim_staff_invitation_send(
 ' Invitee@Example.test ',' Invitee Person ','da120000-0000-4000-8000-000000000001',null,'fa120000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000005','campaign',null,'ca120000-0000-4000-8000-000000000001',null,'ac120000-0000-4000-8000-000000000001'
)),'authorized operator claims one exact invitation delivery');
select ok((select expires_at between now()+interval '71 hours 59 minutes' and now()+interval '72 hours 1 minute' from public.list_staff_invitations(null,50) where email='invitee@example.test'),'new invitation validity is server-owned at 72 hours');
select ok(not (select delivery_required from public.claim_staff_invitation_send(
 'invitee@example.test','Invitee Person','da120000-0000-4000-8000-000000000001',null,'fa120000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000005','campaign',null,'ca120000-0000-4000-8000-000000000001',null,'ac120000-0000-4000-8000-000000000001'
)),'same request key is idempotent and never claims a second delivery');
select throws_ok($$select * from public.claim_staff_invitation_send('invitee@example.test','Duplicate Person','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000002')$$,'23505',null,'different request cannot duplicate an active email');
select throws_ok($$select * from public.claim_staff_invitation_send('bad-email','Invalid Person','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000003')$$,'22023',null,'invalid email fails closed');
select throws_ok($$select * from public.claim_staff_invitation_send('inactive-dept@example.test','Inactive Dept','da120000-0000-4000-8000-000000000002',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000004')$$,'23503',null,'inactive Department is rejected');
select throws_ok($$select * from public.claim_staff_invitation_send('inactive-position@example.test','Inactive Position','da120000-0000-4000-8000-000000000001',null,'fa120000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000005')$$,'23503',null,'inactive Position is rejected');
select throws_ok($$select * from public.claim_staff_invitation_send('wrong-team@example.test','Wrong Team','da120000-0000-4000-8000-000000000001','ea120000-0000-4000-8000-000000000002',null,'10000000-0000-0000-0000-000000000002','team',null,null,'ea120000-0000-4000-8000-000000000002','ac120000-0000-4000-8000-000000000006')$$,'23503',null,'inactive Team is rejected');
select throws_ok($$select * from public.claim_staff_invitation_send('forged-scope@example.test','Forged Scope','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000005','department','da120000-0000-4000-8000-000000000002',null,null,'ac120000-0000-4000-8000-000000000007')$$,'23514',null,'forged Department scope is rejected');
select throws_ok($$select * from public.claim_staff_invitation_send('unsupported@example.test','Unsupported Role','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000002','global',null,null,null,'ac120000-0000-4000-8000-000000000008')$$,'42501',null,'unsupported role/scope is denied by canonical grant policy');
select throws_ok($$select * from public.claim_staff_invitation_send('auth12.existing.active@example.test','Existing Active','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000009')$$,'23505',null,'existing active Pulse identity cannot be invited');
select throws_ok($$select * from public.claim_staff_invitation_send('auth12.existing.pending@example.test','Existing Pending','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000010')$$,'23505',null,'existing pending identity cannot be invited');
select throws_ok($$select * from public.claim_staff_invitation_send('auth12.existing.blocked@example.test','Existing Blocked','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000011')$$,'23505',null,'existing blocked identity cannot be invited');
select throws_ok($$select * from public.claim_staff_invitation_send('auth12.existing.inactive@example.test','Existing Inactive','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000012')$$,'23505',null,'existing inactive identity cannot be invited');
select is((select invitation_status from public.list_staff_invitations(null,10) where email='invitee@example.test'),'pending_send','protected list resolves invitation state');

select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000003',true);
select throws_ok($$select public.get_staff_invitation_options()$$,'42501',null,'employee cannot read invitation catalog');
select throws_ok($$select * from public.claim_staff_invitation_send('denied@example.test','Denied Person','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000013')$$,'42501',null,'employee cannot invite Staff');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000008',true);
select throws_ok($$select * from public.claim_staff_invitation_send('blocked-operator@example.test','Blocked Attempt','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000015')$$,'42501',null,'blocked operator cannot use users.invite');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000009',true);
select throws_ok($$select * from public.claim_staff_invitation_send('inactive-operator@example.test','Inactive Attempt','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000016')$$,'42501',null,'inactive operator cannot use users.invite');
reset role;
insert into public.role_permissions(role_id,permission_id) values
 ('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000031'),
 ('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000036');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000010',true);
set local role authenticated;
select throws_ok($$select * from public.claim_staff_invitation_send('scoped-operator@example.test','Scoped Attempt','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000017')$$,'42501',null,'non-global permission assignments cannot invite Staff');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000003',true);
select throws_ok($$insert into public.staff_invitations(email_normalized,full_name,created_by_user_id,department_id,role_id,scope_type,request_key) values ('browser@example.test','Browser Write','ba120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000001','global','ac120000-0000-4000-8000-000000000014')$$,'42501',null,'authenticated browser cannot write invitation table');
select throws_ok($$select * from public.staff_invitations$$,'42501',null,'authenticated browser cannot read invitation table');

reset role;
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa120000-0000-4000-8000-000000000020','authenticated','authenticated','invitee@example.test','',now(),'{}','{"full_name":"Untrusted Browser Name"}',now(),now());
select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select ok(public.complete_staff_invitation_delivery(
 (select id from public.staff_invitations where email_normalized='invitee@example.test'),
 (select delivery_claim_id from public.staff_invitations where email_normalized='invitee@example.test'),true,
 'aa120000-0000-4000-8000-000000000020',null
),'service completes the exact claimed delivery');
reset role;
select is((select status from public.staff_invitations where email_normalized='invitee@example.test'),'sent','delivery completion transitions to sent');
select ok(exists(select 1 from public.audit_events e where e.target_id=(select id from public.staff_invitations where email_normalized='invitee@example.test') and e.action='staff_invitation.sent'),'sent transition is audited by trusted code');
select ok(not exists(select 1 from public.audit_events e where e.target_type='staff_invitation' and e.metadata::text ilike '%invitee@example.test%'),'invitation audits never contain email metadata');

select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000020',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select ok((select accepted from public.accept_own_staff_invitation()),'verified invited identity accepts once');
select ok(not (select accepted from public.accept_own_staff_invitation()),'acceptance retry is idempotent');
reset role;
select ok(exists(select 1 from public.users where auth_user_id='aa120000-0000-4000-8000-000000000020' and email='invitee@example.test' and full_name='Invitee Person' and status='active' and employee_id is not null and department_id='da120000-0000-4000-8000-000000000001' and team_id is null and position_id='fa120000-0000-4000-8000-000000000001'),'acceptance atomically activates the canonical profile with server-owned identity and employment');
select ok(exists(select 1 from public.user_roles ur join public.users u on u.id=ur.user_id where u.auth_user_id='aa120000-0000-4000-8000-000000000020' and ur.role_id='10000000-0000-0000-0000-000000000005' and ur.scope_type='campaign' and ur.department_id is null and ur.campaign_id='ca120000-0000-4000-8000-000000000001' and ur.team_id is null and ur.assigned_by_user_id='ba120000-0000-4000-8000-000000000002'),'acceptance applies the exact preauthorized role and Campaign scope');
select is((select count(*) from public.user_roles ur join public.users u on u.id=ur.user_id where u.auth_user_id='aa120000-0000-4000-8000-000000000020'),1::bigint,'acceptance retry creates no duplicate role');
select is((select status from public.staff_invitations where email_normalized='invitee@example.test'),'accepted','invitation transitions to accepted exactly once');
select ok(exists(select 1 from public.audit_events e where e.target_id=(select id from public.staff_invitations where email_normalized='invitee@example.test') and e.action='staff_invitation.accepted'),'acceptance is audited');
select is((select count(*) from public.audit_events e join public.users u on u.id=e.target_id where u.auth_user_id='aa120000-0000-4000-8000-000000000020' and e.action='account.approved'),1::bigint,'invitation activation writes one canonical approval audit');
select is((select count(*) from public.audit_events e join public.users u on u.id=e.target_id where u.auth_user_id='aa120000-0000-4000-8000-000000000020' and e.action='role.assigned'),1::bigint,'invitation activation writes one canonical role audit');

select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select * from public.claim_staff_invitation_resend((select invitation_id from public.list_staff_invitations(null,50) where email='invitee@example.test'),(select updated_at from public.list_staff_invitations(null,50) where email='invitee@example.test'),'ac120000-0000-4000-8000-000000000020')$$,'55000',null,'accepted invitation cannot be resent');

select ok((select delivery_required from public.claim_staff_invitation_send('failed@example.test','Failed Person','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000022')),'failure fixture claims delivery');
reset role;
select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select ok(public.complete_staff_invitation_delivery((select id from public.staff_invitations where email_normalized='failed@example.test'),(select delivery_claim_id from public.staff_invitations where email_normalized='failed@example.test'),false,null,'delivery_deferred'),'trusted delivery failure is recorded visibly');
reset role;
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select ok((select delivery_required from public.claim_staff_invitation_resend((select invitation_id from public.list_staff_invitations(null,50) where email='failed@example.test'),(select updated_at from public.list_staff_invitations(null,50) where email='failed@example.test'),'ac120000-0000-4000-8000-000000000023')),'failed delivery can be retried with a fresh claim');
select ok((select expires_at between now()+interval '71 hours 59 minutes' and now()+interval '72 hours 1 minute' from public.list_staff_invitations(null,50) where email='failed@example.test'),'resend renews validity from server time for 72 hours');
select ok(not (select delivery_required from public.claim_staff_invitation_resend((select invitation_id from public.list_staff_invitations(null,50) where email='failed@example.test'),(select updated_at from public.list_staff_invitations(null,50) where email='failed@example.test'),'ac120000-0000-4000-8000-000000000023')),'duplicate resend request is idempotent');

select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000002',true);
set local role authenticated;
select ok((select delivery_required from public.claim_staff_invitation_send('revoke@example.test','Revoke Person','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000021')),'second safe invitation is created');
select ok(public.revoke_staff_invitation(
 (select invitation_id from public.list_staff_invitations(null,50) where email='revoke@example.test'),
 (select updated_at from public.list_staff_invitations(null,50) where email='revoke@example.test')
),'authorized operator revokes exact invitation');
select throws_ok($$select public.revoke_staff_invitation((select invitation_id from public.list_staff_invitations(null,50) where email='revoke@example.test'),(select updated_at from public.list_staff_invitations(null,50) where email='revoke@example.test'))$$,'55000',null,'revoked invitation cannot be reused');
select ok(exists(select 1 from public.list_staff_invitations('revoked',50) where email='revoke@example.test' and not can_resend and not can_revoke),'revoked status exposes no further action');

reset role;
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa120000-0000-4000-8000-000000000021','authenticated','authenticated','revoke@example.test','',now(),'{}','{}',now(),now()),
 ('aa120000-0000-4000-8000-000000000022','authenticated','authenticated','wrong@example.test','',now(),'{}','{}',now(),now());
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000021',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select is_empty($$select * from public.accept_own_staff_invitation()$$,'revoked invitation cannot be accepted');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000022',true);
select is_empty($$select * from public.accept_own_staff_invitation()$$,'wrong authenticated email cannot claim another invitation');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.accept_own_staff_invitation()$$,'28000',null,'acceptance requires an authenticated identity');

reset role;
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000002',true);
set local role authenticated;
select ok((select delivery_required from public.claim_staff_invitation_send('expired@example.test','Expired Person','da120000-0000-4000-8000-000000000001',null,null,'10000000-0000-0000-0000-000000000001','global',null,null,null,'ac120000-0000-4000-8000-000000000024')),'expiry fixture claims delivery');
reset role;
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa120000-0000-4000-8000-000000000023','authenticated','authenticated','expired@example.test','',now(),'{}','{}',now(),now());
select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select ok(not public.complete_staff_invitation_delivery((select id from public.staff_invitations where email_normalized='expired@example.test'),'ffffffff-ffff-4fff-8fff-ffffffffffff',true,'aa120000-0000-4000-8000-000000000023',null),'wrong delivery claim cannot reconcile state');
select ok(public.complete_staff_invitation_delivery((select id from public.staff_invitations where email_normalized='expired@example.test'),(select delivery_claim_id from public.staff_invitations where email_normalized='expired@example.test'),true,'aa120000-0000-4000-8000-000000000023',null),'exact delivery claim reconciles state once');
reset role;
update public.staff_invitations set expires_at=now()-interval '1 minute' where email_normalized='expired@example.test';
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000023',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select is_empty($$select * from public.accept_own_staff_invitation()$$,'expired invitation cannot be accepted');
reset role;
select is((select status from public.staff_invitations where email_normalized='expired@example.test'),'expired','acceptance check records explicit expiry safely');

reset role;

-- A pre-existing pending profile can be activated by an invitation that was
-- legitimately issued before that profile appeared. Other lifecycle states
-- fail closed and are never replaced or reactivated.
insert into public.staff_invitations(
  id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,
  position_id,role_id,scope_type,auth_user_id,request_key,sent_at
) values
 ('dc120000-0000-4000-8000-000000000001','auth12.existing.pending@example.test','Existing Pending Invited','sent',now()+interval '72 hours','ba120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001','fa120000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000001','global','aa120000-0000-4000-8000-000000000005','bc120000-0000-4000-8000-000000000001',now()),
 ('dc120000-0000-4000-8000-000000000002','auth12.existing.active@example.test','Existing Active Invited','sent',now()+interval '72 hours','ba120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001',null,'10000000-0000-0000-0000-000000000001','global','aa120000-0000-4000-8000-000000000004','bc120000-0000-4000-8000-000000000002',now()),
 ('dc120000-0000-4000-8000-000000000003','auth12.existing.blocked@example.test','Existing Blocked Invited','sent',now()+interval '72 hours','ba120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001',null,'10000000-0000-0000-0000-000000000001','global','aa120000-0000-4000-8000-000000000006','bc120000-0000-4000-8000-000000000003',now()),
 ('dc120000-0000-4000-8000-000000000004','auth12.existing.inactive@example.test','Existing Inactive Invited','sent',now()+interval '72 hours','ba120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001',null,'10000000-0000-0000-0000-000000000001','global','aa120000-0000-4000-8000-000000000007','bc120000-0000-4000-8000-000000000004',now());

select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000005',true);
select ok((select accepted from public.accept_own_staff_invitation()),'same canonical pending profile may accept a valid preauthorized invitation');
reset role;
select is((select count(*) from public.users where auth_user_id='aa120000-0000-4000-8000-000000000005'),1::bigint,'pending acceptance creates no duplicate profile');
select ok(exists(select 1 from public.users where auth_user_id='aa120000-0000-4000-8000-000000000005' and status='active' and full_name='Existing Pending Invited' and department_id='da120000-0000-4000-8000-000000000001' and position_id='fa120000-0000-4000-8000-000000000001'),'pending profile receives the exact invitation package');

select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.accept_own_staff_invitation()$$,'55000',null,'active Staff cannot be replaced by an invitation');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000006',true);
select throws_ok($$select * from public.accept_own_staff_invitation()$$,'42501',null,'blocked Staff cannot be activated by an invitation');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000007',true);
select throws_ok($$select * from public.accept_own_staff_invitation()$$,'42501',null,'inactive Staff cannot be reactivated by an invitation');
reset role;
select ok(not exists(select 1 from public.staff_invitations where id in ('dc120000-0000-4000-8000-000000000002','dc120000-0000-4000-8000-000000000003','dc120000-0000-4000-8000-000000000004') and status='accepted'),'active, blocked, and inactive invitation fixtures remain unconsumed');

-- Provider-neutral uninvited registrations retain the ordinary pending path.
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa120000-0000-4000-8000-000000000025','authenticated','authenticated','auth12.uninvited.password@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Uninvited Password"}',now(),now()),
 ('aa120000-0000-4000-8000-000000000026','authenticated','authenticated','auth12.uninvited.google@example.test','',now(),'{"provider":"google","providers":["google"]}','{"full_name":"Uninvited Google"}',now(),now());
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000025',true);
select is((select status from public.create_pending_profile('Uninvited Password')),'pending_approval','uninvited email registration remains pending approval');
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000026',true);
select is((select status from public.create_pending_profile('Uninvited Google')),'pending_approval','uninvited first-time Google registration remains pending approval');
reset role;
select ok(not exists(select 1 from public.user_roles assignment join public.users target on target.id=assignment.user_id where target.auth_user_id in ('aa120000-0000-4000-8000-000000000025','aa120000-0000-4000-8000-000000000026')),'uninvited registrations receive no role assignment');

-- Revalidate the original inviter at acceptance time. Removing the inviter's
-- current users.invite permission converts the invitation into a safe,
-- reissue-required terminal state without partial activation.
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa120000-0000-4000-8000-000000000030','authenticated','authenticated','auth12.stale.inviter@example.test','',now(),'{}','{"full_name":"Stale Inviter Recipient"}',now(),now());
insert into public.staff_invitations(
  id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,
  role_id,scope_type,auth_user_id,request_key,sent_at
) values (
  'dc120000-0000-4000-8000-000000000030','auth12.stale.inviter@example.test','Stale Inviter Recipient','sent',now()+interval '72 hours',
  'ba120000-0000-4000-8000-000000000002','da120000-0000-4000-8000-000000000001',
  '10000000-0000-0000-0000-000000000001','global','aa120000-0000-4000-8000-000000000030','bc120000-0000-4000-8000-000000000030',now()
);
delete from public.role_permissions
where role_id='10000000-0000-0000-0000-000000000009'
  and permission_id='20000000-0000-0000-0000-000000000036';
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','aa120000-0000-4000-8000-000000000030',true);
select is((select status from public.accept_own_staff_invitation()),'reissue_required','stale inviter authority returns safe reissue guidance');
select is((select status from public.accept_own_staff_invitation()),'reissue_required','reissue-required acceptance retry remains stable');
reset role;
select is((select status from public.staff_invitations where id='dc120000-0000-4000-8000-000000000030'),'failed','stale inviter invitation fails closed');
select is((select failure_code from public.staff_invitations where id='dc120000-0000-4000-8000-000000000030'),'authorization_changed','stale inviter stores only a safe failure code');
select ok(exists(select 1 from public.users where auth_user_id='aa120000-0000-4000-8000-000000000030' and status='pending_approval' and department_id is null and team_id is null and position_id is null),'stale inviter denial leaves only a normal pending profile');
select ok(not exists(select 1 from public.user_roles assignment join public.users target on target.id=assignment.user_id where target.auth_user_id='aa120000-0000-4000-8000-000000000030'),'stale inviter denial applies no role');
select is((select count(*) from public.audit_events where target_id='dc120000-0000-4000-8000-000000000030' and action='staff_invitation.failed'),1::bigint,'stale inviter failure is audited exactly once');
insert into public.role_permissions(role_id,permission_id)
values('10000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000036');

select * from finish();
rollback;
