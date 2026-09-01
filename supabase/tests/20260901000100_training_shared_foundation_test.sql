begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Protected shared schema.
select has_table('public','training_topics','shared Topic catalog exists');
select has_table('public','training_media','canonical media references exist');
select has_table('public','training_content','shared content exists');
select has_table('public','training_questions','shared questions exist');
select has_table('public','training_modules','Academy module foundation exists');
select has_table('public','training_learners','canonical learner abstraction exists');
select has_table('public','training_staff_learner_links','Staff learner bridge exists');
select has_table('public','training_attempts','training attempts exist');
select has_table('public','training_results','append-only results exist');
select has_table('public','training_result_topics','normalized topic results exist');

select ok((select relrowsecurity from pg_class where oid='public.training_content'::regclass),'content RLS is enabled');
select ok((select relrowsecurity from pg_class where oid='public.training_results'::regclass),'result RLS is enabled');
select ok(not has_table_privilege('authenticated','public.training_content','SELECT'),'browser has no direct content read');
select ok(not has_table_privilege('authenticated','public.training_content','INSERT'),'browser has no direct content write');
select ok(not has_table_privilege('authenticated','public.training_results','INSERT'),'browser has no direct result write');
select ok(not has_table_privilege('anon','public.training_topics','SELECT'),'anon has no Topic read');
select ok(not exists(
  select 1 from pg_proc
  where pronamespace='public'::regnamespace
    and proname like '%training%' and prosecdef
    and has_function_privilege('anon',oid,'EXECUTE')
),'Training SECURITY DEFINER contracts never become anonymous surfaces');

-- Entirely fictitious isolated canonical fixtures.
insert into public.departments(id,code,name,is_active) values
 ('da000000-0000-4000-8000-000000000001','train1_ops','TRAIN-1 Operations',true);
insert into public.campaigns(id,code,name,is_active) values
 ('ca000000-0000-4000-8000-000000000001','train1_active','TRAIN-1 Active Campaign',true),
 ('ca000000-0000-4000-8000-000000000002','train1_inactive','TRAIN-1 Inactive Campaign',false);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('ea000000-0000-4000-8000-000000000001','da000000-0000-4000-8000-000000000001','ca000000-0000-4000-8000-000000000001','train1_active_team','TRAIN-1 Active Team',true),
 ('ea000000-0000-4000-8000-000000000002','da000000-0000-4000-8000-000000000001','ca000000-0000-4000-8000-000000000001','train1_inactive_team','TRAIN-1 Inactive Team',false);
insert into public.positions(id,code,name,is_active) values
 ('1a000000-0000-4000-8000-000000000001','train1_active_position','TRAIN-1 Active Position',true),
 ('1a000000-0000-4000-8000-000000000002','train1_inactive_position','TRAIN-1 Inactive Position',false);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('aa000000-0000-4000-8000-000000000001','authenticated','authenticated','train1.staff@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,approved_at)
values ('ba000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001','KK-980001','train1.staff@example.test','TRAIN-1 Staff','active','da000000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type)
values ('fa000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');

-- Topics, language, media, questions, and content lifecycle.
insert into public.training_topics(id,code,name,is_active) values
 ('2a000000-0000-4000-8000-000000000001','train1_opening','TRAIN-1 Opening',true),
 ('2a000000-0000-4000-8000-000000000002','train1_inactive_topic','TRAIN-1 Inactive Topic',false);
select throws_ok($$insert into public.training_topics(code,name) values ('Bad Code','Invalid')$$,'23514',null,'Topic codes are normalized');

insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id)
values ('3a000000-0000-4000-8000-000000000001','image','training-media','train1/questions/example.png','image/png','ba000000-0000-4000-8000-000000000001');
select throws_ok($$insert into public.training_media(media_type,storage_bucket,storage_path,mime_type,created_by_user_id) values ('audio','training-media','../escape.mp3','audio/mpeg','ba000000-0000-4000-8000-000000000001')$$,'23514',null,'unsafe media paths are rejected');
select throws_ok($$insert into public.training_media(media_type,storage_bucket,storage_path,mime_type,created_by_user_id) values ('image','training-media','train1/wrong.mp3','audio/mpeg','ba000000-0000-4000-8000-000000000001')$$,'23514',null,'media MIME must match the canonical media type');

insert into public.training_content(id,content_type,title,language,created_by_user_id)
values
 ('4a000000-0000-4000-8000-000000000001','quiz','TRAIN-1 Quiz EN','en','ba000000-0000-4000-8000-000000000001'),
 ('4a000000-0000-4000-8000-000000000002','lesson','TRAIN-1 Lesson ES','es','ba000000-0000-4000-8000-000000000001'),
 ('4a000000-0000-4000-8000-000000000003','quiz','TRAIN-1 Invalid Publish','en','ba000000-0000-4000-8000-000000000001'),
 ('4a000000-0000-4000-8000-000000000004','lesson','TRAIN-1 Inactive Target','en','ba000000-0000-4000-8000-000000000001');
select throws_ok($$insert into public.training_content(content_type,title,language,status,created_by_user_id,published_at) values ('lesson','Already Published','en','published','ba000000-0000-4000-8000-000000000001',now())$$,'P0001',null,'new content must begin as draft');
select throws_ok($$insert into public.training_content(content_type,title,language,created_by_user_id) values ('lesson','Unsupported Language','fr','ba000000-0000-4000-8000-000000000001')$$,'23514',null,'content language is explicitly EN or ES');

insert into public.training_content_topics(content_id,topic_id) values
 ('4a000000-0000-4000-8000-000000000001','2a000000-0000-4000-8000-000000000001'),
 ('4a000000-0000-4000-8000-000000000002','2a000000-0000-4000-8000-000000000001'),
 ('4a000000-0000-4000-8000-000000000004','2a000000-0000-4000-8000-000000000001');
insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id) values
 ('4a000000-0000-4000-8000-000000000001','team',null,'ea000000-0000-4000-8000-000000000001'),
 ('4a000000-0000-4000-8000-000000000002','global',null,null),
 ('4a000000-0000-4000-8000-000000000004','campaign','ca000000-0000-4000-8000-000000000002',null);
insert into public.training_content_position_targets(content_id,position_id)
values ('4a000000-0000-4000-8000-000000000001','1a000000-0000-4000-8000-000000000001');
select throws_ok($$insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id) values ('4a000000-0000-4000-8000-000000000003','team','ca000000-0000-4000-8000-000000000001','ea000000-0000-4000-8000-000000000001')$$,'23514',null,'mixed Campaign and Team audience identity is rejected');

insert into public.training_questions(id,content_id,position,question_type,prompt,answer_options,correct_answer,explanation,media_id) values
 ('5a000000-0000-4000-8000-000000000001','4a000000-0000-4000-8000-000000000001',1,'multiple_choice','TRAIN-1 choose one','["First","Second"]','1','Fictitious explanation','3a000000-0000-4000-8000-000000000001'),
 ('5a000000-0000-4000-8000-000000000002','4a000000-0000-4000-8000-000000000001',2,'true_false','TRAIN-1 true or false','[]','true',null,null),
 ('5a000000-0000-4000-8000-000000000003','4a000000-0000-4000-8000-000000000001',3,'text','TRAIN-1 text response','[]','["accepted"]',null,null);
select throws_ok($$insert into public.training_questions(content_id,position,question_type,prompt,answer_options,correct_answer) values ('4a000000-0000-4000-8000-000000000001',4,'multiple_choice','Invalid index','["A","B"]','3')$$,'P0001',null,'multiple-choice correct index must reference an option');
select throws_ok($$insert into public.training_questions(content_id,position,question_type,prompt,answer_options,correct_answer) values ('4a000000-0000-4000-8000-000000000001',4,'true_false','Invalid options','["Yes","No"]','true')$$,'P0001',null,'true/false does not accept arbitrary options');
select throws_ok($$insert into public.training_questions(content_id,position,question_type,prompt,answer_options,correct_answer) values ('4a000000-0000-4000-8000-000000000001',4,'text','Missing accepted answers','[]','[]')$$,'P0001',null,'text questions require accepted answers');

select throws_ok($$update public.training_content set status='published' where id='4a000000-0000-4000-8000-000000000003'$$,'P0001',null,'quiz without Topic, audience, or questions cannot publish');
select throws_ok($$update public.training_content set status='published' where id='4a000000-0000-4000-8000-000000000004'$$,'P0001',null,'inactive Campaign audience cannot publish');
select lives_ok($$update public.training_content set status='published' where id='4a000000-0000-4000-8000-000000000001'$$,'valid quiz publishes after canonical validation');
select lives_ok($$update public.training_content set status='published' where id='4a000000-0000-4000-8000-000000000002'$$,'valid lesson publishes without question overbuild');
select ok((select published_at is not null from public.training_content where id='4a000000-0000-4000-8000-000000000001'),'published_at is database-owned');
select throws_ok($$update public.training_content set status='draft',published_at=null where id='4a000000-0000-4000-8000-000000000001'$$,'P0001',null,'published content cannot return to draft');
select throws_ok($$delete from public.training_questions where id='5a000000-0000-4000-8000-000000000001'$$,'P0001',null,'published question history cannot be deleted');

-- Academy module uses the same published content rather than a parallel CMS.
insert into public.training_modules(id,title,language,created_by_user_id)
values ('6a000000-0000-4000-8000-000000000001','TRAIN-1 English Module','en','ba000000-0000-4000-8000-000000000001');
insert into public.training_module_items(module_id,content_id,position)
values ('6a000000-0000-4000-8000-000000000001','4a000000-0000-4000-8000-000000000001',1);
select lives_ok($$update public.training_modules set status='published' where id='6a000000-0000-4000-8000-000000000001'$$,'same-language module publishes with shared content');

-- Staff learner bridge, attempts, immutable results, and provenance.
insert into public.training_learners(id,learner_kind)
values ('7a000000-0000-4000-8000-000000000001','staff');
insert into public.training_staff_learner_links(learner_id,staff_user_id)
values ('7a000000-0000-4000-8000-000000000001','ba000000-0000-4000-8000-000000000001');
set constraints training_learners_require_staff_link immediate;
select throws_ok($$insert into public.training_learners(learner_kind) values ('agent')$$,'23514',null,'Agent learner cannot be fabricated before Agent Identity exists');

select throws_ok($$insert into public.training_attempts(learner_id,content_id,source_mode,attempt_number,status,language) values ('7a000000-0000-4000-8000-000000000001','4a000000-0000-4000-8000-000000000003','go_practice',1,'started','en')$$,'P0001',null,'draft content cannot start a learner attempt');
select throws_ok($$insert into public.training_attempts(learner_id,content_id,source_mode,attempt_number,status,language) values ('7a000000-0000-4000-8000-000000000001','4a000000-0000-4000-8000-000000000001','go_practice',1,'started','es')$$,'P0001',null,'attempt language must match content language');
insert into public.training_attempts(id,learner_id,content_id,source_mode,attempt_number,status,language)
values ('8a000000-0000-4000-8000-000000000001','7a000000-0000-4000-8000-000000000001','4a000000-0000-4000-8000-000000000001','go_practice',1,'started','en');
select throws_ok($$insert into public.training_attempts(learner_id,content_id,source_mode,attempt_number,status,language) values ('7a000000-0000-4000-8000-000000000001','4a000000-0000-4000-8000-000000000001','unsupported',2,'started','en')$$,'23514',null,'result provenance uses a controlled source mode');
select lives_ok($$update public.training_attempts set status='completed',completed_at=now(),duration_seconds=42 where id='8a000000-0000-4000-8000-000000000001'$$,'attempt may complete once');
select throws_ok($$update public.training_attempts set status='started',completed_at=null where id='8a000000-0000-4000-8000-000000000001'$$,'P0001',null,'completed attempt cannot reopen');
select throws_ok($$insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed) values ('8a000000-0000-4000-8000-000000000001',3,2,99,true)$$,'P0001',null,'score must match correct and total counts');
insert into public.training_results(id,attempt_id,total_questions,correct_answers,score_percent,completed)
values ('9a000000-0000-4000-8000-000000000001','8a000000-0000-4000-8000-000000000001',3,2,66.67,true);
insert into public.training_result_topics(result_id,topic_id,total_questions,correct_answers)
values ('9a000000-0000-4000-8000-000000000001','2a000000-0000-4000-8000-000000000001',3,2);
select throws_ok($$update public.training_results set score_percent=100 where id='9a000000-0000-4000-8000-000000000001'$$,'P0001',null,'training results are append-only');
select throws_ok($$delete from public.training_results where id='9a000000-0000-4000-8000-000000000001'$$,'P0001',null,'training results cannot be deleted');
select is((select source_mode from public.training_attempts where id='8a000000-0000-4000-8000-000000000001'),'go_practice','practice provenance remains distinct');

-- Training writes remain separate from RBAC, operations, and audit history.
select is((select count(*) from public.user_roles where user_id='ba000000-0000-4000-8000-000000000001'),1::bigint,'training never creates or removes Staff RBAC assignments');
select is((select count(*) from public.user_operational_assignments where user_id='ba000000-0000-4000-8000-000000000001'),0::bigint,'training never fabricates operational assignments');
select is((select count(*) from public.audit_events where target_type like 'training%'),0::bigint,'schema-only certification emits no audit events');

set local role authenticated;
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select throws_ok($$select count(*) from public.training_content$$,'42501',null,'authenticated Staff cannot bypass future protected read contracts');
select throws_ok($$insert into public.training_topics(code,name) values ('browser_topic','Browser Topic')$$,'42501',null,'authenticated browser cannot create Topics');
select throws_ok($$insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed) values ('8a000000-0000-4000-8000-000000000001',3,2,66.67,true)$$,'42501',null,'authenticated browser cannot write results directly');
reset role;

select * from finish();
rollback;
