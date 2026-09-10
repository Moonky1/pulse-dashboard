begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Contract, ownership, Realtime minimization, and browser ACLs.
select has_table('public','go_sessions','hosted room lifecycle table exists');
select has_table('public','go_session_participants','safe Realtime participant table exists');
select has_table('public','go_session_memberships','protected identity binding exists');
select has_function('public','list_go_host_catalog',array['text','integer','integer'],'host catalog RPC exists');
select has_function('public','create_go_hosted_session',array['uuid'],'create room RPC exists');
select has_function('public','join_go_hosted_session',array['text'],'join room RPC exists');
select has_function('public','get_go_hosted_session',array['uuid'],'room snapshot RPC exists');
select has_function('public','start_go_hosted_session',array['uuid','integer'],'start room RPC exists');
select has_function('public','submit_go_hosted_answer',array['uuid','uuid','jsonb','integer'],'answer RPC exists');
select has_function('public','advance_go_hosted_session',array['uuid','integer'],'advance RPC exists');
select has_function('public','cancel_go_hosted_session',array['uuid','integer'],'cancel RPC exists');
select ok((select relrowsecurity from pg_class where oid='public.go_sessions'::regclass),'rooms use RLS');
select ok((select relrowsecurity from pg_class where oid='public.go_session_participants'::regclass),'safe participants use RLS');
select ok((select relrowsecurity from pg_class where oid='public.go_session_memberships'::regclass),'private membership uses RLS');
select ok(has_table_privilege('authenticated','public.go_sessions','SELECT'),'authenticated may subscribe to visible room state');
select ok(has_table_privilege('authenticated','public.go_session_participants','SELECT'),'authenticated may subscribe to safe visible presence');
select ok(not has_table_privilege('authenticated','public.go_session_memberships','SELECT'),'browser cannot read identity bindings');
select ok(has_function_privilege('authenticated','pulse_private.can_view_go_session(uuid)','EXECUTE'),'authenticated RLS evaluator may check only its own room visibility');
select ok(not has_table_privilege('authenticated','public.go_sessions','INSERT,UPDATE,DELETE'),'browser cannot write rooms directly');
select ok(not has_table_privilege('authenticated','public.go_session_participants','INSERT,UPDATE,DELETE'),'browser cannot write presence directly');
select is((select count(*) from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename in ('go_sessions','go_session_participants')),2::bigint,'only two safe GO tables are added to Realtime');
select is((select count(*) from pg_publication_tables where pubname='supabase_realtime' and tablename in ('training_questions','training_attempt_answers','go_session_memberships')),0::bigint,'answer keys, answers, and identity links are not published');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='go_session_participants' and column_name ~ '(user|auth|learner|attempt|email|role)_?id'),'Realtime participant payload has no identity UUID fields');
select is((select proowner::regrole::text from pg_proc where oid='public.create_go_hosted_session(uuid)'::regprocedure),'postgres','create owner is postgres');
select ok((select prosecdef from pg_proc where oid='public.submit_go_hosted_answer(uuid,uuid,jsonb,integer)'::regprocedure),'answer submission is SECURITY DEFINER');
select is((select proconfig[1] from pg_proc where oid='public.advance_go_hosted_session(uuid,integer)'::regprocedure),'search_path=pg_catalog','advance fixes search_path');
select ok(has_function_privilege('authenticated','public.join_go_hosted_session(text)','EXECUTE'),'authenticated may join through RPC');
select ok(not has_function_privilege('anon','public.join_go_hosted_session(text)','EXECUTE'),'anon cannot join');
select ok(not has_function_privilege('service_role','public.submit_go_hosted_answer(uuid,uuid,jsonb,integer)','EXECUTE'),'public answer contract has no service-role dependency');

-- Entirely fictitious local fixtures.
insert into public.departments(id,code,name,is_active) values
 ('da200000-0000-4000-8000-000000000001','go1b_ops','GO-1B Operations',true),
 ('da200000-0000-4000-8000-000000000002','go1b_other','GO-1B Other',true);
insert into public.campaigns(id,code,name,is_active) values
 ('ca200000-0000-4000-8000-000000000001','go1b_campaign','GO-1B Campaign',true),
 ('ca200000-0000-4000-8000-000000000002','go1b_other_campaign','GO-1B Other Campaign',true);
insert into public.teams(id,department_id,campaign_id,code,name,is_active) values
 ('ea200000-0000-4000-8000-000000000001','da200000-0000-4000-8000-000000000001','ca200000-0000-4000-8000-000000000001','go1b_team','GO-1B Team',true),
 ('ea200000-0000-4000-8000-000000000002','da200000-0000-4000-8000-000000000002','ca200000-0000-4000-8000-000000000002','go1b_other_team','GO-1B Other Team',true);
insert into public.roles(id,key,name,is_active) values
 ('8a200000-0000-4000-8000-000000000001','go1b_host_role','GO-1B Host Role',true),
 ('8a200000-0000-4000-8000-000000000002','go1b_play_role','GO-1B Play Role',true),
 ('8a200000-0000-4000-8000-000000000003','go1b_none_role','GO-1B None Role',true);
insert into public.role_scopes(role_id,scope_type) values
 ('8a200000-0000-4000-8000-000000000001','global'),
 ('8a200000-0000-4000-8000-000000000002','global'),
 ('8a200000-0000-4000-8000-000000000003','global');
insert into public.role_permissions(role_id,permission_id)
select '8a200000-0000-4000-8000-000000000001',id from public.permissions
where key in ('go.host','studio.view','studio.create','studio.publish');
insert into public.role_permissions(role_id,permission_id)
select '8a200000-0000-4000-8000-000000000002',id from public.permissions where key='go.play';

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('aa200000-0000-4000-8000-000000000001','authenticated','authenticated','go1b.host@example.test','',now(),'{}','{}',now(),now()),
 ('aa200000-0000-4000-8000-000000000002','authenticated','authenticated','go1b.player1@example.test','',now(),'{}','{}',now(),now()),
 ('aa200000-0000-4000-8000-000000000003','authenticated','authenticated','go1b.player2@example.test','',now(),'{}','{}',now(),now()),
 ('aa200000-0000-4000-8000-000000000004','authenticated','authenticated','go1b.denied@example.test','',now(),'{}','{}',now(),now()),
 ('aa200000-0000-4000-8000-000000000005','authenticated','authenticated','go1b.other@example.test','',now(),'{}','{}',now(),now()),
 ('aa200000-0000-4000-8000-000000000006','authenticated','authenticated','go1b.inactive@example.test','',now(),'{}','{}',now(),now());
insert into public.users(id,auth_user_id,employee_id,email,full_name,display_name,status,department_id,team_id,approved_at) values
 ('ba200000-0000-4000-8000-000000000001','aa200000-0000-4000-8000-000000000001','KK-962001','go1b.host@example.test','Fictitious Host Staff','Host Staff','active','da200000-0000-4000-8000-000000000001','ea200000-0000-4000-8000-000000000001',now()),
 ('ba200000-0000-4000-8000-000000000002','aa200000-0000-4000-8000-000000000002','KK-962002','go1b.player1@example.test','Fictitious Player One','Player One','active','da200000-0000-4000-8000-000000000001','ea200000-0000-4000-8000-000000000001',now()),
 ('ba200000-0000-4000-8000-000000000003','aa200000-0000-4000-8000-000000000003','KK-962003','go1b.player2@example.test','Fictitious Player Two','Player Two','active','da200000-0000-4000-8000-000000000001','ea200000-0000-4000-8000-000000000001',now()),
 ('ba200000-0000-4000-8000-000000000004','aa200000-0000-4000-8000-000000000004','KK-962004','go1b.denied@example.test','Fictitious Denied','Denied','active','da200000-0000-4000-8000-000000000001','ea200000-0000-4000-8000-000000000001',now()),
 ('ba200000-0000-4000-8000-000000000005','aa200000-0000-4000-8000-000000000005','KK-962005','go1b.other@example.test','Fictitious Other Scope','Other Scope','active','da200000-0000-4000-8000-000000000002','ea200000-0000-4000-8000-000000000002',now()),
 ('ba200000-0000-4000-8000-000000000006','aa200000-0000-4000-8000-000000000006','KK-962006','go1b.inactive@example.test','Fictitious Inactive','Inactive','inactive','da200000-0000-4000-8000-000000000001','ea200000-0000-4000-8000-000000000001',now());
insert into public.user_roles(id,user_id,role_id,scope_type) values
 ('fa200000-0000-4000-8000-000000000001','ba200000-0000-4000-8000-000000000001','8a200000-0000-4000-8000-000000000001','global'),
 ('fa200000-0000-4000-8000-000000000002','ba200000-0000-4000-8000-000000000002','8a200000-0000-4000-8000-000000000002','global'),
 ('fa200000-0000-4000-8000-000000000003','ba200000-0000-4000-8000-000000000003','8a200000-0000-4000-8000-000000000002','global'),
 ('fa200000-0000-4000-8000-000000000004','ba200000-0000-4000-8000-000000000004','8a200000-0000-4000-8000-000000000003','global'),
 ('fa200000-0000-4000-8000-000000000005','ba200000-0000-4000-8000-000000000005','8a200000-0000-4000-8000-000000000002','global'),
 ('fa200000-0000-4000-8000-000000000006','ba200000-0000-4000-8000-000000000006','8a200000-0000-4000-8000-000000000002','global');
insert into public.training_topics(id,code,name,is_active) values
 ('2a200000-0000-4000-8000-000000000001','go1b_product_skills','Product Skills',true);

create temporary table go1b_content(content_id uuid primary key);
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
insert into go1b_content select id from public.create_training_content_draft(
  'quiz','Hosted Quiz Alpha','Three fictitious hosted questions.','en',
  array['2a200000-0000-4000-8000-000000000001'::uuid],'global',null,null,'{}'::uuid[]
);
select lives_ok(format($q$select * from public.replace_training_questions(%L::uuid,'[
 {"position":1,"question_type":"multiple_choice","prompt":"Choose Alpha","answer_options":["Beta","Alpha"],"correct_answer":1,"explanation":"private alpha","topic_ids":["2a200000-0000-4000-8000-000000000001"]},
 {"position":2,"question_type":"true_false","prompt":"Hosted scoring is server owned","answer_options":[],"correct_answer":true,"topic_ids":["2a200000-0000-4000-8000-000000000001"]},
 {"position":3,"question_type":"text","prompt":"Type Alpha","answer_options":[],"correct_answer":["Alpha"],"topic_ids":["2a200000-0000-4000-8000-000000000001"]}
 ]'::jsonb,%L::timestamptz)$q$,(select content_id from go1b_content),(select updated_at from public.training_content where id=(select content_id from go1b_content))),'three canonical question types are accepted');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',(select content_id from go1b_content),(select updated_at from public.training_content where id=(select content_id from go1b_content))),'Hosted Quiz Alpha publishes');
create temporary table go1b_audit_baseline(event_count bigint);
insert into go1b_audit_baseline select count(*) from public.audit_events;

-- Host catalog and creation are server-authoritative.
select is((select count(*) from public.list_go_host_catalog(null,100,0)),1::bigint,'eligible host sees published hosted content');
select ok(not ((select to_jsonb(item) from public.list_go_host_catalog(null,100,0) item)::text ~ 'correct_answer|private alpha'),'host catalog exposes no answer key');
create temporary table go1b_room(room_id uuid primary key,room_code text,version integer);
insert into go1b_room select (room->>'session_id')::uuid,room->>'room_code',(room->>'version')::integer
from (select public.create_go_hosted_session((select content_id from go1b_content)) room) created;
select matches((select room_code from go1b_room),'^KK [0-9]{4}$','room code is server-generated in KK #### format');
select is((public.create_go_hosted_session((select content_id from go1b_content))->>'session_id')::uuid,(select room_id from go1b_room),'double create safely returns the current room');
select is((select count(*) from public.go_sessions),1::bigint,'double create does not duplicate rooms');
select is((select count(*) from public.go_session_memberships where member_kind='host'),1::bigint,'canonical host is stored once');
select ok(not (public.get_go_hosted_session((select room_id from go1b_room))::text ~ 'email|auth_user|staff_user|learner_id|attempt_id|role_id'),'host snapshot exposes no identity internals');

-- Join is idempotent, eligibility-bound, and not an authorization token.
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select lives_ok(format('select public.join_go_hosted_session(%L)',(select room_code from go1b_room)),'Player One joins with normalized server lookup');
select lives_ok(format('select public.join_go_hosted_session(%L)',replace((select room_code from go1b_room),' ','')),'compact room code safely resumes membership');
select is((select count(*) from public.go_session_participants),1::bigint,'duplicate join creates one safe participant row');
select is((select participant_label from public.go_session_participants),'Player One','only safe display name is published');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000003',true);
select lives_ok(format('select public.join_go_hosted_session(%L)',(select room_code from go1b_room)),'Player Two joins');
select is((select count(*) from public.go_session_participants),2::bigint,'two independent players are present');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000004',true);
select throws_ok(format('select public.join_go_hosted_session(%L)',(select room_code from go1b_room)),'42501',null,'permission-less Staff cannot join by knowing the code');
select throws_ok($$select public.join_go_hosted_session('KK 0000')$$,'P0002',null,'unknown code returns uniform unavailable response');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000006',true);
select throws_ok(format('select public.join_go_hosted_session(%L)',(select room_code from go1b_room)),'42501',null,'inactive Staff cannot join');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
select throws_ok(format('select public.join_go_hosted_session(%L)',(select room_code from go1b_room)),'42501',null,'host cannot join own room as a player');

-- Start creates exactly one canonical hosted attempt per participant.
update go1b_room set version=(select version from public.go_sessions where id=room_id);
select lives_ok(format('select public.start_go_hosted_session(%L::uuid,%s)',(select room_id from go1b_room),(select version from go1b_room)),'host starts the lobby with expected version');
select is((select status from public.go_sessions),'active','room transitions lobby to active');
select is((select current_question_position from public.go_sessions),1,'first question is server-owned');
select is((select count(*) from public.training_attempts where source_mode='go_hosted'),2::bigint,'start creates two canonical hosted attempts');
select is((select count(*) from public.go_session_memberships where member_kind='participant' and attempt_id is not null),2::bigint,'both participants bind to one attempt');
select is((select count(distinct attempt_id) from public.go_session_memberships where member_kind='participant'),2::bigint,'participant attempts are distinct');
select lives_ok(format('select public.start_go_hosted_session(%L::uuid,%s)',(select room_id from go1b_room),(select version from go1b_room)),'double start is idempotent');
select is((select count(*) from public.training_attempts where source_mode='go_hosted'),2::bigint,'double start creates no duplicate attempt');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000005',true);
select throws_ok(format('select public.join_go_hosted_session(%L)',(select room_code from go1b_room)),'P0002',null,'mid-game join is denied uniformly');

-- Only current-question payload is exposed; answers are immutable and private.
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select is(public.get_go_hosted_session((select room_id from go1b_room))->'current_question'->>'position','1','player sees current question only');
select ok(not (public.get_go_hosted_session((select room_id from go1b_room))::text ~ 'correct_answer|private alpha|is_correct'),'live snapshot exposes no correctness or explanation');
select lives_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=1),'1'::jsonb,1)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'Player One submits current MC answer');
select lives_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=1),'1'::jsonb,1)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'identical retry is idempotent');
select throws_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=1),'0'::jsonb,1)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'55000',null,'answer cannot be overwritten');
select is((select count(*) from public.training_attempt_answers),1::bigint,'answer retry stores one canonical row');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000003',true);
select lives_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=1),'0'::jsonb,1)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'Player Two submits independently');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
select is((public.get_go_hosted_session((select room_id from go1b_room))->>'answered_count')::integer,2,'host sees aggregate answered count');
select ok(not (public.get_go_hosted_session((select room_id from go1b_room))::text ~ 'submitted_answer|is_correct'),'host cannot see individual answers');
update go1b_room set version=(select version from public.go_sessions where id=room_id);
select lives_ok(format('select public.advance_go_hosted_session(%L::uuid,%s)',(select room_id from go1b_room),(select version from go1b_room)),'host advances to question two');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select throws_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=1),'1'::jsonb,1)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'55000',null,'late prior-question answer is denied');
select lives_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=2),'true'::jsonb,2)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'Player One submits true/false answer');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
update go1b_room set version=(select version from public.go_sessions where id=room_id);
select lives_ok(format('select public.advance_go_hosted_session(%L::uuid,%s)',(select room_id from go1b_room),(select version from go1b_room)),'host advances without fabricating missing answers');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select lives_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=3),'"Alpha"'::jsonb,3)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'Player One submits text answer');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000003',true);
select lives_ok(format($q$select public.submit_go_hosted_answer(%L::uuid,(select id from public.training_questions where content_id=%L::uuid and position=3),'"Beta"'::jsonb,3)$q$,(select room_id from go1b_room),(select content_id from go1b_content)),'Player Two submits text answer');

-- Completion is exactly-once and writes the canonical Training history.
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
update go1b_room set version=(select version from public.go_sessions where id=room_id);
select lives_ok(format('select public.advance_go_hosted_session(%L::uuid,%s)',(select room_id from go1b_room),(select version from go1b_room)),'final advance completes server-side');
select is((select status from public.go_sessions where id=(select room_id from go1b_room)),'completed','room reaches completed exactly once');
select is((select count(*) from public.training_results result join public.training_attempts attempt on attempt.id=result.attempt_id where attempt.source_mode='go_hosted'),2::bigint,'two canonical hosted results persist');
select is((select count(*) from public.training_result_topics result_topic join public.training_results result on result.id=result_topic.result_id join public.training_attempts attempt on attempt.id=result.attempt_id where attempt.source_mode='go_hosted'),2::bigint,'topic breakdown persists for both players');
select is((select count(*) from public.training_attempt_answers),5::bigint,'only submitted answers persist; missing answer is not fabricated');
select is((select count(*) from public.training_results where total_questions=3),2::bigint,'both results retain canonical total question count');
select is((select correct_answers from public.training_results result join public.go_session_memberships membership on membership.attempt_id=result.attempt_id where membership.staff_user_id='ba200000-0000-4000-8000-000000000002'),3,'Player One receives server-owned 3/3');
select is((select correct_answers from public.training_results result join public.go_session_memberships membership on membership.attempt_id=result.attempt_id where membership.staff_user_id='ba200000-0000-4000-8000-000000000003'),0,'Player Two receives server-owned 0/3 including unanswered');
select lives_ok(format('select public.advance_go_hosted_session(%L::uuid,%s)',(select room_id from go1b_room),(select version from public.go_sessions where id=(select room_id from go1b_room))),'finish retry is idempotent');
select is((select count(*) from public.training_results),2::bigint,'finish retry creates no duplicate results');
select is((public.get_go_hosted_session((select room_id from go1b_room))->'host_summary'->>'players')::integer,2,'host receives aggregate summary without leaderboard');
select ok(not (public.get_go_hosted_session((select room_id from go1b_room))::text ~ 'Player One|Player Two'),'completed host summary contains no player leaderboard');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select is((public.get_go_hosted_session((select room_id from go1b_room))->'my_result'->>'correct_answers')::integer,3,'player sees only personal canonical result');
select is((select source_mode from public.list_my_training_results(50) limit 1),'go_hosted','hosted result appears in canonical personal history');

-- Completed room releases the host for another game; lobby cancellation creates no results.
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
create temporary table go1b_second(room jsonb);
insert into go1b_second select public.create_go_hosted_session((select content_id from go1b_content));
select isnt(((select room from go1b_second)->>'session_id')::uuid,(select room_id from go1b_room),'second game gets a new append-only session');
select lives_ok(format('select public.cancel_go_hosted_session(%L::uuid,%s)',((select room from go1b_second)->>'session_id')::uuid,((select room from go1b_second)->>'version')::integer),'host cancels second lobby safely');
select is((select count(*) from public.training_results),2::bigint,'cancelled lobby creates no result');
select is((select count(*) from public.training_attempts where source_mode='go_hosted'),2::bigint,'cancelled lobby creates no attempt');
select is((select status from public.go_sessions where id=((select room from go1b_second)->>'session_id')::uuid),'cancelled','cancelled lifecycle is explicit');

create temporary table go1b_third(room jsonb);
insert into go1b_third select public.create_go_hosted_session((select content_id from go1b_content));
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select lives_ok(format('select public.join_go_hosted_session(%L)',(select room->>'room_code' from go1b_third)),'player joins a fresh cancellation fixture');
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000001',true);
select lives_ok(format('select public.start_go_hosted_session(%L::uuid,%s)',(select (room->>'session_id')::uuid from go1b_third),(select (room->>'version')::integer+1 from go1b_third)),'host starts cancellation fixture');
select lives_ok(format('select public.cancel_go_hosted_session(%L::uuid,%s)',(select (room->>'session_id')::uuid from go1b_third),(select version from public.go_sessions where id=(select (room->>'session_id')::uuid from go1b_third))),'host cancels an active room safely');
select is((select status from public.training_attempts where id=(select attempt_id from public.go_session_memberships where session_id=(select (room->>'session_id')::uuid from go1b_third) and member_kind='participant')),'abandoned','active cancellation abandons the hosted attempt');
select is((select count(*) from public.training_results),2::bigint,'active cancellation creates no additional result');
select is((select count(*) from public.audit_events),(select event_count from go1b_audit_baseline),'hosted lifecycle creates no browser-side business audit event');

-- Canonical content targeting remains valid for Global, Campaign, and Team.
create temporary table go1b_scoped_content(scope_type text primary key,content_id uuid);
insert into go1b_scoped_content values ('campaign',(select id from public.create_training_content_draft(
  'quiz','GO-1B Campaign Quiz',null,'en',array['2a200000-0000-4000-8000-000000000001'::uuid],
  'campaign','ca200000-0000-4000-8000-000000000001',null,'{}'::uuid[]
)));
insert into go1b_scoped_content values ('team',(select id from public.create_training_content_draft(
  'quiz','GO-1B Team Quiz',null,'en',array['2a200000-0000-4000-8000-000000000001'::uuid],
  'team',null,'ea200000-0000-4000-8000-000000000001','{}'::uuid[]
)));
select lives_ok(format($q$select * from public.replace_training_questions(%L::uuid,'[{"position":1,"question_type":"true_false","prompt":"Campaign ready?","answer_options":[],"correct_answer":true,"topic_ids":["2a200000-0000-4000-8000-000000000001"]}]'::jsonb,%L::timestamptz)$q$,(select content_id from go1b_scoped_content where scope_type='campaign'),(select updated_at from public.training_content where id=(select content_id from go1b_scoped_content where scope_type='campaign'))),'campaign-scoped hosted content accepts canonical question');
select lives_ok(format($q$select * from public.replace_training_questions(%L::uuid,'[{"position":1,"question_type":"true_false","prompt":"Team ready?","answer_options":[],"correct_answer":true,"topic_ids":["2a200000-0000-4000-8000-000000000001"]}]'::jsonb,%L::timestamptz)$q$,(select content_id from go1b_scoped_content where scope_type='team'),(select updated_at from public.training_content where id=(select content_id from go1b_scoped_content where scope_type='team'))),'team-scoped hosted content accepts canonical question');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',(select content_id from go1b_scoped_content where scope_type='campaign'),(select updated_at from public.training_content where id=(select content_id from go1b_scoped_content where scope_type='campaign'))),'campaign-scoped hosted content publishes');
select lives_ok(format('select * from public.publish_training_content(%L::uuid,%L::timestamptz)',(select content_id from go1b_scoped_content where scope_type='team'),(select updated_at from public.training_content where id=(select content_id from go1b_scoped_content where scope_type='team'))),'team-scoped hosted content publishes');
select ok(pulse_private.go_staff_has_content_permission('go.play',(select content_id from go1b_scoped_content where scope_type='campaign'),'ba200000-0000-4000-8000-000000000002'),'Campaign target accepts eligible Campaign Staff');
select ok(not pulse_private.go_staff_has_content_permission('go.play',(select content_id from go1b_scoped_content where scope_type='campaign'),'ba200000-0000-4000-8000-000000000005'),'Campaign target denies Staff in another Campaign');
select ok(pulse_private.go_staff_has_content_permission('go.play',(select content_id from go1b_scoped_content where scope_type='team'),'ba200000-0000-4000-8000-000000000002'),'Team target accepts eligible Team Staff');
select ok(not pulse_private.go_staff_has_content_permission('go.play',(select content_id from go1b_scoped_content where scope_type='team'),'ba200000-0000-4000-8000-000000000005'),'Team target denies Staff in another Team');
select is((select count(*) from public.list_go_host_catalog(null,100,0)),3::bigint,'host catalog includes exact Global, Campaign, and Team targets in scope');
update public.campaigns set is_active=false where id='ca200000-0000-4000-8000-000000000001';
select ok(not pulse_private.go_staff_has_content_permission('go.play',(select content_id from go1b_scoped_content where scope_type='campaign'),'ba200000-0000-4000-8000-000000000002'),'inactive Campaign fails closed for hosted eligibility');
update public.campaigns set is_active=true where id='ca200000-0000-4000-8000-000000000001';
update go1b_audit_baseline set event_count=(select count(*) from public.audit_events);

-- Archived content cannot create a new room; completed historical room remains intact.
update public.training_content set status='archived',archived_at=now(),updated_at=now()
where id=(select content_id from go1b_content);
select throws_ok(format('select public.create_go_hosted_session(%L::uuid)',(select content_id from go1b_content)),'42501',null,'archived content cannot create a new room');
select is((select count(*) from public.training_results),2::bigint,'archive does not alter completed hosted history');

-- Direct browser operations and cross-room access remain denied.
set local role authenticated;
select set_config('request.jwt.claim.sub','aa200000-0000-4000-8000-000000000002',true);
select throws_ok($$select count(*) from public.go_session_memberships$$,'42501',null,'browser cannot read private membership');
select throws_ok($$insert into public.go_sessions(room_code,content_id,question_count) values('KK 9999','00000000-0000-0000-0000-000000000001',1)$$,'42501',null,'browser cannot forge room');
select throws_ok($$update public.go_session_participants set participant_label='Forged'$$,'42501',null,'browser cannot forge presence');
select is((select count(*) from public.go_sessions),2::bigint,'RLS shows player only the two rooms they joined and hides the host-only room');
select is((select count(*) from public.go_session_participants),3::bigint,'RLS shows only safe rosters from rooms the player joined');
reset role;

select is((select count(*) from public.training_learners where learner_kind<>'staff'),0::bigint,'Hosted GO creates no Agent identity');
select is((select count(*) from public.audit_events),(select event_count from go1b_audit_baseline),'hosted play creates no browser-side business audit event');
select * from finish();
rollback;
