-- GO Practice submits and scores each question on the server. A missing or
-- late response is recorded as JSON null and cannot turn into a correct answer.
begin;

create table public.go_practice_round_questions (
  attempt_id uuid not null references public.training_attempts(id) on update restrict on delete restrict,
  round_position integer not null check (round_position between 1 and 10),
  question_id uuid not null references public.training_questions(id) on update restrict on delete restrict,
  primary key (attempt_id,round_position),
  unique (attempt_id,question_id)
);
alter table public.go_practice_round_questions enable row level security;
revoke all on table public.go_practice_round_questions from public,anon,authenticated;
grant all on table public.go_practice_round_questions to service_role;

create table public.go_practice_clocks (
  attempt_id uuid primary key references public.training_attempts(id) on update restrict on delete restrict,
  current_question_position integer not null default 1 check (current_question_position > 0),
  question_started_at timestamptz not null,
  question_deadline_at timestamptz not null,
  completed_at timestamptz,
  constraint go_practice_clock_window_valid check (question_deadline_at > question_started_at)
);
alter table public.go_practice_clocks enable row level security;
revoke all on table public.go_practice_clocks from public,anon,authenticated;
grant all on table public.go_practice_clocks to service_role;

create function pulse_private.start_go_practice_clock()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare seconds integer;
begin
  if new.source_mode='go_practice' then
    insert into public.go_practice_round_questions(attempt_id,round_position,question_id)
    select new.id,ranked.round_position,ranked.id
    from (
      select picked.id,row_number() over(order by picked.random_order)::integer as round_position
      from (
        select question.id,random() as random_order
        from public.training_questions question
        where question.content_id=new.content_id
        order by random() limit 10
      ) picked
    ) ranked;
    if (select count(*) from public.go_practice_round_questions where attempt_id=new.id)<>10 then
      raise exception 'GO games require at least 10 questions' using errcode='55000';
    end if;
    select question.time_limit_seconds into seconds
    from public.training_questions question
    join public.go_practice_round_questions selected on selected.question_id=question.id
    where selected.attempt_id=new.id and selected.round_position=1;
    if seconds is null then raise exception 'GO Practice question unavailable' using errcode='P0002'; end if;
    insert into public.go_practice_clocks(
      attempt_id,current_question_position,question_started_at,question_deadline_at
    ) values(new.id,1,new.started_at,new.started_at+make_interval(secs => seconds));
  end if;
  return new;
end
$function$;

create trigger training_attempts_start_go_practice_clock
after insert on public.training_attempts
for each row execute function pulse_private.start_go_practice_clock();

-- Resume eligible Practice attempts created before this migration. Old
-- three-question synthetic attempts stay untouched and are not in GO catalog.
do $backfill$
declare active_attempt record;
  first_seconds integer;
  started timestamptz;
begin
  for active_attempt in
    select attempt.id,attempt.content_id
    from public.training_attempts attempt
    where attempt.source_mode='go_practice' and attempt.status='started'
      and (select count(*) from public.training_questions question
        where question.content_id=attempt.content_id)>=10
      and not exists(select 1 from public.go_practice_clocks clock
        where clock.attempt_id=attempt.id)
  loop
    insert into public.go_practice_round_questions(attempt_id,round_position,question_id)
    select active_attempt.id,row_number() over(order by picked.random_order)::integer,picked.id
    from (
      select question.id,random() as random_order
      from public.training_questions question
      where question.content_id=active_attempt.content_id
      order by random() limit 10
    ) picked;
    select question.time_limit_seconds into first_seconds
    from public.training_questions question
    join public.go_practice_round_questions selected on selected.question_id=question.id
    where selected.attempt_id=active_attempt.id and selected.round_position=1;
    started := statement_timestamp();
    insert into public.go_practice_clocks(
      attempt_id,current_question_position,question_started_at,question_deadline_at
    ) values(active_attempt.id,1,started,started+make_interval(secs => first_seconds));
  end loop;
end
$backfill$;

create function public.get_go_practice_timing(requested_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
  clock_row public.go_practice_clocks%rowtype;
  seconds integer;
begin
  select attempt.* into target
  from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.staff_user_id=actor_id
    and attempt.source_mode='go_practice';
  if not found then raise exception 'GO Practice attempt unavailable' using errcode='P0002'; end if;
  if not pulse_private.has_training_learner_content_permission('go.play',target.content_id,actor_id) then
    raise exception 'eligible GO Practice permission required' using errcode='42501';
  end if;
  select * into clock_row from public.go_practice_clocks
  where attempt_id=requested_attempt_id;
  if not found then raise exception 'GO Practice clock unavailable' using errcode='P0002'; end if;
  select question.time_limit_seconds into seconds
  from public.training_questions question
  join public.go_practice_round_questions selected on selected.question_id=question.id
  where selected.attempt_id=requested_attempt_id
    and selected.round_position=clock_row.current_question_position;
  return jsonb_build_object(
    'question_position',clock_row.current_question_position,
    'question_ids',(select jsonb_agg(selected.question_id order by selected.round_position)
      from public.go_practice_round_questions selected where selected.attempt_id=requested_attempt_id),
    'time_limit_seconds',seconds,
    'deadline_at',clock_row.question_deadline_at,
    'server_now',statement_timestamp(),
    'completed',target.status='completed'
  );
end
$function$;

create function public.submit_go_practice_answer(
  requested_attempt_id uuid,
  requested_question_id uuid,
  requested_answer jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
  clock_row public.go_practice_clocks%rowtype;
  question public.training_questions%rowtype;
  next_seconds integer;
  total integer;
  correct integer;
  stored_answer jsonb;
  is_correct boolean;
  timed_out boolean;
  finished_at timestamptz;
  result_row public.training_results%rowtype;
  breakdown jsonb;
begin
  select attempt.* into target
  from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.staff_user_id=actor_id
    and attempt.source_mode='go_practice'
  for update of attempt;
  if not found then raise exception 'GO Practice attempt unavailable' using errcode='P0002'; end if;
  if target.status<>'started' then raise exception 'GO Practice attempt is finalized' using errcode='55000'; end if;
  if not pulse_private.has_training_learner_content_permission('go.play',target.content_id,actor_id) then
    raise exception 'eligible GO Practice permission required' using errcode='42501';
  end if;
  select * into clock_row from public.go_practice_clocks
  where attempt_id=requested_attempt_id for update;
  if not found then raise exception 'GO Practice clock unavailable' using errcode='P0002'; end if;
  select candidate.* into question from public.training_questions candidate
  join public.go_practice_round_questions selected on selected.question_id=candidate.id
  where candidate.id=requested_question_id and candidate.content_id=target.content_id
    and selected.attempt_id=requested_attempt_id
    and selected.round_position=clock_row.current_question_position;
  if not found then raise exception 'GO Practice question is no longer active' using errcode='55000'; end if;

  timed_out := statement_timestamp() >= clock_row.question_deadline_at;
  stored_answer := case when timed_out then 'null'::jsonb else coalesce(requested_answer,'null'::jsonb) end;
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
    if next_seconds is null then raise exception 'GO Practice question unavailable' using errcode='P0002'; end if;
    update public.go_practice_clocks
    set current_question_position=current_question_position+1,
      question_started_at=statement_timestamp(),
      question_deadline_at=statement_timestamp()+make_interval(secs => next_seconds)
    where attempt_id=target.id returning * into clock_row;
    return jsonb_build_object(
      'completed',false,'timed_out',timed_out,
      'question_position',clock_row.current_question_position,
      'time_limit_seconds',next_seconds,
      'deadline_at',clock_row.question_deadline_at,
      'server_now',statement_timestamp()
    );
  end if;

  finished_at := statement_timestamp();
  select count(*) filter(where answer.is_correct)::integer into correct
  from public.training_attempt_answers answer where answer.attempt_id=target.id;
  update public.training_attempts attempt
  set status='completed',completed_at=finished_at,
    duration_seconds=greatest(0,extract(epoch from finished_at-attempt.started_at)::integer)
  where attempt.id=target.id;
  insert into public.training_results(
    attempt_id,total_questions,correct_answers,score_percent,completed
  ) values(target.id,total,correct,round(correct::numeric*100/total,2),true)
  returning * into result_row;
  insert into public.training_result_topics(
    result_id,topic_id,total_questions,correct_answers
  ) select result_row.id,question_topic.topic_id,count(*)::integer,
      count(answer.question_id) filter(where answer.is_correct)::integer
    from public.go_practice_round_questions selected
    join public.training_questions candidate on candidate.id=selected.question_id
    join public.training_question_topics question_topic on question_topic.question_id=candidate.id
    left join public.training_attempt_answers answer
      on answer.question_id=candidate.id and answer.attempt_id=target.id
    where selected.attempt_id=target.id
    group by question_topic.topic_id;
  update public.go_practice_clocks set completed_at=finished_at where attempt_id=target.id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'topic_id',topic.id,'topic_name',topic.name,
    'correct_answers',result_topic.correct_answers,
    'total_questions',result_topic.total_questions
  ) order by topic.name,topic.id),'[]'::jsonb) into breakdown
  from public.training_result_topics result_topic
  join public.training_topics topic on topic.id=result_topic.topic_id
  where result_topic.result_id=result_row.id;
  return jsonb_build_object(
    'completed',true,'timed_out',timed_out,
    'result',jsonb_build_object(
      'result_id',result_row.id,'attempt_id',target.id,
      'total_questions',total,'correct_answers',correct,
      'score_percent',result_row.score_percent,
      'topic_breakdown',breakdown,'completed_at',finished_at
    )
  );
end
$function$;

-- The former bulk-completion path must not let a GO Practice client bypass
-- per-question deadlines. Academy keeps its existing completion contract.
alter function public.complete_training_attempt(uuid,jsonb,integer)
  rename to complete_training_attempt_legacy;
revoke all on function public.complete_training_attempt_legacy(uuid,jsonb,integer)
  from public,anon,authenticated,service_role;

create function public.complete_training_attempt(
  requested_attempt_id uuid,
  requested_answers jsonb,
  requested_duration_seconds integer default null
)
returns table (
  result_id uuid,attempt_id uuid,total_questions integer,
  correct_answers integer,score_percent numeric,
  topic_breakdown jsonb,completed_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
begin
  select attempt.* into target
  from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.staff_user_id=actor_id;
  if not found then raise exception 'owned Training attempt not found' using errcode='P0002'; end if;
  if target.source_mode<>'academy' then
    raise exception 'timed GO Practice requires individual answers' using errcode='55000';
  end if;
  return query select * from public.complete_training_attempt_legacy(
    requested_attempt_id,requested_answers,requested_duration_seconds
  );
end
$function$;

alter function pulse_private.start_go_practice_clock() owner to postgres;
alter function public.get_go_practice_timing(uuid) owner to postgres;
alter function public.submit_go_practice_answer(uuid,uuid,jsonb) owner to postgres;
alter function public.complete_training_attempt(uuid,jsonb,integer) owner to postgres;
revoke all on function pulse_private.start_go_practice_clock() from public,anon,authenticated,service_role;
revoke all on function public.get_go_practice_timing(uuid) from public,anon,service_role;
revoke all on function public.submit_go_practice_answer(uuid,uuid,jsonb) from public,anon,service_role;
revoke all on function public.complete_training_attempt(uuid,jsonb,integer) from public,anon,service_role;
grant execute on function public.get_go_practice_timing(uuid) to authenticated;
grant execute on function public.submit_go_practice_answer(uuid,uuid,jsonb) to authenticated;
grant execute on function public.complete_training_attempt(uuid,jsonb,integer) to authenticated;

commit;
