-- Own invitation lifecycle belongs to the removed account, not shared work history.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

alter table pulse_private.staff_audit_purge_context
  add column invitation_ids uuid[] not null default '{}'::uuid[];

create or replace function pulse_private.staff_owned_invitation_ids(target_id uuid)
returns uuid[] language sql stable security definer set search_path=pg_catalog as $function$
  select coalesce(array_agg(invitation.id),'{}'::uuid[])
  from public.users staff join auth.users identity on identity.id=staff.auth_user_id
  join public.staff_invitations invitation on invitation.email_normalized=lower(btrim(identity.email))
    and (invitation.auth_user_id is null or invitation.auth_user_id=identity.id)
  where staff.id=target_id and lower(btrim(staff.email))=lower(btrim(identity.email))
    and not exists(select 1 from public.users other where other.id<>staff.id
      and lower(btrim(other.email))=lower(btrim(identity.email)))
$function$;

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
      and ((old.target_type='user' and old.target_id=context.target_user_id)
        or (old.target_type='staff_invitation' and old.target_id=any(context.invitation_ids)))
  ) then return old; end if;
  raise exception 'audit events are append-only';
end
$function$;

create or replace function pulse_private.staff_removal_dependencies(target_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare dependencies jsonb; owned uuid[]; auth_id uuid; amount bigint; reference_row record;
begin
  select auth_user_id into auth_id from public.users where id=target_id;
  owned := pulse_private.staff_owned_invitation_ids(target_id);
  dependencies := pulse_private.admin2_staff_removal_dependencies_base(target_id)
    - 'audit_history' - 'public.audit_events.actor_user_id'
    - 'invitation_identity' - 'auth.public.staff_invitations'
    - 'public.staff_invitations.created_by_user_id';
  select count(*) into amount from public.staff_invitations
    where auth_user_id=auth_id and not(id=any(owned));
  if amount>0 then dependencies := dependencies||jsonb_build_object('invitation_identity',amount); end if;
  select count(*) into amount from public.staff_invitations
    where created_by_user_id=target_id and not(id=any(owned));
  if amount>0 then dependencies := dependencies||jsonb_build_object('shared_invitations',amount); end if;
  -- An invitation for this email linked to somebody else is never silently erased.
  select count(*) into amount from public.staff_invitations invitation join public.users staff
    on staff.id=target_id and invitation.email_normalized=lower(btrim(staff.email))
    where not(invitation.id=any(owned));
  if amount>0 then dependencies := dependencies||jsonb_build_object('conflicting_invitation_identity',amount); end if;
  select count(*) into amount from public.audit_events audit
    where (audit.actor_user_id=staff_removal_dependencies.target_id or audit.target_id=staff_removal_dependencies.target_id)
      and not(coalesce(audit.target_type='user' and audit.target_id=staff_removal_dependencies.target_id,false)
        or coalesce(audit.target_type='staff_invitation' and audit.target_id=any(owned),false));
  if amount>0 then dependencies := dependencies||jsonb_build_object('shared_audit_history',amount); end if;
  for reference_row in
    select attribute.attname as column_name,cardinality(constraint_row.conkey) as key_count
    from pg_constraint constraint_row join pg_attribute attribute
      on attribute.attrelid=constraint_row.conrelid and attribute.attnum=constraint_row.conkey[1]
    where constraint_row.contype='f' and constraint_row.confrelid='auth.users'::regclass
      and constraint_row.conrelid='public.staff_invitations'::regclass
      and (cardinality(constraint_row.conkey)<>1 or attribute.attname<>'auth_user_id')
  loop
    if reference_row.key_count<>1 then amount := 1;
    else execute format('select count(*) from public.staff_invitations where %I=$1',reference_row.column_name)
      into amount using auth_id; end if;
    if amount>0 then dependencies := dependencies||jsonb_build_object('unknown_invitation_auth_reference',amount); end if;
  end loop;
  -- Unknown references to invitations and cross-person reissue chains fail closed.
  for reference_row in
    select namespace.nspname as schema_name,relation.relname as table_name,
      attribute.attname as column_name,cardinality(constraint_row.conkey) as key_count
    from pg_constraint constraint_row join pg_class relation on relation.oid=constraint_row.conrelid
    join pg_namespace namespace on namespace.oid=relation.relnamespace
    join pg_attribute attribute on attribute.attrelid=relation.oid and attribute.attnum=constraint_row.conkey[1]
    where constraint_row.contype='f' and constraint_row.confrelid='public.staff_invitations'::regclass
  loop
    if reference_row.key_count<>1 then amount := case when cardinality(owned)>0 then 1 else 0 end;
    elsif reference_row.schema_name='public' and reference_row.table_name='staff_invitations'
      and reference_row.column_name='previous_invitation_id' then
      select count(*) into amount from public.staff_invitations where previous_invitation_id=any(owned) and not(id=any(owned));
    else
      execute format('select count(*) from %I.%I where %I=any($1)',reference_row.schema_name,
        reference_row.table_name,reference_row.column_name) into amount using owned;
    end if;
    if amount>0 then dependencies := dependencies||jsonb_build_object('invitation_reference.'||reference_row.schema_name||'.'||reference_row.table_name,amount); end if;
  end loop;
  return dependencies;
end
$function$;

create or replace function public.prepare_staff_removal(target_user_id uuid,expected_updated_at timestamptz,
  requested_confirmation text,request_key uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare operator_id uuid := pulse_private.require_global_permission('users.remove');
  inspection jsonb; outcome jsonb; owned uuid[];
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  if requested_confirmation is distinct from 'REMOVE' or request_key is null then
    raise exception 'Deliberate removal confirmation required' using errcode='22023'; end if;
  if exists(select 1 from pulse_private.staff_purge_receipts receipt where receipt.request_key=prepare_staff_removal.request_key) then
    if not exists(select 1 from pulse_private.staff_purge_receipts receipt
      where receipt.request_key=prepare_staff_removal.request_key and receipt.operator_auth_id=auth.uid()
        and receipt.target_proof=encode(sha256(convert_to(prepare_staff_removal.request_key::text||':'||prepare_staff_removal.target_user_id::text,'UTF8')),'hex')) then
      raise exception 'Removal request mismatch' using errcode='42501'; end if;
    return jsonb_build_object('request_key',request_key,'kind','purge','removed',true,'cleanup_pending',false);
  end if;
  if exists(select 1 from pulse_private.staff_removal_jobs job where job.request_key=prepare_staff_removal.request_key) then
    return pulse_private.admin2_prepare_staff_removal_base(target_user_id,expected_updated_at,requested_confirmation,request_key);
  end if;
  lock table public.users,public.user_roles,public.audit_events,public.staff_invitations in share row exclusive mode;
  inspection := public.inspect_staff_removal(target_user_id);
  if inspection->>'kind'<>'purge' then
    raise exception 'Shared account records require an explicit deletion plan' using errcode='55000'; end if;
  if (inspection->>'version')::timestamptz is distinct from expected_updated_at then
    raise exception 'Identity changed since inspection' using errcode='55000'; end if;
  owned := pulse_private.staff_owned_invitation_ids(target_user_id);
  insert into pulse_private.staff_audit_purge_context(backend_pid,transaction_id,target_user_id,operator_user_id,invitation_ids)
    values(pg_backend_pid(),txid_current(),target_user_id,operator_id,owned);
  delete from public.audit_events where (target_type='user' and target_id=target_user_id)
    or (target_type='staff_invitation' and target_id=any(owned));
  delete from public.staff_invitations where id=any(owned);
  outcome := pulse_private.admin2_prepare_staff_removal_base(target_user_id,expected_updated_at,requested_confirmation,request_key);
  delete from public.audit_events where target_type='user' and target_id=target_user_id;
  delete from pulse_private.staff_audit_purge_context where backend_pid=pg_backend_pid() and transaction_id=txid_current();
  return outcome;
end
$function$;
revoke all on function pulse_private.staff_owned_invitation_ids(uuid) from public,anon,authenticated,service_role;
commit;
