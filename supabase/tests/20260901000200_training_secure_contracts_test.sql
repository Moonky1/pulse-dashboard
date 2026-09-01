begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Surface and deny-by-default security.
select has_table('public','training_question_topics','question Topic attribution exists');
select has_table('public','training_attempt_answers','server-scored answer history exists');
select ok((select relrowsecurity from pg_class where oid='public.training_attempt_answers'::regclass),'answer history RLS is enabled');
select ok(not has_table_privilege('authenticated','public.training_attempt_answers','SELECT'),'browser cannot read answer history directly');
select ok(not has_table_privilege('authenticated','public.training_attempt_answers','INSERT'),'browser cannot forge answer history');
select has_function('public','list_training_catalog',array['text','text','uuid','text','integer','integer'],'protected Training catalog exists');
select has_function('public','get_training_filter_options',array['text'],'protected filter catalog exists');
select has_function('public','create_training_content_draft',array['text','text','text','text','uuid[]','text','uuid','uuid','uuid[]'],'draft creation contract exists');
select has_function('public','replace_training_questions',array['uuid','jsonb','timestamp with time zone'],'question replacement contract exists');
select has_function('public','publish_training_content',array['uuid'],'publish contract exists');
select has_function('public','archive_training_content',array['uuid'],'archive contract exists');
select has_function('public','get_go_practice_content',array['uuid'],'GO Practice contract exists');
select has_function('public','start_training_attempt',array['uuid','text'],'attempt start contract has no learner UUID');
select has_function('public','complete_training_attempt',array['uuid','jsonb','integer'],'completion contract has no trusted score');
select has_function('public','list_my_training_results',array['integer'],'own-history contract has no target learner');
select ok(to_regprocedure('public.list_training_results(uuid)') is null,'no guessable cross-learner history RPC exists');

select ok((select prosecdef from pg_proc where oid='public.complete_training_attempt(uuid,jsonb,integer)'::regprocedure),'completion is SECURITY DEFINER');
select is((select proowner::regrole::text from pg_proc where oid='public.complete_training_attempt(uuid,jsonb,integer)'::regprocedure),'postgres','completion owner is postgres');
select is((select proconfig[1] from pg_proc where oid='public.complete_training_attempt(uuid,jsonb,integer)'::regprocedure),'search_path=pg_catalog','completion fixes search_path');
select ok(has_function_privilege('authenticated','public.complete_training_attempt(uuid,jsonb,integer)','EXECUTE'),'authenticated may execute completion RPC');
select ok(not has_function_privilege('anon','public.complete_training_attempt(uuid,jsonb,integer)','EXECUTE'),'anon cannot execute completion RPC');
select ok(not has_function_privilege('public','public.complete_training_attempt(uuid,jsonb,integer)','EXECUTE'),'PUBLIC cannot execute completion RPC');
select is((
  select count(*) from pg_proc procedure
  where procedure.pronamespace='public'::regnamespace
    and procedure.proname=any(array[
      'list_training_catalog','get_training_filter_options','list_academy_modules',
      'create_training_content_draft','update_training_content_draft','replace_training_questions',
      'publish_training_content','archive_training_content','get_go_practice_content',
      'start_training_attempt','complete_training_attempt','list_my_training_results'
    ])
    and (not procedure.prosecdef or procedure.proowner <> 'postgres'::regrole
      or not ('search_path=pg_catalog'=any(procedure.proconfig)))
),0::bigint,'every public Training RPC is postgres-owned, definer-secured, and search-path fixed');
select is((
  select count(*) from pg_proc procedure
  where procedure.pronamespace='public'::regnamespace
    and procedure.proname=any(array[
      'list_training_catalog','get_training_filter_options','list_academy_modules',
      'create_training_content_draft','update_training_content_draft','replace_training_questions',
      'publish_training_content','archive_training_content','get_go_practice_content',
      'start_training_attempt','complete_training_attempt','list_my_training_results'
    ])
    and not has_function_privilege('authenticated',procedure.oid,'EXECUTE')
),0::bigint,'authenticated receives every intended narrow RPC');
select is((
  select count(*) from pg_proc procedure
  where procedure.pronamespace='public'::regnamespace
    and procedure.proname=any(array[
      'list_training_catalog','get_training_filter_options','list_academy_modules',
      'create_training_content_draft','update_training_content_draft','replace_training_questions',
      'publish_training_content','archive_training_content','get_go_practice_content',
      'start_training_attempt','complete_training_attempt','list_my_training_results'
    ])
    and (has_function_privilege('anon',procedure.oid,'EXECUTE')
      or has_function_privilege('service_role',procedure.oid,'EXECUTE'))
),0::bigint,'anon and browser service-role dependency are absent from every RPC');

-- Legacy Staff role is retained for history but cannot imply Agent Identity.
select ok(not (select is_active from public.roles where key='agent'),'legacy Staff agent role is inactive');
select matches((select name from public.roles where key='agent'),'Deprecated','legacy Staff agent role is explicitly deprecated');
select is((select count(*) from public.role_permissions rp join public.roles r on r.id=rp.role_id join public.permissions p on p.id=rp.permission_id where r.key='agent' and p.key in ('go.play','academy.view')),0::bigint,'legacy agent has no learner permissions');
select is((select count(*) from public.role_grant_rules g join public.roles r on r.id=g.grantable_role_id where r.key='agent'),0::bigint,'legacy agent cannot be granted');
select is((select count(*) from public.role_permissions rp join public.roles r on r.id=rp.role_id join public.permissions p on p.id=rp.permission_id where r.key='team_leader' and p.key in ('studio.view','studio.create','studio.publish','go.play','go.host','academy.view')),6::bigint,'Team Leader mapping remains exact');
select is((select count(*) from public.role_permissions rp join public.roles r on r.id=rp.role_id join public.permissions p on p.id=rp.permission_id where r.key='team_leader' and p.key='academy.manage'),0::bigint,'Team Leader does not gain Academy management');

-- Entirely fictitious isolated Staff and organization fixtures.
insert into public.departments(id,code,name,is_active) values
 ('db000000-0000-4000-8000-000000000001','train1b_ops','TRAIN-1B Operations',true);
insert into public.campaigns(id,code,name,is_active) values
 ('cb000000-0000-4000-8000-000000000001','train1b_active','TRAIN-1B Active Campaign',true),
 ('cb000000-0000-4000-8000-000000000002','train1b_inactive','TRAIN-1B Inactive Campaign',false);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('eb000000-0000-4000-8000-000000000001','db000000-0000-4000-8000-000000000001','cb000000-0000-4000-8000-000000000001','train1b_team','TRAIN-1B Team',true),
 ('eb000000-0000-4000-8000-000000000002','db000000-0000-4000-8000-000000000001','cb000000-0000-4000-8000-000000000001','train1b_inactive_team','TRAIN-1B Inactive Team',false);
insert into public.positions(id,code,name,is_active) values
 ('1b000000-0000-4000-8000-000000000001','train1b_position','TRAIN-1B Position',true),
 ('1b000000-0000-4000-8000-000000000002','train1b_inactive_position','TRAIN-1B Inactive Position',false);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('ab000000-0000-4000-8000-000000000001','authenticated','authenticated','train1b.author@example.test','',now(),'{}','{}',now(),now()),
 ('ab000000-0000-4000-8000-000000000002','authenticated','authenticated','train1b.learner@example.test','',now(),'{}','{}',now(),now()),
 ('ab000000-0000-4000-8000-000000000003','authenticated','authenticated','train1b.employee@example.test','',now(),'{}','{}',now(),now()),
 ('ab000000-0000-4000-8000-000000000004','authenticated','authenticated','train1b.other@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,team_id,position_id,approved_at) values
 ('bb000000-0000-4000-8000-000000000001','ab000000-0000-4000-8000-000000000001','KK-981001','train1b.author@example.test','TRAIN-1B Author','active','db000000-0000-4000-8000-000000000001','eb000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001',now()),
 ('bb000000-0000-4000-8000-000000000002','ab000000-0000-4000-8000-000000000002','KK-981002','train1b.learner@example.test','TRAIN-1B Learner','active','db000000-0000-4000-8000-000000000001','eb000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001',now()),
 ('bb000000-0000-4000-8000-000000000003','ab000000-0000-4000-8000-000000000003','KK-981003','train1b.employee@example.test','TRAIN-1B Employee','active','db000000-0000-4000-8000-000000000001','eb000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001',now()),
 ('bb000000-0000-4000-8000-000000000004','ab000000-0000-4000-8000-000000000004','KK-981004','train1b.other@example.test','TRAIN-1B Other Learner','active','db000000-0000-4000-8000-000000000001','eb000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type,team_id) values
 ('fb000000-0000-4000-8000-000000000002','bb000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000003','team','eb000000-0000-4000-8000-000000000001'),
 ('fb000000-0000-4000-8000-000000000004','bb000000-0000-4000-8000-000000000004','10000000-0000-0000-0000-000000000003','team','eb000000-0000-4000-8000-000000000001');
insert into public.user_roles(id,user_id,role_id,scope_type) values
 ('fb000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global'),
 ('fb000000-0000-4000-8000-000000000003','bb000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000001','global');
insert into public.training_topics(id,code,name,is_active) values
 ('2b000000-0000-4000-8000-000000000001','train1b_topic','TRAIN-1B Topic',true),
 ('2b000000-0000-4000-8000-000000000002','train1b_inactive_topic','TRAIN-1B Inactive Topic',false);

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.create_training_content_draft('quiz','Denied draft',null,'en',array['2b000000-0000-4000-8000-000000000001'::uuid],'campaign','cb000000-0000-4000-8000-000000000001',null,array['1b000000-0000-4000-8000-000000000001'::uuid])$$,'42501',null,'missing studio.create is denied');

create temporary table train1b_fixture(content_id uuid primary key);
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000001',true);
insert into train1b_fixture(content_id)
select id from public.create_training_content_draft(
  'quiz','TRAIN-1B Campaign Quiz','Fictitious secure practice','en',
  array['2b000000-0000-4000-8000-000000000001'::uuid],
  'campaign','cb000000-0000-4000-8000-000000000001',null,
  array['1b000000-0000-4000-8000-000000000001'::uuid]
);
select ok((select content_id is not null from train1b_fixture),'authorized author creates draft');
select is((select created_by_user_id from public.training_content where id=(select content_id from train1b_fixture)),'bb000000-0000-4000-8000-000000000001'::uuid,'creator is resolved from auth.uid');
select is((select status from public.training_content where id=(select content_id from train1b_fixture)),'draft','create cannot publish');
select is((select count(*) from public.audit_events where action='training.content_created' and target_id=(select content_id from train1b_fixture)),1::bigint,'draft creation is audited once');
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.list_training_catalog('learner',null,null,null,50,0)),0::bigint,'draft is hidden from learner catalog');
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000001',true);
select throws_ok(format($q$select * from public.update_training_content_draft(%L::uuid,'Stale title',null,'en',array['2b000000-0000-4000-8000-000000000001'::uuid],'campaign','cb000000-0000-4000-8000-000000000001',null,array['1b000000-0000-4000-8000-000000000001'::uuid],'2000-01-01'::timestamptz)$q$,(select content_id from train1b_fixture)),'40001',null,'stale draft update is rejected');
select lives_ok(format($q$select * from public.update_training_content_draft(%L::uuid,'TRAIN-1B Campaign Quiz Updated','Fictitious secure practice','en',array['2b000000-0000-4000-8000-000000000001'::uuid],'campaign','cb000000-0000-4000-8000-000000000001',null,array['1b000000-0000-4000-8000-000000000001'::uuid],%L::timestamptz)$q$,(select content_id from train1b_fixture),(select updated_at from public.training_content where id=(select content_id from train1b_fixture))),'draft owner updates with exact freshness token');
select throws_ok($$select * from public.create_training_content_draft('lesson','Inactive target',null,'en',array['2b000000-0000-4000-8000-000000000001'::uuid],'campaign','cb000000-0000-4000-8000-000000000002',null,'{}'::uuid[])$$,'22023',null,'inactive Campaign target fails closed');
select throws_ok($$select * from public.create_training_content_draft('lesson','Inactive Position',null,'en',array['2b000000-0000-4000-8000-000000000001'::uuid],'global',null,null,array['1b000000-0000-4000-8000-000000000002'::uuid])$$,'22023',null,'inactive Position target is rejected');

select throws_ok(format($q$select * from public.replace_training_questions(%L::uuid,'[{"position":1,"question_type":"multiple_choice","prompt":"Invalid choice","answer_options":["A","B"],"correct_answer":3,"topic_ids":["2b000000-0000-4000-8000-000000000001"]}]'::jsonb,%L::timestamptz)$q$,(select content_id from train1b_fixture),(select updated_at from public.training_content where id=(select content_id from train1b_fixture))),'22023',null,'invalid question is rejected by canonical validation');
select lives_ok(format($q$select * from public.replace_training_questions(%L::uuid,'[{"position":1,"question_type":"multiple_choice","prompt":"Choose the second option","answer_options":["First","Second"],"correct_answer":1,"explanation":"Server-only explanation","topic_ids":["2b000000-0000-4000-8000-000000000001"]},{"position":2,"question_type":"true_false","prompt":"The contract is server-authoritative","answer_options":[],"correct_answer":true,"topic_ids":["2b000000-0000-4000-8000-000000000001"]}]'::jsonb,%L::timestamptz)$q$,(select content_id from train1b_fixture),(select updated_at from public.training_content where id=(select content_id from train1b_fixture))),'valid structured questions replace atomically');
select is((select count(*) from public.training_question_topics qt join public.training_questions q on q.id=qt.question_id where q.content_id=(select content_id from train1b_fixture)),2::bigint,'each question has exact Topic attribution');

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000003',true);
select throws_ok(format('select * from public.publish_training_content(%L::uuid)',(select content_id from train1b_fixture)),'42501',null,'missing studio.publish is denied');
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000001',true);
select lives_ok(format('select * from public.publish_training_content(%L::uuid)',(select content_id from train1b_fixture)),'authorized publication succeeds');
select is((select status from public.training_content where id=(select content_id from train1b_fixture)),'published','publication transition is canonical');
select is((select count(*) from public.audit_events where action='training.content_published' and target_id=(select content_id from train1b_fixture)),1::bigint,'publication is audited once');
select throws_ok(format('delete from public.training_questions where content_id=%L::uuid',(select content_id from train1b_fixture)),'P0001',null,'published question history remains immutable');

create temporary table train1b_team_content(content_id uuid primary key);
insert into train1b_team_content(content_id)
select id from public.create_training_content_draft(
  'lesson','TRAIN-1B Team Lesson',null,'es',
  array['2b000000-0000-4000-8000-000000000001'::uuid],
  'team',null,'eb000000-0000-4000-8000-000000000001','{}'::uuid[]
);
select lives_ok(format('select * from public.publish_training_content(%L::uuid)',(select content_id from train1b_team_content)),'valid Team-targeted lesson publishes');
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.list_training_catalog('learner','es',null,'Team Lesson',50,0)),1::bigint,'Team learner sees matching Team-targeted content');
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000001',true);
select lives_ok(format('select * from public.archive_training_content(%L::uuid)',(select content_id from train1b_team_content)),'Team-targeted lesson archives without history loss');

create temporary table train1b_invalid_content(content_id uuid primary key);
insert into train1b_invalid_content(content_id)
select id from public.create_training_content_draft(
  'quiz','TRAIN-1B Missing Questions',null,'en',
  array['2b000000-0000-4000-8000-000000000001'::uuid],
  'global',null,null,'{}'::uuid[]
);
select throws_ok(format('select * from public.publish_training_content(%L::uuid)',(select content_id from train1b_invalid_content)),'23514',null,'quiz with missing questions cannot publish');

-- Academy composition reads the same published content.
insert into public.training_modules(id,title,language,created_by_user_id) values
 ('6b000000-0000-4000-8000-000000000001','TRAIN-1B Academy Module','en','bb000000-0000-4000-8000-000000000001');
insert into public.training_module_items(module_id,content_id,position)
select '6b000000-0000-4000-8000-000000000001',content_id,1 from train1b_fixture;
update public.training_modules set status='published' where id='6b000000-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.list_training_catalog('learner','en','2b000000-0000-4000-8000-000000000001',null,50,0)),1::bigint,'eligible Team learner sees published Campaign/Position content');
select is((select count(*) from public.list_training_catalog('learner','es',null,null,50,0)),0::bigint,'language filter is enforced');
select is((select count(*) from public.list_training_catalog('learner','en','2b000000-0000-4000-8000-000000000002',null,50,0)),0::bigint,'Topic filter is enforced');
select is((select count(*) from public.list_academy_modules('en')),1::bigint,'academy.view reads eligible published module');
select ok(not ((select public.get_go_practice_content(content_id) from train1b_fixture)::text ~ 'correct_answer|Server-only explanation'),'Practice response does not leak answer key or explanation');
select is((select jsonb_array_length(public.get_go_practice_content(content_id)->'questions') from train1b_fixture),2,'Practice returns eligible published questions');

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000003',true);
select throws_ok(format('select public.get_go_practice_content(%L::uuid)',(select content_id from train1b_fixture)),'42501',null,'targeting match does not grant go.play RBAC');
select throws_ok(format($q$select * from public.start_training_attempt(%L::uuid,'go_practice')$q$,(select content_id from train1b_fixture)),'42501',null,'unauthorized learner cannot start attempt');
select throws_ok($$select * from public.list_academy_modules('en')$$,'42501',null,'missing academy.view cannot read Academy modules');

create temporary table train1b_attempt(attempt_id uuid primary key);
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000002',true);
insert into train1b_attempt(attempt_id)
select attempt_id from public.start_training_attempt((select content_id from train1b_fixture),'go_practice');
select ok((select attempt_id is not null from train1b_attempt),'eligible Staff starts GO Practice attempt');
select is((select count(*) from public.training_staff_learner_links where staff_user_id='bb000000-0000-4000-8000-000000000002'),1::bigint,'Staff learner resolves from auth.uid exactly once');
select is((select learner_kind from public.training_learners l join public.training_staff_learner_links link on link.learner_id=l.id where link.staff_user_id='bb000000-0000-4000-8000-000000000002'),'staff','no Agent learner is fabricated');
select is((select attempt_number from public.training_attempts where id=(select attempt_id from train1b_attempt)),1,'server owns initial attempt number');
select lives_ok(format($q$select * from public.complete_training_attempt(%L::uuid,(select jsonb_agg(jsonb_build_object('question_id',q.id,'answer',case when q.question_type='multiple_choice' then '1'::jsonb else 'false'::jsonb end) order by q.position) from public.training_questions q where q.content_id=%L::uuid),18)$q$,(select attempt_id from train1b_attempt),(select content_id from train1b_fixture)),'server completes one exact structured answer set');
select is((select score_percent from public.training_results where attempt_id=(select attempt_id from train1b_attempt)),50.00::numeric,'server calculates score rather than trusting client');
select is((select correct_answers from public.training_results where attempt_id=(select attempt_id from train1b_attempt)),1,'server calculates correct count');
select is((select total_questions from public.training_results where attempt_id=(select attempt_id from train1b_attempt)),2,'server calculates total count');
select is((select count(*) from public.training_attempt_answers where attempt_id=(select attempt_id from train1b_attempt)),2::bigint,'answers persist once as immutable history');
select is((select correct_answers from public.training_result_topics where result_id=(select id from public.training_results where attempt_id=(select attempt_id from train1b_attempt)) and topic_id='2b000000-0000-4000-8000-000000000001'),1,'Topic result is server-calculated');
select throws_ok(format($q$select * from public.complete_training_attempt(%L::uuid,'[]'::jsonb,1)$q$,(select attempt_id from train1b_attempt)),'55000',null,'duplicate completion is rejected');
select throws_ok(format('update public.training_attempt_answers set is_correct=true where attempt_id=%L::uuid',(select attempt_id from train1b_attempt)),'P0001',null,'answer history is append-only');
select is((select count(*) from public.list_my_training_results(50)),1::bigint,'learner reads own Training history');
select is((select count(*) from public.audit_events where action like 'training.attempt%' or action like 'training.result%'),0::bigint,'normal practice does not flood global Admin audit');

select lives_ok(format($q$select * from public.start_training_attempt(%L::uuid,'go_practice')$q$,(select content_id from train1b_fixture)),'same learner may start another practice attempt');
select is((select max(attempt_number) from public.training_attempts a join public.training_staff_learner_links l on l.learner_id=a.learner_id where l.staff_user_id='bb000000-0000-4000-8000-000000000002'),2,'server allocates the next attempt number');
select throws_ok(format($q$select * from public.start_training_attempt(%L::uuid,'go_hosted')$q$,(select content_id from train1b_fixture)),'22023',null,'hosted multiplayer is not falsely implemented');

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000004',true);
select is((select count(*) from public.list_my_training_results(50)),0::bigint,'another Staff learner cannot read guessed history');

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000001',true);
select lives_ok(format('select * from public.archive_training_content(%L::uuid)',(select content_id from train1b_fixture)),'authorized archive succeeds');
select is((select status from public.training_content where id=(select content_id from train1b_fixture)),'archived','archive lifecycle transition is canonical');
select is((select count(*) from public.audit_events where action='training.content_archived' and target_id=(select content_id from train1b_fixture)),1::bigint,'archive is audited once');
select is((select count(*) from public.training_results where attempt_id=(select attempt_id from train1b_attempt)),1::bigint,'archive preserves historical result');

select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.list_training_catalog('learner',null,null,null,50,0)),0::bigint,'archived content disappears from learner catalog');
select throws_ok(format('select public.get_go_practice_content(%L::uuid)',(select content_id from train1b_fixture)),'42501',null,'archived content is no longer playable');

-- Direct browser access remains denied even for authorized Staff.
set local role authenticated;
select set_config('request.jwt.claim.sub','ab000000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.training_questions$$,'42501',null,'browser cannot bypass protected question projection');
select throws_ok($$insert into public.training_attempt_answers(attempt_id,question_id,submitted_answer,is_correct) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','true',true)$$,'42501',null,'browser cannot forge correctness');
reset role;

select ok(not exists(select 1 from public.training_learners where learner_kind <> 'staff'),'TRAIN-1B preserves the Staff-only learner boundary');
select is((select count(*) from public.user_operational_assignments where user_id in ('bb000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000002')),0::bigint,'Training contracts fabricate no operational assignments');
select is((select count(*) from public.user_roles where user_id='bb000000-0000-4000-8000-000000000002'),1::bigint,'Training contracts never mutate Staff RBAC');

select * from finish();
rollback;
