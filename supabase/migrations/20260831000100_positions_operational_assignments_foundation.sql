-- Pulse Foundation V2 ADMIN-7A: positions and operational assignments.
--
-- Employment placement, current Position, operational assignment, and RBAC
-- authorization remain independent. This migration exposes read-only Admin
-- contracts only; it creates no Position or assignment mutation RPC.

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint positions_code_format check (
    code = lower(btrim(code))
    and code ~ '^[a-z][a-z0-9_]{1,31}$'
  ),
  constraint positions_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint positions_description_length check (
    description is null or length(btrim(description)) <= 500
  )
);

create unique index positions_code_unique on public.positions (lower(code));
create unique index positions_name_unique on public.positions (lower(btrim(name)));
create index positions_active_idx on public.positions (is_active) where is_active;

-- A nullable current Position supports non-operational employees such as HR,
-- IT, Payroll, and Corporate staff. Assignment-specific Position remains on
-- the historical operational assignment itself.
alter table public.users
  add column position_id uuid;

alter table public.users
  add constraint users_position_fk
  foreign key (position_id) references public.positions(id)
  on update restrict on delete restrict;

create index users_position_idx on public.users(position_id);

-- This composite key lets the assignment FK prove the canonical Team->Campaign
-- relationship. A Team with campaign_id NULL cannot satisfy that relationship.
alter table public.teams
  add constraint teams_id_campaign_unique unique (id, campaign_id);

create table public.user_operational_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null,
  team_id uuid,
  position_id uuid not null,
  is_primary boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_operational_assignments_user_fk
    foreign key (user_id) references public.users(id)
    on update restrict on delete restrict,
  constraint user_operational_assignments_campaign_fk
    foreign key (campaign_id) references public.campaigns(id)
    on update restrict on delete restrict,
  constraint user_operational_assignments_team_campaign_fk
    foreign key (team_id, campaign_id) references public.teams(id, campaign_id)
    on update restrict on delete restrict,
  constraint user_operational_assignments_position_fk
    foreign key (position_id) references public.positions(id)
    on update restrict on delete restrict,
  constraint user_operational_assignments_period_valid check (
    ended_at is null or ended_at >= started_at
  )
);

create unique index user_operational_assignments_active_campaign_unique
  on public.user_operational_assignments(user_id, campaign_id, position_id)
  where ended_at is null and team_id is null;

create unique index user_operational_assignments_active_team_unique
  on public.user_operational_assignments(user_id, campaign_id, team_id, position_id)
  where ended_at is null and team_id is not null;

create unique index user_operational_assignments_active_primary_unique
  on public.user_operational_assignments(user_id)
  where ended_at is null and is_primary;

create index user_operational_assignments_user_history_idx
  on public.user_operational_assignments(user_id, started_at desc, id);
create index user_operational_assignments_campaign_active_idx
  on public.user_operational_assignments(campaign_id, user_id) where ended_at is null;
create index user_operational_assignments_team_active_idx
  on public.user_operational_assignments(team_id, user_id)
  where ended_at is null and team_id is not null;

create function pulse_private.enforce_position_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if new.id is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable position identity fields cannot be changed';
  end if;

  new.updated_at := now();
  return new;
end
$function$;

create function pulse_private.enforce_operational_assignment_write()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.campaign_id is distinct from old.campaign_id
    or new.team_id is distinct from old.team_id
    or new.position_id is distinct from old.position_id
    or new.started_at is distinct from old.started_at
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'operational assignment identity and target fields are immutable';
  end if;

  if new.ended_at is null then
    if not exists (
      select 1 from public.campaigns campaign
      where campaign.id = new.campaign_id and campaign.is_active
    ) then
      raise exception 'active operational assignment requires an active Campaign' using errcode = '55000';
    end if;

    if not exists (
      select 1 from public.positions position
      where position.id = new.position_id and position.is_active
    ) then
      raise exception 'active operational assignment requires an active Position' using errcode = '55000';
    end if;

    if new.team_id is not null and not exists (
      select 1 from public.teams team
      where team.id = new.team_id
        and team.campaign_id = new.campaign_id
        and team.is_active
    ) then
      raise exception 'active operational assignment requires an active Team in the selected Campaign' using errcode = '55000';
    end if;
  end if;

  new.updated_at := now();
  return new;
end
$function$;

alter function pulse_private.enforce_position_update() owner to postgres;
alter function pulse_private.enforce_operational_assignment_write() owner to postgres;
revoke all on function pulse_private.enforce_position_update() from public, anon, authenticated, service_role;
revoke all on function pulse_private.enforce_operational_assignment_write() from public, anon, authenticated, service_role;

create trigger positions_enforce_update
before update on public.positions
for each row execute function pulse_private.enforce_position_update();

create trigger user_operational_assignments_enforce_write
before insert or update on public.user_operational_assignments
for each row execute function pulse_private.enforce_operational_assignment_write();

insert into public.permissions(id, key, description)
values
  ('20000000-0000-0000-0000-000000000034', 'positions.view', 'View the protected Position catalog.'),
  ('20000000-0000-0000-0000-000000000035', 'assignments.view', 'View protected operational assignment history.');

-- Read authority starts with Super Admin only. Broader workforce visibility
-- requires a later policy checkpoint.
insert into public.role_permissions(role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.key = 'super_admin'
  and permission.key in ('positions.view', 'assignments.view');

alter table public.positions enable row level security;
alter table public.user_operational_assignments enable row level security;

revoke all on table public.positions from public, anon, authenticated;
revoke all on table public.user_operational_assignments from public, anon, authenticated;
grant all on table public.positions to service_role;
grant all on table public.user_operational_assignments to service_role;

create function public.list_managed_positions()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  current_user_count bigint,
  assignment_count bigint,
  active_assignment_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('positions.view');

  return query
  select
    position.id,
    position.code,
    position.name,
    position.description,
    position.is_active,
    position.created_at,
    position.updated_at,
    (select count(*) from public.users target where target.position_id = position.id),
    (select count(*) from public.user_operational_assignments assignment where assignment.position_id = position.id),
    (select count(*) from public.user_operational_assignments assignment where assignment.position_id = position.id and assignment.ended_at is null)
  from public.positions position
  order by position.name, position.id;
end
$function$;

create function public.get_user_operational_assignments(target_user_id uuid)
returns table (
  assignment_id uuid,
  user_id uuid,
  position_id uuid,
  position_code text,
  position_name text,
  campaign_id uuid,
  campaign_code text,
  campaign_name text,
  team_id uuid,
  team_code text,
  team_name text,
  is_primary boolean,
  started_at timestamptz,
  ended_at timestamptz,
  is_active boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  perform pulse_private.require_global_permission('assignments.view');

  if not exists (select 1 from public.users target where target.id = target_user_id) then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  return query
  select
    assignment.id,
    assignment.user_id,
    position.id,
    position.code,
    position.name,
    campaign.id,
    campaign.code,
    campaign.name,
    team.id,
    team.code,
    team.name,
    assignment.is_primary,
    assignment.started_at,
    assignment.ended_at,
    assignment.ended_at is null
  from public.user_operational_assignments assignment
  join public.positions position on position.id = assignment.position_id
  join public.campaigns campaign on campaign.id = assignment.campaign_id
  left join public.teams team on team.id = assignment.team_id
  where assignment.user_id = target_user_id
  order by
    (assignment.ended_at is null) desc,
    assignment.is_primary desc,
    assignment.started_at desc,
    assignment.id;
end
$function$;

-- Upgrade only the single-user projection. The list contract remains stable.
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
  position_name text
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
    position.name
  from public.list_managed_users(null) managed
  join public.users target on target.id = managed.id
  left join public.positions position on position.id = target.position_id
  where managed.id = target_user_id
$function$;

alter function public.list_managed_positions() owner to postgres;
alter function public.get_user_operational_assignments(uuid) owner to postgres;
alter function public.get_managed_user(uuid) owner to postgres;

revoke all on function public.list_managed_positions() from public, anon, service_role;
revoke all on function public.get_user_operational_assignments(uuid) from public, anon, service_role;
revoke all on function public.get_managed_user(uuid) from public, anon, service_role;
grant execute on function public.list_managed_positions() to authenticated;
grant execute on function public.get_user_operational_assignments(uuid) to authenticated;
grant execute on function public.get_managed_user(uuid) to authenticated;

comment on table public.positions is
  'Canonical employment/job function catalog. A Position is not an RBAC role.';
comment on column public.users.position_id is
  'Optional current general Position, independent from operational assignments and RBAC.';
comment on table public.user_operational_assignments is
  'Historical user placement in one Campaign and optional canonical Team, with assignment-specific Position. It grants no permissions.';
comment on column public.user_operational_assignments.is_primary is
  'At most one active assignment may be primary per user; historical primary records remain intact.';
comment on function public.list_managed_positions() is
  'Protected read-only Position catalog for global Admin operators with positions.view.';
comment on function public.get_user_operational_assignments(uuid) is
  'Protected resolved assignment history requiring admin.access, users.view, and assignments.view.';
