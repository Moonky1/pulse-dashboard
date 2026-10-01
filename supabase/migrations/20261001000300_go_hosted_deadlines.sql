-- Host and players share one server deadline. Existing room lifecycle and
-- scoring remain authoritative; browser countdowns cannot extend a question.
begin;

alter table public.go_sessions
  add column if not exists question_started_at timestamptz,
  add column if not exists question_deadline_at timestamptz;

create function pulse_private.stamp_go_question_deadline()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  seconds integer;
begin
  if new.status='active' and (
    old.status is distinct from 'active'
    or new.current_question_position is distinct from old.current_question_position
  ) then
    select question.time_limit_seconds into seconds
    from public.training_questions question
    where question.id=coalesce((
      select selected.question_id from public.go_session_round_questions selected
      where selected.session_id=new.id and selected.round_position=new.current_question_position
    ),(
      select fallback.id from public.training_questions fallback
      where fallback.content_id=new.content_id
        and fallback.position=new.current_question_position
    ));
    if seconds is null then
      raise exception 'GO question is unavailable' using errcode='P0002';
    end if;
    new.question_started_at := statement_timestamp();
    new.question_deadline_at := new.question_started_at + make_interval(secs => seconds);
  end if;
  return new;
end
$function$;

drop trigger if exists go_sessions_question_deadline on public.go_sessions;
create trigger go_sessions_question_deadline
before update on public.go_sessions
for each row execute function pulse_private.stamp_go_question_deadline();

-- Existing active Preview rooms receive a fresh full question window.
update public.go_sessions session
set question_started_at=statement_timestamp(),
    question_deadline_at=statement_timestamp()+make_interval(secs => question.time_limit_seconds)
from public.training_questions question
where session.status='active' and session.question_deadline_at is null
  and question.id=coalesce((
    select selected.question_id from public.go_session_round_questions selected
    where selected.session_id=session.id
      and selected.round_position=session.current_question_position
  ),(
    select fallback.id from public.training_questions fallback
    where fallback.content_id=session.content_id
      and fallback.position=session.current_question_position
  ));

create function public.get_go_hosted_timing(requested_session_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  target public.go_sessions%rowtype;
  seconds integer;
begin
  if not pulse_private.can_view_go_session(requested_session_id) then
    raise exception 'GO room unavailable' using errcode='P0002';
  end if;
  select * into target from public.go_sessions where id=requested_session_id;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.status='active' then
    select question.time_limit_seconds into seconds
    from public.training_questions question
    where question.id=coalesce((
      select selected.question_id from public.go_session_round_questions selected
      where selected.session_id=target.id
        and selected.round_position=target.current_question_position
    ),(
      select fallback.id from public.training_questions fallback
      where fallback.content_id=target.content_id
        and fallback.position=target.current_question_position
    ));
  end if;
  return jsonb_build_object(
    'question_position',target.current_question_position,
    'time_limit_seconds',seconds,
    'deadline_at',target.question_deadline_at,
    'server_now',statement_timestamp()
  );
end
$function$;

-- Retain the former secured implementations for this migration's wrappers,
-- but revoke direct browser access so their untimed paths cannot be called.
alter function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer)
  rename to submit_go_hosted_answer_untimed;
revoke all on function public.submit_go_hosted_answer_untimed(uuid,uuid,jsonb,integer)
  from public,anon,authenticated,service_role;

create function public.submit_go_hosted_answer(
  requested_session_id uuid,
  requested_question_id uuid,
  requested_answer jsonb,
  expected_question_position integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.go_sessions%rowtype;
  membership public.go_session_memberships%rowtype;
  question public.training_questions%rowtype;
  existing jsonb;
  correct boolean;
begin
  select session.* into target
  from public.go_sessions session
  join public.go_session_memberships member on member.session_id=session.id
    and member.staff_user_id=actor_id and member.member_kind='participant'
  where session.id=requested_session_id
  for update of session;
  if not found then raise exception 'GO player membership required' using errcode='42501'; end if;
  select * into membership from public.go_session_memberships member
  where member.session_id=target.id and member.staff_user_id=actor_id
    and member.member_kind='participant';
  if target.status<>'active' or target.current_question_position<>expected_question_position
    or target.expires_at<=statement_timestamp() then
    raise exception 'GO question is no longer active' using errcode='55000';
  end if;
  if target.question_deadline_at is null or statement_timestamp() >= target.question_deadline_at then
    raise exception 'GO question time expired' using errcode='55000';
  end if;
  if not pulse_private.go_staff_has_content_permission('go.play',target.content_id,actor_id) then
    raise exception 'eligible GO player permission required' using errcode='42501';
  end if;
  if not exists(select 1 from public.go_session_round_questions selected
    where selected.session_id=target.id) then
    return public.submit_go_hosted_answer_untimed(
      requested_session_id,requested_question_id,requested_answer,expected_question_position
    );
  end if;
  select candidate.* into question from public.training_questions candidate
  join public.go_session_round_questions selected on selected.question_id=candidate.id
  where selected.session_id=target.id
    and selected.round_position=target.current_question_position
    and candidate.id=requested_question_id and candidate.content_id=target.content_id;
  if not found then raise exception 'GO question is unavailable' using errcode='P0002'; end if;
  select answer.submitted_answer into existing
  from public.training_attempt_answers answer
  where answer.attempt_id=membership.attempt_id and answer.question_id=question.id;
  if found then
    if existing<>requested_answer then
      raise exception 'GO answer is already locked' using errcode='55000';
    end if;
    return pulse_private.go_session_snapshot(target.id,actor_id);
  end if;
  correct := pulse_private.score_training_answer(question,requested_answer);
  insert into public.training_attempt_answers(
    attempt_id,question_id,submitted_answer,is_correct
  ) values(membership.attempt_id,question.id,requested_answer,correct);
  update public.go_session_participants
  set answered_question_position=target.current_question_position,updated_at=now()
  where session_id=target.id and seat_number=membership.seat_number;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end
$function$;

alter function public.advance_go_hosted_session(uuid,integer)
  rename to advance_go_hosted_session_untimed;
revoke all on function public.advance_go_hosted_session_untimed(uuid,integer)
  from public,anon,authenticated,service_role;

create function public.advance_go_hosted_session(
  requested_session_id uuid,
  expected_version integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.go_sessions%rowtype;
  answered integer;
  players integer;
begin
  select session.* into target
  from public.go_sessions session
  join public.go_session_memberships membership on membership.session_id=session.id
    and membership.staff_user_id=actor_id and membership.member_kind='host'
  where session.id=requested_session_id
  for update of session;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.status='active' and target.version=expected_version
    and target.question_deadline_at > statement_timestamp() then
    select count(*)::integer,
      count(*) filter(where participant.answered_question_position=target.current_question_position)::integer
      into players,answered
    from public.go_session_participants participant
    where participant.session_id=target.id;
    if answered<players then
      raise exception 'GO question time remains' using errcode='55000';
    end if;
  end if;
  return public.advance_go_hosted_session_untimed(requested_session_id,expected_version);
end
$function$;

alter function pulse_private.stamp_go_question_deadline() owner to postgres;
alter function public.get_go_hosted_timing(uuid) owner to postgres;
alter function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) owner to postgres;
alter function public.advance_go_hosted_session(uuid,integer) owner to postgres;
revoke all on function pulse_private.stamp_go_question_deadline() from public,anon,authenticated,service_role;
revoke all on function public.get_go_hosted_timing(uuid) from public,anon,service_role;
revoke all on function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) from public,anon,service_role;
revoke all on function public.advance_go_hosted_session(uuid,integer) from public,anon,service_role;
grant execute on function public.get_go_hosted_timing(uuid) to authenticated;
grant execute on function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) to authenticated;
grant execute on function public.advance_go_hosted_session(uuid,integer) to authenticated;

commit;
