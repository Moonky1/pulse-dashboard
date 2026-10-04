begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(not has_function_privilege('anon','public.get_go_global_ranking(text)','EXECUTE'),
  'anonymous browser cannot read company ranking');
select ok(not has_function_privilege('authenticated','public.agent_get_go_global_ranking(uuid,text)','EXECUTE'),
  'Staff browser cannot impersonate Agent ranking request');
select ok(not has_function_privilege('authenticated','public.agent_get_go_progress(uuid)','EXECUTE'),
  'Staff browser cannot impersonate Agent progress request');

insert into public.departments(id,code,name,is_active)
values ('da420000-0000-4000-8000-000000000001','agent1_progress','Agent-1 Progress Department',true);
insert into public.campaigns(id,code,name,is_active)
values ('ca420000-0000-4000-8000-000000000001','agent1_progress','Agent-1 Progress Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active)
values ('ea420000-0000-4000-8000-000000000001','da420000-0000-4000-8000-000000000001',
  'ca420000-0000-4000-8000-000000000001','agent1_progress','Agent-1 Progress Team',true);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('aa420000-0000-4000-8000-000000000001','authenticated','authenticated',
  'agent1.progress@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,email,full_name,display_name,status,team_id,department_id,approved_at)
values ('ba420000-0000-4000-8000-000000000001','aa420000-0000-4000-8000-000000000001',
  'agent1.progress@example.test','Agent-1 Progress Staff','QA Staff','active',
  'ea420000-0000-4000-8000-000000000001','da420000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type)
values ('fa420000-0000-4000-8000-000000000001','ba420000-0000-4000-8000-000000000001',
  '10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','aa420000-0000-4000-8000-000000000001',true);
insert into public.training_learners(id,learner_kind)
values ('1e420000-0000-4000-8000-000000000001','staff');
insert into public.training_staff_learner_links(learner_id,staff_user_id)
values ('1e420000-0000-4000-8000-000000000001','ba420000-0000-4000-8000-000000000001');
insert into public.training_topics(id,code,name,is_active)
values ('2a420000-0000-4000-8000-000000000001','agent1_progress','Agent-1 Progress Topic',true);

create temporary table agent1_progress_fixture(content_id uuid);
insert into agent1_progress_fixture(content_id)
select id from public.create_training_content_draft('quiz','Agent-1 QA game',
  'Only synthetic test content','en',array['2a420000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]);
select lives_ok(format($q$select * from public.replace_training_questions_v2(%L::uuid,%L::jsonb,%L::timestamptz)$q$,
  (select content_id from agent1_progress_fixture),
  (select jsonb_agg(jsonb_build_object('position',n,'question_type','multiple_choice',
    'prompt','Agent-1 question '||n,'answer_options',jsonb_build_array('No','Yes'),
    'correct_answer',1,'explanation','Synthetic explanation',
    'topic_ids',jsonb_build_array('2a420000-0000-4000-8000-000000000001'),
    'time_limit_seconds',30) order by n) from generate_series(1,10) n),
  (select updated_at from public.training_content where id=(select content_id from agent1_progress_fixture))),
  'ten-question synthetic game is authorable');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',
  (select content_id from agent1_progress_fixture),
  (select updated_at from public.training_content where id=(select content_id from agent1_progress_fixture))),
  'synthetic game is published only in rolled-back test transaction');

insert into public.go_sessions(id,room_code,content_id,status,current_question_position,
  question_count,started_at,completed_at,created_at,expires_at)
select '9e420000-0000-4000-8000-000000000001','KK 4242',content_id,
  'completed',10,10,now()-interval '4 minutes',now(),
  now()-interval '5 minutes',now()+interval '2 hours'
from agent1_progress_fixture;
insert into public.go_session_participants(session_id,seat_number,participant_label,status)
values ('9e420000-0000-4000-8000-000000000001',1,'QA Staff','completed');
insert into public.training_attempts(id,learner_id,content_id,source_mode,attempt_number,language,
  started_at)
select '1a420000-0000-4000-8000-000000000001',
  '1e420000-0000-4000-8000-000000000001',content_id,'go_hosted',1,'en',now()-interval '4 minutes'
from agent1_progress_fixture;
update public.training_attempts set status='completed',completed_at=now(),duration_seconds=240
where id='1a420000-0000-4000-8000-000000000001';
insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed)
values ('1a420000-0000-4000-8000-000000000001',10,8,80,true);
insert into public.go_session_memberships(session_id,member_kind,seat_number,staff_user_id,learner_id,attempt_id)
values ('9e420000-0000-4000-8000-000000000001','participant',1,
  'ba420000-0000-4000-8000-000000000001','1e420000-0000-4000-8000-000000000001',
  '1a420000-0000-4000-8000-000000000001');

select is(public.get_go_global_ranking('all_time')->'your_rank'->>'points','80',
  'one eight-of-ten Hosted round earns 80 normalized points');
select is(public.get_go_global_ranking('week')->'your_rank'->>'rank','1',
  'weekly ranking uses server UTC period and includes current Hosted result');
select is(public.get_go_global_ranking('all_time')->'top'->0->>'team',
  'Agent-1 Progress Team','ranking team comes from canonical Staff relationship');
select throws_ok($$select public.get_go_global_ranking('yesterday')$$,'22023',null,
  'unsupported period is rejected');
select throws_ok($$insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed)
  values ('1a420000-0000-4000-8000-000000000001',10,8,80,true)$$,'23505',null,
  'retry cannot duplicate a completed Hosted result');

insert into public.training_attempts(id,learner_id,content_id,source_mode,attempt_number,language)
select '1a420000-0000-4000-8000-000000000002',
  '1e420000-0000-4000-8000-000000000001',content_id,'go_practice',1,'en'
from agent1_progress_fixture;
update public.training_attempts set status='completed',completed_at=now(),duration_seconds=120
where id='1a420000-0000-4000-8000-000000000002';
insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed)
values ('1a420000-0000-4000-8000-000000000002',10,10,100,true);
select is(public.get_go_global_ranking('all_time')->'your_rank'->>'points','80',
  'Practice result cannot farm competitive points');
select is(public.get_my_go_progress()->>'practice_games','1',
  'Practice persists in the same canonical learner history');
select is(public.get_my_go_progress()->>'hosted_games','1',
  'Hosted result persists in canonical learner history');
select is(public.get_my_go_progress()->>'average_accuracy','90.00',
  'profile accuracy uses canonical scored results');
select is(public.get_my_go_progress()->'recent_activity'->0->>'game_version','1',
  'history retains the immutable game version');

select * from finish();
rollback;
