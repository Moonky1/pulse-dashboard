-- GO-4: find only the caller's active Hosted room so a stranded waiting
-- lobby can be explicitly closed. This does not weaken the one-room rule.
begin;

create function public.get_my_go_hosted_session()
returns jsonb language plpgsql volatile security definer
set search_path = pg_catalog as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.go_sessions%rowtype;
begin
  select session.* into target
  from public.go_session_memberships membership
  join public.go_sessions session on session.id = membership.session_id
  where membership.staff_user_id = actor_id and membership.member_kind = 'host'
    and session.status in ('lobby','active')
  order by session.created_at desc, session.id desc limit 1;

  if not found then return null; end if;
  if target.expires_at <= now() then
    perform pulse_private.expire_go_session(target.id);
    return null;
  end if;
  return pulse_private.go_session_snapshot(target.id, actor_id);
end $function$;

alter function public.get_my_go_hosted_session() owner to postgres;
revoke all on function public.get_my_go_hosted_session() from public, anon, service_role;
grant execute on function public.get_my_go_hosted_session() to authenticated;

commit;
