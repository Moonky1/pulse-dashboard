-- Pulse ADMIN-3B: protected, target-bound pending approval catalog.

create function public.get_pending_approval_options(target_user_id uuid)
returns table (
  department_id uuid,
  department_code text,
  department_name text,
  team_id uuid,
  team_code text,
  team_name text,
  role_id uuid,
  role_key text,
  role_name text,
  scope_type text
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  target public.users%rowtype;
begin
  perform pulse_private.require_global_permission('users.view');
  perform pulse_private.require_global_permission('users.approve');
  perform pulse_private.require_global_permission('roles.assign');

  select u.*
  into target
  from public.users u
  where u.id = target_user_id;

  if not found then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  if actor_id = target.id then
    raise exception 'self-approval is not allowed' using errcode = '42501';
  end if;

  if target.status <> 'pending_approval' then
    raise exception 'target must be pending approval' using errcode = '55000';
  end if;

  if not exists (
    select 1
    from auth.users auth_user
    where auth_user.id = target.auth_user_id
      and auth_user.email_confirmed_at is not null
      and auth_user.deleted_at is null
      and (auth_user.banned_until is null or auth_user.banned_until < now())
      and lower(btrim(auth_user.email)) = target.email
  ) then
    raise exception 'target Auth identity is invalid or email does not match'
      using errcode = '23514';
  end if;

  return query
  with grantable_options as (
    select distinct
      grantable.id as role_id,
      grantable.key as role_key,
      grantable.name as role_name,
      grant_rule.scope_type
    from public.user_roles actor_assignment
    join public.roles grantor_role
      on grantor_role.id = actor_assignment.role_id
     and grantor_role.is_active
    join public.role_grant_rules grant_rule
      on grant_rule.grantor_role_id = grantor_role.id
    join public.roles grantable
      on grantable.id = grant_rule.grantable_role_id
     and grantable.is_active
    join public.role_scopes supported_scope
      on supported_scope.role_id = grant_rule.grantable_role_id
     and supported_scope.scope_type = grant_rule.scope_type
    where actor_assignment.user_id = actor_id
      and actor_assignment.scope_type = 'global'
      and (
        grantable.id <> '10000000-0000-0000-0000-000000000010'::uuid
        or pulse_private.is_active_super_admin(actor_id)
      )
  ),
  active_placements as (
    select
      department.id as department_id,
      department.code as department_code,
      department.name as department_name,
      null::uuid as team_id,
      null::text as team_code,
      null::text as team_name
    from public.departments department
    where department.is_active

    union all

    select
      department.id,
      department.code,
      department.name,
      team.id,
      team.code,
      team.name
    from public.departments department
    join public.teams team
      on team.department_id = department.id
     and team.is_active
    where department.is_active
  )
  select
    placement.department_id,
    placement.department_code,
    placement.department_name,
    placement.team_id,
    placement.team_code,
    placement.team_name,
    grantable.role_id,
    grantable.role_key,
    grantable.role_name,
    grantable.scope_type
  from active_placements placement
  cross join grantable_options grantable
  where (grantable.scope_type <> 'team' or placement.team_id is not null)
    and not exists (
      select 1
      from public.user_roles existing
      where existing.user_id = target.id
        and existing.role_id = grantable.role_id
        and existing.scope_type = grantable.scope_type
        and existing.department_id is not distinct from
          case when grantable.scope_type in ('department', 'team')
            then placement.department_id end
        and existing.team_id is not distinct from
          case when grantable.scope_type = 'team' then placement.team_id end
    )
  order by
    placement.department_name,
    placement.team_name nulls first,
    grantable.role_name,
    grantable.scope_type;
end
$function$;

alter function public.get_pending_approval_options(uuid) owner to postgres;

revoke all on function public.get_pending_approval_options(uuid) from public, anon, service_role;
grant execute on function public.get_pending_approval_options(uuid) to authenticated;

comment on function public.get_pending_approval_options(uuid) is
  'Returns exact active department, optional team, and grantable initial role combinations for one eligible pending user.';
