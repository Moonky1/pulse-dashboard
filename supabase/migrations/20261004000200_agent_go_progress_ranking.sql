-- AGENT-1: Hosted-only competitive points, derived from immutable results.
-- Formula: round(100 * correct / total) points per completed Hosted round.
-- This normalizes ten-question and future rounds; Practice/Certification earn 0.
begin;

create index training_attempts_completed_hosted_learner_idx
on public.training_attempts(learner_id, completed_at desc, id)
where source_mode='go_hosted' and status='completed';
create index training_attempts_completed_player_history_idx
on public.training_attempts(learner_id, completed_at desc, id)
where source_mode in ('go_practice','go_hosted') and status='completed';
create index go_sessions_completed_ranking_idx
on public.go_sessions(completed_at desc,id) where status='completed';

create function pulse_private.compute_go_global_ranking(
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
      team.name as team_name
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
    where agent.id is not null or staff.id is not null
  ), ranked as (
    select row_number() over(order by points desc,hosted_games desc,learner_id)::integer as rank,
      learner_id,display_name,team_name,points,hosted_games
    from visible_players
  )
  select jsonb_build_object(
    'period',requested_period,
    'timezone','UTC',
    'period_start',case when requested_period='week' then week_start else null end,
    'top',coalesce((select jsonb_agg(jsonb_build_object(
      'rank',rank,'display_name',display_name,'team',team_name,
      'points',points,'hosted_games',hosted_games) order by rank)
      from ranked where rank<=10),'[]'::jsonb),
    'your_rank',(select jsonb_build_object('rank',rank,'display_name',display_name,
      'team',team_name,'points',points,'hosted_games',hosted_games)
      from ranked where learner_id=requested_learner_id)
  ) into response;
  return response;
end
$function$;

create function pulse_private.go_player_progress(requested_learner_id uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare response jsonb;
begin
  with player_results as (
    select attempt.id,attempt.source_mode,attempt.started_at,attempt.completed_at,
      content.id as content_id,content.game_id,content.version_number,
      content.title,content.language,result.score_percent,
      result.correct_answers,result.total_questions
    from public.training_attempts attempt
    join public.training_content content on content.id=attempt.content_id
    join public.training_results result on result.attempt_id=attempt.id
    where attempt.learner_id=requested_learner_id
      and attempt.status='completed'
      and attempt.source_mode in ('go_practice','go_hosted')
  )
  select jsonb_build_object(
    'hosted_games',count(*) filter(where source_mode='go_hosted'),
    'practice_games',count(*) filter(where source_mode='go_practice'),
    'average_accuracy',round(avg(score_percent),2),
    'recent_activity',coalesce((select jsonb_agg(jsonb_build_object(
      'attempt_id',recent.id,'mode',recent.source_mode,'game',recent.title,
      'game_id',recent.game_id,'content_id',recent.content_id,
      'game_version',recent.version_number,'language',recent.language,
      'started_at',recent.started_at,'completed_at',recent.completed_at,
      'score_percent',recent.score_percent,'correct_answers',recent.correct_answers,
      'total_questions',recent.total_questions)
      order by recent.completed_at desc,recent.id)
      from (select * from player_results order by completed_at desc,id limit 20) recent),'[]'::jsonb)
  ) into response from player_results;
  return response || jsonb_build_object(
    'competitive',pulse_private.compute_go_global_ranking('all_time',requested_learner_id)->'your_rank'
  );
end
$function$;

create function public.get_go_global_ranking(requested_period text default 'week')
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
  learner uuid;
begin
  if not pulse_private.has_permission('go.play') then
    raise exception 'GO player permission required' using errcode='42501';
  end if;
  select link.learner_id into learner from public.training_staff_learner_links link
  where link.staff_user_id=actor_id;
  return pulse_private.compute_go_global_ranking(requested_period,learner);
end
$function$;

create function public.get_my_go_progress()
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
  learner uuid;
begin
  if not pulse_private.has_permission('go.play') then
    raise exception 'GO player permission required' using errcode='42501';
  end if;
  select link.learner_id into learner from public.training_staff_learner_links link
  where link.staff_user_id=actor_id;
  if learner is null then
    return jsonb_build_object('hosted_games',0,'practice_games',0,
      'average_accuracy',null,'recent_activity','[]'::jsonb,'competitive',null);
  end if;
  return pulse_private.go_player_progress(learner);
end
$function$;

-- Only the trusted same-origin server endpoint may supply an Agent ID here.
-- It first resolves an unexpired, revocable HttpOnly-cookie session.
create function public.agent_get_go_global_ranking(
  requested_agent_id uuid,requested_period text default 'week'
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare learner uuid;
begin
  select link.learner_id into learner
  from public.training_agent_learner_links link
  join public.agents agent on agent.id=link.agent_id and agent.status='active'
  join public.teams team on team.id=agent.team_id and team.is_active
  where agent.id=requested_agent_id;
  if learner is null then raise exception 'Agent unavailable' using errcode='42501'; end if;
  return pulse_private.compute_go_global_ranking(requested_period,learner);
end
$function$;

create function public.agent_get_go_progress(requested_agent_id uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare learner uuid;
begin
  select link.learner_id into learner
  from public.training_agent_learner_links link
  join public.agents agent on agent.id=link.agent_id and agent.status='active'
  join public.teams team on team.id=agent.team_id and team.is_active
  where agent.id=requested_agent_id;
  if learner is null then raise exception 'Agent unavailable' using errcode='42501'; end if;
  return pulse_private.go_player_progress(learner);
end
$function$;

revoke all on function pulse_private.compute_go_global_ranking(text,uuid)
  from public,anon,authenticated,service_role;
revoke all on function pulse_private.go_player_progress(uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.get_go_global_ranking(text) from public,anon,service_role;
revoke all on function public.get_my_go_progress() from public,anon,service_role;
grant execute on function public.get_go_global_ranking(text) to authenticated;
grant execute on function public.get_my_go_progress() to authenticated;
revoke all on function public.agent_get_go_global_ranking(uuid,text)
  from public,anon,authenticated;
revoke all on function public.agent_get_go_progress(uuid)
  from public,anon,authenticated;
grant execute on function public.agent_get_go_global_ranking(uuid,text) to service_role;
grant execute on function public.agent_get_go_progress(uuid) to service_role;
commit;
