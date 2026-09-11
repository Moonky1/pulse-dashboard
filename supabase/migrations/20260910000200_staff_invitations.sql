-- Pulse AUTH-12: canonical Staff invitations.
-- Delivery is performed only by the separately deployed trusted Edge Function.

insert into public.permissions(id,key,description)
values ('20000000-0000-0000-0000-000000000036','users.invite','Invite Staff identities into the pending approval lifecycle');

insert into public.role_permissions(role_id,permission_id)
select role.id,'20000000-0000-0000-0000-000000000036'::uuid
from public.roles role
where role.key in ('super_admin','admin','human_resources');

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  full_name text not null,
  status text not null default 'pending_send',
  expires_at timestamptz not null default (now() + interval '1 hour'),
  created_by_user_id uuid not null,
  department_id uuid not null,
  team_id uuid,
  position_id uuid,
  role_id uuid not null,
  scope_type text not null,
  scope_department_id uuid,
  scope_campaign_id uuid,
  scope_team_id uuid,
  auth_user_id uuid,
  request_key uuid not null,
  last_delivery_request_id uuid,
  delivery_claim_id uuid,
  delivery_claimed_at timestamptz,
  delivery_attempt_count integer not null default 0,
  sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_invitations_email_normalized check (
    email_normalized=lower(btrim(email_normalized))
    and email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint staff_invitations_full_name check (length(btrim(full_name)) between 2 and 160),
  constraint staff_invitations_status check (status in ('pending_send','sent','accepted','revoked','expired','failed')),
  constraint staff_invitations_attempts check (delivery_attempt_count between 0 and 100),
  constraint staff_invitations_failure_code check (
    failure_code is null or (length(failure_code) between 2 and 64 and failure_code ~ '^[a-z][a-z0-9_]*$')
  ),
  constraint staff_invitations_creator_fk foreign key(created_by_user_id) references public.users(id) on update restrict on delete restrict,
  constraint staff_invitations_department_fk foreign key(department_id) references public.departments(id) on update restrict on delete restrict,
  constraint staff_invitations_team_department_fk foreign key(team_id,department_id) references public.teams(id,department_id) on update restrict on delete restrict,
  constraint staff_invitations_position_fk foreign key(position_id) references public.positions(id) on update restrict on delete restrict,
  constraint staff_invitations_role_scope_fk foreign key(role_id,scope_type) references public.role_scopes(role_id,scope_type) on update restrict on delete restrict,
  constraint staff_invitations_scope_department_fk foreign key(scope_department_id) references public.departments(id) on update restrict on delete restrict,
  constraint staff_invitations_scope_campaign_fk foreign key(scope_campaign_id) references public.campaigns(id) on update restrict on delete restrict,
  constraint staff_invitations_scope_team_fk foreign key(scope_team_id) references public.teams(id) on update restrict on delete restrict,
  constraint staff_invitations_auth_user_fk foreign key(auth_user_id) references auth.users(id) on update restrict on delete restrict,
  constraint staff_invitations_scope_shape check (
    (scope_type='global' and scope_department_id is null and scope_campaign_id is null and scope_team_id is null)
    or (scope_type='department' and scope_department_id is not null and scope_campaign_id is null and scope_team_id is null)
    or (scope_type='campaign' and scope_department_id is null and scope_campaign_id is not null and scope_team_id is null)
    or (scope_type='team' and scope_department_id is null and scope_campaign_id is null and scope_team_id is not null)
  ),
  constraint staff_invitations_employment_scope_match check (
    (scope_type<>'department' or scope_department_id=department_id)
    and (scope_type<>'team' or scope_team_id=team_id)
  ),
  constraint staff_invitations_state_timestamps check (
    (status<>'sent' or sent_at is not null)
    and (status<>'accepted' or accepted_at is not null)
    and (status<>'revoked' or revoked_at is not null)
    and (status<>'failed' or failed_at is not null)
  )
);

create unique index staff_invitations_request_unique on public.staff_invitations(created_by_user_id,request_key);
create unique index staff_invitations_active_email_unique on public.staff_invitations(email_normalized) where status in ('pending_send','sent');
create unique index staff_invitations_auth_user_unique on public.staff_invitations(auth_user_id) where auth_user_id is not null;
create index staff_invitations_status_created_idx on public.staff_invitations(status,created_at desc,id);

alter table public.staff_invitations enable row level security;
revoke all on table public.staff_invitations from public,anon,authenticated;
grant all on table public.staff_invitations to service_role;

create function pulse_private.validate_staff_invitation_proposal(
  actor_user_id uuid,
  proposed_department_id uuid,
  proposed_team_id uuid,
  proposed_position_id uuid,
  proposed_role_id uuid,
  proposed_scope_type text,
  proposed_scope_department_id uuid,
  proposed_scope_campaign_id uuid,
  proposed_scope_team_id uuid
)
returns void
language plpgsql
stable
security definer
set search_path=pg_catalog
as $function$
begin
  if not exists(select 1 from public.departments d where d.id=proposed_department_id and d.is_active) then
    raise exception 'selected department is unavailable' using errcode='23503';
  end if;
  if proposed_team_id is not null and not exists(
    select 1 from public.teams t where t.id=proposed_team_id and t.department_id=proposed_department_id and t.is_active
  ) then raise exception 'selected team is unavailable' using errcode='23503'; end if;
  if proposed_position_id is not null and not exists(
    select 1 from public.positions p where p.id=proposed_position_id and p.is_active
  ) then raise exception 'selected position is unavailable' using errcode='23503'; end if;

  if proposed_scope_type not in ('global','department','campaign','team') then
    raise exception 'invalid authorization scope' using errcode='22023';
  end if;
  if not (
    (proposed_scope_type='global' and proposed_scope_department_id is null and proposed_scope_campaign_id is null and proposed_scope_team_id is null)
    or (proposed_scope_type='department' and proposed_scope_department_id=proposed_department_id and proposed_scope_campaign_id is null and proposed_scope_team_id is null)
    or (proposed_scope_type='campaign' and proposed_scope_department_id is null and proposed_scope_campaign_id is not null and proposed_scope_team_id is null)
    or (proposed_scope_type='team' and proposed_scope_department_id is null and proposed_scope_campaign_id is null and proposed_scope_team_id=proposed_team_id and proposed_team_id is not null)
  ) then raise exception 'authorization scope does not match the canonical proposal' using errcode='23514'; end if;

  if proposed_scope_type='campaign' and not exists(
    select 1 from public.campaigns c where c.id=proposed_scope_campaign_id and c.is_active
  ) then raise exception 'selected campaign is unavailable' using errcode='23503'; end if;

  if not exists(
    select 1
    from public.user_roles actor_assignment
    join public.roles grantor on grantor.id=actor_assignment.role_id and grantor.is_active
    join public.role_grant_rules rule on rule.grantor_role_id=grantor.id
      and rule.grantable_role_id=proposed_role_id and rule.scope_type=proposed_scope_type
    join public.roles target_role on target_role.id=rule.grantable_role_id and target_role.is_active
    join public.role_scopes supported on supported.role_id=target_role.id and supported.scope_type=rule.scope_type
    where actor_assignment.user_id=actor_user_id and actor_assignment.scope_type='global'
      and (target_role.key<>'super_admin' or pulse_private.is_active_super_admin(actor_user_id))
  ) then raise exception 'operator cannot propose the selected role and scope' using errcode='42501'; end if;
end
$function$;

create function public.get_staff_invitation_options()
returns jsonb
language plpgsql
stable
security definer
set search_path=pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('admin.access');
begin
  perform pulse_private.require_global_permission('users.invite');
  return jsonb_build_object(
    'departments',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'code',d.code,'name',d.name) order by d.name) from public.departments d where d.is_active),'[]'::jsonb),
    'teams',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'department_id',t.department_id,'code',t.code,'name',t.name) order by t.name) from public.teams t join public.departments d on d.id=t.department_id and d.is_active where t.is_active),'[]'::jsonb),
    'positions',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'code',p.code,'name',p.name) order by p.name) from public.positions p where p.is_active),'[]'::jsonb),
    'role_options',coalesce((
      select jsonb_agg(jsonb_build_object(
        'role_id',grantable.role_id,'role_key',grantable.role_key,'role_name',grantable.role_name,
        'scope_type',grantable.scope_type,'department_id',grantable.department_id,
        'campaign_id',grantable.campaign_id,'campaign_code',grantable.campaign_code,'campaign_name',grantable.campaign_name,
        'team_id',grantable.team_id
      ) order by grantable.role_name,grantable.scope_type,grantable.campaign_name nulls first)
      from (
        select distinct target_role.id role_id,target_role.key role_key,target_role.name role_name,rule.scope_type,
          null::uuid department_id,null::uuid campaign_id,null::text campaign_code,null::text campaign_name,null::uuid team_id
        from public.user_roles ua
        join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
        join public.role_grant_rules rule on rule.grantor_role_id=grantor.id
        join public.roles target_role on target_role.id=rule.grantable_role_id and target_role.is_active
        join public.role_scopes supported on supported.role_id=target_role.id and supported.scope_type=rule.scope_type
        where ua.user_id=actor_id and ua.scope_type='global' and rule.scope_type='global'
          and (target_role.key<>'super_admin' or pulse_private.is_active_super_admin(actor_id))
        union all
        select distinct target_role.id,target_role.key,target_role.name,rule.scope_type,
          d.id,null::uuid,null::text,null::text,null::uuid
        from public.user_roles ua join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
        join public.role_grant_rules rule on rule.grantor_role_id=grantor.id and rule.scope_type='department'
        join public.roles target_role on target_role.id=rule.grantable_role_id and target_role.is_active
        join public.role_scopes supported on supported.role_id=target_role.id and supported.scope_type=rule.scope_type
        cross join public.departments d
        where ua.user_id=actor_id and ua.scope_type='global' and d.is_active
          and (target_role.key<>'super_admin' or pulse_private.is_active_super_admin(actor_id))
        union all
        select distinct target_role.id,target_role.key,target_role.name,rule.scope_type,
          null::uuid,c.id,c.code,c.name,null::uuid
        from public.user_roles ua join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
        join public.role_grant_rules rule on rule.grantor_role_id=grantor.id and rule.scope_type='campaign'
        join public.roles target_role on target_role.id=rule.grantable_role_id and target_role.is_active
        join public.role_scopes supported on supported.role_id=target_role.id and supported.scope_type=rule.scope_type
        cross join public.campaigns c
        where ua.user_id=actor_id and ua.scope_type='global' and c.is_active
          and (target_role.key<>'super_admin' or pulse_private.is_active_super_admin(actor_id))
        union all
        select distinct target_role.id,target_role.key,target_role.name,rule.scope_type,
          null::uuid,null::uuid,null::text,null::text,t.id
        from public.user_roles ua join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
        join public.role_grant_rules rule on rule.grantor_role_id=grantor.id and rule.scope_type='team'
        join public.roles target_role on target_role.id=rule.grantable_role_id and target_role.is_active
        join public.role_scopes supported on supported.role_id=target_role.id and supported.scope_type=rule.scope_type
        cross join public.teams t join public.departments d on d.id=t.department_id and d.is_active
        where ua.user_id=actor_id and ua.scope_type='global' and t.is_active
          and (target_role.key<>'super_admin' or pulse_private.is_active_super_admin(actor_id))
      ) grantable
    ),'[]'::jsonb)
  );
end
$function$;

create function public.claim_staff_invitation_send(
  requested_email text, requested_full_name text, requested_department_id uuid,
  requested_team_id uuid, requested_position_id uuid, requested_role_id uuid,
  requested_scope_type text, requested_scope_department_id uuid,
  requested_scope_campaign_id uuid, requested_scope_team_id uuid, requested_request_key uuid
)
returns table(invitation_id uuid,email_normalized text,full_name text,delivery_claim_id uuid,delivery_required boolean)
language plpgsql
security definer
set search_path=pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  clean_email text := lower(btrim(requested_email));
  clean_name text := btrim(requested_full_name);
  invitation public.staff_invitations%rowtype;
  claim_id uuid := gen_random_uuid();
begin
  perform pulse_private.require_global_permission('users.invite');
  if requested_request_key is null or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(clean_name) not between 2 and 160 then
    raise exception 'invalid invitation identity' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(clean_email,20260910000200));
  select * into invitation from public.staff_invitations i where i.created_by_user_id=actor_id and i.request_key=requested_request_key;
  if found then
    if invitation.email_normalized<>clean_email or invitation.full_name<>clean_name
      or invitation.department_id<>requested_department_id
      or invitation.team_id is distinct from requested_team_id
      or invitation.position_id is distinct from requested_position_id
      or invitation.role_id<>requested_role_id or invitation.scope_type<>requested_scope_type
      or invitation.scope_department_id is distinct from requested_scope_department_id
      or invitation.scope_campaign_id is distinct from requested_scope_campaign_id
      or invitation.scope_team_id is distinct from requested_scope_team_id then
      raise exception 'request key belongs to a different invitation proposal' using errcode='23505';
    end if;
    return query select invitation.id,invitation.email_normalized,invitation.full_name,invitation.delivery_claim_id,false;
    return;
  end if;
  update public.staff_invitations as stale set status='expired',updated_at=now(),delivery_claim_id=null,delivery_claimed_at=null
  where stale.email_normalized=clean_email and stale.status in ('pending_send','sent') and stale.expires_at<=now();
  if exists(select 1 from public.users u where u.email=clean_email) then raise exception 'email already belongs to a Pulse profile' using errcode='23505'; end if;
  if exists(select 1 from auth.users au where lower(btrim(au.email))=clean_email and au.deleted_at is null) then raise exception 'email already belongs to an Auth identity' using errcode='23505'; end if;
  if exists(select 1 from public.staff_invitations i where i.email_normalized=clean_email and i.status in ('pending_send','sent')) then
    raise exception 'an active invitation already exists for this email' using errcode='23505';
  end if;
  perform pulse_private.validate_staff_invitation_proposal(actor_id,requested_department_id,requested_team_id,requested_position_id,requested_role_id,requested_scope_type,requested_scope_department_id,requested_scope_campaign_id,requested_scope_team_id);
  insert into public.staff_invitations(
    email_normalized,full_name,created_by_user_id,department_id,team_id,position_id,role_id,scope_type,
    scope_department_id,scope_campaign_id,scope_team_id,request_key,last_delivery_request_id,
    delivery_claim_id,delivery_claimed_at,delivery_attempt_count
  ) values (
    clean_email,clean_name,actor_id,requested_department_id,requested_team_id,requested_position_id,requested_role_id,requested_scope_type,
    requested_scope_department_id,requested_scope_campaign_id,requested_scope_team_id,requested_request_key,requested_request_key,
    claim_id,now(),1
  ) returning * into invitation;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,request_id,metadata)
  values(actor_id,'staff_invitation',invitation.id,'staff_invitation.created','database',requested_request_key,jsonb_build_object('status','pending_send'));
  return query select invitation.id,invitation.email_normalized,invitation.full_name,claim_id,true;
end
$function$;

create function public.claim_staff_invitation_resend(target_invitation_id uuid,expected_updated_at timestamptz,requested_request_key uuid)
returns table(invitation_id uuid,email_normalized text,full_name text,delivery_claim_id uuid,delivery_required boolean)
language plpgsql security definer set search_path=pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('admin.access'); invitation public.staff_invitations%rowtype; claim_id uuid := gen_random_uuid();
begin
  perform pulse_private.require_global_permission('users.invite');
  if requested_request_key is null or expected_updated_at is null then raise exception 'invalid resend request' using errcode='22023'; end if;
  select * into invitation from public.staff_invitations i where i.id=target_invitation_id for update;
  if not found then raise exception 'invitation not found' using errcode='P0002'; end if;
  if invitation.last_delivery_request_id=requested_request_key then
    return query select invitation.id,invitation.email_normalized,invitation.full_name,invitation.delivery_claim_id,false; return;
  end if;
  if invitation.updated_at<>expected_updated_at then raise exception 'invitation changed since it was loaded' using errcode='55000'; end if;
  if invitation.status in ('accepted','revoked') then raise exception 'invitation cannot be resent' using errcode='55000'; end if;
  if invitation.status='pending_send' and invitation.delivery_claimed_at>now()-interval '5 minutes' then
    raise exception 'invitation delivery is already in progress' using errcode='55000';
  end if;
  if exists(select 1 from public.users u where u.email=invitation.email_normalized) then raise exception 'email already belongs to a Pulse profile' using errcode='23505'; end if;
  perform pulse_private.validate_staff_invitation_proposal(actor_id,invitation.department_id,invitation.team_id,invitation.position_id,invitation.role_id,invitation.scope_type,invitation.scope_department_id,invitation.scope_campaign_id,invitation.scope_team_id);
  update public.staff_invitations set status='pending_send',expires_at=now()+interval '1 hour',last_delivery_request_id=requested_request_key,
    delivery_claim_id=claim_id,delivery_claimed_at=now(),delivery_attempt_count=delivery_attempt_count+1,
    sent_at=null,failed_at=null,failure_code=null,updated_at=now()
  where id=invitation.id returning * into invitation;
  return query select invitation.id,invitation.email_normalized,invitation.full_name,claim_id,true;
end
$function$;

create function public.complete_staff_invitation_delivery(target_invitation_id uuid,claimed_delivery_id uuid,delivery_succeeded boolean,delivered_auth_user_id uuid,safe_failure_code text default null)
returns boolean
language plpgsql security definer set search_path=pg_catalog
as $function$
declare invitation public.staff_invitations%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'service role required' using errcode='42501'; end if;
  select * into invitation from public.staff_invitations i where i.id=target_invitation_id for update;
  if not found then raise exception 'invitation not found' using errcode='P0002'; end if;
  if invitation.status<>'pending_send' or invitation.delivery_claim_id is distinct from claimed_delivery_id then return false; end if;
  if delivery_succeeded then
    if delivered_auth_user_id is null or not exists(select 1 from auth.users au where au.id=delivered_auth_user_id and lower(btrim(au.email))=invitation.email_normalized and au.deleted_at is null) then
      raise exception 'delivered Auth identity does not match invitation' using errcode='23514';
    end if;
    update public.staff_invitations set status='sent',auth_user_id=delivered_auth_user_id,sent_at=now(),failed_at=null,failure_code=null,
      delivery_claim_id=null,delivery_claimed_at=null,updated_at=now() where id=invitation.id;
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,request_id,metadata)
    values(invitation.created_by_user_id,'staff_invitation',invitation.id,case when invitation.delivery_attempt_count>1 then 'staff_invitation.resent' else 'staff_invitation.sent' end,
      'edge_function',invitation.last_delivery_request_id,jsonb_build_object('status','sent'));
  else
    if safe_failure_code is null or safe_failure_code !~ '^[a-z][a-z0-9_]{1,63}$' then safe_failure_code := 'delivery_failed'; end if;
    update public.staff_invitations set status='failed',failed_at=now(),failure_code=safe_failure_code,delivery_claim_id=null,delivery_claimed_at=null,updated_at=now() where id=invitation.id;
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,request_id,metadata)
    values(invitation.created_by_user_id,'staff_invitation',invitation.id,'staff_invitation.failed','edge_function',invitation.last_delivery_request_id,jsonb_build_object('status','failed','failure_code',safe_failure_code));
  end if;
  return true;
end
$function$;

create function public.revoke_staff_invitation(target_invitation_id uuid,expected_updated_at timestamptz)
returns boolean
language plpgsql security definer set search_path=pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('admin.access'); invitation public.staff_invitations%rowtype;
begin
  perform pulse_private.require_global_permission('users.invite');
  select * into invitation from public.staff_invitations i where i.id=target_invitation_id for update;
  if not found then raise exception 'invitation not found' using errcode='P0002'; end if;
  if invitation.updated_at<>expected_updated_at then raise exception 'invitation changed since it was loaded' using errcode='55000'; end if;
  if invitation.status not in ('pending_send','sent','failed') then raise exception 'invitation cannot be revoked' using errcode='55000'; end if;
  update public.staff_invitations set status='revoked',revoked_at=now(),delivery_claim_id=null,delivery_claimed_at=null,updated_at=now() where id=invitation.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'staff_invitation',invitation.id,'staff_invitation.revoked','database',jsonb_build_object('status','revoked'));
  return true;
end
$function$;

create function public.list_staff_invitations(requested_status text default null,requested_limit integer default 50)
returns table(
  invitation_id uuid,email text,invitee_full_name text,invitation_status text,expires_at timestamptz,
  department_id uuid,department_name text,team_id uuid,team_name text,position_id uuid,position_name text,
  role_id uuid,role_name text,scope_type text,scope_department_id uuid,scope_department_name text,
  scope_campaign_id uuid,scope_campaign_name text,scope_team_id uuid,scope_team_name text,
  created_by_name text,delivery_attempt_count integer,failure_code text,created_at timestamptz,updated_at timestamptz,
  can_resend boolean,can_revoke boolean
)
language plpgsql stable security definer set search_path=pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access'); perform pulse_private.require_global_permission('users.invite');
  if requested_limit not between 1 and 100 or (requested_status is not null and requested_status not in ('pending_send','sent','accepted','revoked','expired','failed')) then
    raise exception 'invalid invitation filters' using errcode='22023';
  end if;
  return query select i.id,i.email_normalized,i.full_name,
    case when i.status in ('pending_send','sent') and i.expires_at<=now() then 'expired' else i.status end,
    i.expires_at,i.department_id,d.name,i.team_id,t.name,i.position_id,p.name,i.role_id,r.name,i.scope_type,
    i.scope_department_id,sd.name,i.scope_campaign_id,sc.name,i.scope_team_id,st.name,creator.full_name,
    i.delivery_attempt_count,i.failure_code,i.created_at,i.updated_at,
    (i.status in ('sent','failed') or (i.status in ('pending_send','sent') and i.expires_at<=now())),
    (i.status in ('pending_send','sent','failed') and not (i.status in ('pending_send','sent') and i.expires_at<=now()))
  from public.staff_invitations i
  join public.departments d on d.id=i.department_id left join public.teams t on t.id=i.team_id left join public.positions p on p.id=i.position_id
  join public.roles r on r.id=i.role_id left join public.departments sd on sd.id=i.scope_department_id
  left join public.campaigns sc on sc.id=i.scope_campaign_id left join public.teams st on st.id=i.scope_team_id
  join public.users creator on creator.id=i.created_by_user_id
  where requested_status is null or requested_status=(case when i.status in ('pending_send','sent') and i.expires_at<=now() then 'expired' else i.status end)
  order by i.created_at desc,i.id desc limit requested_limit;
end
$function$;

create function public.accept_own_staff_invitation()
returns table(invitation_id uuid,user_id uuid,status text,accepted boolean)
language plpgsql security definer set search_path=pg_catalog
as $function$
declare caller_auth_id uuid := auth.uid(); authoritative_email text; invitation public.staff_invitations%rowtype; profile public.users%rowtype;
begin
  if caller_auth_id is null then raise exception 'authentication required' using errcode='28000'; end if;
  select lower(btrim(au.email)) into authoritative_email from auth.users au where au.id=caller_auth_id and au.email_confirmed_at is not null and au.deleted_at is null and (au.banned_until is null or au.banned_until<now());
  if authoritative_email is null then raise exception 'verified Auth identity required' using errcode='28000'; end if;
  perform pg_advisory_xact_lock(hashtextextended(authoritative_email,20260910000200));
  select * into invitation from public.staff_invitations i
  where i.email_normalized=authoritative_email and (i.auth_user_id is null or i.auth_user_id=caller_auth_id)
    and i.status in ('sent','accepted') order by i.created_at desc limit 1 for update;
  if not found then return; end if;
  if invitation.status='sent' and invitation.expires_at<=now() then
    update public.staff_invitations set status='expired',updated_at=now() where id=invitation.id; return;
  end if;
  select * into profile from public.users u where u.auth_user_id=caller_auth_id;
  if not found then
    perform public.create_pending_profile(invitation.full_name);
    select * into profile from public.users u where u.auth_user_id=caller_auth_id;
  end if;
  if profile.email<>authoritative_email or profile.status<>'pending_approval' then raise exception 'invited profile is not eligible for pending approval' using errcode='55000'; end if;
  if invitation.status='accepted' then return query select invitation.id,profile.id,profile.status,false; return; end if;
  update public.staff_invitations set status='accepted',auth_user_id=caller_auth_id,accepted_at=now(),updated_at=now() where id=invitation.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(profile.id,'staff_invitation',invitation.id,'staff_invitation.accepted','database',jsonb_build_object('status','accepted','user_id',profile.id));
  return query select invitation.id,profile.id,profile.status,true;
end
$function$;

alter function pulse_private.validate_staff_invitation_proposal(uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid) owner to postgres;
alter function public.get_staff_invitation_options() owner to postgres;
alter function public.claim_staff_invitation_send(text,text,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) owner to postgres;
alter function public.complete_staff_invitation_delivery(uuid,uuid,boolean,uuid,text) owner to postgres;
alter function public.revoke_staff_invitation(uuid,timestamptz) owner to postgres;
alter function public.list_staff_invitations(text,integer) owner to postgres;
alter function public.accept_own_staff_invitation() owner to postgres;

revoke all on function pulse_private.validate_staff_invitation_proposal(uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.get_staff_invitation_options() from public,anon,service_role;
revoke all on function public.claim_staff_invitation_send(text,text,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid) from public,anon,service_role;
revoke all on function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) from public,anon,service_role;
revoke all on function public.complete_staff_invitation_delivery(uuid,uuid,boolean,uuid,text) from public,anon,authenticated;
revoke all on function public.revoke_staff_invitation(uuid,timestamptz) from public,anon,service_role;
revoke all on function public.list_staff_invitations(text,integer) from public,anon,service_role;
revoke all on function public.accept_own_staff_invitation() from public,anon,service_role;
grant execute on function public.get_staff_invitation_options() to authenticated;
grant execute on function public.claim_staff_invitation_send(text,text,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) to authenticated;
grant execute on function public.complete_staff_invitation_delivery(uuid,uuid,boolean,uuid,text) to service_role;
grant execute on function public.revoke_staff_invitation(uuid,timestamptz) to authenticated;
grant execute on function public.list_staff_invitations(text,integer) to authenticated;
grant execute on function public.accept_own_staff_invitation() to authenticated;

comment on table public.staff_invitations is 'Protected Staff invitation ledger; proposal data is applied only by later human approval.';
comment on function public.accept_own_staff_invitation() is 'Binds a verified invited identity to pending approval without applying proposed placement, position, role, or scope.';
