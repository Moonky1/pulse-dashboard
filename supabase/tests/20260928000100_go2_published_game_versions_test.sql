begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config('search_path','extensions,public',true);
select extensions.plan(32);

select extensions.has_column('public','training_content','game_id','every version has a stable game identity');
select extensions.has_column('public','training_content','version_number','version ordering is stored canonically');
select extensions.has_column('public','training_content','is_current','current published version is explicit');
select extensions.ok(not has_table_privilege('authenticated','public.training_content','INSERT'),'browser cannot forge a game revision');
select extensions.ok(not has_table_privilege('authenticated','public.training_content','UPDATE'),'browser cannot move the current pointer');
select extensions.ok(not has_function_privilege('anon','public.create_training_content_revision(uuid)','EXECUTE'),'anonymous revision creation is denied');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,
  email_change_token_new,email_change,created_at,updated_at)
values
 ('a2800000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go2owner@example.test','',now(),'{}','{}','','','','',now(),now()),
 ('a2800000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go2other@example.test','',now(),'{}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b2800000-0000-4000-8000-000000000001','a2800000-0000-4000-8000-000000000001',
  'KK-928001','go2owner@example.test','Game Owner','active',now()),
 ('b2800000-0000-4000-8000-000000000002','a2800000-0000-4000-8000-000000000002',
  'KK-928002','go2other@example.test','Other Staff','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values ('c2800000-0000-4000-8000-000000000001',
 'b2800000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000010','global',
 'b2800000-0000-4000-8000-000000000001');
insert into public.training_topics(id,code,name,is_active)
values ('92800000-0000-4000-8000-000000000001','go2_version_test','GO2 Version Test',true);
insert into public.training_content(id,content_type,title,language,created_by_user_id)
values ('d2800000-0000-4000-8000-000000000001','quiz','Game Version One','en',
 'b2800000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type)
values ('d2800000-0000-4000-8000-000000000001','global');
insert into public.training_content_topics(content_id,topic_id)
values ('d2800000-0000-4000-8000-000000000001',
 '92800000-0000-4000-8000-000000000001');
insert into public.training_questions(id,content_id,position,question_type,prompt,
 answer_options,correct_answer)
values ('e2800000-0000-4000-8000-000000000001',
 'd2800000-0000-4000-8000-000000000001',1,'multiple_choice',
 'Which version is current?','["Version one","Version two"]'::jsonb,'0'::jsonb);
insert into public.training_question_topics(question_id,topic_id)
values ('e2800000-0000-4000-8000-000000000001',
 '92800000-0000-4000-8000-000000000001');
insert into public.training_media(id,media_type,media_kind,bound_content_id,
 storage_bucket,storage_path,mime_type,byte_size,width_px,height_px,sha256,
 status,finalized_at,created_by_user_id)
values ('f2800000-0000-4000-8000-000000000001','image','game_cover',
 'd2800000-0000-4000-8000-000000000001','training-media',
 'training/f2800000-0000-4000-8000-000000000001/source.png','image/png',100,
 64,64,repeat('a',64),'ready',now(),'b2800000-0000-4000-8000-000000000001');
update public.training_content
set cover_media_id='f2800000-0000-4000-8000-000000000001'
where id='d2800000-0000-4000-8000-000000000001';
update public.training_content set status='published'
where id='d2800000-0000-4000-8000-000000000001';
select extensions.ok((select is_current from public.training_content
  where id='d2800000-0000-4000-8000-000000000001'),
  'first publish establishes the current version');

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a2800000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.throws_ok($$select * from public.create_training_content_revision(
 'd2800000-0000-4000-8000-000000000001')$$,'42501',null,
 'unrelated Staff cannot start a revision');
select set_config('request.jwt.claim.sub','a2800000-0000-4000-8000-000000000001',true);
select set_config('pulse.go2_attempt_v1',(select attempt_id::text
 from public.start_training_attempt('d2800000-0000-4000-8000-000000000001','go_practice')),true);
select extensions.is((select score_percent from public.complete_training_attempt(
  current_setting('pulse.go2_attempt_v1')::uuid,
  '[{"question_id":"e2800000-0000-4000-8000-000000000001","answer":0}]'::jsonb)),
  100.00::numeric,'v1 Practice result is established before editing');
select set_config('pulse.go2_room_v1',(public.create_go_hosted_session(
  'd2800000-0000-4000-8000-000000000001')->>'session_id'),true);
set local role postgres;
select extensions.is((select content_id from public.go_sessions
  where id=current_setting('pulse.go2_room_v1')::uuid),
  'd2800000-0000-4000-8000-000000000001'::uuid,
  'Hosted room initially pins the v1 revision');
set local role authenticated;
select set_config('pulse.go2_revision',(select id::text from
  public.create_training_content_revision('d2800000-0000-4000-8000-000000000001')),true);
select extensions.is((public.get_training_game_versions(
  current_setting('pulse.go2_revision')::uuid)->>'version_number')::integer,
  2,'server assigned Version 2');
select extensions.is((select id from public.create_training_content_revision(
  'd2800000-0000-4000-8000-000000000001')),
  current_setting('pulse.go2_revision')::uuid,'repeated Edit reopens the same draft');

set local role postgres;
select extensions.is((select count(*)::integer from public.training_questions
 where content_id=current_setting('pulse.go2_revision')::uuid),1,
 'draft copies the question definition, not learner history');
select extensions.is((select cover_media_id from public.training_content
 where id=current_setting('pulse.go2_revision')::uuid),
 'f2800000-0000-4000-8000-000000000001'::uuid,
 'draft safely references the v1 cover without overwriting it');
select extensions.ok((select is_current from public.training_content
 where id='d2800000-0000-4000-8000-000000000001'),
 'v1 stays current until update is published');
select extensions.throws_ok($$update public.training_content set title='Tampered'
 where id='d2800000-0000-4000-8000-000000000001'$$,'55000',null,
 'published v1 gameplay definition is immutable');
select extensions.throws_ok($$update public.training_content set language='es'
 where id=current_setting('pulse.go2_revision')::uuid$$,'55000',null,
 'an update draft cannot silently switch language branch');
insert into public.training_media(id,media_type,media_kind,bound_content_id,
 storage_bucket,storage_path,mime_type,byte_size,width_px,height_px,sha256,
 status,finalized_at,created_by_user_id)
values ('f2800000-0000-4000-8000-000000000002','image','game_cover',
 current_setting('pulse.go2_revision')::uuid,'training-media',
 'training/f2800000-0000-4000-8000-000000000002/source.png','image/png',100,
 64,64,repeat('b',64),'ready',now(),'b2800000-0000-4000-8000-000000000001');
update public.training_content
set cover_media_id='f2800000-0000-4000-8000-000000000002'
where id=current_setting('pulse.go2_revision')::uuid;
select extensions.is((select cover_media_id from public.training_content
 where id='d2800000-0000-4000-8000-000000000001'),
 'f2800000-0000-4000-8000-000000000001'::uuid,
 'changing v2 cover preserves v1 media reference');
select set_config('pulse.go2_updated_at',(select updated_at::text
 from public.training_content where id=current_setting('pulse.go2_revision')::uuid),true);
select set_config('request.jwt.claim.sub','a2800000-0000-4000-8000-000000000001',true);
set local role authenticated;
select extensions.is((select status from public.publish_training_content(
 current_setting('pulse.go2_revision')::uuid,
 current_setting('pulse.go2_updated_at')::timestamptz)),
 'published','publishing v2 succeeds through reviewed Studio contract');
set local role postgres;
select extensions.ok(not (select is_current from public.training_content
 where id='d2800000-0000-4000-8000-000000000001'),
 'v1 is no longer current after atomic publication');
select extensions.throws_ok($$update public.training_content set status='archived'
 where id='d2800000-0000-4000-8000-000000000001'$$,'55000',null,
 'historical published v1 cannot be archived away');
select extensions.ok((select is_current from public.training_content
 where id=current_setting('pulse.go2_revision')::uuid),
 'v2 is the only current published revision');
select extensions.is((select score_percent from public.training_results result
 join public.training_attempts attempt on attempt.id=result.attempt_id
 where attempt.id=current_setting('pulse.go2_attempt_v1')::uuid),
 100.00::numeric,'historical v1 result stays unchanged');
select extensions.is((select content_id from public.training_attempts
 where id=current_setting('pulse.go2_attempt_v1')::uuid),
 'd2800000-0000-4000-8000-000000000001'::uuid,
 'historical attempt stays pinned to v1');
select extensions.is((select content_id from public.go_sessions
  where id=current_setting('pulse.go2_room_v1')::uuid),
  'd2800000-0000-4000-8000-000000000001'::uuid,
  'existing Hosted room remains pinned to v1 after v2 publication');
select set_config('pulse.go2_room_version',(select version::text from public.go_sessions
  where id=current_setting('pulse.go2_room_v1')::uuid),true);
set local role authenticated;
select extensions.is((public.cancel_go_hosted_session(
  current_setting('pulse.go2_room_v1')::uuid,
  current_setting('pulse.go2_room_version')::integer)->>'status'),
  'cancelled','historical room can be safely closed');
select set_config('pulse.go2_room_v2',(public.create_go_hosted_session(
  current_setting('pulse.go2_revision')::uuid)->>'session_id'),true);
set local role postgres;
select extensions.is((select content_id from public.go_sessions
  where id=current_setting('pulse.go2_room_v2')::uuid),
  current_setting('pulse.go2_revision')::uuid,
  'new Hosted room pins current v2');
select extensions.throws_ok($$insert into public.go_sessions(room_code,content_id,question_count)
 values ('KK 0000','d2800000-0000-4000-8000-000000000001',1)$$,
 '55000',null,'new Hosted room cannot be created from historical v1');
set local role authenticated;
select extensions.throws_ok($$select public.mark_training_media_deleting(
 'f2800000-0000-4000-8000-000000000001')$$,'42501',null,
 'historical cover cannot be removed');
select extensions.throws_ok($$select * from public.start_training_attempt(
 'd2800000-0000-4000-8000-000000000001','go_practice')$$,'55000',null,
 'new Practice cannot start on v1');
select extensions.is((select content_id from public.start_training_attempt(
 current_setting('pulse.go2_revision')::uuid,'go_practice')),
 current_setting('pulse.go2_revision')::uuid,
 'new Practice pins the exact v2 revision');
select extensions.is((select id from public.list_go_practice_catalog()
 where title='Game Version One'),current_setting('pulse.go2_revision')::uuid,
 'Practice catalog exposes only current v2');
select * from extensions.finish();
rollback;
