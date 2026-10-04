-- AGENT-1: Agents and Staff share canonical Hosted attempts/results, but
-- remain distinct identities. Only Staff may host or access Staff RPCs.
begin;

alter table public.agents add column position_id uuid
  references public.positions(id) on update restrict on delete restrict;
create index agents_position_idx on public.agents(position_id) where position_id is not null;

alter table public.go_session_memberships drop constraint go_session_memberships_pkey;
alter table public.go_session_memberships
  add column id uuid not null default gen_random_uuid(),
  add column agent_id uuid references public.agents(id) on update restrict on delete restrict,
  alter column staff_user_id drop not null,
  add constraint go_session_memberships_pkey primary key(id);
alter table public.go_session_memberships
  drop constraint go_session_memberships_kind_valid;
alter table public.go_session_memberships
  add constraint go_session_memberships_identity_valid check (
    (staff_user_id is not null) <> (agent_id is not null)
  ),
  add constraint go_session_memberships_kind_valid check (
    (member_kind='host' and staff_user_id is not null and agent_id is null
      and seat_number is null and learner_id is null and attempt_id is null)
    or (member_kind='participant' and seat_number is not null and learner_id is not null)
  );
create unique index go_session_memberships_agent_unique
on public.go_session_memberships(session_id,agent_id) where agent_id is not null;

create function pulse_private.validate_go_member_identity()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $function$
begin
  if new.member_kind='participant' and not (
    (new.agent_id is not null and exists (
      select 1 from public.training_agent_learner_links link
      where link.agent_id=new.agent_id and link.learner_id=new.learner_id
    )) or
    (new.staff_user_id is not null and exists (
      select 1 from public.training_staff_learner_links link
      where link.staff_user_id=new.staff_user_id and link.learner_id=new.learner_id
    ))
  ) then raise exception 'GO participant identity mismatch' using errcode='23514'; end if;
  if new.attempt_id is not null and not exists (
    select 1 from public.training_attempts attempt
    where attempt.id=new.attempt_id and attempt.learner_id=new.learner_id
      and attempt.source_mode='go_hosted'
  ) then raise exception 'GO attempt identity mismatch' using errcode='23514'; end if;
  return new;
end
$function$;
create trigger go_session_memberships_identity_guard
before insert or update on public.go_session_memberships
for each row execute function pulse_private.validate_go_member_identity();

create function pulse_private.agent_can_play_content(
  requested_agent_id uuid,requested_content_id uuid
)
returns boolean language sql stable security definer set search_path = pg_catalog
as $function$
  select exists (
    select 1 from public.agents agent
    join public.teams team on team.id=agent.team_id and team.is_active
    join public.training_content content on content.id=requested_content_id
      and content.status='published' and content.content_type in ('quiz','assessment')
    where agent.id=requested_agent_id and agent.status='active'
      and exists (
        select 1 from public.training_content_audiences audience
        where audience.content_id=content.id and (
          audience.scope_type='global'
          or (audience.scope_type='team' and audience.team_id=team.id)
          or (audience.scope_type='campaign' and audience.campaign_id=team.campaign_id
            and exists (select 1 from public.campaigns campaign
              where campaign.id=team.campaign_id and campaign.is_active))
        )
      )
      and (not exists (select 1 from public.training_content_position_targets target
          where target.content_id=content.id)
        or exists (select 1 from public.training_content_position_targets target
          join public.positions position on position.id=target.position_id and position.is_active
          where target.content_id=content.id and target.position_id=agent.position_id))
  )
$function$;

create function pulse_private.go_agent_session_snapshot(
  requested_session_id uuid,requested_agent_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target public.go_sessions%rowtype; member public.go_session_memberships%rowtype;
  response jsonb;
begin
  select * into member from public.go_session_memberships
  where session_id=requested_session_id and agent_id=requested_agent_id
    and member_kind='participant';
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  select * into target from public.go_sessions where id=requested_session_id;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  select jsonb_build_object(
    'session_id',target.id,'room_code',target.room_code,'status',target.status,
    'viewer_role','participant','version',target.version,
    'current_question_position',target.current_question_position,
    'question_count',target.question_count,'expires_at',target.expires_at,
    'started_at',target.started_at,'completed_at',target.completed_at,
    'content',jsonb_build_object('id',content.id,'title',content.title,
      'description',content.description,'language',content.language,
      'content_type',content.content_type,'topics',coalesce((
        select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,'name',topic.name)
          order by topic.name,topic.id)
        from public.training_content_topics content_topic
        join public.training_topics topic on topic.id=content_topic.topic_id and topic.is_active
        where content_topic.content_id=content.id),'[]'::jsonb)),
    'participants',case when target.status='lobby' then coalesce((
      select jsonb_agg(jsonb_build_object('seat',participant.seat_number,
        'name',participant.participant_label,'status',participant.status,
        'team',player_team.name) order by participant.seat_number)
      from public.go_session_participants participant
      left join public.go_session_memberships player on player.session_id=participant.session_id
        and player.seat_number=participant.seat_number
      left join public.agents player_agent on player_agent.id=player.agent_id
      left join public.teams player_team on player_team.id=player_agent.team_id
      where participant.session_id=target.id),'[]'::jsonb) else '[]'::jsonb end,
    'participant_count',(select count(*) from public.go_session_participants participant
      where participant.session_id=target.id),
    'answered_count',case when target.status='active' then (
      select count(*) from public.go_session_participants participant
      where participant.session_id=target.id
        and participant.answered_question_position=target.current_question_position) else 0 end,
    'my_answered',case when target.status='active' then exists (
      select 1 from public.go_session_participants participant
      where participant.session_id=target.id and participant.seat_number=member.seat_number
        and participant.answered_question_position=target.current_question_position) else false end,
    'current_question',case when target.status='active' then (
      select jsonb_build_object('id',question.id,'position',target.current_question_position,
        'question_type',question.question_type,'prompt',question.prompt,
        'answer_options',question.answer_options)
      from public.training_questions question
      where question.id=coalesce((select selected.question_id
        from public.go_session_round_questions selected
        where selected.session_id=target.id
          and selected.round_position=target.current_question_position),(
        select fallback.id from public.training_questions fallback
        where fallback.content_id=target.content_id
          and fallback.position=target.current_question_position))) else null end,
    'my_result',case when target.status='completed' then (
      select jsonb_build_object('score_percent',result.score_percent,
        'correct_answers',result.correct_answers,'total_questions',result.total_questions,
        'topic_breakdown',coalesce((select jsonb_agg(jsonb_build_object(
          'topic_id',result_topic.topic_id,'topic_name',topic.name,
          'correct_answers',result_topic.correct_answers,
          'total_questions',result_topic.total_questions) order by topic.name,topic.id)
          from public.training_result_topics result_topic
          join public.training_topics topic on topic.id=result_topic.topic_id
          where result_topic.result_id=result.id),'[]'::jsonb))
      from public.training_results result where result.attempt_id=member.attempt_id)
      else null end,'host_summary',null
  ) into response from public.training_content content where content.id=target.content_id;
  return response;
end
$function$;

create function public.agent_join_go_hosted_session(
  requested_agent_id uuid,requested_room_code text
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare normalized_code text := pulse_private.normalize_go_room_code(requested_room_code);
  target public.go_sessions%rowtype; learner uuid; seat integer; label text;
begin
  if normalized_code is null then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  select * into target from public.go_sessions
  where room_code=normalized_code and status='lobby' for update;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.expires_at<=now() then
    perform pulse_private.expire_go_session(target.id);
    raise exception 'GO room unavailable' using errcode='P0002';
  end if;
  if not pulse_private.agent_can_play_content(requested_agent_id,target.content_id) then
    raise exception 'Your Pulse access is currently unavailable' using errcode='42501';
  end if;
  if exists (select 1 from public.go_session_memberships member
    where member.session_id=target.id and member.agent_id=requested_agent_id) then
    return pulse_private.go_agent_session_snapshot(target.id,requested_agent_id);
  end if;
  select link.learner_id,agent.display_name into learner,label
  from public.training_agent_learner_links link
  join public.agents agent on agent.id=link.agent_id
  where agent.id=requested_agent_id;
  if learner is null then raise exception 'Agent unavailable' using errcode='42501'; end if;
  select coalesce(max(participant.seat_number),0)+1 into seat
  from public.go_session_participants participant where participant.session_id=target.id;
  insert into public.go_session_participants(session_id,seat_number,participant_label)
  values(target.id,seat,left(label,80));
  insert into public.go_session_memberships(
    session_id,member_kind,seat_number,agent_id,learner_id)
  values(target.id,'participant',seat,requested_agent_id,learner);
  update public.go_sessions set version=version+1,updated_at=now() where id=target.id;
  return pulse_private.go_agent_session_snapshot(target.id,requested_agent_id);
end
$function$;

create function public.agent_get_go_hosted_session(
  requested_agent_id uuid,requested_session_id uuid
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
begin
  perform pulse_private.expire_go_session(requested_session_id);
  return pulse_private.go_agent_session_snapshot(requested_session_id,requested_agent_id);
end
$function$;

create function public.agent_get_go_hosted_timing(
  requested_agent_id uuid,requested_session_id uuid
)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare target public.go_sessions%rowtype; seconds integer;
begin
  select session.* into target from public.go_sessions session
  join public.go_session_memberships member on member.session_id=session.id
    and member.agent_id=requested_agent_id and member.member_kind='participant'
  where session.id=requested_session_id;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.status='active' then
    select question.time_limit_seconds into seconds from public.training_questions question
    where question.id=coalesce((select selected.question_id
      from public.go_session_round_questions selected
      where selected.session_id=target.id
        and selected.round_position=target.current_question_position),(
      select fallback.id from public.training_questions fallback
      where fallback.content_id=target.content_id
        and fallback.position=target.current_question_position));
  end if;
  return jsonb_build_object('question_position',target.current_question_position,
    'time_limit_seconds',seconds,'deadline_at',target.question_deadline_at,
    'server_now',statement_timestamp());
end
$function$;

create function public.agent_submit_go_hosted_answer(
  requested_agent_id uuid,requested_session_id uuid,requested_question_id uuid,
  requested_answer jsonb,expected_question_position integer
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare target public.go_sessions%rowtype; member public.go_session_memberships%rowtype;
  question public.training_questions%rowtype; existing jsonb; correct boolean;
begin
  select session.* into target from public.go_sessions session
  join public.go_session_memberships player on player.session_id=session.id
    and player.agent_id=requested_agent_id and player.member_kind='participant'
  where session.id=requested_session_id for update of session;
  if not found then raise exception 'GO player membership required' using errcode='42501'; end if;
  select * into member from public.go_session_memberships
  where session_id=target.id and agent_id=requested_agent_id and member_kind='participant';
  if member.attempt_id is null or target.status<>'active'
    or target.current_question_position<>expected_question_position
    or target.expires_at<=statement_timestamp()
    or target.question_deadline_at is null
    or statement_timestamp()>=target.question_deadline_at then
    raise exception 'GO question is no longer active' using errcode='55000';
  end if;
  if not pulse_private.agent_can_play_content(requested_agent_id,target.content_id) then
    raise exception 'Your Pulse access is currently unavailable' using errcode='42501';
  end if;
  select candidate.* into question from public.training_questions candidate
  where candidate.id=requested_question_id and candidate.content_id=target.content_id
    and candidate.id=coalesce((select selected.question_id
      from public.go_session_round_questions selected
      where selected.session_id=target.id
        and selected.round_position=target.current_question_position),(
      select fallback.id from public.training_questions fallback
      where fallback.content_id=target.content_id
        and fallback.position=target.current_question_position));
  if not found then raise exception 'GO question is unavailable' using errcode='P0002'; end if;
  select answer.submitted_answer into existing from public.training_attempt_answers answer
  where answer.attempt_id=member.attempt_id and answer.question_id=question.id;
  if found then
    if existing<>requested_answer then
      raise exception 'GO answer is already locked' using errcode='55000';
    end if;
    return pulse_private.go_agent_session_snapshot(target.id,requested_agent_id);
  end if;
  correct := pulse_private.score_training_answer(question,requested_answer);
  insert into public.training_attempt_answers(attempt_id,question_id,submitted_answer,is_correct)
  values(member.attempt_id,question.id,requested_answer,correct);
  update public.go_session_participants
  set answered_question_position=target.current_question_position,updated_at=now()
  where session_id=target.id and seat_number=member.seat_number;
  return pulse_private.go_agent_session_snapshot(target.id,requested_agent_id);
end
$function$;

-- The Staff host creates attempts for either learner domain in one engine.
create or replace function public.start_go_hosted_session(
  requested_session_id uuid,expected_version integer
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
  target public.go_sessions%rowtype; player record; next_attempt integer;
  created_attempt uuid;
begin
  select session.* into target from public.go_sessions session
  join public.go_session_memberships host on host.session_id=session.id
    and host.member_kind='host' and host.staff_user_id=actor_id
  where session.id=requested_session_id for update of session;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.status='active' then return pulse_private.go_session_snapshot(target.id,actor_id); end if;
  if target.status<>'lobby' then raise exception 'GO room cannot be started' using errcode='55000'; end if;
  if target.expires_at<=now() then
    perform pulse_private.expire_go_session(target.id);
    raise exception 'GO room cannot be started' using errcode='55000';
  end if;
  if target.version<>expected_version then raise exception 'GO room changed' using errcode='40001'; end if;
  if not exists(select 1 from public.training_content content
    where content.id=target.content_id and content.status='published') then
    raise exception 'published hosted content required' using errcode='55000';
  end if;
  if not pulse_private.go_staff_has_content_permission('go.host',target.content_id,actor_id) then
    raise exception 'eligible GO host permission required' using errcode='42501';
  end if;
  if not exists(select 1 from public.go_session_memberships member
    where member.session_id=target.id and member.member_kind='participant') then
    raise exception 'at least one player is required' using errcode='55000';
  end if;
  if exists(select 1 from public.go_session_memberships member
    where member.session_id=target.id and member.member_kind='participant'
      and ((member.staff_user_id is not null and not
        pulse_private.go_staff_has_content_permission('go.play',target.content_id,member.staff_user_id))
      or (member.agent_id is not null and not
        pulse_private.agent_can_play_content(member.agent_id,target.content_id)))) then
    raise exception 'every player must remain eligible' using errcode='42501';
  end if;
  for player in select member.* from public.go_session_memberships member
    where member.session_id=target.id and member.member_kind='participant'
    order by member.seat_number for update
  loop
    perform pg_advisory_xact_lock(hashtextextended('go-attempt:'||player.learner_id::text,0));
    select coalesce(max(attempt.attempt_number),0)+1 into next_attempt
    from public.training_attempts attempt
    where attempt.learner_id=player.learner_id and attempt.content_id=target.content_id
      and attempt.source_mode='go_hosted';
    insert into public.training_attempts(learner_id,content_id,source_mode,attempt_number,language)
    select player.learner_id,target.content_id,'go_hosted',next_attempt,content.language
    from public.training_content content where content.id=target.content_id
    returning id into created_attempt;
    update public.go_session_memberships set attempt_id=created_attempt
    where id=player.id;
  end loop;
  update public.go_session_participants set status='playing',updated_at=now()
  where session_id=target.id;
  update public.go_sessions set status='active',current_question_position=1,
    started_at=now(),version=version+1,updated_at=now() where id=target.id;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end
$function$;

revoke all on function pulse_private.validate_go_member_identity() from public,anon,authenticated,service_role;
revoke all on function pulse_private.agent_can_play_content(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.go_agent_session_snapshot(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.agent_join_go_hosted_session(uuid,text) from public,anon,authenticated;
revoke all on function public.agent_get_go_hosted_session(uuid,uuid) from public,anon,authenticated;
revoke all on function public.agent_get_go_hosted_timing(uuid,uuid) from public,anon,authenticated;
revoke all on function public.agent_submit_go_hosted_answer(uuid,uuid,uuid,jsonb,integer)
  from public,anon,authenticated;
grant execute on function public.agent_join_go_hosted_session(uuid,text) to service_role;
grant execute on function public.agent_get_go_hosted_session(uuid,uuid) to service_role;
grant execute on function public.agent_get_go_hosted_timing(uuid,uuid) to service_role;
grant execute on function public.agent_submit_go_hosted_answer(uuid,uuid,uuid,jsonb,integer) to service_role;
revoke all on function public.start_go_hosted_session(uuid,integer) from public,anon,service_role;
grant execute on function public.start_go_hosted_session(uuid,integer) to authenticated;
commit;
