-- Pulse AUTH-8: canonical audited lifecycle and role administration.
-- This migration is intentionally local-only until a separate deployment approval.

create function pulse_private.require_global_permission(requested_permission text)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select u.id into actor_id
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.status = 'active';

  if actor_id is null or not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.is_active
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id and p.is_active
    where ur.user_id = actor_id
      and ur.scope_type = 'global'
      and p.key = requested_permission
  ) then
    raise exception 'active global % permission required', requested_permission
      using errcode = '42501';
  end if;

  return actor_id;
end
$function$;

create function pulse_private.is_active_super_admin(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.roles r on r.id = ur.role_id
    where u.id = target_user_id
      and u.status = 'active'
      and ur.scope_type = 'global'
      and r.id = '10000000-0000-0000-0000-000000000010'::uuid
      and r.key = 'super_admin'
      and r.is_active
  )
$function$;

create function pulse_private.assert_not_last_active_super_admin(target_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
begin
  -- Serialize every operation that could reduce the active Super Admin set.
  perform pg_advisory_xact_lock(73032026082500200::bigint);
  if pulse_private.is_active_super_admin(target_user_id)
     and not exists (
       select 1
       from public.users u
       join public.user_roles ur on ur.user_id = u.id
       join public.roles r on r.id = ur.role_id
       where u.id <> target_user_id
         and u.status = 'active'
         and ur.scope_type = 'global'
         and r.id = '10000000-0000-0000-0000-000000000010'::uuid
         and r.key = 'super_admin'
         and r.is_active
     ) then
    raise exception 'the last active Super Admin is protected' using errcode = '55000';
  end if;
end
$function$;

create function pulse_private.protect_last_super_admin_status()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if tg_op = 'DELETE' then
    if old.status = 'active' then
      perform pulse_private.assert_not_last_active_super_admin(old.id);
    end if;
    return old;
  end if;
  if old.status = 'active' and new.status <> 'active' then
    perform pulse_private.assert_not_last_active_super_admin(old.id);
  end if;
  return new;
end
$function$;

create function pulse_private.protect_last_super_admin_assignment()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if old.role_id = '10000000-0000-0000-0000-000000000010'::uuid
     and old.scope_type = 'global' then
    if tg_op = 'DELETE' then
      perform pulse_private.assert_not_last_active_super_admin(old.user_id);
    elsif new.user_id is distinct from old.user_id
       or new.role_id is distinct from old.role_id
       or new.scope_type is distinct from old.scope_type then
      perform pulse_private.assert_not_last_active_super_admin(old.user_id);
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;

create function pulse_private.protect_super_admin_catalog()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if old.id = '10000000-0000-0000-0000-000000000010'::uuid
     and old.key = 'super_admin' then
    if tg_op = 'DELETE' then
      raise exception 'the Super Admin role catalog identity is protected' using errcode = '55000';
    end if;
    if new.id is distinct from old.id
       or new.key is distinct from old.key
       or (old.is_active and not new.is_active) then
      raise exception 'the Super Admin role catalog identity is protected' using errcode = '55000';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;

create trigger users_protect_last_super_admin
before update or delete on public.users
for each row execute function pulse_private.protect_last_super_admin_status();

create trigger user_roles_protect_last_super_admin
before update or delete on public.user_roles
for each row execute function pulse_private.protect_last_super_admin_assignment();

create trigger roles_protect_super_admin_catalog
before update or delete on public.roles
for each row execute function pulse_private.protect_super_admin_catalog();

create function public.list_managed_users(requested_status text default null)
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
  select u.id, u.email, u.full_name, u.display_name, u.employee_id, u.status,
         u.department_id, u.team_id,
         (au.email_confirmed_at is not null and au.deleted_at is null) as auth_email_confirmed,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'user_role_id', ur.id,
             'role_id', ur.role_id,
             'role_key', r.key,
             'role_name', r.name,
             'scope_type', ur.scope_type,
             'department_id', ur.department_id,
             'team_id', ur.team_id
           ) order by r.key, ur.scope_type)
           from public.user_roles ur
           join public.roles r on r.id = ur.role_id
           where ur.user_id = u.id
         ), '[]'::jsonb)
  from public.users u
  join auth.users au on au.id = u.auth_user_id
  where requested_status is null or u.status = requested_status
  order by u.created_at, u.id;
end
$function$;

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

create function public.block_user(target_user_id uuid, reason text default null)
returns table (id uuid, status text, status_changed_at timestamptz, changed boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('users.manage');
  target public.users%rowtype;
  normalized_reason text := nullif(btrim(reason), '');
begin
  if normalized_reason is not null and length(normalized_reason) > 500 then
    raise exception 'reason cannot exceed 500 characters' using errcode = '22023';
  end if;
  if actor_id = target_user_id then
    raise exception 'self-blocking is not allowed' using errcode = '42501';
  end if;

  select * into target from public.users u where u.id = target_user_id for update;
  if not found then raise exception 'target user not found' using errcode = 'P0002'; end if;
  if target.status = 'blocked' then
    return query select target.id, target.status, target.status_changed_at, false;
    return;
  end if;
  if target.status <> 'active' then
    raise exception 'target must be active' using errcode = '55000';
  end if;
  if pulse_private.is_active_super_admin(target.id)
     and not pulse_private.is_active_super_admin(actor_id) then
    raise exception 'only a Super Admin may block another Super Admin' using errcode = '42501';
  end if;
  perform pulse_private.assert_not_last_active_super_admin(target.id);

  update public.users u set status = 'blocked' where u.id = target.id returning u.* into target;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'account.blocked','operator',jsonb_build_object('reason',normalized_reason,'previous_status','active'));
  return query select target.id, target.status, target.status_changed_at, true;
end
$function$;

create function public.reactivate_user(target_user_id uuid, reason text default null)
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
    raise exception 'reason cannot exceed 500 characters' using errcode = '22023';
  end if;
  if actor_id = target_user_id then
    raise exception 'self-reactivation is not allowed' using errcode = '42501';
  end if;

  select * into target from public.users u where u.id = target_user_id for update;
  if not found then raise exception 'target user not found' using errcode = 'P0002'; end if;
  if target.status = 'active' then
    return query select target.id, target.status, target.status_changed_at, false;
    return;
  end if;
  if target.status not in ('blocked','inactive') then
    raise exception 'target must be blocked or inactive' using errcode = '55000';
  end if;
  if exists(
    select 1 from public.user_roles ur
    where ur.user_id=target.id
      and ur.role_id='10000000-0000-0000-0000-000000000010'::uuid
      and ur.scope_type='global'
  ) and not pulse_private.is_active_super_admin(actor_id) then
    raise exception 'only a Super Admin may reactivate a Super Admin' using errcode = '42501';
  end if;
  prior_status := target.status;

  select lower(btrim(au.email)) into auth_email
  from auth.users au
  where au.id = target.auth_user_id
    and au.email_confirmed_at is not null
    and au.deleted_at is null
    and (au.banned_until is null or au.banned_until < now());
  if auth_email is null or auth_email <> target.email then
    raise exception 'target Auth identity is invalid or email does not match' using errcode = '23514';
  end if;
  if target.employee_id is null then raise exception 'target employee ID is missing' using errcode = '23514'; end if;
  if not exists(select 1 from public.departments d where d.id=target.department_id and d.is_active) then
    raise exception 'target department is missing or inactive' using errcode = '23503';
  end if;
  if target.team_id is not null and not exists(
    select 1 from public.teams t where t.id=target.team_id and t.department_id=target.department_id and t.is_active
  ) then raise exception 'target team is invalid or inactive' using errcode = '23503'; end if;
  if not exists(
    select 1 from public.user_roles ur
    join public.roles r on r.id=ur.role_id and r.is_active
    join public.role_scopes rs on rs.role_id=ur.role_id and rs.scope_type=ur.scope_type
    where ur.user_id=target.id and (
      (ur.scope_type='global' and ur.department_id is null and ur.team_id is null)
      or (ur.scope_type='department' and ur.department_id=target.department_id and ur.team_id is null)
      or (ur.scope_type='team' and ur.department_id=target.department_id and ur.team_id=target.team_id)
    )
  ) then raise exception 'target has no valid active role assignment' using errcode = '23514'; end if;

  update public.users u set status='active' where u.id=target.id returning u.* into target;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'account.reactivated','operator',jsonb_build_object('reason',normalized_reason,'previous_status',prior_status));
  return query select target.id,target.status,target.status_changed_at,true;
end
$function$;

create function public.inactivate_user(target_user_id uuid, reason text default null)
returns table (id uuid, status text, status_changed_at timestamptz, changed boolean)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('users.manage');
  target public.users%rowtype;
  prior_status text;
  normalized_reason text := nullif(btrim(reason), '');
begin
  if normalized_reason is not null and length(normalized_reason)>500 then raise exception 'reason cannot exceed 500 characters' using errcode='22023'; end if;
  if actor_id=target_user_id then raise exception 'self-inactivation is not allowed' using errcode='42501'; end if;
  select * into target from public.users u where u.id=target_user_id for update;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  if target.status='inactive' then return query select target.id,target.status,target.status_changed_at,false; return; end if;
  if target.status not in ('active','blocked') then raise exception 'target must be active or blocked' using errcode='55000'; end if;
  if exists(
    select 1 from public.user_roles ur
    where ur.user_id=target.id
      and ur.role_id='10000000-0000-0000-0000-000000000010'::uuid
      and ur.scope_type='global'
  ) and not pulse_private.is_active_super_admin(actor_id) then
    raise exception 'only a Super Admin may inactivate a Super Admin' using errcode='42501';
  end if;
  if target.status='active' then perform pulse_private.assert_not_last_active_super_admin(target.id); end if;
  prior_status:=target.status;
  update public.users u set status='inactive' where u.id=target.id returning u.* into target;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'account.inactivated','operator',jsonb_build_object('reason',normalized_reason,'previous_status',prior_status));
  return query select target.id,target.status,target.status_changed_at,true;
end
$function$;

create function public.assign_user_role(
  target_user_id uuid, requested_role_id uuid, requested_scope_type text,
  requested_department_id uuid default null, requested_team_id uuid default null
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
  select * into target from public.users u where u.id=target_user_id for update;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  if target.status='pending_approval' then raise exception 'pending roles are assigned only through approval' using errcode='55000'; end if;
  if requested_scope_type not in ('global','department','team') then raise exception 'invalid role scope' using errcode='22023'; end if;
  if not exists(select 1 from public.roles r join public.role_scopes rs on rs.role_id=r.id and rs.scope_type=requested_scope_type where r.id=requested_role_id and r.is_active) then
    raise exception 'requested role is inactive or invalid for scope' using errcode='23503';
  end if;
  if requested_role_id='10000000-0000-0000-0000-000000000010'::uuid
     and not pulse_private.is_active_super_admin(actor_id) then
    raise exception 'only a Super Admin may grant the Super Admin role' using errcode='42501';
  end if;
  if not exists(
    select 1 from public.user_roles actor_role
    join public.roles ar on ar.id=actor_role.role_id and ar.is_active
    join public.role_grant_rules rule on rule.grantor_role_id=ar.id and rule.grantable_role_id=requested_role_id and rule.scope_type=requested_scope_type
    where actor_role.user_id=actor_id and actor_role.scope_type='global'
  ) then raise exception 'actor cannot grant requested role and scope' using errcode='42501'; end if;

  if requested_scope_type='global' and (requested_department_id is not null or requested_team_id is not null) then raise exception 'global role cannot have organization scope IDs' using errcode='23514'; end if;
  if requested_scope_type='department' and (requested_department_id is distinct from target.department_id or requested_team_id is not null) then raise exception 'department role must match target department' using errcode='23514'; end if;
  if requested_scope_type='team' and (requested_department_id is distinct from target.department_id or requested_team_id is distinct from target.team_id or requested_team_id is null) then raise exception 'team role must match target team' using errcode='23514'; end if;
  if requested_scope_type in ('department','team')
     and not exists(select 1 from public.departments d where d.id=requested_department_id and d.is_active) then
    raise exception 'requested department is missing or inactive' using errcode='23503';
  end if;
  if requested_scope_type='team'
     and not exists(select 1 from public.teams t where t.id=requested_team_id and t.department_id=requested_department_id and t.is_active) then
    raise exception 'requested team is missing, inactive, or outside department' using errcode='23503';
  end if;

  select ur.id into existing_id from public.user_roles ur where ur.user_id=target.id and ur.role_id=requested_role_id and ur.scope_type=requested_scope_type
    and ur.department_id is not distinct from requested_department_id and ur.team_id is not distinct from requested_team_id;
  if existing_id is not null then return query select existing_id,false; return; end if;

  insert into public.user_roles(user_id,role_id,scope_type,department_id,team_id,assigned_by_user_id)
  values(target.id,requested_role_id,requested_scope_type,requested_department_id,requested_team_id,actor_id)
  on conflict do nothing
  returning id into new_id;
  if new_id is null then
    select ur.id into new_id from public.user_roles ur
    where ur.user_id=target.id and ur.role_id=requested_role_id and ur.scope_type=requested_scope_type
      and ur.department_id is not distinct from requested_department_id
      and ur.team_id is not distinct from requested_team_id;
    return query select new_id,false;
    return;
  end if;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'role.assigned','operator',jsonb_build_object('user_role_id',new_id,'role_id',requested_role_id,'scope_type',requested_scope_type,'department_id',requested_department_id,'team_id',requested_team_id));
  return query select new_id,true;
end
$function$;

create function public.remove_user_role(target_user_id uuid, target_user_role_id uuid)
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
  select * into target from public.users u where u.id=target_user_id for update;
  if not found then raise exception 'target user not found' using errcode='P0002'; end if;
  select * into assignment from public.user_roles ur where ur.id=target_user_role_id and ur.user_id=target.id for update;
  if not found then return query select target_user_role_id,false; return; end if;
  if not exists(
    select 1 from public.user_roles actor_role
    join public.roles ar on ar.id=actor_role.role_id and ar.is_active
    join public.role_grant_rules rule on rule.grantor_role_id=ar.id and rule.grantable_role_id=assignment.role_id and rule.scope_type=assignment.scope_type
    where actor_role.user_id=actor_id and actor_role.scope_type='global'
  ) then raise exception 'actor cannot remove requested role and scope' using errcode='42501'; end if;
  if assignment.role_id='10000000-0000-0000-0000-000000000010'::uuid and assignment.scope_type='global' then
    if not pulse_private.is_active_super_admin(actor_id) then
      raise exception 'only a Super Admin may remove a Super Admin role' using errcode='42501';
    end if;
    perform pulse_private.assert_not_last_active_super_admin(target.id);
  end if;
  if target.status='active' and not exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id and r.is_active where ur.user_id=target.id and ur.id<>assignment.id) then
    raise exception 'active user must retain at least one active role' using errcode='55000';
  end if;
  delete from public.user_roles ur where ur.id=assignment.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'user',target.id,'role.removed','operator',jsonb_build_object('user_role_id',assignment.id,'role_id',assignment.role_id,'scope_type',assignment.scope_type,'department_id',assignment.department_id,'team_id',assignment.team_id));
  return query select assignment.id,true;
end
$function$;

alter function pulse_private.require_global_permission(text) owner to postgres;
alter function pulse_private.is_active_super_admin(uuid) owner to postgres;
alter function pulse_private.assert_not_last_active_super_admin(uuid) owner to postgres;
alter function pulse_private.protect_last_super_admin_status() owner to postgres;
alter function pulse_private.protect_last_super_admin_assignment() owner to postgres;
alter function pulse_private.protect_super_admin_catalog() owner to postgres;

revoke all on function pulse_private.require_global_permission(text) from public,anon,authenticated;
revoke all on function pulse_private.is_active_super_admin(uuid) from public,anon,authenticated;
revoke all on function pulse_private.assert_not_last_active_super_admin(uuid) from public,anon,authenticated;
revoke all on function pulse_private.protect_last_super_admin_status() from public,anon,authenticated;
revoke all on function pulse_private.protect_last_super_admin_assignment() from public,anon,authenticated;
revoke all on function pulse_private.protect_super_admin_catalog() from public,anon,authenticated;

alter function public.list_managed_users(text) owner to postgres;
alter function public.get_managed_user(uuid) owner to postgres;
alter function public.block_user(uuid,text) owner to postgres;
alter function public.reactivate_user(uuid,text) owner to postgres;
alter function public.inactivate_user(uuid,text) owner to postgres;
alter function public.assign_user_role(uuid,uuid,text,uuid,uuid) owner to postgres;
alter function public.remove_user_role(uuid,uuid) owner to postgres;

revoke all on function public.list_managed_users(text) from public,anon;
revoke all on function public.get_managed_user(uuid) from public,anon;
revoke all on function public.block_user(uuid,text) from public,anon;
revoke all on function public.reactivate_user(uuid,text) from public,anon;
revoke all on function public.inactivate_user(uuid,text) from public,anon;
revoke all on function public.assign_user_role(uuid,uuid,text,uuid,uuid) from public,anon;
revoke all on function public.remove_user_role(uuid,uuid) from public,anon;

grant execute on function public.list_managed_users(text) to authenticated;
grant execute on function public.get_managed_user(uuid) to authenticated;
grant execute on function public.block_user(uuid,text) to authenticated;
grant execute on function public.reactivate_user(uuid,text) to authenticated;
grant execute on function public.inactivate_user(uuid,text) to authenticated;
grant execute on function public.assign_user_role(uuid,uuid,text,uuid,uuid) to authenticated;
grant execute on function public.remove_user_role(uuid,uuid) to authenticated;

comment on function public.list_managed_users(text) is 'Global users.view operator listing with minimal identity and assignment data.';
comment on function public.get_managed_user(uuid) is 'Global users.view exact operator inspection.';
comment on function public.block_user(uuid,text) is 'Idempotently blocks an active user while preserving profile and roles.';
comment on function public.reactivate_user(uuid,text) is 'Reactivates a blocked or inactive user only after Auth, organization, and role validation.';
comment on function public.inactivate_user(uuid,text) is 'Idempotently marks an active or blocked workforce profile inactive.';
comment on function public.assign_user_role(uuid,uuid,text,uuid,uuid) is 'Assigns one grant-rule-authorized role at the target organization scope.';
comment on function public.remove_user_role(uuid,uuid) is 'Removes one exact grant-rule-authorized role assignment with last-admin protection.';
