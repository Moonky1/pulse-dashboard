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
  update public.staff_invitations set status='pending_send',expires_at=now()+interval '72 hours',last_delivery_request_id=requested_request_key,delivery_claim_id=claim_id,
    delivery_claimed_at=now(),delivery_attempt_count=delivery_attempt_count+1,sent_at=null,failed_at=null,failure_code=null,updated_at=now()
  where id=invitation.id returning * into invitation;
  return query select invitation.id,invitation.email_normalized,invitation.full_name,claim_id,true;
end
$function$;

alter function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) owner to postgres;
revoke all on function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) from public,anon,service_role;
grant execute on function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) to authenticated;

comment on function public.claim_staff_invitation_resend(uuid,timestamptz,uuid) is
  'Reclaims one current sent invitation for delivery and renews its certified 72-hour acceptance window.';
