-- Pulse ADMIN-5A: protected, read-only Audit and User History contracts.

revoke select on table public.audit_events from authenticated;

create function public.list_audit_events(
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
  page_size integer := coalesce(requested_limit, 25);
  normalized_category text := nullif(lower(btrim(requested_category)), '');
  normalized_action text := nullif(lower(btrim(requested_action)), '');
  normalized_target_type text := nullif(lower(btrim(requested_target_type)), '');
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('audit.view');

  if page_size < 1 or page_size > 100 then
    raise exception 'requested_limit must be between 1 and 100' using errcode = '22023';
  end if;
  if (before_occurred_at is null) <> (before_event_id is null) then
    raise exception 'audit cursor requires both timestamp and event id' using errcode = '22023';
  end if;
  if normalized_category is not null and normalized_category not in ('account', 'roles', 'organization', 'system') then
    raise exception 'unsupported audit category' using errcode = '22023';
  end if;
  if normalized_action is not null and normalized_action !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception 'invalid audit action' using errcode = '22023';
  end if;
  if normalized_target_type is not null and normalized_target_type not in ('user', 'department', 'team', 'role') then
    raise exception 'unsupported audit target type' using errcode = '22023';
  end if;
  if normalized_target_type is null and requested_target_id is not null then
    raise exception 'target id requires target type' using errcode = '22023';
  end if;
  if occurred_from is not null and occurred_to is not null and occurred_from > occurred_to then
    raise exception 'invalid audit date range' using errcode = '22023';
  end if;

  return query
  with candidates as (
    select
      audit.id,
      audit.action,
      case
        when audit.action like 'account.%' then 'account'
        when audit.action like 'role.%' then 'roles'
        when audit.action like 'department.%' or audit.action like 'team.%' then 'organization'
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
      coalesce(target_user.full_name, target_department.name, target_team.name,
        nullif(left(audit.metadata ->> 'name', 160), ''), audit.target_type) as target_name,
      target_user.employee_id as target_employee_id,
      target_role.id as role_id,
      target_role.name as role_name,
      case when audit.metadata ->> 'scope_type' in ('global', 'department', 'team')
        then audit.metadata ->> 'scope_type' end as scope_type,
      metadata_department.id as department_id,
      metadata_department.name as department_name,
      metadata_team.id as team_id,
      metadata_team.name as team_name,
      nullif(left(btrim(audit.metadata ->> 'reason'), 500), '') as reason,
      jsonb_strip_nulls(jsonb_build_object(
        'previous_status', case when audit.metadata ->> 'previous_status' in ('pending_approval', 'active', 'blocked', 'inactive') then audit.metadata ->> 'previous_status' end,
        'scope_type', case when audit.metadata ->> 'scope_type' in ('global', 'department', 'team') then audit.metadata ->> 'scope_type' end,
        'code', nullif(left(audit.metadata ->> 'code', 120), ''),
        'name', nullif(left(audit.metadata ->> 'name', 160), ''),
        'before', case when jsonb_typeof(audit.metadata -> 'before') = 'object' then jsonb_strip_nulls(jsonb_build_object(
          'code', nullif(left(audit.metadata #>> '{before,code}', 120), ''),
          'name', nullif(left(audit.metadata #>> '{before,name}', 160), '')
        )) end,
        'after', case when jsonb_typeof(audit.metadata -> 'after') = 'object' then jsonb_strip_nulls(jsonb_build_object(
          'code', nullif(left(audit.metadata #>> '{after,code}', 120), ''),
          'name', nullif(left(audit.metadata #>> '{after,name}', 160), '')
        )) end
      )) as safe_metadata,
      row_number() over (order by audit.occurred_at desc, audit.id desc) as row_number
    from public.audit_events audit
    left join public.users actor on actor.id = audit.actor_user_id
    left join public.users target_user on audit.target_type = 'user' and target_user.id = audit.target_id
    left join public.departments target_department on audit.target_type = 'department' and target_department.id = audit.target_id
    left join public.teams target_team on audit.target_type = 'team' and target_team.id = audit.target_id
    left join public.roles target_role on target_role.id::text = audit.metadata ->> 'role_id'
    left join public.departments metadata_department on metadata_department.id::text = case
      when audit.target_type = 'department' then audit.target_id::text
      else audit.metadata ->> 'department_id'
    end
    left join public.teams metadata_team on metadata_team.id::text = case
      when audit.target_type = 'team' then audit.target_id::text
      else audit.metadata ->> 'team_id'
    end
    where (normalized_category is null or normalized_category = case
        when audit.action like 'account.%' then 'account'
        when audit.action like 'role.%' then 'roles'
        when audit.action like 'department.%' or audit.action like 'team.%' then 'organization'
        else 'system'
      end)
      and (normalized_action is null or audit.action = normalized_action)
      and (requested_actor_user_id is null or audit.actor_user_id = requested_actor_user_id)
      and (normalized_target_type is null or audit.target_type = normalized_target_type)
      and (requested_target_id is null or audit.target_id = requested_target_id)
      and (occurred_from is null or audit.occurred_at >= occurred_from)
      and (occurred_to is null or audit.occurred_at <= occurred_to)
      and (before_occurred_at is null or (audit.occurred_at, audit.id) < (before_occurred_at, before_event_id))
    order by audit.occurred_at desc, audit.id desc
    limit page_size + 1
  )
  select
    candidate.id,
    candidate.action,
    candidate.event_category,
    candidate.source,
    candidate.occurred_at,
    candidate.actor_user_id,
    candidate.actor_full_name,
    candidate.actor_display_name,
    candidate.actor_employee_id,
    candidate.target_type,
    candidate.target_id,
    candidate.target_name,
    candidate.target_employee_id,
    candidate.role_id,
    candidate.role_name,
    candidate.scope_type,
    candidate.department_id,
    candidate.department_name,
    candidate.team_id,
    candidate.team_name,
    candidate.reason,
    candidate.safe_metadata,
    exists(select 1 from candidates overflow where overflow.row_number > page_size)
  from candidates candidate
  where candidate.row_number <= page_size
  order by candidate.occurred_at desc, candidate.id desc;
end
$function$;

create function public.get_user_audit_history(
  target_user_id uuid,
  requested_limit integer default 25,
  before_occurred_at timestamptz default null,
  before_event_id uuid default null
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
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  perform pulse_private.require_global_permission('audit.view');

  if target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.users target where target.id = target_user_id) then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  return query
  select *
  from public.list_audit_events(
    requested_limit,
    before_occurred_at,
    before_event_id,
    null,
    null,
    null,
    'user',
    target_user_id,
    null,
    null
  );
end
$function$;

alter function public.list_audit_events(integer, timestamptz, uuid, text, text, uuid, text, uuid, timestamptz, timestamptz) owner to postgres;
alter function public.get_user_audit_history(uuid, integer, timestamptz, uuid) owner to postgres;

revoke all on function public.list_audit_events(integer, timestamptz, uuid, text, text, uuid, text, uuid, timestamptz, timestamptz) from public, anon, service_role;
revoke all on function public.get_user_audit_history(uuid, integer, timestamptz, uuid) from public, anon, service_role;
grant execute on function public.list_audit_events(integer, timestamptz, uuid, text, text, uuid, text, uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.get_user_audit_history(uuid, integer, timestamptz, uuid) to authenticated;

comment on function public.list_audit_events(integer, timestamptz, uuid, text, text, uuid, text, uuid, timestamptz, timestamptz) is
  'Returns a bounded, sanitized, globally authorized audit page without exposing the audit ledger directly.';
comment on function public.get_user_audit_history(uuid, integer, timestamptz, uuid) is
  'Returns a bounded, sanitized audit timeline for one canonical Pulse user.';
