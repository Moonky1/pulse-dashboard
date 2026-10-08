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

insert into public.training_media(id,media_type,storage_bucket,storage_path,mime_type,created_by_user_id,media_kind,bound_content_id,byte_size,sha256,upload_key,status,finalized_at)
select gen_random_uuid(),'audio','training-media','simulation/local/'||content_id||'.wav','audio/wav','b0740000-0000-4000-8000-000000000001','simulation_audio',content_id,case when scenario='english' then 882044 else 44144 end,repeat('b',64),gen_random_uuid(),'ready',now() from practice_fixture where scenario in ('english','dead_air');
select public.configure_vici_audio(f.content_id,case when scenario='english' then 'advisor' else 'customer' end,m.id,c.updated_at)
from practice_fixture f join public.training_content c on c.id=f.content_id join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio';
select is((select count(*) from public.training_vici_audio),2::bigint,'two bounded private clips attached');
select throws_ok($q$select public.configure_vici_audio((select content_id from practice_fixture where scenario='dead_air'),'customer',(select id from public.training_media where media_kind='simulation_audio' limit 1),now())$q$,'40001',null,'audio binding requires CAS');
select throws_ok($q$select public.configure_vici_audio((select content_id from practice_fixture where scenario='dead_air'),'advisor',(select id from public.training_media where media_kind='simulation_audio' and byte_size=44144),(select updated_at from public.training_content where id=(select content_id from practice_fixture where scenario='dead_air')))$q$,'23514',null,'short or non-transfer advisor clip denied');
select throws_ok($q$select public.configure_vici_audio((select content_id from practice_fixture where scenario='dead_air'),'customer',(select id from public.training_media where media_kind='simulation_audio' and byte_size=882044),(select updated_at from public.training_content where id=(select content_id from practice_fixture where scenario='dead_air')))$q$,'23514',null,'cross-family clip binding denied');
select ok(not has_table_privilege('authenticated','public.training_vici_audio','SELECT'),'browser cannot list bindings');
select ok(not has_table_privilege('service_role','public.training_vici_audio','UPDATE'),'only reviewed RPC mutates bindings');
select ok(not has_function_privilege('authenticated','public.agent_can_read_vici_audio(uuid,uuid,uuid,uuid)','EXECUTE'),'Agent read RPC server only');
select ok(not has_function_privilege('anon','public.can_read_vici_audio(uuid,uuid)','EXECUTE'),'anonymous read denied');
select ok(public.can_read_vici_audio(m.id,f.content_id),'authorized Studio can preview attached clip') from practice_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio';
select throws_ok($q$update public.training_media set status='deleting' where media_kind='simulation_audio'$q$,'55000',null,'referenced private clip cannot be deleted');
select public.publish_training_content(content_id,(select updated_at from public.training_content where id=content_id)) from practice_fixture;
select throws_ok($q$delete from public.training_vici_audio$q$,'55000',null,'published audio bindings immutable');
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

select is((select jsonb_array_length(snapshot->'audio') from practice_fixture where scenario='english'),0,'future advisor ID hidden');
select is((select jsonb_array_length(snapshot->'audio') from practice_fixture where scenario='dead_air'),1,'current customer cue exposed');
select ok(public.agent_can_read_vici_audio(a.id,m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid),'own current customer audio allowed') from practice_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' cross join public.agents a where f.scenario='dead_air' and a.agent_code='99107401';
select ok(not public.agent_can_read_vici_audio(a.id,m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid),'future advisor audio denied') from practice_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' cross join public.agents a where f.scenario='english' and a.agent_code='99107401';
select throws_ok($q$select public.agent_can_read_vici_audio((select id from public.agents where agent_code='99107402'),m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid) from practice_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' where scenario='dead_air'$q$,'42501',null,'cross-Agent clip access denied');
select pg_temp.practice_command('english','transfer');
select pg_temp.practice_command('english','connect');
select is((select snapshot->'dialer'->>'intro_started_at' from practice_fixture where scenario='english'),null,'assigned advisor audio does not start timer before playback');
select is((select jsonb_array_length(snapshot->'audio') from practice_fixture where scenario='english'),1,'conference exposes only advisor cue');
select is(pg_temp.practice_command('english','leave')->>'correct','false','departure denied before playback');
select is(pg_temp.practice_command('english','advisorIntro',null,'50750000-0000-4000-8000-000000000001')->>'correct',null,'playback is neutral not an answer');
select is(pg_temp.practice_command('english','advisorIntro',null,'50750000-0000-4000-8000-000000000001')->>'duplicate','true','playback retry idempotent');
select ok((select snapshot->'dialer'->>'intro_started_at' is not null from practice_fixture where scenario='english'),'server starts intro clock');
select is(pg_temp.practice_command('english','leave')->>'correct','false','departure within 15 seconds denied');
update public.training_vici_sessions set intro_started_at=clock_timestamp()-interval '15 seconds' where attempt_id=(select (snapshot->>'attempt_id')::uuid from practice_fixture where scenario='english');
select pg_temp.practice_command('english','leave');select pg_temp.practice_command('english','callDisposition','XFER');select pg_temp.practice_command('english','submit','active');
select ok(not public.agent_can_read_vici_audio(a.id,m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid),'completed attempts cannot fetch audio') from practice_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' cross join public.agents a where f.scenario='english' and a.agent_code='99107401';
select pg_temp.practice_command('dead_air','hangup');
select ok(not public.agent_can_read_vici_audio(a.id,m.id,f.content_id,(f.snapshot->>'attempt_id')::uuid),'ended call cannot fetch customer clip') from practice_fixture f join public.training_media m on m.bound_content_id=f.content_id and m.media_kind='simulation_audio' cross join public.agents a where f.scenario='dead_air' and a.agent_code='99107401';
select finish();rollback;
