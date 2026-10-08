-- New practice contract only; published protocol 1/2 and immutable results stay intact.
begin;
alter table public.training_vici_challenges drop constraint training_vici_challenges_scenario_check;
alter table public.training_vici_challenges add constraint training_vici_challenges_scenario_check check(scenario in ('login','callback','english','spxfer','asia','dead_air','answering','mailbox_full','mock'));
alter table public.training_vici_challenges drop constraint training_vici_challenges_workflow_version_check;
alter table public.training_vici_challenges add constraint training_vici_challenges_workflow_version_check check(workflow_version in (1,2,3));
alter table public.training_vici_sessions add column customer_index integer not null default 0 check(customer_index between 0 and 19),
  add column intro_started_at timestamptz;
alter table public.training_vici_control_events drop constraint training_vici_control_events_command_check;
alter table public.training_vici_control_events add constraint training_vici_control_events_command_check check(command in ('status','break','lunch','callbacks','manage','restroom','tech','resume','closePause','back','logo','manual','hangup','callDisposition','newCustomer'));

create function pulse_private.vici_practice_spec(scenario text)
returns jsonb language sql immutable set search_path=pg_catalog as $fn$
 select case scenario when 'login' then '{"title":"Login","commands":["agentLogin","phoneLogin","campaignLogin","status","resume"],"phases":["welcome","phone_login","campaign_login","home","pause_codes","active"],"values":{"phoneLogin":"training","campaignLogin":"OPENERS2"},"situation":"Log in with the training credentials, choose OPENERS2 and go active."}'::jsonb
when 'callback' then '{"title":"Callback","commands":["status","callbacks","logo","manual","dial","hangup","callDisposition","submit"],"phases":["home","pause_codes","home","home","manual","live","call_disposition","call_disposition","active"],"values":{"dial":"customer-phone","callDisposition":"NI"},"situation":"Call this customer back. Once connected, the customer says: “Thank you for calling back, but I am not interested.”"}'::jsonb
when 'english' then '{"title":"English Transfer · XFER","commands":["transfer","connect","leave","callDisposition","submit"],"phases":["live","transfer","conference","call_disposition","call_disposition","active"],"values":{"callDisposition":"XFER"},"situation":"The English-speaking customer agrees to speak with a Service Advisor."}'::jsonb
when 'spxfer' then '{"title":"Spanish Transfer · SPXFER","commands":["transfer","presets","language","connect","leave","callDisposition","submit"],"phases":["live","transfer","presets","transfer","conference","call_disposition","call_disposition","active"],"values":{"language":"Spanish","callDisposition":"SPXFER"},"situation":"The Spanish-speaking customer agrees to speak with a Spanish Service Advisor."}'::jsonb
when 'asia' then '{"title":"Local Spanish Transfer · SPANIS","commands":["transfer","presets","language","local","disposition","callDisposition","submit"],"phases":["live","transfer","presets","spanish","disposition","call_disposition","call_disposition","active"],"values":{"language":"Spanish","disposition":"SPANISH SPEAKER","callDisposition":"SPANIS"},"situation":"This line cannot handle Spanish. Advise the customer that you will connect them with a Spanish-speaking representative."}'::jsonb
when 'dead_air' then '{"title":"Dead Air","commands":["hangup","callDisposition","submit"],"phases":["live","call_disposition","call_disposition","active"],"values":{"callDisposition":"DAIR"},"situation":"The call connects, but there is silence and no customer response."}'::jsonb
when 'answering' then '{"title":"Answering Machine","commands":["hangup","callDisposition","submit"],"phases":["live","call_disposition","call_disposition","active"],"values":{"callDisposition":"A"},"situation":"An automated greeting says: “Please leave your message after the tone.”"}'::jsonb
when 'mailbox_full' then '{"title":"Voicemail Full","commands":["hangup","callDisposition","submit"],"phases":["live","call_disposition","call_disposition","active"],"values":{"callDisposition":"A"},"situation":"An automated message says: “The mailbox is full and cannot accept any messages.”"}'::jsonb
when 'mock' then '{"title":"Mock Call · Customer Information","commands":["hangup","callDisposition","submit"],"phases":["live","call_disposition","call_disposition","active"],"values":{"callDisposition":"NI"},"situation":"Practice your opening and ask about any missing loan information. At the end the customer says: “I am not interested.”"}'::jsonb else null end
$fn$;
create function pulse_private.vici_customer(customer_index integer)
returns jsonb language plpgsql immutable set search_path=pg_catalog as $fn$
declare n integer:=((customer_index%20)+20)%20; names text[]:=array['Taylor Example','Jordan Sample','Morgan Demo','Casey Practice','Riley Example','Avery Sample','Cameron Demo','Jamie Practice','Drew Example','Alex Sample','Quinn Demo','Robin Practice','Skyler Example','Reese Sample','Parker Demo','Rowan Practice','Blake Example','Finley Sample','Emerson Demo','Sage Practice']; full_name text;
begin
 full_name:=names[n+1];
 return jsonb_build_object('index',n,'first',split_part(full_name,' ',1),'last',split_part(full_name,' ',2),'address',(100+n)::text||' Training Ave','city','Example City','state','DC','zip','20001','email','',
 'year',(2017+n%7)::text,'make',(array['Toyota','Honda','Ford','Chevrolet'])[n%4+1],'model',(array['Camry','Civic','Escape','Malibu'])[n%4+1],
 'phone',(2025550147::bigint+n)::text,'odometer',(30000+n*2500)::text,'vin','','balance',(25000+n*350)::text,'payment',case when n in (4,9,14,19) then '' else (400+n*7)::text end,
 'term','72','origination',case when n in (2,7,12,17) then '' else '01/'||lpad((1+n)::text,2,'0')||'/2025' end,'apr','7.5','birth','01/01/1990','close','');
end $fn$;
create function public.configure_vici_practice(requested_content_id uuid,requested_scenario text,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; actor uuid;
begin
 select * into item from public.training_content where id=requested_content_id for update;
 actor:=pulse_private.require_training_content_permission('studio.create',requested_content_id);
 if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then raise exception 'simulation draft required' using errcode='55000'; end if;
 if item.created_by_user_id<>actor and not pulse_private.has_training_content_permission('academy.manage',item.id) then raise exception 'draft owner or manager required' using errcode='42501'; end if;
 if expected_updated_at is null or item.updated_at is distinct from expected_updated_at then raise exception 'draft changed' using errcode='40001'; end if;
 if pulse_private.vici_practice_spec(requested_scenario) is null then raise exception 'reviewed practice required' using errcode='22023'; end if;
 insert into public.training_vici_challenges(content_id,scenario,workflow_version) values(item.id,requested_scenario,3) on conflict(content_id) do update set scenario=excluded.scenario,workflow_version=3;
 update public.training_content set updated_at=clock_timestamp() where id=item.id returning * into item;
 insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata) values(actor,'training_content',item.id,'training.vici_practice_configured','database',jsonb_build_object('scenario',requested_scenario,'workflow_version',3));
 return jsonb_build_object('id',item.id,'updated_at',item.updated_at,'scenario',requested_scenario,'workflow_version',3);
end $fn$;

create function pulse_private.validate_vici_practice(content uuid)
returns void language plpgsql security definer set search_path=pg_catalog as $fn$
declare scenario text; spec jsonb; actual text[]; kinds text[]; wanted text[]:=array[null]::text[]; wanted_kinds text[]:=array['info']; cmd text; value text; valid_teams text[];
begin
 select v.scenario into scenario from public.training_vici_challenges v where v.content_id=content;
 spec:=pulse_private.vici_practice_spec(scenario);
 if spec is null then raise exception 'reviewed practice required' using errcode='22023'; end if;
 valid_teams:=case when scenario='spxfer' then array['colombia','central_america','venezuela']
 when scenario='asia' then array['asia_team_a','asia_team_b','philippines','mexico_team_group_a','mexico_team_group_b']
 else array['asia_team_a','asia_team_b','philippines','mexico_team_group_a','mexico_team_group_b','colombia','central_america','venezuela'] end;
 if exists(select 1 from public.training_content_position_targets where content_id=content)
 or not exists(select 1 from public.training_content_audiences where content_id=content)
 or exists(select 1 from public.training_content_audiences a left join public.teams t on t.id=a.team_id
 left join public.operating_units u on u.id=t.operating_unit_id left join public.campaigns c on c.id=t.campaign_id
 where a.content_id=content and (a.scope_type<>'team' or t.id is null or u.id is null or c.id is null or not t.is_active or not u.is_active or u.code<>'openers' or not c.is_active or u.campaign_id<>c.id or not(t.code=any(valid_teams)))) then
 raise exception 'matching active Opener team required for this regional process' using errcode='22023'; end if;
 for cmd in select jsonb_array_elements_text(spec->'commands') loop
   value:=spec->'values'->>cmd;
   wanted:=array_append(wanted,case when cmd in ('language','disposition','callDisposition','campaignLogin','dial') then value else cmd end);
   wanted_kinds:=array_append(wanted_kinds,case when cmd='dial' then 'text' when cmd in ('language','disposition','callDisposition','campaignLogin') then 'select' when cmd in ('agentLogin','phoneLogin') then 'action' else 'click' end);
 end loop;
 select array_agg(expected_value order by position),array_agg(interaction order by position) into actual,kinds from public.training_simulation_steps where content_id=content;
 if actual is distinct from wanted or kinds is distinct from wanted_kinds or exists(select 1 from public.training_simulation_steps where content_id=content and branches<>'{}'::jsonb) then raise exception 'keep the reviewed practice workflow' using errcode='22023'; end if;
end $fn$;
-- Preserve the complete older publication guard; insert a separate v3 gate.
do $patch$
declare source text;
begin
 source:=pg_get_functiondef('pulse_private.validate_vici_publication()'::regprocedure);
 source:=replace(source,'if scenario is null then','if protocol=3 then perform pulse_private.validate_vici_practice(new.id); return new; end if; if scenario is null then');
 execute source;
end $patch$;
do $clone$
declare signature text; source text;
begin
 foreach signature in array array['pulse_private.simulation_snapshot(uuid,uuid)','pulse_private.start_simulation(uuid,uuid,boolean)','public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)'] loop
 source:=pg_get_functiondef(signature::regprocedure);
 execute replace(source,split_part(signature,'(',1)||'(',split_part(signature,'(',1)||'_v2(');
 end loop;
end $clone$;
create or replace function pulse_private.simulation_snapshot(requested_attempt_id uuid,requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; scenario text; protocol integer; pos integer; spec jsonb; phase text; session public.training_vici_sessions%rowtype;
begin
 snap:=pulse_private.simulation_snapshot_foundation(requested_attempt_id,requested_agent_id);
 select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=(snap->>'content_id')::uuid;
 if protocol is distinct from 3 then return pulse_private.simulation_snapshot_v2(requested_attempt_id,requested_agent_id); end if;
 spec:=pulse_private.vici_practice_spec(scenario); pos:=(snap->>'position')::integer;
 select * into session from public.training_vici_sessions where attempt_id=requested_attempt_id;
 phase:=case when snap->>'status'='completed' then 'active' else spec->'phases'->>greatest(0,pos-2) end;
 if phase='manual' and session.manual_closed or phase='pause_codes' and not coalesce(session.pause_menu,false) then phase:='home'; end if;
 return (snap-'step'-'position'-'hint')||jsonb_build_object('situation',spec->>'situation',
 'challenge',jsonb_build_object('scenario',scenario,'workflow_version',3,'selection_mode',(select selection_mode from public.training_simulation_attempts where attempt_id=requested_attempt_id)),
 'dialer',jsonb_build_object('phase',phase,'is_paused',coalesce(session.is_paused,scenario in ('callback','login')),'pause_menu',coalesce(session.pause_menu,false),
 'call_disposition',session.call_disposition,'customer',pulse_private.vici_customer(coalesce(session.customer_index,0)),'can_change_customer',pos=2 and snap->>'status'='started',
 'intro_started_at',session.intro_started_at,'server_now',clock_timestamp(),'language',case when scenario='spxfer' and pos>=5 or scenario='asia' and pos>=5 then 'Spanish' else 'English' end));
end $fn$;
create or replace function pulse_private.start_simulation(requested_content_id uuid,requested_agent_id uuid,requested_restart boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; scenario text; protocol integer;
begin
 snap:=pulse_private.start_simulation_v2(requested_content_id,requested_agent_id,requested_restart);
 select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=requested_content_id;
 if protocol=3 then
 insert into public.training_vici_sessions(attempt_id,is_paused) values((snap->>'attempt_id')::uuid,scenario in ('callback','login')) on conflict do nothing;
 return pulse_private.simulation_snapshot((snap->>'attempt_id')::uuid,requested_agent_id);
 end if;
 return snap;
end $fn$;
create or replace function public.agent_submit_vici_command(requested_agent_id uuid,requested_attempt_id uuid,expected_state_version integer,
 requested_request_id uuid,requested_command text,requested_value text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; state public.training_simulation_attempts%rowtype; step public.training_simulation_steps%rowtype; session public.training_vici_sessions%rowtype;
 scenario text; protocol integer; spec jsonb; expected text; wanted text; phase text; neutral boolean:=false; valid boolean; answer text; result jsonb;
begin
 if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
 perform 1 from public.training_attempts where id=requested_attempt_id for update;
 snap:=pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
 select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=(snap->>'content_id')::uuid;
 if protocol is distinct from 3 then return public.agent_submit_vici_command_v2(requested_agent_id,requested_attempt_id,expected_state_version,requested_request_id,requested_command,requested_value); end if;
 if requested_request_id is null or expected_state_version is null or requested_command is null or requested_command not in
 ('status','callbacks','break','lunch','manage','restroom','tech','resume','closePause','logo','manual','fast','log','dial','preview','back','transfer','presets','language','local','disposition','blind','connect','hangup','leave','both','park','callDisposition','submit','newCustomer','agentLogin','phoneLogin','campaignLogin')
 or length(coalesce(requested_value,''))>100 then raise exception 'bounded practice command required' using errcode='22023'; end if;
 if exists(select 1 from public.training_simulation_events where attempt_id=requested_attempt_id and request_id=requested_request_id)
 or exists(select 1 from public.training_vici_control_events where attempt_id=requested_attempt_id and request_id=requested_request_id) then return snap||jsonb_build_object('duplicate',true); end if;
 select * into state from public.training_simulation_attempts where attempt_id=requested_attempt_id;
 select * into session from public.training_vici_sessions where attempt_id=requested_attempt_id;
 if not found then raise exception 'saved practice session required' using errcode='55000'; end if;
 if state.state_version<>expected_state_version then raise exception 'dialer state changed' using errcode='40001'; end if;
 if state.state_version>=20000 then raise exception 'restart this practice' using errcode='22023'; end if;
 if snap->>'status' not in ('started','completed') then raise exception 'active or completed practice required' using errcode='55000'; end if;
 spec:=pulse_private.vici_practice_spec(scenario); expected:=spec->'commands'->>(state.current_position-2); wanted:=spec->'values'->>expected; phase:=snap->'dialer'->>'phase';
 if requested_command='newCustomer' and state.current_position=2 and snap->>'status'='started' then
 update public.training_vici_sessions set customer_index=(customer_index+1)%20 where attempt_id=requested_attempt_id; neutral:=true;
 elsif requested_command='status' and phase in ('home','active','pause_codes') and expected is distinct from 'status' then
 update public.training_vici_sessions set pause_menu=true where attempt_id=requested_attempt_id; neutral:=true;
 elsif requested_command in ('resume','closePause','break','lunch','callbacks','manage','restroom','tech') and session.pause_menu and requested_command is distinct from expected then
 update public.training_vici_sessions set is_paused=case when requested_command='resume' then false when requested_command='closePause' then is_paused else true end,pause_menu=false where attempt_id=requested_attempt_id; neutral:=true;
 elsif requested_command in ('logo','back') and phase='manual' then
 update public.training_vici_sessions set manual_closed=true where attempt_id=requested_attempt_id; neutral:=true;
 elsif requested_command='manual' and phase='home' and spec->'phases'->>(state.current_position-2)='manual' and session.manual_closed then
 update public.training_vici_sessions set manual_closed=false where attempt_id=requested_attempt_id; neutral:=true;
 elsif requested_command='logo' and phase in ('home','active') and expected is distinct from 'logo' or requested_command='hangup' and phase='call_disposition' then neutral:=true;
 end if;
 if neutral then
 update public.training_simulation_attempts set state_version=state_version+1 where attempt_id=requested_attempt_id;
 insert into public.training_vici_control_events(attempt_id,request_id,command) values(requested_attempt_id,requested_request_id,requested_command);
 return pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
 end if;
 if snap->>'status'<>'started' then raise exception 'practice complete; restart to make another call' using errcode='55000'; end if;
 valid:=requested_command=expected and (wanted is null or requested_value=case when wanted='customer-phone' then pulse_private.vici_customer(session.customer_index)->>'phone' else wanted end);
 if requested_command='leave' then valid:=valid and session.intro_started_at is not null and clock_timestamp()-session.intro_started_at>=interval '15 seconds'; end if;
 if expected in ('callbacks','resume') then valid:=valid and session.pause_menu; end if;
 if expected in ('manual','dial') then valid:=valid and session.is_paused and not session.pause_menu and not (expected='dial' and session.manual_closed); end if;
 if expected='submit' then valid:=valid and session.call_disposition is not null and requested_value in ('active','paused'); end if;
 valid:=coalesce(valid,false);
 select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=state.current_position;
 if valid then
 update public.training_vici_sessions set pause_menu=case when expected='status' then true when expected in ('callbacks','resume','submit') then false else pause_menu end,
 is_paused=case when expected='callbacks' then true when expected='resume' then false when expected='submit' then requested_value='paused' else is_paused end,
 call_disposition=case when expected='callDisposition' then requested_value else call_disposition end,
 intro_started_at=case when expected='connect' then clock_timestamp() else intro_started_at end where attempt_id=requested_attempt_id;
 end if;
 -- Persist only canonical reviewed markers, never raw passwords or entered numbers.
 answer:=case when valid then step.expected_value else '__wrong_control__' end;
 result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,state.state_version,requested_request_id,'answer',to_jsonb(answer));
 return result-'feedback'||jsonb_build_object('feedback',case when result->>'correct'='false' then 'Action not completed.' when result->>'status'='completed' then 'Practice complete.' else null end);
end $fn$;
create or replace function public.get_simulation_authoring(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $fn$
begin
 return public.get_simulation_authoring_foundation(requested_content_id)||jsonb_build_object('scenario',(select scenario from public.training_vici_challenges where content_id=requested_content_id),
 'workflow_version',(select workflow_version from public.training_vici_challenges where content_id=requested_content_id));
end $fn$;
do $catalog$
declare signature text; source text;
begin
 foreach signature in array array['pulse_private.list_simulations(uuid,integer,integer)','public.agent_assign_vici_challenge(uuid)'] loop
 source:=pg_get_functiondef(signature::regprocedure); execute replace(source,'v.workflow_version=2','v.workflow_version in (2,3)');
 end loop;
end $catalog$;
do $grants$
declare f record;
begin
 for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','pulse_private') and (p.proname like '%vici%' or p.proname in ('simulation_snapshot_v2','start_simulation_v2')) loop
 execute 'alter function '||f.signature||' owner to postgres';
 execute 'revoke all on function '||f.signature||' from public,anon,authenticated,service_role';
 if f.nspname='public' and f.proname in ('agent_submit_vici_command','agent_assign_vici_challenge') then execute 'grant execute on function '||f.signature||' to service_role';
 elsif f.nspname='public' and f.proname in ('configure_vici_challenge','configure_vici_practice') then execute 'grant execute on function '||f.signature||' to authenticated'; end if;
 end loop;
end $grants$;
notify pgrst,'reload schema';
commit;
