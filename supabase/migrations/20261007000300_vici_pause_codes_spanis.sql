-- Source-backed pause controls and Spanish Speaker wrap-up. No historical
-- results, published steps, accounts, permissions or legacy v1 rules are changed.
begin;
-- One additional bounded authoring option for SPANIS; all draft, media,
-- geometry, duplicate-option and forward-only branch guards are retained.
create or replace function pulse_private.guard_simulation_step()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; media public.training_media%rowtype;
  region jsonb; option_value jsonb; branch record; source_game uuid;
begin
  select * into item from public.training_content where id=case when tg_op='DELETE' then old.content_id else new.content_id end for share;
  if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then
    raise exception 'simulation steps require an editable simulation draft' using errcode='55000'; end if;
  if tg_op='DELETE' then return old; end if;
  if tg_op='UPDATE' and new.content_id<>old.content_id then raise exception 'step identity is immutable' using errcode='55000'; end if;
  if new.screen_media_id is not null then
    select * into media from public.training_media where id=new.screen_media_id for share;
    select game_id into source_game from public.training_content where id=media.bound_content_id;
    if media.status is distinct from 'ready' or media.media_kind is distinct from 'simulation_screen' or source_game is distinct from item.game_id then
      raise exception 'ready private simulation screenshot required' using errcode='23514'; end if;
  end if;
  if jsonb_array_length(new.regions)>20 or jsonb_array_length(new.options)>13 or length(coalesce(new.expected_value,''))>500 or octet_length(new.branches::text)>4000 then
    raise exception 'bounded simulation definition required' using errcode='22023'; end if;
  for region in select value from jsonb_array_elements(new.regions) loop
    if jsonb_typeof(region)<>'object' or coalesce(region->>'id','') !~ '^[a-z][a-z0-9_-]{0,39}$'
      or length(coalesce(region->>'label','')) not between 1 and 120 or not (region ?& array['x','y','w','h']) then
      raise exception 'invalid normalized hotspot' using errcode='22023'; end if;
    if jsonb_typeof(region->'x')<>'number' or jsonb_typeof(region->'y')<>'number' or jsonb_typeof(region->'w')<>'number' or jsonb_typeof(region->'h')<>'number'
      or (region->>'x')::numeric<0 or (region->>'y')::numeric<0 or (region->>'w')::numeric<=0 or (region->>'h')::numeric<=0
      or (region->>'x')::numeric+(region->>'w')::numeric>1 or (region->>'y')::numeric+(region->>'h')::numeric>1 then
      raise exception 'invalid normalized hotspot' using errcode='22023'; end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(new.regions))<>jsonb_array_length(new.regions) then raise exception 'duplicate hotspot identities' using errcode='22023'; end if;
  for option_value in select value from jsonb_array_elements(new.options) loop
    if jsonb_typeof(option_value)<>'string' or length(option_value #>> '{}') not between 1 and 200 then raise exception 'invalid simulation option' using errcode='22023'; end if;
  end loop;
  if (select count(distinct value) from jsonb_array_elements(new.options))<>jsonb_array_length(new.options) then raise exception 'duplicate options' using errcode='22023'; end if;
  if new.interaction='click' and not exists(select 1 from jsonb_array_elements(new.regions) r where r->>'id'=new.expected_value)
    or new.interaction in ('choice','select') and not coalesce(new.options ? new.expected_value,false)
    or new.interaction in ('text','action') and length(btrim(coalesce(new.expected_value,'')))=0 then raise exception 'valid expected action required' using errcode='22023'; end if;
  for branch in select * from jsonb_each(new.branches) loop
    if new.interaction not in ('choice','select') or not (new.options ? branch.key) or branch.value::text !~ '^[0-9]{1,3}$'
      or branch.value::text::integer<=new.position or branch.value::text::integer>100 then raise exception 'branches must target a later option step' using errcode='22023'; end if;
  end loop;
  return new;
end $fn$;
alter table public.training_vici_sessions drop constraint training_vici_sessions_call_disposition_check;
alter table public.training_vici_sessions add constraint training_vici_sessions_call_disposition_check
  check(call_disposition in ('A','BLANK','CALLBK','DAIR','DC','DNC','LANG','NI','SPXFER','WRGNUM','WRGVEH','XFER','SPANIS'));
alter table public.training_vici_control_events drop constraint training_vici_control_events_command_check;
alter table public.training_vici_control_events add constraint training_vici_control_events_command_check
  check(command in ('status','break','lunch','callbacks','manage','restroom','tech','resume','closePause','back','logo','manual','hangup','callDisposition'));

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
    requested_command not in ('status','callbacks','break','lunch','manage','restroom','tech','resume','closePause','logo','manual','fast','log','dial','preview','back','presets','language','local','disposition','blind','hangup','leave','both','park','callDisposition','submit')
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
    update public.training_vici_sessions set pause_menu=true where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command in ('resume','closePause') and session.pause_menu and phase in ('home','active') then
    update public.training_vici_sessions set is_paused=case when requested_command='resume' then false else is_paused end,pause_menu=false where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command in ('break','lunch','callbacks','manage','restroom','tech') and session.pause_menu and phase in ('home','active') then
    update public.training_vici_sessions set is_paused=true,pause_menu=false where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command in ('logo','back') and phase='manual' then
    update public.training_vici_sessions set manual_closed=true where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command='logo' and phase in ('home','active') or requested_command='hangup' and phase='call_disposition' then neutral:=true;
  elsif requested_command='manual' and scenario='callback' and state.current_position in (3,4) and session.manual_closed and session.is_paused and not session.pause_menu then
    update public.training_vici_sessions set manual_closed=false where attempt_id=requested_attempt_id; neutral:=true;
  elsif requested_command='callDisposition' and phase='call_disposition' and state.current_position=7 and
    requested_value in ('A','BLANK','CALLBK','DAIR','DC','DNC','LANG','NI','SPXFER','WRGNUM','WRGVEH','XFER','SPANIS') and (scenario<>'asia' or requested_value in ('XFER','SPANIS')) then
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
    requested_value in ('A','BLANK','CALLBK','DAIR','DC','DNC','LANG','NI','SPXFER','WRGNUM','WRGVEH','XFER','SPANIS') and (scenario<>'asia' or requested_value in ('XFER','SPANIS'));
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
revoke all on function public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text) from public,anon,authenticated;
grant execute on function public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text) to service_role;
notify pgrst,'reload schema';
commit;
