-- Authorized SIM lifecycle correction. Preview certification precedes Production.
-- Existing versions and results are never rewritten; protocol 2 applies to newly configured drafts.
begin;
alter table public.training_vici_challenges add column workflow_version integer not null default 1 check(workflow_version in (1,2));
create or replace function pulse_private.clone_vici_revision()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if new.content_type='simulation' and new.version_number>1 then
    insert into public.training_vici_challenges(content_id,scenario,workflow_version)
      select new.id,v.scenario,v.workflow_version from public.training_vici_challenges v join public.training_content c on c.id=v.content_id
      where c.game_id=new.game_id and c.is_current and c.status='published';
  end if;
  return new;
end $fn$;
create table public.training_vici_sessions (
  attempt_id uuid primary key references public.training_simulation_attempts(attempt_id) on delete restrict,
  is_paused boolean not null,
  pause_menu boolean not null default false,
  manual_closed boolean not null default false,
  call_disposition text check(call_disposition in ('A','BLANK','CALLBK','DAIR','DC','DNC','LANG','NI','SPXFER','WRGNUM','WRGVEH','XFER'))
);
create table public.training_vici_control_events (
  attempt_id uuid not null references public.training_vici_sessions(attempt_id) on delete restrict,
  request_id uuid not null,
  command text not null check(command in ('status','break','lunch','callbacks','back','logo','manual','hangup','callDisposition')),
  occurred_at timestamptz not null default clock_timestamp(),
  primary key(attempt_id,request_id)
);
alter table public.training_vici_sessions enable row level security;
alter table public.training_vici_control_events enable row level security;
revoke all on public.training_vici_sessions,public.training_vici_control_events from public,anon,authenticated,service_role;
do $clone$
declare signature text; original text;
begin
  foreach signature in array array[
    'pulse_private.simulation_snapshot(uuid,uuid)',
    'pulse_private.start_simulation(uuid,uuid,boolean)',
    'public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)',
    'public.configure_vici_challenge(uuid,text,timestamp with time zone)'
  ] loop
    original:=pg_get_functiondef(signature::regprocedure);
    execute replace(original,split_part(signature,'(',1)||'(',split_part(signature,'(',1)||'_v1(');
  end loop;
end $clone$;
create or replace function public.configure_vici_challenge(requested_content_id uuid,requested_scenario text,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare result jsonb;
begin
  result:=public.configure_vici_challenge_v1(requested_content_id,requested_scenario,expected_updated_at);
  update public.training_vici_challenges set workflow_version=2 where content_id=requested_content_id;
  return result||jsonb_build_object('workflow_version',2);
end $fn$;
create or replace function pulse_private.validate_vici_publication()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
declare scenario text; protocol integer; actual text[]; kinds text[];
begin
  if new.content_type<>'simulation' or new.status<>'published' or old.status='published' then return new; end if;
  select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=new.id;
  if scenario is null then raise exception 'manual VICI practice required' using errcode='22023'; end if;
  if exists(select 1 from public.training_content_position_targets where content_id=new.id) then raise exception 'Opener teams required' using errcode='22023'; end if;
  if not exists(select 1 from public.training_content_audiences a
    join public.teams t on t.id=a.team_id and t.is_active
    join public.operating_units u on u.id=t.operating_unit_id and u.is_active and u.code='openers'
    join public.campaigns c on c.id=t.campaign_id and c.is_active and u.campaign_id=c.id
    where a.content_id=new.id and a.scope_type='team' and
      (scenario='asia' and t.code in ('asia_team_a','asia_team_b') or scenario='callback' and t.code in ('mexico_team_group_a','mexico_team_group_b')))
    or exists(select 1 from public.training_content_audiences a left join public.teams t on t.id=a.team_id
      where a.content_id=new.id and (a.scope_type<>'team' or t.id is null or
        scenario='asia' and t.code not in ('asia_team_a','asia_team_b') or scenario='callback' and t.code not in ('mexico_team_group_a','mexico_team_group_b'))) then
    raise exception 'source-backed Asia or Mexico Opener team required' using errcode='22023'; end if;
  select array_agg(expected_value order by position),array_agg(interaction order by position) into actual,kinds from public.training_simulation_steps where content_id=new.id;
  if (protocol=1 and (
    scenario='callback' and (actual is distinct from array[null,'callbacks','logo','manual','2025550147','dial']::text[] or kinds is distinct from array['info','click','click','click','text','click']::text[]) or
    scenario='asia' and (actual is distinct from array[null,'presets','Spanish','local','SPANISH SPEAKER']::text[] or kinds is distinct from array['info','click','select','click','select']::text[])))
    or (protocol=2 and (
    scenario='callback' and (actual is distinct from array[null,'manual','2025550147','dial','hangup','NI','submit']::text[] or kinds is distinct from array['info','click','text','click','click','select','click']::text[]) or
    scenario='asia' and (actual is distinct from array[null,'presets','Spanish','local','SPANISH SPEAKER','XFER','submit']::text[] or kinds is distinct from array['info','click','select','click','select','select','click']::text[])))
    or exists(select 1 from public.training_simulation_steps where content_id=new.id and branches<>'{}'::jsonb) then
    raise exception 'keep the reviewed VICI workflow' using errcode='22023'; end if;
  return new;
end $fn$;
create or replace function pulse_private.simulation_snapshot(requested_attempt_id uuid,requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; scenario text; protocol integer; position integer; phase text; session public.training_vici_sessions%rowtype;
begin
  snap:=pulse_private.simulation_snapshot_foundation(requested_attempt_id,requested_agent_id);
  select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=(snap->>'content_id')::uuid;
  if protocol is distinct from 2 then
    snap:=pulse_private.simulation_snapshot_v1(requested_attempt_id,requested_agent_id);
    return snap||jsonb_build_object('dialer',coalesce(snap->'dialer','{}')||jsonb_build_object('pause_menu',snap->'dialer'->>'phase'='paused'));
  end if;
  position:=(snap->>'position')::integer;
  select * into session from public.training_vici_sessions where attempt_id=requested_attempt_id;
  phase:=case when snap->>'status'='completed' then 'active'
    when scenario='callback' then (array['home','home','manual','manual','live','call_disposition','call_disposition'])[position]
    else (array['live','live','presets','spanish','disposition','call_disposition','call_disposition'])[position] end;
  if phase='manual' and session.manual_closed then phase:='home'; end if;
  return (snap-'step'-'position')||jsonb_build_object(
    'challenge',jsonb_build_object('scenario',scenario,'workflow_version',2,
      'selection_mode',(select selection_mode from public.training_simulation_attempts where attempt_id=requested_attempt_id)),
    'dialer',jsonb_build_object('phase',phase,'is_paused',coalesce(session.is_paused,scenario='callback'),'pause_menu',coalesce(session.pause_menu,false),'call_disposition',session.call_disposition));
end $fn$;
create or replace function pulse_private.start_simulation(requested_content_id uuid,requested_agent_id uuid,requested_restart boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; scenario text; protocol integer;
begin
  snap:=pulse_private.start_simulation_v1(requested_content_id,requested_agent_id,requested_restart);
  select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=requested_content_id;
  if protocol=2 then
    insert into public.training_vici_sessions(attempt_id,is_paused) values((snap->>'attempt_id')::uuid,scenario='callback') on conflict do nothing;
    return pulse_private.simulation_snapshot((snap->>'attempt_id')::uuid,requested_agent_id);
  end if;
  return snap;
end $fn$;
create or replace function public.agent_submit_vici_command(requested_agent_id uuid,requested_attempt_id uuid,expected_state_version integer,
  requested_request_id uuid,requested_command text,requested_value text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; state public.training_simulation_attempts%rowtype; step public.training_simulation_steps%rowtype; session public.training_vici_sessions%rowtype;
  scenario text; protocol integer; answer text; result jsonb; phase text; neutral boolean:=false; correct_choice boolean;
begin
  if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
  perform 1 from public.training_attempts where id=requested_attempt_id for update;
  snap:=pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
  select v.scenario,v.workflow_version into scenario,protocol from public.training_vici_challenges v where v.content_id=(snap->>'content_id')::uuid;
  if protocol is distinct from 2 then return public.agent_submit_vici_command_v1(requested_agent_id,requested_attempt_id,expected_state_version,requested_request_id,requested_command,requested_value); end if;
  if requested_request_id is null or expected_state_version is null or requested_command is null or
    requested_command not in ('status','callbacks','break','lunch','logo','manual','fast','log','dial','preview','back','presets','language','local','disposition','blind','hangup','leave','both','park','callDisposition','submit')
    or length(coalesce(requested_value,''))>100 then raise exception 'bounded VICI command required' using errcode='22023'; end if;
  if exists(select 1 from public.training_simulation_events where attempt_id=requested_attempt_id and request_id=requested_request_id)
    or exists(select 1 from public.training_vici_control_events where attempt_id=requested_attempt_id and request_id=requested_request_id) then return snap||jsonb_build_object('duplicate',true); end if;
  select * into state from public.training_simulation_attempts where attempt_id=requested_attempt_id;
  select * into session from public.training_vici_sessions where attempt_id=requested_attempt_id;
  if not found then raise exception 'saved VICI session required' using errcode='55000'; end if;
  if state.state_version<>expected_state_version then raise exception 'dialer state changed' using errcode='40001'; end if;
  if state.state_version>=20000 then raise exception 'restart this practice' using errcode='22023'; end if;
  if snap->>'status' not in ('started','completed') then raise exception 'active or completed practice required' using errcode='55000'; end if;
  phase:=snap->'dialer'->>'phase';
  if requested_command='status' and phase in ('home','active') then
    update public.training_vici_sessions set is_paused=case when session.is_paused then false else is_paused end,pause_menu=not session.is_paused where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command in ('break','lunch','callbacks') and session.pause_menu then
    update public.training_vici_sessions set is_paused=true,pause_menu=false where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command in ('logo','back') and phase='manual' then
    update public.training_vici_sessions set manual_closed=true where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command='logo' and phase in ('home','active') or requested_command='hangup' and phase='call_disposition' then neutral:=true;
  elsif requested_command='manual' and scenario='callback' and state.current_position in (3,4) and session.manual_closed and session.is_paused and not session.pause_menu then
    update public.training_vici_sessions set manual_closed=false where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command='callDisposition' and phase='call_disposition' and state.current_position=7 and
    requested_value in ('A','BLANK','CALLBK','DAIR','DC','DNC','LANG','NI','SPXFER','WRGNUM','WRGVEH','XFER') and (scenario<>'asia' or requested_value='XFER') then
    update public.training_vici_sessions set call_disposition=requested_value where attempt_id=requested_attempt_id; neutral:=true;
  end if;
  if neutral then
    update public.training_simulation_attempts set state_version=state_version+1 where attempt_id=requested_attempt_id;
    insert into public.training_vici_control_events(attempt_id,request_id,command) values(requested_attempt_id,requested_request_id,requested_command);
    return pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
  end if;
  if snap->>'status'<>'started' then raise exception 'practice complete; restart to make another call' using errcode='55000'; end if;
  if requested_command in ('manual','dial') and scenario='callback' and (not session.is_paused or session.pause_menu or session.manual_closed and requested_command='dial') then
    raise exception 'pause before manual dialing' using errcode='55000'; end if;
  select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=state.current_position;
  correct_choice:=requested_command='callDisposition' and state.current_position=6 and
    requested_value in ('A','BLANK','CALLBK','DAIR','DC','DNC','LANG','NI','SPXFER','WRGNUM','WRGVEH','XFER') and (scenario<>'asia' or requested_value='XFER');
  if correct_choice then update public.training_vici_sessions set call_disposition=requested_value where attempt_id=requested_attempt_id; end if;
  if requested_command='submit' and state.current_position=7 and (session.call_disposition is null or requested_value is null or requested_value not in ('active','paused')) then
    raise exception 'select a disposition and submit a valid dialing mode' using errcode='22023'; end if;
  if requested_command='submit' and state.current_position=7 then
    update public.training_vici_sessions set is_paused=requested_value='paused',pause_menu=false where attempt_id=requested_attempt_id;
  end if;
  answer:=case when requested_command='language' and scenario='asia' and state.current_position=3 then requested_value
    when requested_command='disposition' and scenario='asia' and state.current_position=5 then requested_value
    when requested_command='dial' and scenario='callback' and state.current_position=3 then requested_value
    when correct_choice then step.expected_value
    when step.interaction='click' then requested_command else '__wrong_control__' end;
  result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,state.state_version,requested_request_id,'answer',to_jsonb(answer));
  if scenario='callback' and state.current_position=3 and requested_command='dial' and result->>'correct'='true' then
    select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=4;
    result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,(result->>'state_version')::integer,md5(requested_request_id::text||':dial-now')::uuid,'answer','"dial"'::jsonb);
  end if;
  return result-'feedback'||jsonb_build_object('feedback',case when result->>'correct'='false' then 'Action not completed.' when result->>'status'='completed' then 'Practice complete.' else null end);
end $fn$;

create or replace function pulse_private.list_simulations(requested_agent_id uuid,requested_limit integer,requested_offset integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare items jsonb;
begin
  if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
  -- Filter BEFORE pagination: older guided simulations do not consume manual catalog pages.
  if requested_limit is null or requested_limit not between 1 and 100 or requested_offset is null or requested_offset not between 0 and 10000 then
    raise exception 'bounded catalog required' using errcode='22023'; end if;
  select coalesce(jsonb_agg(item order by item->>'title',item->>'id'),'[]') into items from (
    select jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'language',c.language,'version_number',c.version_number,
      'scenario',v.scenario,'step_count',(select count(*) from public.training_simulation_steps where content_id=c.id),
      'latest_attempt',(select jsonb_build_object('status',a.status,'score_percent',r.score_percent) from public.training_attempts a
        join public.training_agent_learner_links l on l.learner_id=a.learner_id left join public.training_results r on r.attempt_id=a.id
        where l.agent_id=requested_agent_id and a.content_id=c.id and a.source_mode='simulation' order by a.attempt_number desc limit 1)) item
    from public.training_content c join public.training_vici_challenges v on v.content_id=c.id
    join public.training_content_audiences audience on audience.content_id=c.id
    join public.agents a on a.id=requested_agent_id and audience.team_id=a.team_id
    where v.workflow_version=2 and c.status='published' and c.is_current and c.content_type='simulation' and audience.scope_type='team'
    order by c.title,c.id limit requested_limit offset requested_offset
  ) eligible;
  return items;
end $fn$;
create or replace function public.agent_assign_vici_challenge(requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item uuid; snap jsonb;
begin
  if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('vici-assigned:'||requested_agent_id::text,0));
  select c.id into item from public.training_content c join public.training_vici_challenges v on v.content_id=c.id
    join public.training_content_audiences audience on audience.content_id=c.id
    join public.agents a on a.id=requested_agent_id and audience.team_id=a.team_id
    where v.workflow_version=2 and c.status='published' and c.is_current and c.content_type='simulation' and audience.scope_type='team' order by random() limit 1;
  if item is null then raise exception 'no published manual challenges for your team yet' using errcode='P0002'; end if;
  snap:=pulse_private.start_simulation(item,requested_agent_id,false);
  update public.training_simulation_attempts set selection_mode='assigned' where attempt_id=(snap->>'attempt_id')::uuid;
  return pulse_private.simulation_snapshot((snap->>'attempt_id')::uuid,requested_agent_id);
end $fn$;

do $grants$
declare f record;
begin
  for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','pulse_private') and (p.proname like '%simulation%_v1' or p.proname like '%vici%_v1') loop
    execute 'alter function '||f.signature||' owner to postgres';
    execute 'revoke all on function '||f.signature||' from public,anon,authenticated,service_role';
  end loop;
end $grants$;
revoke all on function public.configure_vici_challenge(uuid,text,timestamptz) from public,anon,service_role;
grant execute on function public.configure_vici_challenge(uuid,text,timestamptz) to authenticated;
revoke all on function public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text) from public,anon,authenticated;
grant execute on function public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text) to service_role;
notify pgrst,'reload schema';
commit;
