-- Completed GO rankings are a separate, host-only read contract. Live rooms
-- and player snapshots continue to expose no opponent result or answer data.
create function public.get_go_hosted_results(requested_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  ranking jsonb;
begin
  if not exists (
    select 1
    from public.go_sessions session
    join public.go_session_memberships host
      on host.session_id = session.id
      and host.member_kind = 'host'
      and host.staff_user_id = actor_id
    where session.id = requested_session_id
      and session.status = 'completed'
  ) then
    raise exception 'GO results unavailable' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'seat', completed.seat_number,
    'name', completed.participant_label,
    'score_percent', completed.score_percent,
    'correct_answers', completed.correct_answers,
    'total_questions', completed.total_questions
  ) order by completed.score_percent desc, completed.correct_answers desc,
    completed.seat_number), '[]'::jsonb)
  into ranking
  from (
    select participant.seat_number, participant.participant_label,
      result.score_percent, result.correct_answers, result.total_questions
    from public.go_session_memberships membership
    join public.go_session_participants participant
      on participant.session_id = membership.session_id
      and participant.seat_number = membership.seat_number
    join public.training_results result on result.attempt_id = membership.attempt_id
    where membership.session_id = requested_session_id
      and membership.member_kind = 'participant'
  ) completed;

  return ranking;
end
$function$;

alter function public.get_go_hosted_results(uuid) owner to postgres;
revoke all on function public.get_go_hosted_results(uuid) from public, anon, service_role;
grant execute on function public.get_go_hosted_results(uuid) to authenticated;
