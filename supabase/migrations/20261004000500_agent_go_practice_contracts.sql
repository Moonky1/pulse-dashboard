-- AGENT-1: protected Agent Practice read/start/review contracts.
begin;

create function public.agent_list_go_practice_catalog(
  requested_agent_id uuid,requested_language text default null,
  requested_limit integer default 100,requested_offset integer default 0
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare response jsonb;
begin
  if requested_language is not null and requested_language not in ('en','es')
    or requested_limit is null or requested_limit not between 1 and 100
    or requested_offset is null or requested_offset<0 then
    raise exception 'Invalid GO catalog request' using errcode='22023';
  end if;
  if not exists(select 1 from public.agents agent
    join public.teams team on team.id=agent.team_id and team.is_active
    where agent.id=requested_agent_id and agent.status='active') then
    raise exception 'Your Pulse access is currently unavailable' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',item.id,'content_type',item.content_type,'title',item.title,
    'description',item.description,'language',item.language,
    'topics',item.topics,'published_at',item.published_at,
    'creator_display',item.creator_display,'creator_label',item.creator_label,
    'authorship_kind',item.authorship_kind,'question_count',item.question_count,
    'game_mode',item.game_mode,'difficulty',item.difficulty,
    'review_required',item.review_required) order by item.title,item.id),'[]'::jsonb)
  into response from (
    select content.id,content.content_type,content.title,content.description,
      content.language,content.published_at,content.authorship_kind,
      coalesce(nullif(btrim(creator.display_name),''),creator.full_name) as creator_display,
      case when content.authorship_kind='pulse' then 'Made by Pulse'
        else 'Created by '||coalesce(nullif(btrim(creator.display_name),''),creator.full_name)
        end as creator_label,
      (select count(*)::integer from public.training_questions question
        where question.content_id=content.id) as question_count,
      coalesce((select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,
        'name',topic.name) order by topic.name,topic.id)
        from public.training_content_topics content_topic
        join public.training_topics topic on topic.id=content_topic.topic_id and topic.is_active
        where content_topic.content_id=content.id),'[]'::jsonb) as topics,
      bank.game_mode,bank.difficulty,bank.reviewed_at is null as review_required
    from public.training_content content
    join public.users creator on creator.id=content.created_by_user_id
    left join public.go_question_bank_groups bank on bank.content_id=content.id
    where content.status='published' and content.is_current
      and content.content_type in ('quiz','assessment')
      and (requested_language is null or content.language=requested_language)
      and pulse_private.agent_can_play_content(requested_agent_id,content.id)
    order by content.title,content.id limit requested_limit offset requested_offset
  ) item;
  return response;
end
$function$;

create function public.agent_get_go_practice_content(
  requested_agent_id uuid,requested_content_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare response jsonb;
begin
  if not pulse_private.agent_can_play_content(requested_agent_id,requested_content_id) then
    raise exception 'GO Practice content unavailable' using errcode='P0002';
  end if;
  select jsonb_build_object('id',content.id,'title',content.title,
    'description',content.description,'content_type',content.content_type,
    'language',content.language,
    'topics',coalesce((select jsonb_agg(jsonb_build_object('id',topic.id,
      'code',topic.code,'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id=content_topic.topic_id
      where content_topic.content_id=content.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_build_object(
      'id',question.id,'position',question.position,
      'question_type',question.question_type,'prompt',question.prompt,
      'answer_options',question.answer_options,'media_id',question.media_id,
      'time_limit_seconds',question.time_limit_seconds,
      'topic_ids',coalesce((select jsonb_agg(question_topic.topic_id
        order by question_topic.topic_id)
        from public.training_question_topics question_topic
        where question_topic.question_id=question.id),'[]'::jsonb))
      order by question.position,question.id)
      from public.training_questions question where question.content_id=content.id),'[]'::jsonb)
  ) into response from public.training_content content
  where content.id=requested_content_id and content.status='published';
  if response is null then
    raise exception 'GO Practice content unavailable' using errcode='P0002';
  end if;
  return response;
end
$function$;

create function public.agent_start_go_practice(
  requested_agent_id uuid,requested_content_id uuid
)
returns table(attempt_id uuid,content_id uuid,source_mode text,
  attempt_number integer,language text,started_at timestamptz)
language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare learner uuid; content public.training_content%rowtype;
  active_attempt public.training_attempts%rowtype;
  created public.training_attempts%rowtype; next_attempt integer;
begin
  if not pulse_private.agent_can_play_content(requested_agent_id,requested_content_id) then
    raise exception 'GO Practice content unavailable' using errcode='P0002';
  end if;
  select * into content from public.training_content candidate
  where candidate.id=requested_content_id and candidate.status='published'
    and candidate.content_type in ('quiz','assessment');
  if not found or (select count(*) from public.training_questions question
    where question.content_id=requested_content_id)<10 then
    raise exception 'GO games require at least 10 questions' using errcode='55000';
  end if;
  select link.learner_id into learner from public.training_agent_learner_links link
  where link.agent_id=requested_agent_id;
  if learner is null then raise exception 'Agent unavailable' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('go-practice:'||learner::text,0));
  select attempt.* into active_attempt from public.training_attempts attempt
  where attempt.learner_id=learner and attempt.content_id=requested_content_id
    and attempt.source_mode='go_practice' and attempt.status='started' for update;
  if found then
    return query select active_attempt.id,active_attempt.content_id,
      active_attempt.source_mode,active_attempt.attempt_number,
      active_attempt.language,active_attempt.started_at;
    return;
  end if;
  select coalesce(max(attempt.attempt_number),0)+1 into next_attempt
  from public.training_attempts attempt where attempt.learner_id=learner
    and attempt.content_id=requested_content_id and attempt.source_mode='go_practice';
  insert into public.training_attempts(
    learner_id,content_id,source_mode,attempt_number,language)
  values(learner,requested_content_id,'go_practice',next_attempt,content.language)
  returning * into created;
  return query select created.id,created.content_id,created.source_mode,
    created.attempt_number,created.language,created.started_at;
end
$function$;

create function public.agent_get_go_practice_timing(
  requested_agent_id uuid,requested_attempt_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target public.training_attempts%rowtype;
  clock_row public.go_practice_clocks%rowtype; seconds integer;
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_agent_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.agent_id=requested_agent_id
    and attempt.source_mode='go_practice';
  if not found then raise exception 'GO Practice attempt unavailable' using errcode='P0002'; end if;
  if not pulse_private.agent_can_play_content(requested_agent_id,target.content_id) then
    raise exception 'Your Pulse access is currently unavailable' using errcode='42501';
  end if;
  select * into clock_row from public.go_practice_clocks
  where attempt_id=requested_attempt_id;
  if not found then raise exception 'GO Practice clock unavailable' using errcode='P0002'; end if;
  select question.time_limit_seconds into seconds from public.training_questions question
  join public.go_practice_round_questions selected on selected.question_id=question.id
  where selected.attempt_id=requested_attempt_id
    and selected.round_position=clock_row.current_question_position;
  return jsonb_build_object('question_position',clock_row.current_question_position,
    'question_ids',(select jsonb_agg(selected.question_id order by selected.round_position)
      from public.go_practice_round_questions selected
      where selected.attempt_id=requested_attempt_id),
    'time_limit_seconds',seconds,'deadline_at',clock_row.question_deadline_at,
    'server_now',statement_timestamp(),'completed',target.status='completed');
end
$function$;

create function public.agent_get_go_practice_completed_review(
  requested_agent_id uuid,requested_attempt_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target public.training_attempts%rowtype; review_questions jsonb;
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_agent_learner_links link on link.learner_id=attempt.learner_id
  join public.training_results result on result.attempt_id=attempt.id and result.completed
  where attempt.id=requested_attempt_id and link.agent_id=requested_agent_id
    and attempt.source_mode='go_practice' and attempt.status='completed';
  if not found or exists(select 1 from public.go_question_bank_groups bank
    where bank.content_id=target.content_id and bank.game_mode='certification') then
    raise exception 'completed GO Practice review unavailable' using errcode='P0002';
  end if;
  if not pulse_private.agent_can_play_content(requested_agent_id,target.content_id) then
    raise exception 'Your Pulse access is currently unavailable' using errcode='42501';
  end if;
  select jsonb_agg(jsonb_build_object(
    'position',selected.round_position,'question_id',question.id,
    'question_type',question.question_type,'prompt',question.prompt,
    'answer_options',question.answer_options,'submitted_answer',answer.submitted_answer,
    'correct_answer',question.correct_answer,'is_correct',answer.is_correct,
    'explanation',question.explanation) order by selected.round_position)
  into review_questions from public.go_practice_round_questions selected
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

create function public.agent_get_go_certification_result(
  requested_agent_id uuid,requested_attempt_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target public.training_attempts%rowtype;
  score numeric(5,2); threshold numeric(5,2);
begin
  select attempt.* into target from public.training_attempts attempt
  join public.training_agent_learner_links link on link.learner_id=attempt.learner_id
  where attempt.id=requested_attempt_id and link.agent_id=requested_agent_id
    and attempt.source_mode='go_practice' and attempt.status='completed';
  if not found or not exists(select 1 from public.go_question_bank_groups bank
    where bank.content_id=target.content_id and bank.game_mode='certification') then
    raise exception 'completed Certification attempt unavailable' using errcode='P0002';
  end if;
  select result.score_percent,policy.passing_percent into score,threshold
  from public.training_results result
  join public.go_certification_attempts policy on policy.attempt_id=result.attempt_id
  where result.attempt_id=target.id and result.completed;
  if not found then raise exception 'Certification result unavailable' using errcode='P0002'; end if;
  return jsonb_build_object('attempt_id',target.id,'score_percent',score,
    'passed',score>=threshold,'completed_at',target.completed_at);
end
$function$;

-- Catalog cards use safe mode/credit metadata, not Studio edit privileges.
create function public.agent_get_go_catalog_metadata(
  requested_agent_id uuid,requested_content_ids uuid[]
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare response jsonb;
begin
  if requested_content_ids is null or cardinality(requested_content_ids)>100 then
    raise exception 'Invalid GO metadata request' using errcode='22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',content.id,'game_mode',bank.game_mode,'difficulty',bank.difficulty,
    'review_required',bank.reviewed_at is null,
    'creator_label',case when content.authorship_kind='pulse' then 'Made by Pulse'
      else 'Created by '||coalesce(nullif(btrim(creator.display_name),''),creator.full_name) end,
    'authorship_kind',content.authorship_kind,'is_current',content.is_current,
    'question_count',(select count(*) from public.training_questions question
      where question.content_id=content.id)) order by content.id),'[]'::jsonb)
  into response from public.training_content content
  join public.users creator on creator.id=content.created_by_user_id
  left join public.go_question_bank_groups bank on bank.content_id=content.id
  where content.id=any(requested_content_ids) and content.status='published'
    and pulse_private.agent_can_play_content(requested_agent_id,content.id);
  return response;
end
$function$;

revoke all on function public.agent_list_go_practice_catalog(uuid,text,integer,integer)
  from public,anon,authenticated;
revoke all on function public.agent_get_go_practice_content(uuid,uuid)
  from public,anon,authenticated;
revoke all on function public.agent_start_go_practice(uuid,uuid)
  from public,anon,authenticated;
revoke all on function public.agent_get_go_practice_timing(uuid,uuid)
  from public,anon,authenticated;
revoke all on function public.agent_get_go_practice_completed_review(uuid,uuid)
  from public,anon,authenticated;
revoke all on function public.agent_get_go_certification_result(uuid,uuid)
  from public,anon,authenticated;
revoke all on function public.agent_get_go_catalog_metadata(uuid,uuid[])
  from public,anon,authenticated;
grant execute on function public.agent_list_go_practice_catalog(uuid,text,integer,integer)
  to service_role;
grant execute on function public.agent_get_go_practice_content(uuid,uuid) to service_role;
grant execute on function public.agent_start_go_practice(uuid,uuid) to service_role;
grant execute on function public.agent_get_go_practice_timing(uuid,uuid) to service_role;
grant execute on function public.agent_get_go_practice_completed_review(uuid,uuid) to service_role;
grant execute on function public.agent_get_go_certification_result(uuid,uuid) to service_role;
grant execute on function public.agent_get_go_catalog_metadata(uuid,uuid[]) to service_role;
commit;
