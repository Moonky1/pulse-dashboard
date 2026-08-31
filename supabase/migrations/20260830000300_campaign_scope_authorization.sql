-- Pulse Foundation V2 ADMIN-6B: atomic Campaign authorization scope.
--
-- This migration extends the complete canonical authorization chain from
-- Global / Department / Team to Global / Department / Campaign / Team.
-- Campaign authorization is independent from employment organization and
-- does not create an operational assignment.

alter table public.role_scopes
  drop constraint role_scopes_scope_valid;

alter table public.role_scopes
  add constraint role_scopes_scope_valid
  check (scope_type in ('global', 'department', 'campaign', 'team'));

insert into public.role_scopes(role_id, scope_type)
select role.id, 'campaign'
from public.roles role
where role.key in ('qa', 'supervisor');

-- Extend only grantors that already grant these exact target roles under
-- existing Department/Team scopes. No new grantor role is introduced.
insert into public.role_grant_rules(grantor_role_id, grantable_role_id, scope_type)
select grantor.id, grantable.id, 'campaign'
from public.roles grantor
cross join public.roles grantable
where grantor.key in ('super_admin', 'admin', 'human_resources')
  and grantable.key in ('qa', 'supervisor');

update public.roles
set description = case key
  when 'qa' then 'Department-, Campaign-, or Team-scoped quality access.'
  when 'supervisor' then 'Department-, Campaign-, or Team-scoped supervisory access.'
end
where key in ('qa', 'supervisor');

alter table public.user_roles
  add column campaign_id uuid;

alter table public.user_roles
  drop constraint user_roles_team_department_fk,
  drop constraint user_roles_scope_valid;

-- Existing Team assignments are preserved by their canonical Team ID. The
-- duplicate Department identity is removed before enforcing the one-target
-- scope model.
update public.user_roles
set department_id = null
where scope_type = 'team';

alter table public.user_roles
  add constraint user_roles_campaign_fk
    foreign key (campaign_id) references public.campaigns(id)
    on update restrict on delete restrict,
  add constraint user_roles_team_fk
    foreign key (team_id) references public.teams(id)
    on update restrict on delete restrict,
  add constraint user_roles_scope_valid check (
    (scope_type = 'global' and department_id is null and campaign_id is null and team_id is null)
    or (scope_type = 'department' and department_id is not null and campaign_id is null and team_id is null)
    or (scope_type = 'campaign' and department_id is null and campaign_id is not null and team_id is null)
    or (scope_type = 'team' and department_id is null and campaign_id is null and team_id is not null)
  );

create unique index user_roles_campaign_unique
  on public.user_roles(user_id, role_id, campaign_id)
  where scope_type = 'campaign';
create index user_roles_campaign_idx on public.user_roles(campaign_id);

comment on column public.user_roles.campaign_id is
  'Exact Campaign authorization target. It is not an employment or operational assignment.';

-- Four-context canonical helper. Team relationships are resolved from the
-- database, so a supplied Campaign/Team mismatch cannot create authority.
create function pulse_private.has_permission(
  requested_permission text,
  requested_department_id uuid,
  requested_campaign_id uuid,
  requested_team_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.users caller
    join public.user_roles assignment on assignment.user_id = caller.id
    join public.roles role on role.id = assignment.role_id and role.is_active
    join public.role_permissions role_permission on role_permission.role_id = role.id
    join public.permissions permission
      on permission.id = role_permission.permission_id
     and permission.is_active
    left join public.teams resource_team on resource_team.id = requested_team_id
    left join public.campaigns assigned_campaign
      on assigned_campaign.id = assignment.campaign_id
     and assigned_campaign.is_active
    left join public.campaigns resource_campaign
      on resource_campaign.id = case
        when requested_team_id is not null then resource_team.campaign_id
        else requested_campaign_id
      end
     and resource_campaign.is_active
    where caller.auth_user_id = auth.uid()
      and caller.status = 'active'
      and permission.key = requested_permission
      and (
        assignment.scope_type = 'global'
        or (
          assignment.scope_type = 'department'
          and (requested_campaign_id is null or requested_team_id is not null)
          and assignment.department_id = case
            when requested_team_id is not null then resource_team.department_id
            else coalesce(requested_department_id, caller.department_id)
          end
          and (
            requested_team_id is null
            or resource_team.id is not null
              and (requested_department_id is null or resource_team.department_id = requested_department_id)
              and (requested_campaign_id is null or resource_team.campaign_id = requested_campaign_id)
          )
        )
        or (
          assignment.scope_type = 'campaign'
          and assigned_campaign.id is not null
          and resource_campaign.id = assignment.campaign_id
          and (requested_team_id is null or resource_team.is_active)
          and (requested_campaign_id is null or resource_campaign.id = requested_campaign_id)
        )
        or (
          assignment.scope_type = 'team'
          and (requested_campaign_id is null or requested_team_id is not null)
          and assignment.team_id = coalesce(requested_team_id, caller.team_id)
          and (
            requested_team_id is null
            or resource_team.id is not null
              and (requested_department_id is null or resource_team.department_id = requested_department_id)
              and (requested_campaign_id is null or resource_team.campaign_id = requested_campaign_id)
          )
        )
      )
  )
$function$;

alter function pulse_private.has_permission(text,uuid,uuid,uuid) owner to postgres;
revoke all on function pulse_private.has_permission(text,uuid,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function pulse_private.has_permission(text,uuid,uuid,uuid) to authenticated;

-- Compatibility wrapper for every deployed three-context caller and RLS
-- policy. It preserves existing Global/Department/Team call behavior.
create or replace function pulse_private.has_permission(
  requested_permission text,
  requested_department_id uuid default null,
  requested_team_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select pulse_private.has_permission(
    requested_permission,
    requested_department_id,
    null::uuid,
    requested_team_id
  )
$function$;

alter function pulse_private.has_permission(text,uuid,uuid) owner to postgres;
revoke all on function pulse_private.has_permission(text,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function pulse_private.has_permission(text,uuid,uuid) to authenticated;

drop policy user_roles_self_or_authorized_read on public.user_roles;
create policy user_roles_self_or_authorized_read
on public.user_roles for select to authenticated
using (
  (
    pulse_private.current_user_is_active()
    and user_id = pulse_private.current_user_id()
  )
  or pulse_private.has_permission('users.view', department_id, campaign_id, team_id)
);

create or replace function public.list_managed_users(requested_status text default null)
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
  roles jsonb
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('users.view');
  if requested_status is not null
     and requested_status not in ('pending_approval', 'active', 'blocked', 'inactive') then
    raise exception 'invalid user status filter' using errcode = '22023';
  end if;

  return query
  select target.id, target.email, target.full_name, target.display_name,
         target.employee_id, target.status, target.department_id, target.team_id,
         (auth_user.email_confirmed_at is not null and auth_user.deleted_at is null),
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'user_role_id', assignment.id,
             'role_id', assignment.role_id,
             'role_key', role.key,
             'role_name', role.name,
             'scope_type', assignment.scope_type,
             'department_id', assignment.department_id,
             'campaign_id', assignment.campaign_id,
             'campaign_code', campaign.code,
             'campaign_name', campaign.name,
             'team_id', assignment.team_id
           ) order by role.key, assignment.scope_type, campaign.name)
           from public.user_roles assignment
           join public.roles role on role.id = assignment.role_id
           left join public.campaigns campaign on campaign.id = assignment.campaign_id
           where assignment.user_id = target.id
         ), '[]'::jsonb)
  from public.users target
  join auth.users auth_user on auth_user.id = target.auth_user_id
  where requested_status is null or target.status = requested_status
  order by target.created_at, target.id;
end
$function$;

drop function public.list_assignable_role_options(uuid);

create function public.list_assignable_role_options(target_user_id uuid)
returns table (
  role_id uuid,
  role_key text,
  role_name text,
  scope_type text,
  department_id uuid,
  department_name text,
  team_id uuid,
  team_name text,
  campaign_id uuid,
  campaign_code text,
  campaign_name text
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

  select * into target from public.users target_user where target_user.id=target_user_id;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  if actor_id=target.id or target.status='pending_approval' then return; end if;

  return query
  with grantable as (
    select distinct role.id, role.key, role.name, rule.scope_type
    from public.user_roles actor_assignment
    join public.roles grantor on grantor.id=actor_assignment.role_id and grantor.is_active
    join public.role_grant_rules rule on rule.grantor_role_id=grantor.id
    join public.roles role on role.id=rule.grantable_role_id and role.is_active
    join public.role_scopes supported
      on supported.role_id=rule.grantable_role_id and supported.scope_type=rule.scope_type
    where actor_assignment.user_id=actor_id
      and actor_assignment.scope_type='global'
      and (
        role.id<>'10000000-0000-0000-0000-000000000010'::uuid
        or pulse_private.is_active_super_admin(actor_id)
      )
  ), options as (
    select
      grantable.id as role_id,
      grantable.key as role_key,
      grantable.name as role_name,
      grantable.scope_type,
      case when grantable.scope_type='department' then target.department_id end as department_id,
      case when grantable.scope_type in ('department','team') then department.name end as department_name,
      case when grantable.scope_type='team' then target.team_id end as team_id,
      case when grantable.scope_type='team' then team.name end as team_name,
      null::uuid as campaign_id,
      null::text as campaign_code,
      null::text as campaign_name
    from grantable
    left join public.departments department on department.id=target.department_id
    left join public.teams team on team.id=target.team_id and team.department_id=target.department_id
    where grantable.scope_type in ('global','department','team')
      and (
        grantable.scope_type='global'
        or grantable.scope_type='department'
          and target.department_id is not null and department.is_active
        or grantable.scope_type='team'
          and target.team_id is not null and department.is_active and team.is_active
      )

    union all

    select
      grantable.id,
      grantable.key,
      grantable.name,
      grantable.scope_type,
      null::uuid,
      null::text,
      null::uuid,
      null::text,
      campaign.id,
      campaign.code,
      campaign.name
    from grantable
    cross join public.campaigns campaign
    where grantable.scope_type='campaign' and campaign.is_active
  )
  select
    option.role_id,option.role_key,option.role_name,option.scope_type,
    option.department_id,option.department_name,option.team_id,option.team_name,
    option.campaign_id,option.campaign_code,option.campaign_name
  from options option
  where not exists (
    select 1 from public.user_roles existing
    where existing.user_id=target.id
      and existing.role_id=option.role_id
      and existing.scope_type=option.scope_type
      and existing.department_id is not distinct from option.department_id
      and existing.campaign_id is not distinct from option.campaign_id
      and existing.team_id is not distinct from option.team_id
  )
  order by option.role_name,option.scope_type,option.campaign_name nulls first,option.team_name nulls first;
end
$function$;

alter function public.list_assignable_role_options(uuid) owner to postgres;
revoke all on function public.list_assignable_role_options(uuid) from public,anon,service_role;
grant execute on function public.list_assignable_role_options(uuid) to authenticated;

drop function public.get_pending_approval_options(uuid);

create function public.get_pending_approval_options(target_user_id uuid)
returns table (
  department_id uuid,
  department_code text,
  department_name text,
  team_id uuid,
  team_code text,
  team_name text,
  campaign_id uuid,
  campaign_code text,
  campaign_name text,
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

  select * into target from public.users target_user where target_user.id=target_user_id;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  if actor_id=target.id then raise exception 'self-approval is not allowed' using errcode='42501'; end if;
  if target.status<>'pending_approval' then raise exception 'target must be pending approval' using errcode='55000'; end if;
  if not exists(
    select 1 from auth.users auth_user
    where auth_user.id=target.auth_user_id
      and auth_user.email_confirmed_at is not null
      and auth_user.deleted_at is null
      and (auth_user.banned_until is null or auth_user.banned_until<now())
      and lower(btrim(auth_user.email))=target.email
  ) then raise exception 'target Auth identity is invalid or email does not match' using errcode='23514'; end if;

  return query
  with grantable as (
    select distinct role.id,role.key,role.name,rule.scope_type
    from public.user_roles actor_assignment
    join public.roles grantor on grantor.id=actor_assignment.role_id and grantor.is_active
    join public.role_grant_rules rule on rule.grantor_role_id=grantor.id
    join public.roles role on role.id=rule.grantable_role_id and role.is_active
    join public.role_scopes supported on supported.role_id=rule.grantable_role_id and supported.scope_type=rule.scope_type
    where actor_assignment.user_id=actor_id
      and actor_assignment.scope_type='global'
      and (
        role.id<>'10000000-0000-0000-0000-000000000010'::uuid
        or pulse_private.is_active_super_admin(actor_id)
      )
  ), authorization_options as (
    select
      grantable.id as role_id,grantable.key as role_key,grantable.name as role_name,
      grantable.scope_type,null::uuid as campaign_id,null::text as campaign_code,null::text as campaign_name
    from grantable where grantable.scope_type<>'campaign'

    union all

    select
      grantable.id,grantable.key,grantable.name,grantable.scope_type,
      campaign.id,campaign.code,campaign.name
    from grantable
    cross join public.campaigns campaign
    where grantable.scope_type='campaign' and campaign.is_active
  ), active_placements as (
    select
      department.id as department_id,department.code as department_code,department.name as department_name,
      null::uuid as team_id,null::text as team_code,null::text as team_name
    from public.departments department where department.is_active

    union all

    select department.id,department.code,department.name,team.id,team.code,team.name
    from public.departments department
    join public.teams team on team.department_id=department.id and team.is_active
    where department.is_active
  )
  select
    placement.department_id,placement.department_code,placement.department_name,
    placement.team_id,placement.team_code,placement.team_name,
    option_row.campaign_id,option_row.campaign_code,option_row.campaign_name,
    option_row.role_id,option_row.role_key,option_row.role_name,option_row.scope_type
  from active_placements placement
  cross join authorization_options option_row
  where (option_row.scope_type<>'team' or placement.team_id is not null)
    and not exists(
      select 1 from public.user_roles existing
      where existing.user_id=target.id
        and existing.role_id=option_row.role_id
        and existing.scope_type=option_row.scope_type
        and existing.department_id is not distinct from
          case when option_row.scope_type='department' then placement.department_id end
        and existing.campaign_id is not distinct from option_row.campaign_id
        and existing.team_id is not distinct from
          case when option_row.scope_type='team' then placement.team_id end
    )
  order by placement.department_name,placement.team_name nulls first,
    option_row.role_name,option_row.scope_type,option_row.campaign_name nulls first;
end
$function$;

alter function public.get_pending_approval_options(uuid) owner to postgres;
revoke all on function public.get_pending_approval_options(uuid) from public,anon,service_role;
grant execute on function public.get_pending_approval_options(uuid) to authenticated;

create or replace function public.approve_pending_user(
  target_user_id uuid,
  selected_department_id uuid,
  selected_team_id uuid,
  requested_roles jsonb
)
returns table (
  id uuid,
  employee_id text,
  status text,
  department_id uuid,
  team_id uuid,
  approved_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  caller_auth_user_id uuid := auth.uid();
  approver public.users%rowtype;
  target public.users%rowtype;
  target_auth_email text;
  generated_employee_id text;
  requested_role jsonb;
  requested_role_id uuid;
  requested_scope_type text;
  requested_campaign_id uuid;
  validated_roles jsonb := '[]'::jsonb;
  role_count integer := 0;
begin
  if caller_auth_user_id is null then raise exception 'authentication required' using errcode='28000'; end if;
  select * into approver from public.users caller
  where caller.auth_user_id=caller_auth_user_id and caller.status='active';
  if not found then raise exception 'active Pulse approver required' using errcode='42501'; end if;
  if approver.id=target_user_id then raise exception 'self-approval is not allowed' using errcode='42501'; end if;

  if not exists(
    select 1 from public.user_roles assignment
    join public.roles role on role.id=assignment.role_id and role.is_active
    join public.role_permissions role_permission on role_permission.role_id=role.id
    join public.permissions permission on permission.id=role_permission.permission_id and permission.is_active
    where assignment.user_id=approver.id and assignment.scope_type='global' and permission.key='users.approve'
  ) or not exists(
    select 1 from public.user_roles assignment
    join public.roles role on role.id=assignment.role_id and role.is_active
    join public.role_permissions role_permission on role_permission.role_id=role.id
    join public.permissions permission on permission.id=role_permission.permission_id and permission.is_active
    where assignment.user_id=approver.id and assignment.scope_type='global' and permission.key='roles.assign'
  ) then raise exception 'global users.approve and roles.assign are required' using errcode='42501'; end if;

  select * into target from public.users target_user where target_user.id=target_user_id for update;
  if not found or target.status<>'pending_approval' then raise exception 'target must be pending approval' using errcode='55000'; end if;
  select lower(btrim(auth_user.email)) into target_auth_email
  from auth.users auth_user
  where auth_user.id=target.auth_user_id
    and auth_user.email_confirmed_at is not null
    and auth_user.deleted_at is null
    and (auth_user.banned_until is null or auth_user.banned_until<now());
  if target_auth_email is null or target_auth_email<>target.email then raise exception 'target Auth identity is invalid or email does not match' using errcode='23514'; end if;

  perform 1 from public.departments department
  where department.id=selected_department_id and department.is_active for share;
  if not found then raise exception 'selected department is missing or inactive' using errcode='23503'; end if;
  if selected_team_id is not null then
    perform 1 from public.teams team
    where team.id=selected_team_id and team.department_id=selected_department_id and team.is_active for share;
    if not found then raise exception 'selected team is missing, inactive, or outside the department' using errcode='23503'; end if;
  end if;

  if jsonb_typeof(requested_roles)<>'array' or jsonb_array_length(requested_roles) not between 1 and 10 then
    raise exception 'requested_roles must be an array containing 1 to 10 assignments' using errcode='22023';
  end if;

  for requested_role in select value from jsonb_array_elements(requested_roles)
  loop
    if jsonb_typeof(requested_role)<>'object'
       or requested_role - array['role_id','scope_type','campaign_id']<>'{}'::jsonb
       or not (requested_role ?& array['role_id','scope_type']) then
      raise exception 'each requested role must contain role_id, scope_type, and only an optional campaign_id' using errcode='22023';
    end if;
    begin
      requested_role_id := (requested_role->>'role_id')::uuid;
      requested_campaign_id := case
        when nullif(requested_role->>'campaign_id','') is null then null
        else (requested_role->>'campaign_id')::uuid
      end;
    exception when invalid_text_representation then
      raise exception 'requested role and campaign IDs must be UUIDs' using errcode='22023';
    end;
    requested_scope_type := requested_role->>'scope_type';

    perform 1 from public.roles role
    join public.role_scopes supported on supported.role_id=role.id and supported.scope_type=requested_scope_type
    where role.id=requested_role_id and role.is_active for share of role,supported;
    if not found then raise exception 'requested role is inactive or invalid for its scope' using errcode='23503'; end if;

    if requested_scope_type not in ('global','department','campaign','team') then
      raise exception 'invalid role scope' using errcode='22023';
    end if;
    if requested_scope_type='team' and selected_team_id is null then
      raise exception 'team-scoped roles require a selected team' using errcode='23514';
    end if;
    if requested_scope_type='campaign' and requested_campaign_id is null then
      raise exception 'campaign-scoped roles require an exact campaign' using errcode='23514';
    end if;
    if requested_scope_type<>'campaign' and requested_campaign_id is not null then
      raise exception 'only campaign-scoped roles accept a campaign ID' using errcode='23514';
    end if;
    if requested_scope_type='campaign' and not exists(
      select 1 from public.campaigns campaign where campaign.id=requested_campaign_id and campaign.is_active
    ) then raise exception 'selected campaign is missing or inactive' using errcode='23503'; end if;

    if not exists(
      select 1 from public.user_roles grantor_assignment
      join public.roles grantor_role on grantor_role.id=grantor_assignment.role_id and grantor_role.is_active
      join public.role_grant_rules rule
        on rule.grantor_role_id=grantor_role.id
       and rule.grantable_role_id=requested_role_id
       and rule.scope_type=requested_scope_type
      where grantor_assignment.user_id=approver.id and grantor_assignment.scope_type='global'
    ) then raise exception 'approver is not allowed to grant the requested role and scope' using errcode='42501'; end if;

    if exists(
      select 1 from jsonb_array_elements(validated_roles) validated
      where (validated->>'role_id')::uuid=requested_role_id
        and validated->>'scope_type'=requested_scope_type
    ) then raise exception 'duplicate requested role assignments are not allowed' using errcode='23505'; end if;

    validated_roles := validated_roles || jsonb_build_array(jsonb_build_object(
      'role_id',requested_role_id,
      'scope_type',requested_scope_type,
      'department_id',case when requested_scope_type='department' then selected_department_id end,
      'campaign_id',requested_campaign_id,
      'team_id',case when requested_scope_type='team' then selected_team_id end
    ));
    role_count := role_count+1;
  end loop;

  generated_employee_id := pulse_private.next_employee_id();
  insert into public.user_roles(user_id,role_id,scope_type,department_id,campaign_id,team_id,assigned_by_user_id)
  select target.id,requested.role_id,requested.scope_type,requested.department_id,
    requested.campaign_id,requested.team_id,approver.id
  from jsonb_to_recordset(validated_roles) as requested(
    role_id uuid,scope_type text,department_id uuid,campaign_id uuid,team_id uuid
  );

  update public.users target_user
  set employee_id=generated_employee_id,
      department_id=selected_department_id,
      team_id=selected_team_id,
      status='active'
  where target_user.id=target.id
  returning target_user.* into target;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(approver.id,'user',target.id,'account.approved','database',jsonb_build_object(
    'department_id',selected_department_id,
    'team_id',selected_team_id,
    'employee_id',generated_employee_id,
    'role_count',role_count
  ));

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  select approver.id,'user',target.id,'role.assigned','database',jsonb_build_object(
    'role_id',requested.role_id,
    'scope_type',requested.scope_type,
    'department_id',requested.department_id,
    'campaign_id',requested.campaign_id,
    'team_id',requested.team_id
  ) from jsonb_to_recordset(validated_roles) as requested(
    role_id uuid,scope_type text,department_id uuid,campaign_id uuid,team_id uuid
  );

  return query select target.id,target.employee_id,target.status,target.department_id,target.team_id,target.approved_at;
end
$function$;

alter function public.approve_pending_user(uuid,uuid,uuid,jsonb) owner to postgres;
revoke all on function public.approve_pending_user(uuid,uuid,uuid,jsonb) from public,anon,service_role;
grant execute on function public.approve_pending_user(uuid,uuid,uuid,jsonb) to authenticated;

create or replace function public.list_audit_events(
  requested_limit integer default 25,
  before_occurred_at timestamptz default null,
  before_event_id uuid default null,
  requested_category text default null,
  requested_action text default null,
  requested_actor_user_id uuid default null,
  requested_target_type text default null,
  requested_target_id uuid default null,
  occurred_from timestamptz default null,
  occurred_to timestamptz default null
)
returns table (
  event_id uuid,
  action text,
  category text,
  source text,
  occurred_at timestamptz,
  actor_user_id uuid,
  actor_full_name text,
  actor_display_name text,
  actor_employee_id text,
  target_type text,
  target_id uuid,
  target_name text,
  target_employee_id text,
  role_id uuid,
  role_name text,
  scope_type text,
  department_id uuid,
  department_name text,
  team_id uuid,
  team_name text,
  reason text,
  safe_metadata jsonb,
  has_more boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  page_size integer := coalesce(requested_limit,25);
  normalized_category text := nullif(lower(btrim(requested_category)),'');
  normalized_action text := nullif(lower(btrim(requested_action)),'');
  normalized_target_type text := nullif(lower(btrim(requested_target_type)),'');
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('audit.view');
  if page_size<1 or page_size>100 then raise exception 'requested_limit must be between 1 and 100' using errcode='22023'; end if;
  if (before_occurred_at is null)<>(before_event_id is null) then raise exception 'audit cursor requires both timestamp and event id' using errcode='22023'; end if;
  if normalized_category is not null and normalized_category not in ('account','roles','organization','system') then raise exception 'unsupported audit category' using errcode='22023'; end if;
  if normalized_action is not null and normalized_action!~'^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then raise exception 'invalid audit action' using errcode='22023'; end if;
  if normalized_target_type is not null and normalized_target_type not in ('user','department','campaign','team','role') then raise exception 'unsupported audit target type' using errcode='22023'; end if;
  if normalized_target_type is null and requested_target_id is not null then raise exception 'target id requires target type' using errcode='22023'; end if;
  if occurred_from is not null and occurred_to is not null and occurred_from>occurred_to then raise exception 'invalid audit date range' using errcode='22023'; end if;

  return query
  with candidates as (
    select
      audit.id,
      audit.action,
      case
        when audit.action like 'account.%' then 'account'
        when audit.action like 'role.%' then 'roles'
        when audit.action like 'department.%' or audit.action like 'campaign.%' or audit.action like 'team.%' then 'organization'
        else 'system'
      end as event_category,
      audit.source,
      audit.occurred_at,
      audit.actor_user_id,
      actor.full_name as actor_full_name,
      actor.display_name as actor_display_name,
      actor.employee_id as actor_employee_id,
      audit.target_type,
      audit.target_id,
      coalesce(target_user.full_name,target_department.name,target_campaign.name,target_team.name,
        nullif(left(audit.metadata->>'name',160),''),audit.target_type) as target_name,
      target_user.employee_id as target_employee_id,
      target_role.id as role_id,
      target_role.name as role_name,
      case when audit.metadata->>'scope_type' in ('global','department','campaign','team')
        then audit.metadata->>'scope_type' end as scope_type,
      metadata_department.id as department_id,
      metadata_department.name as department_name,
      metadata_team.id as team_id,
      metadata_team.name as team_name,
      nullif(left(btrim(audit.metadata->>'reason'),500),'') as reason,
      jsonb_strip_nulls(jsonb_build_object(
        'previous_status',case when audit.metadata->>'previous_status' in ('pending_approval','active','blocked','inactive') then audit.metadata->>'previous_status' end,
        'scope_type',case when audit.metadata->>'scope_type' in ('global','department','campaign','team') then audit.metadata->>'scope_type' end,
        'campaign_code',metadata_campaign.code,
        'campaign_name',metadata_campaign.name,
        'code',nullif(left(audit.metadata->>'code',120),''),
        'name',nullif(left(audit.metadata->>'name',160),''),
        'before',case when jsonb_typeof(audit.metadata->'before')='object' then jsonb_strip_nulls(jsonb_build_object(
          'code',nullif(left(audit.metadata#>>'{before,code}',120),''),
          'name',nullif(left(audit.metadata#>>'{before,name}',160),'')
        )) end,
        'after',case when jsonb_typeof(audit.metadata->'after')='object' then jsonb_strip_nulls(jsonb_build_object(
          'code',nullif(left(audit.metadata#>>'{after,code}',120),''),
          'name',nullif(left(audit.metadata#>>'{after,name}',160),'')
        )) end
      )) as safe_metadata,
      row_number() over(order by audit.occurred_at desc,audit.id desc) as row_number
    from public.audit_events audit
    left join public.users actor on actor.id=audit.actor_user_id
    left join public.users target_user on audit.target_type='user' and target_user.id=audit.target_id
    left join public.departments target_department on audit.target_type='department' and target_department.id=audit.target_id
    left join public.campaigns target_campaign on audit.target_type='campaign' and target_campaign.id=audit.target_id
    left join public.teams target_team on audit.target_type='team' and target_team.id=audit.target_id
    left join public.roles target_role on target_role.id::text=audit.metadata->>'role_id'
    left join public.departments metadata_department on metadata_department.id::text=case
      when audit.target_type='department' then audit.target_id::text else audit.metadata->>'department_id' end
    left join public.campaigns metadata_campaign on metadata_campaign.id::text=case
      when audit.target_type='campaign' then audit.target_id::text else audit.metadata->>'campaign_id' end
    left join public.teams metadata_team on metadata_team.id::text=case
      when audit.target_type='team' then audit.target_id::text else audit.metadata->>'team_id' end
    where (normalized_category is null or normalized_category=case
        when audit.action like 'account.%' then 'account'
        when audit.action like 'role.%' then 'roles'
        when audit.action like 'department.%' or audit.action like 'campaign.%' or audit.action like 'team.%' then 'organization'
        else 'system'
      end)
      and (normalized_action is null or audit.action=normalized_action)
      and (requested_actor_user_id is null or audit.actor_user_id=requested_actor_user_id)
      and (normalized_target_type is null or audit.target_type=normalized_target_type)
      and (requested_target_id is null or audit.target_id=requested_target_id)
      and (occurred_from is null or audit.occurred_at>=occurred_from)
      and (occurred_to is null or audit.occurred_at<=occurred_to)
      and (before_occurred_at is null or (audit.occurred_at,audit.id)<(before_occurred_at,before_event_id))
    order by audit.occurred_at desc,audit.id desc
    limit page_size+1
  )
  select
    candidate.id,candidate.action,candidate.event_category,candidate.source,candidate.occurred_at,
    candidate.actor_user_id,candidate.actor_full_name,candidate.actor_display_name,candidate.actor_employee_id,
    candidate.target_type,candidate.target_id,candidate.target_name,candidate.target_employee_id,
    candidate.role_id,candidate.role_name,candidate.scope_type,
    candidate.department_id,candidate.department_name,candidate.team_id,candidate.team_name,
    candidate.reason,candidate.safe_metadata,
    exists(select 1 from candidates overflow where overflow.row_number>page_size)
  from candidates candidate
  where candidate.row_number<=page_size
  order by candidate.occurred_at desc,candidate.id desc;
end
$function$;

-- Canonical six-argument assignment contract. Every scope carries exactly one
-- server-validated target identifier.
create function public.assign_user_role(
  target_user_id uuid,
  requested_role_id uuid,
  requested_scope_type text,
  requested_department_id uuid,
  requested_campaign_id uuid,
  requested_team_id uuid
)
returns table (user_role_id uuid, created boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('roles.assign');
  target public.users%rowtype;
  existing_id uuid;
  new_id uuid;
begin
  if actor_id=target_user_id then raise exception 'self role changes are not allowed' using errcode='42501'; end if;
  select * into target from public.users target_user where target_user.id=target_user_id for update;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  if target.status='pending_approval' then raise exception 'pending roles are assigned only through approval' using errcode='55000'; end if;
  if requested_scope_type not in ('global','department','campaign','team') then raise exception 'invalid role scope' using errcode='22023'; end if;
  if not exists(
    select 1 from public.roles role
    join public.role_scopes supported on supported.role_id=role.id and supported.scope_type=requested_scope_type
    where role.id=requested_role_id and role.is_active
  ) then raise exception 'requested role is inactive or invalid for scope' using errcode='23503'; end if;
  if requested_role_id='10000000-0000-0000-0000-000000000010'::uuid
     and not pulse_private.is_active_super_admin(actor_id) then
    raise exception 'only a Super Admin may grant the Super Admin role' using errcode='42501';
  end if;
  if not exists(
    select 1 from public.user_roles actor_assignment
    join public.roles actor_role on actor_role.id=actor_assignment.role_id and actor_role.is_active
    join public.role_grant_rules rule
      on rule.grantor_role_id=actor_role.id
     and rule.grantable_role_id=requested_role_id
     and rule.scope_type=requested_scope_type
    where actor_assignment.user_id=actor_id and actor_assignment.scope_type='global'
  ) then raise exception 'actor cannot grant requested role and scope' using errcode='42501'; end if;

  if requested_scope_type='global'
     and (requested_department_id is not null or requested_campaign_id is not null or requested_team_id is not null) then
    raise exception 'global role cannot have scope IDs' using errcode='23514';
  end if;
  if requested_scope_type='department'
     and (requested_department_id is null or requested_campaign_id is not null or requested_team_id is not null) then
    raise exception 'department role requires only a department ID' using errcode='23514';
  end if;
  if requested_scope_type='campaign'
     and (requested_department_id is not null or requested_campaign_id is null or requested_team_id is not null) then
    raise exception 'campaign role requires only a campaign ID' using errcode='23514';
  end if;
  if requested_scope_type='team'
     and (requested_department_id is not null or requested_campaign_id is not null or requested_team_id is null) then
    raise exception 'team role requires only a team ID' using errcode='23514';
  end if;

  if requested_scope_type='department' and requested_department_id is distinct from target.department_id then
    raise exception 'department role must match target employment department' using errcode='23514';
  end if;
  if requested_scope_type='department' and not exists(
    select 1 from public.departments department where department.id=requested_department_id and department.is_active
  ) then raise exception 'requested department is missing or inactive' using errcode='23503'; end if;
  if requested_scope_type='campaign' and not exists(
    select 1 from public.campaigns campaign where campaign.id=requested_campaign_id and campaign.is_active
  ) then raise exception 'requested campaign is missing or inactive' using errcode='23503'; end if;
  if requested_scope_type='team' and requested_team_id is distinct from target.team_id then
    raise exception 'team role must match target employment team' using errcode='23514';
  end if;
  if requested_scope_type='team' and not exists(
    select 1 from public.teams team
    where team.id=requested_team_id
      and team.department_id=target.department_id
      and team.is_active
  ) then raise exception 'requested team is missing, inactive, or outside target department' using errcode='23503'; end if;

  select assignment.id into existing_id
  from public.user_roles assignment
  where assignment.user_id=target.id
    and assignment.role_id=requested_role_id
    and assignment.scope_type=requested_scope_type
    and assignment.department_id is not distinct from requested_department_id
    and assignment.campaign_id is not distinct from requested_campaign_id
    and assignment.team_id is not distinct from requested_team_id;
  if existing_id is not null then return query select existing_id,false; return; end if;

  insert into public.user_roles(
    user_id,role_id,scope_type,department_id,campaign_id,team_id,assigned_by_user_id
  ) values(
    target.id,requested_role_id,requested_scope_type,requested_department_id,
    requested_campaign_id,requested_team_id,actor_id
  ) on conflict do nothing returning id into new_id;

  if new_id is null then
    select assignment.id into new_id
    from public.user_roles assignment
    where assignment.user_id=target.id
      and assignment.role_id=requested_role_id
      and assignment.scope_type=requested_scope_type
      and assignment.department_id is not distinct from requested_department_id
      and assignment.campaign_id is not distinct from requested_campaign_id
      and assignment.team_id is not distinct from requested_team_id;
    return query select new_id,false;
    return;
  end if;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'role.assigned','operator',jsonb_build_object(
    'user_role_id',new_id,
    'role_id',requested_role_id,
    'scope_type',requested_scope_type,
    'department_id',requested_department_id,
    'campaign_id',requested_campaign_id,
    'team_id',requested_team_id
  ));
  return query select new_id,true;
end
$function$;

-- Existing five-argument callers remain compatible. Team Department input is
-- verified, then normalized to the canonical Team-only assignment shape.
create or replace function public.assign_user_role(
  target_user_id uuid,
  requested_role_id uuid,
  requested_scope_type text,
  requested_department_id uuid default null,
  requested_team_id uuid default null
)
returns table (user_role_id uuid, created boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if requested_scope_type='team' and not exists(
    select 1 from public.teams team
    where team.id=requested_team_id
      and team.department_id=requested_department_id
  ) then raise exception 'requested team is outside supplied department' using errcode='23514'; end if;

  return query select * from public.assign_user_role(
    target_user_id,
    requested_role_id,
    requested_scope_type,
    case when requested_scope_type='department' then requested_department_id end,
    null::uuid,
    requested_team_id
  );
end
$function$;

create or replace function public.remove_user_role(target_user_id uuid, target_user_role_id uuid)
returns table (user_role_id uuid, removed boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('roles.assign');
  target public.users%rowtype;
  assignment public.user_roles%rowtype;
begin
  if actor_id=target_user_id then raise exception 'self role changes are not allowed' using errcode='42501'; end if;
  select * into target from public.users target_user where target_user.id=target_user_id for update;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  select * into assignment from public.user_roles current_assignment
  where current_assignment.id=target_user_role_id and current_assignment.user_id=target.id
  for update;
  if not found then return query select target_user_role_id,false; return; end if;
  if not exists(
    select 1 from public.user_roles actor_assignment
    join public.roles actor_role on actor_role.id=actor_assignment.role_id and actor_role.is_active
    join public.role_grant_rules rule
      on rule.grantor_role_id=actor_role.id
     and rule.grantable_role_id=assignment.role_id
     and rule.scope_type=assignment.scope_type
    where actor_assignment.user_id=actor_id and actor_assignment.scope_type='global'
  ) then raise exception 'actor cannot remove requested role and scope' using errcode='42501'; end if;
  if assignment.role_id='10000000-0000-0000-0000-000000000010'::uuid and assignment.scope_type='global' then
    if not pulse_private.is_active_super_admin(actor_id) then
      raise exception 'only a Super Admin may remove a Super Admin role' using errcode='42501';
    end if;
    perform pulse_private.assert_not_last_active_super_admin(target.id);
  end if;
  if target.status='active' and not exists(
    select 1 from public.user_roles remaining
    join public.roles role on role.id=remaining.role_id and role.is_active
    where remaining.user_id=target.id and remaining.id<>assignment.id
  ) then raise exception 'active user must retain at least one active role' using errcode='55000'; end if;

  delete from public.user_roles current_assignment where current_assignment.id=assignment.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'role.removed','operator',jsonb_build_object(
    'user_role_id',assignment.id,
    'role_id',assignment.role_id,
    'scope_type',assignment.scope_type,
    'department_id',assignment.department_id,
    'campaign_id',assignment.campaign_id,
    'team_id',assignment.team_id
  ));
  return query select assignment.id,true;
end
$function$;


create or replace function public.get_managed_user(target_user_id uuid)
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
  roles jsonb
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select * from public.list_managed_users(null) managed
  where managed.id = target_user_id
$function$;

-- Reactivation accepts all four valid canonical role shapes. Campaign roles
-- remain independent from the user's employment Department/Team.
create or replace function public.reactivate_user(target_user_id uuid, reason text default null)
returns table (id uuid, status text, status_changed_at timestamptz, changed boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('users.manage');
  target public.users%rowtype;
  prior_status text;
  auth_email text;
  normalized_reason text := nullif(btrim(reason), '');
begin
  if normalized_reason is not null and length(normalized_reason) > 500 then
    raise exception 'reason cannot exceed 500 characters' using errcode='22023';
  end if;
  if actor_id=target_user_id then raise exception 'self-reactivation is not allowed' using errcode='42501'; end if;

  select * into target from public.users target_user where target_user.id=target_user_id for update;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  if target.status='active' then return query select target.id,target.status,target.status_changed_at,false; return; end if;
  if target.status not in ('blocked','inactive') then raise exception 'target must be blocked or inactive' using errcode='55000'; end if;
  if exists(
    select 1 from public.user_roles assignment
    where assignment.user_id=target.id
      and assignment.role_id='10000000-0000-0000-0000-000000000010'::uuid
      and assignment.scope_type='global'
  ) and not pulse_private.is_active_super_admin(actor_id) then
    raise exception 'only a Super Admin may reactivate a Super Admin' using errcode='42501';
  end if;
  prior_status:=target.status;

  select lower(btrim(auth_user.email)) into auth_email
  from auth.users auth_user
  where auth_user.id=target.auth_user_id
    and auth_user.email_confirmed_at is not null
    and auth_user.deleted_at is null
    and (auth_user.banned_until is null or auth_user.banned_until < now());
  if auth_email is null or auth_email<>target.email then raise exception 'target Auth identity is invalid or email does not match' using errcode='23514'; end if;
  if target.employee_id is null then raise exception 'target employee ID is missing' using errcode='23514'; end if;
  if not exists(select 1 from public.departments department where department.id=target.department_id and department.is_active) then raise exception 'target department is missing or inactive' using errcode='23503'; end if;
  if target.team_id is not null and not exists(
    select 1 from public.teams team where team.id=target.team_id and team.department_id=target.department_id and team.is_active
  ) then raise exception 'target team is invalid or inactive' using errcode='23503'; end if;
  if not exists(
    select 1
    from public.user_roles assignment
    join public.roles role on role.id=assignment.role_id and role.is_active
    join public.role_scopes supported on supported.role_id=assignment.role_id and supported.scope_type=assignment.scope_type
    left join public.campaigns campaign on campaign.id=assignment.campaign_id
    where assignment.user_id=target.id and (
      assignment.scope_type='global'
      or assignment.scope_type='department' and assignment.department_id=target.department_id
      or assignment.scope_type='team' and assignment.team_id=target.team_id and target.team_id is not null
      or assignment.scope_type='campaign' and campaign.is_active
    )
  ) then raise exception 'target has no valid active role assignment' using errcode='23514'; end if;

  update public.users target_user set status='active' where target_user.id=target.id returning target_user.* into target;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'account.reactivated','operator',jsonb_build_object('reason',normalized_reason,'previous_status',prior_status));
  return query select target.id,target.status,target.status_changed_at,true;
end
$function$;

alter function public.list_managed_users(text) owner to postgres;
alter function public.get_managed_user(uuid) owner to postgres;
alter function public.reactivate_user(uuid,text) owner to postgres;
alter function public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid) owner to postgres;
alter function public.assign_user_role(uuid,uuid,text,uuid,uuid) owner to postgres;
alter function public.remove_user_role(uuid,uuid) owner to postgres;
alter function public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz) owner to postgres;

revoke all on function public.list_managed_users(text) from public,anon,service_role;
revoke all on function public.get_managed_user(uuid) from public,anon,service_role;
revoke all on function public.reactivate_user(uuid,text) from public,anon,service_role;
revoke all on function public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid) from public,anon,service_role;
revoke all on function public.assign_user_role(uuid,uuid,text,uuid,uuid) from public,anon,service_role;
revoke all on function public.remove_user_role(uuid,uuid) from public,anon,service_role;
revoke all on function public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz) from public,anon,service_role;

grant execute on function public.list_managed_users(text) to authenticated;
grant execute on function public.get_managed_user(uuid) to authenticated;
grant execute on function public.reactivate_user(uuid,text) to authenticated;
grant execute on function public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid) to authenticated;
grant execute on function public.assign_user_role(uuid,uuid,text,uuid,uuid) to authenticated;
grant execute on function public.remove_user_role(uuid,uuid) to authenticated;
grant execute on function public.list_audit_events(integer,timestamptz,uuid,text,text,uuid,text,uuid,timestamptz,timestamptz) to authenticated;

comment on function pulse_private.has_permission(text,uuid,uuid,uuid) is
  'Four-context permission resolver with server-authoritative Campaign and Team relationships.';
comment on function pulse_private.has_permission(text,uuid,uuid) is
  'Compatibility wrapper preserving deployed Global, Department, and Team callers.';
comment on function public.assign_user_role(uuid,uuid,text,uuid,uuid,uuid) is
  'Assigns one exact grant-rule-authorized Global, Department, Campaign, or Team role.';
comment on function public.assign_user_role(uuid,uuid,text,uuid,uuid) is
  'Compatibility wrapper for pre-Campaign Global, Department, and Team role assignment callers.';
comment on function public.list_assignable_role_options(uuid) is
  'Returns exact server-resolved role/scope targets, including active Campaign options.';
comment on function public.get_pending_approval_options(uuid) is
  'Returns independent employment placement and exact initial authorization options, including Campaign scope.';
