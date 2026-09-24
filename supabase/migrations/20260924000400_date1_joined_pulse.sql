-- PULSE DATE-1: canonical, correctable date on which a person joined Pulse.

alter table public.users
  add column pulse_joined_on date;

comment on column public.users.pulse_joined_on is
  'Date the person officially joined Pulse. Independent from employment and Auth timestamps.';

create function pulse_private.enforce_pulse_joined_on()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if new.pulse_joined_on is not null and new.pulse_joined_on > current_date then
    raise exception 'Joined Pulse date cannot be in the future' using errcode = '22023';
  end if;

  if new.pulse_joined_on is null and new.status = 'active' then
    if tg_op = 'INSERT' or old.status = 'pending_approval' then
      new.pulse_joined_on := current_date;
    end if;
  end if;

  return new;
end
$function$;

create trigger users_enforce_pulse_joined_on
before insert or update of status, pulse_joined_on on public.users
for each row execute function pulse_private.enforce_pulse_joined_on();

create function public.set_staff_pulse_joined_on(
  target_user_id uuid,
  requested_pulse_joined_on date
)
returns table (
  id uuid,
  pulse_joined_on date,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('users.manage');
  target public.users%rowtype;
  previous_value date;
begin
  if requested_pulse_joined_on is null then
    raise exception 'Joined Pulse date is required' using errcode = '22023';
  end if;
  if requested_pulse_joined_on > current_date then
    raise exception 'Joined Pulse date cannot be in the future' using errcode = '22023';
  end if;

  select * into target
  from public.users staff
  where staff.id = target_user_id
  for update;

  if not found then
    raise exception 'Pulse user not found' using errcode = 'P0002';
  end if;
  if target.status = 'pending_approval' then
    raise exception 'Joined Pulse is available only after Staff activation' using errcode = '55000';
  end if;
  if target.pulse_joined_on is not distinct from requested_pulse_joined_on then
    return query select target.id, target.pulse_joined_on, false;
    return;
  end if;

  previous_value := target.pulse_joined_on;
  update public.users staff
  set pulse_joined_on = requested_pulse_joined_on
  where staff.id = target.id
  returning staff.* into target;

  insert into public.audit_events (
    actor_user_id,
    target_type,
    target_id,
    action,
    source,
    metadata
  ) values (
    actor_id,
    'user',
    target.id,
    'account.joined_pulse_updated',
    'database',
    jsonb_strip_nulls(jsonb_build_object(
      'previous_pulse_joined_on', previous_value,
      'pulse_joined_on', target.pulse_joined_on
    ))
  );

  return query select target.id, target.pulse_joined_on, true;
end
$function$;

-- Extend only the protected Staff-detail projection. Directory and tree cards
-- intentionally remain unchanged.
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
  primary_team_name text,
  google_avatar_url text,
  custom_avatar_path text,
  avatar_updated_at timestamptz,
  pulse_joined_on date
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
    operational_team.name,
    target.google_avatar_url,
    target.custom_avatar_path,
    target.avatar_updated_at,
    target.pulse_joined_on
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

alter function pulse_private.enforce_pulse_joined_on() owner to postgres;
alter function public.set_staff_pulse_joined_on(uuid, date) owner to postgres;
alter function public.get_managed_user(uuid) owner to postgres;

revoke all on function pulse_private.enforce_pulse_joined_on() from public, anon, authenticated, service_role;
revoke all on function public.set_staff_pulse_joined_on(uuid, date) from public, anon, service_role;
revoke all on function public.get_managed_user(uuid) from public, anon, service_role;

grant execute on function public.set_staff_pulse_joined_on(uuid, date) to authenticated;
grant execute on function public.get_managed_user(uuid) to authenticated;

comment on function public.set_staff_pulse_joined_on(uuid, date) is
  'Allows a globally authorized Staff administrator to correct one canonical Joined Pulse date with idempotent audit.';
comment on function public.get_managed_user(uuid) is
  'Returns one authorized Staff profile including canonical avatar, placement, access, and Joined Pulse details.';
