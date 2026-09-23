-- Pulse PEOPLE-2: protected Staff work details and atomic access replacement.
--
-- Position, operational placement, employment placement, and Pulse access
-- remain separate concepts. This migration adds only server-owned mutation
-- contracts and the minimum read projection required by the People surfaces.

-- Preserve the stable position code while applying Master's confirmed
-- business-facing label.
update public.positions
set name = 'Team Leader'
where code = 'team_lead'
  and name = 'Team Lead';

insert into public.permissions(id, key, description)
values (
  '20000000-0000-0000-0000-000000000039',
  'staff_work.manage',
  'Manage protected Staff work details and operational placement.'
);

insert into public.role_permissions(role_id, permission_id)
select role.id, permission.id
from public.roles role
join public.permissions permission on permission.key in (
  'staff_work.manage',
  'positions.view',
  'assignments.view',
  'business_catalog.view'
)
where role.key in ('super_admin', 'admin', 'human_resources')
on conflict do nothing;

-- Enrich the existing protected single-person projection. The public list
-- contract intentionally remains stable; callers that need resolved work
-- context already hydrate each person through get_managed_user.
drop function public.get_managed_user(uuid);

create function public.get_managed_user(target_user_id uuid)
returns table (
  id uuid,
  email text,
  full_name text,
  display_name text,
  employee_id text,
  status text,
  department_id uuid,
  team_id uuid,
  auth_email_confirmed boolean,
  roles jsonb,
  position_id uuid,
  position_code text,
  position_name text,
  primary_assignment_id uuid,
  primary_campaign_id uuid,
  primary_campaign_code text,
  primary_campaign_name text,
  primary_operating_unit_id uuid,
  primary_operating_unit_code text,
  primary_operating_unit_name text,
  primary_team_id uuid,
  primary_team_code text,
  primary_team_name text
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select
    managed.id,
    managed.email,
    managed.full_name,
    managed.display_name,
    managed.employee_id,
    managed.status,
    managed.department_id,
    managed.team_id,
    managed.auth_email_confirmed,
    managed.roles,
    target.position_id,
    position.code,
    position.name,
    primary_assignment.id,
    campaign.id,
    campaign.code,
    campaign.name,
    operating_unit.id,
    operating_unit.code,
    operating_unit.name,
    operational_team.id,
    operational_team.code,
    operational_team.name
  from public.list_managed_users(null) managed
  join public.users target on target.id = managed.id
  left join public.positions position on position.id = target.position_id
  left join lateral (
    select assignment.*
    from public.user_operational_assignments assignment
    where assignment.user_id = target.id
      and assignment.ended_at is null
      and assignment.is_primary
    order by assignment.started_at desc, assignment.id
    limit 1
  ) primary_assignment on true
  left join public.campaigns campaign on campaign.id = primary_assignment.campaign_id
  left join public.teams operational_team on operational_team.id = primary_assignment.team_id
  left join public.operating_units operating_unit on operating_unit.id = operational_team.operating_unit_id
  where managed.id = target_user_id
$function$;

create function public.update_staff_work_details(
  target_user_id uuid,
  requested_department_id uuid,
  requested_campaign_id uuid default null,
  requested_operating_unit_id uuid default null,
  requested_team_id uuid default null,
  requested_position_id uuid default null,
  request_key uuid default gen_random_uuid()
)
returns table (
  id uuid,
  department_id uuid,
  position_id uuid,
  primary_assignment_id uuid,
  campaign_id uuid,
  operating_unit_id uuid,
  team_id uuid,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('staff_work.manage');
  target public.users%rowtype;
  current_assignment public.user_operational_assignments%rowtype;
  current_operating_unit_id uuid;
  selected_team public.teams%rowtype;
  selected_unit public.operating_units%rowtype;
  next_assignment_id uuid;
  next_employment_team_id uuid;
  state_changed boolean := false;
  before_state jsonb;
  after_state jsonb;
begin
  if request_key is null then
    raise exception 'request key is required' using errcode = '22023';
  end if;

  select * into target
  from public.users target_user
  where target_user.id = target_user_id
  for update;

  if not found then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;
  if target.status <> 'active' then
    raise exception 'work details may be changed only for active Staff' using errcode = '55000';
  end if;
  if requested_department_id is null or not exists (
    select 1 from public.departments department
    where department.id = requested_department_id and department.is_active
  ) then
    raise exception 'requested Department is missing or inactive' using errcode = '23503';
  end if;
  if requested_position_id is not null and not exists (
    select 1 from public.positions position
    where position.id = requested_position_id and position.is_active
  ) then
    raise exception 'requested Position is missing or inactive' using errcode = '23503';
  end if;

  if requested_campaign_id is null then
    if requested_operating_unit_id is not null or requested_team_id is not null then
      raise exception 'an Operating Unit or Team requires a Campaign' using errcode = '23514';
    end if;
  else
    if requested_position_id is null then
      raise exception 'an operational placement requires a Position' using errcode = '23514';
    end if;
    if not exists (
      select 1 from public.campaigns campaign
      where campaign.id = requested_campaign_id and campaign.is_active
    ) then
      raise exception 'requested Campaign is missing or inactive' using errcode = '23503';
    end if;

    if requested_operating_unit_id is not null then
      select * into selected_unit
      from public.operating_units unit
      where unit.id = requested_operating_unit_id
        and unit.campaign_id = requested_campaign_id
        and unit.is_active;
      if not found then
        raise exception 'requested Operating Unit is missing, inactive, or outside the Campaign' using errcode = '23503';
      end if;
    end if;

    if requested_team_id is not null then
      select * into selected_team
      from public.teams team
      where team.id = requested_team_id
        and team.campaign_id = requested_campaign_id
        and team.is_active;
      if not found then
        raise exception 'requested Team is missing, inactive, or outside the Campaign' using errcode = '23503';
      end if;
      if selected_team.operating_unit_id is distinct from requested_operating_unit_id then
        raise exception 'requested Team is outside the selected Operating Unit' using errcode = '23514';
      end if;
    elsif requested_operating_unit_id is not null then
      raise exception 'an Operating Unit placement requires a Team' using errcode = '23514';
    end if;
  end if;

  -- Employment Department-scoped access must continue matching employment.
  if exists (
    select 1 from public.user_roles assignment
    where assignment.user_id = target.id
      and assignment.scope_type = 'department'
      and assignment.department_id is distinct from requested_department_id
  ) then
    raise exception 'existing Department access must be changed before moving employment Department' using errcode = '23514';
  end if;

  next_employment_team_id := target.team_id;
  if requested_department_id is distinct from target.department_id then
    if exists (
      select 1 from public.user_roles assignment
      where assignment.user_id = target.id and assignment.scope_type = 'team'
    ) then
      raise exception 'existing Team access must be changed before moving employment Department' using errcode = '23514';
    end if;
    next_employment_team_id := null;
  end if;

  select assignment.* into current_assignment
  from public.user_operational_assignments assignment
  where assignment.user_id = target.id
    and assignment.ended_at is null
    and assignment.is_primary
  order by assignment.started_at desc, assignment.id
  limit 1
  for update;

  if current_assignment.id is not null then
    select team.operating_unit_id into current_operating_unit_id
    from public.teams team
    where team.id = current_assignment.team_id;
  end if;

  before_state := jsonb_build_object(
    'department_id', target.department_id,
    'position_id', target.position_id,
    'primary_assignment_id', current_assignment.id,
    'campaign_id', current_assignment.campaign_id,
    'operating_unit_id', current_operating_unit_id,
    'team_id', current_assignment.team_id
  );

  if target.department_id is not distinct from requested_department_id
     and target.position_id is not distinct from requested_position_id
     and current_assignment.campaign_id is not distinct from requested_campaign_id
     and current_operating_unit_id is not distinct from requested_operating_unit_id
     and current_assignment.team_id is not distinct from requested_team_id
     and (
       requested_campaign_id is null
       or current_assignment.position_id is not distinct from requested_position_id
     ) then
    return query select
      target.id,
      target.department_id,
      target.position_id,
      current_assignment.id,
      current_assignment.campaign_id,
      current_operating_unit_id,
      current_assignment.team_id,
      false;
    return;
  end if;

  update public.users target_user
  set department_id = requested_department_id,
      team_id = next_employment_team_id,
      position_id = requested_position_id
  where target_user.id = target.id;
  state_changed := true;

  if current_assignment.id is not null then
    update public.user_operational_assignments assignment
    set ended_at = greatest(now(), assignment.started_at),
        is_primary = false
    where assignment.id = current_assignment.id;
  end if;

  if requested_campaign_id is not null then
    select assignment.id into next_assignment_id
    from public.user_operational_assignments assignment
    where assignment.user_id = target.id
      and assignment.campaign_id = requested_campaign_id
      and assignment.team_id is not distinct from requested_team_id
      and assignment.position_id = requested_position_id
      and assignment.ended_at is null
    order by assignment.started_at desc, assignment.id
    limit 1
    for update;

    if next_assignment_id is null then
      insert into public.user_operational_assignments(
        user_id, campaign_id, team_id, position_id, is_primary
      ) values (
        target.id, requested_campaign_id, requested_team_id, requested_position_id, true
      ) returning public.user_operational_assignments.id into next_assignment_id;
    else
      update public.user_operational_assignments assignment
      set is_primary = true
      where assignment.id = next_assignment_id;
    end if;
  end if;

  after_state := jsonb_build_object(
    'department_id', requested_department_id,
    'position_id', requested_position_id,
    'primary_assignment_id', next_assignment_id,
    'campaign_id', requested_campaign_id,
    'operating_unit_id', requested_operating_unit_id,
    'team_id', requested_team_id
  );

  insert into public.audit_events(
    actor_user_id, target_type, target_id, action, source, request_id, metadata
  ) values (
    actor_id,
    'user',
    target.id,
    'staff.work_details.updated',
    'operator',
    request_key,
    jsonb_build_object('before', before_state, 'after', after_state)
  );

  return query select
    target.id,
    requested_department_id,
    requested_position_id,
    next_assignment_id,
    requested_campaign_id,
    requested_operating_unit_id,
    requested_team_id,
    state_changed;
end
$function$;

-- An active Staff member never passes through a zero-role state. Adding the
-- replacement and removing the old assignment happen in one transaction;
-- every existing grant rule and last-Super-Admin guard remains authoritative.
create function public.replace_user_role(
  target_user_id uuid,
  target_user_role_id uuid,
  requested_role_id uuid,
  requested_scope_type text,
  requested_department_id uuid default null,
  requested_campaign_id uuid default null,
  requested_team_id uuid default null
)
returns table (
  old_user_role_id uuid,
  user_role_id uuid,
  replaced boolean,
  created boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('roles.assign');
  target public.users%rowtype;
  current_assignment public.user_roles%rowtype;
  replacement_id uuid;
  replacement_created boolean;
  removal_confirmed boolean;
begin
  if actor_id = target_user_id then
    raise exception 'self role changes are not allowed' using errcode = '42501';
  end if;

  select * into target
  from public.users target_user
  where target_user.id = target_user_id
  for update;
  if not found then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;
  if target.status = 'pending_approval' then
    raise exception 'pending roles are assigned only through approval' using errcode = '55000';
  end if;

  select * into current_assignment
  from public.user_roles assignment
  where assignment.id = target_user_role_id
    and assignment.user_id = target.id
  for update;

  if not found then
    -- A retried request is idempotent only when the exact replacement already
    -- exists. Never create a new assignment from a stale replacement request.
    select assignment.id into replacement_id
    from public.user_roles assignment
    where assignment.user_id = target.id
      and assignment.role_id = requested_role_id
      and assignment.scope_type = requested_scope_type
      and assignment.department_id is not distinct from requested_department_id
      and assignment.campaign_id is not distinct from requested_campaign_id
      and assignment.team_id is not distinct from requested_team_id;
    if replacement_id is null then
      raise exception 'target role assignment not found' using errcode = 'P0002';
    end if;

    -- Re-run the canonical contract so authorization/grant validation is not
    -- bypassed by the idempotent path.
    select assigned.user_role_id, assigned.created
    into replacement_id, replacement_created
    from public.assign_user_role(
      target.id,
      requested_role_id,
      requested_scope_type,
      requested_department_id,
      requested_campaign_id,
      requested_team_id
    ) assigned;
    return query select target_user_role_id, replacement_id, false, replacement_created;
    return;
  end if;

  if current_assignment.role_id = requested_role_id
     and current_assignment.scope_type = requested_scope_type
     and current_assignment.department_id is not distinct from requested_department_id
     and current_assignment.campaign_id is not distinct from requested_campaign_id
     and current_assignment.team_id is not distinct from requested_team_id then
    return query select current_assignment.id, current_assignment.id, false, false;
    return;
  end if;

  select assigned.user_role_id, assigned.created
  into replacement_id, replacement_created
  from public.assign_user_role(
    target.id,
    requested_role_id,
    requested_scope_type,
    requested_department_id,
    requested_campaign_id,
    requested_team_id
  ) assigned;

  select removed.removed into removal_confirmed
  from public.remove_user_role(target.id, current_assignment.id) removed;

  if not coalesce(removal_confirmed, false) then
    raise exception 'target role assignment changed during replacement' using errcode = '55000';
  end if;

  return query select current_assignment.id, replacement_id, true, replacement_created;
end
$function$;

alter function public.get_managed_user(uuid) owner to postgres;
alter function public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid) owner to postgres;

revoke all on function public.get_managed_user(uuid) from public, anon, service_role;
revoke all on function public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid) from public, anon, service_role;
revoke all on function public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid) from public, anon, service_role;

grant execute on function public.get_managed_user(uuid) to authenticated;
grant execute on function public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid) to authenticated;

comment on function public.update_staff_work_details(uuid,uuid,uuid,uuid,uuid,uuid,uuid) is
  'Authorized, audited, idempotent Staff work-details mutation that keeps employment, operational placement, Position, and RBAC separate.';
comment on function public.replace_user_role(uuid,uuid,uuid,text,uuid,uuid,uuid) is
  'Atomic Pulse access replacement preserving grant rules, active-user role invariants, and last-Super-Admin protection.';
