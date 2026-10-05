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
  'agent1.progress@example.test','Agent-1 Progress Staff','Review Staff','active',
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
select id from public.create_training_content_draft('quiz','Identity review game',
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


-- Synthetic identities only; this entire test rolls back.
update public.campaigns set code='auto_warranty_garrett',name='Auto Warranty Garrett'
where id='ca420000-0000-4000-8000-000000000001';
update public.teams set code='asia_team_a',name='Asia Team A'
where id='ea420000-0000-4000-8000-000000000001';
insert into public.agents(id,agent_code,display_name,full_name,team_id)
values ('ac420000-0000-4000-8000-000000000001','2304','María López','María López',
  'ea420000-0000-4000-8000-000000000001');
insert into public.training_learners(id,learner_kind)
values ('1e420000-0000-4000-8000-000000000002','agent');
insert into public.training_agent_learner_links(learner_id,agent_id)
values ('1e420000-0000-4000-8000-000000000002','ac420000-0000-4000-8000-000000000001');
insert into public.agent_sessions(token_hash,agent_id,expires_at)
values (repeat('f',64),'ac420000-0000-4000-8000-000000000001',now()+interval '1 hour');

select is(public.agent_session_profile(repeat('f',64))->>'team_code','asia_team_a',
  'session profile includes canonical team code');
select is(public.agent_session_profile(repeat('f',64))->>'campaign_code','auto_warranty_garrett',
  'session profile includes canonical campaign code');
select is(public.get_staff_agent_profile('2304')->>'campaign_name','Auto Warranty Garrett',
  'Staff profile includes real campaign name');
select is(public.get_staff_agent_profile('2304')->>'display_name','María López',
  'read expansion does not rename the player');
select ok(not (public.get_staff_agent_profile('2304')::text ~ 'token_hash|pin_hash|email|auth_user'),
  'profile contains no credentials or private identity links');
select throws_ok($$select public.agent_session_profile(repeat('a',64))$$,'28000',null,
  'unknown Agent session stays denied');
select throws_ok($$select public.agent_session_profile('bad')$$,'28000',null,
  'malformed session stays denied');
update public.agent_sessions set revoked_at=now() where token_hash=repeat('f',64);
select throws_ok($$select public.agent_session_profile(repeat('f',64))$$,'28000',null,
  'revoked session stays denied');
update public.agent_sessions set revoked_at=null where token_hash=repeat('f',64);

-- One historic Hosted game: retained in All time but outside this week.
insert into public.go_sessions(id,room_code,content_id,status,current_question_position,
  question_count,started_at,completed_at,created_at,expires_at)
select '9e420000-0000-4000-8000-000000000001','KK 4242',content_id,
  'completed',10,10,now()-interval '9 days',now()-interval '8 days',
  now()-interval '9 days',now()-interval '7 days'
from agent1_progress_fixture;
insert into public.go_session_participants(session_id,seat_number,participant_label,status)
values ('9e420000-0000-4000-8000-000000000001',1,'María López','completed');
insert into public.training_attempts(id,learner_id,content_id,source_mode,attempt_number,language,
  started_at)
select '1a420000-0000-4000-8000-000000000001',
  '1e420000-0000-4000-8000-000000000002',content_id,'go_hosted',1,'en',now()-interval '9 days'
from agent1_progress_fixture;
update public.training_attempts set status='completed',completed_at=now()-interval '8 days',duration_seconds=240
where id='1a420000-0000-4000-8000-000000000001';
insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed)
values ('1a420000-0000-4000-8000-000000000001',10,8,80,true);
insert into public.go_session_memberships(session_id,member_kind,seat_number,agent_id,learner_id,attempt_id)
values ('9e420000-0000-4000-8000-000000000001','participant',1,
  'ac420000-0000-4000-8000-000000000001','1e420000-0000-4000-8000-000000000002',
  '1a420000-0000-4000-8000-000000000001');

select is(public.agent_get_go_global_ranking('ac420000-0000-4000-8000-000000000001','all_time')
  ->'your_rank'->>'points','80','historic All time score remains exactly 80');
select is(public.agent_get_go_global_ranking('ac420000-0000-4000-8000-000000000001','all_time')
  ->'top'->0->>'agent_code','2304','ranking exposes Agent ID with the canonical name');
select is(public.agent_get_go_global_ranking('ac420000-0000-4000-8000-000000000001','all_time')
  ->'top'->0->>'team_code','asia_team_a','ranking exposes canonical flag lookup code');
select is(public.agent_get_go_global_ranking('ac420000-0000-4000-8000-000000000001','all_time')
  ->'top'->0->>'campaign_code','auto_warranty_garrett','ranking uses existing Staff campaign tone');
select is(jsonb_array_length(public.agent_get_go_global_ranking(
  'ac420000-0000-4000-8000-000000000001','week')->'top'),0,
  'weekly view filters historic results rather than deleting them');
select is((select count(*) from public.training_results),1::bigint,
  'reading both periods preserves result history');
select is(public.get_staff_agent_profile('2304')->'go'->'competitive'->>'points','80',
  'Staff profile still reads the same persisted Hosted points');
select ok(not has_function_privilege('authenticated','public.agent_session_profile(text)','EXECUTE'),
  'browser cannot call service session read');
select ok(has_function_privilege('service_role','public.agent_session_profile(text)','EXECUTE'),
  'server session read grant preserved');
select ok(not has_function_privilege('anon','public.get_staff_agent_profile(text)','EXECUTE'),
  'anonymous profile read stays denied');
select ok(not has_function_privilege('service_role','public.get_staff_agent_profile(text)','EXECUTE'),
  'service role does not bypass the Staff profile contract');
select ok(has_function_privilege('authenticated','public.get_staff_agent_profile(text)','EXECUTE'),
  'Staff profile grant preserved');
select is((select proowner::regrole::text from pg_proc
  where oid='public.get_staff_agent_profile(text)'::regprocedure),'postgres','function owner remains postgres');
select is((select proconfig[1] from pg_proc
  where oid='public.get_staff_agent_profile(text)'::regprocedure),'search_path=pg_catalog','fixed search path preserved');
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.get_staff_agent_profile('2304')$$,'28000',null,
  'missing Staff identity cannot view an Agent');
select * from finish();
rollback;
