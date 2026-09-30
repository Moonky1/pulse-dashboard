begin;
create extension if not exists pgtap with schema extensions;
set local role postgres;
select set_config('search_path','extensions,public',true);
select extensions.plan(19);

select extensions.has_column('public','go_question_bank_groups','reviewed_at',
  'review checkpoint is stored server-side');
select extensions.ok(not has_table_privilege('authenticated',
  'public.go_question_bank_groups','UPDATE'),
  'browser cannot approve a bank by editing the metadata table');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,
  email_change_token_new,email_change,created_at,updated_at)
values
 ('a2840000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go-classic-gate@example.test','',now(),'{}','{}','','','','',now(),now()),
 ('a2840000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','go-classic-player@example.test','',now(),'{}','{}','','','','',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status)
values
 ('b2840000-0000-4000-8000-000000000001','a2840000-0000-4000-8000-000000000001',
  'go-classic-gate@example.test','GO Classic Host','active'),
 ('b2840000-0000-4000-8000-000000000002','a2840000-0000-4000-8000-000000000002',
  'go-classic-player@example.test','GO Classic Player','active');
insert into public.roles(id,key,name,is_active) values
 ('82840000-0000-4000-8000-000000000001','go_classic_host','GO Classic Host',true),
 ('82840000-0000-4000-8000-000000000002','go_classic_player','GO Classic Player',true);
insert into public.role_scopes(role_id,scope_type) values
 ('82840000-0000-4000-8000-000000000001','global'),
 ('82840000-0000-4000-8000-000000000002','global');
insert into public.role_permissions(role_id,permission_id)
select '82840000-0000-4000-8000-000000000001',id from public.permissions
  where key='go.host';
insert into public.role_permissions(role_id,permission_id)
select '82840000-0000-4000-8000-000000000002',id from public.permissions
  where key='go.play';
insert into public.user_roles(id,user_id,role_id,scope_type) values
 ('f2840000-0000-4000-8000-000000000001',
  'b2840000-0000-4000-8000-000000000001',
  '82840000-0000-4000-8000-000000000001','global'),
 ('f2840000-0000-4000-8000-000000000002',
  'b2840000-0000-4000-8000-000000000002',
  '82840000-0000-4000-8000-000000000002','global');
insert into public.training_topics(id,code,name,is_active)
values ('92840000-0000-4000-8000-000000000001','go_classic_gate','GO Classic Gate',true);
insert into public.training_content(id,content_type,title,language,created_by_user_id)
values
  ('d2840000-0000-4000-8000-000000000001','quiz','Classic Gate','en',
    'b2840000-0000-4000-8000-000000000001'),
  ('d2840000-0000-4000-8000-000000000002','quiz','Special Gate','en',
    'b2840000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type)
values ('d2840000-0000-4000-8000-000000000001','global'),
  ('d2840000-0000-4000-8000-000000000002','global');
insert into public.training_content_topics(content_id,topic_id)
values ('d2840000-0000-4000-8000-000000000001',
    '92840000-0000-4000-8000-000000000001'),
  ('d2840000-0000-4000-8000-000000000002',
    '92840000-0000-4000-8000-000000000001');
insert into public.training_questions(content_id,position,question_type,prompt,
  answer_options,correct_answer)
select content.id,n,'multiple_choice','Gate question '||n,
  '["Yes","No"]'::jsonb,'0'::jsonb
from public.training_content content cross join generate_series(1,40) n
where content.id in ('d2840000-0000-4000-8000-000000000001',
  'd2840000-0000-4000-8000-000000000002');
insert into public.training_question_topics(question_id,topic_id)
select question.id,'92840000-0000-4000-8000-000000000001'
from public.training_questions question where question.content_id in
  ('d2840000-0000-4000-8000-000000000001',
   'd2840000-0000-4000-8000-000000000002');
insert into public.go_question_bank_groups(content_id,source_group_key,source_sha256,
  game_mode,difficulty,source_ids)
values
  ('d2840000-0000-4000-8000-000000000001','gate-classic-easy-en',repeat('a',64),
    'classic','easy',array(select 'classic-'||n from generate_series(1,40) n)),
  ('d2840000-0000-4000-8000-000000000002','gate-special-en',repeat('b',64),
    'valid-invalid',null,array(select 'special-'||n from generate_series(1,40) n));

select extensions.throws_ok($$update public.training_content set status='published'
  where id='d2840000-0000-4000-8000-000000000001'$$,
  '55000',null,'unreviewed Classic is blocked');

update public.go_question_bank_groups bank
set reviewed_at=now(),reviewed_content_updated_at=content.updated_at
from public.training_content content where content.id=bank.content_id
  and bank.content_id in ('d2840000-0000-4000-8000-000000000001',
    'd2840000-0000-4000-8000-000000000002');
update public.training_questions set prompt='Changed after review'
where content_id='d2840000-0000-4000-8000-000000000001' and position=1;
select extensions.is((select reviewed_at is null from public.go_question_bank_groups
  where content_id='d2840000-0000-4000-8000-000000000001'),true,
  'question edits invalidate Classic review');

select extensions.throws_ok($$update public.training_content set status='published'
  where id='d2840000-0000-4000-8000-000000000002'$$,
  '55000',null,'special modes remain blocked even if marked reviewed');

update public.go_question_bank_groups bank
set reviewed_at=now(),reviewed_content_updated_at=content.updated_at
from public.training_content content where content.id=bank.content_id
  and bank.content_id='d2840000-0000-4000-8000-000000000001';
select extensions.lives_ok($$update public.training_content set status='published'
  where id='d2840000-0000-4000-8000-000000000001'$$,
  'reviewed Classic can publish through the standard content transition');
select extensions.is((select is_current from public.training_content
  where id='d2840000-0000-4000-8000-000000000001'),true,
  'published Classic becomes the current playable version');
select extensions.throws_ok($$update public.go_question_bank_groups set difficulty='medium'
  where content_id='d2840000-0000-4000-8000-000000000001'$$,
  '55000',null,'published Classic classification is immutable');

select set_config('request.jwt.claim.sub','a2840000-0000-4000-8000-000000000001',true);
select extensions.is((public.get_go_question_bank_groups(
  array['d2840000-0000-4000-8000-000000000001'::uuid])->0->>'game_mode'),
  'classic','an authorized host can read published Classic classification');
select extensions.is(public.get_go_question_bank_groups(
  array['d2840000-0000-4000-8000-000000000002'::uuid]),'[]'::jsonb,
  'an authorized host cannot read a draft special mode');
create temporary table classic_room as
select (room->>'session_id')::uuid id,room->>'room_code' code
from (select public.create_go_hosted_session(
  'd2840000-0000-4000-8000-000000000001') room) created;
select extensions.is((select question_count from public.go_sessions
  where id=(select id from classic_room)),10,
  'Classic rooms play ten questions, not the full forty');
select extensions.ok((select question_start_position in (1,11,21,31)
  from public.go_sessions where id=(select id from classic_room)),
  'one full ten-question block is selected on the server');

select set_config('request.jwt.claim.sub','a2840000-0000-4000-8000-000000000002',true);
select extensions.is((public.get_go_question_bank_groups(
  array['d2840000-0000-4000-8000-000000000001'::uuid])->0->>'difficulty'),
  'easy','an authorized player can read published Classic classification');
select public.join_go_hosted_session((select code from classic_room));
select set_config('request.jwt.claim.sub','a2840000-0000-4000-8000-000000000001',true);
select public.start_go_hosted_session((select id from classic_room),
  (select version from public.go_sessions where id=(select id from classic_room)));
select extensions.is((public.get_go_hosted_session((select id from classic_room))
  ->'current_question'->>'position')::integer,1,
  'the selected question is presented as question one of ten');
select extensions.is((public.get_go_hosted_session((select id from classic_room))
  ->'current_question'->>'id')::uuid,
  (select question.id from public.training_questions question
    join public.go_sessions room on room.content_id=question.content_id
    where room.id=(select id from classic_room)
      and question.position=room.question_start_position),
  'snapshot reads the selected block, not the first source question');
select set_config('request.jwt.claim.sub','a2840000-0000-4000-8000-000000000002',true);
select extensions.throws_ok(format($sql$select public.submit_go_hosted_answer(%L::uuid,
  (select id from public.training_questions where content_id=%L::uuid and position=case
    when (select question_start_position from public.go_sessions where id=%L::uuid)=1
      then 11 else 1 end),'0'::jsonb,1)$sql$,
  (select id from classic_room),'d2840000-0000-4000-8000-000000000001',
  (select id from classic_room)), 'P0002',null,
  'a player cannot submit a question from another ten-question block');

do $play$
declare room_id uuid := (select id from classic_room);
  question_id uuid;
  step integer;
begin
  for step in 1..10 loop
    perform set_config('request.jwt.claim.sub',
      'a2840000-0000-4000-8000-000000000002',true);
    question_id := (public.get_go_hosted_session(room_id)->'current_question'->>'id')::uuid;
    perform public.submit_go_hosted_answer(room_id,question_id,'0'::jsonb,step);
    perform set_config('request.jwt.claim.sub',
      'a2840000-0000-4000-8000-000000000001',true);
    perform public.advance_go_hosted_session(room_id,
      (select version from public.go_sessions where id=room_id));
  end loop;
end $play$;
select extensions.is((select status from public.go_sessions
  where id=(select id from classic_room)),'completed',
  'the tenth answer completes the hosted Classic room');
select extensions.is((select result.total_questions from public.training_results result
  join public.go_session_memberships membership on membership.attempt_id=result.attempt_id
  where membership.session_id=(select id from classic_room)),10,
  'the canonical result denominator is ten');
select extensions.is((select sum(total_questions)::integer from public.training_result_topics
  where result_id=(select result.id from public.training_results result
    join public.go_session_memberships membership on membership.attempt_id=result.attempt_id
    where membership.session_id=(select id from classic_room))),10,
  'topic breakdown counts only the selected ten questions');

select * from extensions.finish();
rollback;
