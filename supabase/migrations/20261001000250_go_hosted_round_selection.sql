-- Each hosted room fixes one random ten-question round on the server.
-- The published bank remains unchanged for subsequent rooms.
begin;

create table public.go_session_round_questions (
  session_id uuid not null references public.go_sessions(id) on update restrict on delete restrict,
  round_position integer not null check (round_position between 1 and 10),
  question_id uuid not null references public.training_questions(id) on update restrict on delete restrict,
  primary key (session_id,round_position),
  unique (session_id,question_id)
);
alter table public.go_session_round_questions enable row level security;
revoke all on table public.go_session_round_questions from public,anon,authenticated;
grant all on table public.go_session_round_questions to service_role;

create function pulse_private.prepare_go_hosted_round()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare bank_size integer;
begin
  select count(*)::integer into bank_size from public.training_questions
  where content_id=new.content_id;
  if bank_size<10 then
    raise exception 'GO games require at least 10 questions' using errcode='55000';
  end if;
  new.question_count := 10;
  return new;
end
$function$;

create function pulse_private.select_go_hosted_round()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  insert into public.go_session_round_questions(session_id,round_position,question_id)
  select new.id,row_number() over(order by picked.random_order)::integer,picked.id
  from (
    select question.id,random() as random_order
    from public.training_questions question
    where question.content_id=new.content_id
    order by random() limit 10
  ) picked;
  return new;
end
$function$;

create trigger go_sessions_prepare_round before insert on public.go_sessions
for each row execute function pulse_private.prepare_go_hosted_round();
create trigger go_sessions_select_round after insert on public.go_sessions
for each row execute function pulse_private.select_go_hosted_round();

-- Keep the established safe room payload and replace only its current
-- question with the one selected for this room. Old rooms retain their view.
alter function pulse_private.go_session_snapshot(uuid,uuid)
  rename to go_session_snapshot_full_bank;

create function pulse_private.go_session_snapshot(
  requested_session_id uuid, requested_staff_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  snapshot jsonb := pulse_private.go_session_snapshot_full_bank(
    requested_session_id,requested_staff_user_id
  );
  selected jsonb;
begin
  if snapshot->>'status'<>'active' then return snapshot; end if;
  select jsonb_build_object(
    'id',question.id,
    'position',selected_question.round_position,
    'question_type',question.question_type,
    'prompt',question.prompt,
    'answer_options',question.answer_options
  ) into selected
  from public.go_session_round_questions selected_question
  join public.training_questions question on question.id=selected_question.question_id
  where selected_question.session_id=requested_session_id
    and selected_question.round_position=(snapshot->>'current_question_position')::integer;
  if selected is not null then
    snapshot := jsonb_set(snapshot,'{current_question}',selected);
  end if;
  return snapshot;
end
$function$;

-- Results use only the ten questions that were actually in this room.
create or replace function pulse_private.finalize_go_session(requested_session_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  target public.go_sessions%rowtype;
  player record;
  created_result public.training_results%rowtype;
  correct_total integer;
  finished_at timestamptz := now();
begin
  select * into target from public.go_sessions where id=requested_session_id for update;
  if not found or target.status='completed' then return; end if;
  if target.status<>'active' then raise exception 'GO room is not active' using errcode='55000'; end if;
  for player in
    select membership.attempt_id from public.go_session_memberships membership
    where membership.session_id=target.id and membership.member_kind='participant'
    order by membership.seat_number
  loop
    select count(*) filter(where answer.is_correct)::integer into correct_total
    from public.training_attempt_answers answer where answer.attempt_id=player.attempt_id;
    update public.training_attempts attempt
    set status='completed',completed_at=finished_at,
      duration_seconds=greatest(0,extract(epoch from finished_at-attempt.started_at)::integer)
    where attempt.id=player.attempt_id and attempt.status='started';
    insert into public.training_results(
      attempt_id,total_questions,correct_answers,score_percent,completed
    ) values (
      player.attempt_id,target.question_count,correct_total,
      round((correct_total::numeric*100)/target.question_count,2),true
    ) on conflict (attempt_id) do nothing
    returning * into created_result;
    if created_result.id is not null then
      insert into public.training_result_topics(
        result_id,topic_id,total_questions,correct_answers
      )
      select created_result.id,question_topic.topic_id,count(*)::integer,
        count(answer.question_id) filter(where answer.is_correct)::integer
      from public.training_questions question
      join public.training_question_topics question_topic on question_topic.question_id=question.id
      left join public.training_attempt_answers answer
        on answer.question_id=question.id and answer.attempt_id=player.attempt_id
      where (exists (
        select 1 from public.go_session_round_questions selected
        where selected.session_id=target.id and selected.question_id=question.id
      ) or (not exists (
        select 1 from public.go_session_round_questions selected where selected.session_id=target.id
      ) and question.content_id=target.content_id))
      group by question_topic.topic_id;
    end if;
    created_result := null;
  end loop;
  update public.go_session_participants
  set status='completed',updated_at=finished_at where session_id=target.id;
  update public.go_sessions
  set status='completed',current_question_position=question_count,
    completed_at=finished_at,version=version+1,updated_at=finished_at
  where id=target.id;
end
$function$;

alter function pulse_private.prepare_go_hosted_round() owner to postgres;
alter function pulse_private.select_go_hosted_round() owner to postgres;
alter function pulse_private.go_session_snapshot(uuid,uuid) owner to postgres;
revoke all on function pulse_private.prepare_go_hosted_round() from public,anon,authenticated,service_role;
revoke all on function pulse_private.select_go_hosted_round() from public,anon,authenticated,service_role;
revoke all on function pulse_private.go_session_snapshot(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.go_session_snapshot_full_bank(uuid,uuid)
  from public,anon,authenticated,service_role;

commit;
