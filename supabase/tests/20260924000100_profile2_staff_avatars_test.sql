begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config(
  'search_path',
  quote_ident((select namespace.nspname from pg_extension extension join pg_namespace namespace on namespace.oid=extension.extnamespace where extension.extname='pgtap')) || ', public',
  true
);
select extensions.plan(32);

select extensions.has_column('public','users','google_avatar_url','Staff stores a trusted Google avatar reference');
select extensions.has_column('public','users','custom_avatar_path','Staff stores only its canonical custom avatar path');
select extensions.has_column('public','users','avatar_updated_at','Staff avatar state is versioned');
select extensions.ok(exists(select 1 from storage.buckets where id='staff-avatars' and not public and file_size_limit=1048576),'avatar bucket is private and limited to 1 MB');
select extensions.is((select allowed_mime_types from storage.buckets where id='staff-avatars'),array['image/webp']::text[],'only normalized WebP objects may be stored');
select extensions.ok(has_function_privilege('authenticated','public.refresh_own_google_avatar()','EXECUTE'),'authenticated Staff may refresh trusted Google metadata');
select extensions.ok(not has_function_privilege('anon','public.refresh_own_google_avatar()','EXECUTE'),'anonymous Google refresh is denied');
select extensions.ok(not has_function_privilege('authenticated','public.set_staff_custom_avatar(uuid)','EXECUTE'),'browser cannot set a custom avatar path');
select extensions.ok(has_function_privilege('service_role','public.set_staff_custom_avatar(uuid)','EXECUTE'),'trusted avatar boundary may confirm a validated upload');
select extensions.ok(not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and cmd in ('INSERT','UPDATE','DELETE') and (roles::text like '%authenticated%' or roles::text like '%anon%')),'no browser Storage write policy exists');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('a2400000-0000-4000-8000-000000000001','authenticated','authenticated','profile2.google@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000002','authenticated','authenticated','profile2.other@example.test','',now(),'{}','{}',now(),now()),
 ('a2400000-0000-4000-8000-000000000003','authenticated','authenticated','profile2.password@example.test','',now(),'{}','{}',now(),now());

insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b2400000-0000-4000-8000-000000000001','a2400000-0000-4000-8000-000000000001','KK-924001','profile2.google@example.test','PROFILE-2 Google','active',now()),
 ('b2400000-0000-4000-8000-000000000002','a2400000-0000-4000-8000-000000000002','KK-924002','profile2.other@example.test','PROFILE-2 Other','active',now()),
 ('b2400000-0000-4000-8000-000000000003','a2400000-0000-4000-8000-000000000003','KK-924003','profile2.password@example.test','PROFILE-2 Password','active',now());

insert into auth.identities(provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
values
 ('profile2-google-sub','a2400000-0000-4000-8000-000000000001','{"sub":"profile2-google-sub","email":"profile2.google@example.test","avatar_url":"https://lh3.googleusercontent.com/a/profile2-safe"}'::jsonb,'google',now(),now(),now());

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select extensions.throws_ok($$select * from public.refresh_own_google_avatar()$$,'28000',null,'anonymous refresh is rejected');

select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000001',true);
select extensions.is((select google_avatar_url from public.refresh_own_google_avatar()),'https://lh3.googleusercontent.com/a/profile2-safe','Google avatar is copied from trusted provider identity metadata');
select extensions.is((select google_avatar_url from public.users where id='b2400000-0000-4000-8000-000000000001'),'https://lh3.googleusercontent.com/a/profile2-safe','trusted Google avatar persists on canonical Staff profile');

set local role postgres;
update auth.identities set identity_data=jsonb_set(identity_data,'{avatar_url}','"https://evil.example/avatar.png"') where user_id='a2400000-0000-4000-8000-000000000001';
set local role authenticated;
select extensions.is((select google_avatar_url from public.refresh_own_google_avatar()),null,'untrusted provider avatar hosts are discarded');

select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000003',true);
select extensions.is((select google_avatar_url from public.refresh_own_google_avatar()),null,'email and password user receives no fake provider avatar');
select extensions.ok(pulse_private.can_read_staff_avatar('b2400000-0000-4000-8000-000000000003'),'Staff may read their own protected avatar');
select extensions.ok(not pulse_private.can_read_staff_avatar('b2400000-0000-4000-8000-000000000002'),'ordinary Staff may not read another profile avatar');
select extensions.throws_ok($$insert into storage.objects(bucket_id,name) values ('staff-avatars','b2400000-0000-4000-8000-000000000003/avatar.webp')$$,'42501',null,'authenticated browser cannot upload directly');
select extensions.throws_ok($$insert into storage.objects(bucket_id,name) values ('staff-avatars','../b2400000-0000-4000-8000-000000000002/avatar.webp')$$,'42501',null,'path traversal upload is denied');

set local role service_role;
select set_config('request.jwt.claim.role','service_role',true);
select extensions.is((select custom_avatar_path from public.set_staff_custom_avatar('a2400000-0000-4000-8000-000000000001')),'b2400000-0000-4000-8000-000000000001/avatar.webp','trusted boundary constructs the canonical path');
select extensions.is((select custom_avatar_path from public.users where id='b2400000-0000-4000-8000-000000000001'),'b2400000-0000-4000-8000-000000000001/avatar.webp','canonical custom path persists');

set local role postgres;
select extensions.throws_ok($$update public.users set custom_avatar_path='b2400000-0000-4000-8000-000000000002/avatar.webp' where id='b2400000-0000-4000-8000-000000000001'$$,'23514',null,'another user path violates the canonical-path constraint');
select extensions.throws_ok($$update public.users set google_avatar_url='javascript:alert(1)' where id='b2400000-0000-4000-8000-000000000001'$$,'23514',null,'arbitrary avatar URLs violate the trusted-host constraint');

set local role service_role;
select extensions.is((select removed_avatar_path from public.clear_staff_custom_avatar('a2400000-0000-4000-8000-000000000001')),'b2400000-0000-4000-8000-000000000001/avatar.webp','remove returns only the previous canonical object path');
select extensions.is((select custom_avatar_path from public.users where id='b2400000-0000-4000-8000-000000000001'),null,'remove restores provider/initials fallback state');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a2400000-0000-4000-8000-000000000001',true);
select extensions.throws_ok($$select * from public.set_staff_custom_avatar('a2400000-0000-4000-8000-000000000002')$$,'42501',null,'wrong user cannot invoke trusted path mutation');

set local role postgres;
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values ('c2400000-0000-4000-8000-000000000001','b2400000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','b2400000-0000-4000-8000-000000000001');
set local role authenticated;
select extensions.ok(pulse_private.can_read_staff_avatar('b2400000-0000-4000-8000-000000000002'),'authorized People operator may resolve another visible Staff avatar');
select extensions.ok(exists(select 1 from public.get_managed_user('b2400000-0000-4000-8000-000000000002') where google_avatar_url is null and custom_avatar_path is null),'protected Staff projection exposes only canonical avatar fields');

set local role postgres;
select extensions.ok((select prosecdef from pg_proc where oid='public.refresh_own_google_avatar()'::regprocedure),'Google refresh is SECURITY DEFINER');
select extensions.is((select proconfig[1] from pg_proc where oid='public.refresh_own_google_avatar()'::regprocedure),'search_path=pg_catalog','Google refresh fixes search_path');
select extensions.ok((select prosecdef from pg_proc where oid='public.set_staff_custom_avatar(uuid)'::regprocedure),'custom avatar state transition is SECURITY DEFINER');
select extensions.is((select proconfig[1] from pg_proc where oid='public.set_staff_custom_avatar(uuid)'::regprocedure),'search_path=pg_catalog','custom avatar state transition fixes search_path');

select * from extensions.finish();
rollback;
