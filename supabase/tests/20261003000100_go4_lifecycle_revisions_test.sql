begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_function('public','get_my_go_hosted_session',array[]::text[],'host recovery RPC exists');
select has_function('public','create_training_content_revision_v2',array['uuid'],'timing-safe revision RPC exists');
select ok(has_function_privilege('authenticated','public.get_my_go_hosted_session()','EXECUTE'),'Staff can request only their own hosted room');
select ok(not has_function_privilege('anon','public.get_my_go_hosted_session()','EXECUTE'),'anonymous users cannot inspect host rooms');
select ok(not has_function_privilege('anon','public.create_training_content_revision_v2(uuid)','EXECUTE'),'anonymous users cannot edit published games');
select ok(not has_table_privilege('authenticated','public.training_content','UPDATE'),'browser cannot edit published versions directly');

insert into public.roles(id,key,name,is_active) values
  ('8a400000-0000-4000-8000-000000000001','go4_manager','GO-4 fixture manager',true),
  ('8a400000-0000-4000-8000-000000000002','go4_player','GO-4 fixture player',true);
insert into public.role_scopes(role_id,scope_type) values
  ('8a400000-0000-4000-8000-000000000001','global'),
  ('8a400000-0000-4000-8000-000000000002','global');
insert into public.role_permissions(role_id,permission_id)
  select '8a400000-0000-4000-8000-000000000001',id from public.permissions
  where key in ('studio.create','studio.publish','studio.view','academy.manage','go.host','go.play');
insert into public.role_permissions(role_id,permission_id)
  select '8a400000-0000-4000-8000-000000000002',id from public.permissions where key='go.play';
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
  ('aa400000-0000-4000-8000-000000000001','authenticated','authenticated','go4.manager@example.test','',now(),'{}','{}',now(),now()),
  ('aa400000-0000-4000-8000-000000000002','authenticated','authenticated','go4.player@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values
  ('ba400000-0000-4000-8000-000000000001','aa400000-0000-4000-8000-000000000001','go4.manager@example.test','GO-4 Manager','active',now()),
  ('ba400000-0000-4000-8000-000000000002','aa400000-0000-4000-8000-000000000002','go4.player@example.test','GO-4 Player','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type) values
  ('fa400000-0000-4000-8000-000000000001','ba400000-0000-4000-8000-000000000001','8a400000-0000-4000-8000-000000000001','global'),
  ('fa400000-0000-4000-8000-000000000002','ba400000-0000-4000-8000-000000000002','8a400000-0000-4000-8000-000000000002','global');
insert into public.training_topics(id,code,name,is_active) values
  ('2a400000-0000-4000-8000-000000000001','go4_fixture','GO-4 fixture topic',true);

create temporary table go4_fixture(source_id uuid, first_room uuid, second_room uuid, old_attempt uuid, draft_id uuid, new_attempt uuid);
insert into go4_fixture(source_id) values (null);
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000001',true);
update go4_fixture set source_id=(select id from public.create_training_content_draft(
  'quiz','GO-4 fixture game','Original version','en',
  array['2a400000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]));
select lives_ok(format('select public.mark_training_game_canonical(%L::uuid)',(select source_id from go4_fixture)),'authorized manager marks fixture official before publication');
select lives_ok(format($q$select * from public.replace_training_questions_v2(%L::uuid,%L::jsonb,%L::timestamptz)$q$,
  (select source_id from go4_fixture),
  (select jsonb_agg(jsonb_build_object('position',n,'question_type','multiple_choice',
    'prompt','GO-4 question ' || n,'answer_options',jsonb_build_array('No','Yes'),
    'correct_answer',1,'explanation','Version one explanation',
    'topic_ids',jsonb_build_array('2a400000-0000-4000-8000-000000000001'),
    'time_limit_seconds',case when n=1 then 10 else 30 end) order by n)
    from generate_series(1,10) n),
  (select updated_at from public.training_content where id=(select source_id from go4_fixture))),
  'fixture has ten valid timed questions');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',
  (select source_id from go4_fixture),
  (select updated_at from public.training_content where id=(select source_id from go4_fixture))),
  'fixture publishes v1');

update go4_fixture set first_room=(select (public.create_go_hosted_session(source_id)->>'session_id')::uuid from go4_fixture);
select is((public.get_my_go_hosted_session()->>'session_id')::uuid,(select first_room from go4_fixture),'host recovers own waiting room');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000002',true);
select is(public.get_my_go_hosted_session(),null::jsonb,'participant cannot discover host room');
select throws_ok(format('select public.cancel_go_hosted_session(%L::uuid,%s)',
  (select first_room from go4_fixture),
  (select version from public.go_sessions where id=(select first_room from go4_fixture))),
  'P0002','GO room unavailable','participant cannot cancel the host room');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000001',true);
select lives_ok(format('select public.cancel_go_hosted_session(%L::uuid,%s)',
  (select first_room from go4_fixture),
  (select version from public.go_sessions where id=(select first_room from go4_fixture))),
  'host explicitly closes waiting room');
select is((select status from public.go_sessions where id=(select first_room from go4_fixture)),'cancelled','closed room has canonical cancelled status');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000002',true);
select throws_ok(format('select public.join_go_hosted_session(%L)',
  (select room_code from public.go_sessions where id=(select first_room from go4_fixture))),
  'P0002','GO room unavailable','cancelled code cannot be joined');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000001',true);
update go4_fixture set second_room=(select (public.create_go_hosted_session(source_id)->>'session_id')::uuid from go4_fixture);
select isnt((select first_room from go4_fixture),(select second_room from go4_fixture),'same host can create a new room after close');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000002',true);
select lives_ok(format('select public.join_go_hosted_session(%L)',
  (select room_code from public.go_sessions where id=(select second_room from go4_fixture))),
  'player joins new room');
update go4_fixture set old_attempt=(select attempt_id from go4_fixture fixture
  cross join lateral public.start_training_attempt(fixture.source_id,'go_practice'));
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000001',true);
select lives_ok(format('select public.start_go_hosted_session(%L::uuid,%s)',
  (select second_room from go4_fixture),
  (select version from public.go_sessions where id=(select second_room from go4_fixture))),
  'host starts a live game');
select is(public.get_my_go_hosted_session()->>'status','active','live room remains available for reconnect');
select is((select (public.create_go_hosted_session(source_id)->>'session_id')::uuid from go4_fixture),
  (select second_room from go4_fixture),'hosting the same content reopens the live room instead of duplicating it');

select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000002',true);
select throws_ok(format('select * from public.create_training_content_revision_v2(%L::uuid)',(select source_id from go4_fixture)),
  '42501','Studio edit permission required','ordinary Staff cannot edit an official game');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000001',true);
update go4_fixture set draft_id=(select revision.id from go4_fixture fixture
  cross join lateral public.create_training_content_revision_v2(fixture.source_id) revision);
select is((select time_limit_seconds from public.training_questions where content_id=(select draft_id from go4_fixture) and position=1),10,'revision keeps the original per-question timer');
select is((select id from public.create_training_content_revision_v2((select source_id from go4_fixture))),(select draft_id from go4_fixture),'Edit reopens the same update draft');
select throws_ok(format('update public.training_questions set prompt=%L where content_id=%L::uuid and position=1',
  'mutated old answer',(select source_id from go4_fixture)),
  'P0001','questions may be changed only while content is draft','published v1 cannot be edited directly');
select lives_ok(format($q$select * from public.replace_training_questions_v2(%L::uuid,%L::jsonb,%L::timestamptz)$q$,
  (select draft_id from go4_fixture),
  (select jsonb_agg(jsonb_build_object('position',q.position,'question_type',q.question_type,
    'prompt',case when q.position=1 then 'Updated GO-4 question' else q.prompt end,
    'answer_options',q.answer_options,'correct_answer',q.correct_answer,
    'explanation',q.explanation,'topic_ids',jsonb_build_array('2a400000-0000-4000-8000-000000000001'),
    'time_limit_seconds',q.time_limit_seconds) order by q.position)
    from public.training_questions q where q.content_id=(select draft_id from go4_fixture)),
  (select updated_at from public.training_content where id=(select draft_id from go4_fixture))),
  'draft update changes one question safely');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',
  (select draft_id from go4_fixture),
  (select updated_at from public.training_content where id=(select draft_id from go4_fixture))),
  'v2 publishes atomically');
select ok((select is_current from public.training_content where id=(select draft_id from go4_fixture))
  and not (select is_current from public.training_content where id=(select source_id from go4_fixture)),
  'only v2 is current');
select is((select prompt from public.training_questions where content_id=(select source_id from go4_fixture) and position=1),
  'GO-4 question 1','historical v1 question remains unchanged');
select is((select content_id from public.training_attempts where id=(select old_attempt from go4_fixture)),
  (select source_id from go4_fixture),'old practice attempt stays pinned to v1');
select is((select content_id from public.go_sessions where id=(select second_room from go4_fixture)),
  (select source_id from go4_fixture),'active Hosted room stays pinned to v1');
select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000002',true);
update go4_fixture set new_attempt=(select attempt_id from go4_fixture fixture
  cross join lateral public.start_training_attempt(fixture.draft_id,'go_practice'));
select is((select content_id from public.training_attempts where id=(select new_attempt from go4_fixture)),
  (select draft_id from go4_fixture),'new practice attempt uses v2');

select set_config('request.jwt.claim.sub','aa400000-0000-4000-8000-000000000001',true);
select lives_ok(format('select * from public.archive_training_content(%L::uuid)',
  (select draft_id from go4_fixture)),'authorized manager retires the current game');
select ok(not exists(select 1 from public.list_studio_content() listing
  where listing.id=(select draft_id from go4_fixture)),'retired game is hidden from normal Studio library');
select ok(exists(select 1 from public.list_studio_content('archived') listing
  where listing.id=(select draft_id from go4_fixture)),'retired game remains in the explicit Archived view');

select * from finish();
rollback;
