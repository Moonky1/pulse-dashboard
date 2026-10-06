begin;

create function public.list_admin_agents(requested_query text default null,requested_team_id uuid default null,
  requested_status text default null,after_agent_code text default null,requested_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
begin
  perform pulse_private.require_global_permission('agents.manage');
  perform pulse_private.require_global_permission('admin.access');
  if requested_limit is null or requested_limit not between 1 and 100 or length(coalesce(requested_query,''))>160
    or requested_status is not null and requested_status not in ('pending_activation','active','inactive','blocked')
    or after_agent_code is not null and after_agent_code !~ '^[0-9]{4,12}$' then
    raise exception 'Invalid Agent directory filters' using errcode='22023'; end if;
  return (with directory as (
    select agent.agent_code,agent.display_name,agent.status,
      case when agent.status='active' and credential.pin_hash is null then 'pending_activation' else agent.status end as display_status,
      credential.pin_hash is not null as activated,team.id as team_id,team.code as team_code,team.name as team_name,
      campaign.code as campaign_code,campaign.name as campaign_name
    from public.agents agent
    left join public.agent_credentials credential on credential.agent_id=agent.id
    join public.teams team on team.id=agent.team_id
    left join public.campaigns campaign on campaign.id=team.campaign_id
    where (requested_query is null or position(lower(btrim(requested_query)) in lower(agent.display_name||' '||agent.agent_code))>0)
      and (requested_team_id is null or team.id=requested_team_id)
      and (after_agent_code is null or agent.agent_code>after_agent_code)
  ), filtered as (
    select * from directory where requested_status is null or display_status=requested_status
    order by agent_code limit requested_limit+1
  ), page as (select * from filtered order by agent_code limit requested_limit)
  select jsonb_build_object('agents',coalesce((select jsonb_agg(jsonb_build_object(
    'agent_code',agent_code,'display_name',display_name,'status',display_status,'activated',activated,
    'team_id',team_id,'team_code',team_code,'team_name',team_name,'campaign_code',campaign_code,'campaign_name',campaign_name)
    order by agent_code) from page),'[]'::jsonb),'has_more',(select count(*)>requested_limit from filtered),
    'next_cursor',(select max(agent_code) from page)));
end
$function$;

create function public.get_admin_role_catalog()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('users.view');
  return (select coalesce(jsonb_agg(jsonb_build_object('id',role.id,'key',role.key,'name',role.name,
    'description',role.description,'permissions',(select coalesce(jsonb_agg(jsonb_build_object(
      'key',permission.key,'description',permission.description) order by permission.key),'[]'::jsonb)
      from public.role_permissions grant_row join public.permissions permission on permission.id=grant_row.permission_id
      where grant_row.role_id=role.id and permission.is_active)) order by role.name),'[]'::jsonb)
    from public.roles role where role.is_active);
end
$function$;

create function public.get_admin_staff_presentation(target_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
begin
  if not exists(select 1 from public.get_managed_user(target_user_id)) then
    raise exception 'Staff profile unavailable' using errcode='42501'; end if;
  return (select jsonb_build_object('bio',case when profile_visible_to_staff or auth_user_id=auth.uid() then profile_bio end,
    'presence',case when profile_visible_to_staff or auth_user_id=auth.uid() then profile_presence end)
    from public.users where id=target_user_id and removed_at is null);
end
$function$;

create function public.remove_staff_invitation(target_invitation_id uuid,expected_updated_at timestamptz,
  requested_confirmation text default null)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare actor_id uuid := pulse_private.require_global_permission('users.invite');
  invitation public.staff_invitations%rowtype; preserve_history boolean; dependency record; amount bigint;
begin
  perform pulse_private.require_global_permission('admin.access');
  if requested_confirmation is distinct from 'REMOVE' then
    raise exception 'Invitation removal confirmation required' using errcode='22023'; end if;
  select * into invitation from public.staff_invitations where id=target_invitation_id for update;
  if not found or invitation.removed_at is not null then raise exception 'Invitation unavailable' using errcode='P0002'; end if;
  if invitation.updated_at is distinct from expected_updated_at then
    raise exception 'Invitation changed since inspection' using errcode='55000'; end if;
  if invitation.status='accepted' or invitation.accepted_at is not null then
    raise exception 'Accepted account history is protected' using errcode='55000'; end if;
  if invitation.status in ('pending_send','sent') and invitation.expires_at>now() then
    raise exception 'Revoke active invitation first' using errcode='55000'; end if;
  -- Keep chains, linked Auth and append-only invitation history intact.
  preserve_history := invitation.auth_user_id is not null or invitation.previous_invitation_id is not null
    or exists(select 1 from public.staff_invitations where previous_invitation_id=target_invitation_id)
    or exists(select 1 from public.audit_events where target_id=target_invitation_id);
  -- New FK consumers must not be lost through ON DELETE CASCADE, either.
  if not preserve_history then
    for dependency in
      select namespace.nspname as schema_name,relation.relname as table_name,
        attribute.attname as column_name,cardinality(constraint_row.conkey) as key_count
      from pg_constraint constraint_row
      join pg_class relation on relation.oid=constraint_row.conrelid
      join pg_namespace namespace on namespace.oid=relation.relnamespace
      join pg_attribute attribute on attribute.attrelid=relation.oid and attribute.attnum=constraint_row.conkey[1]
      where constraint_row.contype='f' and constraint_row.confrelid='public.staff_invitations'::regclass
    loop
      if dependency.key_count<>1 then preserve_history := true;
      else
        execute format('select count(*) from %I.%I where %I=$1',dependency.schema_name,
          dependency.table_name,dependency.column_name) into amount using target_invitation_id;
        preserve_history := preserve_history or amount>0;
      end if;
    end loop;
  end if;
  if preserve_history then
    update public.staff_invitations set removed_at=now() where id=target_invitation_id;
  else delete from public.staff_invitations where id=target_invitation_id;
  end if;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'staff_invitation',target_invitation_id,'staff_invitation.removed','server',
    jsonb_build_object('history_preserved',preserve_history));
  return jsonb_build_object('removed',true,'history_preserved',preserve_history);
end
$function$;

create function pulse_private.guard_removed_invitation()
returns trigger language plpgsql set search_path=pg_catalog as $function$
begin
  if old.removed_at is not null then
    raise exception 'Removed invitation cannot be edited or renewed' using errcode='55000';
  end if;
  return new;
end
$function$;
create trigger staff_invitations_guard_removed before update on public.staff_invitations
for each row execute function pulse_private.guard_removed_invitation();
revoke all on function pulse_private.guard_removed_invitation() from public,anon,authenticated;

do $block$
declare function_definition text;
  original_predicate text := 'where requested_status is null or requested_status=(case when i.status in (''pending_send'',''sent'') and i.expires_at<=now() then ''expired'' else i.status end)';
begin
  -- Add the visibility predicate before the existing ORDER/LIMIT, retaining the
  -- deployed return shape, permission checks and page bounds unchanged.
  function_definition := pg_get_functiondef('public.list_staff_invitations(text,integer)'::regprocedure);
  if position(original_predicate in function_definition)=0 then
    raise exception 'Invitation read contract changed; review migration' using errcode='55000';
  end if;
  function_definition := replace(function_definition,
    'requested_status not in (''pending_send'',''sent'',''accepted'',''revoked'',''expired'',''failed'')',
    'requested_status not in (''current'',''pending_send'',''sent'',''accepted'',''revoked'',''expired'',''failed'')');
  execute replace(function_definition,original_predicate,
    'where i.removed_at is null and ((requested_status=''current'' and i.status in (''pending_send'',''sent'') and i.expires_at>now()) or '||substring(original_predicate from 7)||')');
end
$block$;
revoke all on function public.list_admin_agents(text,uuid,text,text,integer),public.get_admin_role_catalog(),
  public.get_admin_staff_presentation(uuid),public.remove_staff_invitation(uuid,timestamptz,text),
  public.list_staff_invitations(text,integer) from public,anon;
grant execute on function public.list_admin_agents(text,uuid,text,text,integer),public.get_admin_role_catalog(),
  public.get_admin_staff_presentation(uuid),public.remove_staff_invitation(uuid,timestamptz,text),
  public.list_staff_invitations(text,integer) to authenticated;
commit;
