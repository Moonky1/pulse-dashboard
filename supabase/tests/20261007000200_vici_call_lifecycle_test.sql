-- Disposable local fixtures only. Entire test rolls back, including auth identities.
begin;
select no_plan();
select ok(not has_table_privilege('authenticated','public.training_vici_challenges','SELECT'),'mission definitions are not browser-readable');
select ok(not has_function_privilege('service_role','pulse_private.simulation_action_foundation(uuid,uuid,uuid,integer,uuid,text,jsonb)','EXECUTE'),'trusted server cannot bypass the manual command contract');
select ok(not has_function_privilege('authenticated','public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)','EXECUTE'),'Staff cannot impersonate an Opener');
select ok(not has_function_privilege('anon','public.agent_assign_vici_challenge(uuid)','EXECUTE'),'anonymous assignment denied');
insert into auth.users(id,aud,role,email,created_at,updated_at) values('a0710000-0000-4000-8000-000000000001','authenticated','authenticated','vici.author@example.test',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values('b0710000-0000-4000-8000-000000000001','a0710000-0000-4000-8000-000000000001','vici.author@example.test','VICI Synthetic Author','active',now());
insert into public.user_roles(user_id,role_id,scope_type) values('b0710000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','a0710000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select public.apply_org3a_business_catalog();
insert into public.training_topics(id,code,name) values('20710000-0000-4000-8000-000000000001','vici_test','Synthetic Dialer Topic');
select public.admin_prepare_agent_activation('99107101','Synthetic Mexico','34000000-0000-4000-8000-000000000016');
select public.admin_prepare_agent_activation('99107102','Synthetic Asia','34000000-0000-4000-8000-000000000011');
select public.admin_prepare_agent_activation('99107103','Synthetic Other','34000000-0000-4000-8000-000000000012');
create temporary table vici_fixture(scenario text,content_id uuid,snapshot jsonb);
insert into vici_fixture(scenario,content_id) select 'callback',(public.create_simulation_draft('Local Callback',null,'en',array['20710000-0000-4000-8000-000000000001'::uuid],'team',null,'34000000-0000-4000-8000-000000000016')->>'id')::uuid;
insert into vici_fixture(scenario,content_id) select 'asia',(public.create_simulation_draft('Local Asia',null,'en',array['20710000-0000-4000-8000-000000000001'::uuid],'team',null,'34000000-0000-4000-8000-000000000011')->>'id')::uuid;
insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,byte_size,width_px,height_px,sha256,upload_key,status,finalized_at)
select gen_random_uuid(),'image','training-media','simulation/local/'||content_id||'.png','image/png','b0710000-0000-4000-8000-000000000001','simulation_screen',content_id,500,1200,760,repeat('a',64),gen_random_uuid(),'ready',now() from vici_fixture;
create function pg_temp.prepare(scenario text) returns void language plpgsql as $fn$
declare content uuid; media uuid; steps jsonb:='[]'; expected text[]; kinds text[]; i integer;
begin
  select content_id into content from vici_fixture f where f.scenario=prepare.scenario;
  select id into media from public.training_media where bound_content_id=content;
  expected:=case when scenario='callback' then array[null,'manual','2025550147','dial','hangup','NI','submit'] else array[null,'presets','Spanish','local','SPANISH SPEAKER','XFER','submit'] end;
  kinds:=case when scenario='callback' then array['info','click','text','click','click','select','click'] else array['info','click','select','click','select','select','click'] end;
  for i in 1..cardinality(expected) loop
    steps:=steps||jsonb_build_array(jsonb_build_object('interaction',kinds[i],'prompt','PRIVATE AUTHOR INSTRUCTION '||i,'hint','Optional private hint '||i,
      'success_feedback','Saved','retry_feedback','Try again','source_note','Local synthetic source-backed fixture','expected_value',expected[i],'screen_media_id',case when i>1 then media else null end,
      'regions',case when i>1 then jsonb_build_array(jsonb_build_object('id',case when kinds[i]='click' then expected[i] else 'input' end,'label','Control','x',0.1,'y',0.1,'w',0.2,'h',0.1)) else '[]'::jsonb end,
      'options',case when i=6 then '["A","BLANK","CALLBK","DAIR","DC","DNC","LANG","NI","SPXFER","WRGNUM","WRGVEH","XFER"]'::jsonb when kinds[i]='select' and i=3 then '["English","Spanish"]'::jsonb when kinds[i]='select' then '["SPANISH SPEAKER","SPXFER"]'::jsonb else '[]'::jsonb end));
  end loop;
  perform public.replace_simulation_steps(content,steps,(select updated_at from public.training_content where id=content));
  perform public.configure_vici_challenge(content,scenario,(select updated_at from public.training_content where id=content));
end $fn$;
select pg_temp.prepare('callback'); select pg_temp.prepare('asia');

select ok(not has_table_privilege('authenticated','public.training_vici_sessions','SELECT'),'session state remains private');
select ok(not has_function_privilege('service_role','public.agent_submit_vici_command_v1(uuid,uuid,integer,uuid,text,text)','EXECUTE'),'legacy helper cannot bypass new protocol');
select is((select min(workflow_version) from public.training_vici_challenges),2,'new drafts configure protocol 2');
select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from vici_fixture;
select throws_ok($q$select public.start_simulation((select content_id from vici_fixture where scenario='callback'))$q$,'42501',null,'Staff still cannot create official learner results');
select set_config('request.jwt.claim.role','service_role',true);
update vici_fixture set snapshot=public.agent_start_simulation((select id from public.agents where agent_code='99107101'),content_id) where scenario='callback';
update vici_fixture set snapshot=public.agent_assign_vici_challenge((select id from public.agents where agent_code='99107102')) where scenario='asia';
select is((select snapshot->'dialer'->>'phase' from vici_fixture where scenario='callback'),'home','starts at ordinary lobby');
select is((select snapshot->'dialer'->>'pause_menu' from vici_fixture where scenario='callback'),'false','no pause code dialog automatically opens');
select ok(not ((select snapshot from vici_fixture where scenario='callback')::text ~ 'PRIVATE AUTHOR|expected_value|regions|"step"|Optional private hint|"goal"'),'no hints goal or answer key exposed');
select throws_ok($q$select public.agent_get_simulation_attempt((select id from public.agents where agent_code='99107102'),(select (snapshot->>'attempt_id')::uuid from vici_fixture where scenario='callback'))$q$,'42501',null,'cross-Agent read denied');
create function pg_temp.command(scenario text,command text,value text default null,request uuid default gen_random_uuid()) returns jsonb language plpgsql as $fn$
declare snapshot jsonb; agent uuid; result jsonb;
begin
  select f.snapshot into snapshot from vici_fixture f where f.scenario=command.scenario;
  select id into agent from public.agents where agent_code=case when scenario='callback' then '99107101' else '99107102' end;
  result:=public.agent_submit_vici_command(agent,(snapshot->>'attempt_id')::uuid,(snapshot->>'state_version')::integer,request,command,value);
  update vici_fixture f set snapshot=result where f.scenario=command.scenario; return result;
end $fn$;

select throws_ok($q$select pg_temp.command('callback','hint')$q$,'22023',null,'new workflow rejects hint command');
select is(pg_temp.command('callback','status',null,'50720000-0000-4000-8000-000000000001')->'dialer'->>'is_paused','false','paused status click becomes unpaused');
select is(pg_temp.command('callback','status',null,'50720000-0000-4000-8000-000000000001')->>'duplicate','true','neutral command retry is idempotent');
select throws_ok($q$select pg_temp.command('callback','manual')$q$,'55000',null,'active agent cannot manually dial');
select is(pg_temp.command('callback','status')->'dialer'->>'pause_menu','true','active status opens pause codes');
select is(pg_temp.command('callback','callbacks')->'dialer'->>'is_paused','true','pause code selection pauses without grading');
select is(pg_temp.command('callback','manual')->'dialer'->>'phase','manual','manual dial opens while paused');
select is(pg_temp.command('callback','back')->'dialer'->>'phase','home','Go Back returns to lobby without a mistake');
select is(pg_temp.command('callback','manual')->'dialer'->>'phase','manual','reopening does not repeat grading');
select is(pg_temp.command('callback','dial','202-555-0147')->>'correct','false','wrong digits rejected');
select is(pg_temp.command('callback','dial','2025550147','50720000-0000-4000-8000-000000000002')->'dialer'->>'phase','live','Dial Now atomically opens live call');
select is(pg_temp.command('callback','dial','2025550147','50720000-0000-4000-8000-000000000002')->>'duplicate','true','Dial Now retry cannot advance twice');
select is((select count(*) from public.training_results),0::bigint,'Dial Now creates no result');
select is(pg_temp.command('callback','hangup')->'dialer'->>'phase','call_disposition','Hangup opens green disposition');
select is(pg_temp.command('callback','callDisposition','NI')->>'status','started','choosing disposition alone creates no result');
select throws_ok($q$select pg_temp.command('callback','submit','invented')$q$,'22023',null,'invalid mode cannot complete');
select is(pg_temp.command('callback','submit','active','50720000-0000-4000-8000-000000000003')->>'status','completed','Submit completes practice');
select is(pg_temp.command('callback','submit','active','50720000-0000-4000-8000-000000000003')->>'duplicate','true','terminal retry reuses one result');
select is((select snapshot->'dialer'->>'is_paused' from vici_fixture where scenario='callback'),'false','unchecked pause checkbox resumes dialing');
select is((select (snapshot->'result'->>'score_percent')::numeric from vici_fixture where scenario='callback'),95::numeric,'only the wrong phone penalizes canonical score');
select is((select count(*) from public.training_results),1::bigint,'exactly one immutable result');
select is(pg_temp.command('callback','status')->'dialer'->>'pause_menu','true','completed dialer still supports pause without rewriting result');
select pg_temp.command('callback','break');
select is((select snapshot->'dialer'->>'is_paused' from vici_fixture where scenario='callback'),'true','completed dialer can be paused');
select is((select count(*) from public.training_results),1::bigint,'neutral controls do not create more results');
select ok(not exists(select 1 from information_schema.columns where table_name in ('training_simulation_events','training_vici_control_events') and column_name in ('submitted_value','phone_number','answer')),'events contain no typed customer data');
select is((select snapshot->'challenge'->>'selection_mode' from vici_fixture where scenario='asia'),'assigned','server assignment preserved');
select is(jsonb_array_length(public.agent_list_simulations((select id from public.agents where agent_code='99107103'))),0,'untargeted team receives no practices');
select pg_temp.command('asia','presets'); select pg_temp.command('asia','language','Spanish'); select pg_temp.command('asia','local');
select is(pg_temp.command('asia','disposition','SPXFER')->>'correct','false','SPXFER still not valid Asia routing');
select is(pg_temp.command('asia','disposition','SPANISH SPEAKER')->'dialer'->>'phase','call_disposition','proper transfer enters wrap-up');
select is((select count(*) from public.training_results),1::bigint,'transfer before Submit does not score');
select is(pg_temp.command('asia','callDisposition','LANG')->>'correct','false','wrong transfer disposition rejected');
select pg_temp.command('asia','callDisposition','XFER');
select is(pg_temp.command('asia','submit','paused')->'dialer'->>'is_paused','true','checked pause checkbox returns paused');
select is((select (snapshot->'result'->>'score_percent')::numeric from vici_fixture where scenario='asia'),90::numeric,'wrong routing and disposition each penalize once');
select is((select count(*) from public.training_results),2::bigint,'two official attempts two results');
select set_config('request.jwt.claim.role','authenticated',true);
create temporary table vici_revision as select id from public.create_training_content_revision_v3((select content_id from vici_fixture where scenario='callback'));
select is((select workflow_version from public.training_vici_challenges where content_id=(select id from vici_revision)),2,'revision retains protocol 2 without changing published source');
select is((select count(*) from public.training_results),2::bigint,'creating a revision preserves history');
create function pg_temp.prepare_legacy(scenario text) returns void language plpgsql as $fn$
declare content uuid; media uuid; steps jsonb:='[]'; expected text[]; kinds text[]; i integer;
begin
  select content_id into content from vici_fixture f where f.scenario=prepare_legacy.scenario;
  select screen_media_id into media from public.training_simulation_steps where content_id=content and screen_media_id is not null limit 1;
  expected:=case when scenario='callback' then array[null,'callbacks','logo','manual','2025550147','dial'] else array[null,'presets','Spanish','local','SPANISH SPEAKER'] end;
  kinds:=case when scenario='callback' then array['info','click','click','click','text','click'] else array['info','click','select','click','select'] end;
  for i in 1..cardinality(expected) loop
    steps:=steps||jsonb_build_array(jsonb_build_object('interaction',kinds[i],'prompt','PRIVATE AUTHOR INSTRUCTION '||i,'hint','Optional private hint '||i,
      'success_feedback','Saved','retry_feedback','Try again','source_note','Local synthetic source-backed fixture','expected_value',expected[i],'screen_media_id',case when i>1 then media else null end,
      'regions',case when i>1 then jsonb_build_array(jsonb_build_object('id',case when kinds[i]='click' then expected[i] else 'input' end,'label','Control','x',0.1,'y',0.1,'w',0.2,'h',0.1)) else '[]'::jsonb end,
      'options',case when kinds[i]='select' and i=3 then '["English","Spanish"]'::jsonb when kinds[i]='select' then '["SPANISH SPEAKER","SPXFER"]'::jsonb else '[]'::jsonb end));
  end loop;
  perform public.replace_simulation_steps(content,steps,(select updated_at from public.training_content where id=content));
  perform public.configure_vici_challenge_v1(content,scenario,(select updated_at from public.training_content where id=content));
end $fn$;

update vici_fixture set content_id=(select id from vici_revision) where scenario='callback';
select pg_temp.prepare_legacy('callback');
update public.training_vici_challenges set workflow_version=1 where content_id=(select id from vici_revision);
select public.publish_training_content((select id from vici_revision),(select updated_at from public.training_content where id=(select id from vici_revision)));
select set_config('request.jwt.claim.role','service_role',true);
update vici_fixture set snapshot=public.agent_start_simulation((select id from public.agents where agent_code='99107101'),content_id) where scenario='callback';
select is((select snapshot->'dialer'->>'phase' from vici_fixture where scenario='callback'),'paused','legacy published workflow still uses its pinned protocol');
select pg_temp.command('callback','callbacks'); select pg_temp.command('callback','logo'); select pg_temp.command('callback','manual');
select is(pg_temp.command('callback','dial','2025550147')->>'status','completed','legacy commands can finish an old published version');
select is((select count(*) from public.training_results),3::bigint,'legacy completion preserves both new immutable results');
select set_config('request.jwt.claim.role','service_role',true);
update public.agents set status='inactive' where agent_code='99107102';
select throws_ok($q$select public.agent_get_simulation_history((select id from public.agents where agent_code='99107102'))$q$,'42501',null,'inactive access remains denied');
select finish(); rollback;
