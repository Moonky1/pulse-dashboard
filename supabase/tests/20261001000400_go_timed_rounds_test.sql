-- Run after the 20261001 migrations inside a rollback-only local transaction.
-- All identities and questions below are fictional.
insert into public.departments(id,code,name,is_active) values
  ('da610000-0000-4000-8000-000000000001','go_timed_ops','GO Timed Operations',true);
insert into public.campaigns(id,code,name,is_active) values
  ('ca610000-0000-4000-8000-000000000001','go_timed_campaign','GO Timed Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
  ('ea610000-0000-4000-8000-000000000001','da610000-0000-4000-8000-000000000001',
    'ca610000-0000-4000-8000-000000000001','go_timed_team','GO Timed Team',true);
insert into public.roles(id,key,name,is_active) values
  ('8a610000-0000-4000-8000-000000000001','go_timed_role','GO Timed Role',true);
insert into public.role_scopes(role_id,scope_type) values
  ('8a610000-0000-4000-8000-000000000001','global');
insert into public.role_permissions(role_id,permission_id)
  select '8a610000-0000-4000-8000-000000000001',id from public.permissions
  where key in ('go.host','go.play','studio.view','studio.create','studio.publish');
insert into auth.users(
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
  ('aa610000-0000-4000-8000-000000000001','authenticated','authenticated',
    'go.timed.host@example.test','',now(),'{}','{}',now(),now()),
  ('aa610000-0000-4000-8000-000000000002','authenticated','authenticated',
    'go.timed.player@example.test','',now(),'{}','{}',now(),now());
insert into public.users(
  id,auth_user_id,employee_id,email,full_name,display_name,status,
  department_id,team_id,approved_at
) values
  ('ba610000-0000-4000-8000-000000000001','aa610000-0000-4000-8000-000000000001',
    'KK-986101','go.timed.host@example.test','Fictitious Host','Fictitious Host','active',
    'da610000-0000-4000-8000-000000000001','ea610000-0000-4000-8000-000000000001',now()),
  ('ba610000-0000-4000-8000-000000000002','aa610000-0000-4000-8000-000000000002',
    'KK-986102','go.timed.player@example.test','Fictitious Player','Fictitious Player','active',
    'da610000-0000-4000-8000-000000000001','ea610000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type) values
  ('fa610000-0000-4000-8000-000000000001','ba610000-0000-4000-8000-000000000001',
    '8a610000-0000-4000-8000-000000000001','global'),
  ('fa610000-0000-4000-8000-000000000002','ba610000-0000-4000-8000-000000000002',
    '8a610000-0000-4000-8000-000000000001','global');
insert into public.training_topics(id,code,name,is_active) values
  ('2a610000-0000-4000-8000-000000000001','go_timed_topic','Timed Topic',true);

create temporary table go_timed_fixture(content_id uuid,session_id uuid,attempt_id uuid);
select set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000001',true);
insert into go_timed_fixture(content_id)
  select id from public.create_training_content_draft(
    'quiz','Forty Question Timed Test','Fictitious local-only quiz','en',
    array['2a610000-0000-4000-8000-000000000001'::uuid],
    'global',null,null,'{}'::uuid[]
  );
select * from public.replace_training_questions_v2(
  (select content_id from go_timed_fixture),
  (select jsonb_agg(jsonb_build_object(
    'position',number,'question_type','multiple_choice',
    'prompt','Question ' || number,
    'answer_options',jsonb_build_array('No','Yes'),
    'correct_answer',1,
    'explanation','Explanation for question ' || number,
    'time_limit_seconds',case when number=1 then 10 when number=2 then 20 else 30 end,
    'topic_ids',jsonb_build_array('2a610000-0000-4000-8000-000000000001')
  ) order by number) from generate_series(1,40) number),
  (select updated_at from public.training_content where id=(select content_id from go_timed_fixture))
);
select * from public.publish_training_content(
  (select content_id from go_timed_fixture),
  (select updated_at from public.training_content where id=(select content_id from go_timed_fixture))
);

do $test$
declare
  content_id uuid := (select fixture.content_id from go_timed_fixture fixture);
  room jsonb;
  player_room jsonb;
  timing jsonb;
  practice_timing jsonb;
  practice_response jsonb;
  practice_review jsonb;
  selected_id uuid;
  practice_id uuid;
  n integer;
begin
  if has_function_privilege('anon','public.get_go_practice_completed_review(uuid)','EXECUTE') or
    has_function_privilege('service_role','public.get_go_practice_completed_review(uuid)','EXECUTE') or
    not has_function_privilege('authenticated','public.get_go_practice_completed_review(uuid)','EXECUTE') then
    raise exception 'completed review has an unexpected EXECUTE grant';
  end if;
  if (select count(*) from public.list_go_host_catalog_v2('en',100,0)
      where id=content_id and creator_display='Fictitious Host')<>1 then
    raise exception 'creator credit missing from hosted catalog';
  end if;
  room := public.create_go_hosted_session(content_id);
  update go_timed_fixture set session_id=(room->>'session_id')::uuid;
  if (room->>'question_count')::integer<>10 or
    (select count(*) from public.go_session_round_questions
      where session_id=(room->>'session_id')::uuid)<>10 then
    raise exception 'hosted round did not select exactly ten questions';
  end if;
  perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000002',true);
  player_room := public.join_go_hosted_session(room->>'room_code');
  if player_room->>'viewer_role'<>'participant' then
    raise exception 'fictional player failed to join';
  end if;
  perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000001',true);
  room := public.get_go_hosted_session((room->>'session_id')::uuid);
  room := public.start_go_hosted_session((room->>'session_id')::uuid,(room->>'version')::integer);
  timing := public.get_go_hosted_timing((room->>'session_id')::uuid);
  if (timing->>'deadline_at') is null or
    (room->'current_question'->>'id')::uuid<>(
      select question_id from public.go_session_round_questions
      where session_id=(room->>'session_id')::uuid and round_position=1
    ) then raise exception 'hosted question or deadline mismatch'; end if;
  update public.go_sessions
  set question_started_at=now()-interval '60 seconds',
      question_deadline_at=now()-interval '1 second'
  where id=(room->>'session_id')::uuid;
  perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000002',true);
  begin
    perform public.submit_go_hosted_answer(
      (room->>'session_id')::uuid,(room->'current_question'->>'id')::uuid,'1'::jsonb,1
    );
    raise exception 'late hosted answer was accepted';
  exception when sqlstate '55000' then null;
  end;
  perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000001',true);
  update public.go_sessions
  set question_started_at=now(),question_deadline_at=now()+interval '30 seconds'
  where id=(room->>'session_id')::uuid;
  for n in 1..10 loop
    perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000002',true);
    player_room := public.get_go_hosted_session((room->>'session_id')::uuid);
    player_room := public.submit_go_hosted_answer(
      (room->>'session_id')::uuid,
      (player_room->'current_question'->>'id')::uuid,'1'::jsonb,n
    );
    perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000001',true);
    room := public.get_go_hosted_session((room->>'session_id')::uuid);
    room := public.advance_go_hosted_session((room->>'session_id')::uuid,(room->>'version')::integer);
  end loop;
  if room->>'status'<>'completed' or (room->>'question_count')::integer<>10 then
    raise exception 'hosted ten-question round did not complete';
  end if;

  perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000002',true);
  select attempt_id into practice_id from public.start_training_attempt(content_id,'go_practice');
  update go_timed_fixture set attempt_id=practice_id;
  begin
    perform public.get_go_practice_completed_review(practice_id);
    raise exception 'answer key exposed before practice completion';
  exception when sqlstate 'P0002' then null;
  end;
  practice_timing := public.get_go_practice_timing(practice_id);
  if jsonb_array_length(practice_timing->'question_ids')<>10 then
    raise exception 'practice round did not select exactly ten questions';
  end if;
  for n in 1..10 loop
    select question_id into selected_id from public.go_practice_round_questions
    where attempt_id=practice_id and round_position=n;
    if n=2 then
      update public.go_practice_clocks
      set question_started_at=now()-interval '60 seconds',
          question_deadline_at=now()-interval '1 second'
      where attempt_id=practice_id;
    end if;
    practice_response := public.submit_go_practice_answer(practice_id,selected_id,'1'::jsonb);
  end loop;
  if practice_response->>'completed'<>'true' or
    (practice_response->'result'->>'total_questions')::integer<>10 or
    (practice_response->'result'->>'correct_answers')::integer<>9 then
    raise exception 'practice scoring or timeout is wrong: %',practice_response;
  end if;
  practice_review := public.get_go_practice_completed_review(practice_id);
  if jsonb_array_length(practice_review->'questions')<>10 or
    (practice_review->'questions'->0->>'explanation') not like 'Explanation for question %' or
    (practice_review->'questions'->1->>'is_correct')<>'false' or
    practice_review->'questions'->1->'submitted_answer'<>'null'::jsonb then
    raise exception 'completed practice review is missing answers or explanations';
  end if;
  perform set_config('request.jwt.claim.sub','aa610000-0000-4000-8000-000000000001',true);
  begin
    perform public.get_go_practice_completed_review(practice_id);
    raise exception 'another Staff member read the practice review';
  exception when sqlstate 'P0002' then null;
  end;
end
$test$;
