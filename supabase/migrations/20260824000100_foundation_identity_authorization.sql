-- Pulse Foundation V1: canonical identity and authorization primitives.
--
-- Idempotency assumption:
--   This migration is intentionally fail-fast and must be applied exactly once by
--   Supabase migration tooling to the clean Pulse Dev baseline. It does not use
--   CREATE TABLE IF NOT EXISTS because silently accepting schema drift would be
--   unsafe for authorization infrastructure.

create schema pulse_private;

revoke create on schema public from public, anon, authenticated;
revoke all on schema pulse_private from public, anon, authenticated;
grant usage on schema pulse_private to authenticated, service_role;

create sequence pulse_private.employee_id_seq
  as bigint
  minvalue 1
  maxvalue 999999
  start with 1
  increment by 1
  no cycle;

revoke all on sequence pulse_private.employee_id_seq from public, anon, authenticated, service_role;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_code_format check (
    code = lower(btrim(code))
    and code ~ '^[a-z][a-z0-9_]{1,31}$'
  ),
  constraint departments_name_not_blank check (length(btrim(name)) between 2 and 120)
);

create unique index departments_code_unique on public.departments (lower(code));
create index departments_active_idx on public.departments (is_active) where is_active;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null,
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_department_fk
    foreign key (department_id) references public.departments (id)
    on update restrict on delete restrict,
  constraint teams_code_format check (
    code = lower(btrim(code))
    and code ~ '^[a-z][a-z0-9_]{1,31}$'
  ),
  constraint teams_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint teams_id_department_unique unique (id, department_id)
);

create unique index teams_department_code_unique
  on public.teams (department_id, lower(code));
create index teams_department_idx on public.teams (department_id);
create index teams_active_idx on public.teams (is_active) where is_active;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  employee_id text,
  email text not null,
  full_name text not null,
  display_name text,
  department_id uuid,
  team_id uuid,
  status text not null default 'pending_approval',
  status_changed_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_auth_user_unique unique (auth_user_id),
  constraint users_auth_user_fk
    foreign key (auth_user_id) references auth.users (id)
    on update restrict on delete restrict,
  constraint users_department_fk
    foreign key (department_id) references public.departments (id)
    on update restrict on delete restrict,
  constraint users_team_department_fk
    foreign key (team_id, department_id) references public.teams (id, department_id)
    on update restrict on delete restrict,
  constraint users_email_normalized check (
    email = lower(btrim(email))
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint users_full_name_not_blank check (length(btrim(full_name)) between 2 and 160),
  constraint users_display_name_not_blank check (
    display_name is null or length(btrim(display_name)) between 2 and 80
  ),
  constraint users_employee_id_format check (
    employee_id is null or employee_id ~ '^KK-[0-9]{6}$'
  ),
  constraint users_status_valid check (
    status in ('pending_approval', 'active', 'blocked', 'inactive')
  ),
  constraint users_team_requires_department check (team_id is null or department_id is not null)
);

create unique index users_email_unique on public.users (lower(email));
create unique index users_employee_id_unique
  on public.users (lower(employee_id)) where employee_id is not null;
create index users_department_idx on public.users (department_id);
create index users_team_idx on public.users (team_id);
create index users_status_idx on public.users (status);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_key_format check (
    key = lower(btrim(key))
    and key ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  constraint roles_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint roles_key_unique unique (key)
);

create index roles_active_idx on public.roles (is_active) where is_active;

create table public.role_scopes (
  role_id uuid not null,
  scope_type text not null,
  primary key (role_id, scope_type),
  constraint role_scopes_role_fk
    foreign key (role_id) references public.roles (id)
    on update restrict on delete restrict,
  constraint role_scopes_scope_valid check (scope_type in ('global', 'department', 'team'))
);

create index role_scopes_scope_idx on public.role_scopes (scope_type, role_id);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissions_key_format check (
    key = lower(btrim(key))
    and key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  ),
  constraint permissions_description_not_blank check (length(btrim(description)) between 2 and 240),
  constraint permissions_key_unique unique (key)
);

create index permissions_active_idx on public.permissions (is_active) where is_active;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role_id uuid not null,
  scope_type text not null,
  department_id uuid,
  team_id uuid,
  assigned_by_user_id uuid,
  assigned_at timestamptz not null default now(),
  constraint user_roles_user_fk
    foreign key (user_id) references public.users (id)
    on update restrict on delete restrict,
  constraint user_roles_role_scope_fk
    foreign key (role_id, scope_type) references public.role_scopes (role_id, scope_type)
    on update restrict on delete restrict,
  constraint user_roles_department_fk
    foreign key (department_id) references public.departments (id)
    on update restrict on delete restrict,
  constraint user_roles_team_department_fk
    foreign key (team_id, department_id) references public.teams (id, department_id)
    on update restrict on delete restrict,
  constraint user_roles_assigned_by_fk
    foreign key (assigned_by_user_id) references public.users (id)
    on update restrict on delete restrict,
  constraint user_roles_scope_valid check (
    (scope_type = 'global' and department_id is null and team_id is null)
    or (scope_type = 'department' and department_id is not null and team_id is null)
    or (scope_type = 'team' and department_id is not null and team_id is not null)
  )
);

create unique index user_roles_global_unique
  on public.user_roles (user_id, role_id) where scope_type = 'global';
create unique index user_roles_department_unique
  on public.user_roles (user_id, role_id, department_id) where scope_type = 'department';
create unique index user_roles_team_unique
  on public.user_roles (user_id, role_id, team_id) where scope_type = 'team';
create index user_roles_user_idx on public.user_roles (user_id);
create index user_roles_role_idx on public.user_roles (role_id);
create index user_roles_department_idx on public.user_roles (department_id);
create index user_roles_team_idx on public.user_roles (team_id);

create table public.role_permissions (
  role_id uuid not null,
  permission_id uuid not null,
  granted_by_user_id uuid,
  granted_at timestamptz not null default now(),
  primary key (role_id, permission_id),
  constraint role_permissions_role_fk
    foreign key (role_id) references public.roles (id)
    on update restrict on delete restrict,
  constraint role_permissions_permission_fk
    foreign key (permission_id) references public.permissions (id)
    on update restrict on delete restrict,
  constraint role_permissions_granted_by_fk
    foreign key (granted_by_user_id) references public.users (id)
    on update restrict on delete restrict
);

create index role_permissions_permission_idx on public.role_permissions (permission_id);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  target_type text not null,
  target_id uuid,
  action text not null,
  source text not null,
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_events_actor_fk
    foreign key (actor_user_id) references public.users (id)
    on update restrict on delete restrict,
  constraint audit_events_target_type_format check (
    target_type ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  constraint audit_events_action_format check (
    action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  ),
  constraint audit_events_source_valid check (
    source in ('server', 'edge_function', 'database', 'operator')
  ),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_events_actor_idx on public.audit_events (actor_user_id, occurred_at desc);
create index audit_events_target_idx on public.audit_events (target_type, target_id, occurred_at desc);
create index audit_events_action_idx on public.audit_events (action, occurred_at desc);
create index audit_events_occurred_at_idx on public.audit_events (occurred_at desc);

create function pulse_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  new.updated_at := now();
  return new;
end
$function$;

create function pulse_private.enforce_user_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if new.id is distinct from old.id
     or new.auth_user_id is distinct from old.auth_user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable user identity fields cannot be changed';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending_approval' and new.status in ('active', 'blocked'))
      or (old.status = 'active' and new.status in ('blocked', 'inactive'))
      or (old.status = 'blocked' and new.status in ('active', 'inactive'))
      or (old.status = 'inactive' and new.status in ('active', 'blocked'))
    ) then
      raise exception 'invalid user lifecycle transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'active' then
      if new.employee_id is null or new.department_id is null then
        raise exception 'active users require employee_id and department_id';
      end if;

      if not exists (
        select 1 from public.user_roles ur where ur.user_id = new.id
      ) then
        raise exception 'active users require at least one role assignment';
      end if;

      if new.approved_at is null then
        new.approved_at := now();
      end if;
    end if;

    new.status_changed_at := now();
  end if;

  new.updated_at := now();
  return new;
end
$function$;

create function pulse_private.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  raise exception 'audit events are append-only';
end
$function$;

create function pulse_private.next_employee_id()
returns text
language sql
volatile
security definer
set search_path = pg_catalog
as $function$
  select 'KK-' || lpad(nextval('pulse_private.employee_id_seq'::regclass)::text, 6, '0')
$function$;

create function pulse_private.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1
$function$;

create function pulse_private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
  )
$function$;

create function pulse_private.has_permission(
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
  select exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.roles r on r.id = ur.role_id and r.is_active
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p
      on p.id = rp.permission_id
     and p.is_active
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
      and p.key = requested_permission
      and (
        ur.scope_type = 'global'
        or (
          ur.scope_type = 'department'
          and ur.department_id = coalesce(requested_department_id, u.department_id)
        )
        or (
          ur.scope_type = 'team'
          and ur.team_id = coalesce(requested_team_id, u.team_id)
        )
      )
  )
$function$;

alter function pulse_private.current_user_id() owner to postgres;
alter function pulse_private.current_user_is_active() owner to postgres;
alter function pulse_private.has_permission(text, uuid, uuid) owner to postgres;
alter function pulse_private.next_employee_id() owner to postgres;

revoke all on all functions in schema pulse_private from public, anon, authenticated;
grant execute on function pulse_private.current_user_id() to authenticated;
grant execute on function pulse_private.current_user_is_active() to authenticated;
grant execute on function pulse_private.has_permission(text, uuid, uuid) to authenticated;
grant execute on function pulse_private.next_employee_id() to service_role;

create trigger departments_set_updated_at
before update on public.departments
for each row execute function pulse_private.set_updated_at();

create trigger teams_set_updated_at
before update on public.teams
for each row execute function pulse_private.set_updated_at();

create trigger users_enforce_update
before update on public.users
for each row execute function pulse_private.enforce_user_update();

create trigger roles_set_updated_at
before update on public.roles
for each row execute function pulse_private.set_updated_at();

create trigger permissions_set_updated_at
before update on public.permissions
for each row execute function pulse_private.set_updated_at();

create trigger audit_events_prevent_update
before update on public.audit_events
for each row execute function pulse_private.prevent_audit_mutation();

create trigger audit_events_prevent_delete
before delete on public.audit_events
for each row execute function pulse_private.prevent_audit_mutation();

alter table public.departments enable row level security;
alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.role_scopes enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.departments from public, anon, authenticated;
revoke all on table public.teams from public, anon, authenticated;
revoke all on table public.users from public, anon, authenticated;
revoke all on table public.roles from public, anon, authenticated;
revoke all on table public.role_scopes from public, anon, authenticated;
revoke all on table public.permissions from public, anon, authenticated;
revoke all on table public.user_roles from public, anon, authenticated;
revoke all on table public.role_permissions from public, anon, authenticated;
revoke all on table public.audit_events from public, anon, authenticated;

grant select on table public.departments to authenticated;
grant select on table public.teams to authenticated;
grant select on table public.users to authenticated;
grant select on table public.roles to authenticated;
grant select on table public.role_scopes to authenticated;
grant select on table public.permissions to authenticated;
grant select on table public.user_roles to authenticated;
grant select on table public.role_permissions to authenticated;
grant select on table public.audit_events to authenticated;

grant all on table public.departments to service_role;
grant all on table public.teams to service_role;
grant all on table public.users to service_role;
grant all on table public.roles to service_role;
grant all on table public.role_scopes to service_role;
grant all on table public.permissions to service_role;
grant all on table public.user_roles to service_role;
grant all on table public.role_permissions to service_role;
grant all on table public.audit_events to service_role;

create policy departments_active_users_read
on public.departments for select to authenticated
using (pulse_private.current_user_is_active());

create policy teams_active_users_read
on public.teams for select to authenticated
using (pulse_private.current_user_is_active());

create policy users_self_or_authorized_read
on public.users for select to authenticated
using (
  auth_user_id = auth.uid()
  or pulse_private.has_permission('users.view', department_id, team_id)
);

create policy roles_active_users_read
on public.roles for select to authenticated
using (pulse_private.current_user_is_active());

create policy role_scopes_active_users_read
on public.role_scopes for select to authenticated
using (pulse_private.current_user_is_active());

create policy permissions_active_users_read
on public.permissions for select to authenticated
using (pulse_private.current_user_is_active());

create policy user_roles_self_or_authorized_read
on public.user_roles for select to authenticated
using (
  (
    pulse_private.current_user_is_active()
    and user_id = pulse_private.current_user_id()
  )
  or pulse_private.has_permission('users.view', department_id, team_id)
);

create policy role_permissions_active_users_read
on public.role_permissions for select to authenticated
using (pulse_private.current_user_is_active());

create policy audit_events_authorized_read
on public.audit_events for select to authenticated
using (pulse_private.has_permission('audit.view'));

comment on table public.users is
  'Canonical Pulse workforce profile. Auth proves identity; status and RBAC grant application access.';
comment on column public.users.email is
  'Server-managed normalized business email snapshot. It must be verified against auth.users before creation or change.';
comment on table public.user_roles is
  'Current role assignments. Assignment history belongs in append-only audit_events.';
comment on table public.role_scopes is
  'Allowed assignment scopes for each role; a role may support more than one scope.';
comment on table public.audit_events is
  'Append-oriented security and administrative audit ledger. Browser roles have no write privileges.';
comment on function pulse_private.has_permission(text, uuid, uuid) is
  'Non-recursive RLS authorization helper owned by the migration owner with a fixed pg_catalog search_path.';
comment on function pulse_private.next_employee_id() is
  'Server-only collision-safe generator for human-readable employee IDs in KK-000001 format.';
