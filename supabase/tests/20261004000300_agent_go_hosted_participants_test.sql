begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(not has_function_privilege('anon','public.agent_join_go_hosted_session(uuid,text)','EXECUTE'),
  'anonymous client cannot claim an Agent seat');
select ok(not has_function_privilege('authenticated','public.agent_join_go_hosted_session(uuid,text)','EXECUTE'),
  'Staff client cannot claim an Agent seat');
select ok(not has_function_privilege('anon','public.agent_submit_go_hosted_answer(uuid,uuid,uuid,jsonb,integer)','EXECUTE'),
  'anonymous client cannot submit an Agent answer');
select ok(not has_table_privilege('authenticated','public.go_session_memberships','SELECT'),
  'Agent membership identity stays private');

insert into public.departments(id,code,name,is_active)
values ('da430000-0000-4000-8000-000000000001','agent1_host','Agent-1 Hosted Department',true);
insert into public.campaigns(id,code,name,is_active)
values ('ca430000-0000-4000-8000-000000000001','agent1_host','Agent-1 Hosted Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active)
values ('ea430000-0000-4000-8000-000000000001','da430000-0000-4000-8000-000000000001',
  'ca430000-0000-4000-8000-000000000001','agent1_host','Agent-1 Hosted Team',true);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('aa430000-0000-4000-8000-000000000001','authenticated','authenticated',
  'agent1.host@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at)
values ('ba430000-0000-4000-8000-000000000001','aa430000-0000-4000-8000-000000000001',
  'agent1.host@example.test','Agent-1 Staff Host','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type)
values ('fa430000-0000-4000-8000-000000000001','ba430000-0000-4000-8000-000000000001',
  '10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','aa430000-0000-4000-8000-000000000001',true);
insert into public.training_topics(id,code,name,is_active)
values ('2a430000-0000-4000-8000-000000000001','agent1_host','Agent-1 Hosted Topic',true);

create temporary table agent1_host_fixture(content_id uuid,session_id uuid);
insert into agent1_host_fixture(content_id)
select id from public.create_training_content_draft('quiz','Agent-1 hosted game',
  'Only synthetic test content','en',array['2a430000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]);
select lives_ok(format($q$select * from public.replace_training_questions_v2(%L::uuid,%L::jsonb,%L::timestamptz)$q$,
  (select content_id from agent1_host_fixture),
  (select jsonb_agg(jsonb_build_object('position',n,'question_type','multiple_choice',
    'prompt','Agent-1 hosted question '||n,'answer_options',jsonb_build_array('No','Yes'),
    'correct_answer',1,'explanation','Synthetic explanation',
    'topic_ids',jsonb_build_array('2a430000-0000-4000-8000-000000000001'),
    'time_limit_seconds',30) order by n) from generate_series(1,10) n),
  (select updated_at from public.training_content where id=(select content_id from agent1_host_fixture))),
  'hosted fixture has ten questions');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',
  (select content_id from agent1_host_fixture),
  (select updated_at from public.training_content where id=(select content_id from agent1_host_fixture))),
  'hosted fixture publishes');
select public.admin_provision_agent('3248','QA Agent 3248',
  'ea430000-0000-4000-8000-000000000001','123456');
select public.admin_provision_agent('3249','QA Agent 3249',
  'ea430000-0000-4000-8000-000000000001','123456');
update agent1_host_fixture set session_id=(select (public.create_go_hosted_session(content_id)->>'session_id')::uuid
  from agent1_host_fixture);

select is(public.agent_join_go_hosted_session((select id from public.agents where agent_code='3248'),
  (select room_code from public.go_sessions where id=(select session_id from agent1_host_fixture)))
  ->>'viewer_role','participant','first Agent joins as a player without Staff identity');
select is(public.agent_join_go_hosted_session((select id from public.agents where agent_code='3249'),
  (select room_code from public.go_sessions where id=(select session_id from agent1_host_fixture)))
  ->>'participant_count','2','second Agent joins same Hosted room');
select is((select count(*) from public.go_session_memberships member
  where member.session_id=(select session_id from agent1_host_fixture)
    and member.member_kind='participant' and member.staff_user_id is null and member.agent_id is not null),
  2::bigint,'both participant identities remain Agent-only');
select is((public.agent_get_go_hosted_session((select id from public.agents where agent_code='3248'),
  (select session_id from agent1_host_fixture))->'participants'->0->>'team'),
  'Agent-1 Hosted Team','lobby team derives from canonical relationship');
select throws_ok($$select public.agent_get_go_hosted_session(gen_random_uuid(),
  (select session_id from agent1_host_fixture))$$,'P0002',null,
  'unrelated Agent cannot read another learner room');

select lives_ok(format('select public.start_go_hosted_session(%L::uuid,%s)',
  (select session_id from agent1_host_fixture),
  (select version from public.go_sessions where id=(select session_id from agent1_host_fixture))),
  'Staff host starts a room with Agent learners');
select is((select count(*) from public.training_attempts attempt
  join public.go_session_memberships member on member.attempt_id=attempt.id
  where member.session_id=(select session_id from agent1_host_fixture)
    and member.agent_id is not null and attempt.source_mode='go_hosted'),
  2::bigint,'both Agents receive canonical Hosted attempts');
select throws_ok(format($q$select public.agent_submit_go_hosted_answer(%L::uuid,%L::uuid,%L::uuid,'1'::jsonb,1)$q$,
  (select id from public.agents where agent_code='3248'),
  (select session_id from agent1_host_fixture),gen_random_uuid()),
  'P0002',null,'Agent cannot answer a forged question');

do $round$
declare room_id uuid := (select session_id from agent1_host_fixture);
  first_agent uuid := (select id from public.agents where agent_code='3248');
  second_agent uuid := (select id from public.agents where agent_code='3249');
  current_question uuid; position integer; room_version integer;
begin
  for position in 1..10 loop
    select selected.question_id into current_question
    from public.go_session_round_questions selected
    where selected.session_id=room_id and selected.round_position=position;
    if current_question is null then
      select question.id into current_question from public.training_questions question
      where question.content_id=(select content_id from agent1_host_fixture)
        and question.position=position;
    end if;
    perform public.agent_submit_go_hosted_answer(first_agent,room_id,current_question,'1'::jsonb,position);
    perform public.agent_submit_go_hosted_answer(second_agent,room_id,current_question,'0'::jsonb,position);
    select version into room_version from public.go_sessions where id=room_id;
    perform public.advance_go_hosted_session(room_id,room_version);
  end loop;
end
$round$;

select is((select status from public.go_sessions where id=(select session_id from agent1_host_fixture)),
  'completed','Hosted room finishes through existing Staff finalizer');
select is((select count(*) from public.training_results result
  join public.go_session_memberships member on member.attempt_id=result.attempt_id
  where member.session_id=(select session_id from agent1_host_fixture)),
  2::bigint,'server writes exactly one result per Agent learner');
select is((public.agent_get_go_hosted_session((select id from public.agents where agent_code='3248'),
  (select session_id from agent1_host_fixture))->'my_result'->>'score_percent'),
  '100.00','Agent sees only their own server-scored result');
select is((public.agent_get_go_global_ranking((select id from public.agents where agent_code='3248'),
  'all_time')->'your_rank'->>'points'),'100',
  'Agent Hosted score contributes normalized points once');
select is((public.agent_get_go_global_ranking((select id from public.agents where agent_code='3249'),
  'all_time')->'your_rank'->>'points'),'0',
  'incorrect Agent answers earn zero points');
select is(public.agent_get_go_progress((select id from public.agents where agent_code='3248'))
  ->>'hosted_games','1','Agent progress persists the Hosted game');

select * from finish();
rollback;
