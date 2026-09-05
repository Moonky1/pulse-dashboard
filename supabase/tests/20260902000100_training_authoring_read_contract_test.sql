begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_function(
  'public',
  'get_training_content_authoring_details',
  array['uuid'],
  'one exact authoring-read contract exists'
);
select is(
  (select proowner::regrole::text from pg_proc where oid = 'public.get_training_content_authoring_details(uuid)'::regprocedure),
  'postgres',
  'authoring read is owned by postgres'
);
select ok(
  (select prosecdef from pg_proc where oid = 'public.get_training_content_authoring_details(uuid)'::regprocedure),
  'authoring read is SECURITY DEFINER'
);
select is(
  (select provolatile::text from pg_proc where oid = 'public.get_training_content_authoring_details(uuid)'::regprocedure),
  's',
  'authoring read is declared stable'
);
select is(
  (select proconfig[1] from pg_proc where oid = 'public.get_training_content_authoring_details(uuid)'::regprocedure),
  'search_path=pg_catalog',
  'authoring read has fixed pg_catalog search_path'
);
select ok(has_function_privilege('authenticated','public.get_training_content_authoring_details(uuid)','EXECUTE'),'authenticated may execute authoring read');
select ok(not has_function_privilege('anon','public.get_training_content_authoring_details(uuid)','EXECUTE'),'anon cannot execute authoring read');
select ok(not coalesce((
  select bool_or(acl.grantee = 0 and acl.privilege_type = 'EXECUTE')
  from pg_proc procedure
  cross join lateral aclexplode(procedure.proacl) acl
  where procedure.oid = 'public.get_training_content_authoring_details(uuid)'::regprocedure
),false),'PUBLIC cannot execute authoring read');
select ok(not has_function_privilege('service_role','public.get_training_content_authoring_details(uuid)','EXECUTE'),'browser service role dependency is absent');
select ok(
  pg_get_functiondef('public.get_training_content_authoring_details(uuid)'::regprocedure)
    !~* '(insert[[:space:]]+into|update[[:space:]]+public|delete[[:space:]]+from|audit_events)',
  'authoring read contains no write or audit statement'
);

insert into public.departments(id,code,name,is_active) values
  ('d2100000-0000-4000-8000-000000000001','studio1b1_ops','Studio 1B.1 Operations',true);
insert into public.campaigns(id,code,name,is_active) values
  ('c2100000-0000-4000-8000-000000000001','studio1b1_alpha','Campaign Alpha',true),
  ('c2100000-0000-4000-8000-000000000002','studio1b1_beta','Campaign Beta',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
  ('e2100000-0000-4000-8000-000000000001','d2100000-0000-4000-8000-000000000001','c2100000-0000-4000-8000-000000000001','studio1b1_north','Team North',true);
insert into public.positions(id,code,name,is_active) values
  ('12100000-0000-4000-8000-000000000001','studio1b1_position','Position One',true);
insert into public.training_topics(id,code,name,is_active) values
  ('22100000-0000-4000-8000-000000000001','studio1b1_alpha','Topic Alpha',true),
  ('22100000-0000-4000-8000-000000000002','studio1b1_beta','Topic Beta',true);

insert into public.roles(id,key,name,is_active) values
  ('82100000-0000-4000-8000-000000000001','studio1b1_author','Unrelated Author Title',true),
  ('82100000-0000-4000-8000-000000000002','studio1b1_publisher','Unrelated Publisher Title',true),
  ('82100000-0000-4000-8000-000000000003','studio1b1_viewer','Unrelated Viewer Title',true),
  ('82100000-0000-4000-8000-000000000004','studio1b1_none','Unrelated No Access Title',true);
insert into public.role_scopes(role_id,scope_type)
select role_id,'campaign'
from unnest(array[
  '82100000-0000-4000-8000-000000000001'::uuid,
  '82100000-0000-4000-8000-000000000002'::uuid,
  '82100000-0000-4000-8000-000000000003'::uuid,
  '82100000-0000-4000-8000-000000000004'::uuid
]) role_id;
insert into public.role_permissions(role_id,permission_id)
select '82100000-0000-4000-8000-000000000001'::uuid,id from public.permissions where key in ('studio.view','studio.create')
union all
select '82100000-0000-4000-8000-000000000002'::uuid,id from public.permissions where key in ('studio.view','studio.publish','go.play')
union all
select '82100000-0000-4000-8000-000000000003'::uuid,id from public.permissions where key = 'studio.view';

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
  ('a2100000-0000-4000-8000-000000000001','authenticated','authenticated','studio1b1.author@example.test','',now(),'{}','{}',now(),now()),
  ('a2100000-0000-4000-8000-000000000002','authenticated','authenticated','studio1b1.publisher@example.test','',now(),'{}','{}',now(),now()),
  ('a2100000-0000-4000-8000-000000000003','authenticated','authenticated','studio1b1.viewer@example.test','',now(),'{}','{}',now(),now()),
  ('a2100000-0000-4000-8000-000000000004','authenticated','authenticated','studio1b1.none@example.test','',now(),'{}','{}',now(),now()),
  ('a2100000-0000-4000-8000-000000000005','authenticated','authenticated','studio1b1.inactive@example.test','',now(),'{}','{}',now(),now()),
  ('a2100000-0000-4000-8000-000000000006','authenticated','authenticated','studio1b1.blocked@example.test','',now(),'{}','{}',now(),now()),
  ('a2100000-0000-4000-8000-000000000007','authenticated','authenticated','studio1b1.outside@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,status,department_id,team_id,position_id,approved_at) values
  ('b2100000-0000-4000-8000-000000000001','a2100000-0000-4000-8000-000000000001','KK-982101','studio1b1.author@example.test','Studio Author','active','d2100000-0000-4000-8000-000000000001','e2100000-0000-4000-8000-000000000001','12100000-0000-4000-8000-000000000001',now()),
  ('b2100000-0000-4000-8000-000000000002','a2100000-0000-4000-8000-000000000002','KK-982102','studio1b1.publisher@example.test','Studio Publisher','active','d2100000-0000-4000-8000-000000000001','e2100000-0000-4000-8000-000000000001','12100000-0000-4000-8000-000000000001',now()),
  ('b2100000-0000-4000-8000-000000000003','a2100000-0000-4000-8000-000000000003','KK-982103','studio1b1.viewer@example.test','Studio Viewer','active','d2100000-0000-4000-8000-000000000001','e2100000-0000-4000-8000-000000000001','12100000-0000-4000-8000-000000000001',now()),
  ('b2100000-0000-4000-8000-000000000004','a2100000-0000-4000-8000-000000000004','KK-982104','studio1b1.none@example.test','Studio None','active','d2100000-0000-4000-8000-000000000001','e2100000-0000-4000-8000-000000000001','12100000-0000-4000-8000-000000000001',now()),
  ('b2100000-0000-4000-8000-000000000005','a2100000-0000-4000-8000-000000000005','KK-982105','studio1b1.inactive@example.test','Studio Inactive','inactive','d2100000-0000-4000-8000-000000000001','e2100000-0000-4000-8000-000000000001','12100000-0000-4000-8000-000000000001',now()),
  ('b2100000-0000-4000-8000-000000000006','a2100000-0000-4000-8000-000000000006','KK-982106','studio1b1.blocked@example.test','Studio Blocked','blocked','d2100000-0000-4000-8000-000000000001','e2100000-0000-4000-8000-000000000001','12100000-0000-4000-8000-000000000001',now()),
  ('b2100000-0000-4000-8000-000000000007','a2100000-0000-4000-8000-000000000007','KK-982107','studio1b1.outside@example.test','Studio Outside','active','d2100000-0000-4000-8000-000000000001',null,'12100000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type,campaign_id) values
  ('f2100000-0000-4000-8000-000000000001','b2100000-0000-4000-8000-000000000001','82100000-0000-4000-8000-000000000001','campaign','c2100000-0000-4000-8000-000000000001'),
  ('f2100000-0000-4000-8000-000000000002','b2100000-0000-4000-8000-000000000002','82100000-0000-4000-8000-000000000002','campaign','c2100000-0000-4000-8000-000000000001'),
  ('f2100000-0000-4000-8000-000000000003','b2100000-0000-4000-8000-000000000003','82100000-0000-4000-8000-000000000003','campaign','c2100000-0000-4000-8000-000000000001'),
  ('f2100000-0000-4000-8000-000000000004','b2100000-0000-4000-8000-000000000004','82100000-0000-4000-8000-000000000004','campaign','c2100000-0000-4000-8000-000000000001'),
  ('f2100000-0000-4000-8000-000000000005','b2100000-0000-4000-8000-000000000005','82100000-0000-4000-8000-000000000001','campaign','c2100000-0000-4000-8000-000000000001'),
  ('f2100000-0000-4000-8000-000000000006','b2100000-0000-4000-8000-000000000006','82100000-0000-4000-8000-000000000001','campaign','c2100000-0000-4000-8000-000000000001'),
  ('f2100000-0000-4000-8000-000000000007','b2100000-0000-4000-8000-000000000007','82100000-0000-4000-8000-000000000002','campaign','c2100000-0000-4000-8000-000000000002');

create temporary table studio1b1_draft(content_id uuid primary key);
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000001',true);
insert into studio1b1_draft(content_id)
select id from public.create_training_content_draft(
  'quiz','Draft Quiz Alpha','Lossless authoring fixture','en',
  array['22100000-0000-4000-8000-000000000001'::uuid,'22100000-0000-4000-8000-000000000002'::uuid],
  'campaign','c2100000-0000-4000-8000-000000000001',null,
  array['12100000-0000-4000-8000-000000000001'::uuid]
);
select lives_ok(format(
  $q$select * from public.replace_training_questions(%L::uuid,
  '[{"position":1,"question_type":"multiple_choice","prompt":"Choose Alpha","answer_options":["Beta","Alpha"],"correct_answer":1,"explanation":"Alpha is correct","topic_ids":["22100000-0000-4000-8000-000000000001"]},{"position":2,"question_type":"true_false","prompt":"Pulse is ready","answer_options":[],"correct_answer":true,"explanation":"This is true","topic_ids":["22100000-0000-4000-8000-000000000002"]},{"position":3,"question_type":"text","prompt":"Type the accepted word","answer_options":[],"correct_answer":["pulse","Pulse"],"explanation":"Exact match only","topic_ids":["22100000-0000-4000-8000-000000000001","22100000-0000-4000-8000-000000000002"]}]'::jsonb,
  %L::timestamptz)$q$,
  (select content_id from studio1b1_draft),
  (select updated_at from public.training_content where id=(select content_id from studio1b1_draft))
),'three canonical question types persist');

create temporary table studio1b1_read as
select public.get_training_content_authoring_details(content_id) body
from studio1b1_draft;
create temporary table studio1b1_audit_baseline as
select count(*)::bigint count from public.audit_events;

select is((select body->'content'->>'title' from studio1b1_read),'Draft Quiz Alpha','content title roundtrips');
select is((select body->'content'->>'content_type' from studio1b1_read),'quiz','content type roundtrips');
select is((select body->'content'->>'language' from studio1b1_read),'en','language roundtrips');
select is((select body->'content'->>'status' from studio1b1_read),'draft','draft status is explicit');
select is((select body->'content'->'creator'->>'display_name' from studio1b1_read),'Studio Author','only safe creator display is returned');
select is((select (body->'content'->>'updated_at')::timestamptz from studio1b1_read),(select updated_at from public.training_content where id=(select content_id from studio1b1_draft)),'updated_at is the canonical server version');
select is((select jsonb_array_length(body->'topics') from studio1b1_read),2,'content Topics roundtrip');
select is((select body->'audience'->>'scope_type' from studio1b1_read),'campaign','Campaign audience roundtrips');
select is((select body->'audience'->>'campaign_name' from studio1b1_read),'Campaign Alpha','Campaign display is server resolved');
select is((select jsonb_array_length(body->'position_targets') from studio1b1_read),1,'Position targets roundtrip');
select is((select body->'position_targets'->0->>'name' from studio1b1_read),'Position One','Position display is server resolved');
select is((select jsonb_array_length(body->'questions') from studio1b1_read),3,'all questions roundtrip');
select is((select body->'questions'->0->>'question_type' from studio1b1_read),'multiple_choice','multiple choice serializes canonically');
select is((select body->'questions'->0->'answer_options' from studio1b1_read),'["Beta", "Alpha"]'::jsonb,'multiple-choice options are lossless');
select is((select body->'questions'->0->'correct_answer' from studio1b1_read),'1'::jsonb,'multiple-choice correct index is lossless');
select is((select body->'questions'->1->'correct_answer' from studio1b1_read),'true'::jsonb,'true/false answer remains boolean');
select is((select body->'questions'->2->'correct_answer' from studio1b1_read),'["pulse", "Pulse"]'::jsonb,'text accepted answers remain exact strings');
select is((select jsonb_array_length(body->'questions'->2->'topic_ids') from studio1b1_read),2,'per-question Topic relationships roundtrip');
select is((select body from studio1b1_read),(select public.get_training_content_authoring_details(content_id) from studio1b1_draft),'browser reload reconstructs the exact same payload');
select is((select count(*) from public.audit_events),(select count from studio1b1_audit_baseline),'authoring reads create no audit event');

select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000002',true);
select lives_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'eligible studio.publish may review draft answers');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000003',true);
select throws_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'P0002','Studio content unavailable','studio.view alone cannot read answer keys');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000004',true);
select throws_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'P0002','Studio content unavailable','Staff without Studio permission is denied without existence leakage');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000007',true);
select throws_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'P0002','Studio content unavailable','publisher outside exact Campaign scope is denied');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000005',true);
select throws_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'42501','active Staff identity required','inactive Staff is denied');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000006',true);
select throws_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'42501','active Staff identity required','blocked Staff is denied');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.get_training_content_authoring_details('00000000-0000-4000-8000-000000000000')$$,'P0002','Studio content unavailable','missing content uses the same unavailable response');

create temporary table studio1b1_published(content_id uuid primary key);
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000001',true);
insert into studio1b1_published(content_id)
select id from public.create_training_content_draft(
  'assessment','Published Assessment Beta',null,'es',
  array['22100000-0000-4000-8000-000000000002'::uuid],
  'campaign','c2100000-0000-4000-8000-000000000001',null,'{}'::uuid[]
);
select lives_ok(format(
  $q$select * from public.replace_training_questions(%L::uuid,'[{"position":1,"question_type":"true_false","prompt":"Published check","answer_options":[],"correct_answer":true,"topic_ids":["22100000-0000-4000-8000-000000000002"]}]'::jsonb,%L::timestamptz)$q$,
  (select content_id from studio1b1_published),
  (select updated_at from public.training_content where id=(select content_id from studio1b1_published))
),'published fixture question persists');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000002',true);
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',(select content_id from studio1b1_published),(select updated_at from public.training_content where id=(select content_id from studio1b1_published))),'publisher creates canonical published fixture');
select is((select public.get_training_content_authoring_details(content_id)->'content'->>'status' from studio1b1_published),'published','publisher may inspect published content');
select ok((select public.get_training_content_authoring_details(content_id)->'content'->>'published_at' is not null from studio1b1_published),'published timestamp is returned');
select ok((select public.get_go_practice_content(content_id) from studio1b1_published)::text !~ 'correct_answer|explanation','learner Practice payload omits answer keys and explanations');
select ok((select public.get_go_practice_content(content_id) from studio1b1_published)::text ~ 'Published check','learner Practice still returns the question prompt');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000001',true);
select lives_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_published)),'scope-authorized creator retains read-only access to their published work');
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000002',true);
select lives_ok(format('select * from public.archive_training_content(%L::uuid)',(select content_id from studio1b1_published)),'publisher creates canonical archived fixture');
select is((select public.get_training_content_authoring_details(content_id)->'content'->>'status' from studio1b1_published),'archived','publisher may inspect archived content');
select ok((select public.get_training_content_authoring_details(content_id)->'content'->>'archived_at' is not null from studio1b1_published),'archived timestamp is returned');

select ok(pg_get_functiondef('public.list_training_catalog(text,text,uuid,text,integer,integer)'::regprocedure) !~ '\mcorrect_answer\M','catalog definition does not expose answer keys');
select ok(pg_get_functiondef('public.get_go_practice_content(uuid)'::regprocedure) !~ '\mcorrect_answer\M','GO Practice definition does not expose answer keys');
select ok(pg_get_functiondef('public.list_academy_modules(text)'::regprocedure) !~ '\mcorrect_answer\M','Academy definition does not expose answer keys');

select ok(not has_table_privilege('authenticated','public.training_content','SELECT'),'browser still cannot directly read training_content');
select ok(not has_table_privilege('authenticated','public.training_questions','SELECT'),'browser still cannot directly read training_questions');
select ok(not has_table_privilege('authenticated','public.training_content_topics','SELECT'),'browser still cannot directly read content Topics');
select ok(not has_table_privilege('authenticated','public.training_question_topics','SELECT'),'browser still cannot directly read question Topics');
select ok(not has_table_privilege('authenticated','public.training_content_audiences','SELECT'),'browser still cannot directly read audiences');
select ok(not has_table_privilege('authenticated','public.training_content_position_targets','SELECT'),'browser still cannot directly read Position targets');

grant select on studio1b1_published to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','a2100000-0000-4000-8000-000000000002',true);
select lives_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_published)),'authenticated browser uses the RPC successfully');
select throws_ok($$select count(*) from public.training_questions$$,'42501',null,'authenticated browser cannot bypass RPC with a table SELECT');
reset role;

select set_config('request.jwt.claim.sub','',true);
select throws_ok(format('select public.get_training_content_authoring_details(%L::uuid)',(select content_id from studio1b1_draft)),'28000','authentication required','missing authenticated identity is denied');

select * from finish();
rollback;
