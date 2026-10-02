-- GO-3: permit reviewed original banks, retain server scoring, and keep
-- Certification individual with a server-pinned provisional policy.
begin;

create or replace function pulse_private.keep_go_question_bank_in_review()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare bank public.go_question_bank_groups%rowtype;
  expected_options integer;
begin
  if tg_table_name = 'go_question_bank_groups' then
    if not exists (select 1 from public.training_content content
      where content.id = new.content_id and content.status = 'draft') then
      raise exception 'GO question bank group requires a draft' using errcode='55000';
    end if;
  elsif old.status = 'draft' and new.status <> 'draft' then
    select * into bank from public.go_question_bank_groups where content_id = new.id;
    if found then
      expected_options := case when bank.game_mode in ('valid-invalid','eligible') then 2 else 4 end;
      if bank.reviewed_at is null or
        bank.reviewed_content_updated_at is distinct from old.updated_at or
        (select count(*) from public.training_questions q where q.content_id = new.id) <> 40 or
        exists (select 1 from public.training_questions q where q.content_id = new.id
          and (q.question_type <> 'multiple_choice' or
            jsonb_array_length(q.answer_options) <> expected_options or
            jsonb_typeof(q.correct_answer) <> 'number' or
            (q.correct_answer #>> '{}')::integer not between 0 and expected_options - 1 or
            q.explanation is null or btrim(q.explanation) = '')) then
        raise exception 'GO question bank requires reviewed complete mode content'
          using errcode='55000';
      end if;
    end if;
  end if;
  return new;
end $function$;

create table public.go_certification_policy (
  singleton boolean primary key default true check (singleton),
  passing_percent numeric(5,2) not null check (passing_percent > 0 and passing_percent <= 100),
  updated_at timestamptz not null default now()
);
alter table public.go_certification_policy enable row level security;
revoke all on table public.go_certification_policy from public,anon,authenticated;
grant all on table public.go_certification_policy to service_role;

create table public.go_certification_attempts (
  attempt_id uuid primary key references public.training_attempts(id) on update restrict on delete restrict,
  passing_percent numeric(5,2) not null check (passing_percent > 0 and passing_percent <= 100)
);
alter table public.go_certification_attempts enable row level security;
revoke all on table public.go_certification_attempts from public,anon,authenticated;
grant all on table public.go_certification_attempts to service_role;

create function pulse_private.pin_go_certification_policy()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare threshold numeric(5,2);
begin
  if new.source_mode = 'go_practice' and exists (
    select 1 from public.go_question_bank_groups bank
    where bank.content_id = new.content_id and bank.game_mode = 'certification'
  ) then
    select passing_percent into threshold from public.go_certification_policy where singleton;
    if threshold is null then
      raise exception 'Certification policy is not configured' using errcode='55000';
    end if;
    insert into public.go_certification_attempts(attempt_id,passing_percent)
    values(new.id,threshold);
  end if;
  return new;
end $function$;
create trigger training_attempts_pin_go_certification
  after insert on public.training_attempts
  for each row execute function pulse_private.pin_go_certification_policy();

create function pulse_private.block_hosted_certification()
returns trigger language plpgsql set search_path = pg_catalog as $function$
begin
  if exists (select 1 from public.go_question_bank_groups bank
    where bank.content_id = new.content_id and bank.game_mode = 'certification') then
    raise exception 'Certification is an individual assessment' using errcode='55000';
  end if;
  return new;
end $function$;
create trigger go_sessions_block_certification before insert on public.go_sessions
  for each row execute function pulse_private.block_hosted_certification();

create function public.get_go_certification_result(requested_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
  score numeric(5,2);
  threshold numeric(5,2);
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id = attempt.learner_id
  where attempt.id = requested_attempt_id and link.staff_user_id = actor_id
    and attempt.source_mode = 'go_practice' and attempt.status = 'completed';
  if not found or not exists (select 1 from public.go_question_bank_groups bank
    where bank.content_id = target.content_id and bank.game_mode = 'certification') then
    raise exception 'completed Certification attempt unavailable' using errcode='P0002';
  end if;
  select result.score_percent,policy.passing_percent into score,threshold
  from public.training_results result
  join public.go_certification_attempts policy on policy.attempt_id = result.attempt_id
  where result.attempt_id = target.id and result.completed;
  if not found then raise exception 'Certification result unavailable' using errcode='P0002'; end if;
  return jsonb_build_object('attempt_id',target.id,'score_percent',score,
    'passed',score >= threshold,'completed_at',target.completed_at);
end $function$;

-- Certification does not reveal answer keys after completion by default.
create or replace function public.get_go_practice_completed_review(requested_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.training_attempts%rowtype;
  review_questions jsonb;
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_staff_learner_links link on link.learner_id=attempt.learner_id
  join public.training_results result on result.attempt_id=attempt.id and result.completed
  where attempt.id=requested_attempt_id and link.staff_user_id=actor_id
    and attempt.source_mode='go_practice' and attempt.status='completed';
  if not found or exists (select 1 from public.go_question_bank_groups bank
    where bank.content_id=target.content_id and bank.game_mode='certification') then
    raise exception 'completed GO Practice review unavailable' using errcode='P0002';
  end if;
  select jsonb_agg(jsonb_build_object(
    'position',selected.round_position,'question_id',question.id,
    'question_type',question.question_type,'prompt',question.prompt,
    'answer_options',question.answer_options,'submitted_answer',answer.submitted_answer,
    'correct_answer',question.correct_answer,'is_correct',answer.is_correct,
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
end $function$;

alter function pulse_private.keep_go_question_bank_in_review() owner to postgres;
alter function pulse_private.pin_go_certification_policy() owner to postgres;
alter function pulse_private.block_hosted_certification() owner to postgres;
alter function public.get_go_certification_result(uuid) owner to postgres;
alter function public.get_go_practice_completed_review(uuid) owner to postgres;
revoke all on function pulse_private.pin_go_certification_policy() from public,anon,authenticated,service_role;
revoke all on function pulse_private.block_hosted_certification() from public,anon,authenticated,service_role;
revoke all on function public.get_go_certification_result(uuid) from public,anon,service_role;
grant execute on function public.get_go_certification_result(uuid) to authenticated;

commit;
