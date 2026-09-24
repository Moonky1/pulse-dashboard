-- PULSE ONBOARDING-2: immutable re-invites and organization-aware onboarding.

alter table public.staff_invitations
  add column campaign_id uuid,
  add column operating_unit_id uuid,
  add column previous_invitation_id uuid;

alter table public.staff_invitations
  drop constraint staff_invitations_team_department_fk,
  add constraint staff_invitations_campaign_fk foreign key(campaign_id) references public.campaigns(id) on update restrict on delete restrict,
  add constraint staff_invitations_operating_unit_fk foreign key(operating_unit_id) references public.operating_units(id) on update restrict on delete restrict,
  add constraint staff_invitations_previous_fk foreign key(previous_invitation_id) references public.staff_invitations(id) on update restrict on delete restrict;

drop index public.staff_invitations_auth_user_unique;
create unique index staff_invitations_active_auth_user_unique
  on public.staff_invitations(auth_user_id)
  where auth_user_id is not null and status in ('pending_send','sent');
create index staff_invitations_previous_idx on public.staff_invitations(previous_invitation_id) where previous_invitation_id is not null;

create function pulse_private.validate_staff_invitation_proposal_v2(
  actor_user_id uuid,
  proposed_department_id uuid,
  proposed_campaign_id uuid,
  proposed_operating_unit_id uuid,
  proposed_team_id uuid,
  proposed_position_id uuid,
  proposed_role_id uuid,
  proposed_scope_type text,
  proposed_scope_department_id uuid,
  proposed_scope_campaign_id uuid,
  proposed_scope_team_id uuid
)
returns void
language plpgsql stable security definer set search_path=pg_catalog
as $function$
declare selected_team public.teams%rowtype;
begin
  if not exists(select 1 from public.users u where u.id=actor_user_id and u.status='active') then
    raise exception 'active invitation operator required' using errcode='42501';
  end if;
  if not exists(
    select 1 from public.user_roles ua
    join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
    join public.role_permissions rp on rp.role_id=grantor.id
    join public.permissions permission on permission.id=rp.permission_id and permission.is_active
    where ua.user_id=actor_user_id and ua.scope_type='global' and permission.key='admin.access'
  ) or not exists(
    select 1 from public.user_roles ua
    join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
    join public.role_permissions rp on rp.role_id=grantor.id
    join public.permissions permission on permission.id=rp.permission_id and permission.is_active
    where ua.user_id=actor_user_id and ua.scope_type='global' and permission.key='users.invite'
  ) then raise exception 'current global invitation authority required' using errcode='42501'; end if;

  if not exists(select 1 from public.departments d where d.id=proposed_department_id and d.is_active) then
    raise exception 'selected Department is unavailable' using errcode='23503';
  end if;
  if proposed_position_id is not null and not exists(select 1 from public.positions p where p.id=proposed_position_id and p.is_active) then
    raise exception 'selected Position is unavailable' using errcode='23503';
  end if;
  if proposed_campaign_id is null then
    if proposed_operating_unit_id is not null or proposed_team_id is not null then
      raise exception 'Operating Unit or Team requires a Campaign' using errcode='23514';
    end if;
  else
    if proposed_position_id is null then raise exception 'operational placement requires a Position' using errcode='23514'; end if;
    if not exists(select 1 from public.campaigns c where c.id=proposed_campaign_id and c.is_active) then
      raise exception 'selected Campaign is unavailable' using errcode='23503';
    end if;
    if proposed_operating_unit_id is not null and not exists(
      select 1 from public.operating_units ou where ou.id=proposed_operating_unit_id and ou.campaign_id=proposed_campaign_id and ou.is_active
    ) then raise exception 'selected Operating Unit is outside the Campaign' using errcode='23503'; end if;
    if proposed_team_id is not null then
      select * into selected_team from public.teams t
      where t.id=proposed_team_id and t.campaign_id=proposed_campaign_id and t.is_active;
      if not found then raise exception 'selected Team is outside the Campaign' using errcode='23503'; end if;
      if selected_team.operating_unit_id is distinct from proposed_operating_unit_id then
        raise exception 'selected Team is outside the Operating Unit' using errcode='23514';
      end if;
    elsif proposed_operating_unit_id is not null then
      raise exception 'Operating Unit placement requires a Team' using errcode='23514';
    end if;
  end if;

  if proposed_scope_type not in ('global','department','campaign','team') or not (
    (proposed_scope_type='global' and proposed_scope_department_id is null and proposed_scope_campaign_id is null and proposed_scope_team_id is null)
    or (proposed_scope_type='department' and proposed_scope_department_id=proposed_department_id and proposed_scope_campaign_id is null and proposed_scope_team_id is null)
    or (proposed_scope_type='campaign' and proposed_scope_department_id is null and proposed_scope_campaign_id=proposed_campaign_id and proposed_scope_campaign_id is not null and proposed_scope_team_id is null)
    or (proposed_scope_type='team' and proposed_scope_department_id is null and proposed_scope_campaign_id is null and proposed_scope_team_id=proposed_team_id and proposed_team_id is not null)
  ) then raise exception 'authorization scope does not match the proposal' using errcode='23514'; end if;

  if not exists(
    select 1 from public.user_roles ua
    join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
    join public.role_grant_rules rule on rule.grantor_role_id=grantor.id and rule.grantable_role_id=proposed_role_id and rule.scope_type=proposed_scope_type
    join public.roles target_role on target_role.id=rule.grantable_role_id and target_role.is_active
    join public.role_scopes supported on supported.role_id=target_role.id and supported.scope_type=rule.scope_type
    where ua.user_id=actor_user_id and ua.scope_type='global'
      and (target_role.key<>'super_admin' or pulse_private.is_active_super_admin(actor_user_id))
  ) then raise exception 'operator cannot propose the selected access' using errcode='42501'; end if;
end
$function$;

create or replace function public.get_staff_invitation_options()
returns jsonb
language plpgsql stable security definer set search_path=pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('admin.access');
begin
  perform pulse_private.require_global_permission('users.invite');
  return jsonb_build_object(
    'departments',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'code',d.code,'name',d.name) order by d.name) from public.departments d where d.is_active),'[]'::jsonb),
    'campaigns',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'code',c.code,'name',c.name) order by c.name) from public.campaigns c where c.is_active),'[]'::jsonb),
    'operating_units',coalesce((select jsonb_agg(jsonb_build_object('id',ou.id,'campaign_id',ou.campaign_id,'code',ou.code,'name',ou.name) order by ou.name) from public.operating_units ou where ou.is_active and ou.campaign_id is not null),'[]'::jsonb),
    'teams',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'campaign_id',t.campaign_id,'operating_unit_id',t.operating_unit_id,'code',t.code,'name',t.name) order by t.name) from public.teams t where t.is_active and t.campaign_id is not null),'[]'::jsonb),
    'positions',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'code',p.code,'name',p.name) order by p.name) from public.positions p where p.is_active),'[]'::jsonb),
    'role_options',coalesce((
      select jsonb_agg(jsonb_build_object(
        'role_id',choice.role_id,'role_key',choice.role_key,'role_name',choice.role_name,'scope_type',choice.scope_type,
        'department_id',choice.department_id,'campaign_id',choice.campaign_id,'campaign_code',choice.campaign_code,
        'campaign_name',choice.campaign_name,'team_id',choice.team_id
      ) order by choice.role_name,choice.scope_type,choice.campaign_name nulls first)
      from (
        select distinct r.id role_id,r.key role_key,r.name role_name,rule.scope_type,
          case when rule.scope_type='department' then d.id end department_id,
          case when rule.scope_type='campaign' then c.id end campaign_id,
          case when rule.scope_type='campaign' then c.code end campaign_code,
          case when rule.scope_type='campaign' then c.name end campaign_name,
          case when rule.scope_type='team' then t.id end team_id
        from public.user_roles ua
        join public.roles grantor on grantor.id=ua.role_id and grantor.is_active
        join public.role_grant_rules rule on rule.grantor_role_id=grantor.id
        join public.roles r on r.id=rule.grantable_role_id and r.is_active
        join public.role_scopes supported on supported.role_id=r.id and supported.scope_type=rule.scope_type
        left join public.departments d on rule.scope_type='department' and d.is_active
        left join public.campaigns c on rule.scope_type='campaign' and c.is_active
        left join public.teams t on rule.scope_type='team' and t.is_active and t.campaign_id is not null
        where ua.user_id=actor_id and ua.scope_type='global'
          and (rule.scope_type='global' or d.id is not null or c.id is not null or t.id is not null)
          and (r.key<>'super_admin' or pulse_private.is_active_super_admin(actor_id))
      ) choice
    ),'[]'::jsonb)
  );
end
$function$;

create function public.claim_staff_invitation_send_v2(
  requested_email text, requested_full_name text, requested_department_id uuid,
  requested_campaign_id uuid, requested_operating_unit_id uuid, requested_team_id uuid,
  requested_position_id uuid, requested_role_id uuid, requested_scope_type text,
  requested_scope_department_id uuid, requested_scope_campaign_id uuid,
  requested_scope_team_id uuid, requested_request_key uuid, requested_previous_invitation_id uuid default null
)
returns table(invitation_id uuid,email_normalized text,full_name text,delivery_claim_id uuid,delivery_required boolean,auth_user_id uuid,existing_auth_identity boolean)
language plpgsql security definer set search_path=pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  clean_email text := lower(btrim(requested_email)); clean_name text := btrim(requested_full_name);
  invitation public.staff_invitations%rowtype; previous public.staff_invitations%rowtype;
  claim_id uuid := gen_random_uuid(); reusable_auth_id uuid; profile public.users%rowtype;
begin
  perform pulse_private.require_global_permission('users.invite');
  if requested_request_key is null or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(clean_name) not between 2 and 160 then
    raise exception 'invalid invitation identity' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(clean_email,20260924000200));
  select * into invitation from public.staff_invitations i where i.created_by_user_id=actor_id and i.request_key=requested_request_key;
  if found then
    if invitation.email_normalized<>clean_email or invitation.full_name<>clean_name
      or invitation.department_id<>requested_department_id or invitation.campaign_id is distinct from requested_campaign_id
      or invitation.operating_unit_id is distinct from requested_operating_unit_id or invitation.team_id is distinct from requested_team_id
      or invitation.position_id is distinct from requested_position_id or invitation.role_id<>requested_role_id
      or invitation.scope_type<>requested_scope_type or invitation.scope_department_id is distinct from requested_scope_department_id
      or invitation.scope_campaign_id is distinct from requested_scope_campaign_id or invitation.scope_team_id is distinct from requested_scope_team_id
      or invitation.previous_invitation_id is distinct from requested_previous_invitation_id then
      raise exception 'request key belongs to a different invitation proposal' using errcode='23505';
    end if;
    return query select invitation.id,invitation.email_normalized,invitation.full_name,invitation.delivery_claim_id,false,invitation.auth_user_id,invitation.auth_user_id is not null; return;
  end if;
  update public.staff_invitations stale set status='expired',updated_at=now(),delivery_claim_id=null,delivery_claimed_at=null
  where stale.email_normalized=clean_email and stale.status in ('pending_send','sent') and stale.expires_at<=now();
  if exists(select 1 from public.staff_invitations i where i.email_normalized=clean_email and i.status in ('pending_send','sent')) then
    raise exception 'an active invitation already exists' using errcode='23505';
  end if;
  if requested_previous_invitation_id is not null then
    select * into previous from public.staff_invitations i where i.id=requested_previous_invitation_id for update;
    if not found or previous.email_normalized<>clean_email or previous.status not in ('revoked','expired','failed') then
      raise exception 'previous invitation is not eligible' using errcode='55000';
    end if;
  end if;
  if (select count(*) from public.staff_invitations i where i.email_normalized=clean_email and i.created_at>now()-interval '1 hour')>=10 then
    raise exception 'invitation rate limit reached' using errcode='55000';
  end if;
  select au.id into reusable_auth_id from auth.users au where lower(btrim(au.email))=clean_email and au.deleted_at is null order by au.created_at limit 1;
  if reusable_auth_id is not null then
    if exists(select 1 from auth.users au where lower(btrim(au.email))=clean_email and au.deleted_at is null and au.id<>reusable_auth_id) then
      raise exception 'multiple Auth identities match the email' using errcode='23505';
    end if;
    select * into profile from public.users u where u.auth_user_id=reusable_auth_id or u.email=clean_email order by (u.auth_user_id=reusable_auth_id) desc limit 1;
    if found and (profile.auth_user_id is distinct from reusable_auth_id or profile.status<>'pending_approval' or exists(select 1 from public.user_roles ur where ur.user_id=profile.id)) then
      raise exception 'existing Pulse identity is not invitation eligible' using errcode='23505';
    end if;
  elsif exists(select 1 from public.users u where u.email=clean_email) then
    raise exception 'email belongs to an unmatched Pulse profile' using errcode='23505';
  end if;
  if exists(select 1 from public.staff_invitations i where i.email_normalized=clean_email and i.status='accepted') then
    raise exception 'accepted Staff cannot be re-invited' using errcode='23505';
  end if;
  perform pulse_private.validate_staff_invitation_proposal_v2(actor_id,requested_department_id,requested_campaign_id,requested_operating_unit_id,requested_team_id,requested_position_id,requested_role_id,requested_scope_type,requested_scope_department_id,requested_scope_campaign_id,requested_scope_team_id);
  insert into public.staff_invitations(
    email_normalized,full_name,created_by_user_id,department_id,campaign_id,operating_unit_id,team_id,position_id,role_id,scope_type,
    scope_department_id,scope_campaign_id,scope_team_id,auth_user_id,previous_invitation_id,request_key,last_delivery_request_id,
    delivery_claim_id,delivery_claimed_at,delivery_attempt_count
  ) values (
    clean_email,clean_name,actor_id,requested_department_id,requested_campaign_id,requested_operating_unit_id,requested_team_id,requested_position_id,requested_role_id,requested_scope_type,
    requested_scope_department_id,requested_scope_campaign_id,requested_scope_team_id,reusable_auth_id,requested_previous_invitation_id,requested_request_key,requested_request_key,
    claim_id,now(),1
  ) returning * into invitation;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,request_id,metadata)
  values(actor_id,'staff_invitation',invitation.id,'staff_invitation.created','database',requested_request_key,
    jsonb_strip_nulls(jsonb_build_object('status','pending_send','previous_invitation_id',requested_previous_invitation_id,'identity_reused',reusable_auth_id is not null)));
  return query select invitation.id,invitation.email_normalized,invitation.full_name,claim_id,true,reusable_auth_id,reusable_auth_id is not null;
end
$function$;

create or replace function public.claim_staff_invitation_resend(target_invitation_id uuid,expected_updated_at timestamptz,requested_request_key uuid)
returns table(invitation_id uuid,email_normalized text,full_name text,delivery_claim_id uuid,delivery_required boolean)
language plpgsql security definer set search_path=pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('admin.access'); invitation public.staff_invitations%rowtype; claim_id uuid := gen_random_uuid();
begin
  perform pulse_private.require_global_permission('users.invite');
  if requested_request_key is null or expected_updated_at is null then raise exception 'invalid resend request' using errcode='22023'; end if;
  select * into invitation from public.staff_invitations i where i.id=target_invitation_id for update;
  if not found then raise exception 'invitation not found' using errcode='P0002'; end if;
  if invitation.last_delivery_request_id=requested_request_key then return query select invitation.id,invitation.email_normalized,invitation.full_name,invitation.delivery_claim_id,false; return; end if;
  if invitation.updated_at<>expected_updated_at or invitation.status<>'sent' or invitation.expires_at<=now() then
    raise exception 'only a current sent invitation can be resent' using errcode='55000';
  end if;
  perform pulse_private.validate_staff_invitation_proposal_v2(actor_id,invitation.department_id,invitation.campaign_id,invitation.operating_unit_id,invitation.team_id,invitation.position_id,invitation.role_id,invitation.scope_type,invitation.scope_department_id,invitation.scope_campaign_id,invitation.scope_team_id);
  update public.staff_invitations set status='pending_send',last_delivery_request_id=requested_request_key,delivery_claim_id=claim_id,
    delivery_claimed_at=now(),delivery_attempt_count=delivery_attempt_count+1,failed_at=null,failure_code=null,updated_at=now()
  where id=invitation.id returning * into invitation;
  return query select invitation.id,invitation.email_normalized,invitation.full_name,claim_id,true;
end
$function$;

create function public.claim_staff_invitation_resend_v2(target_invitation_id uuid,expected_updated_at timestamptz,requested_request_key uuid)
returns table(invitation_id uuid,email_normalized text,full_name text,delivery_claim_id uuid,delivery_required boolean,auth_user_id uuid,existing_auth_identity boolean)
language plpgsql security definer set search_path=pg_catalog
as $function$
declare claimed record; invitation public.staff_invitations%rowtype;
begin
  select * into claimed from public.claim_staff_invitation_resend(target_invitation_id,expected_updated_at,requested_request_key);
  select * into invitation from public.staff_invitations i where i.id=claimed.invitation_id;
  if invitation.auth_user_id is null then raise exception 'resend identity is unavailable' using errcode='55000'; end if;
  return query select claimed.invitation_id,claimed.email_normalized,claimed.full_name,claimed.delivery_claim_id,claimed.delivery_required,invitation.auth_user_id,true;
end
$function$;

drop function public.list_staff_invitations(text,integer);
create function public.list_staff_invitations(requested_status text default null,requested_limit integer default 50)
returns table(
  invitation_id uuid,email text,invitee_full_name text,invitation_status text,expires_at timestamptz,
  department_id uuid,department_name text,campaign_id uuid,campaign_name text,operating_unit_id uuid,operating_unit_name text,
  team_id uuid,team_name text,position_id uuid,position_name text,role_id uuid,role_name text,scope_type text,
  scope_department_id uuid,scope_department_name text,scope_campaign_id uuid,scope_campaign_name text,
  scope_team_id uuid,scope_team_name text,created_by_name text,delivery_attempt_count integer,failure_code text,
  created_at timestamptz,updated_at timestamptz,can_resend boolean,can_revoke boolean,can_reinvite boolean
)
language plpgsql stable security definer set search_path=pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access'); perform pulse_private.require_global_permission('users.invite');
  if requested_limit not between 1 and 100 or (requested_status is not null and requested_status not in ('pending_send','sent','accepted','revoked','expired','failed')) then raise exception 'invalid invitation filters' using errcode='22023'; end if;
  return query select i.id,i.email_normalized,i.full_name,
    case when i.status in ('pending_send','sent') and i.expires_at<=now() then 'expired' else i.status end,
    i.expires_at,i.department_id,d.name,i.campaign_id,c.name,i.operating_unit_id,ou.name,i.team_id,t.name,i.position_id,p.name,
    i.role_id,r.name,i.scope_type,i.scope_department_id,sd.name,i.scope_campaign_id,sc.name,i.scope_team_id,st.name,creator.full_name,
    i.delivery_attempt_count,i.failure_code,i.created_at,i.updated_at,
    (i.status='sent' and i.expires_at>now()),
    (i.status in ('pending_send','sent','failed') and not (i.status in ('pending_send','sent') and i.expires_at<=now())),
    ((i.status in ('revoked','expired','failed') or (i.status in ('pending_send','sent') and i.expires_at<=now()))
      and not exists(select 1 from public.staff_invitations active where active.email_normalized=i.email_normalized and active.status in ('pending_send','sent') and active.expires_at>now())
      and not exists(select 1 from public.users u where u.email=i.email_normalized and (u.status<>'pending_approval' or exists(select 1 from public.user_roles ur where ur.user_id=u.id))))
  from public.staff_invitations i
  join public.departments d on d.id=i.department_id left join public.campaigns c on c.id=i.campaign_id
  left join public.operating_units ou on ou.id=i.operating_unit_id left join public.teams t on t.id=i.team_id left join public.positions p on p.id=i.position_id
  join public.roles r on r.id=i.role_id left join public.departments sd on sd.id=i.scope_department_id
  left join public.campaigns sc on sc.id=i.scope_campaign_id left join public.teams st on st.id=i.scope_team_id join public.users creator on creator.id=i.created_by_user_id
  where requested_status is null or requested_status=(case when i.status in ('pending_send','sent') and i.expires_at<=now() then 'expired' else i.status end)
  order by i.created_at desc,i.id desc limit requested_limit;
end
$function$;

create or replace function public.accept_own_staff_invitation()
returns table(invitation_id uuid,user_id uuid,status text,accepted boolean)
language plpgsql security definer set search_path=pg_catalog
as $function$
declare caller_auth_id uuid := auth.uid(); authoritative_email text; invitation public.staff_invitations%rowtype; profile public.users%rowtype;
  assigned_department_id uuid; assigned_campaign_id uuid; assigned_team_id uuid; generated_employee_id text;
begin
  if caller_auth_id is null then raise exception 'authentication required' using errcode='28000'; end if;
  select lower(btrim(au.email)) into authoritative_email from auth.users au where au.id=caller_auth_id and au.email_confirmed_at is not null and au.deleted_at is null and (au.banned_until is null or au.banned_until<now());
  if authoritative_email is null then raise exception 'verified Auth identity required' using errcode='28000'; end if;
  perform pg_advisory_xact_lock(hashtextextended(authoritative_email,20260924000200));
  select * into invitation from public.staff_invitations i where i.email_normalized=authoritative_email and i.auth_user_id=caller_auth_id
    and (i.status in ('sent','accepted') or (i.status='failed' and i.failure_code='authorization_changed'))
    order by i.created_at desc limit 1 for update;
  if not found then return; end if;
  if invitation.status='failed' then return query select invitation.id,null::uuid,'reissue_required'::text,false; return; end if;
  if invitation.status='sent' and invitation.expires_at<=now() then update public.staff_invitations set status='expired',updated_at=now() where id=invitation.id; return; end if;
  select * into profile from public.users u where u.auth_user_id=caller_auth_id;
  if not found then perform public.create_pending_profile(invitation.full_name); select * into profile from public.users u where u.auth_user_id=caller_auth_id; end if;
  if profile.email<>authoritative_email then raise exception 'invited profile does not match verified identity' using errcode='55000'; end if;
  assigned_department_id:=case when invitation.scope_type='department' then invitation.scope_department_id end;
  assigned_campaign_id:=case when invitation.scope_type='campaign' then invitation.scope_campaign_id end;
  assigned_team_id:=case when invitation.scope_type='team' then invitation.scope_team_id end;
  if invitation.status='accepted' then return query select invitation.id,profile.id,profile.status,false; return; end if;
  if profile.status='active' then raise exception 'active Staff cannot be replaced by an invitation' using errcode='55000'; end if;
  if profile.status='blocked' then raise exception 'blocked Staff cannot be activated by an invitation' using errcode='42501'; end if;
  if profile.status='inactive' then raise exception 'inactive Staff requires an explicit lifecycle action' using errcode='42501'; end if;
  if profile.status<>'pending_approval' or exists(select 1 from public.user_roles ur where ur.user_id=profile.id) then raise exception 'profile is not invitation eligible' using errcode='55000'; end if;
  begin
    perform pulse_private.validate_staff_invitation_proposal_v2(invitation.created_by_user_id,invitation.department_id,invitation.campaign_id,invitation.operating_unit_id,invitation.team_id,invitation.position_id,invitation.role_id,invitation.scope_type,invitation.scope_department_id,invitation.scope_campaign_id,invitation.scope_team_id);
  exception when others then
    update public.staff_invitations set status='failed',failed_at=now(),failure_code='authorization_changed',updated_at=now() where id=invitation.id;
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(invitation.created_by_user_id,'staff_invitation',invitation.id,'staff_invitation.failed','database',jsonb_build_object('status','failed','failure_code','authorization_changed'));
    return query select invitation.id,profile.id,'reissue_required'::text,false; return;
  end;
  generated_employee_id:=coalesce(profile.employee_id,pulse_private.next_employee_id());
  insert into public.user_roles(user_id,role_id,scope_type,department_id,campaign_id,team_id,assigned_by_user_id)
  values(profile.id,invitation.role_id,invitation.scope_type,assigned_department_id,assigned_campaign_id,assigned_team_id,invitation.created_by_user_id);
  update public.users u set full_name=invitation.full_name,employee_id=generated_employee_id,department_id=invitation.department_id,
    team_id=case when invitation.campaign_id is null then invitation.team_id else null end,position_id=invitation.position_id,status='active'
  where u.id=profile.id returning u.* into profile;
  if invitation.campaign_id is not null then
    insert into public.user_operational_assignments(user_id,campaign_id,team_id,position_id,is_primary)
    values(profile.id,invitation.campaign_id,invitation.team_id,invitation.position_id,true);
  end if;
  update public.staff_invitations set status='accepted',accepted_at=now(),updated_at=now() where id=invitation.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata) values(invitation.created_by_user_id,'user',profile.id,'account.approved','database',jsonb_build_object('department_id',invitation.department_id,'campaign_id',invitation.campaign_id,'operating_unit_id',invitation.operating_unit_id,'team_id',invitation.team_id,'position_id',invitation.position_id,'employee_id',generated_employee_id,'role_count',1,'staff_invitation_id',invitation.id));
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata) values(invitation.created_by_user_id,'user',profile.id,'role.assigned','database',jsonb_build_object('role_id',invitation.role_id,'scope_type',invitation.scope_type,'department_id',assigned_department_id,'campaign_id',assigned_campaign_id,'team_id',assigned_team_id,'staff_invitation_id',invitation.id));
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata) values(profile.id,'staff_invitation',invitation.id,'staff_invitation.accepted','database',jsonb_build_object('status','accepted','user_id',profile.id));
  return query select invitation.id,profile.id,profile.status,true;
end
$function$;

alter function pulse_private.validate_staff_invitation_proposal_v2(uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid) owner to postgres;
alter function public.claim_staff_invitation_send_v2(text,text,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.claim_staff_invitation_resend_v2(uuid,timestamptz,uuid) owner to postgres;
alter function public.list_staff_invitations(text,integer) owner to postgres;
revoke all on function pulse_private.validate_staff_invitation_proposal_v2(uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.claim_staff_invitation_send_v2(text,text,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid,uuid) from public,anon,service_role;
revoke all on function public.claim_staff_invitation_resend_v2(uuid,timestamptz,uuid) from public,anon,service_role;
revoke all on function public.list_staff_invitations(text,integer) from public,anon,service_role;
grant execute on function public.claim_staff_invitation_send_v2(text,text,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.claim_staff_invitation_resend_v2(uuid,timestamptz,uuid) to authenticated;
grant execute on function public.list_staff_invitations(text,integer) to authenticated;

comment on function public.claim_staff_invitation_send_v2(text,text,uuid,uuid,uuid,uuid,uuid,uuid,text,uuid,uuid,uuid,uuid,uuid) is 'Creates one new immutable Staff invitation while safely reconciling an exact eligible Auth identity.';
