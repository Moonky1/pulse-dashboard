-- SIM-1: only disposable/local. Every synthetic row rolls back.
begin;
select no_plan();
select ok((select relrowsecurity from pg_class where oid='public.training_simulation_steps'::regclass),'steps have deny-default RLS');
select ok(not has_table_privilege('authenticated','public.training_simulation_steps','SELECT'),'browser cannot retrieve expected answers');
select ok(not has_table_privilege('authenticated','public.training_simulation_attempts','UPDATE'),'browser cannot manufacture progress');
select ok(not has_table_privilege('anon','public.training_simulation_events','SELECT'),'anonymous clients cannot see history');
select ok(not has_function_privilege('authenticated','public.agent_start_simulation(uuid,uuid,boolean)','EXECUTE'),'Staff cannot impersonate Agents');
select ok(has_function_privilege('service_role','public.agent_start_simulation(uuid,uuid,boolean)','EXECUTE'),'trusted server has Agent contract');
select ok(not has_function_privilege('anon','public.start_simulation(uuid,boolean)','EXECUTE'),'anonymous start denied');
select ok(not has_function_privilege('service_role','public.create_simulation_draft(text,text,text,uuid[],text,uuid,uuid,uuid[])','EXECUTE'),'Agent server cannot author');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and proname like '%simulation%' and (not prosecdef or proowner<>'postgres'::regrole
    or not ('search_path=pg_catalog'=any(proconfig)))),0::bigint,'new RPCs are definer-owned and search-path fixed');

insert into public.departments(id,code,name) values('d0610000-0000-4000-8000-000000000001','sim1_test','SIM-1 Synthetic Department');
insert into public.campaigns(id,code,name) values('c0610000-0000-4000-8000-000000000001','sim1_test','SIM-1 Synthetic Campaign');
insert into public.teams(id,department_id,campaign_id,code,name) values
  ('e0610000-0000-4000-8000-000000000001','d0610000-0000-4000-8000-000000000001','c0610000-0000-4000-8000-000000000001','sim1_test_a','SIM-1 Synthetic Team A'),
  ('e0610000-0000-4000-8000-000000000002','d0610000-0000-4000-8000-000000000001','c0610000-0000-4000-8000-000000000001','sim1_test_b','SIM-1 Synthetic Team B');
insert into auth.users(id,aud,role,email,created_at,updated_at) values
  ('a0610000-0000-4000-8000-000000000001','authenticated','authenticated','sim1.author@example.test',now(),now()),
  ('a0610000-0000-4000-8000-000000000002','authenticated','authenticated','sim1.other@example.test',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values
  ('b0610000-0000-4000-8000-000000000001','a0610000-0000-4000-8000-000000000001','sim1.author@example.test','SIM-1 Test Author','active',now()),
  ('b0610000-0000-4000-8000-000000000002','a0610000-0000-4000-8000-000000000002','sim1.other@example.test','SIM-1 Test Other','active',now());
update public.users set team_id='e0610000-0000-4000-8000-000000000001',department_id='d0610000-0000-4000-8000-000000000001'
  where id in ('b0610000-0000-4000-8000-000000000001','b0610000-0000-4000-8000-000000000002');
insert into public.user_roles(user_id,role_id,scope_type) values
  ('b0610000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
  ('b0610000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000010','global');
insert into public.training_topics(id,code,name) values('20610000-0000-4000-8000-000000000001','sim1_test','SIM-1 Test Topic');
insert into public.agents(id,agent_code,display_name,team_id) values
  ('30610000-0000-4000-8000-000000000001','99106101','Test One','e0610000-0000-4000-8000-000000000001'),
  ('30610000-0000-4000-8000-000000000002','99106102','Test Two','e0610000-0000-4000-8000-000000000001'),
  ('30610000-0000-4000-8000-000000000003','99106103','Test Outside','e0610000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','a0610000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
create temporary table sim_fixture(content_id uuid,staff_attempt uuid,agent_attempt uuid,revision uuid,snapshot jsonb);
insert into sim_fixture(content_id) select (public.create_simulation_draft('Synthetic Callback','Only local synthetic content','en',
  array['20610000-0000-4000-8000-000000000001'::uuid],'team',null,'e0610000-0000-4000-8000-000000000001','{}')->>'id')::uuid;
select is((select content_type from public.training_content where id=(select content_id from sim_fixture)),'simulation','simulation is canonical Training content');
select throws_ok($q$select public.create_simulation_draft('Invalid topic',null,'en',array['20610000-0000-4000-8000-000000000099'::uuid],'global')$q$,
  '22023',null,'unknown topic rejected instead of inferred');
select throws_ok($q$select public.start_simulation((select content_id from sim_fixture))$q$,'P0002',null,'draft cannot be played');
select throws_ok($q$select public.publish_training_content((select content_id from sim_fixture),(select updated_at from public.training_content where id=(select content_id from sim_fixture)))$q$,
  '22023',null,'generic publish cannot bypass simulation completeness');
-- Only metadata fixture, not a real Storage object. Transport tested separately.
insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,
  byte_size,width_px,height_px,sha256,upload_key,status,finalized_at)
select '40610000-0000-4000-8000-000000000001','image','training-media','simulation/test-screen.png','image/png',
  'b0610000-0000-4000-8000-000000000001','simulation_screen',content_id,500,1000,700,repeat('a',64),gen_random_uuid(),'ready',now() from sim_fixture;
create temporary table sim_steps as select jsonb_build_array(
  jsonb_build_object('interaction','info','prompt','Verify YOU ARE PAUSED','hint','Read the yellow status area','success_feedback','Paused state verified.',
    'retry_feedback','Acknowledge the paused state.','source_note','Mexico PDF pages 30-31'),
  jsonb_build_object('interaction','click','prompt','Select CB - Callbacks','hint','Use the pause code menu','success_feedback','Callback pause selected.',
    'retry_feedback','Find CB - Callbacks.','source_note','Mexico PDF page 30','screen_media_id','40610000-0000-4000-8000-000000000001',
    'regions',jsonb_build_array(jsonb_build_object('id','callback','label','CB - Callbacks','x',0.1,'y',0.2,'w',0.3,'h',0.1)),'expected_value','callback'),
  jsonb_build_object('interaction','text','prompt','Enter the synthetic number 2025550123','hint','Digits only, exactly as supplied','success_feedback','Number verified.',
    'retry_feedback','Use the supplied synthetic number.','source_note','Mexico PDF page 31','screen_media_id','40610000-0000-4000-8000-000000000001','expected_value','2025550123'),
  jsonb_build_object('interaction','select','prompt','Select the correct routing disposition','hint','Never use SPXFER in the Asia immediate routing exercise',
    'success_feedback','Spanish-speaking representative route confirmed.','retry_feedback','Review the Asia routing note.','source_note','Asia Guide paragraphs 72-78',
    'screen_media_id','40610000-0000-4000-8000-000000000001','options',jsonb_build_array('SPANISH SPEAKER','SPXFER'),'expected_value','SPANISH SPEAKER')
) value;
select lives_ok($q$select public.replace_simulation_steps((select content_id from sim_fixture),(select value from sim_steps),
  (select updated_at from public.training_content where id=(select content_id from sim_fixture)))$q$,'bounded source-grounded steps saved');
select throws_ok($q$select public.replace_simulation_steps((select content_id from sim_fixture),(select value from sim_steps),null)$q$,'40001',null,'stale authoring timestamp denied');
select throws_ok($q$update public.training_simulation_steps set regions='[{"id":"bad","label":"bad","x":0.9,"y":0,"w":0.3,"h":0.2}]' where interaction='click'$q$,
  '22023',null,'out-of-bounds normalized hotspot denied');
select throws_ok($q$update public.training_simulation_steps set branches='{"SPANISH SPEAKER":2}' where interaction='select'$q$,
  '22023',null,'backward/cyclic branch denied');
select lives_ok($q$select public.publish_training_content((select content_id from sim_fixture),(select updated_at from public.training_content where id=(select content_id from sim_fixture)))$q$,'valid simulation publishes through existing permission contract');
select throws_ok($q$update public.training_simulation_steps set prompt='Rewrite' where content_id=(select content_id from sim_fixture)$q$,'55000',null,'published steps immutable');
select throws_ok($q$update public.training_media set status='deleting' where id='40610000-0000-4000-8000-000000000001'$q$,'55000',null,'referenced screenshot cannot be removed even by trusted transport');
update sim_fixture set snapshot=public.start_simulation(content_id);
update sim_fixture set staff_attempt=(snapshot->>'attempt_id')::uuid;
select is(public.start_simulation((select content_id from sim_fixture))->>'attempt_id',(select staff_attempt::text from sim_fixture),'start resumes the same active attempt');
select ok(not ((select snapshot from sim_fixture)::text like '%expected_value%'),'learner snapshot has no answer key');
select ok(not ((select snapshot from sim_fixture)::text like '%2025550123%'),'future-step input not leaked');
select is(jsonb_array_length(public.list_simulations()),1,'Staff catalog includes eligible simulation without answer keys');
select ok(not(public.list_simulations()::text like '%expected_value%'),'catalog has no answer keys');
select ok(not public.can_read_simulation_screen('40610000-0000-4000-8000-000000000001',
  (select content_id from sim_fixture),(select staff_attempt from sim_fixture)),'future screenshot unavailable to learner');
select ok(public.can_read_simulation_screen('40610000-0000-4000-8000-000000000001',
  (select content_id from sim_fixture)),'authorized author can preview referenced screen without an attempt');
select throws_ok($q$select public.complete_training_attempt((select staff_attempt from sim_fixture),'[]',0)$q$,'55000',null,'generic quiz completion cannot manufacture simulation result');
select throws_ok($q$select public.submit_simulation_action((select staff_attempt from sim_fixture),gen_random_uuid(),1,gen_random_uuid(),'answer','"continue"')$q$,'40001',null,'forged/out-of-order step rejected');
create function pg_temp.act(kind text,answer jsonb,request uuid default gen_random_uuid()) returns jsonb language plpgsql as $f$
declare r jsonb; s jsonb;
begin
  select snapshot into s from sim_fixture;
  r:=public.submit_simulation_action((s->>'attempt_id')::uuid,(s->'step'->>'id')::uuid,(s->>'state_version')::integer,request,kind,answer);
  update sim_fixture set snapshot=r; return r;
end $f$;
select is(pg_temp.act('answer','"continue"')->>'position','2','information acknowledgement advances only one step');
select ok(public.can_read_simulation_screen('40610000-0000-4000-8000-000000000001',
  (select content_id from sim_fixture),(select staff_attempt from sim_fixture)),'current screenshot available for owned attempt');
select is(pg_temp.act('answer','{"x":0.99,"y":0.99}')->>'mistakes','1','wrong hotspot stays current and counts mistake');
select is((select snapshot->>'position' from sim_fixture),'2','wrong click does not advance');
select is(pg_temp.act('hint',null)->>'hints','1','hint is recorded server-side');
select is(pg_temp.act('hint',null)->>'hints','1','repeated hint does not charge twice');
select is(pg_temp.act('answer','{"x":0.2,"y":0.25}','50610000-0000-4000-8000-000000000001')->>'position','3','correct normalized click advances');
select is(pg_temp.act('answer','"wrong duplicate"','50610000-0000-4000-8000-000000000001')->>'duplicate','true','duplicate delivery cannot advance or score again');
select is(pg_temp.act('answer','"202-555-0123"')->>'correct','false','exercise requires exact supplied digits, not inferred policy');
select is(pg_temp.act('answer','"2025550123"')->>'position','4','correct synthetic text advances');
select is(pg_temp.act('answer','"SPXFER"')->>'correct','false','Asia prohibited disposition does not complete');
select is(pg_temp.act('answer','"SPANISH SPEAKER"')->>'status','completed','terminal correct action completes canonical attempt');
select is((select (snapshot->'result'->>'score_percent')::numeric from sim_fixture),75::numeric,'server computes score from three mistakes and one hint');
select is((select count(*) from public.training_results where attempt_id=(select staff_attempt from sim_fixture)),1::bigint,'exactly one canonical result');
select ok(not exists(select 1 from information_schema.columns where table_name='training_simulation_events' and column_name in ('answer','submitted_value','phone_number')),'events do not persist typed customer data');
select set_config('request.jwt.claim.sub','a0610000-0000-4000-8000-000000000002',true);
select throws_ok($q$select public.get_simulation_attempt((select staff_attempt from sim_fixture))$q$,'42501',null,'another Staff member cannot read attempt even with global Studio rights');
select set_config('request.jwt.claim.sub','a0610000-0000-4000-8000-000000000001',true);
update sim_fixture set snapshot=public.start_simulation(content_id,true);
select isnt((select snapshot->>'attempt_id' from sim_fixture),(select staff_attempt::text from sim_fixture),'replay creates a new attempt without deleting results');
select is((select count(*) from public.training_results),1::bigint,'replay preserves prior result');
select is(jsonb_array_length(public.get_simulation_history()),2,'own history includes prior result and replay');
update sim_fixture set revision=(select id from public.create_training_content_revision(content_id));
select is((select count(*) from public.training_simulation_steps where content_id=(select revision from sim_fixture)),4::bigint,'revision clones simulation steps');
select lives_ok($q$select public.publish_training_content((select revision from sim_fixture),(select updated_at from public.training_content where id=(select revision from sim_fixture)))$q$,'simulation update publishes atomically');
select is(public.get_simulation_attempt((select (snapshot->>'attempt_id')::uuid from sim_fixture))->>'version_number','1','active attempt remains pinned to old version');
select is(public.start_simulation((select content_id from sim_fixture))->>'version_number','1','unfinished historical attempt may resume');
select throws_ok($q$select public.start_simulation((select content_id from sim_fixture),true)$q$,'55000',null,'historical version cannot start new replay');
select set_config('request.jwt.claim.role','service_role',true);
select is(jsonb_array_length(public.agent_list_simulations('30610000-0000-4000-8000-000000000003')),0,'outside-team Agent catalog hides simulation');
select is(jsonb_array_length(public.agent_list_simulations('30610000-0000-4000-8000-000000000001')),1,'eligible Agent sees current simulation');
select throws_ok($q$select public.agent_start_simulation('30610000-0000-4000-8000-000000000003',(select revision from sim_fixture))$q$,'42501',null,'outside-team Agent denied');
update sim_fixture set agent_attempt=(public.agent_start_simulation('30610000-0000-4000-8000-000000000001',revision)->>'attempt_id')::uuid;
select is(public.agent_get_simulation_attempt('30610000-0000-4000-8000-000000000001',(select agent_attempt from sim_fixture))->>'version_number','2','eligible Agent uses canonical current revision');
select is(jsonb_array_length(public.agent_get_simulation_history('30610000-0000-4000-8000-000000000001')),1,'Agent history is own canonical attempt only');
select is(jsonb_array_length(public.agent_get_simulation_history('30610000-0000-4000-8000-000000000002')),0,'other Agent history stays empty');
select ok(not public.agent_can_read_simulation_screen('30610000-0000-4000-8000-000000000002',
  '40610000-0000-4000-8000-000000000001',(select revision from sim_fixture),(select agent_attempt from sim_fixture)),
  'another Agent cannot obtain screenshot permission');
select throws_ok($q$select public.agent_get_simulation_attempt('30610000-0000-4000-8000-000000000002',(select agent_attempt from sim_fixture))$q$,'42501',null,'another Agent cannot read owned attempt');
update public.agents set status='blocked' where id='30610000-0000-4000-8000-000000000001';
select throws_ok($q$select public.agent_get_simulation_attempt('30610000-0000-4000-8000-000000000001',(select agent_attempt from sim_fixture))$q$,'42501',null,'blocked Agent loses ongoing attempt access');
update public.agents set status='active' where id='30610000-0000-4000-8000-000000000001';
update public.teams set is_active=false where id='e0610000-0000-4000-8000-000000000001';
select throws_ok($q$select public.agent_get_simulation_attempt('30610000-0000-4000-8000-000000000001',(select agent_attempt from sim_fixture))$q$,'42501',null,'inactive team revokes Agent access');
select set_config('request.jwt.claim.role','authenticated',true);
select throws_ok($q$select public.agent_get_simulation_attempt('30610000-0000-4000-8000-000000000002',(select agent_attempt from sim_fixture))$q$,'42501',null,'Agent RPC also enforces server identity internally');
select * from finish();
rollback;
