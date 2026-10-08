-- Only synthetic disposable fixtures, rolled back in full.
begin;
select no_plan();
insert into auth.users(id,aud,role,email,created_at,updated_at) values('a0740000-0000-4000-8000-000000000001','authenticated','authenticated','vici.practice.author@example.test',now(),now());
insert into public.users(id,auth_user_id,email,full_name,status,approved_at) values('b0740000-0000-4000-8000-000000000001','a0740000-0000-4000-8000-000000000001','vici.practice.author@example.test','Synthetic Practice Author','active',now());
insert into public.user_roles(user_id,role_id,scope_type) values('b0740000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
select set_config('request.jwt.claim.sub','a0740000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select public.apply_org3a_business_catalog();
insert into public.training_topics(id,code,name) values('20740000-0000-4000-8000-000000000001','vici_practice_test','Synthetic Practice Topic');
select public.admin_prepare_agent_activation('99107401','Synthetic Mexico','34000000-0000-4000-8000-000000000016');
select public.admin_prepare_agent_activation('99107402','Synthetic Colombia','34000000-0000-4000-8000-000000000014');
create temporary table practice_fixture(scenario text,content_id uuid,snapshot jsonb);
insert into practice_fixture(scenario,content_id) select scenario,(public.create_simulation_draft('Local '||scenario,null,'en',array['20740000-0000-4000-8000-000000000001'::uuid],'team',null,
 case when scenario='spxfer' then '34000000-0000-4000-8000-000000000014'::uuid else '34000000-0000-4000-8000-000000000016'::uuid end)->>'id')::uuid
 from unnest(array['login','callback','english','spxfer','asia','dead_air','answering','mailbox_full','mock']) scenario;
insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,byte_size,width_px,height_px,sha256,upload_key,status,finalized_at)
select gen_random_uuid(),'image','training-media','simulation/local/'||content_id||'.png','image/png','b0740000-0000-4000-8000-000000000001','simulation_screen',content_id,500,1200,760,repeat('a',64),gen_random_uuid(),'ready',now() from practice_fixture;
create function pg_temp.prepare_practice(scenario text) returns void language plpgsql as $fn$
declare content uuid; media uuid; steps jsonb:='[]'; spec jsonb; cmd text; kind text; value text;
begin
 select content_id into content from practice_fixture f where f.scenario=prepare_practice.scenario;
 select id into media from public.training_media where bound_content_id=content;
 spec:=pulse_private.vici_practice_spec(scenario);
 steps:=jsonb_build_array(jsonb_build_object('interaction','info','prompt',spec->>'situation','hint','Private hint','success_feedback','Saved','retry_feedback','Try again','source_note','Synthetic fixture','expected_value',null));
 for cmd in select jsonb_array_elements_text(spec->'commands') loop
 kind:=case when cmd='dial' then 'text' when cmd in ('language','disposition','callDisposition','campaignLogin') then 'select' when cmd in ('agentLogin','phoneLogin') then 'action' else 'click' end;
 value:=case when cmd in ('language','disposition','callDisposition','campaignLogin','dial') then spec->'values'->>cmd else cmd end;
 steps:=steps||jsonb_build_array(jsonb_build_object('interaction',kind,'prompt','Private test instruction','hint','Private hint','success_feedback','Saved','retry_feedback','Try again','source_note','Synthetic fixture','expected_value',value,'screen_media_id',media,
 'regions',jsonb_build_array(jsonb_build_object('id',case when kind='click' then cmd else 'input' end,'label','Control','x',0.1,'y',0.1,'w',0.2,'h',0.1)),
 'options',case when kind in ('select','action') then jsonb_build_array(value) else '[]'::jsonb end));
 end loop;
 perform public.replace_simulation_steps(content,steps,(select updated_at from public.training_content where id=content));
 perform public.configure_vici_practice(content,scenario,(select updated_at from public.training_content where id=content));
end $fn$;
select pg_temp.prepare_practice(scenario) from practice_fixture;
select is((select count(*) from public.training_vici_challenges where workflow_version=3),9::bigint,'nine distinct protocol 3 drafts');
select throws_ok($q$select public.configure_vici_practice((select content_id from practice_fixture limit 1),'mock',now())$q$,'40001',null,'configuration requires CAS');
select throws_ok($q$update public.training_simulation_steps set expected_value='SPXFER',options='["SPXFER"]' where content_id=(select content_id from practice_fixture where scenario='asia') and expected_value='SPANIS';select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from practice_fixture where scenario='asia'$q$,'22023',null,'SPANIS cannot be replaced with SPXFER');
select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from practice_fixture;
select throws_ok($q$select public.configure_vici_practice(content_id,'mock',(select updated_at from public.training_content where id=content_id)) from practice_fixture limit 1$q$,'55000',null,'published versions immutable');
select ok(not has_function_privilege('authenticated','public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)','EXECUTE'),'browser command denied');
select ok(not has_function_privilege('authenticated','pulse_private.vici_customer(integer)','EXECUTE'),'private customer bank not directly callable');
select ok(not has_function_privilege('service_role','public.agent_submit_vici_command_v2(uuid,uuid,integer,uuid,text,text)','EXECUTE'),'legacy bypass remains denied');
select is((select count(distinct pulse_private.vici_customer(i)->>'phone') from generate_series(0,19)i),20::bigint,'twenty unique fictitious numbers');
select is((select count(*) from generate_series(0,19)i where pulse_private.vici_customer(i)->>'payment'=''),4::bigint,'four missing payments');
select is((select count(*) from generate_series(0,19)i where pulse_private.vici_customer(i)->>'origination'=''),4::bigint,'four missing dates');
select is(pulse_private.vici_customer(20),pulse_private.vici_customer(0),'customer cycle wraps');
select set_config('request.jwt.claim.role','service_role',true);
update practice_fixture set snapshot=public.agent_start_simulation((select id from public.agents where agent_code=case when scenario='spxfer' then '99107402' else '99107401' end),content_id);
create function pg_temp.practice_command(scenario text,command text,value text default null,request uuid default gen_random_uuid()) returns jsonb language plpgsql as $fn$
declare snapshot jsonb; agent uuid; result jsonb;
begin
 select f.snapshot into snapshot from practice_fixture f where f.scenario=practice_command.scenario;
 select id into agent from public.agents where agent_code=case when scenario='spxfer' then '99107402' else '99107401' end;
 result:=public.agent_submit_vici_command(agent,(snapshot->>'attempt_id')::uuid,(snapshot->>'state_version')::integer,request,command,value);
 update practice_fixture f set snapshot=result where f.scenario=practice_command.scenario; return result;
end $fn$;
select ok(not exists(select 1 from practice_fixture where snapshot ? 'step' or snapshot ? 'position' or snapshot ? 'hint'),'snapshots expose no steps or future answers');
select is(pg_temp.practice_command('callback','newCustomer',null,'50740000-0000-4000-8000-000000000001')->'dialer'->'customer'->>'index','1','new customer server-owned');
select is(pg_temp.practice_command('callback','newCustomer',null,'50740000-0000-4000-8000-000000000001')->>'duplicate','true','customer retry idempotent');
select is(pg_temp.practice_command('callback','manual')->>'correct','false','cannot skip callback pause/CB/logo');
select throws_ok($q$select public.agent_submit_vici_command((select id from public.agents where agent_code='99107402'),(select (snapshot->>'attempt_id')::uuid from practice_fixture where scenario='callback'),1,gen_random_uuid(),'status')$q$,'42501',null,'cross-Agent blocked');
select throws_ok($q$select public.agent_submit_vici_command((select id from public.agents where agent_code='99107401'),(select (snapshot->>'attempt_id')::uuid from practice_fixture where scenario='callback'),1,gen_random_uuid(),'status')$q$,'40001',null,'stale state blocked');
select is(pg_temp.practice_command('callback','status')->'dialer'->>'pause_menu','true','callback first graded click opens pause');
select is(pg_temp.practice_command('callback','newCustomer')->>'correct','false','mid-practice customer change rejected');
select pg_temp.practice_command('callback','callbacks');select pg_temp.practice_command('callback','logo');select pg_temp.practice_command('callback','manual');
select is(pg_temp.practice_command('callback','dial','2025550147')->>'correct','false','old number rejected after customer change');
select is(pg_temp.practice_command('callback','dial','2025550148')->'dialer'->>'phase','live','current number validated on server');
select pg_temp.practice_command('callback','hangup');select pg_temp.practice_command('callback','callDisposition','NI');select pg_temp.practice_command('callback','submit','active');
select is((select snapshot->>'status' from practice_fixture where scenario='callback'),'completed','callback completes only after disposition submit');

create function pg_temp.finish_practice(scenario text) returns setof text language plpgsql as $fn$
declare spec jsonb:=pulse_private.vici_practice_spec(scenario); cmd text; value text; result jsonb;
begin
 for cmd in select jsonb_array_elements_text(spec->'commands') loop
 value:=spec->'values'->>cmd;
 if cmd='submit' then value:='active'; end if;
 if cmd='leave' then
   result:=pg_temp.practice_command(scenario,cmd,value);
   return next ok(result->>'correct'='false',scenario||' rejects immediate departure');
   return next ok((result->'dialer'->>'intro_started_at') is not null,scenario||' server intro timestamp present');
   -- Time fixture only inside disposable DB; no browser command can set this.
   update public.training_vici_sessions set intro_started_at=clock_timestamp()-interval '15 seconds' where attempt_id=(result->>'attempt_id')::uuid;
 end if;
 if cmd='phoneLogin' then
 result:=pg_temp.practice_command(scenario,cmd,'not-a-real-credential');
 return next ok(result->>'correct'='false','bad training login rejected');
 end if;
 if cmd='callDisposition' and scenario in ('english','spxfer','asia') then
 result:=pg_temp.practice_command(scenario,cmd,case when scenario='spxfer' then 'SPANIS' else 'SPXFER' end);
 return next ok(result->>'correct'='false',scenario||' wrong regional disposition rejected');
 end if;
 result:=pg_temp.practice_command(scenario,cmd,value);
 return next ok(result->>'correct'='true',scenario||' correct '||cmd);
 end loop;
 return next ok(result->>'status'='completed',scenario||' completed');
end $fn$;
select pg_temp.finish_practice(scenario) from practice_fixture where scenario<>'callback';
select is((select count(*) from public.training_results),9::bigint,'one immutable result per completed practice');
select is(pg_temp.practice_command('english','status')->'dialer'->>'pause_menu','true','completed dialer can use neutral pause controls');
select pg_temp.practice_command('english','manage');
select is((select count(*) from public.training_results),9::bigint,'neutral controls never duplicate results');
select throws_ok($q$select pg_temp.practice_command('english','leave')$q$,'55000',null,'completed result cannot be regraded');
select ok(not exists(select 1 from information_schema.columns where table_name='training_simulation_events' and column_name in ('submitted_value','value','phone_number','password')),'events never retain submitted credentials or numbers');
select finish();rollback;
