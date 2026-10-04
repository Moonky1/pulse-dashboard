begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(not has_function_privilege('anon','public.agent_start_go_practice(uuid,uuid)','EXECUTE'),
  'anonymous client cannot start a Practice attempt as an Agent');
select ok(not has_function_privilege('authenticated','public.agent_start_go_practice(uuid,uuid)','EXECUTE'),
  'Staff client cannot impersonate an Agent Practice attempt');
select ok(not has_function_privilege('authenticated',
  'public.agent_get_go_practice_completed_review(uuid,uuid)','EXECUTE'),
  'Staff client cannot read another Agent review');

insert into public.departments(id,code,name,is_active)
values ('da450000-0000-4000-8000-000000000001','agent1_practice','Agent-1 Practice Department',true);
insert into public.campaigns(id,code,name,is_active)
values ('ca450000-0000-4000-8000-000000000001','agent1_practice','Agent-1 Practice Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active)
values ('ea450000-0000-4000-8000-000000000001','da450000-0000-4000-8000-000000000001',
  'ca450000-0000-4000-8000-000000000001','agent1_practice','Agent-1 Practice Team',true);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('aa450000-0000-4000-8000-000000000001','authenticated','authenticated',
  'agent1.practice@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at)
values ('ba450000-0000-4000-8000-000000000001','aa450000-0000-4000-8000-000000000001',
  'agent1.practice@example.test','Agent-1 Practice Staff','active',now());
insert into public.user_roles(id,user_id,role_id,scope_type)
values ('fa450000-0000-4000-8000-000000000001','ba450000-0000-4000-8000-000000000001',
  '10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','aa450000-0000-4000-8000-000000000001',true);
insert into public.training_topics(id,code,name,is_active)
values ('2a450000-0000-4000-8000-000000000001','agent1_practice','Agent-1 Practice Topic',true);

create temporary table agent1_practice_fixture(content_id uuid,agent_id uuid,agent_attempt uuid,
  staff_attempt uuid);
insert into agent1_practice_fixture(content_id)
select id from public.create_training_content_draft('quiz','Agent-1 Practice game',
  'Only synthetic test content','en',array['2a450000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]);
select lives_ok(format($q$select * from public.replace_training_questions_v2(%L::uuid,%L::jsonb,%L::timestamptz)$q$,
  (select content_id from agent1_practice_fixture),
  (select jsonb_agg(jsonb_build_object('position',n,'question_type','multiple_choice',
    'prompt','Agent-1 Practice question '||n,'answer_options',jsonb_build_array('No','Yes'),
    'correct_answer',1,'explanation','Synthetic explanation '||n,
    'topic_ids',jsonb_build_array('2a450000-0000-4000-8000-000000000001'),
    'time_limit_seconds',30) order by n) from generate_series(1,10) n),
  (select updated_at from public.training_content where id=(select content_id from agent1_practice_fixture))),
  'Practice fixture has ten questions');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',
  (select content_id from agent1_practice_fixture),
  (select updated_at from public.training_content where id=(select content_id from agent1_practice_fixture))),
  'Practice fixture publishes');
update agent1_practice_fixture set agent_id=public.admin_provision_agent('3250','QA Agent 3250',
  'ea450000-0000-4000-8000-000000000001','123456');

select is(jsonb_array_length(public.agent_list_go_practice_catalog(
  (select agent_id from agent1_practice_fixture),'en')),1,
  'Agent sees only eligible published catalog game');
select ok(not (public.agent_get_go_practice_content(
  (select agent_id from agent1_practice_fixture),
  (select content_id from agent1_practice_fixture))::text like '%correct_answer%'),
  'Practice content omits answer keys before completion');
select ok(not (public.agent_get_go_practice_content(
  (select agent_id from agent1_practice_fixture),
  (select content_id from agent1_practice_fixture))::text like '%explanation%'),
  'Practice content omits explanations before completion');

update agent1_practice_fixture set agent_attempt=(select attempt_id
  from public.agent_start_go_practice(agent_id,content_id));
select is((select count(*) from public.go_practice_round_questions selected
  where selected.attempt_id=(select agent_attempt from agent1_practice_fixture)),
  10::bigint,'Agent Practice receives exactly ten server-selected questions');
select throws_ok($$select public.agent_get_go_practice_timing(gen_random_uuid(),
  (select agent_attempt from agent1_practice_fixture))$$,'P0002',null,
  'another Agent cannot read this Practice attempt');
select throws_ok($$select public.agent_submit_go_practice_answer(
  (select agent_id from agent1_practice_fixture),
  (select agent_attempt from agent1_practice_fixture),gen_random_uuid(),'1'::jsonb)$$,
  '55000',null,'forged question is rejected');

do $round$
declare player uuid := (select agent_id from agent1_practice_fixture);
  attempt uuid := (select agent_attempt from agent1_practice_fixture);
  question uuid; position integer; outcome jsonb;
begin
  for position in 1..10 loop
    select selected.question_id into question from public.go_practice_round_questions selected
    where selected.attempt_id=attempt and selected.round_position=position;
    outcome := public.agent_submit_go_practice_answer(player,attempt,question,'1'::jsonb);
    if outcome->>'answer_feedback'<>'correct' then
      raise exception 'expected correct Agent feedback';
    end if;
  end loop;
end
$round$;
select is((select status from public.training_attempts
  where id=(select agent_attempt from agent1_practice_fixture)),
  'completed','Agent Practice attempt completes and persists');
select is((select score_percent from public.training_results
  where attempt_id=(select agent_attempt from agent1_practice_fixture)),
  100.00::numeric,'Agent Practice score is calculated on server');
select is(jsonb_array_length(public.agent_get_go_practice_completed_review(
  (select agent_id from agent1_practice_fixture),
  (select agent_attempt from agent1_practice_fixture))->'questions'),10,
  'Agent completed review includes all ten explanations');
select is(public.agent_get_go_progress((select agent_id from agent1_practice_fixture))
  ->>'practice_games','1','Agent Practice history persists');
select is(public.agent_get_go_global_ranking((select agent_id from agent1_practice_fixture),
  'all_time')->>'your_rank',null::text,'Practice does not create a competitive rank');

update agent1_practice_fixture set staff_attempt=(select attempt_id
  from public.start_training_attempt(content_id,'go_practice'));
do $staff$
declare attempt uuid := (select staff_attempt from agent1_practice_fixture);
  question uuid; position integer;
begin
  for position in 1..10 loop
    select selected.question_id into question from public.go_practice_round_questions selected
    where selected.attempt_id=attempt and selected.round_position=position;
    perform public.submit_go_practice_answer_with_feedback(attempt,question,'1'::jsonb);
  end loop;
end
$staff$;
select is((select score_percent from public.training_results
  where attempt_id=(select staff_attempt from agent1_practice_fixture)),
  100.00::numeric,'existing Staff Practice still uses the shared scoring engine');

select * from finish();
rollback;
