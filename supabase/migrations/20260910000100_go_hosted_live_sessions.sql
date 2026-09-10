-- GO-1B. Local and isolated hosted-session contracts only.
-- No business fixtures and no remote deployment are part of this migration.
begin;

create table public.go_sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  content_id uuid not null,
  status text not null default 'lobby',
  current_question_position integer not null default 0,
  question_count integer not null,
  version integer not null default 1,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint go_sessions_content_fk foreign key (content_id)
    references public.training_content(id) on update restrict on delete restrict,
  constraint go_sessions_room_code_format check (room_code ~ '^KK [0-9]{4}$'),
  constraint go_sessions_status_valid check (status in ('lobby','active','completed','cancelled','expired')),
  constraint go_sessions_question_count_positive check (question_count > 0),
  constraint go_sessions_question_position_valid check (
    current_question_position between 0 and question_count
  ),
  constraint go_sessions_version_positive check (version > 0),
  constraint go_sessions_expiry_valid check (expires_at > created_at),
  constraint go_sessions_lifecycle_valid check (
    (status = 'lobby' and current_question_position = 0 and started_at is null
      and completed_at is null and cancelled_at is null)
    or (status = 'active' and current_question_position between 1 and question_count
      and started_at is not null and completed_at is null and cancelled_at is null)
    or (status = 'completed' and current_question_position = question_count
      and started_at is not null and completed_at is not null and cancelled_at is null)
    or (status = 'cancelled' and completed_at is null and cancelled_at is not null)
    or (status = 'expired' and completed_at is null and cancelled_at is null)
  )
);

create unique index go_sessions_joinable_room_code_unique
  on public.go_sessions(room_code)
  where status in ('lobby','active');
create index go_sessions_content_created_idx
  on public.go_sessions(content_id, created_at desc, id);

-- This is the only participant table published to Realtime. It contains a
-- room-local seat number and safe display label, never Staff/Auth/learner IDs.
create table public.go_session_participants (
  session_id uuid not null,
  seat_number integer not null,
  participant_label text not null,
  status text not null default 'joined',
  answered_question_position integer not null default 0,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, seat_number),
  constraint go_session_participants_session_fk foreign key (session_id)
    references public.go_sessions(id) on update restrict on delete restrict,
  constraint go_session_participants_seat_positive check (seat_number > 0),
  constraint go_session_participants_label_safe check (
    length(btrim(participant_label)) between 1 and 80
  ),
  constraint go_session_participants_status_valid check (
    status in ('joined','playing','completed','cancelled','expired')
  ),
  constraint go_session_participants_answer_position_nonnegative check (
    answered_question_position >= 0
  )
);

-- Identity and canonical Training links are never readable or published to
-- browser roles. They exist only to bind authenticated Staff to room-local seats.
create table public.go_session_memberships (
  session_id uuid not null,
  member_kind text not null,
  seat_number integer,
  staff_user_id uuid not null,
  learner_id uuid,
  attempt_id uuid,
  joined_at timestamptz not null default now(),
  primary key (session_id, staff_user_id),
  constraint go_session_memberships_session_fk foreign key (session_id)
    references public.go_sessions(id) on update restrict on delete restrict,
  constraint go_session_memberships_staff_fk foreign key (staff_user_id)
    references public.users(id) on update restrict on delete restrict,
  constraint go_session_memberships_learner_fk foreign key (learner_id)
    references public.training_learners(id) on update restrict on delete restrict,
  constraint go_session_memberships_attempt_fk foreign key (attempt_id)
    references public.training_attempts(id) on update restrict on delete restrict,
  constraint go_session_memberships_kind_valid check (
    (member_kind = 'host' and seat_number is null and learner_id is null and attempt_id is null)
    or (member_kind = 'participant' and seat_number is not null and learner_id is not null)
  ),
  constraint go_session_memberships_seat_fk foreign key (session_id, seat_number)
    references public.go_session_participants(session_id, seat_number)
    on update restrict on delete restrict,
  constraint go_session_memberships_attempt_unique unique (attempt_id),
  constraint go_session_memberships_staff_kind_unique unique (session_id, member_kind, staff_user_id)
);

create unique index go_session_memberships_seat_unique
  on public.go_session_memberships(session_id, seat_number)
  where seat_number is not null;
create unique index go_session_one_host
  on public.go_session_memberships(session_id)
  where member_kind = 'host';
create function pulse_private.go_staff_has_content_permission(
  requested_permission text,
  requested_content_id uuid,
  requested_staff_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select pulse_private.training_content_is_eligible(
    requested_content_id, requested_staff_user_id
  ) and exists (
    select 1
    from public.training_content_audiences audience
    join public.users staff
      on staff.id = requested_staff_user_id and staff.status = 'active'
    join public.user_roles assignment on assignment.user_id = staff.id
    join public.roles role on role.id = assignment.role_id and role.is_active
    join public.role_permissions role_permission on role_permission.role_id = role.id
    join public.permissions permission
      on permission.id = role_permission.permission_id
      and permission.is_active and permission.key = requested_permission
    left join public.teams audience_team
      on audience_team.id = audience.team_id and audience_team.is_active
    where audience.content_id = requested_content_id
      and (
        (assignment.scope_type = 'global')
        or (
          audience.scope_type = 'global'
          and (
            (assignment.scope_type = 'department' and exists (
              select 1 from public.departments department
              where department.id = assignment.department_id and department.is_active
            ))
            or (assignment.scope_type = 'campaign' and exists (
              select 1 from public.campaigns campaign
              where campaign.id = assignment.campaign_id and campaign.is_active
            ))
            or (assignment.scope_type = 'team' and exists (
              select 1 from public.teams team
              where team.id = assignment.team_id and team.is_active
            ))
          )
        )
        or (
          audience.scope_type = 'campaign'
          and (
            (assignment.scope_type = 'campaign' and assignment.campaign_id = audience.campaign_id)
            or (assignment.scope_type in ('department','team') and exists (
              select 1
              from public.teams eligible_team
              where eligible_team.is_active
                and eligible_team.campaign_id = audience.campaign_id
                and (
                  eligible_team.id = staff.team_id
                  or exists (
                    select 1 from public.user_operational_assignments operational
                    where operational.user_id = staff.id
                      and operational.team_id = eligible_team.id
                      and operational.ended_at is null
                  )
                )
                and (
                  (assignment.scope_type = 'team' and assignment.team_id = eligible_team.id)
                  or (assignment.scope_type = 'department'
                    and assignment.department_id = eligible_team.department_id)
                )
            ))
          )
        )
        or (
          audience.scope_type = 'team'
          and audience_team.id is not null
          and (
            (assignment.scope_type = 'team' and assignment.team_id = audience_team.id)
            or (assignment.scope_type = 'campaign'
              and assignment.campaign_id = audience_team.campaign_id)
            or (assignment.scope_type = 'department'
              and assignment.department_id = audience_team.department_id)
          )
        )
      )
  )
$function$;

create function pulse_private.can_view_go_session(requested_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.go_session_memberships membership
    join public.users staff on staff.id = membership.staff_user_id
    where membership.session_id = requested_session_id
      and staff.auth_user_id = auth.uid()
      and staff.status = 'active'
  )
$function$;

create function pulse_private.normalize_go_room_code(requested_room_code text)
returns text
language sql
immutable
set search_path = pg_catalog
as $function$
  select case
    when upper(regexp_replace(coalesce(requested_room_code,''),'[^A-Za-z0-9]','','g'))
      ~ '^KK[0-9]{4}$'
    then 'KK ' || right(
      upper(regexp_replace(coalesce(requested_room_code,''),'[^A-Za-z0-9]','','g')), 4
    )
    else null
  end
$function$;

create function pulse_private.score_training_answer(
  requested_question public.training_questions,
  requested_answer jsonb
)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $function$
begin
  if requested_question.question_type = 'multiple_choice' then
    if jsonb_typeof(requested_answer) <> 'number'
      or (requested_answer #>> '{}') !~ '^[0-9]+$'
      or (requested_answer #>> '{}')::integer < 0
      or (requested_answer #>> '{}')::integer >= jsonb_array_length(requested_question.answer_options) then
      raise exception 'invalid multiple-choice answer' using errcode='22023';
    end if;
    return (requested_answer #>> '{}')::integer =
      (requested_question.correct_answer #>> '{}')::integer;
  elsif requested_question.question_type = 'true_false' then
    if jsonb_typeof(requested_answer) <> 'boolean' then
      raise exception 'invalid true/false answer' using errcode='22023';
    end if;
    return requested_answer = requested_question.correct_answer;
  elsif requested_question.question_type = 'text' then
    if jsonb_typeof(requested_answer) <> 'string'
      or length(btrim(requested_answer #>> '{}')) not between 1 and 1000 then
      raise exception 'invalid text answer' using errcode='22023';
    end if;
    return exists (
      select 1
      from jsonb_array_elements_text(requested_question.correct_answer) accepted(answer)
      where lower(btrim(accepted.answer)) = lower(btrim(requested_answer #>> '{}'))
    );
  end if;
  raise exception 'unsupported certified question type' using errcode='22023';
end
$function$;

create function pulse_private.expire_go_session(requested_session_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  target public.go_sessions%rowtype;
begin
  select * into target from public.go_sessions
  where id = requested_session_id for update;
  if not found or target.status not in ('lobby','active') or target.expires_at > now() then
    return;
  end if;
  update public.training_attempts attempt
  set status='abandoned', completed_at=now(),
      duration_seconds=greatest(0,extract(epoch from now()-attempt.started_at)::integer)
  from public.go_session_memberships membership
  where membership.session_id=target.id and membership.attempt_id=attempt.id
    and attempt.status='started';
  update public.go_session_participants
  set status='expired',updated_at=now() where session_id=target.id;
  update public.go_sessions
  set status='expired',version=version+1,updated_at=now() where id=target.id;
end
$function$;

create function pulse_private.go_session_snapshot(
  requested_session_id uuid,
  requested_staff_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  target public.go_sessions%rowtype;
  membership public.go_session_memberships%rowtype;
  response jsonb;
begin
  select * into membership
  from public.go_session_memberships candidate
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
        'seat',participant.seat_number,
        'name',participant.participant_label,
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
        'id',question.id,
        'position',question.position,
        'question_type',question.question_type,
        'prompt',question.prompt,
        'answer_options',question.answer_options
      )
      from public.training_questions question
      where question.content_id=target.content_id
        and question.position=target.current_question_position
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
      )
      from public.training_results result
      where result.attempt_id=membership.attempt_id
    ) else null end,
    'host_summary',case when membership.member_kind='host' and target.status='completed' then (
      select jsonb_build_object(
        'players',count(*),
        'average_score',coalesce(round(avg(result.score_percent),2),0),
        'completed_results',count(result.id)
      )
      from public.go_session_memberships player
      left join public.training_results result on result.attempt_id=player.attempt_id
      where player.session_id=target.id and player.member_kind='participant'
    ) else null end
  ) into response
  from public.training_content content where content.id=target.content_id;
  return response;
end
$function$;

create function pulse_private.finalize_go_session(requested_session_id uuid)
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
    select membership.attempt_id
    from public.go_session_memberships membership
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
      player.attempt_id,question_total,correct_total,
      round((correct_total::numeric*100)/question_total,2),true
    ) on conflict (attempt_id) do nothing
    returning * into created_result;
    if created_result.id is not null then
      insert into public.training_result_topics(
        result_id,topic_id,total_questions,correct_answers
      )
      select created_result.id,question_topic.topic_id,count(*)::integer,
        count(answer.question_id) filter(where answer.is_correct)::integer
      from public.training_questions question
      join public.training_question_topics question_topic
        on question_topic.question_id=question.id
      left join public.training_attempt_answers answer
        on answer.question_id=question.id and answer.attempt_id=player.attempt_id
      where question.content_id=target.content_id
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

create function public.list_go_host_catalog(
  requested_language text default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (
  id uuid,
  content_type text,
  title text,
  description text,
  language text,
  question_count integer,
  topics jsonb,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_any_training_permission(array['go.host']);
begin
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid GO Host language' using errcode='22023';
  end if;
  if requested_limit not between 1 and 100 or requested_offset < 0 then
    raise exception 'invalid GO Host pagination' using errcode='22023';
  end if;
  return query
  select content.id,content.content_type,content.title,content.description,
    content.language,(select count(*)::integer from public.training_questions question
      where question.content_id=content.id),
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',topic.id,'code',topic.code,'name',topic.name
    ) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id=content_topic.topic_id and topic.is_active
      where content_topic.content_id=content.id),'[]'::jsonb),content.published_at
  from public.training_content content
  where content.status='published' and content.content_type in ('quiz','assessment')
    and (requested_language is null or content.language=requested_language)
    and exists(select 1 from public.training_questions question where question.content_id=content.id)
    and pulse_private.go_staff_has_content_permission('go.host',content.id,actor_id)
  order by content.title,content.id limit requested_limit offset requested_offset;
end
$function$;

create function public.create_go_hosted_session(requested_content_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  existing public.go_sessions%rowtype;
  created public.go_sessions%rowtype;
  generated_code text;
  total integer;
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
  for counter in 1..40 loop
    generated_code := 'KK ' || lpad((1000 + floor(random()*9000))::integer::text,4,'0');
    begin
      insert into public.go_sessions(room_code,content_id,question_count)
      values(generated_code,requested_content_id,total) returning * into created;
      exit;
    exception when unique_violation then
      if counter=40 then raise exception 'GO room code capacity unavailable' using errcode='55000'; end if;
    end;
  end loop;
  insert into public.go_session_memberships(session_id,member_kind,staff_user_id)
  values(created.id,'host',actor_id);
  return pulse_private.go_session_snapshot(created.id,actor_id);
end
$function$;

create function public.join_go_hosted_session(requested_room_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  normalized_code text := pulse_private.normalize_go_room_code(requested_room_code);
  target public.go_sessions%rowtype;
  learner uuid;
  seat integer;
  label text;
begin
  if normalized_code is null then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  select * into target from public.go_sessions
  where room_code=normalized_code and status='lobby' for update;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.expires_at <= now() then
    perform pulse_private.expire_go_session(target.id);
    raise exception 'GO room unavailable' using errcode='P0002';
  end if;
  if exists(select 1 from public.go_session_memberships membership
    where membership.session_id=target.id and membership.staff_user_id=actor_id
      and membership.member_kind='host') then
    raise exception 'host cannot join as a player' using errcode='42501';
  end if;
  if not pulse_private.go_staff_has_content_permission('go.play',target.content_id,actor_id) then
    raise exception 'eligible GO player permission required' using errcode='42501';
  end if;
  if exists(select 1 from public.go_session_memberships membership
    where membership.session_id=target.id and membership.staff_user_id=actor_id) then
    return pulse_private.go_session_snapshot(target.id,actor_id);
  end if;
  select link.learner_id into learner from public.training_staff_learner_links link
  where link.staff_user_id=actor_id;
  if learner is null then
    insert into public.training_learners(learner_kind) values('staff') returning id into learner;
    insert into public.training_staff_learner_links(learner_id,staff_user_id)
    values(learner,actor_id);
  end if;
  select coalesce(max(participant.seat_number),0)+1 into seat
  from public.go_session_participants participant where participant.session_id=target.id;
  select left(coalesce(nullif(btrim(staff.display_name),''),nullif(btrim(staff.full_name),''),'Player'),80)
    into label from public.users staff where staff.id=actor_id;
  insert into public.go_session_participants(session_id,seat_number,participant_label)
  values(target.id,seat,label);
  insert into public.go_session_memberships(
    session_id,member_kind,seat_number,staff_user_id,learner_id
  ) values(target.id,'participant',seat,actor_id,learner);
  update public.go_sessions set version=version+1,updated_at=now() where id=target.id;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end
$function$;

create function public.get_go_hosted_session(requested_session_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.current_training_staff_user_id();
begin
  perform pulse_private.expire_go_session(requested_session_id);
  return pulse_private.go_session_snapshot(requested_session_id,actor_id);
end
$function$;

create function public.start_go_hosted_session(
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
  player record;
  next_attempt integer;
  created_attempt uuid;
begin
  select session.* into target
  from public.go_sessions session
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
  if not exists(select 1 from public.go_session_memberships membership
    where membership.session_id=target.id and membership.member_kind='participant') then
    raise exception 'at least one player is required' using errcode='55000';
  end if;
  if exists(
    select 1 from public.go_session_memberships membership
    where membership.session_id=target.id and membership.member_kind='participant'
      and not pulse_private.go_staff_has_content_permission(
        'go.play',target.content_id,membership.staff_user_id
      )
  ) then raise exception 'every player must remain eligible' using errcode='42501'; end if;

  for player in
    select membership.* from public.go_session_memberships membership
    where membership.session_id=target.id and membership.member_kind='participant'
    order by membership.seat_number for update
  loop
    perform pg_advisory_xact_lock(hashtextextended('go-attempt:'||player.learner_id::text,0));
    select coalesce(max(attempt.attempt_number),0)+1 into next_attempt
    from public.training_attempts attempt
    where attempt.learner_id=player.learner_id and attempt.content_id=target.content_id
      and attempt.source_mode='go_hosted';
    insert into public.training_attempts(
      learner_id,content_id,source_mode,attempt_number,language
    ) select player.learner_id,target.content_id,'go_hosted',next_attempt,content.language
      from public.training_content content where content.id=target.content_id
      returning id into created_attempt;
    update public.go_session_memberships
    set attempt_id=created_attempt
    where session_id=target.id and staff_user_id=player.staff_user_id;
  end loop;
  update public.go_session_participants
  set status='playing',updated_at=now() where session_id=target.id;
  update public.go_sessions set status='active',current_question_position=1,
    started_at=now(),version=version+1,updated_at=now() where id=target.id;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end
$function$;

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
    and candidate.position=target.current_question_position;
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
begin
  select session.* into target
  from public.go_sessions session
  join public.go_session_memberships host on host.session_id=session.id
    and host.member_kind='host' and host.staff_user_id=actor_id
  where session.id=requested_session_id for update of session;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.status='completed' then return pulse_private.go_session_snapshot(target.id,actor_id); end if;
  if target.status<>'active' then raise exception 'GO room is not active' using errcode='55000'; end if;
  if target.version<>expected_version then raise exception 'GO room changed' using errcode='40001'; end if;
  if target.current_question_position=target.question_count then
    perform pulse_private.finalize_go_session(target.id);
  else
    update public.go_sessions set current_question_position=current_question_position+1,
      version=version+1,updated_at=now() where id=target.id;
  end if;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end
$function$;

create function public.cancel_go_hosted_session(
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
begin
  select session.* into target
  from public.go_sessions session
  join public.go_session_memberships host on host.session_id=session.id
    and host.member_kind='host' and host.staff_user_id=actor_id
  where session.id=requested_session_id for update of session;
  if not found then raise exception 'GO room unavailable' using errcode='P0002'; end if;
  if target.status='cancelled' then return pulse_private.go_session_snapshot(target.id,actor_id); end if;
  if target.status not in ('lobby','active') then
    raise exception 'GO room cannot be cancelled' using errcode='55000';
  end if;
  if target.version<>expected_version then raise exception 'GO room changed' using errcode='40001'; end if;
  update public.training_attempts attempt
  set status='abandoned',completed_at=now(),
    duration_seconds=greatest(0,extract(epoch from now()-attempt.started_at)::integer)
  from public.go_session_memberships membership
  where membership.session_id=target.id and membership.attempt_id=attempt.id
    and attempt.status='started';
  update public.go_session_participants set status='cancelled',updated_at=now()
  where session_id=target.id;
  update public.go_sessions set status='cancelled',cancelled_at=now(),
    version=version+1,updated_at=now() where id=target.id;
  return pulse_private.go_session_snapshot(target.id,actor_id);
end
$function$;

alter table public.go_sessions enable row level security;
alter table public.go_session_participants enable row level security;
alter table public.go_session_memberships enable row level security;

create policy go_sessions_member_select on public.go_sessions for select to authenticated
  using (pulse_private.can_view_go_session(id));
create policy go_session_participants_member_select on public.go_session_participants
  for select to authenticated using (pulse_private.can_view_go_session(session_id));

revoke all on table public.go_sessions from public,anon,authenticated;
revoke all on table public.go_session_participants from public,anon,authenticated;
revoke all on table public.go_session_memberships from public,anon,authenticated;
grant select on table public.go_sessions to authenticated;
grant select on table public.go_session_participants to authenticated;
grant all on table public.go_sessions to service_role;
grant all on table public.go_session_participants to service_role;
grant all on table public.go_session_memberships to service_role;

alter publication supabase_realtime add table public.go_sessions, public.go_session_participants;

alter function pulse_private.go_staff_has_content_permission(text,uuid,uuid) owner to postgres;
alter function pulse_private.can_view_go_session(uuid) owner to postgres;
alter function pulse_private.normalize_go_room_code(text) owner to postgres;
alter function pulse_private.score_training_answer(public.training_questions,jsonb) owner to postgres;
alter function pulse_private.expire_go_session(uuid) owner to postgres;
alter function pulse_private.go_session_snapshot(uuid,uuid) owner to postgres;
alter function pulse_private.finalize_go_session(uuid) owner to postgres;
alter function public.list_go_host_catalog(text,integer,integer) owner to postgres;
alter function public.create_go_hosted_session(uuid) owner to postgres;
alter function public.join_go_hosted_session(text) owner to postgres;
alter function public.get_go_hosted_session(uuid) owner to postgres;
alter function public.start_go_hosted_session(uuid,integer) owner to postgres;
alter function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) owner to postgres;
alter function public.advance_go_hosted_session(uuid,integer) owner to postgres;
alter function public.cancel_go_hosted_session(uuid,integer) owner to postgres;

revoke all on function pulse_private.go_staff_has_content_permission(text,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.can_view_go_session(uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.normalize_go_room_code(text) from public,anon,authenticated,service_role;
revoke all on function pulse_private.score_training_answer(public.training_questions,jsonb) from public,anon,authenticated,service_role;
revoke all on function pulse_private.expire_go_session(uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.go_session_snapshot(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function pulse_private.finalize_go_session(uuid) from public,anon,authenticated,service_role;
revoke all on function public.list_go_host_catalog(text,integer,integer) from public,anon,service_role;
revoke all on function public.create_go_hosted_session(uuid) from public,anon,service_role;
revoke all on function public.join_go_hosted_session(text) from public,anon,service_role;
revoke all on function public.get_go_hosted_session(uuid) from public,anon,service_role;
revoke all on function public.start_go_hosted_session(uuid,integer) from public,anon,service_role;
revoke all on function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) from public,anon,service_role;
revoke all on function public.advance_go_hosted_session(uuid,integer) from public,anon,service_role;
revoke all on function public.cancel_go_hosted_session(uuid,integer) from public,anon,service_role;

grant execute on function public.list_go_host_catalog(text,integer,integer) to authenticated;
grant execute on function public.create_go_hosted_session(uuid) to authenticated;
grant execute on function public.join_go_hosted_session(text) to authenticated;
grant execute on function public.get_go_hosted_session(uuid) to authenticated;
grant execute on function public.start_go_hosted_session(uuid,integer) to authenticated;
grant execute on function public.submit_go_hosted_answer(uuid,uuid,jsonb,integer) to authenticated;
grant execute on function public.advance_go_hosted_session(uuid,integer) to authenticated;
grant execute on function public.cancel_go_hosted_session(uuid,integer) to authenticated;
-- Required only so authenticated RLS policies can evaluate membership. The
-- pulse_private schema is not exposed by PostgREST and the helper returns one
-- boolean without disclosing membership rows.
grant execute on function pulse_private.can_view_go_session(uuid) to authenticated;

comment on table public.go_sessions is
  'Safe Realtime room lifecycle state for authenticated Pulse GO hosted sessions.';
comment on table public.go_session_participants is
  'Privacy-safe room-local participant presence published to Realtime.';
comment on table public.go_session_memberships is
  'Protected Staff/learner/attempt binding for GO hosted sessions; never browser-readable.';

commit;
