begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config('search_path','extensions,public',true);
select extensions.plan(29);

select extensions.ok(exists(select 1 from storage.buckets where id='training-media' and not public and file_size_limit=4194304),'one private bounded Training bucket exists');
select extensions.is((select allowed_mime_types from storage.buckets where id='training-media'),
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4']::text[],'only certified image/audio MIME types are accepted');
select extensions.has_column('public','training_media','media_kind','canonical media has an explicit purpose');
select extensions.has_column('public','training_content','cover_media_id','content references a cover');
select extensions.has_column('public','training_content','lobby_audio_media_id','content references lobby audio');
select extensions.ok(not has_table_privilege('authenticated','public.training_media','INSERT'),'browser cannot insert media metadata');
select extensions.ok(not has_table_privilege('authenticated','public.training_media','SELECT'),'browser cannot browse media metadata');
select extensions.ok(not has_function_privilege('anon','public.can_read_training_media(uuid,uuid,uuid)','EXECUTE'),'anonymous signed-read authority is denied');
select extensions.ok(not has_function_privilege('anon','public.can_write_training_media(uuid)','EXECUTE'),'anonymous upload authority is denied');
select extensions.ok(not has_function_privilege('anon','public.get_training_content_media(uuid)','EXECUTE'),'anonymous Studio media listing is denied');
select extensions.ok(not has_function_privilege('authenticated','public.finish_training_media_delete(uuid)','EXECUTE'),'browser cannot complete physical deletion');
select extensions.ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='training_media_no_browser_insert' and permissive='RESTRICTIVE'),'Storage write guard is restrictive');
select extensions.ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='training_media_no_browser_select' and permissive='RESTRICTIVE'),'Storage read guard is restrictive');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at)
values
 ('a2700000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','media1@example.test','',now(),'{}','{}','','','','',now(),now()),
 ('a2700000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','media2@example.test','',now(),'{}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b2700000-0000-4000-8000-000000000001','a2700000-0000-4000-8000-000000000001','KK-927001','media1@example.test','Media Owner','active',now()),
 ('b2700000-0000-4000-8000-000000000002','a2700000-0000-4000-8000-000000000002','KK-927002','media2@example.test','Other Person','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values ('c2700000-0000-4000-8000-000000000001','b2700000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global','b2700000-0000-4000-8000-000000000001');
insert into public.training_content(id,content_type,title,language,status,created_by_user_id)
values ('d2700000-0000-4000-8000-000000000001','quiz','Media Test Game','en','draft','b2700000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type)
values ('d2700000-0000-4000-8000-000000000001','global');
insert into public.training_media(id,media_type,media_kind,bound_content_id,storage_bucket,storage_path,mime_type,
 byte_size,width_px,height_px,sha256,upload_key,status,finalized_at,created_by_user_id)
values
 ('e2700000-0000-4000-8000-000000000001','image','game_cover','d2700000-0000-4000-8000-000000000001','training-media','training/e2700000-0000-4000-8000-000000000001/source.png','image/png',100,64,64,repeat('a',64),'f2700000-0000-4000-8000-000000000001','ready',now(),'b2700000-0000-4000-8000-000000000001'),
 ('e2700000-0000-4000-8000-000000000002','audio','lobby_audio','d2700000-0000-4000-8000-000000000001','training-media','training/e2700000-0000-4000-8000-000000000002/source.m4a','audio/mp4',100,null,null,repeat('b',64),'f2700000-0000-4000-8000-000000000002','ready',now(),'b2700000-0000-4000-8000-000000000001');
insert into public.training_media(id,media_type,media_kind,bound_content_id,storage_bucket,storage_path,mime_type,
 byte_size,sha256,upload_key,status,created_by_user_id)
values ('e2700000-0000-4000-8000-000000000004','image','game_cover','d2700000-0000-4000-8000-000000000001',
 'training-media','training/e2700000-0000-4000-8000-000000000004/source.png','image/png',100,repeat('d',64),
 'f2700000-0000-4000-8000-000000000004','pending','b2700000-0000-4000-8000-000000000001');
select set_config('pulse.media_test_updated_at',updated_at::text,true) from public.training_content
  where id='d2700000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a2700000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.ok(public.can_write_training_media('d2700000-0000-4000-8000-000000000001'),'authorized owner may edit draft media');
select extensions.ok(public.can_read_training_media('e2700000-0000-4000-8000-000000000001','d2700000-0000-4000-8000-000000000001',null),'authorized editor may read unattached draft upload');
select extensions.ok(public.mark_training_media_deleting('e2700000-0000-4000-8000-000000000004'),'owner may safely cancel an unreferenced pending upload');
select extensions.is(public.get_training_content_media('d2700000-0000-4000-8000-000000000001')->>'cover_media_id',null,'new draft has no cover');
select extensions.throws_ok($$insert into storage.objects(bucket_id,name) values ('training-media','training/e2700000-0000-4000-8000-000000000001/source.png')$$,'42501',null,'authenticated browser cannot directly upload');
select extensions.throws_ok($$insert into storage.objects(bucket_id,name) values ('training-media','../other/source.png')$$,'42501',null,'arbitrary traversal path is denied');
select extensions.throws_ok($$select public.finish_training_media_delete('e2700000-0000-4000-8000-000000000002')$$,'42501',null,'browser cannot invoke trusted deletion');
select set_config('pulse.media_test_updated_at',(public.set_training_content_media('d2700000-0000-4000-8000-000000000001',
  'e2700000-0000-4000-8000-000000000001','e2700000-0000-4000-8000-000000000002',
  current_setting('pulse.media_test_updated_at')::timestamptz)->>'updated_at'),true);
select extensions.throws_ok($$select public.mark_training_media_deleting('e2700000-0000-4000-8000-000000000001')$$,'55000',null,'attached cover cannot be deleted');
select extensions.throws_ok($$select public.set_training_content_media('d2700000-0000-4000-8000-000000000001','e2700000-0000-4000-8000-000000000002',null,current_setting('pulse.media_test_updated_at')::timestamptz)$$,'23514',null,'audio cannot be attached as a cover');

select set_config('request.jwt.claim.sub','a2700000-0000-4000-8000-000000000002',true);
select extensions.ok(not public.can_write_training_media('d2700000-0000-4000-8000-000000000001'),'unrelated Staff cannot upload');
select extensions.ok(not public.can_read_training_media('e2700000-0000-4000-8000-000000000001','d2700000-0000-4000-8000-000000000001',null),'unrelated Staff cannot get media access');
select extensions.throws_ok($$select public.mark_training_media_deleting('e2700000-0000-4000-8000-000000000002')$$,'42501',null,'other Staff cannot delete media');

set local role postgres;
select extensions.throws_ok($$update public.training_media set storage_path='training/forged/source.png' where id='e2700000-0000-4000-8000-000000000001'$$,'55000',null,'finalized object path cannot be changed');
insert into public.training_topics(id,code,name,is_active)
values ('92700000-0000-4000-8000-000000000001','media_history_test','Media History Test',true);
insert into public.training_content(id,content_type,title,language,status,created_by_user_id)
values ('d2700000-0000-4000-8000-000000000002','lesson','Published Media Test','en','draft','b2700000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type)
values ('d2700000-0000-4000-8000-000000000002','global');
insert into public.training_content_topics(content_id,topic_id)
values ('d2700000-0000-4000-8000-000000000002','92700000-0000-4000-8000-000000000001');
insert into public.training_media(id,media_type,media_kind,bound_content_id,storage_bucket,storage_path,mime_type,
 byte_size,width_px,height_px,sha256,status,finalized_at,created_by_user_id)
values ('e2700000-0000-4000-8000-000000000003','image','game_cover','d2700000-0000-4000-8000-000000000002',
 'training-media','training/e2700000-0000-4000-8000-000000000003/source.png','image/png',100,64,64,
 repeat('c',64),'ready',now(),'b2700000-0000-4000-8000-000000000001');
update public.training_content set cover_media_id='e2700000-0000-4000-8000-000000000003'
  where id='d2700000-0000-4000-8000-000000000002';
update public.training_content set status='published'
  where id='d2700000-0000-4000-8000-000000000002';
select extensions.throws_ok($$update public.training_content set cover_media_id=null where id='d2700000-0000-4000-8000-000000000002'$$,'55000',null,'published cover reference is immutable');
select set_config('request.jwt.claim.sub','a2700000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.ok(public.can_read_training_media('e2700000-0000-4000-8000-000000000003','d2700000-0000-4000-8000-000000000002',null),'authorized Staff may read published cover');
select extensions.throws_ok($$select public.mark_training_media_deleting('e2700000-0000-4000-8000-000000000003')$$,'42501',null,'published media cannot be physically deleted');

select * from extensions.finish();
rollback;
