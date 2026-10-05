-- AGENT-1 Preview: presentation metadata on existing protected reads only.
-- Preserve all authorization, grants, score calculations, history and session checks.
-- No new identity, credential or result writes. Session last_used behavior is unchanged.
begin;

create or replace function pulse_private.compute_go_global_ranking(
  requested_period text, requested_learner_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare week_start timestamptz := date_trunc('week',now() at time zone 'UTC') at time zone 'UTC';
  response jsonb;
begin
  if requested_period is null or requested_period not in ('week','all_time') then
    raise exception 'Invalid ranking period' using errcode='22023';
  end if;
  with eligible_results as (
    select attempt.learner_id,
      round(100.0*result.correct_answers/nullif(result.total_questions,0))::integer as earned
    from public.go_sessions session
    join public.go_session_memberships membership
      on membership.session_id=session.id and membership.member_kind='participant'
    join public.training_attempts attempt
      on attempt.id=membership.attempt_id
      and attempt.source_mode='go_hosted' and attempt.status='completed'
    join public.training_results result on result.attempt_id=attempt.id
    where session.status='completed'
      and (requested_period='all_time' or session.completed_at>=week_start)
  ), scores as (
    select learner_id,sum(coalesce(earned,0))::bigint as points,
      count(*)::integer as hosted_games
    from eligible_results group by learner_id
  ), visible_players as (
    select score.learner_id,score.points,score.hosted_games,
      coalesce(nullif(btrim(agent.display_name),''),
        nullif(btrim(staff.display_name),''),staff.full_name) as display_name,
      agent.agent_code,team.name as team_name,team.code as team_code,
      campaign.code as campaign_code,campaign.name as campaign_name
    from scores score
    join public.training_learners learner on learner.id=score.learner_id
    left join public.training_agent_learner_links agent_link
      on agent_link.learner_id=score.learner_id and learner.learner_kind='agent'
    left join public.agents agent on agent.id=agent_link.agent_id
      and agent.status='active'
    left join public.training_staff_learner_links staff_link
      on staff_link.learner_id=score.learner_id and learner.learner_kind='staff'
    left join public.users staff on staff.id=staff_link.staff_user_id
      and staff.status='active'
    left join public.teams team on team.id=coalesce(agent.team_id,staff.team_id)
    left join public.campaigns campaign on campaign.id=team.campaign_id
    where agent.id is not null or staff.id is not null
  ), ranked as (
    select row_number() over(order by points desc,hosted_games desc,learner_id)::integer as rank,
      learner_id,display_name,agent_code,team_name,team_code,campaign_code,campaign_name,points,hosted_games
    from visible_players
  )
  select jsonb_build_object(
    'period',requested_period,
    'timezone','UTC',
    'period_start',case when requested_period='week' then week_start else null end,
    'top',coalesce((select jsonb_agg(jsonb_build_object(
      'rank',rank,'display_name',display_name,'agent_code',agent_code,'team',team_name,'team_code',team_code,
      'campaign_code',campaign_code,'campaign_name',campaign_name,
      'points',points,'hosted_games',hosted_games) order by rank)
      from ranked where rank<=10),'[]'::jsonb),
    'your_rank',(select jsonb_build_object('rank',rank,'display_name',display_name,
      'agent_code',agent_code,'team',team_name,'team_code',team_code,
      'campaign_code',campaign_code,'campaign_name',campaign_name,'points',points,'hosted_games',hosted_games)
      from ranked where learner_id=requested_learner_id)
  ) into response;
  return response;
end
$function$;

create or replace function public.agent_session_profile(requested_token_hash text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare found_agent record;
begin
  if requested_token_hash is null or requested_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Agent session unavailable' using errcode='28000';
  end if;
  select agent.id,agent.agent_code,agent.display_name,agent.team_id,
    team.name as team_name,team.code as team_code,
    campaign.code as campaign_code,campaign.name as campaign_name,link.learner_id,session.expires_at,session.last_used_at
  into found_agent
  from public.agent_sessions session
  join public.agents agent on agent.id=session.agent_id and agent.status='active'
  join public.teams team on team.id=agent.team_id and team.is_active
  left join public.campaigns campaign on campaign.id=team.campaign_id
  join public.training_agent_learner_links link on link.agent_id=agent.id
  where session.token_hash=requested_token_hash and session.revoked_at is null
    and session.expires_at > now();
  if not found then raise exception 'Agent session unavailable' using errcode='28000'; end if;
  if found_agent.last_used_at < now()-interval '5 minutes' then
    update public.agent_sessions set last_used_at=now() where token_hash=requested_token_hash;
  end if;
  return jsonb_build_object('agent_id',found_agent.id,'agent_code',found_agent.agent_code,
    'display_name',found_agent.display_name,'team_id',found_agent.team_id,
    'team_name',found_agent.team_name,'team_code',found_agent.team_code,
    'campaign_code',found_agent.campaign_code,'campaign_name',found_agent.campaign_name,
    'learner_id',found_agent.learner_id,
    'expires_at',found_agent.expires_at);
end
$function$;

create or replace function public.get_staff_agent_profile(requested_agent_code text)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target record;
begin
  perform pulse_private.current_training_staff_user_id();
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$' then
    raise exception 'Invalid Agent ID' using errcode='22023';
  end if;

  select agent.agent_code,agent.display_name,agent.full_name,agent.status,
    team.name as team_name,team.code as team_code,
    campaign.code as campaign_code,campaign.name as campaign_name,link.learner_id
  into target
  from public.agents agent
  join public.teams team on team.id=agent.team_id
  left join public.campaigns campaign on campaign.id=team.campaign_id
  join public.training_agent_learner_links link on link.agent_id=agent.id
  where agent.agent_code=requested_agent_code;
  if not found then raise exception 'Agent unavailable' using errcode='P0002'; end if;

  return jsonb_build_object(
    'agent_code',target.agent_code,
    'display_name',target.display_name,
    'full_name',target.full_name,
    'status',target.status,
    'team_name',target.team_name,
    'team_code',target.team_code,
    'campaign_code',target.campaign_code,
    'campaign_name',target.campaign_name,
    'go',pulse_private.go_player_progress(target.learner_id)
  );
end
$function$;

commit;

