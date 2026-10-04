-- AGENT-1: one server-scored Practice engine for Staff and Agent learners.
begin;

create function pulse_private.score_go_practice_for_learner(
  requested_learner_id uuid,requested_attempt_id uuid,
  requested_question_id uuid,requested_answer jsonb
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare target public.training_attempts%rowtype;
  clock_row public.go_practice_clocks%rowtype;
  question public.training_questions%rowtype;
  next_seconds integer; total integer; correct integer;
  stored_answer jsonb; is_correct boolean; timed_out boolean;
  finished_at timestamptz; result_row public.training_results%rowtype;
  breakdown jsonb;
begin
  select * into target from public.training_attempts
  where id=requested_attempt_id and learner_id=requested_learner_id
    and source_mode='go_practice' for update;
  if not found then raise exception 'GO Practice attempt unavailable' using errcode='P0002'; end if;
  if target.status<>'started' then
    raise exception 'GO Practice attempt is finalized' using errcode='55000';
  end if;
  select * into clock_row from public.go_practice_clocks
  where attempt_id=requested_attempt_id for update;
  if not found then raise exception 'GO Practice clock unavailable' using errcode='P0002'; end if;
  select candidate.* into question from public.training_questions candidate
  join public.go_practice_round_questions selected on selected.question_id=candidate.id
  where candidate.id=requested_question_id and candidate.content_id=target.content_id
    and selected.attempt_id=requested_attempt_id
    and selected.round_position=clock_row.current_question_position;
  if not found then
    raise exception 'GO Practice question is no longer active' using errcode='55000';
  end if;
  timed_out := statement_timestamp()>=clock_row.question_deadline_at;
  stored_answer := case when timed_out then 'null'::jsonb
    else coalesce(requested_answer,'null'::jsonb) end;
  is_correct := case when jsonb_typeof(stored_answer)='null' then false
    else pulse_private.score_training_answer(question,stored_answer) end;
  insert into public.training_attempt_answers(attempt_id,question_id,submitted_answer,is_correct)
  values(target.id,question.id,stored_answer,is_correct);
  select count(*)::integer into total from public.go_practice_round_questions selected
  where selected.attempt_id=target.id;
  if clock_row.current_question_position<total then
    select candidate.time_limit_seconds into next_seconds
    from public.training_questions candidate
    join public.go_practice_round_questions selected on selected.question_id=candidate.id
    where selected.attempt_id=target.id
      and selected.round_position=clock_row.current_question_position+1;
    if next_seconds is null then
      raise exception 'GO Practice question unavailable' using errcode='P0002';
    end if;
    update public.go_practice_clocks
    set current_question_position=current_question_position+1,
      question_started_at=statement_timestamp(),
      question_deadline_at=statement_timestamp()+make_interval(secs=>next_seconds)
    where attempt_id=target.id returning * into clock_row;
    return jsonb_build_object('completed',false,'timed_out',timed_out,
      'question_position',clock_row.current_question_position,
      'time_limit_seconds',next_seconds,'deadline_at',clock_row.question_deadline_at,
      'server_now',statement_timestamp());
  end if;
  finished_at := statement_timestamp();
  select count(*) filter(where answer.is_correct)::integer into correct
  from public.training_attempt_answers answer where answer.attempt_id=target.id;
  update public.training_attempts attempt
  set status='completed',completed_at=finished_at,
    duration_seconds=greatest(0,extract(epoch from finished_at-attempt.started_at)::integer)
  where attempt.id=target.id;
  insert into public.training_results(
    attempt_id,total_questions,correct_answers,score_percent,completed)
  values(target.id,total,correct,round(correct::numeric*100/total,2),true)
  returning * into result_row;
  insert into public.training_result_topics(
    result_id,topic_id,total_questions,correct_answers)
  select result_row.id,question_topic.topic_id,count(*)::integer,
    count(answer.question_id) filter(where answer.is_correct)::integer
  from public.go_practice_round_questions selected
  join public.training_questions candidate on candidate.id=selected.question_id
  join public.training_question_topics question_topic on question_topic.question_id=candidate.id
  left join public.training_attempt_answers answer
    on answer.question_id=candidate.id and answer.attempt_id=target.id
  where selected.attempt_id=target.id group by question_topic.topic_id;
  update public.go_practice_clocks set completed_at=finished_at where attempt_id=target.id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'topic_id',topic.id,'topic_name',topic.name,
    'correct_answers',result_topic.correct_answers,
    'total_questions',result_topic.total_questions)
    order by topic.name,topic.id),'[]'::jsonb) into breakdown
  from public.training_result_topics result_topic
  join public.training_topics topic on topic.id=result_topic.topic_id
  where result_topic.result_id=result_row.id;
  return jsonb_build_object('completed',true,'timed_out',timed_out,
    'result',jsonb_build_object('result_id',result_row.id,'attempt_id',target.id,
      'total_questions',total,'correct_answers',correct,
      'score_percent',result_row.score_percent,
      'topic_breakdown',breakdown,'completed_at',finished_at));
end
$function$;

-- Existing Staff contract retains the same signature, authorization and
-- response. Only the scoring implementation moves to the shared helper.
create or replace function public.submit_go_practice_answer(
  requested_attempt_id uuid,requested_question_id uuid,requested_answer jsonb
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.staff_user_id=actor_id
    and attempt.source_mode='go_practice';
  if not found then raise exception 'GO Practice attempt unavailable' using errcode='P0002'; end if;
  if not pulse_private.has_training_learner_content_permission(
    'go.play',target.content_id,actor_id) then
    raise exception 'eligible GO Practice permission required' using errcode='42501';
  end if;
  return pulse_private.score_go_practice_for_learner(
    target.learner_id,requested_attempt_id,requested_question_id,requested_answer);
end
$function$;

create function public.agent_submit_go_practice_answer(
  requested_agent_id uuid,requested_attempt_id uuid,
  requested_question_id uuid,requested_answer jsonb
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare target public.training_attempts%rowtype; outcome jsonb;
  verdict boolean; certification_mode boolean;
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_agent_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.agent_id=requested_agent_id
    and attempt.source_mode='go_practice';
  if not found then raise exception 'GO Practice attempt unavailable' using errcode='P0002'; end if;
  if not pulse_private.agent_can_play_content(requested_agent_id,target.content_id) then
    raise exception 'Your Pulse access is currently unavailable' using errcode='42501';
  end if;
  outcome := pulse_private.score_go_practice_for_learner(
    target.learner_id,requested_attempt_id,requested_question_id,requested_answer);
  select answer.is_correct,exists(select 1 from public.go_question_bank_groups bank
    where bank.content_id=target.content_id and bank.game_mode='certification')
  into verdict,certification_mode
  from public.training_attempt_answers answer
  where answer.attempt_id=requested_attempt_id and answer.question_id=requested_question_id;
  if not found then raise exception 'GO Practice answer unavailable' using errcode='P0002'; end if;
  if certification_mode then return outcome; end if;
  return outcome || jsonb_build_object('answer_feedback',
    case when verdict then 'correct' else 'incorrect' end);
end
$function$;

revoke all on function pulse_private.score_go_practice_for_learner(uuid,uuid,uuid,jsonb)
  from public,anon,authenticated,service_role;
revoke all on function public.submit_go_practice_answer(uuid,uuid,jsonb)
  from public,anon,service_role;
grant execute on function public.submit_go_practice_answer(uuid,uuid,jsonb) to authenticated;
revoke all on function public.agent_submit_go_practice_answer(uuid,uuid,uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.agent_submit_go_practice_answer(uuid,uuid,uuid,jsonb)
  to service_role;
commit;
