-- Pulse ADMIN-4A: protected, audited department and team administration.

create unique index departments_name_unique
  on public.departments (lower(btrim(name)));

create unique index teams_department_name_unique
  on public.teams (department_id, lower(btrim(name)));

create function public.list_managed_departments()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  team_count bigint,
  active_team_count bigint,
  user_count bigint,
  active_user_count bigint,
  pending_user_count bigint,
  active_role_assignment_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('departments.view');

  return query
  select
    department.id,
    department.code,
    department.name,
    department.description,
    department.is_active,
    department.created_at,
    department.updated_at,
    (select count(*) from public.teams team where team.department_id = department.id),
    (select count(*) from public.teams team where team.department_id = department.id and team.is_active),
    (select count(*) from public.users target where target.department_id = department.id),
    (select count(*) from public.users target where target.department_id = department.id and target.status = 'active'),
    (select count(*) from public.users target where target.department_id = department.id and target.status = 'pending_approval'),
    (
      select count(*)
      from public.user_roles assignment
      join public.users target on target.id = assignment.user_id and target.status = 'active'
      where assignment.department_id = department.id
    )
  from public.departments department
  order by department.name, department.id;
end
$function$;

create function public.list_managed_teams()
returns table (
  id uuid,
  department_id uuid,
  department_code text,
  department_name text,
  department_is_active boolean,
  code text,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_count bigint,
  active_user_count bigint,
  pending_user_count bigint,
  active_role_assignment_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('teams.view');

  return query
  select
    team.id,
    department.id,
    department.code,
    department.name,
    department.is_active,
    team.code,
    team.name,
    team.description,
    team.is_active,
    team.created_at,
    team.updated_at,
    (select count(*) from public.users target where target.team_id = team.id),
    (select count(*) from public.users target where target.team_id = team.id and target.status = 'active'),
    (select count(*) from public.users target where target.team_id = team.id and target.status = 'pending_approval'),
    (
      select count(*)
      from public.user_roles assignment
      join public.users target on target.id = assignment.user_id and target.status = 'active'
      where assignment.team_id = team.id
    )
  from public.teams team
  join public.departments department on department.id = team.department_id
  order by department.name, team.name, team.id;
end
$function$;

create function public.create_department(
  requested_code text,
  requested_name text,
  requested_description text default null
)
returns table (
  id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  updated_at timestamptz,
  created boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  normalized_code text := lower(btrim(requested_code));
  normalized_name text := btrim(requested_name);
  normalized_description text := nullif(btrim(requested_description), '');
  existing public.departments%rowtype;
  created_department public.departments%rowtype;
begin
  perform pulse_private.require_global_permission('departments.manage');
  perform pg_advisory_xact_lock(73032026082700400::bigint);

  if normalized_code !~ '^[a-z][a-z0-9_]{1,31}$' then
    raise exception 'department code is invalid' using errcode = '22023';
  end if;
  if length(normalized_name) not between 2 and 120 then
    raise exception 'department name must contain between 2 and 120 characters' using errcode = '22023';
  end if;
  if length(coalesce(normalized_description, '')) > 500 then
    raise exception 'department description must be 500 characters or fewer' using errcode = '22023';
  end if;

  select department.* into existing
  from public.departments department
  where lower(department.code) = normalized_code;

  if found then
    if lower(btrim(existing.name)) = lower(normalized_name)
       and existing.description is not distinct from normalized_description then
      return query select existing.id, existing.code, existing.name, existing.description,
        existing.is_active, existing.updated_at, false;
      return;
    end if;
    raise exception 'department code already exists' using errcode = '23505';
  end if;

  insert into public.departments(code, name, description)
  values(normalized_code, normalized_name, normalized_description)
  returning * into created_department;

  insert into public.audit_events(actor_user_id, target_type, target_id, action, source, metadata)
  values(actor_id, 'department', created_department.id, 'department.created', 'operator',
    jsonb_build_object('code', created_department.code, 'name', created_department.name));

  return query select created_department.id, created_department.code, created_department.name,
    created_department.description, created_department.is_active, created_department.updated_at, true;
end
$function$;

create function public.update_department(
  target_department_id uuid,
  expected_updated_at timestamptz,
  requested_code text,
  requested_name text,
  requested_description text default null
)
returns table (
  id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  updated_at timestamptz,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  normalized_code text := lower(btrim(requested_code));
  normalized_name text := btrim(requested_name);
  normalized_description text := nullif(btrim(requested_description), '');
  existing public.departments%rowtype;
  updated_department public.departments%rowtype;
begin
  perform pulse_private.require_global_permission('departments.manage');
  perform pg_advisory_xact_lock(73032026082700400::bigint);

  if normalized_code !~ '^[a-z][a-z0-9_]{1,31}$'
     or length(normalized_name) not between 2 and 120
     or length(coalesce(normalized_description, '')) > 500 then
    raise exception 'department update is invalid' using errcode = '22023';
  end if;

  select department.* into existing
  from public.departments department
  where department.id = target_department_id
  for update;
  if not found then raise exception 'department not found' using errcode = 'P0002'; end if;

  if existing.code = normalized_code
     and existing.name = normalized_name
     and existing.description is not distinct from normalized_description then
    return query select existing.id, existing.code, existing.name, existing.description,
      existing.is_active, existing.updated_at, false;
    return;
  end if;
  if expected_updated_at is null or existing.updated_at is distinct from expected_updated_at then
    raise exception 'department changed since it was loaded' using errcode = '55000';
  end if;

  update public.departments department
  set code = normalized_code,
      name = normalized_name,
      description = normalized_description
  where department.id = existing.id
  returning * into updated_department;

  insert into public.audit_events(actor_user_id, target_type, target_id, action, source, metadata)
  values(actor_id, 'department', updated_department.id, 'department.updated', 'operator',
    jsonb_build_object(
      'before', jsonb_build_object('code', existing.code, 'name', existing.name),
      'after', jsonb_build_object('code', updated_department.code, 'name', updated_department.name)
    ));

  return query select updated_department.id, updated_department.code, updated_department.name,
    updated_department.description, updated_department.is_active, updated_department.updated_at, true;
end
$function$;

create function public.set_department_active(
  target_department_id uuid,
  requested_active boolean,
  expected_updated_at timestamptz
)
returns table (
  id uuid,
  is_active boolean,
  updated_at timestamptz,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  existing public.departments%rowtype;
  updated_department public.departments%rowtype;
begin
  perform pulse_private.require_global_permission('departments.manage');
  perform pg_advisory_xact_lock(73032026082700400::bigint);
  if requested_active is null then raise exception 'department state is required' using errcode = '22023'; end if;

  select department.* into existing
  from public.departments department
  where department.id = target_department_id
  for update;
  if not found then raise exception 'department not found' using errcode = 'P0002'; end if;
  if existing.is_active = requested_active then
    return query select existing.id, existing.is_active, existing.updated_at, false;
    return;
  end if;
  if expected_updated_at is null or existing.updated_at is distinct from expected_updated_at then
    raise exception 'department changed since it was loaded' using errcode = '55000';
  end if;

  if not requested_active then
    if exists(select 1 from public.teams team where team.department_id = existing.id and team.is_active) then
      raise exception 'active teams must be deactivated first' using errcode = '55000';
    end if;
    if exists(select 1 from public.users target where target.department_id = existing.id and target.status in ('active', 'pending_approval')) then
      raise exception 'active or pending users still depend on this department' using errcode = '55000';
    end if;
    if exists(
      select 1 from public.user_roles assignment
      join public.users target on target.id = assignment.user_id and target.status = 'active'
      where assignment.department_id = existing.id
    ) then
      raise exception 'active scoped role assignments still depend on this department' using errcode = '55000';
    end if;
  end if;

  update public.departments department set is_active = requested_active
  where department.id = existing.id returning * into updated_department;

  insert into public.audit_events(actor_user_id, target_type, target_id, action, source, metadata)
  values(actor_id, 'department', updated_department.id,
    case when requested_active then 'department.reactivated' else 'department.deactivated' end,
    'operator', jsonb_build_object('code', updated_department.code, 'name', updated_department.name));

  return query select updated_department.id, updated_department.is_active, updated_department.updated_at, true;
end
$function$;

create function public.create_team(
  target_department_id uuid,
  requested_code text,
  requested_name text,
  requested_description text default null
)
returns table (
  id uuid,
  department_id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  updated_at timestamptz,
  created boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  normalized_code text := lower(btrim(requested_code));
  normalized_name text := btrim(requested_name);
  normalized_description text := nullif(btrim(requested_description), '');
  parent public.departments%rowtype;
  existing public.teams%rowtype;
  created_team public.teams%rowtype;
begin
  perform pulse_private.require_global_permission('teams.manage');
  perform pg_advisory_xact_lock(73032026082700400::bigint);

  if normalized_code !~ '^[a-z][a-z0-9_]{1,31}$'
     or length(normalized_name) not between 2 and 120
     or length(coalesce(normalized_description, '')) > 500 then
    raise exception 'team input is invalid' using errcode = '22023';
  end if;
  select department.* into parent from public.departments department
  where department.id = target_department_id for update;
  if not found then raise exception 'department not found' using errcode = '23503'; end if;
  if not parent.is_active then raise exception 'team requires an active parent department' using errcode = '55000'; end if;

  select team.* into existing from public.teams team
  where team.department_id = parent.id and lower(team.code) = normalized_code;
  if found then
    if lower(btrim(existing.name)) = lower(normalized_name)
       and existing.description is not distinct from normalized_description then
      return query select existing.id, existing.department_id, existing.code, existing.name,
        existing.description, existing.is_active, existing.updated_at, false;
      return;
    end if;
    raise exception 'team code already exists in department' using errcode = '23505';
  end if;

  insert into public.teams(department_id, code, name, description)
  values(parent.id, normalized_code, normalized_name, normalized_description)
  returning * into created_team;

  insert into public.audit_events(actor_user_id, target_type, target_id, action, source, metadata)
  values(actor_id, 'team', created_team.id, 'team.created', 'operator',
    jsonb_build_object('department_id', parent.id, 'code', created_team.code, 'name', created_team.name));

  return query select created_team.id, created_team.department_id, created_team.code,
    created_team.name, created_team.description, created_team.is_active,
    created_team.updated_at, true;
end
$function$;

create function public.update_team(
  target_team_id uuid,
  expected_updated_at timestamptz,
  requested_code text,
  requested_name text,
  requested_description text default null
)
returns table (
  id uuid,
  department_id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  updated_at timestamptz,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  normalized_code text := lower(btrim(requested_code));
  normalized_name text := btrim(requested_name);
  normalized_description text := nullif(btrim(requested_description), '');
  existing public.teams%rowtype;
  updated_team public.teams%rowtype;
begin
  perform pulse_private.require_global_permission('teams.manage');
  perform pg_advisory_xact_lock(73032026082700400::bigint);

  if normalized_code !~ '^[a-z][a-z0-9_]{1,31}$'
     or length(normalized_name) not between 2 and 120
     or length(coalesce(normalized_description, '')) > 500 then
    raise exception 'team update is invalid' using errcode = '22023';
  end if;
  select team.* into existing from public.teams team
  where team.id = target_team_id for update;
  if not found then raise exception 'team not found' using errcode = 'P0002'; end if;

  if existing.code = normalized_code
     and existing.name = normalized_name
     and existing.description is not distinct from normalized_description then
    return query select existing.id, existing.department_id, existing.code, existing.name,
      existing.description, existing.is_active, existing.updated_at, false;
    return;
  end if;
  if expected_updated_at is null or existing.updated_at is distinct from expected_updated_at then
    raise exception 'team changed since it was loaded' using errcode = '55000';
  end if;

  update public.teams team
  set code = normalized_code, name = normalized_name, description = normalized_description
  where team.id = existing.id returning * into updated_team;

  insert into public.audit_events(actor_user_id, target_type, target_id, action, source, metadata)
  values(actor_id, 'team', updated_team.id, 'team.updated', 'operator',
    jsonb_build_object(
      'department_id', updated_team.department_id,
      'before', jsonb_build_object('code', existing.code, 'name', existing.name),
      'after', jsonb_build_object('code', updated_team.code, 'name', updated_team.name)
    ));

  return query select updated_team.id, updated_team.department_id, updated_team.code,
    updated_team.name, updated_team.description, updated_team.is_active,
    updated_team.updated_at, true;
end
$function$;

create function public.set_team_active(
  target_team_id uuid,
  requested_active boolean,
  expected_updated_at timestamptz
)
returns table (
  id uuid,
  department_id uuid,
  is_active boolean,
  updated_at timestamptz,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  existing public.teams%rowtype;
  parent public.departments%rowtype;
  updated_team public.teams%rowtype;
begin
  perform pulse_private.require_global_permission('teams.manage');
  perform pg_advisory_xact_lock(73032026082700400::bigint);
  if requested_active is null then raise exception 'team state is required' using errcode = '22023'; end if;

  select team.* into existing from public.teams team
  where team.id = target_team_id for update;
  if not found then raise exception 'team not found' using errcode = 'P0002'; end if;
  if existing.is_active = requested_active then
    return query select existing.id, existing.department_id, existing.is_active, existing.updated_at, false;
    return;
  end if;
  if expected_updated_at is null or existing.updated_at is distinct from expected_updated_at then
    raise exception 'team changed since it was loaded' using errcode = '55000';
  end if;

  select department.* into parent from public.departments department
  where department.id = existing.department_id for update;
  if requested_active and (not found or not parent.is_active) then
    raise exception 'team requires an active parent department' using errcode = '55000';
  end if;
  if not requested_active then
    if exists(select 1 from public.users target where target.team_id = existing.id and target.status in ('active', 'pending_approval')) then
      raise exception 'active or pending users still depend on this team' using errcode = '55000';
    end if;
    if exists(
      select 1 from public.user_roles assignment
      join public.users target on target.id = assignment.user_id and target.status = 'active'
      where assignment.team_id = existing.id
    ) then
      raise exception 'active scoped role assignments still depend on this team' using errcode = '55000';
    end if;
  end if;

  update public.teams team set is_active = requested_active
  where team.id = existing.id returning * into updated_team;

  insert into public.audit_events(actor_user_id, target_type, target_id, action, source, metadata)
  values(actor_id, 'team', updated_team.id,
    case when requested_active then 'team.reactivated' else 'team.deactivated' end,
    'operator', jsonb_build_object('department_id', updated_team.department_id,
      'code', updated_team.code, 'name', updated_team.name));

  return query select updated_team.id, updated_team.department_id, updated_team.is_active,
    updated_team.updated_at, true;
end
$function$;

alter function public.list_managed_departments() owner to postgres;
alter function public.list_managed_teams() owner to postgres;
alter function public.create_department(text, text, text) owner to postgres;
alter function public.update_department(uuid, timestamptz, text, text, text) owner to postgres;
alter function public.set_department_active(uuid, boolean, timestamptz) owner to postgres;
alter function public.create_team(uuid, text, text, text) owner to postgres;
alter function public.update_team(uuid, timestamptz, text, text, text) owner to postgres;
alter function public.set_team_active(uuid, boolean, timestamptz) owner to postgres;

revoke all on function public.list_managed_departments() from public, anon, service_role;
revoke all on function public.list_managed_teams() from public, anon, service_role;
revoke all on function public.create_department(text, text, text) from public, anon, service_role;
revoke all on function public.update_department(uuid, timestamptz, text, text, text) from public, anon, service_role;
revoke all on function public.set_department_active(uuid, boolean, timestamptz) from public, anon, service_role;
revoke all on function public.create_team(uuid, text, text, text) from public, anon, service_role;
revoke all on function public.update_team(uuid, timestamptz, text, text, text) from public, anon, service_role;
revoke all on function public.set_team_active(uuid, boolean, timestamptz) from public, anon, service_role;

grant execute on function public.list_managed_departments() to authenticated;
grant execute on function public.list_managed_teams() to authenticated;
grant execute on function public.create_department(text, text, text) to authenticated;
grant execute on function public.update_department(uuid, timestamptz, text, text, text) to authenticated;
grant execute on function public.set_department_active(uuid, boolean, timestamptz) to authenticated;
grant execute on function public.create_team(uuid, text, text, text) to authenticated;
grant execute on function public.update_team(uuid, timestamptz, text, text, text) to authenticated;
grant execute on function public.set_team_active(uuid, boolean, timestamptz) to authenticated;

comment on function public.list_managed_departments() is
  'Protected department administration catalog with authoritative dependency counts.';
comment on function public.list_managed_teams() is
  'Protected team administration catalog with parent and dependency information.';
comment on function public.create_department(text, text, text) is
  'Creates one normalized department and appends department.created audit evidence.';
comment on function public.update_department(uuid, timestamptz, text, text, text) is
  'Updates one department with stale-write protection and audit evidence.';
comment on function public.set_department_active(uuid, boolean, timestamptz) is
  'Activates or safely deactivates one department without deleting history.';
comment on function public.create_team(uuid, text, text, text) is
  'Creates one team under an active department and appends team.created audit evidence.';
comment on function public.update_team(uuid, timestamptz, text, text, text) is
  'Updates one team without allowing reparenting and appends audit evidence.';
comment on function public.set_team_active(uuid, boolean, timestamptz) is
  'Activates or safely deactivates one team without deleting history.';
