-- Pulse ADMIN-2B: target-bound, read-only assignable role catalog.

create function public.list_assignable_role_options(target_user_id uuid)
returns table (
  role_id uuid,
  role_key text,
  role_name text,
  scope_type text,
  department_id uuid,
  department_name text,
  team_id uuid,
  team_name text
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
  perform pulse_private.require_global_permission('roles.assign');

  select u.*
  into target
  from public.users u
  where u.id = target_user_id;

  if not found then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  -- assign_user_role rejects both cases. A valid target with no options is a
  -- safer catalog response than exposing catalog data the caller cannot use.
  if actor_id = target.id or target.status = 'pending_approval' then
    return;
  end if;

  return query
  select distinct
    grantable.id,
    grantable.key,
    grantable.name,
    rule.scope_type,
    case when rule.scope_type in ('department', 'team') then target.department_id end,
    case when rule.scope_type in ('department', 'team') then department.name end,
    case when rule.scope_type = 'team' then target.team_id end,
    case when rule.scope_type = 'team' then team.name end
  from public.user_roles actor_role
  join public.roles grantor
    on grantor.id = actor_role.role_id
   and grantor.is_active
  join public.role_grant_rules rule
    on rule.grantor_role_id = grantor.id
  join public.roles grantable
    on grantable.id = rule.grantable_role_id
   and grantable.is_active
  join public.role_scopes supported_scope
    on supported_scope.role_id = rule.grantable_role_id
   and supported_scope.scope_type = rule.scope_type
  left join public.departments department
    on department.id = target.department_id
  left join public.teams team
    on team.id = target.team_id
   and team.department_id = target.department_id
  where actor_role.user_id = actor_id
    and actor_role.scope_type = 'global'
    and (
      grantable.id <> '10000000-0000-0000-0000-000000000010'::uuid
      or pulse_private.is_active_super_admin(actor_id)
    )
    and (
      rule.scope_type = 'global'
      or (
        rule.scope_type = 'department'
        and target.department_id is not null
        and department.is_active
      )
      or (
        rule.scope_type = 'team'
        and target.department_id is not null
        and target.team_id is not null
        and department.is_active
        and team.is_active
      )
    )
    and not exists (
      select 1
      from public.user_roles existing
      where existing.user_id = target.id
        and existing.role_id = grantable.id
        and existing.scope_type = rule.scope_type
        and existing.department_id is not distinct from
          case when rule.scope_type in ('department', 'team') then target.department_id end
        and existing.team_id is not distinct from
          case when rule.scope_type = 'team' then target.team_id end
    )
  order by 3, 4;
end
$function$;

alter function public.list_assignable_role_options(uuid) owner to postgres;

revoke all on function public.list_assignable_role_options(uuid) from public, anon, service_role;
grant execute on function public.list_assignable_role_options(uuid) to authenticated;

comment on function public.list_assignable_role_options(uuid) is
  'Returns only exact target-bound role assignments the active global operator may attempt to grant.';
