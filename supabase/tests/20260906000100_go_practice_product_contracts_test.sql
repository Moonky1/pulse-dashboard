begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Narrow surface and deny-by-default security.
select has_function('public','get_go_capabilities','GO capability contract exists');
select has_function('public','list_go_practice_catalog',array['text','uuid','integer','integer'],'GO Practice catalog contract exists');
select is((select proowner::regrole::text from pg_proc where oid='public.get_go_capabilities()'::regprocedure),'postgres','capability owner is postgres');
select ok((select prosecdef from pg_proc where oid='public.get_go_capabilities()'::regprocedure),'capability contract is SECURITY DEFINER');
select is((select proconfig[1] from pg_proc where oid='public.get_go_capabilities()'::regprocedure),'search_path=pg_catalog','capability contract fixes search_path');
select ok(has_function_privilege('authenticated','public.get_go_capabilities()','EXECUTE'),'authenticated may read GO capabilities');
select ok(not has_function_privilege('anon','public.get_go_capabilities()','EXECUTE'),'anon cannot read GO capabilities');
select ok(not has_function_privilege('public','public.get_go_capabilities()','EXECUTE'),'PUBLIC cannot read GO capabilities');
select ok(has_function_privilege('authenticated','public.list_go_practice_catalog(text,uuid,integer,integer)','EXECUTE'),'authenticated may read Practice catalog');
select ok(not has_function_privilege('anon','public.list_go_practice_catalog(text,uuid,integer,integer)','EXECUTE'),'anon cannot read Practice catalog');
select ok(not has_function_privilege('service_role','public.list_go_practice_catalog(text,uuid,integer,integer)','EXECUTE'),'browser contract has no service-role dependency');
select ok((select indexprs is null and indpred is not null from pg_index where indexrelid='public.training_attempts_one_active_per_mode'::regclass),'one-active-attempt protection is a partial plain-column index');
select matches(pg_get_expr((select indpred from pg_index where indexrelid='public.training_attempts_one_active_per_mode'::regclass),'public.training_attempts'::regclass),'go_practice','active-attempt uniqueness is scoped only to GO Practice');
select ok((select prosecdef from pg_proc where oid='pulse_private.require_staff_learner_link()'::regprocedure),'deferred Staff learner integrity trigger retains postgres identity at commit');
select is((select proowner::regrole::text from pg_proc where oid='pulse_private.require_staff_learner_link()'::regprocedure),'postgres','deferred learner trigger owner remains postgres');
select is((select proconfig[1] from pg_proc where oid='pulse_private.require_staff_learner_link()'::regprocedure),'search_path=pg_catalog','deferred learner trigger keeps fixed search path');
select ok(not has_function_privilege('authenticated','pulse_private.require_staff_learner_link()','EXECUTE'),'browser cannot invoke deferred learner trigger directly');

-- Entirely fictitious, transactional Staff and Training fixtures.
insert into public.departments(id,code,name,is_active) values
 ('dc100000-0000-4000-8000-000000000001','go1a_ops','GO-1A Operations',true);
insert into public.campaigns(id,code,name,is_active) values
 ('cc100000-0000-4000-8000-000000000001','go1a_campaign','GO-1A Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('ec100000-0000-4000-8000-000000000001','dc100000-0000-4000-8000-000000000001','cc100000-0000-4000-8000-000000000001','go1a_team','GO-1A Team',true);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('ac100000-0000-4000-8000-000000000001','authenticated','authenticated','go1a.author@example.test','',now(),'{}','{}',now(),now()),
 ('ac100000-0000-4000-8000-000000000002','authenticated','authenticated','go1a.player@example.test','',now(),'{}','{}',now(),now()),
 ('ac100000-0000-4000-8000-000000000003','authenticated','authenticated','go1a.denied@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,team_id,approved_at) values
 ('bc100000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000001','KK-961001','go1a.author@example.test','GO-1A Author','active','dc100000-0000-4000-8000-000000000001','ec100000-0000-4000-8000-000000000001',now()),
 ('bc100000-0000-4000-8000-000000000002','ac100000-0000-4000-8000-000000000002','KK-961002','go1a.player@example.test','GO-1A Player','active','dc100000-0000-4000-8000-000000000001','ec100000-0000-4000-8000-000000000001',now()),
 ('bc100000-0000-4000-8000-000000000003','ac100000-0000-4000-8000-000000000003','KK-961003','go1a.denied@example.test','GO-1A Denied','active','dc100000-0000-4000-8000-000000000001','ec100000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type) values
 ('fc100000-0000-4000-8000-000000000001','bc100000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
 ('fc100000-0000-4000-8000-000000000003','bc100000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000001','global');
insert into public.user_roles(id,user_id,role_id,scope_type,team_id) values
 ('fc100000-0000-4000-8000-000000000002','bc100000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000003','team','ec100000-0000-4000-8000-000000000001');
insert into public.training_topics(id,code,name,is_active) values
 ('2c100000-0000-4000-8000-000000000001','go1a_topic','GO-1A Topic',true);

create temporary table go1a_content(content_id uuid primary key);
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
insert into go1a_content(content_id)
select id from public.create_training_content_draft(
  'quiz','GO-1A Three Question Practice','Fictitious Practice certification','en',
  array['2c100000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]
);
select lives_ok(format($q$select * from public.replace_training_questions(%L::uuid,'[{"position":1,"question_type":"multiple_choice","prompt":"Choose Pulse","answer_options":["Other","Pulse"],"correct_answer":1,"explanation":"private","topic_ids":["2c100000-0000-4000-8000-000000000001"]},{"position":2,"question_type":"true_false","prompt":"Pulse is server scored","answer_options":[],"correct_answer":true,"topic_ids":["2c100000-0000-4000-8000-000000000001"]},{"position":3,"question_type":"text","prompt":"Type Pulse","answer_options":[],"correct_answer":["Pulse"],"topic_ids":["2c100000-0000-4000-8000-000000000001"]}]'::jsonb,%L::timestamptz)$q$,(select content_id from go1a_content),(select updated_at from public.training_content where id=(select content_id from go1a_content))),'three supported Practice question types are accepted');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',(select content_id from go1a_content),(select updated_at from public.training_content where id=(select content_id from go1a_content))),'fictitious Practice content publishes canonically');

-- Capabilities and protected catalog are permission-driven.
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
select is(public.get_go_capabilities()->>'can_practice','true','go.play resolves can_practice');
select is(public.get_go_capabilities()->>'can_host','true','go.host resolves can_host independently');
select is((select count(*) from public.list_go_practice_catalog(null,null,100,0)),1::bigint,'eligible player sees the one published scored item');
select is((select count(*) from public.list_go_practice_catalog('es',null,100,0)),0::bigint,'language filter is server-enforced');
select is((select count(*) from public.list_go_practice_catalog('en','2c100000-0000-4000-8000-000000000001',100,0)),1::bigint,'topic filter is server-enforced');
select ok(not ((select to_jsonb(item) from public.list_go_practice_catalog(null,null,100,0) item)::text ~ 'correct_answer|explanation'),'catalog exposes no answer key or explanation');
select ok(not (public.get_go_practice_content((select content_id from go1a_content))::text ~ 'correct_answer|private'),'Practice payload exposes no answer key or explanation');
select is(jsonb_array_length(public.get_go_practice_content((select content_id from go1a_content))->'questions'),3,'Practice payload returns all three safe question projections');

select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000003',true);
select is(public.get_go_capabilities()->>'can_practice','false','role without go.play cannot practice');
select is(public.get_go_capabilities()->>'can_host','false','role without go.host cannot host');
select throws_ok($$select * from public.list_go_practice_catalog(null,null,100,0)$$,'42501',null,'missing go.play cannot list Practice content');
update public.users set status='inactive' where id='bc100000-0000-4000-8000-000000000003';
select throws_ok($$select public.get_go_capabilities()$$,'42501',null,'inactive Staff is denied GO capabilities');
update public.users set status='blocked' where id='bc100000-0000-4000-8000-000000000003';
select throws_ok($$select public.get_go_capabilities()$$,'42501',null,'blocked Staff is denied GO capabilities');

-- Start, reload/resume, server scoring, own history, and Practice Again.
create temporary table go1a_attempts(label text primary key,attempt_id uuid);
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
insert into go1a_attempts values ('first',(select attempt_id from public.start_training_attempt((select content_id from go1a_content),'go_practice')));
insert into go1a_attempts values ('reload',(select attempt_id from public.start_training_attempt((select content_id from go1a_content),'go_practice')));
select is((select attempt_id from go1a_attempts where label='reload'),(select attempt_id from go1a_attempts where label='first'),'reload safely resumes the active Practice attempt');
select is((select count(*) from public.training_attempts attempt join public.training_staff_learner_links link on link.learner_id=attempt.learner_id where link.staff_user_id='bc100000-0000-4000-8000-000000000002' and attempt.status='started'),1::bigint,'reload creates no duplicate active attempt');
select is((select attempt_number from public.training_attempts where id=(select attempt_id from go1a_attempts where label='first')),1,'server allocates first attempt number');
select lives_ok(format($q$select * from public.complete_training_attempt(%L::uuid,(select jsonb_agg(jsonb_build_object('question_id',q.id,'answer',case q.question_type when 'multiple_choice' then '1'::jsonb when 'true_false' then 'false'::jsonb else '"Pulse"'::jsonb end) order by q.position) from public.training_questions q where q.content_id=%L::uuid),12)$q$,(select attempt_id from go1a_attempts where label='first'),(select content_id from go1a_content)),'server completes MC, true/false, and text answers atomically');
select is((select correct_answers from public.training_results where attempt_id=(select attempt_id from go1a_attempts where label='first')),2,'server calculates exact correct count');
select is((select score_percent from public.training_results where attempt_id=(select attempt_id from go1a_attempts where label='first')),66.67::numeric,'server calculates score with no client score input');
select is((select count(*) from public.training_attempt_answers where attempt_id=(select attempt_id from go1a_attempts where label='first')),3::bigint,'all structured answers persist once');
select is((select count(*) from public.list_my_training_results(50)),1::bigint,'player sees exactly own completed result');
insert into go1a_attempts values ('again',(select attempt_id from public.start_training_attempt((select content_id from go1a_content),'go_practice')));
select isnt((select attempt_id from go1a_attempts where label='again'),(select attempt_id from go1a_attempts where label='first'),'Practice Again starts a new attempt after completion');
select is((select attempt_number from public.training_attempts where id=(select attempt_id from go1a_attempts where label='again')),2,'Practice Again receives the next server attempt number');
select is((select count(*) from public.training_results where attempt_id=(select attempt_id from go1a_attempts where label='first')),1::bigint,'Practice Again preserves prior result history');
select throws_ok(format($q$select * from public.complete_training_attempt(%L::uuid,'[]'::jsonb,1)$q$,(select attempt_id from go1a_attempts where label='first')),'55000',null,'completed attempt cannot be overwritten');

-- Direct browser reads/writes remain denied.
set local role authenticated;
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
select throws_ok($$select count(*) from public.training_questions$$,'42501',null,'browser cannot read protected answer-key table');
select throws_ok($$insert into public.training_attempts(learner_id,content_id,source_mode,attempt_number,language) values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','go_practice',1,'en')$$,'42501',null,'browser cannot forge an attempt');
reset role;

select is((select count(*) from public.training_learners where learner_kind <> 'staff'),0::bigint,'GO-1A creates no Agent identity');
select ok(to_regclass('public.go_rooms') is null and to_regclass('public.game_rooms') is null,'GO-1A creates no fake hosted-room model');
select * from finish();
rollback;
