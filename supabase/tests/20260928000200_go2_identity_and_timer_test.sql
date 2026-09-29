begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
grant usage on schema extensions to authenticated;
select set_config('search_path','extensions,public',true);
select extensions.plan(25);

select extensions.has_column('public','training_content','variant_family_id','language family is canonical');
select extensions.has_column('public','training_content','timer_seconds','timer setting is server-owned');
select extensions.has_column('public','go_sessions','question_deadline_at','room has a server deadline');
select extensions.ok(not has_table_privilege('authenticated','public.go_sessions','UPDATE'),
  'browser cannot set the room deadline');
select extensions.ok(not has_table_privilege('authenticated','public.training_content','UPDATE'),
  'browser cannot change authorship or timer directly');
select extensions.ok(not has_function_privilege('anon',
  'public.create_training_language_variant(uuid,text)','EXECUTE'),
  'anonymous language-variant creation is denied');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,
  email_change_token_new,email_change,created_at,updated_at)
values
 ('a2810000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go2identity@example.test','',now(),'{}','{}','','','','',now(),now()),
 ('a2810000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go2participant@example.test','',now(),'{}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,approved_at)
values
 ('b2810000-0000-4000-8000-000000000001','a2810000-0000-4000-8000-000000000001',
  'KK-928101','go2identity@example.test','Game Author','active',now()),
 ('b2810000-0000-4000-8000-000000000002','a2810000-0000-4000-8000-000000000002',
  'KK-928102','go2participant@example.test','Game Player','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type,assigned_by_user_id)
values ('c2810000-0000-4000-8000-000000000001',
 'b2810000-0000-4000-8000-000000000001',
 '10000000-0000-0000-0000-000000000010','global',
 'b2810000-0000-4000-8000-000000000001');
insert into public.training_topics(id,code,name,is_active)
values ('92810000-0000-4000-8000-000000000001','go2_identity_test','GO2 Identity Test',true);
insert into public.training_content(id,content_type,title,language,created_by_user_id)
values ('d2810000-0000-4000-8000-000000000001','quiz','Identity Test','en',
 'b2810000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type)
values ('d2810000-0000-4000-8000-000000000001','global');
insert into public.training_content_topics(content_id,topic_id)
values ('d2810000-0000-4000-8000-000000000001',
 '92810000-0000-4000-8000-000000000001');
insert into public.training_questions(id,content_id,position,question_type,prompt,
  answer_options,correct_answer)
values ('e2810000-0000-4000-8000-000000000001',
 'd2810000-0000-4000-8000-000000000001',1,'multiple_choice',
 'Which answer?','["First","Second"]'::jsonb,'0'::jsonb);
insert into public.training_question_topics(question_id,topic_id)
values ('e2810000-0000-4000-8000-000000000001',
 '92810000-0000-4000-8000-000000000001');

select extensions.is((select variant_family_id from public.training_content
  where id='d2810000-0000-4000-8000-000000000001'),
  'd2810000-0000-4000-8000-000000000001'::uuid,
  'first draft receives its own language family');
select set_config('pulse.go2_updated_at',(select updated_at::text
  from public.training_content where id='d2810000-0000-4000-8000-000000000001'),true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a2810000-0000-4000-8000-000000000002',true);
set local role authenticated;
select extensions.throws_ok($$select public.set_training_game_timer(
  'd2810000-0000-4000-8000-000000000001',30,now())$$,'42501',null,
  'unrelated Staff cannot change timer');
select extensions.throws_ok($$select public.mark_training_game_canonical(
  'd2810000-0000-4000-8000-000000000001')$$,'42501',null,
  'unrelated Staff cannot mark Made by Pulse');
select set_config('request.jwt.claim.sub','a2810000-0000-4000-8000-000000000001',true);
select extensions.throws_ok($$select public.set_training_game_timer(
  'd2810000-0000-4000-8000-000000000001',14,now())$$,'22023',null,
  'invalid timer is rejected');
select extensions.is((public.set_training_game_timer(
  'd2810000-0000-4000-8000-000000000001',15,
  current_setting('pulse.go2_updated_at')::timestamptz)
  ->>'timer_seconds')::integer,
  15,'authorized draft timer is saved');
select extensions.is((public.get_go_game_identity(
  array['d2810000-0000-4000-8000-000000000001']::uuid[])->0->>'creator_label'),
  'Created by Game Author','staff creator uses safe display name');
select extensions.is((public.mark_training_game_canonical(
  'd2810000-0000-4000-8000-000000000001')->>'authorship_kind'),
  'pulse','manager can explicitly mark a draft canonical');
select extensions.is((public.get_go_game_identity(
  array['d2810000-0000-4000-8000-000000000001']::uuid[])->0->>'creator_label'),
  'Made by Pulse','canonical label is explicit');

set local role postgres;
update public.training_content set status='published'
  where id='d2810000-0000-4000-8000-000000000001';
select extensions.throws_ok($$update public.training_content set timer_seconds=30
  where id='d2810000-0000-4000-8000-000000000001'$$,'55000',null,
  'published timer cannot be changed');
set local role authenticated;
select extensions.throws_ok($$select public.create_training_language_variant(
  'd2810000-0000-4000-8000-000000000001','en')$$,'22023',null,
  'same-language variant is rejected');
select set_config('pulse.go2_variant',(public.create_training_language_variant(
  'd2810000-0000-4000-8000-000000000001','es')->>'id'),true);
set local role postgres;
select extensions.is((select language from public.training_content
  where id=current_setting('pulse.go2_variant')::uuid),'es',
  'manual Spanish variant has explicit language');
select extensions.is((select count(*)::integer from public.training_questions
  where content_id=current_setting('pulse.go2_variant')::uuid),0,
  'manual variant never copies untranslated questions');
set local role authenticated;
select extensions.is((public.create_training_language_variant(
  'd2810000-0000-4000-8000-000000000001','es')->>'created')::boolean,
  false,'manual variant request is idempotent');
select set_config('pulse.go2_revision',(select id::text from
  public.create_training_content_revision('d2810000-0000-4000-8000-000000000001')),true);
set local role postgres;
select extensions.is((select timer_seconds from public.training_content
  where id=current_setting('pulse.go2_revision')::uuid),15,
  'version 2 inherits the published timer');

set local role postgres;
insert into public.go_sessions(id,room_code,content_id,question_count)
values ('82810000-0000-4000-8000-000000000001','KK 8101',
 'd2810000-0000-4000-8000-000000000001',1);
update public.go_sessions set status='active',current_question_position=1,
  started_at=now() where id='82810000-0000-4000-8000-000000000001';
select extensions.ok((select question_deadline_at > question_started_at and
  question_deadline_at <= question_started_at + interval '15 seconds 1 millisecond'
  from public.go_sessions where id='82810000-0000-4000-8000-000000000001'),
  'server starts the 15-second deadline');
insert into public.training_learners(id,learner_kind)
values ('92810000-0000-4000-8000-000000000002','staff');
insert into public.training_attempts(id,learner_id,content_id,source_mode,attempt_number,language)
values ('a2810000-0000-4000-8000-000000000003',
 '92810000-0000-4000-8000-000000000002',
 'd2810000-0000-4000-8000-000000000001','go_hosted',1,'en');
insert into public.go_session_participants(session_id,seat_number,participant_label)
values ('82810000-0000-4000-8000-000000000001',1,'Player');
insert into public.go_session_memberships(session_id,member_kind,seat_number,
 staff_user_id,learner_id,attempt_id)
values ('82810000-0000-4000-8000-000000000001','participant',1,
 'b2810000-0000-4000-8000-000000000002',
 '92810000-0000-4000-8000-000000000002',
 'a2810000-0000-4000-8000-000000000003');
insert into public.go_session_memberships(session_id,member_kind,staff_user_id)
values ('82810000-0000-4000-8000-000000000001','host',
  'b2810000-0000-4000-8000-000000000001');
select set_config('pulse.go2_deadline',(select question_deadline_at::text from public.go_sessions
  where id='82810000-0000-4000-8000-000000000001'),true);
set local role authenticated;
select extensions.is((public.get_go_hosted_experience(
  '82810000-0000-4000-8000-000000000001')->>'question_deadline_at')::timestamptz,
  current_setting('pulse.go2_deadline')::timestamptz,
  'reconnecting host receives the canonical deadline');
select extensions.is((public.get_go_hosted_experience(
  '82810000-0000-4000-8000-000000000001')->'content'->>'creator_label'),
  'Made by Pulse','room identity includes explicit canonical attribution');
select extensions.ok(public.get_go_hosted_experience(
  '82810000-0000-4000-8000-000000000001')::text not like '%correct_answer%',
  'room snapshot does not expose answer keys');
set local role postgres;
update public.go_sessions set
  question_started_at=clock_timestamp()-interval '16 seconds',
  question_deadline_at=clock_timestamp()-interval '1 second'
  where id='82810000-0000-4000-8000-000000000001';
select extensions.throws_ok($$insert into public.training_attempt_answers(
  attempt_id,question_id,submitted_answer,is_correct)
  values ('a2810000-0000-4000-8000-000000000003',
    'e2810000-0000-4000-8000-000000000001','0'::jsonb,true)$$,
  '55000',null,'expired Hosted answer is denied by the server');
select * from extensions.finish();
rollback;
