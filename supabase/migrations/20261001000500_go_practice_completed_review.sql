-- Reveal answer keys and explanations only to the active Staff owner of a
-- completed GO Practice attempt. The live question contract stays unchanged.
begin;

create function public.get_go_practice_completed_review(requested_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
  review_questions jsonb;
begin
  select attempt.* into target
  from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id=attempt.learner_id
  join public.training_results result on result.attempt_id=attempt.id and result.completed
  where attempt.id=requested_attempt_id and link.staff_user_id=actor_id
    and attempt.source_mode='go_practice' and attempt.status='completed';
  if not found then
    raise exception 'completed GO Practice attempt unavailable' using errcode='P0002';
  end if;

  select jsonb_agg(jsonb_build_object(
    'position',selected.round_position,
    'question_id',question.id,
    'question_type',question.question_type,
    'prompt',question.prompt,
    'answer_options',question.answer_options,
    'submitted_answer',answer.submitted_answer,
    'correct_answer',question.correct_answer,
    'is_correct',answer.is_correct,
    'explanation',question.explanation
  ) order by selected.round_position) into review_questions
  from public.go_practice_round_questions selected
  join public.training_questions question on question.id=selected.question_id
  join public.training_attempt_answers answer
    on answer.attempt_id=selected.attempt_id and answer.question_id=selected.question_id
  where selected.attempt_id=target.id;

  if jsonb_array_length(coalesce(review_questions,'[]'::jsonb))<>10 then
    raise exception 'completed GO Practice review unavailable' using errcode='P0002';
  end if;
  return jsonb_build_object('attempt_id',target.id,'questions',review_questions);
end
$function$;

alter function public.get_go_practice_completed_review(uuid) owner to postgres;
revoke all on function public.get_go_practice_completed_review(uuid) from public,anon,service_role;
grant execute on function public.get_go_practice_completed_review(uuid) to authenticated;

commit;
