-- Synthetic owned disposable fixtures only. Entire test rolls back.
begin;
select no_plan();
insert into auth.users(id,aud,role,email,created_at,updated_at) values('a0880000-0000-4000-8000-000000000001','authenticated','authenticated','random.author@example.test',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values('b0880000-0000-4000-8000-000000000001','a0880000-0000-4000-8000-000000000001','random.author@example.test','Synthetic Random Author','active',now());
insert into auth.users(id,aud,role,email,created_at,updated_at) values('a0880000-0000-4000-8000-000000000002','authenticated','authenticated','random.other@example.test',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values('b0880000-0000-4000-8000-000000000002','a0880000-0000-4000-8000-000000000002','random.other@example.test','Synthetic Other Staff','active',now());
insert into public.user_roles(user_id,role_id,scope_type) values('b0880000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','a0880000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select public.apply_org3a_business_catalog();
insert into public.training_topics(id,code,name) values('20880000-0000-4000-8000-000000000001','random_test','Synthetic Random Topic');
select public.admin_prepare_agent_activation('99108801','Synthetic Mexico','34000000-0000-4000-8000-000000000016');
select public.admin_prepare_agent_activation('99108802','Synthetic Colombia','34000000-0000-4000-8000-000000000014');
create temporary table random_fixture(code text,content_id uuid,snapshot jsonb);
insert into random_fixture(code,content_id) select code,(public.create_simulation_draft('Random Dispositions',null,'en',array['20880000-0000-4000-8000-000000000001'::uuid],'team',null,'34000000-0000-4000-8000-000000000016')->>'id')::uuid from unnest(array['A','DAIR','DNC','NI','CALLBK','SPANIS']) code;
insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,byte_size,width_px,height_px,sha256,upload_key,status,finalized_at)
select gen_random_uuid(),'image','training-media',content_id||'/screen.png','image/png','b0880000-0000-4000-8000-000000000001','simulation_screen',content_id,500,1200,760,repeat('a',64),gen_random_uuid(),'ready',now() from random_fixture;
insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,byte_size,sha256,upload_key,status,finalized_at)
select gen_random_uuid(),'audio','training-media',content_id||'/clip.wav','audio/wav','b0880000-0000-4000-8000-000000000001','simulation_audio',content_id,44144,repeat('b',64),gen_random_uuid(),'ready',now() from random_fixture;
create function pg_temp.random_prepare(code text) returns void language plpgsql as $fn$
declare content uuid; media uuid; steps jsonb;
begin
 select f.content_id into content from random_fixture f where f.code=random_prepare.code;
 select id into media from public.training_media where bound_content_id=content and media_kind='simulation_screen';
 steps:=jsonb_build_array(jsonb_build_object('interaction','info','prompt','Listen to the call.','hint','Private note','success_feedback','Saved','retry_feedback','Try again','source_note','Synthetic fixture','expected_value',null),
 jsonb_build_object('interaction','select','prompt','Choose the disposition.','hint','Private note','success_feedback','Reviewed explanation for this clip.','retry_feedback','Try again','source_note','Synthetic fixture','expected_value',code,'screen_media_id',media,'regions',jsonb_build_array(jsonb_build_object('id','input','label','Disposition','x',0.1,'y',0.1,'w',0.2,'h',0.1)),'options',jsonb_build_array(code)),
 jsonb_build_object('interaction','click','prompt','Submit the disposition.','hint','Private note','success_feedback','Saved','retry_feedback','Try again','source_note','Synthetic fixture','expected_value','submit','screen_media_id',media,'regions',jsonb_build_array(jsonb_build_object('id','submit','label','Submit','x',0.1,'y',0.1,'w',0.2,'h',0.1))));
 perform public.replace_simulation_steps(content,steps,(select updated_at from public.training_content where id=content));
 perform public.configure_vici_random_case(content,code,'Reviewed explanation for this clip.',(select updated_at from public.training_content where id=content));
end $fn$;
select pg_temp.random_prepare(code) from random_fixture;
select throws_ok($q$select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from random_fixture where code='A'$q$,'23514',null,'private audio required before publication');
select public.configure_vici_audio(f.content_id,'customer',m.id,c.updated_at) from random_fixture f join public.training_content c on c.id=f.content_id join public.training_media m on m.bound_content_id=c.id and m.media_kind='simulation_audio';
select throws_ok($q$select public.configure_vici_random_case(content_id,'A','Reviewed explanation.',now()) from random_fixture where code='A'$q$,'40001',null,'case authoring requires current CAS');
select throws_ok($q$update public.training_content_audiences set team_id='34000000-0000-4000-8000-000000000014' where content_id=(select content_id from random_fixture where code='SPANIS');select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from random_fixture where code='SPANIS'$q$,'23514',null,'SPANIS clip cannot publish to Spanish-taking teams');
select throws_ok($q$update public.training_content set title='Answering Machine' where id=(select content_id from random_fixture where code='A');select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from random_fixture where code='A'$q$,'23514',null,'publication rejects an answer-revealing title');
select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from random_fixture;
select throws_ok($q$update public.training_vici_random_cases set disposition='NI' where content_id=(select content_id from random_fixture where code='A')$q$,'55000',null,'published reviewed answer is immutable');
create temporary table random_revision as select (public.create_training_content_revision_v3(content_id)).id as content_id from random_fixture where code='A';
select is((select disposition from public.training_vici_random_cases where content_id=(select content_id from random_revision)),'A','revision clones private answer');
select is((select count(*) from public.training_vici_audio where content_id=(select content_id from random_revision)),1::bigint,'revision retains private clip binding');
select is((select status from public.training_content where id=(select content_id from random_fixture where code='A')),'published','revision preserves original publication');
select ok(not has_table_privilege('authenticated','public.training_vici_random_cases','SELECT'),'answers inaccessible to browser');
select ok(not has_table_privilege('service_role','public.training_vici_random_cases','SELECT'),'API cannot bypass case RPC');
select ok(not has_function_privilege('anon','public.start_vici_random_reference()','EXECUTE'),'anonymous reference denied');
select ok(not has_function_privilege('authenticated','public.agent_assign_vici_random(uuid)','EXECUTE'),'browser Agent assignment denied');
select ok(not has_function_privilege('authenticated','public.agent_submit_vici_command_before_random(uuid,uuid,integer,uuid,text,text)','EXECUTE'),'legacy trusted command alias denied');
select ok(not has_function_privilege('authenticated','public.agent_start_simulation_before_random(uuid,uuid,boolean)','EXECUTE'),'start alias cannot bypass server random selection');
select is(pulse_private.vici_customer(3)->>'year','','vehicle year stays blank');
select is(pulse_private.vici_customer(3)->>'make','','vehicle make stays blank');
select is(pulse_private.vici_customer(3)->>'model','','vehicle model stays blank');
select is(pulse_private.vici_customer(3)->>'odometer','','odometer stays blank');
create temporary table reference_fixture(snapshot jsonb);
insert into reference_fixture values(public.start_vici_random_reference());
select ok((select not(snapshot ? 'expected_value') and snapshot->'review'='null'::jsonb from reference_fixture),'Staff reference hides answer before Submit');
select is((select count(*) from public.training_attempts),0::bigint,'Staff reference never creates attempts');
select is((select count(*) from public.training_staff_learner_links),0::bigint,'Staff reference never creates Staff learners');
update reference_fixture set snapshot=public.submit_vici_random_reference((snapshot->>'reference_id')::uuid,(snapshot->>'state_version')::integer,'50880000-0000-4000-8000-000000000001','XFER');
select is((select snapshot->'review'->>'correct' from reference_fixture),'false','Staff Submit grades on server');
select ok((select snapshot->'review'->>'explanation' is not null from reference_fixture),'explanation appears after Submit');
select is((select public.submit_vici_random_reference((snapshot->>'reference_id')::uuid,1,'50880000-0000-4000-8000-000000000001','A')->>'duplicate' from reference_fixture),'true','Staff Submit replay idempotent');
select set_config('request.jwt.claim.sub','a0880000-0000-4000-8000-000000000002',true);
select throws_ok($q$select public.submit_vici_random_reference((snapshot->>'reference_id')::uuid,2,gen_random_uuid(),'A') from reference_fixture$q$,'42501',null,'wrong Staff cannot read or submit reference');
select set_config('request.jwt.claim.role','service_role',true);
select throws_ok($q$select public.agent_start_simulation((select id from public.agents where agent_code='99108801'),content_id) from random_fixture where code='A'$q$,'42501',null,'browser cannot select known Random case ID');
-- Test setup may choose synthetic cases internally; the public learner path may not.
update random_fixture set snapshot=pulse_private.start_simulation(content_id,(select id from public.agents where agent_code='99108801'),false);
select ok(not(snapshot ? 'step') and not(snapshot ? 'hint') and snapshot->>'situation' is null and snapshot->'challenge'->>'scenario'='random','every case hides scenario and authoring fields') from random_fixture;
select is((select jsonb_array_length(snapshot->'audio') from random_fixture where code='A'),1,'only current private audio exposed');
select ok(public.agent_can_read_vici_audio(a.id,m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid),'audio readable on disposition screen') from random_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' cross join public.agents a where f.code='A' and a.agent_code='99108801';
select throws_ok($q$select public.agent_get_simulation_attempt((select id from public.agents where agent_code='99108802'),(snapshot->>'attempt_id')::uuid) from random_fixture where code='A'$q$,'42501',null,'cross-Agent attempt denied');
create function pg_temp.random_command(code text,command text,value text,request uuid default gen_random_uuid()) returns jsonb language plpgsql as $fn$
declare snap jsonb; result jsonb;
begin
 select f.snapshot into snap from random_fixture f where f.code=random_command.code;
 result:=public.agent_submit_vici_command((select id from public.agents where agent_code='99108801'),(snap->>'attempt_id')::uuid,(snap->>'state_version')::integer,request,command,value);
 update random_fixture f set snapshot=result where f.code=random_command.code;return result;
end $fn$;
select is(pg_temp.random_command('A','callDisposition','DNC')->>'correct',null,'wrong selection is neutral before Submit');
select is((select snapshot->>'feedback' from random_fixture where code='A'),null,'selection does not leak correctness');
select is((select snapshot->>'mistakes' from random_fixture where code='A'),'0','selecting never adds mistakes');
select is(pg_temp.random_command('A','submit','active','50880000-0000-4000-8000-000000000002')->>'correct','false','Submit grades wrong disposition');
select is((select snapshot->'review'->>'disposition' from random_fixture where code='A'),'A','answer revealed only after Submit');
select is(pg_temp.random_command('A','submit','active','50880000-0000-4000-8000-000000000002')->>'duplicate','true','Agent Submit replay idempotent');
select is((select snapshot->>'mistakes' from random_fixture where code='A'),'1','replay does not add another mistake');
select pg_temp.random_command('A','callDisposition','A');
select is(pg_temp.random_command('A','submit','active')->>'status','completed','correct Submit completes canonical attempt');
select is((select (snapshot->'result'->>'score_percent')::numeric from random_fixture where code='A'),95::numeric,'immutable canonical scoring retains first mistake');
select ok(not public.agent_can_read_vici_audio(a.id,m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid),'completed attempt cannot sign new clip URL') from random_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' cross join public.agents a where f.code='A' and a.agent_code='99108801';
select throws_ok($q$select pg_temp.random_command('A','submit','active')$q$,'55000',null,'completed result cannot be rewritten');
select ok((public.agent_assign_vici_random((select id from public.agents where agent_code='99108801'))->'challenge'->>'scenario')='random','server selects eligible random case');
select is((select count(*) from public.training_attempts where status='started'),1::bigint,'Next call leaves one active Random attempt');
select is((select count(*) from public.training_attempts where status='abandoned'),5::bigint,'Next call preserves skipped attempts as abandoned');
select throws_ok($q$select public.agent_assign_vici_random((select id from public.agents where agent_code='99108802'))$q$,'P0002',null,'wrong region sees no ineligible random case');
select finish();rollback;
