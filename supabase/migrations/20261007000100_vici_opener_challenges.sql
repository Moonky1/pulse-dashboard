-- SIM-1 follow-up. Apply only to the explicitly approved Preview checkpoint.
-- Keep canonical Training attempts/results; no identity or business-data changes.
create table public.training_vici_challenges (
  content_id uuid primary key references public.training_content(id) on delete cascade,
  scenario text not null check (scenario in ('callback','asia'))
);
alter table public.training_vici_challenges enable row level security;
revoke all on public.training_vici_challenges from public,anon,authenticated,service_role;
alter table public.training_simulation_attempts add column selection_mode text not null default 'chosen'
  check (selection_mode in ('chosen','assigned'));

create function pulse_private.active_simulation_opener(requested_agent_id uuid)
returns boolean language sql stable security definer set search_path=pg_catalog as $fn$
  select auth.role()='service_role' and exists (
    select 1 from public.agents a join public.teams t on t.id=a.team_id and t.is_active
    join public.operating_units u on u.id=t.operating_unit_id and u.is_active and u.code='openers'
    join public.campaigns c on c.id=t.campaign_id and c.is_active and u.campaign_id=c.id
    where a.id=requested_agent_id and a.status='active' and a.operating_unit_id=u.id)
$fn$;

-- Reuse the reviewed engine internally, with the new boundary checked on EVERY call.
do $clone$
declare signature text; original text; replacement text;
begin
  foreach signature in array array[
    'pulse_private.simulation_learner(uuid,uuid,boolean)',
    'pulse_private.simulation_snapshot(uuid,uuid)',
    'pulse_private.start_simulation(uuid,uuid,boolean)',
    'pulse_private.simulation_action(uuid,uuid,uuid,integer,uuid,text,jsonb)',
    'public.get_simulation_authoring(uuid)',
    'pulse_private.list_simulations(uuid,integer,integer)',
    'pulse_private.simulation_history(uuid,integer)'] loop
    original:=pg_get_functiondef(signature::regprocedure);
    replacement:=replace(original,split_part(signature,'(',1)||'(',split_part(signature,'(',1)||'_foundation(');
    execute replacement;
  end loop;
end $clone$;

create or replace function pulse_private.simulation_learner(requested_agent_id uuid,requested_content_id uuid,create_link boolean default false)
returns uuid language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then
    raise exception 'Active Opener access required; Staff uses an unrecorded author preview' using errcode='42501';
  end if;
  return pulse_private.simulation_learner_foundation(requested_agent_id,requested_content_id,create_link);
end $fn$;

create function pulse_private.guard_vici_challenge()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if not exists(select 1 from public.training_content where id=coalesce(new.content_id,old.content_id)
    and content_type='simulation' and status='draft') then
    raise exception 'only a simulation draft can change its challenge' using errcode='55000';
  end if;
  return coalesce(new,old);
end $fn$;
create trigger vici_challenge_draft_guard before insert or update or delete on public.training_vici_challenges
  for each row execute function pulse_private.guard_vici_challenge();

create function public.configure_vici_challenge(requested_content_id uuid,requested_scenario text,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; actor uuid;
begin
  select * into item from public.training_content where id=requested_content_id for update;
  actor:=pulse_private.require_training_content_permission('studio.create',requested_content_id);
  if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then
    raise exception 'simulation draft required' using errcode='55000'; end if;
  if item.created_by_user_id<>actor and not pulse_private.has_training_content_permission('academy.manage',item.id) then
    raise exception 'draft owner or manager required' using errcode='42501'; end if;
  if expected_updated_at is null or item.updated_at is distinct from expected_updated_at then
    raise exception 'draft changed' using errcode='40001'; end if;
  if requested_scenario is null or requested_scenario not in ('callback','asia') then
    raise exception 'source-backed VICI scenario required' using errcode='22023'; end if;
  insert into public.training_vici_challenges values(item.id,requested_scenario)
    on conflict(content_id) do update set scenario=excluded.scenario;
  update public.training_content set updated_at=clock_timestamp() where id=item.id returning * into item;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor,'training_content',item.id,'training.vici_challenge_configured','database',jsonb_build_object('scenario',requested_scenario));
  return jsonb_build_object('id',item.id,'updated_at',item.updated_at,'scenario',requested_scenario);
end $fn$;

create or replace function public.get_simulation_authoring(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $fn$
begin
  return public.get_simulation_authoring_foundation(requested_content_id)||jsonb_build_object('scenario',
    (select scenario from public.training_vici_challenges where content_id=requested_content_id));
end $fn$;

create function pulse_private.validate_vici_publication()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
declare scenario text; actual text[]; kinds text[];
begin
  if new.content_type<>'simulation' or new.status<>'published' or old.status='published' then return new; end if;
  select v.scenario into scenario from public.training_vici_challenges v where v.content_id=new.id;
  if scenario is null then raise exception 'choose a supported manual VICI challenge before publishing' using errcode='22023'; end if;
  if exists(select 1 from public.training_content_position_targets where content_id=new.id) then
    raise exception 'VICI challenges use Opener teams, not optional position targets' using errcode='22023'; end if;
  -- These source-backed procedures have different regional policies. Never publish globally.
  if not exists(select 1 from public.training_content_audiences a
    join public.teams t on t.id=a.team_id and t.is_active
    join public.operating_units u on u.id=t.operating_unit_id and u.is_active and u.code='openers'
    join public.campaigns c on c.id=t.campaign_id and c.is_active and u.campaign_id=c.id
    where a.content_id=new.id and a.scope_type='team' and
      (scenario='asia' and t.code in ('asia_team_a','asia_team_b') or
       scenario='callback' and t.code in ('mexico_team_group_a','mexico_team_group_b')))
    or exists(select 1 from public.training_content_audiences a left join public.teams t on t.id=a.team_id
      where a.content_id=new.id and (a.scope_type<>'team' or t.id is null or
        scenario='asia' and t.code not in ('asia_team_a','asia_team_b') or
        scenario='callback' and t.code not in ('mexico_team_group_a','mexico_team_group_b'))) then
    raise exception 'use the source-backed Asia or Mexico Opener team for this challenge' using errcode='22023'; end if;
  select array_agg(expected_value order by position),array_agg(interaction order by position) into actual,kinds
    from public.training_simulation_steps where content_id=new.id;
  if scenario='callback' and (actual is distinct from array[null,'callbacks','logo','manual','2025550147','dial']::text[]
    or kinds is distinct from array['info','click','click','click','text','click']::text[])
    or scenario='asia' and (actual is distinct from array[null,'presets','Spanish','local','SPANISH SPEAKER']::text[]
    or kinds is distinct from array['info','click','select','click','select']::text[])
    or exists(select 1 from public.training_simulation_steps where content_id=new.id and branches<>'{}'::jsonb) then
    raise exception 'manual VICI challenge must keep the reviewed workflow; feedback and hints may be edited' using errcode='22023'; end if;
  return new;
end $fn$;
create trigger vici_publication_guard before update of status on public.training_content
  for each row execute function pulse_private.validate_vici_publication();
create function pulse_private.clone_vici_revision()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if new.content_type='simulation' and new.version_number>1 then
    insert into public.training_vici_challenges(content_id,scenario)
      select new.id,v.scenario from public.training_vici_challenges v join public.training_content c on c.id=v.content_id
      where c.game_id=new.game_id and c.is_current and c.status='published';
  end if;
  return new;
end $fn$;
create trigger vici_revision_clone after insert on public.training_content for each row execute function pulse_private.clone_vici_revision();

create or replace function pulse_private.simulation_snapshot(requested_attempt_id uuid,requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; scenario text; phase text; position integer;
begin
  snap:=pulse_private.simulation_snapshot_foundation(requested_attempt_id,requested_agent_id);
  select v.scenario into scenario from public.training_vici_challenges v where v.content_id=(snap->>'content_id')::uuid;
  if scenario is null then return snap; end if; -- Preserve resume for pre-checkpoint Opener attempts.
  position:=(snap->>'position')::integer;
  phase:=case when scenario='callback' then (array['paused','paused','callback','home','manual','manual'])[position]
    else (array['live','live','presets','spanish','disposition'])[position] end;
  return (snap-'step'-'position')||jsonb_build_object('challenge',jsonb_build_object('scenario',scenario,
    'goal',case when scenario='callback' then 'Make a callback to Taylor Example at 2025550147. The dialer is paused.'
      else 'A Spanish-speaking customer reaches your Asia line. Advise them of the transfer and route them to a Spanish-speaking representative.' end,
    'selection_mode',(select selection_mode from public.training_simulation_attempts where attempt_id=requested_attempt_id)),
    'dialer',jsonb_build_object('phase',phase),'hint',snap->'step'->'hint');
end $fn$;

create or replace function pulse_private.start_simulation(requested_content_id uuid,requested_agent_id uuid,requested_restart boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; step public.training_simulation_steps%rowtype;
begin
  perform pulse_private.simulation_learner(requested_agent_id,requested_content_id);
  if not exists(select 1 from public.training_vici_challenges where content_id=requested_content_id) then
    raise exception 'manual challenge is not configured for this item' using errcode='55000'; end if;
  snap:=pulse_private.start_simulation_foundation(requested_content_id,requested_agent_id,requested_restart);
  select s.* into step from public.training_simulation_steps s join public.training_simulation_attempts a
    on a.current_position=s.position where a.attempt_id=(snap->>'attempt_id')::uuid and s.content_id=requested_content_id;
  if snap->>'status'='started' and step.position=1 and step.interaction='info' then
    -- Setup is not a learner action. No Continue button or automatic answer prompt.
    snap:=pulse_private.simulation_action_foundation((snap->>'attempt_id')::uuid,requested_agent_id,step.id,
      (snap->>'state_version')::integer,gen_random_uuid(),'answer','"continue"'::jsonb);
  end if;
  return snap-'feedback'-'correct';
end $fn$;

create or replace function pulse_private.simulation_action(requested_attempt_id uuid,requested_agent_id uuid,
  requested_step_id uuid,expected_state_version integer,requested_request_id uuid,requested_kind text,requested_value jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  perform pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
  if exists(select 1 from public.training_attempts a join public.training_vici_challenges v on v.content_id=a.content_id where a.id=requested_attempt_id) then
    raise exception 'use the manual dialer command contract' using errcode='42501'; end if;
  return pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,requested_step_id,
    expected_state_version,requested_request_id,requested_kind,requested_value);
end $fn$;

create function public.agent_submit_vici_command(requested_agent_id uuid,requested_attempt_id uuid,expected_state_version integer,
  requested_request_id uuid,requested_command text,requested_value text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; state public.training_simulation_attempts%rowtype; step public.training_simulation_steps%rowtype;
  scenario text; answer text; result jsonb; second_request uuid;
begin
  if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
  if requested_request_id is null or expected_state_version is null or requested_command is null
    or requested_command not in ('hint','callbacks','break','lunch','logo','manual','fast','log','dial','preview','back',
      'presets','language','local','disposition','blind','hangup','leave','both','park')
    or length(coalesce(requested_value,''))>100 then raise exception 'bounded VICI command required' using errcode='22023'; end if;
  perform 1 from public.training_attempts where id=requested_attempt_id for update;
  snap:=pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
  select v.scenario into scenario from public.training_vici_challenges v where v.content_id=(snap->>'content_id')::uuid;
  if scenario is null then raise exception 'manual challenge required' using errcode='55000'; end if;
  if exists(select 1 from public.training_simulation_events where attempt_id=requested_attempt_id and request_id=requested_request_id) then
    return snap||jsonb_build_object('duplicate',true); end if;
  select * into state from public.training_simulation_attempts where attempt_id=requested_attempt_id;
  if snap->>'status'<>'started' or state.state_version<>expected_state_version then raise exception 'dialer state changed' using errcode='40001'; end if;
  select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=state.current_position;
  answer:=case when requested_command='language' and step.interaction='select' and scenario='asia' and step.position=3 then requested_value
    when requested_command='disposition' and step.interaction='select' and scenario='asia' and step.position=5 then requested_value
    when requested_command='dial' and step.interaction='text' and scenario='callback' and step.position=5 then requested_value
    when step.interaction='click' then requested_command else '__wrong_control__' end;
  result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,state.state_version,
    requested_request_id,case when requested_command='hint' then 'hint' else 'answer' end,to_jsonb(answer));
  if scenario='callback' and step.position=5 and requested_command='dial' and result->>'correct'='true' then
    -- Phone Number + Dial Now is one atomic manual command, never a separate Confirm Entry step.
    second_request:=md5(requested_request_id::text||':dial-now')::uuid;
    select * into step from public.training_simulation_steps where content_id=(snap->>'content_id')::uuid and position=6;
    result:=pulse_private.simulation_action_foundation(requested_attempt_id,requested_agent_id,step.id,(result->>'state_version')::integer,
      second_request,'answer','"dial"'::jsonb);
  end if;
  return result-'feedback'||jsonb_build_object('feedback',case when requested_command='hint' then result->>'hint'
    when result->>'correct'='true' then 'Dialer updated.' else 'That action does not complete the required workflow. You can try again or request a hint.' end);
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
    where c.status='published' and c.is_current and c.content_type='simulation' and audience.scope_type='team'
    order by c.title,c.id limit requested_limit offset requested_offset
  ) eligible;
  return items;
end $fn$;

create function public.agent_assign_vici_challenge(requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item uuid; snap jsonb;
begin
  if not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then raise exception 'active Opener required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('vici-assigned:'||requested_agent_id::text,0));
  select c.id into item from public.training_content c join public.training_vici_challenges v on v.content_id=c.id
    join public.training_content_audiences audience on audience.content_id=c.id
    join public.agents a on a.id=requested_agent_id and audience.team_id=a.team_id
    where c.status='published' and c.is_current and c.content_type='simulation' and audience.scope_type='team' order by random() limit 1;
  if item is null then raise exception 'no published manual challenges for your team yet' using errcode='P0002'; end if;
  snap:=pulse_private.start_simulation(item,requested_agent_id,false);
  update public.training_simulation_attempts set selection_mode='assigned' where attempt_id=(snap->>'attempt_id')::uuid;
  return pulse_private.simulation_snapshot((snap->>'attempt_id')::uuid,requested_agent_id);
end $fn$;

create or replace function pulse_private.simulation_history(requested_agent_id uuid,requested_limit integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if requested_agent_id is not null and not coalesce(pulse_private.active_simulation_opener(requested_agent_id),false) then
    raise exception 'active Opener required' using errcode='42501'; end if;
  -- Historical Staff results are preserved read-only; new Staff starts/actions are denied above.
  return pulse_private.simulation_history_foundation(requested_agent_id,requested_limit);
end $fn$;

do $grants$
declare f record;
begin
  for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','pulse_private') and (proname like '%vici%' or proname like '%simulation%foundation' or proname='active_simulation_opener') loop
    execute 'alter function '||f.signature||' owner to postgres';
    execute 'revoke all on function '||f.signature||' from public,anon,authenticated,service_role';
    if f.nspname='public' and f.proname in ('agent_submit_vici_command','agent_assign_vici_challenge') then
      execute 'grant execute on function '||f.signature||' to service_role';
    elsif f.nspname='public' and f.proname='configure_vici_challenge' then
      execute 'grant execute on function '||f.signature||' to authenticated';
    end if;
  end loop;
end $grants$;
