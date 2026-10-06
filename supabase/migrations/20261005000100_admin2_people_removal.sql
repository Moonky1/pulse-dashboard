-- ADMIN-2: irreversible product removal, without rewriting historical attribution.
begin;

alter table public.users add column removed_at timestamptz;
alter table public.users add constraint users_removed_no_access
  check (removed_at is null or status='inactive');
alter table public.staff_invitations add column removed_at timestamptz;

insert into public.permissions(key,description)
values('users.remove','Irreversibly remove a Staff identity after a server dependency check.');
insert into public.role_permissions(role_id,permission_id)
select role.id,permission.id from public.roles role cross join public.permissions permission
where role.key='super_admin' and permission.key='users.remove';

create table pulse_private.staff_removal_jobs (
  request_key uuid primary key,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  actor_auth_user_id uuid not null,
  target_user_id uuid not null,
  target_auth_user_id uuid not null,
  removal_kind text not null check (removal_kind in ('purge','historical')),
  avatar_path text,
  prepared_at timestamptz not null default now(),
  completed_at timestamptz,
  auth_cleanup_done boolean not null default false,
  media_cleanup_done boolean not null default false
);
alter table pulse_private.staff_removal_jobs enable row level security;
revoke all on pulse_private.staff_removal_jobs from public,anon,authenticated;
grant all on pulse_private.staff_removal_jobs to service_role;

create function pulse_private.guard_removed_staff()
returns trigger language plpgsql set search_path=pg_catalog as $function$
begin
  if old.removed_at is not null then
    raise exception 'Removed identity cannot be reactivated or edited' using errcode='55000';
  end if;
  return new;
end
$function$;
create trigger a00_users_guard_removed before update on public.users
for each row execute function pulse_private.guard_removed_staff();

create function pulse_private.guard_removed_staff_assignment()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
begin
  if exists(select 1 from public.users where id=new.user_id and removed_at is not null) then
    raise exception 'Removed identity cannot receive new access or work assignments' using errcode='55000';
  end if;
  return new;
end
$function$;
create trigger a00_user_roles_guard_removed before insert or update on public.user_roles
for each row execute function pulse_private.guard_removed_staff_assignment();
create trigger a00_work_assignments_guard_removed before insert or update on public.user_operational_assignments
for each row execute function pulse_private.guard_removed_staff_assignment();

-- Fail closed for new references: unknown/composite foreign keys also retain history.
create function pulse_private.staff_removal_dependencies(target_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare dependency record; amount bigint; counts jsonb := '{}'::jsonb; auth_id uuid;
begin
  select auth_user_id into auth_id from public.users where id=target_id;
  for dependency in
    select namespace.nspname as schema_name, relation.relname as table_name,
      attribute.attname as column_name, cardinality(constraint_row.conkey) as key_count
    from pg_constraint constraint_row
    join pg_class relation on relation.oid=constraint_row.conrelid
    join pg_namespace namespace on namespace.oid=relation.relnamespace
    join pg_attribute attribute on attribute.attrelid=relation.oid
      and attribute.attnum=constraint_row.conkey[1]
    where constraint_row.contype='f' and constraint_row.confrelid='public.users'::regclass
  loop
    if dependency.key_count<>1 then
      counts := counts || jsonb_build_object(dependency.schema_name||'.'||dependency.table_name,1);
      continue;
    end if;
    if dependency.schema_name='public' and dependency.table_name='user_roles' then
      if dependency.column_name='user_id' then continue; end if;
      execute format('select count(*) from %I.%I where %I=$1 and user_id<>$1',
        dependency.schema_name,dependency.table_name,dependency.column_name) into amount using target_id;
    elsif dependency.schema_name='public' and dependency.table_name='user_operational_assignments'
      and dependency.column_name='user_id' then
      select count(*) into amount from public.user_operational_assignments
      where user_id=target_id and ended_at is not null;
    elsif dependency.schema_name='public' and dependency.table_name='training_staff_learner_links' then
      -- Even a bridge without attempts is a retained canonical training identity.
      select count(*) into amount from public.training_staff_learner_links where staff_user_id=target_id;
    else
      execute format('select count(*) from %I.%I where %I=$1',
        dependency.schema_name,dependency.table_name,dependency.column_name) into amount using target_id;
    end if;
    if amount>0 then counts := counts || jsonb_build_object(
      dependency.schema_name||'.'||dependency.table_name||'.'||dependency.column_name,amount); end if;
  end loop;
  select count(*) into amount from public.audit_events event where event.target_id=staff_removal_dependencies.target_id;
  if amount>0 then counts := counts || jsonb_build_object('audit_history',amount); end if;
  select count(*) into amount from public.staff_invitations where auth_user_id=auth_id;
  if amount>0 then counts := counts || jsonb_build_object('invitation_identity',amount); end if;
  -- Any additional public/private FK to Auth is inspected, not just known invitations.
  for dependency in
    select namespace.nspname as schema_name,relation.relname as table_name,
      attribute.attname as column_name,cardinality(constraint_row.conkey) as key_count
    from pg_constraint constraint_row
    join pg_class relation on relation.oid=constraint_row.conrelid
    join pg_namespace namespace on namespace.oid=relation.relnamespace
    join pg_attribute attribute on attribute.attrelid=relation.oid and attribute.attnum=constraint_row.conkey[1]
    where constraint_row.contype='f' and constraint_row.confrelid='auth.users'::regclass
      and namespace.nspname in ('public','pulse_private') and relation.oid<>'public.users'::regclass
  loop
    if dependency.key_count<>1 then amount := 1;
    else execute format('select count(*) from %I.%I where %I=$1',
      dependency.schema_name,dependency.table_name,dependency.column_name) into amount using auth_id; end if;
    if amount>0 then counts := counts || jsonb_build_object(
      'auth.'||dependency.schema_name||'.'||dependency.table_name,amount); end if;
  end loop;
  return counts;
end
$function$;

create function public.inspect_staff_removal(target_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare actor_id uuid := pulse_private.require_global_permission('users.remove');
  target public.users%rowtype; dependencies jsonb;
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  if actor_id=target_user_id then raise exception 'Self-removal denied' using errcode='42501'; end if;
  select * into target from public.users where id=target_user_id and removed_at is null;
  if not found then raise exception 'Identity unavailable' using errcode='P0002'; end if;
  if exists(select 1 from public.user_roles assignment join public.roles role on role.id=assignment.role_id
      where assignment.user_id=target_user_id and role.key='super_admin' and role.is_active) then
    if not pulse_private.is_active_super_admin(actor_id) then
      raise exception 'Only a Super Admin can remove a Super Admin' using errcode='42501';
    end if;
    if target.status='active' and not exists(select 1 from public.users staff
      join public.user_roles assignment on assignment.user_id=staff.id
      join public.roles role on role.id=assignment.role_id
      where staff.id<>target_user_id and staff.status='active' and staff.removed_at is null
        and role.key='super_admin' and role.is_active and assignment.scope_type='global') then
      raise exception 'Last active Super Admin cannot be removed' using errcode='55000';
    end if;
  end if;
  dependencies := pulse_private.staff_removal_dependencies(target_user_id);
  return jsonb_build_object('kind',case when dependencies='{}'::jsonb then 'purge' else 'historical' end,
    'version',target.updated_at,'name',coalesce(target.display_name,target.full_name),
    'history_required',dependencies<>'{}'::jsonb);
end
$function$;

create function public.prepare_staff_removal(target_user_id uuid,expected_updated_at timestamptz,
  requested_confirmation text,request_key uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare actor_id uuid := pulse_private.require_global_permission('users.remove');
  target public.users%rowtype; inspection jsonb; job pulse_private.staff_removal_jobs%rowtype;
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  if requested_confirmation is distinct from 'REMOVE' or request_key is null then
    raise exception 'Deliberate removal confirmation required' using errcode='22023'; end if;
  if actor_id=target_user_id then raise exception 'Self-removal denied' using errcode='42501'; end if;
  -- Same tables used by lifecycle/role changes; counts cannot race the final removal.
  lock table public.users,public.user_roles in share row exclusive mode;
  select * into job from pulse_private.staff_removal_jobs where staff_removal_jobs.request_key=prepare_staff_removal.request_key;
  if found then
    if job.actor_user_id<>actor_id or job.target_user_id<>target_user_id then
      raise exception 'Removal request mismatch' using errcode='42501'; end if;
    return jsonb_build_object('request_key',job.request_key,'kind',job.removal_kind,'removed',true,
      'cleanup_pending',job.completed_at is null);
  end if;
  select * into target from public.users where id=target_user_id for update;
  if not found or target.removed_at is not null then raise exception 'Identity unavailable' using errcode='P0002'; end if;
  if target.updated_at is distinct from expected_updated_at then
    raise exception 'Identity changed since inspection' using errcode='55000'; end if;
  inspection := public.inspect_staff_removal(target_user_id);
  insert into pulse_private.staff_removal_jobs(request_key,actor_user_id,actor_auth_user_id,target_user_id,
    target_auth_user_id,removal_kind,avatar_path)
  values(request_key,actor_id,auth.uid(),target.id,target.auth_user_id,inspection->>'kind',target.custom_avatar_path);
  -- Refresh sessions are revoked transactionally. Old access JWTs also fail live Staff checks.
  delete from auth.sessions where user_id=target.auth_user_id;
  delete from public.user_roles where user_id=target.id;
  if inspection->>'kind'='purge' then
    delete from public.user_operational_assignments where user_id=target.id;
    delete from public.users where id=target.id;
  else
    update public.user_operational_assignments set ended_at=now() where user_id=target.id and ended_at is null;
    update public.users set status='inactive',removed_at=now(),position_id=null,team_id=null,department_id=null,
      profile_bio=null,profile_presence=null,profile_visible_to_staff=false,
      google_avatar_url=null,custom_avatar_path=null,avatar_updated_at=now()
    where id=target.id;
  end if;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,request_id,metadata)
  values(actor_id,'user',target.id,'account.removed','server',request_key,
    jsonb_build_object('removal_kind',inspection->>'kind','history_preserved',inspection->>'kind'='historical'));
  return jsonb_build_object('request_key',request_key,'kind',inspection->>'kind','removed',true,'cleanup_pending',true);
end
$function$;

-- Only the authenticated Edge boundary can obtain cleanup identifiers.
create function public.get_staff_removal_cleanup(request_key uuid,operator_auth_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare job pulse_private.staff_removal_jobs%rowtype;
begin
  select * into job from pulse_private.staff_removal_jobs where staff_removal_jobs.request_key=get_staff_removal_cleanup.request_key;
  if not found or job.actor_auth_user_id<>operator_auth_id or not exists(
    select 1 from public.users where id=job.actor_user_id and auth_user_id=operator_auth_id
      and status='active' and removed_at is null) then
    raise exception 'Cleanup not authorized' using errcode='42501'; end if;
  return jsonb_build_object('auth_user_id',job.target_auth_user_id,'kind',job.removal_kind,
    'avatar_path',job.avatar_path,'auth_done',job.auth_cleanup_done,'media_done',job.media_cleanup_done);
end
$function$;
create function public.complete_staff_removal_cleanup(request_key uuid,operator_auth_id uuid,
  auth_done boolean,media_done boolean)
returns boolean language plpgsql volatile security definer set search_path=pg_catalog as $function$
begin
  perform public.get_staff_removal_cleanup(request_key,operator_auth_id);
  update pulse_private.staff_removal_jobs set
    auth_cleanup_done=auth_cleanup_done or auth_done,media_cleanup_done=media_cleanup_done or media_done,
    completed_at=case when (auth_cleanup_done or auth_done) and (media_cleanup_done or media_done) then coalesce(completed_at,now()) else null end
  where staff_removal_jobs.request_key=complete_staff_removal_cleanup.request_key;
  return true;
end
$function$;

create function public.list_own_staff_removal_tasks()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare operator_id uuid := pulse_private.require_global_permission('users.remove');
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  return (select coalesce(jsonb_agg(jsonb_build_object('request_key',request_key,
    'user_id',target_user_id,'version',prepared_at) order by prepared_at),'[]'::jsonb)
    from (select * from pulse_private.staff_removal_jobs where actor_user_id=operator_id
      and completed_at is null order by prepared_at limit 50) pending);
end
$function$;

-- Preserve deployed shapes and permission checks; filter removed identities centrally.
do $block$
declare result_shape text;
begin
  result_shape := pg_get_function_result('public.list_managed_users(text)'::regprocedure);
  alter function public.list_managed_users(text) set schema pulse_private;
  alter function pulse_private.list_managed_users(text) rename to admin2_list_managed_users_base;
  execute format('create function public.list_managed_users(requested_status text default null) returns %s
    language sql stable security definer set search_path=pg_catalog as $body$
      select item.* from pulse_private.admin2_list_managed_users_base(requested_status) item
      join public.users staff on staff.id=item.id where staff.removed_at is null $body$',result_shape);
  revoke all on function pulse_private.admin2_list_managed_users_base(text) from public,anon,authenticated;
end
$block$;
drop policy users_self_or_authorized_read on public.users;
create policy users_self_or_authorized_read on public.users for select to authenticated
using (removed_at is null and (auth_user_id=auth.uid() or pulse_private.has_permission('users.view',department_id,team_id)));

revoke all on function pulse_private.staff_removal_dependencies(uuid) from public,anon,authenticated;
revoke all on function pulse_private.guard_removed_staff() from public,anon,authenticated;
revoke all on function pulse_private.guard_removed_staff_assignment() from public,anon,authenticated;
revoke all on function public.inspect_staff_removal(uuid) from public,anon;
revoke all on function public.prepare_staff_removal(uuid,timestamptz,text,uuid) from public,anon;
revoke all on function public.get_staff_removal_cleanup(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean) from public,anon,authenticated;
revoke all on function public.list_managed_users(text) from public,anon;
revoke all on function public.list_own_staff_removal_tasks() from public,anon;
grant execute on function public.inspect_staff_removal(uuid),public.prepare_staff_removal(uuid,timestamptz,text,uuid),
  public.list_managed_users(text),public.list_own_staff_removal_tasks() to authenticated;
grant execute on function public.get_staff_removal_cleanup(uuid,uuid),
  public.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean) to service_role;
commit;
