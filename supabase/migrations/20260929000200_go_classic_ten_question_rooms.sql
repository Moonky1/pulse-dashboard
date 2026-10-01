-- Classic bank rooms retain all 40 immutable source questions but play a
-- server-selected ten-question round. Other published games are unchanged.
begin;

alter table public.go_sessions
  add column question_start_position integer not null default 1,
  add constraint go_sessions_question_start_positive check (question_start_position > 0);

create or replace function public.create_go_hosted_session(requested_content_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  existing public.go_sessions%rowtype;
  created public.go_sessions%rowtype;
  generated_code text;
  total integer;
  round_start integer := 1;
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
    where bank.content_id=requested_content_id and bank.game_mode='classic') then
    if total <> 40 then raise exception 'Classic question bank is incomplete' using errcode='55000'; end if;
    round_start := 1 + 10 * floor(random() * 4)::integer;
    total := 10;
  end if;
  for counter in 1..40 loop
    generated_code := 'KK ' || lpad((1000 + floor(random()*9000))::integer::text,4,'0');
    begin
      insert into public.go_sessions(room_code,content_id,question_count,question_start_position)
      values(generated_code,requested_content_id,total,round_start) returning * into created;
      exit;
    exception when unique_violation then
      if counter=40 then raise exception 'GO room code capacity unavailable' using errcode='55000'; end if;
    end;
  end loop;
  insert into public.go_session_memberships(session_id,member_kind,staff_user_id)
  values(created.id,'host',actor_id);
  return pulse_private.go_session_snapshot(created.id,actor_id);
end $function$;

create or replace function pulse_private.go_session_snapshot(
  requested_session_id uuid,requested_staff_user_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare
  target public.go_sessions%rowtype;
  membership public.go_session_memberships%rowtype;
  response jsonb;
begin
  select * into membership from public.go_session_memberships candidate
  where candidate.session_id=requested_session_id
    and candidate.staff_user_id=requested_staff_user_id;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  select * into target from public.go_sessions where id=requested_session_id;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  select jsonb_build_object(
    'session_id',target.id,
    'room_code',target.room_code,
    'status',target.status,
    'viewer_role',membership.member_kind,
    'version',target.version,
    'current_question_position',target.current_question_position,
    'question_count',target.question_count,
    'expires_at',target.expires_at,
    'started_at',target.started_at,
    'completed_at',target.completed_at,
    'content',jsonb_build_object(
      'id',content.id,'title',content.title,'description',content.description,
      'language',content.language,'content_type',content.content_type,
      'topics',coalesce((
        select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,'name',topic.name)
          order by topic.name,topic.id)
        from public.training_content_topics content_topic
        join public.training_topics topic on topic.id=content_topic.topic_id and topic.is_active
        where content_topic.content_id=content.id
      ),'[]'::jsonb)
    ),
    'participants',case when target.status='lobby' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'seat',participant.seat_number,'name',participant.participant_label,
        'status',participant.status
      ) order by participant.seat_number)
      from public.go_session_participants participant
      where participant.session_id=target.id
    ),'[]'::jsonb) else '[]'::jsonb end,
    'participant_count',(select count(*) from public.go_session_participants participant
      where participant.session_id=target.id),
    'answered_count',case when target.status='active' then (
      select count(*) from public.go_session_participants participant
      where participant.session_id=target.id
        and participant.answered_question_position=target.current_question_position
    ) else 0 end,
    'my_answered',case when membership.member_kind='participant' and target.status='active' then exists (
      select 1 from public.go_session_participants participant
      where participant.session_id=target.id
        and participant.seat_number=membership.seat_number
        and participant.answered_question_position=target.current_question_position
    ) else false end,
    'current_question',case when target.status='active' then (
      select jsonb_build_object(
        'id',question.id,'position',target.current_question_position,
        'question_type',question.question_type,'prompt',question.prompt,
        'answer_options',question.answer_options
      ) from public.training_questions question
      where question.content_id=target.content_id
        and question.position=target.question_start_position+target.current_question_position-1
    ) else null end,
    'my_result',case when membership.member_kind='participant' and target.status='completed' then (
      select jsonb_build_object(
        'score_percent',result.score_percent,
        'correct_answers',result.correct_answers,
        'total_questions',result.total_questions,
        'topic_breakdown',coalesce((
          select jsonb_agg(jsonb_build_object(
            'topic_id',result_topic.topic_id,'topic_name',topic.name,
            'correct_answers',result_topic.correct_answers,
            'total_questions',result_topic.total_questions
          ) order by topic.name,topic.id)
          from public.training_result_topics result_topic
          join public.training_topics topic on topic.id=result_topic.topic_id
          where result_topic.result_id=result.id
        ),'[]'::jsonb)
      ) from public.training_results result
      where result.attempt_id=membership.attempt_id
    ) else null end,
    'host_summary',case when membership.member_kind='host' and target.status='completed' then (
      select jsonb_build_object(
        'players',count(*),
        'average_score',coalesce(round(avg(result.score_percent),2),0),
        'completed_results',count(result.id)
      ) from public.go_session_memberships player
      left join public.training_results result on result.attempt_id=player.attempt_id
      where player.session_id=target.id and player.member_kind='participant'
    ) else null end
  ) into response
  from public.training_content content where content.id=target.content_id;
  return response;
end $function$;

create or replace function public.submit_go_hosted_answer(
  requested_session_id uuid,requested_question_id uuid,requested_answer jsonb,
  expected_question_position integer
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.go_sessions%rowtype;
  membership public.go_session_memberships%rowtype;
  question public.training_questions%rowtype;
  existing jsonb;
  correct boolean;
begin
  select * into target from public.go_sessions where id=requested_session_id for update;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.expires_at<=now() then
    perform pulse_private.expire_go_session(target.id);
    raise exception 'GO room is no longer active' using errcode='55000';
  end if;
  if target.status<>'active' or target.current_question_position<>expected_question_position then
    raise exception 'GO question is no longer active' using errcode='55000';
  end if;
  select * into membership from public.go_session_memberships candidate
  where candidate.session_id=target.id and candidate.staff_user_id=actor_id
    and candidate.member_kind='participant' for update;
  if not found or membership.attempt_id is null then
    raise exception 'GO player membership required' using errcode='42501';
  end if;
  if not pulse_private.go_staff_has_content_permission('go.play',target.content_id,actor_id) then
    raise exception 'eligible GO player permission required' using errcode='42501';
  end if;
  select * into question from public.training_questions candidate
  where candidate.id=requested_question_id and candidate.content_id=target.content_id
    and candidate.position=target.question_start_position+target.current_question_position-1;
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
  insert into public.training_attempt_answers(attempt_id,question_id,submitted_answer,is_correct)
  values(membership.attempt_id,question.id,requested_answer,correct);
  update public.go_session_participants
  set answered_question_position=target.current_question_position,updated_at=now()
  where session_id=target.id and seat_number=membership.seat_number;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end $function$;

create or replace function pulse_private.finalize_go_session(requested_session_id uuid)
returns void language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare
  target public.go_sessions%rowtype;
  player record;
  created_result public.training_results%rowtype;
  question_total integer;
  correct_total integer;
  finished_at timestamptz := now();
begin
  select * into target from public.go_sessions where id=requested_session_id for update;
  if not found or target.status='completed' then return; end if;
  if target.status <> 'active' then
    raise exception 'GO room is not active' using errcode='55000';
  end if;
  question_total := target.question_count;
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
    insert into public.training_results(attempt_id,total_questions,correct_answers,
      score_percent,completed)
    values (player.attempt_id,question_total,correct_total,
      round((correct_total::numeric*100)/question_total,2),true)
    on conflict (attempt_id) do nothing returning * into created_result;
    if created_result.id is not null then
      insert into public.training_result_topics(
        result_id,topic_id,total_questions,correct_answers
      ) select created_result.id,question_topic.topic_id,count(*)::integer,
        count(answer.question_id) filter(where answer.is_correct)::integer
      from public.training_questions question
      join public.training_question_topics question_topic
        on question_topic.question_id=question.id
      left join public.training_attempt_answers answer
        on answer.question_id=question.id and answer.attempt_id=player.attempt_id
      where question.content_id=target.content_id
        and question.position between target.question_start_position
          and target.question_start_position+target.question_count-1
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
end $function$;

alter function public.create_go_hosted_session(uuid) owner to postgres;
alter function pulse_private.go_session_snapshot(uuid,uuid) owner to postgres;
alter function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) owner to postgres;
alter function pulse_private.finalize_go_session(uuid) owner to postgres;
revoke all on function public.create_go_hosted_session(uuid) from public,anon,service_role;
revoke all on function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer)
  from public,anon,service_role;
revoke all on function pulse_private.go_session_snapshot(uuid,uuid)
  from public,anon,authenticated,service_role;
revoke all on function pulse_private.finalize_go_session(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.create_go_hosted_session(uuid) to authenticated;
grant execute on function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) to authenticated;

commit;
