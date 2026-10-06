-- Explicit permanent removal of an account's own audit history. Shared/unknown
-- dependencies still fail closed: deleting another person's records is not implied.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

create table pulse_private.staff_audit_purge_context (
  backend_pid integer not null,
  transaction_id bigint not null,
  target_user_id uuid not null,
  operator_user_id uuid not null,
  primary key(backend_pid,transaction_id,target_user_id)
);
alter table pulse_private.staff_audit_purge_context enable row level security;
revoke all on pulse_private.staff_audit_purge_context from public,anon,authenticated,service_role;

-- A completed nonce contains no deleted person's name, email, Staff ID or Auth ID.
create table pulse_private.staff_purge_receipts (
  request_key uuid primary key,
  operator_auth_id uuid not null,
  target_proof text not null check(length(target_proof)=64),
  completed_at timestamptz not null default now()
);
alter table pulse_private.staff_purge_receipts enable row level security;
revoke all on pulse_private.staff_purge_receipts from public,anon,authenticated,service_role;

create or replace function pulse_private.prevent_audit_mutation()
returns trigger language plpgsql set search_path=pg_catalog as $function$
begin
  if tg_op='DELETE' and current_user='postgres' and exists(
    select 1 from pulse_private.staff_audit_purge_context context
    join public.users operator on operator.id=context.operator_user_id
      and operator.status='active' and operator.removed_at is null
    join public.user_roles assignment on assignment.user_id=operator.id and assignment.scope_type='global'
    join public.roles role on role.id=assignment.role_id and role.is_active
    join public.role_permissions grant_row on grant_row.role_id=role.id
    join public.permissions permission on permission.id=grant_row.permission_id
      and permission.key='users.remove' and permission.is_active
    where context.backend_pid=pg_backend_pid() and context.transaction_id=txid_current()
      and context.target_user_id<>operator.id
      and old.target_type='user' and old.target_id=context.target_user_id
  ) then return old; end if;
  raise exception 'audit events are append-only';
end
$function$;

alter function pulse_private.staff_removal_dependencies(uuid) rename to admin2_staff_removal_dependencies_base;
create function pulse_private.staff_removal_dependencies(target_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare dependencies jsonb; shared_audit bigint;
begin
  dependencies := pulse_private.admin2_staff_removal_dependencies_base(target_id)
    - 'audit_history' - 'public.audit_events.actor_user_id';
  select count(*) into shared_audit from public.audit_events audit
    where audit.actor_user_id=staff_removal_dependencies.target_id
      and (audit.target_type is distinct from 'user' or audit.target_id is distinct from staff_removal_dependencies.target_id);
  if shared_audit>0 then dependencies := dependencies || jsonb_build_object('shared_audit_history',shared_audit); end if;
  return dependencies;
end
$function$;

alter function public.prepare_staff_removal(uuid,timestamptz,text,uuid) set schema pulse_private;
alter function pulse_private.prepare_staff_removal(uuid,timestamptz,text,uuid) rename to admin2_prepare_staff_removal_base;
create function public.prepare_staff_removal(target_user_id uuid,expected_updated_at timestamptz,
  requested_confirmation text,request_key uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare operator_id uuid := pulse_private.require_global_permission('users.remove');
  inspection jsonb; outcome jsonb;
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  if requested_confirmation is distinct from 'REMOVE' or request_key is null then
    raise exception 'Deliberate removal confirmation required' using errcode='22023'; end if;
  if exists(select 1 from pulse_private.staff_purge_receipts receipt
    where receipt.request_key=prepare_staff_removal.request_key) then
    if not exists(select 1 from pulse_private.staff_purge_receipts receipt
      where receipt.request_key=prepare_staff_removal.request_key and receipt.operator_auth_id=auth.uid()
        and receipt.target_proof=encode(sha256(convert_to(prepare_staff_removal.request_key::text||':'||prepare_staff_removal.target_user_id::text,'UTF8')),'hex')) then
      raise exception 'Removal request mismatch' using errcode='42501'; end if;
    return jsonb_build_object('request_key',request_key,'kind','purge','removed',true,'cleanup_pending',false);
  end if;
  if exists(select 1 from pulse_private.staff_removal_jobs job where job.request_key=prepare_staff_removal.request_key) then
    return pulse_private.admin2_prepare_staff_removal_base(target_user_id,expected_updated_at,requested_confirmation,request_key);
  end if;
  -- Serialize with lifecycle changes and with the original removal implementation.
  lock table public.users,public.user_roles,public.audit_events in share row exclusive mode;
  inspection := public.inspect_staff_removal(target_user_id);
  if inspection->>'kind'<>'purge' then
    raise exception 'Shared account records require an explicit deletion plan' using errcode='55000'; end if;
  if (inspection->>'version')::timestamptz is distinct from expected_updated_at then
    raise exception 'Identity changed since inspection' using errcode='55000'; end if;
  insert into pulse_private.staff_audit_purge_context values(pg_backend_pid(),txid_current(),target_user_id,operator_id);
  delete from public.audit_events where target_type='user' and target_id=target_user_id;
  outcome := pulse_private.admin2_prepare_staff_removal_base(target_user_id,expected_updated_at,requested_confirmation,request_key);
  -- The legacy implementation writes account.removed; permanent removal erases it too.
  delete from public.audit_events where target_type='user' and target_id=target_user_id;
  delete from pulse_private.staff_audit_purge_context where backend_pid=pg_backend_pid() and transaction_id=txid_current();
  return outcome;
end
$function$;

alter function public.get_staff_removal_cleanup(uuid,uuid) set schema pulse_private;
alter function pulse_private.get_staff_removal_cleanup(uuid,uuid) rename to admin2_get_staff_removal_cleanup_base;
create function public.get_staff_removal_cleanup(request_key uuid,operator_auth_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
begin
  if exists(select 1 from pulse_private.staff_purge_receipts receipt
    join public.users operator on operator.auth_user_id=receipt.operator_auth_id
      and operator.status='active' and operator.removed_at is null
    where receipt.request_key=get_staff_removal_cleanup.request_key
      and receipt.operator_auth_id=get_staff_removal_cleanup.operator_auth_id) then
    return jsonb_build_object('kind','purge','auth_done',true,'media_done',true);
  end if;
  return pulse_private.admin2_get_staff_removal_cleanup_base(request_key,operator_auth_id);
end
$function$;

alter function public.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean) set schema pulse_private;
alter function pulse_private.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean) rename to admin2_complete_staff_removal_cleanup_base;
create function public.complete_staff_removal_cleanup(request_key uuid,operator_auth_id uuid,auth_done boolean,media_done boolean)
returns boolean language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare job pulse_private.staff_removal_jobs%rowtype;
begin
  perform public.get_staff_removal_cleanup(request_key,operator_auth_id);
  select * into job from pulse_private.staff_removal_jobs where staff_removal_jobs.request_key=complete_staff_removal_cleanup.request_key for update;
  if not found then return true; end if;
  perform pulse_private.admin2_complete_staff_removal_cleanup_base(request_key,operator_auth_id,auth_done,media_done);
  if job.removal_kind='purge' and (job.auth_cleanup_done or auth_done) and (job.media_cleanup_done or media_done) then
    insert into pulse_private.staff_purge_receipts(request_key,operator_auth_id,target_proof)
      values(request_key,operator_auth_id,encode(sha256(convert_to(request_key::text||':'||job.target_user_id::text,'UTF8')),'hex')) on conflict do nothing;
    -- Finished jobs no longer retain the removed person's identifiers or avatar path.
    delete from pulse_private.staff_removal_jobs where target_auth_user_id=job.target_auth_user_id and completed_at is not null;
  end if;
  return true;
end
$function$;

-- PL/pgSQL permits function-name qualification of parameters. Renaming a
-- function does not rewrite those body references, so preserve their binding.
do $block$
declare mapping record; definition text;
begin
  for mapping in select * from (values
    ('admin2_staff_removal_dependencies_base','staff_removal_dependencies.'),
    ('admin2_prepare_staff_removal_base','prepare_staff_removal.'),
    ('admin2_get_staff_removal_cleanup_base','get_staff_removal_cleanup.'),
    ('admin2_complete_staff_removal_cleanup_base','complete_staff_removal_cleanup.')
  ) names(base_name,old_qualifier) loop
    select pg_get_functiondef(function.oid) into strict definition from pg_proc function
      where function.pronamespace='pulse_private'::regnamespace and function.proname=mapping.base_name;
    execute replace(definition,mapping.old_qualifier,mapping.base_name||'.');
  end loop;
end
$block$;

revoke all on function pulse_private.staff_removal_dependencies(uuid),
  pulse_private.admin2_staff_removal_dependencies_base(uuid),
  pulse_private.admin2_prepare_staff_removal_base(uuid,timestamptz,text,uuid),
  pulse_private.admin2_get_staff_removal_cleanup_base(uuid,uuid),
  pulse_private.admin2_complete_staff_removal_cleanup_base(uuid,uuid,boolean,boolean)
  from public,anon,authenticated,service_role;
revoke all on function public.prepare_staff_removal(uuid,timestamptz,text,uuid) from public,anon,service_role;
grant execute on function public.prepare_staff_removal(uuid,timestamptz,text,uuid) to authenticated;
revoke all on function public.get_staff_removal_cleanup(uuid,uuid),
  public.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.get_staff_removal_cleanup(uuid,uuid),
  public.complete_staff_removal_cleanup(uuid,uuid,boolean,boolean) to service_role;
commit;
