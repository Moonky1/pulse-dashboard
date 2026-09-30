-- A published Classic level is one complete 40-question hosted game.
-- Existing rooms keep their original question_count and start position.
begin;

create or replace function public.create_go_hosted_session(requested_content_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  existing public.go_sessions%rowtype;
  created public.go_sessions%rowtype;
  generated_code text;
  total integer;
  counter integer;
begin
  if not pulse_private.go_staff_has_content_permission('go.host',requested_content_id,actor_id) then
    raise exception 'eligible GO host permission required' using errcode='42501';
  end if;
  select count(*)::integer into total from public.training_questions question
  join public.training_content content on content.id=question.content_id
  where content.id=requested_content_id and content.status='published'
    and content.content_type in ('quiz','assessment');
  if total < 1 then raise exception 'published hosted content not found' using errcode='P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended('go-host:'||actor_id::text,0));
  select session.* into existing
  from public.go_session_memberships membership
  join public.go_sessions session on session.id=membership.session_id
  where membership.staff_user_id=actor_id and membership.member_kind='host'
    and session.status in ('lobby','active')
  for update of session;
  if found then
    if existing.expires_at <= now() then
      perform pulse_private.expire_go_session(existing.id);
    elsif existing.content_id=requested_content_id then
      return pulse_private.go_session_snapshot(existing.id,actor_id);
    else
      raise exception 'finish the current hosted room first' using errcode='55000';
    end if;
  end if;
  if exists (select 1 from public.go_question_bank_groups bank
    where bank.content_id=requested_content_id and bank.game_mode='classic')
    and total <> 40 then
    raise exception 'Classic question bank is incomplete' using errcode='55000';
  end if;
  for counter in 1..40 loop
    generated_code := 'KK ' || lpad((1000 + floor(random()*9000))::integer::text,4,'0');
    begin
      insert into public.go_sessions(room_code,content_id,question_count,question_start_position)
      values(generated_code,requested_content_id,total,1) returning * into created;
      exit;
    exception when unique_violation then
      if counter=40 then raise exception 'GO room code capacity unavailable' using errcode='55000'; end if;
    end;
  end loop;
  insert into public.go_session_memberships(session_id,member_kind,staff_user_id)
  values(created.id,'host',actor_id);
  return pulse_private.go_session_snapshot(created.id,actor_id);
end $function$;

alter function public.create_go_hosted_session(uuid) owner to postgres;
revoke all on function public.create_go_hosted_session(uuid) from public,anon,service_role;
grant execute on function public.create_go_hosted_session(uuid) to authenticated;

commit;
