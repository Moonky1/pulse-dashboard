-- SIM-1. Additive, Preview first. No fixtures, roles or business-data writes.
-- Canonical Training identities/versions/results; no browser table privileges.
begin;
-- Refuse an unexpected score contract instead of replacing unrelated work.
do $preflight$
begin
  if md5(replace(pg_get_functiondef('pulse_private.validate_training_result()'::regprocedure),chr(13),''))<>'936e9138f34091783715de98a9ec1233' then
    raise exception 'unexpected canonical result contract; review before applying' using errcode='55000'; end if;
end $preflight$;

alter table public.training_content drop constraint training_content_type_valid;
alter table public.training_content add constraint training_content_type_valid
  check(content_type in ('lesson','quiz','assessment','simulation'));
alter table public.training_attempts drop constraint training_attempts_source_valid;
alter table public.training_attempts add constraint training_attempts_source_valid
  check(source_mode in ('academy','go_practice','go_hosted','assessment','simulation'));
alter table public.training_media drop constraint training_media_kind_valid;
alter table public.training_media add constraint training_media_kind_valid check
  (media_kind in ('game_cover','question_image','question_audio','lobby_audio','simulation_screen') or status='legacy');
alter table public.training_media drop constraint training_media_kind_mime;
alter table public.training_media add constraint training_media_kind_mime check(status='legacy' or
  (media_kind in ('game_cover','question_image','simulation_screen') and mime_type in ('image/jpeg','image/png','image/webp')) or
  (media_kind in ('question_audio','lobby_audio') and mime_type in ('audio/mpeg','audio/mp4','audio/wav')));

create table public.training_simulation_steps (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.training_content(id) on delete restrict,
  position integer not null check(position between 1 and 100),
  interaction text not null check(interaction in ('click','choice','text','select','action','info')),
  prompt text not null check(length(btrim(prompt)) between 2 and 2000),
  hint text not null check(length(btrim(hint)) between 2 and 1000),
  success_feedback text not null check(length(btrim(success_feedback)) between 2 and 1000),
  retry_feedback text not null check(length(btrim(retry_feedback)) between 2 and 1000),
  screen_media_id uuid references public.training_media(id) on delete restrict,
  regions jsonb not null default '[]' check(jsonb_typeof(regions)='array'),
  options jsonb not null default '[]' check(jsonb_typeof(options)='array'),
  expected_value text,
  -- Forward-only branches: value -> later position. Absent = next sequential step.
  branches jsonb not null default '{}' check(jsonb_typeof(branches)='object'),
  source_note text not null check(length(btrim(source_note)) between 2 and 500),
  unique(content_id,position)
);
create table public.training_simulation_attempts (
  attempt_id uuid primary key references public.training_attempts(id) on delete restrict,
  current_position integer not null default 1 check(current_position between 1 and 101),
  state_version integer not null default 1 check(state_version>0),
  mistakes integer not null default 0 check(mistakes between 0 and 10000),
  hints integer not null default 0 check(hints between 0 and 100),
  hint_positions integer[] not null default '{}',
  completed_positions integer[] not null default '{}',
  first_pass_positions integer[] not null default '{}',
  step_entered_at timestamptz not null default clock_timestamp(),
  step_mistakes integer not null default 0 check(step_mistakes>=0)
);
create table public.training_simulation_events (
  attempt_id uuid not null references public.training_simulation_attempts(attempt_id) on delete restrict,
  request_id uuid not null,
  step_id uuid not null references public.training_simulation_steps(id) on delete restrict,
  event_kind text not null check(event_kind in ('hint','correct','incorrect')),
  duration_ms bigint not null check(duration_ms>=0),
  occurred_at timestamptz not null default clock_timestamp(),
  primary key(attempt_id,request_id)
  -- Deliberately no submitted text, phone numbers or screenshot coordinates.
);
-- Keep the existing quiz score/count invariant unchanged. Simulation score is
-- checked against protected server state, never a client-supplied percentage.
create or replace function pulse_private.validate_training_result()
returns trigger language plpgsql set search_path=pg_catalog as $fn$
declare expected_score numeric(5,2); attempt_mode text; sim public.training_simulation_attempts%rowtype;
begin
  select source_mode into attempt_mode from public.training_attempts where id=new.attempt_id and status='completed';
  if not found then raise exception 'training results require a completed attempt'; end if;
  if attempt_mode='simulation' then
    select * into sim from public.training_simulation_attempts where attempt_id=new.attempt_id;
    if not found or new.total_questions<>cardinality(sim.completed_positions)
      or new.correct_answers<>cardinality(sim.first_pass_positions) or new.total_questions<1 then
      raise exception 'simulation result must match completed server steps'; end if;
    expected_score:=greatest(0,100-5*sim.mistakes-10*sim.hints);
  else
    expected_score:=case when new.total_questions=0 then 0
      else round(new.correct_answers::numeric*100/new.total_questions,2) end;
  end if;
  if new.score_percent<>expected_score then
    raise exception 'training result score does not match correct and total question counts'; end if;
  return new;
end $fn$;
alter table public.training_simulation_steps enable row level security;
alter table public.training_simulation_attempts enable row level security;
alter table public.training_simulation_events enable row level security;
revoke all on public.training_simulation_steps,public.training_simulation_attempts,public.training_simulation_events
  from public,anon,authenticated,service_role;

create function pulse_private.guard_simulation_step()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; media public.training_media%rowtype;
  region jsonb; option_value jsonb; branch record; source_game uuid;
begin
  select * into item from public.training_content where id=case when tg_op='DELETE' then old.content_id else new.content_id end for share;
  if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then
    raise exception 'simulation steps require an editable simulation draft' using errcode='55000'; end if;
  if tg_op='DELETE' then return old; end if;
  if tg_op='UPDATE' and new.content_id<>old.content_id then
    raise exception 'step identity is immutable' using errcode='55000'; end if;
  if new.screen_media_id is not null then
    select * into media from public.training_media where id=new.screen_media_id for share;
    select game_id into source_game from public.training_content where id=media.bound_content_id;
    if media.status is distinct from 'ready' or media.media_kind is distinct from 'simulation_screen'
      or source_game is distinct from item.game_id then
      raise exception 'ready private simulation screenshot required' using errcode='23514'; end if;
  end if;
  if jsonb_array_length(new.regions)>20 or jsonb_array_length(new.options)>12 or
    length(coalesce(new.expected_value,''))>500 or octet_length(new.branches::text)>4000 then
    raise exception 'bounded simulation definition required' using errcode='22023'; end if;
  for region in select value from jsonb_array_elements(new.regions) loop
    if jsonb_typeof(region)<>'object' or coalesce(region->>'id','') !~ '^[a-z][a-z0-9_-]{0,39}$'
      or length(coalesce(region->>'label','')) not between 1 and 120
      or not (region ?& array['x','y','w','h']) then
      raise exception 'invalid normalized hotspot' using errcode='22023'; end if;
    if jsonb_typeof(region->'x')<>'number' or jsonb_typeof(region->'y')<>'number'
      or jsonb_typeof(region->'w')<>'number' or jsonb_typeof(region->'h')<>'number'
      or (region->>'x')::numeric<0 or (region->>'y')::numeric<0
      or (region->>'w')::numeric<=0 or (region->>'h')::numeric<=0
      or (region->>'x')::numeric+(region->>'w')::numeric>1
      or (region->>'y')::numeric+(region->>'h')::numeric>1 then
      raise exception 'invalid normalized hotspot' using errcode='22023'; end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(new.regions))<>jsonb_array_length(new.regions) then
    raise exception 'duplicate hotspot identities' using errcode='22023'; end if;
  for option_value in select value from jsonb_array_elements(new.options) loop
    if jsonb_typeof(option_value)<>'string' or length(option_value #>> '{}') not between 1 and 200 then
      raise exception 'invalid simulation option' using errcode='22023'; end if;
  end loop;
  if (select count(distinct value) from jsonb_array_elements(new.options))<>jsonb_array_length(new.options) then
    raise exception 'duplicate options' using errcode='22023'; end if;
  if new.interaction='click' and not exists(select 1 from jsonb_array_elements(new.regions) r where r->>'id'=new.expected_value)
    or new.interaction in ('choice','select') and not coalesce(new.options ? new.expected_value,false)
    or new.interaction in ('text','action') and length(btrim(coalesce(new.expected_value,'')))=0 then
    raise exception 'valid expected action required' using errcode='22023'; end if;
  for branch in select * from jsonb_each(new.branches) loop
    if new.interaction not in ('choice','select') or not (new.options ? branch.key)
      or branch.value::text !~ '^[0-9]{1,3}$' or branch.value::text::integer<=new.position
      or branch.value::text::integer>100 then
      raise exception 'branches must target a later option step' using errcode='22023'; end if;
  end loop;
  return new;
end $fn$;
create trigger simulation_step_guard before insert or update or delete on public.training_simulation_steps
  for each row execute function pulse_private.guard_simulation_step();

create function pulse_private.validate_simulation_publication()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
declare step_count integer;
begin
  if new.content_type='simulation' and new.status='published' and old.status='draft' then
    select count(*) into step_count from public.training_simulation_steps where content_id=new.id;
    if step_count not between 1 and 100 or exists (
      select 1 from public.training_simulation_steps s where s.content_id=new.id
        and (s.position>step_count or (s.interaction<>'info' and s.screen_media_id is null)
          or exists(select 1 from jsonb_each(s.branches) b where (b.value::text)::integer>step_count))
    ) then raise exception 'complete source-grounded simulation and private screens required' using errcode='22023'; end if;
  end if;
  return new;
end $fn$;
create trigger simulation_publish_guard before update on public.training_content
  for each row execute function pulse_private.validate_simulation_publication();

-- Existing revision RPC holds the family lock. Clone in the same transaction.
create function pulse_private.clone_simulation_revision()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if new.content_type='simulation' and new.version_number>1 then
    insert into public.training_simulation_steps(content_id,position,interaction,prompt,hint,
      success_feedback,retry_feedback,screen_media_id,regions,options,expected_value,branches,source_note)
    select new.id,s.position,s.interaction,s.prompt,s.hint,s.success_feedback,s.retry_feedback,
      s.screen_media_id,s.regions,s.options,s.expected_value,s.branches,s.source_note
    from public.training_simulation_steps s join public.training_content c on c.id=s.content_id
    where c.game_id=new.game_id and c.is_current and c.status='published';
  end if;
  return new;
end $fn$;
create trigger simulation_clone_revision after insert on public.training_content
  for each row execute function pulse_private.clone_simulation_revision();

create function public.create_simulation_draft(requested_title text,requested_description text,
  requested_language text,requested_topic_ids uuid[],requested_scope_type text,
  requested_campaign_id uuid default null,requested_team_id uuid default null,
  requested_position_ids uuid[] default '{}')
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare actor uuid; item public.training_content%rowtype;
begin
  actor:=pulse_private.require_training_target_permission('studio.create',requested_scope_type,requested_campaign_id,requested_team_id);
  if requested_language is null or requested_language not in ('en','es')
    or length(btrim(coalesce(requested_title,''))) not between 2 and 180
    or length(coalesce(requested_description,''))>2000
    or coalesce(cardinality(requested_topic_ids),0) not between 1 and 50
    or cardinality(coalesce(requested_position_ids,'{}'))>50
    or exists(select 1 from unnest(requested_topic_ids) target(id) where not exists(select 1 from public.training_topics t where t.id=target.id and t.is_active))
    or exists(select 1 from unnest(requested_position_ids) target(id) where not exists(select 1 from public.positions p where p.id=target.id and p.is_active)) then
    raise exception 'invalid simulation metadata or canonical targets' using errcode='22023'; end if;
  if requested_scope_type='campaign' and not exists(select 1 from public.campaigns where id=requested_campaign_id and is_active)
    or requested_scope_type='team' and not exists(select 1 from public.teams where id=requested_team_id and is_active and campaign_id is not null) then
    raise exception 'active canonical audience required' using errcode='22023'; end if;
  insert into public.training_content(content_type,title,description,language,created_by_user_id)
    values('simulation',btrim(requested_title),nullif(btrim(requested_description),''),requested_language,actor) returning * into item;
  insert into public.training_content_topics(content_id,topic_id) select item.id,id from (select distinct unnest(requested_topic_ids) id) t;
  insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id)
    values(item.id,requested_scope_type,requested_campaign_id,requested_team_id);
  insert into public.training_content_position_targets(content_id,position_id)
    select item.id,id from (select distinct unnest(coalesce(requested_position_ids,'{}')) id) t;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor,'training_content',item.id,'training.content_created','database',jsonb_build_object('content_type','simulation'));
  return jsonb_build_object('id',item.id,'updated_at',item.updated_at,'status',item.status);
end $fn$;

create function public.replace_simulation_steps(requested_content_id uuid,requested_steps jsonb,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; actor uuid; step jsonb; p integer:=0;
begin
  select * into item from public.training_content where id=requested_content_id for update;
  actor:=pulse_private.require_training_content_permission('studio.create',requested_content_id);
  if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then
    raise exception 'editable simulation required' using errcode='55000'; end if;
  if item.created_by_user_id<>actor and not pulse_private.has_training_content_permission('academy.manage',item.id) then
    raise exception 'draft owner or manager required' using errcode='42501'; end if;
  if item.updated_at is distinct from expected_updated_at or expected_updated_at is null then
    raise exception 'draft changed' using errcode='40001'; end if;
  if jsonb_typeof(requested_steps) is distinct from 'array' or jsonb_array_length(requested_steps) not between 1 and 100
    or octet_length(requested_steps::text)>200000 then raise exception 'bounded step array required' using errcode='22023'; end if;
  delete from public.training_simulation_steps where content_id=item.id;
  for step in select value from jsonb_array_elements(requested_steps) loop
    p:=p+1;
    insert into public.training_simulation_steps(content_id,position,interaction,prompt,hint,success_feedback,
      retry_feedback,screen_media_id,regions,options,expected_value,branches,source_note)
    values(item.id,p,step->>'interaction',step->>'prompt',step->>'hint',step->>'success_feedback',
      step->>'retry_feedback',nullif(step->>'screen_media_id','')::uuid,
      coalesce(step->'regions','[]'),coalesce(step->'options','[]'),step->>'expected_value',
      coalesce(step->'branches','{}'),step->>'source_note');
  end loop;
  update public.training_content set updated_at=clock_timestamp() where id=item.id returning * into item;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor,'training_content',item.id,'training.simulation_steps_updated','database',jsonb_build_object('step_count',p));
  return jsonb_build_object('id',item.id,'updated_at',item.updated_at,'step_count',p);
end $fn$;

create function public.get_simulation_authoring(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $fn$
begin
  if not pulse_private.can_read_training_authoring(requested_content_id) then
    raise exception 'simulation unavailable' using errcode='P0002'; end if;
  return (select jsonb_build_object('id',c.id,'title',c.title,'status',c.status,'version_number',c.version_number,
    'updated_at',c.updated_at,'steps',coalesce((select jsonb_agg(to_jsonb(s) order by s.position)
      from public.training_simulation_steps s where s.content_id=c.id),'[]'))
    from public.training_content c where c.id=requested_content_id and c.content_type='simulation');
end $fn$;

-- Learner reads never fall back to Studio permission. Revocation and targeting
-- are rechecked on every call. Agent ID comes only from the trusted cookie API.
create function pulse_private.simulation_learner(requested_agent_id uuid,requested_content_id uuid,create_link boolean default false)
returns uuid language plpgsql security definer set search_path=pg_catalog as $fn$
declare learner uuid; staff uuid;
begin
  if requested_agent_id is null then
    staff:=pulse_private.current_training_staff_user_id();
    if not pulse_private.has_training_learner_content_permission('academy.view',requested_content_id,staff) then
      raise exception 'Academy access required' using errcode='42501'; end if;
    if create_link then perform pg_advisory_xact_lock(hashtextextended('sim-staff:'||staff::text,0)); end if;
    select learner_id into learner from public.training_staff_learner_links where staff_user_id=staff;
    if learner is null and create_link then
      insert into public.training_learners(learner_kind) values('staff') returning id into learner;
      insert into public.training_staff_learner_links(learner_id,staff_user_id) values(learner,staff);
    end if;
  else
    if auth.role() is distinct from 'service_role' then raise exception 'trusted Agent server required' using errcode='42501'; end if;
    if not exists(select 1 from public.agents a join public.teams t on t.id=a.team_id and t.is_active
      join public.campaigns cp on cp.id=t.campaign_id and cp.is_active
      join public.training_content c on c.id=requested_content_id and c.content_type='simulation' and c.status='published'
      join public.training_content_audiences audience on audience.content_id=c.id
      where a.id=requested_agent_id and a.status='active'
        and (audience.scope_type='global' or audience.team_id=t.id or audience.campaign_id=t.campaign_id)
        and (not exists(select 1 from public.training_content_position_targets p where p.content_id=c.id)
          or exists(select 1 from public.training_content_position_targets p join public.positions pos on pos.id=p.position_id and pos.is_active
            where p.content_id=c.id and p.position_id=a.position_id))) then
      raise exception 'Agent simulation access required' using errcode='42501'; end if;
    if create_link then perform pg_advisory_xact_lock(hashtextextended('sim-agent:'||requested_agent_id::text,0)); end if;
    select learner_id into learner from public.training_agent_learner_links where agent_id=requested_agent_id;
    if learner is null and create_link then
      insert into public.training_learners(learner_kind) values('agent') returning id into learner;
      insert into public.training_agent_learner_links(learner_id,agent_id) values(learner,requested_agent_id);
    end if;
  end if;
  return learner;
end $fn$;

create function pulse_private.simulation_snapshot(requested_attempt_id uuid,requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare attempt public.training_attempts%rowtype; state public.training_simulation_attempts%rowtype; learner uuid;
begin
  select * into attempt from public.training_attempts where id=requested_attempt_id and source_mode='simulation';
  if not found then raise exception 'attempt unavailable' using errcode='P0002'; end if;
  learner:=pulse_private.simulation_learner(requested_agent_id,attempt.content_id);
  if learner is distinct from attempt.learner_id then raise exception 'own attempt required' using errcode='42501'; end if;
  select * into state from public.training_simulation_attempts where attempt_id=attempt.id;
  return (select jsonb_build_object('attempt_id',attempt.id,'content_id',c.id,'title',c.title,
    'version_number',c.version_number,'status',attempt.status,'state_version',state.state_version,
    'position',state.current_position,'step_count',(select count(*) from public.training_simulation_steps where content_id=c.id),
    'completed_steps',cardinality(state.completed_positions),'mistakes',state.mistakes,'hints',state.hints,
    'started_at',attempt.started_at,'duration_seconds',attempt.duration_seconds,
    'result',(select jsonb_build_object('score_percent',r.score_percent,'first_pass_steps',r.correct_answers,'completed_steps',r.total_questions)
      from public.training_results r where r.attempt_id=attempt.id),
    'step',case when attempt.status='started' then (select jsonb_build_object('id',s.id,'interaction',s.interaction,
      'prompt',s.prompt,'screen_media_id',s.screen_media_id,'regions',s.regions,'options',s.options,
      'hint',case when s.position=any(state.hint_positions) then s.hint else null end)
      from public.training_simulation_steps s where s.content_id=c.id and s.position=state.current_position) else null end)
    from public.training_content c where c.id=attempt.content_id);
end $fn$;

create function pulse_private.start_simulation(requested_content_id uuid,requested_agent_id uuid,requested_restart boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare learner uuid; item public.training_content%rowtype; attempt public.training_attempts%rowtype; n integer;
begin
  if requested_restart is null then raise exception 'restart choice required' using errcode='22023'; end if;
  select * into item from public.training_content where id=requested_content_id and content_type='simulation' and status='published' for share;
  if not found then raise exception 'published simulation unavailable' using errcode='P0002'; end if;
  learner:=pulse_private.simulation_learner(requested_agent_id,item.id,true);
  perform pg_advisory_xact_lock(hashtextextended('sim-attempt:'||learner::text||':'||item.id::text,0));
  select * into attempt from public.training_attempts where learner_id=learner and content_id=item.id
    and source_mode='simulation' and status='started' order by attempt_number desc limit 1 for update;
  if found and not requested_restart then return pulse_private.simulation_snapshot(attempt.id,requested_agent_id); end if;
  if not item.is_current then raise exception 'new attempts require current version' using errcode='55000'; end if;
  if attempt.id is not null then update public.training_attempts set status='abandoned',completed_at=clock_timestamp(),
    duration_seconds=greatest(0,floor(extract(epoch from clock_timestamp()-started_at))::integer) where id=attempt.id; end if;
  select coalesce(max(attempt_number),0)+1 into n from public.training_attempts
    where learner_id=learner and content_id=item.id and source_mode='simulation';
  insert into public.training_attempts(learner_id,content_id,source_mode,attempt_number,language)
    values(learner,item.id,'simulation',n,item.language) returning * into attempt;
  insert into public.training_simulation_attempts(attempt_id) values(attempt.id);
  return pulse_private.simulation_snapshot(attempt.id,requested_agent_id);
end $fn$;

create function pulse_private.simulation_action(requested_attempt_id uuid,requested_agent_id uuid,
  requested_step_id uuid,expected_state_version integer,requested_request_id uuid,requested_kind text,requested_value jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare attempt public.training_attempts%rowtype; state public.training_simulation_attempts%rowtype;
  step public.training_simulation_steps%rowtype; learner uuid; correct boolean:=false;
  next_position integer; value_text text; region jsonb; event text; feedback text; result jsonb; finished boolean:=false;
begin
  if requested_request_id is null or requested_step_id is null or expected_state_version is null
    or requested_kind is null or requested_kind not in ('hint','answer') or coalesce(octet_length(requested_value::text),0)>2000 then
    raise exception 'bounded simulation action required' using errcode='22023'; end if;
  select * into attempt from public.training_attempts where id=requested_attempt_id and source_mode='simulation' for update;
  if not found then raise exception 'attempt unavailable' using errcode='P0002'; end if;
  learner:=pulse_private.simulation_learner(requested_agent_id,attempt.content_id);
  if learner is distinct from attempt.learner_id then raise exception 'own attempt required' using errcode='42501'; end if;
  if exists(select 1 from public.training_simulation_events where attempt_id=attempt.id and request_id=requested_request_id) then
    return pulse_private.simulation_snapshot(attempt.id,requested_agent_id)||jsonb_build_object('duplicate',true); end if;
  select * into state from public.training_simulation_attempts where attempt_id=attempt.id for update;
  select * into step from public.training_simulation_steps where content_id=attempt.content_id and position=state.current_position;
  if attempt.status<>'started' or expected_state_version<>state.state_version or requested_step_id is distinct from step.id then
    raise exception 'simulation step changed' using errcode='40001'; end if;
  if requested_kind='hint' then
    event:='hint'; feedback:=step.hint;
    if not step.position=any(state.hint_positions) then state.hints:=state.hints+1; state.hint_positions:=array_append(state.hint_positions,step.position); end if;
  else
    value_text:=case when jsonb_typeof(requested_value)='string' then requested_value #>> '{}' else null end;
    if step.interaction='info' then correct:=requested_value='"continue"'::jsonb;
    elsif step.interaction='click' then
      select value into region from jsonb_array_elements(step.regions) where value->>'id'=step.expected_value;
      if jsonb_typeof(requested_value)='object' and jsonb_typeof(requested_value->'x')='number' and jsonb_typeof(requested_value->'y')='number' then
        correct:=(requested_value->>'x')::numeric between (region->>'x')::numeric and (region->>'x')::numeric+(region->>'w')::numeric
          and (requested_value->>'y')::numeric between (region->>'y')::numeric and (region->>'y')::numeric+(region->>'h')::numeric;
      else correct:=value_text=step.expected_value; end if; -- Keyboard target, same server action.
    else correct:=value_text=step.expected_value or (step.interaction in ('choice','select') and step.branches ? value_text); end if;
    correct:=coalesce(correct,false); event:=case when correct then 'correct' else 'incorrect' end;
    feedback:=case when correct then step.success_feedback else step.retry_feedback end;
    if correct then
      state.completed_positions:=array_append(state.completed_positions,step.position);
      if state.step_mistakes=0 and not step.position=any(state.hint_positions) then
        state.first_pass_positions:=array_append(state.first_pass_positions,step.position); end if;
      next_position:=coalesce((step.branches->>value_text)::integer,step.position+1);
      if exists(select 1 from public.training_simulation_steps where content_id=attempt.content_id and position=next_position) then
        state.current_position:=next_position;
      else
        update public.training_attempts set status='completed',completed_at=clock_timestamp(),
          duration_seconds=greatest(0,floor(extract(epoch from clock_timestamp()-started_at))::integer) where id=attempt.id;
        finished:=true;
      end if;
      state.step_mistakes:=0;
    else
      if state.mistakes>=10000 then raise exception 'attempt retry limit reached' using errcode='55000'; end if;
      state.mistakes:=state.mistakes+1; state.step_mistakes:=state.step_mistakes+1;
    end if;
  end if;
  insert into public.training_simulation_events(attempt_id,request_id,step_id,event_kind,duration_ms)
    values(attempt.id,requested_request_id,step.id,event,greatest(0,floor(extract(epoch from clock_timestamp()-state.step_entered_at)*1000)::bigint));
  update public.training_simulation_attempts set current_position=state.current_position,state_version=state_version+1,
    mistakes=state.mistakes,hints=state.hints,hint_positions=state.hint_positions,completed_positions=state.completed_positions,
    first_pass_positions=state.first_pass_positions,step_mistakes=state.step_mistakes,
    step_entered_at=case when correct then clock_timestamp() else state.step_entered_at end where attempt_id=attempt.id;
  if finished then
    insert into public.training_results(attempt_id,total_questions,correct_answers,score_percent,completed)
      values(attempt.id,cardinality(state.completed_positions),cardinality(state.first_pass_positions),greatest(0,100-5*state.mistakes-10*state.hints),true);
  end if;
  result:=pulse_private.simulation_snapshot(attempt.id,requested_agent_id);
  return result||jsonb_build_object('feedback',feedback,'correct',case when requested_kind='answer' then correct else null end);
end $fn$;

create function pulse_private.protect_simulation_screen()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if new.status is distinct from old.status and exists(select 1 from public.training_simulation_steps where screen_media_id=old.id) then
    raise exception 'referenced simulation screen cannot be removed' using errcode='55000'; end if;
  return new;
end $fn$;
create trigger simulation_screen_reference_guard before update of status on public.training_media
  for each row execute function pulse_private.protect_simulation_screen();

create function pulse_private.can_read_simulation_screen(requested_agent_id uuid,requested_media_id uuid,
  requested_content_id uuid,requested_attempt_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
declare attempt public.training_attempts%rowtype; state public.training_simulation_attempts%rowtype; learner uuid;
begin
  if not exists(select 1 from public.training_media where id=requested_media_id and status='ready' and media_kind='simulation_screen') then return false; end if;
  if requested_agent_id is null and requested_attempt_id is null then
    return pulse_private.can_read_training_authoring(requested_content_id) and exists (
      select 1 from public.training_content c join public.training_content origin on c.game_id=origin.game_id
      join public.training_media m on m.bound_content_id=origin.id
      where c.id=requested_content_id and c.content_type='simulation' and m.id=requested_media_id
        and (c.status='draft' or exists(select 1 from public.training_simulation_steps where content_id=c.id and screen_media_id=m.id)));
  end if;
  select * into attempt from public.training_attempts where id=requested_attempt_id and content_id=requested_content_id
    and source_mode='simulation' and status='started';
  if not found then return false; end if;
  learner:=pulse_private.simulation_learner(requested_agent_id,requested_content_id);
  if learner is distinct from attempt.learner_id then return false; end if;
  select * into state from public.training_simulation_attempts where attempt_id=attempt.id;
  return exists(select 1 from public.training_simulation_steps where content_id=attempt.content_id
    and position=state.current_position and screen_media_id=requested_media_id);
end $fn$;

create function public.can_read_simulation_screen(requested_media_id uuid,requested_content_id uuid,requested_attempt_id uuid default null)
returns boolean language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.can_read_simulation_screen(null,requested_media_id,requested_content_id,requested_attempt_id) $fn$;
create function public.agent_can_read_simulation_screen(requested_agent_id uuid,requested_media_id uuid,requested_content_id uuid,requested_attempt_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if auth.role() is distinct from 'service_role' or requested_agent_id is null then
    raise exception 'trusted Agent server required' using errcode='42501'; end if;
  return pulse_private.can_read_simulation_screen(requested_agent_id,requested_media_id,requested_content_id,requested_attempt_id);
end $fn$;

create function pulse_private.list_simulations(requested_agent_id uuid,requested_limit integer,requested_offset integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item record; learner uuid; result jsonb:='[]'; visible_count integer:=0;
begin
  if requested_limit is null or requested_limit not between 1 and 100 or requested_offset is null or requested_offset not between 0 and 10000 then
    raise exception 'bounded simulation catalog required' using errcode='22023'; end if;
  if requested_agent_id is null then perform pulse_private.current_training_staff_user_id();
  elsif auth.role() is distinct from 'service_role' or not exists(select 1 from public.agents where id=requested_agent_id and status='active') then
    raise exception 'trusted active Agent required' using errcode='42501'; end if;
  for item in select id,title,description,language,version_number from public.training_content
    where content_type='simulation' and status='published' and is_current order by title,id loop
    begin learner:=pulse_private.simulation_learner(requested_agent_id,item.id);
    exception when insufficient_privilege then continue; end;
    visible_count:=visible_count+1;
    if visible_count<=requested_offset then continue; end if;
    result:=result||jsonb_build_array(to_jsonb(item)||jsonb_build_object('step_count',
      (select count(*) from public.training_simulation_steps where content_id=item.id),
      'latest_attempt',(select jsonb_build_object('id',a.id,'status',a.status,'started_at',a.started_at,
        'score_percent',(select score_percent from public.training_results where attempt_id=a.id))
        from public.training_attempts a where a.content_id=item.id and a.learner_id=learner
          and a.source_mode='simulation' order by a.attempt_number desc limit 1)));
    if jsonb_array_length(result)=requested_limit then exit; end if;
  end loop;
  return result;
end $fn$;
create function public.list_simulations(requested_limit integer default 50,requested_offset integer default 0)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.list_simulations(null,requested_limit,requested_offset) $fn$;
create function public.agent_list_simulations(requested_agent_id uuid,requested_limit integer default 50,requested_offset integer default 0)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if requested_agent_id is null then raise exception 'Agent identity required' using errcode='42501'; end if;
  return pulse_private.list_simulations(requested_agent_id,requested_limit,requested_offset);
end $fn$;

create function pulse_private.simulation_history(requested_agent_id uuid,requested_limit integer)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare learner uuid; staff uuid;
begin
  if requested_limit is null or requested_limit not between 1 and 100 then raise exception 'bounded history required' using errcode='22023'; end if;
  if requested_agent_id is null then
    staff:=pulse_private.current_training_staff_user_id();
    if not pulse_private.has_any_training_permission(array['academy.view','academy.manage']) then
      raise exception 'Academy access required' using errcode='42501'; end if;
    select learner_id into learner from public.training_staff_learner_links where staff_user_id=staff;
  else
    if auth.role() is distinct from 'service_role' or not exists(select 1 from public.agents a
      join public.teams t on t.id=a.team_id and t.is_active
      join public.campaigns c on c.id=t.campaign_id and c.is_active
      where a.id=requested_agent_id and a.status='active') then
      raise exception 'active trusted Agent required' using errcode='42501'; end if;
    select learner_id into learner from public.training_agent_learner_links where agent_id=requested_agent_id;
  end if;
  return coalesce((select jsonb_agg(to_jsonb(item) order by item.started_at desc,item.id) from (
    select a.id,a.content_id,c.title,c.version_number,a.status,a.attempt_number,a.started_at,a.duration_seconds,
      r.score_percent,s.mistakes,s.hints,cardinality(s.completed_positions) completed_steps
    from public.training_attempts a join public.training_content c on c.id=a.content_id
    join public.training_simulation_attempts s on s.attempt_id=a.id left join public.training_results r on r.attempt_id=a.id
    where a.learner_id=learner and a.source_mode='simulation' order by a.started_at desc,a.id limit requested_limit
  ) item),'[]');
end $fn$;
create function public.get_simulation_history(requested_limit integer default 50)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.simulation_history(null,requested_limit) $fn$;
create function public.agent_get_simulation_history(requested_agent_id uuid,requested_limit integer default 50)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
begin
  if requested_agent_id is null then raise exception 'Agent identity required' using errcode='42501'; end if;
  return pulse_private.simulation_history(requested_agent_id,requested_limit);
end $fn$;

create function public.start_simulation(requested_content_id uuid,requested_restart boolean default false)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.start_simulation(requested_content_id,null,requested_restart) $fn$;
create function public.get_simulation_attempt(requested_attempt_id uuid)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.simulation_snapshot(requested_attempt_id,null) $fn$;
create function public.submit_simulation_action(requested_attempt_id uuid,requested_step_id uuid,
  expected_state_version integer,requested_request_id uuid,requested_kind text,requested_value jsonb default null)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.simulation_action(requested_attempt_id,null,requested_step_id,expected_state_version,requested_request_id,requested_kind,requested_value) $fn$;
create function public.agent_start_simulation(requested_agent_id uuid,requested_content_id uuid,requested_restart boolean default false)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.start_simulation(requested_content_id,requested_agent_id,requested_restart) $fn$;
create function public.agent_get_simulation_attempt(requested_agent_id uuid,requested_attempt_id uuid)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id) $fn$;
create function public.agent_submit_simulation_action(requested_agent_id uuid,requested_attempt_id uuid,requested_step_id uuid,
  expected_state_version integer,requested_request_id uuid,requested_kind text,requested_value jsonb default null)
returns jsonb language sql security definer set search_path=pg_catalog as $fn$
  select pulse_private.simulation_action(requested_attempt_id,requested_agent_id,requested_step_id,expected_state_version,requested_request_id,requested_kind,requested_value) $fn$;

-- Only new functions are changed. Agent RPCs remain server-only.
do $security$
declare f record;
begin
  for f in select p.oid::regprocedure signature,proname,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='pulse_private' and proname in ('guard_simulation_step','validate_simulation_publication','clone_simulation_revision',
      'simulation_learner','simulation_snapshot','start_simulation','simulation_action','protect_simulation_screen',
      'can_read_simulation_screen','list_simulations','simulation_history')) or
      (n.nspname='public' and proname in ('create_simulation_draft','replace_simulation_steps','get_simulation_authoring',
        'start_simulation','get_simulation_attempt','submit_simulation_action','agent_start_simulation','agent_get_simulation_attempt','agent_submit_simulation_action',
        'can_read_simulation_screen','agent_can_read_simulation_screen','list_simulations','agent_list_simulations','get_simulation_history','agent_get_simulation_history')) loop
    execute format('alter function %s owner to postgres',f.signature);
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    if f.nspname='public' then
      execute format('grant execute on function %s to %I',f.signature,case when f.proname like 'agent_%' then 'service_role' else 'authenticated' end);
    end if;
  end loop;
end $security$;
commit;
