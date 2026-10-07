-- Synthetic, disposable local fixtures only. Everything rolls back.
begin;
select no_plan();
insert into auth.users(id,aud,role,email,created_at,updated_at) values('a0730000-0000-4000-8000-000000000001','authenticated','authenticated','vici.pause.author@example.test',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values('b0730000-0000-4000-8000-000000000001','a0730000-0000-4000-8000-000000000001','vici.pause.author@example.test','Synthetic Pause Author','active',now());
insert into public.user_roles(user_id,role_id,scope_type) values('b0730000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','a0730000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select public.apply_org3a_business_catalog();
insert into public.training_topics(id,code,name) values('20730000-0000-4000-8000-000000000001','vici_pause_test','Synthetic Pause Topic');
select public.admin_prepare_agent_activation('99107301','Synthetic Mexico Pause','34000000-0000-4000-8000-000000000016');
select public.admin_prepare_agent_activation('99107302','Synthetic Asia Pause','34000000-0000-4000-8000-000000000011');
create temporary table pause_fixture(scenario text,content_id uuid,snapshot jsonb);
insert into pause_fixture(scenario,content_id) select 'callback',(public.create_simulation_draft('Local Manual Pause',null,'en',array['20730000-0000-4000-8000-000000000001'::uuid],'team',null,'34000000-0000-4000-8000-000000000016')->>'id')::uuid;
insert into pause_fixture(scenario,content_id) select 'asia',(public.create_simulation_draft('Local Asia Pause',null,'en',array['20730000-0000-4000-8000-000000000001'::uuid],'team',null,'34000000-0000-4000-8000-000000000011')->>'id')::uuid;
insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,byte_size,width_px,height_px,sha256,upload_key,status,finalized_at)
select gen_random_uuid(),'image','training-media','simulation/local/'||content_id||'.png','image/png','b0730000-0000-4000-8000-000000000001','simulation_screen',content_id,500,1200,760,repeat('a',64),gen_random_uuid(),'ready',now() from pause_fixture;
create function pg_temp.prepare_pause(scenario text) returns void language plpgsql as $fn$
declare content uuid; media uuid; steps jsonb:='[]'; expected text[]; kinds text[]; i integer;
begin
  select content_id into content from pause_fixture f where f.scenario=prepare_pause.scenario;
  select id into media from public.training_media where bound_content_id=content;
  expected:=case when scenario='callback' then array[null,'manual','2025550147','dial','hangup','NI','submit'] else array[null,'presets','Spanish','local','SPANISH SPEAKER','XFER','submit'] end;
  kinds:=case when scenario='callback' then array['info','click','text','click','click','select','click'] else array['info','click','select','click','select','select','click'] end;
  for i in 1..cardinality(expected) loop
    steps:=steps||jsonb_build_array(jsonb_build_object('interaction',kinds[i],'prompt','Private test instruction','hint','Private hint',
      'success_feedback','Saved','retry_feedback','Try again','source_note','Synthetic pause fixture','expected_value',expected[i],'screen_media_id',case when i>1 then media else null end,
      'regions',case when i>1 then jsonb_build_array(jsonb_build_object('id',case when kinds[i]='click' then expected[i] else 'input' end,'label','Control','x',0.1,'y',0.1,'w',0.2,'h',0.1)) else '[]'::jsonb end,
      'options',case when i=6 then '["A","BLANK","CALLBK","DAIR","DC","DNC","LANG","NI","SPXFER","WRGNUM","WRGVEH","XFER","SPANIS"]'::jsonb when kinds[i]='select' and i=3 then '["English","Spanish"]'::jsonb when kinds[i]='select' then '["SPANISH SPEAKER","SPXFER"]'::jsonb else '[]'::jsonb end));
  end loop;
  perform public.replace_simulation_steps(content,steps,(select updated_at from public.training_content where id=content));
  perform public.configure_vici_challenge(content,scenario,(select updated_at from public.training_content where id=content));
end $fn$;
select pg_temp.prepare_pause('callback');select pg_temp.prepare_pause('asia');
select is((select max(jsonb_array_length(options)) from public.training_simulation_steps),13,'thirteen bounded options include SPANIS');
select throws_ok($q$update public.training_simulation_steps set options=options||'"EXTRA"'::jsonb where position=6$q$,'22023',null,'fourteenth authoring option remains denied');
select throws_ok($q$update public.training_simulation_steps set options=jsonb_set(options,'{12}','"XFER"') where position=6$q$,'22023',null,'duplicate options remain denied');
select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from pause_fixture;
select set_config('request.jwt.claim.role','service_role',true);
update pause_fixture set snapshot=public.agent_start_simulation((select id from public.agents where agent_code=case when scenario='callback' then '99107301' else '99107302' end),content_id);
create function pg_temp.pause_command(scenario text,command text,value text default null,request uuid default gen_random_uuid()) returns jsonb language plpgsql as $fn$
declare snapshot jsonb; agent uuid; result jsonb;
begin
  select f.snapshot into snapshot from pause_fixture f where f.scenario=pause_command.scenario;
  select id into agent from public.agents where agent_code=case when scenario='callback' then '99107301' else '99107302' end;
  result:=public.agent_submit_vici_command(agent,(snapshot->>'attempt_id')::uuid,(snapshot->>'state_version')::integer,request,command,value);
  update pause_fixture f set snapshot=result where f.scenario=pause_command.scenario;return result;
end $fn$;

select ok(not has_function_privilege('authenticated','public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)','EXECUTE'),'Staff still cannot command an Agent');
select ok(not has_table_privilege('authenticated','public.training_vici_control_events','SELECT'),'neutral control events remain private');
select ok(not has_table_privilege('service_role','public.training_vici_sessions','UPDATE'),'session mutations only through the reviewed function');
select is(pg_temp.pause_command('callback','status',null,'50730000-0000-4000-8000-000000000001')->'dialer'->>'pause_menu','true','Paused opens full menu');
select is((select snapshot->'dialer'->>'is_paused' from pause_fixture where scenario='callback'),'true','opening menu never resumes silently');
select is(pg_temp.pause_command('callback','status',null,'50730000-0000-4000-8000-000000000001')->>'duplicate','true','menu click retry is idempotent');
select is(pg_temp.pause_command('callback','closePause')->'dialer'->>'is_paused','true','Go Back preserves paused mode');
select is((select snapshot->'dialer'->>'pause_menu' from pause_fixture where scenario='callback'),'false','Go Back closes the full menu');
select pg_temp.pause_command('callback','status');
select is(pg_temp.pause_command('callback','resume')->'dialer'->>'is_paused','false','explicit resume makes dialing active');
select throws_ok($q$select pg_temp.pause_command('callback','manual')$q$,'55000',null,'active agent cannot manual dial');
select is(pg_temp.pause_command('callback','status')->'dialer'->>'pause_menu','true','Active opens full menu');
select is(pg_temp.pause_command('callback','break')->'dialer'->>'is_paused','true','Break pauses');
select pg_temp.pause_command('callback','status');
select is(pg_temp.pause_command('callback','callbacks')->'dialer'->>'is_paused','true','CB pauses');
select pg_temp.pause_command('callback','status');
select is(pg_temp.pause_command('callback','lunch')->'dialer'->>'is_paused','true','Lunch pauses');
select pg_temp.pause_command('callback','status');
select is(pg_temp.pause_command('callback','manage')->'dialer'->>'is_paused','true','Manage pauses');
select pg_temp.pause_command('callback','status');
select is(pg_temp.pause_command('callback','restroom')->'dialer'->>'is_paused','true','RR pauses');
select pg_temp.pause_command('callback','status');
select is(pg_temp.pause_command('callback','tech')->'dialer'->>'is_paused','true','Tech pauses');
select is((select snapshot->'dialer'->>'pause_menu' from pause_fixture where scenario='callback'),'false','pause selection returns to dialer');
select is((select (snapshot->>'mistakes')::integer from pause_fixture where scenario='callback'),0,'all pause controls stay ungraded');
select is((select count(*) from public.training_results),0::bigint,'pause controls create no results');
select throws_ok($q$select pg_temp.pause_command('callback','inventedPause')$q$,'22023',null,'unknown pause commands rejected');
select throws_ok($q$select public.agent_submit_vici_command((select id from public.agents where agent_code='99107302'),(select (snapshot->>'attempt_id')::uuid from pause_fixture where scenario='callback'),1,gen_random_uuid(),'status')$q$,'42501',null,'cross-Agent command still denied');
select throws_ok($q$select public.agent_submit_vici_command((select id from public.agents where agent_code='99107301'),(select (snapshot->>'attempt_id')::uuid from pause_fixture where scenario='callback'),1,gen_random_uuid(),'status')$q$,'40001',null,'stale command still denied');
select pg_temp.pause_command('callback','manual');select pg_temp.pause_command('callback','dial','2025550147');select pg_temp.pause_command('callback','hangup');
select is(pg_temp.pause_command('callback','callDisposition','SPANIS')->>'correct','true','manual wrap-up supports SPANIS');
select is(pg_temp.pause_command('callback','submit','active')->>'status','completed','manual Submit still owns completion');
select is((select (snapshot->'result'->>'score_percent')::numeric from pause_fixture where scenario='callback'),100::numeric,'pause controls never penalize final score');
select pg_temp.pause_command('callback','status');select pg_temp.pause_command('callback','manage');
select is((select (snapshot->'result'->>'score_percent')::numeric from pause_fixture where scenario='callback'),100::numeric,'completed result survives later pause controls');
select is((select count(*) from public.training_results),1::bigint,'later controls cannot duplicate results');
select pg_temp.pause_command('asia','presets');select pg_temp.pause_command('asia','language','Spanish');select pg_temp.pause_command('asia','local');
select is(pg_temp.pause_command('asia','disposition','SPXFER')->>'correct','false','SPANIS addition never enables forbidden Asia routing');
select pg_temp.pause_command('asia','disposition','SPANISH SPEAKER');
select is(pg_temp.pause_command('asia','callDisposition','SPANIS', '50730000-0000-4000-8000-000000000002')->>'correct','true','Asia wrap-up accepts SPANIS Spanish Speaker');
select is(pg_temp.pause_command('asia','callDisposition','SPANIS', '50730000-0000-4000-8000-000000000002')->>'duplicate','true','SPANIS retry is idempotent');
select is(pg_temp.pause_command('asia','callDisposition','XFER')->'dialer'->>'call_disposition','XFER','existing XFER choice still works');
select is(pg_temp.pause_command('asia','callDisposition','SPANIS')->'dialer'->>'call_disposition','SPANIS','choice can be corrected before Submit');
select is(pg_temp.pause_command('asia','submit','paused')->>'status','completed','Asia Submit completes after SPANIS');
select is((select (snapshot->'result'->>'score_percent')::numeric from pause_fixture where scenario='asia'),95::numeric,'only incorrect routing affects score');
select is((select count(*) from public.training_results),2::bigint,'one result per official attempt');
select ok(not exists(select 1 from information_schema.columns where table_name='training_vici_control_events' and column_name in ('value','phone_number','submitted_value')),'neutral events store no typed private values');
select finish();rollback;
