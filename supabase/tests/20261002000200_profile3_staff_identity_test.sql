begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config('search_path', 'extensions, public', true);
select extensions.plan(19);

select extensions.has_column('public','users','profile_bio','optional bio exists');
select extensions.has_column('public','users','profile_presence','optional presence exists');
select extensions.has_column('public','users','profile_visible_to_staff','Staff visibility choice exists');
select extensions.ok(not has_table_privilege('authenticated','public.users','UPDATE'),'browser has no direct Staff update permission');
select extensions.ok(has_function_privilege('authenticated','public.update_own_staff_profile(text,text,text,boolean)','EXECUTE'),'Staff can call own-profile contract');
select extensions.ok(not has_function_privilege('anon','public.update_own_staff_profile(text,text,text,boolean)','EXECUTE'),'anonymous caller cannot update profile');
select extensions.ok(not has_function_privilege('anon','public.get_staff_public_profile(uuid)','EXECUTE'),'anonymous caller cannot fetch Staff profile');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a3020000-0000-4000-8000-000000000001','authenticated','authenticated','profile3.one@example.test','',now(),'{}','{}',now(),now()),
 ('a3020000-0000-4000-8000-000000000002','authenticated','authenticated','profile3.two@example.test','',now(),'{}','{}',now(),now()),
 ('a3020000-0000-4000-8000-000000000003','authenticated','authenticated','profile3.inactive@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b3020000-0000-4000-8000-000000000001','a3020000-0000-4000-8000-000000000001','KK-930201','profile3.one@example.test','Fictional One','active',now()),
 ('b3020000-0000-4000-8000-000000000002','a3020000-0000-4000-8000-000000000002','KK-930202','profile3.two@example.test','Fictional Two','active',now()),
 ('b3020000-0000-4000-8000-000000000003','a3020000-0000-4000-8000-000000000003','KK-930203','profile3.inactive@example.test','Fictional Inactive','inactive',now());

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a3020000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.get_staff_public_profile('b3020000-0000-4000-8000-000000000001')),0,'private profile is hidden from active Staff');
select extensions.ok(not pulse_private.can_read_staff_avatar('b3020000-0000-4000-8000-000000000001'),'private custom avatar remains hidden');
select extensions.throws_ok($$update public.users set display_name='Impersonated' where id='b3020000-0000-4000-8000-000000000001'$$,'42501',null,'direct update cannot impersonate another Staff member');

select set_config('request.jwt.claim.sub','a3020000-0000-4000-8000-000000000001',true);
select extensions.is((select display_name from public.update_own_staff_profile('  One  ','  Hello teammates  ','focused',true)),'One','caller can set own display name');
select extensions.is((select profile_bio from public.users where id='b3020000-0000-4000-8000-000000000001'),'Hello teammates','bio is trimmed and stored on caller only');
set local role postgres;
select extensions.is((select display_name from public.users where id='b3020000-0000-4000-8000-000000000002'),null,'other Staff display name is unchanged');
set local role authenticated;
select extensions.throws_ok($$select * from public.update_own_staff_profile('x',null,null,true)$$,'22023',null,'short display name is rejected');
select extensions.throws_ok($$select * from public.update_own_staff_profile(null,repeat('x',281),null,true)$$,'22023',null,'long bio is rejected');

select set_config('request.jwt.claim.sub','a3020000-0000-4000-8000-000000000002',true);
select extensions.is((select bio from public.get_staff_public_profile('b3020000-0000-4000-8000-000000000001')),'Hello teammates','opted-in profile is visible to active Staff');
select extensions.ok(pulse_private.can_read_staff_avatar('b3020000-0000-4000-8000-000000000001'),'opted-in custom avatar is visible to active Staff');

select set_config('request.jwt.claim.sub','a3020000-0000-4000-8000-000000000003',true);
select extensions.is((select count(*)::integer from public.get_staff_public_profile('b3020000-0000-4000-8000-000000000001')),0,'inactive caller cannot view public profile');
select extensions.throws_ok($$select * from public.update_own_staff_profile('Inactive',null,null,true)$$,'42501',null,'inactive caller cannot update a profile');

select * from extensions.finish();
rollback;
