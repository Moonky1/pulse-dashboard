-- Read only the caller's canonical, verified invitation. No metadata-based grants.
begin;
create function public.get_own_staff_invitation_setup()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare identity auth.users%rowtype; invitation public.staff_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select * into identity from auth.users where id=auth.uid() and email_confirmed_at is not null
    and deleted_at is null and (banned_until is null or banned_until<=now());
  if not found then raise exception 'Verified identity required' using errcode='42501'; end if;
  if exists(select 1 from public.users staff where staff.auth_user_id=identity.id
      and (staff.status<>'pending_approval' or staff.removed_at is not null)) then return null; end if;
  select * into invitation from public.staff_invitations
    where auth_user_id=identity.id and email_normalized=lower(btrim(identity.email)) and removed_at is null
      and status<>'accepted' order by created_at desc,id desc limit 1;
  if not found then return null; end if;
  return jsonb_build_object('id',invitation.id,'email',invitation.email_normalized,'name',invitation.full_name,
    'status',case when invitation.status='sent' and invitation.expires_at>now() then 'ready' else 'reissue_required' end);
end
$function$;
revoke all on function public.get_own_staff_invitation_setup() from public,anon,service_role;
grant execute on function public.get_own_staff_invitation_setup() to authenticated;
commit;
