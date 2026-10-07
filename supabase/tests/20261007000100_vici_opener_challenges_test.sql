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
  expected:=case when scenario='callback' then array[null,'callbacks','logo','manual','2025550147','dial'] else array[null,'presets','Spanish','local','SPANISH SPEAKER'] end;
  kinds:=case when scenario='callback' then array['info','click','click','click','text','click'] else array['info','click','select','click','select'] end;
  for i in 1..cardinality(expected) loop
    steps:=steps||jsonb_build_array(jsonb_build_object('interaction',kinds[i],'prompt','PRIVATE AUTHOR INSTRUCTION '||i,'hint','Optional private hint '||i,
      'success_feedback','Saved','retry_feedback','Try again','source_note','Local synthetic source-backed fixture','expected_value',expected[i],'screen_media_id',case when i>1 then media else null end,
      'regions',case when i>1 then jsonb_build_array(jsonb_build_object('id',case when kinds[i]='click' then expected[i] else 'input' end,'label','Control','x',0.1,'y',0.1,'w',0.2,'h',0.1)) else '[]'::jsonb end,
      'options',case when kinds[i]='select' and i=3 then '["English","Spanish"]'::jsonb when kinds[i]='select' then '["SPANISH SPEAKER","SPXFER"]'::jsonb else '[]'::jsonb end));
  end loop;
  perform public.replace_simulation_steps(content,steps,(select updated_at from public.training_content where id=content));
  perform public.configure_vici_challenge(content,scenario,(select updated_at from public.training_content where id=content));
end $fn$;
select pg_temp.prepare('callback'); select pg_temp.prepare('asia');
select throws_ok($q$select public.configure_vici_challenge((select content_id from vici_fixture where scenario='callback'),'invented',now())$q$,'40001',null,'optimistic stale author write denied');
select is(public.get_simulation_authoring((select content_id from vici_fixture where scenario='callback'))->>'scenario','callback','Staff author receives explicit scenario');
select ok(public.can_read_simulation_screen((select id from public.training_media where bound_content_id=(select content_id from vici_fixture where scenario='callback')),(select content_id from vici_fixture where scenario='callback')),'Staff private author preview still allowed');
select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from vici_fixture;
select throws_ok($q$select public.start_simulation((select content_id from vici_fixture where scenario='callback'))$q$,'42501',null,'Staff cannot create an official learner attempt');
select is((select count(*) from public.training_attempts),0::bigint,'Staff authoring creates no learner attempts');
select set_config('request.jwt.claim.role','service_role',true);
update vici_fixture set snapshot=public.agent_start_simulation((select id from public.agents where agent_code='99107101'),content_id) where scenario='callback';
select is((select snapshot->'dialer'->>'phase' from vici_fixture where scenario='callback'),'paused','learner sees manual paused screen immediately, no Continue acknowledgement');
select ok(not ((select snapshot from vici_fixture where scenario='callback')::text ~ 'PRIVATE AUTHOR|expected_value|regions|"step"|Optional private hint'),'manual snapshot hides instructions, targets and unrequested hints');
select is((select snapshot->'challenge'->>'selection_mode' from vici_fixture where scenario='callback'),'chosen','manual practice stores chosen mode');
select throws_ok($q$select public.agent_get_simulation_attempt((select id from public.agents where agent_code='99107102'),(select (snapshot->>'attempt_id')::uuid from vici_fixture where scenario='callback'))$q$,'42501',null,'another team cannot read an attempt');
select throws_ok($q$select public.agent_submit_simulation_action((select id from public.agents where agent_code='99107101'),(select (snapshot->>'attempt_id')::uuid from vici_fixture where scenario='callback'),gen_random_uuid(),2,gen_random_uuid(),'answer','"callbacks"')$q$,'42501',null,'legacy action cannot bypass manual contract');
create function pg_temp.command(scenario text,command text,value text default null,request uuid default gen_random_uuid()) returns jsonb language plpgsql as $fn$
declare snapshot jsonb; agent uuid; result jsonb;
begin
  select f.snapshot into snapshot from vici_fixture f where f.scenario=command.scenario;
  select id into agent from public.agents where agent_code=case when scenario='callback' then '99107101' else '99107102' end;
  result:=public.agent_submit_vici_command(agent,(snapshot->>'attempt_id')::uuid,(snapshot->>'state_version')::integer,request,command,value);
  update vici_fixture f set snapshot=result where f.scenario=command.scenario; return result;
end $fn$;
select is(pg_temp.command('callback','break')->>'mistakes','1','wrong pause code counts a mistake');
select is(pg_temp.command('callback','hint')->>'hints','1','optional hint costs once');
select is(pg_temp.command('callback','hint')->>'hints','1','repeat hint does not cost twice');
select is(pg_temp.command('callback','callbacks',null,'50710000-0000-4000-8000-000000000001')->'dialer'->>'phase','callback','manual control changes visual dialer state');
select is(pg_temp.command('callback','callbacks',null,'50710000-0000-4000-8000-000000000001')->>'duplicate','true','duplicate manual command cannot advance twice');
select is(pg_temp.command('callback','logo')->'dialer'->>'phase','home','VICIdial logo returns to home');
select is(pg_temp.command('callback','manual')->'dialer'->>'phase','manual','MANUAL DIAL opens the actual panel');
select is(pg_temp.command('callback','dial','202-555-0147')->>'correct','false','wrong phone rejected without advancing');
select is(pg_temp.command('callback','dial','2025550147','50710000-0000-4000-8000-000000000002')->>'status','completed','Phone Number plus Dial Now completes atomically');
select is(pg_temp.command('callback','dial','2025550147','50710000-0000-4000-8000-000000000002')->>'duplicate','true','retry of terminal command returns existing result');
select is((select (snapshot->'result'->>'score_percent')::numeric from vici_fixture where scenario='callback'),80::numeric,'canonical server score uses two mistakes and one hint');
select is((select count(*) from public.training_results),1::bigint,'exactly one result despite terminal retry');
select ok(not exists(select 1 from information_schema.columns where table_name='training_simulation_events' and column_name in ('submitted_value','phone_number','answer')),'no typed customer data stored in events');
update vici_fixture set snapshot=public.agent_assign_vici_challenge((select id from public.agents where agent_code='99107102')) where scenario='asia';
select is((select snapshot->'challenge'->>'selection_mode' from vici_fixture where scenario='asia'),'assigned','server chooses an eligible team mission');
select is((select snapshot->>'content_id' from vici_fixture where scenario='asia'),(select content_id::text from vici_fixture where scenario='asia'),'assignment never crosses to Mexico content');
select is(jsonb_array_length(public.agent_list_simulations((select id from public.agents where agent_code='99107103'))),0,'untargeted Asia B catalog stays empty');
select throws_ok($q$select public.agent_assign_vici_challenge((select id from public.agents where agent_code='99107103'))$q$,'P0002',null,'no content is invented for an untargeted team');
select pg_temp.command('asia','presets'); select pg_temp.command('asia','language','Spanish'); select pg_temp.command('asia','local');
select is(pg_temp.command('asia','disposition','SPXFER')->>'correct','false','SPXFER cannot complete Asia workflow');
select is(pg_temp.command('asia','disposition','SPANISH SPEAKER')->>'status','completed','Spanish Speaker completes manual Asia flow');
select throws_ok($q$select public.agent_submit_vici_command((select id from public.agents where agent_code='99107102'),(select (snapshot->>'attempt_id')::uuid from vici_fixture where scenario='asia'),1,gen_random_uuid(),'presets')$q$,'40001',null,'stale command is rejected');
update public.agents set status='inactive' where agent_code='99107102';
select throws_ok($q$select public.agent_get_simulation_history((select id from public.agents where agent_code='99107102'))$q$,'42501',null,'inactive Agent history access revoked');
update public.agents set status='active',operating_unit_id=null where agent_code='99107102';
select throws_ok($q$select public.agent_assign_vici_challenge((select id from public.agents where agent_code='99107102'))$q$,'42501',null,'mismatched Opener unit cannot learn');
select set_config('request.jwt.claim.role','authenticated',true);
select throws_ok($q$select public.configure_vici_challenge((select content_id from vici_fixture where scenario='callback'),'asia',(select updated_at from public.training_content where id=(select content_id from vici_fixture where scenario='callback')))$q$,'55000',null,'published challenge immutable');
create temporary table vici_revision as select id from public.create_training_content_revision_v3((select content_id from vici_fixture where scenario='callback'));
select is((select scenario from public.training_vici_challenges where content_id=(select id from vici_revision)),'callback','revision clones the manual challenge without modifying old version');
update public.training_content_audiences set team_id='34000000-0000-4000-8000-000000000011' where content_id=(select id from vici_revision);
select throws_ok($q$select public.publish_training_content((select id from vici_revision),(select updated_at from public.training_content where id=(select id from vici_revision)))$q$,'22023',null,'Callback cannot be published into the Asia source audience');
select is((select count(*) from public.training_results),2::bigint,'revision and access revocation do not erase historical results');
update public.agents set operating_unit_id=(select operating_unit_id from public.teams where id=team_id) where agent_code='99107102';
update public.operating_units set is_active=false where id=(select operating_unit_id from public.agents where agent_code='99107102');
select set_config('request.jwt.claim.role','service_role',true);
select throws_ok($q$select public.agent_list_simulations((select id from public.agents where agent_code='99107102'))$q$,'42501',null,'inactive Opener unit revokes catalog access');
update public.operating_units set is_active=true where code='openers';
update public.agents set team_id='34000000-0000-4000-8000-000000000020' where agent_code='99107102';
select throws_ok($q$select public.agent_assign_vici_challenge((select id from public.agents where agent_code='99107102'))$q$,'42501',null,'non-Opener team cannot receive a challenge');
select finish(); rollback;
