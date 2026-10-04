-- Staff may inspect an Agent's canonical identity and completed GO history.
-- Agent self access remains behind the existing revocable server session.
begin;

create function public.get_staff_agent_profile(requested_agent_code text)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target record;
begin
  perform pulse_private.current_training_staff_user_id();
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$' then
    raise exception 'Invalid Agent ID' using errcode='22023';
  end if;

  select agent.agent_code,agent.display_name,agent.full_name,agent.status,
    team.name as team_name,link.learner_id
  into target
  from public.agents agent
  join public.teams team on team.id=agent.team_id
  join public.training_agent_learner_links link on link.agent_id=agent.id
  where agent.agent_code=requested_agent_code;
  if not found then raise exception 'Agent unavailable' using errcode='P0002'; end if;

  return jsonb_build_object(
    'agent_code',target.agent_code,
    'display_name',target.display_name,
    'full_name',target.full_name,
    'status',target.status,
    'team_name',target.team_name,
    'go',pulse_private.go_player_progress(target.learner_id)
  );
end
$function$;

revoke all on function public.get_staff_agent_profile(text) from public,anon,service_role;
grant execute on function public.get_staff_agent_profile(text) to authenticated;
comment on function public.get_staff_agent_profile(text) is
  'Staff-only Agent identity and real GO progress; no credentials, sessions, or operational metrics.';
commit;
