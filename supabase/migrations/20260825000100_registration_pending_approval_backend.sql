-- Pulse Foundation V1: verified registration, pending approval, and controlled activation.
--
-- This migration adds only server-authorized identity lifecycle operations. It
-- creates no Auth users, Pulse users, departments, teams, or business records.

create table public.role_grant_rules (
  grantor_role_id uuid not null,
  grantable_role_id uuid not null,
  scope_type text not null,
  created_at timestamptz not null default now(),
  primary key (grantor_role_id, grantable_role_id, scope_type),
  constraint role_grant_rules_grantor_fk
    foreign key (grantor_role_id) references public.roles (id)
    on update restrict on delete restrict,
  constraint role_grant_rules_grantable_scope_fk
    foreign key (grantable_role_id, scope_type)
    references public.role_scopes (role_id, scope_type)
    on update restrict on delete restrict
);

comment on table public.role_grant_rules is
  'Server-authoritative allowlist of role and scope combinations each grantor role may assign.';

alter table public.role_grant_rules enable row level security;
revoke all on table public.role_grant_rules from public, anon, authenticated;
grant all on table public.role_grant_rules to service_role;

-- Super Admin may grant every seeded role/scope combination.
insert into public.role_grant_rules (grantor_role_id, grantable_role_id, scope_type)
select grantor.id, rs.role_id, rs.scope_type
from public.roles grantor
cross join public.role_scopes rs
where grantor.key = 'super_admin';

-- Admin and HR may onboard operational/basic roles, but may not grant any
-- privileged administration role (including themselves or Super Admin).
insert into public.role_grant_rules (grantor_role_id, grantable_role_id, scope_type)
select grantor.id, grantable.id, rs.scope_type
from public.roles grantor
join public.roles grantable
  on grantable.key in ('employee', 'agent', 'team_leader', 'supervisor', 'qa')
join public.role_scopes rs on rs.role_id = grantable.id
where grantor.key in ('admin', 'human_resources');

create function public.create_pending_profile(requested_full_name text)
returns table (
  id uuid,
  auth_user_id uuid,
  email text,
  full_name text,
  status text,
  employee_id text,
  department_id uuid,
  team_id uuid
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  caller_auth_user_id uuid := auth.uid();
  authoritative_email text;
  normalized_full_name text := btrim(requested_full_name);
  existing_user public.users%rowtype;
  created_user public.users%rowtype;
begin
  if caller_auth_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if length(normalized_full_name) not between 2 and 160 then
    raise exception 'full name must contain between 2 and 160 characters'
      using errcode = '22023';
  end if;

  select lower(btrim(au.email))
  into authoritative_email
  from auth.users au
  where au.id = caller_auth_user_id
    and au.email_confirmed_at is not null
    and au.deleted_at is null
    and (au.banned_until is null or au.banned_until < now());

  if authoritative_email is null then
    raise exception 'Auth identity is missing, unverified, deleted, or blocked'
      using errcode = '28000';
  end if;

  select u.*
  into existing_user
  from public.users u
  where u.auth_user_id = caller_auth_user_id;

  if found then
    if existing_user.email <> authoritative_email then
      raise exception 'Auth and Pulse profile email mismatch'
        using errcode = '23514';
    end if;

    return query select
      existing_user.id,
      existing_user.auth_user_id,
      existing_user.email,
      existing_user.full_name,
      existing_user.status,
      existing_user.employee_id,
      existing_user.department_id,
      existing_user.team_id;
    return;
  end if;

  begin
    insert into public.users (auth_user_id, email, full_name)
    values (caller_auth_user_id, authoritative_email, normalized_full_name)
    returning * into created_user;
  exception
    when unique_violation then
      -- A concurrent retry for the same Auth identity is idempotent. A collision
      -- with another identity's normalized email remains a hard conflict.
      select u.*
      into existing_user
      from public.users u
      where u.auth_user_id = caller_auth_user_id;

      if found and existing_user.email = authoritative_email then
        return query select
          existing_user.id,
          existing_user.auth_user_id,
          existing_user.email,
          existing_user.full_name,
          existing_user.status,
          existing_user.employee_id,
          existing_user.department_id,
          existing_user.team_id;
        return;
      end if;

      raise exception 'A Pulse profile already owns this normalized email'
        using errcode = '23505';
  end;

  insert into public.audit_events (
    actor_user_id,
    target_type,
    target_id,
    action,
    source,
    metadata
  ) values (
    created_user.id,
    'user',
    created_user.id,
    'account.pending_created',
    'database',
    jsonb_build_object('auth_user_id', caller_auth_user_id)
  );

  return query select
    created_user.id,
    created_user.auth_user_id,
    created_user.email,
    created_user.full_name,
    created_user.status,
    created_user.employee_id,
    created_user.department_id,
    created_user.team_id;
end
$function$;

create function public.approve_pending_user(
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
  role_record public.roles%rowtype;
  role_count integer;
begin
  if caller_auth_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select u.*
  into approver
  from public.users u
  where u.auth_user_id = caller_auth_user_id
    and u.status = 'active';

  if not found then
    raise exception 'active Pulse approver required' using errcode = '42501';
  end if;

  if approver.id = target_user_id then
    raise exception 'self-approval is not allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.is_active
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id and p.is_active
    where ur.user_id = approver.id
      and ur.scope_type = 'global'
      and p.key = 'users.approve'
  ) or not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.is_active
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id and p.is_active
    where ur.user_id = approver.id
      and ur.scope_type = 'global'
      and p.key = 'roles.assign'
  ) then
    raise exception 'global users.approve and roles.assign are required'
      using errcode = '42501';
  end if;

  select u.*
  into target
  from public.users u
  where u.id = target_user_id
  for update;

  if not found or target.status <> 'pending_approval' then
    raise exception 'target must be pending approval' using errcode = '55000';
  end if;

  select lower(btrim(au.email))
  into target_auth_email
  from auth.users au
  where au.id = target.auth_user_id
    and au.email_confirmed_at is not null
    and au.deleted_at is null
    and (au.banned_until is null or au.banned_until < now());

  if target_auth_email is null or target_auth_email <> target.email then
    raise exception 'target Auth identity is invalid or email does not match'
      using errcode = '23514';
  end if;

  perform 1
  from public.departments d
  where d.id = selected_department_id and d.is_active
  for share;
  if not found then
    raise exception 'selected department is missing or inactive'
      using errcode = '23503';
  end if;

  if selected_team_id is not null then
    perform 1
    from public.teams t
    where t.id = selected_team_id
      and t.department_id = selected_department_id
      and t.is_active
    for share;
    if not found then
      raise exception 'selected team is missing, inactive, or outside the department'
        using errcode = '23503';
    end if;
  end if;

  if jsonb_typeof(requested_roles) <> 'array'
     or jsonb_array_length(requested_roles) not between 1 and 10 then
    raise exception 'requested_roles must be an array containing 1 to 10 assignments'
      using errcode = '22023';
  end if;

  create temporary table requested_role_assignments (
    role_id uuid not null,
    scope_type text not null,
    department_id uuid,
    team_id uuid,
    primary key (role_id, scope_type)
  ) on commit drop;

  for requested_role in select value from jsonb_array_elements(requested_roles)
  loop
    if jsonb_typeof(requested_role) <> 'object'
       or requested_role - array['role_id', 'scope_type'] <> '{}'::jsonb
       or not (requested_role ?& array['role_id', 'scope_type']) then
      raise exception 'each requested role must contain only role_id and scope_type'
        using errcode = '22023';
    end if;

    begin
      requested_role_id := (requested_role ->> 'role_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'requested role_id must be a UUID' using errcode = '22023';
    end;
    requested_scope_type := requested_role ->> 'scope_type';

    select r.*
    into role_record
    from public.roles r
    join public.role_scopes rs
      on rs.role_id = r.id and rs.scope_type = requested_scope_type
    where r.id = requested_role_id and r.is_active
    for share of r, rs;

    if not found then
      raise exception 'requested role is inactive or invalid for its scope'
        using errcode = '23503';
    end if;

    if requested_scope_type = 'team' and selected_team_id is null then
      raise exception 'team-scoped roles require a selected team'
        using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.user_roles grantor_assignment
      join public.roles grantor_role
        on grantor_role.id = grantor_assignment.role_id and grantor_role.is_active
      join public.role_grant_rules rule
        on rule.grantor_role_id = grantor_role.id
       and rule.grantable_role_id = requested_role_id
       and rule.scope_type = requested_scope_type
      where grantor_assignment.user_id = approver.id
        and grantor_assignment.scope_type = 'global'
    ) then
      raise exception 'approver is not allowed to grant the requested role and scope'
        using errcode = '42501';
    end if;

    insert into requested_role_assignments (
      role_id,
      scope_type,
      department_id,
      team_id
    ) values (
      requested_role_id,
      requested_scope_type,
      case when requested_scope_type in ('department', 'team')
        then selected_department_id end,
      case when requested_scope_type = 'team' then selected_team_id end
    );
  end loop;

  select count(*) into role_count from requested_role_assignments;
  if role_count <> jsonb_array_length(requested_roles) then
    raise exception 'duplicate requested role assignments are not allowed'
      using errcode = '23505';
  end if;

  generated_employee_id := pulse_private.next_employee_id();

  insert into public.user_roles (
    user_id,
    role_id,
    scope_type,
    department_id,
    team_id,
    assigned_by_user_id
  )
  select
    target.id,
    requested.role_id,
    requested.scope_type,
    requested.department_id,
    requested.team_id,
    approver.id
  from requested_role_assignments requested;

  update public.users
  set employee_id = generated_employee_id,
      department_id = selected_department_id,
      team_id = selected_team_id,
      status = 'active'
  where public.users.id = target.id
  returning public.users.* into target;

  insert into public.audit_events (
    actor_user_id,
    target_type,
    target_id,
    action,
    source,
    metadata
  ) values (
    approver.id,
    'user',
    target.id,
    'account.approved',
    'database',
    jsonb_build_object(
      'department_id', selected_department_id,
      'team_id', selected_team_id,
      'employee_id', generated_employee_id,
      'role_count', role_count
    )
  );

  insert into public.audit_events (
    actor_user_id,
    target_type,
    target_id,
    action,
    source,
    metadata
  )
  select
    approver.id,
    'user',
    target.id,
    'role.assigned',
    'database',
    jsonb_build_object(
      'role_id', requested.role_id,
      'scope_type', requested.scope_type,
      'department_id', requested.department_id,
      'team_id', requested.team_id
    )
  from requested_role_assignments requested;

  return query select
    target.id,
    target.employee_id,
    target.status,
    target.department_id,
    target.team_id,
    target.approved_at;
end
$function$;

create function public.block_pending_user(
  target_user_id uuid,
  reason text default null
)
returns table (
  id uuid,
  status text,
  status_changed_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  caller_auth_user_id uuid := auth.uid();
  approver public.users%rowtype;
  target public.users%rowtype;
  normalized_reason text := nullif(btrim(reason), '');
begin
  if caller_auth_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if normalized_reason is not null and length(normalized_reason) > 500 then
    raise exception 'reason cannot exceed 500 characters' using errcode = '22023';
  end if;

  select u.* into approver
  from public.users u
  where u.auth_user_id = caller_auth_user_id and u.status = 'active';

  if not found or not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.is_active
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id and p.is_active
    where ur.user_id = approver.id
      and ur.scope_type = 'global'
      and p.key = 'users.approve'
  ) then
    raise exception 'global users.approve is required' using errcode = '42501';
  end if;

  if approver.id = target_user_id then
    raise exception 'self-blocking is not allowed' using errcode = '42501';
  end if;

  select u.* into target
  from public.users u
  where u.id = target_user_id
  for update;

  if not found or target.status <> 'pending_approval' then
    raise exception 'target must be pending approval' using errcode = '55000';
  end if;

  update public.users
  set status = 'blocked'
  where public.users.id = target.id
  returning public.users.* into target;

  insert into public.audit_events (
    actor_user_id,
    target_type,
    target_id,
    action,
    source,
    metadata
  ) values (
    approver.id,
    'user',
    target.id,
    'account.blocked',
    'database',
    jsonb_build_object('reason', normalized_reason)
  );

  return query select target.id, target.status, target.status_changed_at;
end
$function$;

alter function public.create_pending_profile(text) owner to postgres;
alter function public.approve_pending_user(uuid, uuid, uuid, jsonb) owner to postgres;
alter function public.block_pending_user(uuid, text) owner to postgres;

revoke all on function public.create_pending_profile(text) from public, anon;
revoke all on function public.approve_pending_user(uuid, uuid, uuid, jsonb) from public, anon;
revoke all on function public.block_pending_user(uuid, text) from public, anon;
grant execute on function public.create_pending_profile(text) to authenticated;
grant execute on function public.approve_pending_user(uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.block_pending_user(uuid, text) to authenticated;

comment on function public.create_pending_profile(text) is
  'Creates at most one pending Pulse profile from the verified caller Auth identity; safe to retry.';
comment on function public.approve_pending_user(uuid, uuid, uuid, jsonb) is
  'Atomically validates and activates a pending user with server-generated employee ID and controlled roles.';
comment on function public.block_pending_user(uuid, text) is
  'Blocks a pending user through a globally authorized reviewer and appends an audit event.';
