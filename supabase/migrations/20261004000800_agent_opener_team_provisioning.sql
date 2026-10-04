-- AGENT-1 Preview: Agent creation is limited to active campaign opener teams.
-- Resolve the operating unit from the chosen team rather than trusting a caller-supplied unit.
begin;

create or replace function public.admin_prepare_agent_activation(
  requested_agent_code text, requested_display_name text,
  requested_team_id uuid, requested_full_name text default null,
  requested_operating_unit_id uuid default null
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
  created_agent uuid; created_learner uuid; activation_code text; opener_unit_id uuid;
begin
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$'
    or length(btrim(coalesce(requested_display_name,''))) not between 2 and 80
    or (requested_full_name is not null and length(btrim(requested_full_name)) not between 2 and 160) then
    raise exception 'Invalid Agent details' using errcode = '22023';
  end if;

  select unit.id into opener_unit_id
  from public.teams team
  join public.operating_units unit on unit.id = team.operating_unit_id
  join public.campaigns campaign on campaign.id = team.campaign_id
  where team.id = requested_team_id
    and team.is_active and unit.is_active and campaign.is_active
    and unit.code = 'openers'
    and unit.campaign_id = campaign.id;
  if opener_unit_id is null or (requested_operating_unit_id is not null
    and requested_operating_unit_id <> opener_unit_id) then
    raise exception 'Active campaign opener team required' using errcode = '22023';
  end if;

  insert into public.agents(agent_code,display_name,full_name,team_id,operating_unit_id)
  values(requested_agent_code,btrim(requested_display_name),nullif(btrim(requested_full_name),''),
    requested_team_id,opener_unit_id)
  returning id into created_agent;
  insert into public.agent_credentials(agent_id,pin_hash) values(created_agent,null);
  insert into public.training_learners(learner_kind) values('agent') returning id into created_learner;
  insert into public.training_agent_learner_links(learner_id,agent_id)
  values(created_learner,created_agent);
  activation_code := pulse_private.issue_agent_activation(created_agent);
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'agent',created_agent,'agent.provisioned','server',
    jsonb_build_object('agent_code',requested_agent_code,'team_id',requested_team_id,
      'activation_expires_at',now()+interval '24 hours'));
  return jsonb_build_object('agent_id',created_agent,'agent_code',requested_agent_code,
    'activation_code',activation_code);
end
$function$;

create or replace function public.admin_update_agent(
  requested_agent_id uuid, requested_status text,
  requested_team_id uuid, requested_operating_unit_id uuid default null
)
returns void language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
  previous public.agents%rowtype; opener_unit_id uuid;
begin
  if requested_status not in ('active','inactive','blocked') or requested_team_id is null then
    raise exception 'Invalid Agent update' using errcode = '22023';
  end if;
  select unit.id into opener_unit_id
  from public.teams team
  join public.operating_units unit on unit.id = team.operating_unit_id
  join public.campaigns campaign on campaign.id = team.campaign_id
  where team.id = requested_team_id
    and team.is_active and unit.is_active and campaign.is_active
    and unit.code = 'openers'
    and unit.campaign_id = campaign.id;
  if opener_unit_id is null or (requested_operating_unit_id is not null
    and requested_operating_unit_id <> opener_unit_id) then
    raise exception 'Active campaign opener team required' using errcode = '22023';
  end if;
  select * into previous from public.agents where id = requested_agent_id for update;
  if not found then raise exception 'Agent unavailable' using errcode = 'P0002'; end if;
  update public.agents set status = requested_status, team_id = requested_team_id,
    operating_unit_id = opener_unit_id where id = requested_agent_id;
  if requested_status <> 'active' then
    update public.agent_sessions set revoked_at = now()
    where agent_id = requested_agent_id and revoked_at is null;
  end if;
  if previous.status is distinct from requested_status then
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor_id,'agent',requested_agent_id,'agent.status_changed','server',
      jsonb_build_object('from',previous.status,'to',requested_status));
  end if;
  if previous.team_id is distinct from requested_team_id then
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor_id,'agent',requested_agent_id,'agent.team_assignment_changed','server',
      jsonb_build_object('from',previous.team_id,'to',requested_team_id));
  end if;
end
$function$;

comment on function public.admin_prepare_agent_activation(text,text,uuid,text,uuid) is
  'Provision an approved Agent only in an active campaign opener team; Agent chooses PIN using a one-time code.';

commit;
