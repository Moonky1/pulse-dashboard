begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config('search_path','public,'||(select extnamespace::regnamespace::text from pg_extension where extname='pgtap')||',pg_catalog',true);
select extensions.no_plan();

select extensions.has_column('public','users','pulse_joined_on','Staff has one canonical Joined Pulse date');
select extensions.col_type_is('public','users','pulse_joined_on','date','Joined Pulse uses DATE semantics');
select extensions.ok(has_function_privilege('authenticated','public.set_staff_pulse_joined_on(uuid,date)','EXECUTE'),'authenticated operators can reach the protected correction contract');
select extensions.ok(not has_function_privilege('anon','public.set_staff_pulse_joined_on(uuid,date)','EXECUTE'),'anonymous callers cannot edit Joined Pulse');
select extensions.ok(not has_function_privilege('service_role','public.set_staff_pulse_joined_on(uuid,date)','EXECUTE'),'service role has no explicit Joined Pulse edit grant');
select extensions.ok((select prosecdef from pg_proc where oid='public.set_staff_pulse_joined_on(uuid,date)'::regprocedure),'manual correction is SECURITY DEFINER');
select extensions.is((select proconfig[1] from pg_proc where oid='public.set_staff_pulse_joined_on(uuid,date)'::regprocedure),'search_path=pg_catalog','manual correction fixes search_path');
select extensions.ok(exists(select 1 from pg_trigger where tgrelid='public.users'::regclass and tgname='users_enforce_pulse_joined_on' and tgenabled<>'D'),'automatic assignment trigger is active');

insert into public.departments(id,code,name,is_active)
values ('d2400000-0000-4000-8000-000000000041','date1_certification','DATE-1 Certification',true);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a2400000-0000-4000-8000-000000000041','authenticated','authenticated','date1.admin@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000042','authenticated','authenticated','date1.approval@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000043','authenticated','authenticated','date1.invitation@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000044','authenticated','authenticated','date1.denied@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000045','authenticated','authenticated','date1.history@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000046','authenticated','authenticated','date1.pending@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at,pulse_joined_on)
values
 ('b2400000-0000-4000-8000-000000000041','a2400000-0000-4000-8000-000000000041','KK-924041','date1.admin@example.test','DATE-1 Admin','active','d2400000-0000-4000-8000-000000000041',now(),null),
 ('b2400000-0000-4000-8000-000000000042','a2400000-0000-4000-8000-000000000042',null,'date1.approval@example.test','DATE-1 Approval','pending_approval',null,null,null),
 ('b2400000-0000-4000-8000-000000000043','a2400000-0000-4000-8000-000000000043',null,'date1.invitation@example.test','DATE-1 Invitation','pending_approval',null,null,null),
 ('b2400000-0000-4000-8000-000000000044','a2400000-0000-4000-8000-000000000044','KK-924044','date1.denied@example.test','DATE-1 Denied','active','d2400000-0000-4000-8000-000000000041',now(),null),
 ('b2400000-0000-4000-8000-000000000045','a2400000-0000-4000-8000-000000000045',null,'date1.history@example.test','DATE-1 History','pending_approval',null,null,'2024-02-12'),
 ('b2400000-0000-4000-8000-000000000046','a2400000-0000-4000-8000-000000000046',null,'date1.pending@example.test','DATE-1 Pending','pending_approval',null,null,null);

insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values
 ('c2400000-0000-4000-8000-000000000041','b2400000-0000-4000-8000-000000000041','10000000-0000-0000-0000-000000000010','global','b2400000-0000-4000-8000-000000000041'),
 ('c2400000-0000-4000-8000-000000000044','b2400000-0000-4000-8000-000000000044','10000000-0000-0000-0000-000000000001','global','b2400000-0000-4000-8000-000000000041');

select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000041',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select extensions.lives_ok(
  $$select * from public.approve_pending_user(
    'b2400000-0000-4000-8000-000000000042',
    'd2400000-0000-4000-8000-000000000041',
    null,
    '[{"role_id":"10000000-0000-0000-0000-000000000001","scope_type":"global"}]'::jsonb
  )$$,
  'normal approval succeeds through the existing protected path'
);
reset role;
set local role postgres;
select extensions.is((select pulse_joined_on from public.users where id='b2400000-0000-4000-8000-000000000042'),current_date,'normal approval assigns current Joined Pulse when null');

select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000041',true);
set local role authenticated;
select extensions.lives_ok(
  $$select * from public.approve_pending_user(
    'b2400000-0000-4000-8000-000000000045',
    'd2400000-0000-4000-8000-000000000041',
    null,
    '[{"role_id":"10000000-0000-0000-0000-000000000001","scope_type":"global"}]'::jsonb
  )$$,
  'a beta-era pending profile can follow the normal activation path'
);
reset role;
set local role postgres;
select extensions.is((select pulse_joined_on from public.users where id='b2400000-0000-4000-8000-000000000045'),'2024-02-12'::date,'activation preserves an existing historical Joined Pulse value');

insert into public.staff_invitations(
  id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,
  role_id,scope_type,auth_user_id,request_key,sent_at
) values (
  'd2400000-0000-4000-8000-000000000043','date1.invitation@example.test','DATE-1 Invitation','sent',now()+interval '72 hours',
  'b2400000-0000-4000-8000-000000000041','d2400000-0000-4000-8000-000000000041',
  '10000000-0000-0000-0000-000000000001','global','a2400000-0000-4000-8000-000000000043',
  'e2400000-0000-4000-8000-000000000043',now()
);
select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000043',true);
set local role authenticated;
select extensions.ok((select accepted from public.accept_own_staff_invitation()),'preauthorized invitation acceptance succeeds');
reset role;
set local role postgres;
select extensions.is((select pulse_joined_on from public.users where id='b2400000-0000-4000-8000-000000000043'),current_date,'invitation acceptance assigns current Joined Pulse when null');

select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000041',true);
set local role authenticated;
select extensions.is((select changed from public.set_staff_pulse_joined_on('b2400000-0000-4000-8000-000000000042','2025-06-15')),true,'authorized historical correction succeeds');
select extensions.is((select changed from public.set_staff_pulse_joined_on('b2400000-0000-4000-8000-000000000042','2025-06-15')),false,'repeating the same date is idempotent');
select extensions.throws_ok($$select * from public.set_staff_pulse_joined_on('b2400000-0000-4000-8000-000000000042',current_date+1)$$,'22023',null,'future date is denied');
select extensions.throws_ok($$select * from public.set_staff_pulse_joined_on('b2400000-0000-4000-8000-000000000042',null)$$,'22023',null,'missing date is denied');
select extensions.throws_ok($$select * from public.set_staff_pulse_joined_on('b2499999-0000-4000-8000-000000000099','2025-06-15')$$,'P0002',null,'unknown target is denied');
select extensions.throws_ok($$select * from public.set_staff_pulse_joined_on('b2400000-0000-4000-8000-000000000046','2025-06-15')$$,'55000',null,'pending identity is not treated as joined Staff');
select extensions.is((select pulse_joined_on from public.get_managed_user('b2400000-0000-4000-8000-000000000042')),'2025-06-15'::date,'protected Staff profile returns Joined Pulse');
reset role;
set local role postgres;
select extensions.is((select count(*) from public.audit_events where target_id='b2400000-0000-4000-8000-000000000042' and action='account.joined_pulse_updated'),1::bigint,'manual correction writes one truthful event without retry spam');

select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000044',true);
set local role authenticated;
select extensions.throws_ok($$select * from public.set_staff_pulse_joined_on('b2400000-0000-4000-8000-000000000042','2025-01-01')$$,'42501',null,'operator without users.manage is denied');
select extensions.throws_ok($$update public.users set pulse_joined_on='2025-01-01' where id='b2400000-0000-4000-8000-000000000042'$$,'42501',null,'browser direct table mutation is denied');
reset role;
set local role postgres;

select extensions.throws_ok($$update public.users set pulse_joined_on=current_date+1 where id='b2400000-0000-4000-8000-000000000042'$$,'22023',null,'canonical trigger rejects future dates even on a privileged path');

select * from extensions.finish();
rollback;
