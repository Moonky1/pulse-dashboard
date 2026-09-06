-- GO-1A. Local and isolated product contracts only. Canonical LF bytes are the
-- certification hash input. No business fixtures or hosted-room objects.
begin;

-- The deferred Staff-learner integrity trigger runs at transaction commit,
-- after the public SECURITY DEFINER RPC has returned. Keep its protected-table
-- read under the already-postgres-owned, fixed-search-path trigger identity.
alter function pulse_private.require_staff_learner_link() security definer;

create unique index training_attempts_one_active_per_mode
  on public.training_attempts(learner_id, content_id, source_mode)
  where status = 'started' and source_mode = 'go_practice';

create function public.get_go_capabilities()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.current_training_staff_user_id();
  return jsonb_build_object(
    'can_practice', pulse_private.has_any_training_permission(array['go.play']),
    'can_host', pulse_private.has_any_training_permission(array['go.host'])
  );
end
$function$;

create function public.list_go_practice_catalog(
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (
  id uuid,
  content_type text,
  title text,
  description text,
  language text,
  topics jsonb,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_any_training_permission(array['go.play']);
begin
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid GO Practice language' using errcode = '22023';
  end if;
  if requested_limit not between 1 and 100 or requested_offset < 0 then
    raise exception 'invalid GO Practice pagination' using errcode = '22023';
  end if;

  return query
  select
    content.id,
    content.content_type,
    content.title,
    content.description,
    content.language,
    coalesce((
      select jsonb_agg(
        jsonb_build_object('id', topic.id, 'code', topic.code, 'name', topic.name)
        order by topic.name, topic.id
      )
      from public.training_content_topics content_topic
      join public.training_topics topic
        on topic.id = content_topic.topic_id and topic.is_active
      where content_topic.content_id = content.id
    ), '[]'::jsonb),
    content.published_at
  from public.training_content content
  where content.status = 'published'
    and content.content_type in ('quiz','assessment')
    and (requested_language is null or content.language = requested_language)
    and (requested_topic_id is null or exists (
      select 1
      from public.training_content_topics topic_filter
      where topic_filter.content_id = content.id
        and topic_filter.topic_id = requested_topic_id
    ))
    and pulse_private.has_training_learner_content_permission(
      'go.play', content.id, actor_id
    )
  order by content.title, content.id
  limit requested_limit offset requested_offset;
end
$function$;

create or replace function public.start_training_attempt(
  requested_content_id uuid,
  requested_source_mode text
)
returns table (
  attempt_id uuid,
  content_id uuid,
  source_mode text,
  attempt_number integer,
  language text,
  started_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  resolved_learner_id uuid;
  content public.training_content%rowtype;
  next_attempt integer;
  active_attempt public.training_attempts%rowtype;
  created public.training_attempts%rowtype;
  required_permission text;
begin
  if requested_source_mode = 'go_practice' then
    required_permission := 'go.play';
  elsif requested_source_mode = 'academy' then
    required_permission := 'academy.view';
  else
    raise exception 'unsupported Training attempt mode' using errcode='22023';
  end if;
  if not pulse_private.has_training_learner_content_permission(
    required_permission, requested_content_id, actor_id
  ) then
    raise exception 'eligible Training learner permission required' using errcode='42501';
  end if;
  select * into content
  from public.training_content candidate
  where candidate.id = requested_content_id
    and candidate.status = 'published'
    and candidate.content_type in ('quiz','assessment');
  if not found then
    raise exception 'published scored content not found' using errcode='P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_id::text,0));
  select link.learner_id into resolved_learner_id
  from public.training_staff_learner_links link
  where link.staff_user_id = actor_id;
  if resolved_learner_id is null then
    insert into public.training_learners(learner_kind)
    values('staff') returning id into resolved_learner_id;
    insert into public.training_staff_learner_links(learner_id,staff_user_id)
    values(resolved_learner_id,actor_id);
  end if;

  if requested_source_mode = 'go_practice' then
    select attempt.* into active_attempt
    from public.training_attempts attempt
    where attempt.learner_id = resolved_learner_id
      and attempt.content_id = requested_content_id
      and attempt.source_mode = requested_source_mode
      and attempt.status = 'started'
    for update;
    if found then
      return query select active_attempt.id, active_attempt.content_id,
        active_attempt.source_mode, active_attempt.attempt_number,
        active_attempt.language, active_attempt.started_at;
      return;
    end if;
  end if;

  select coalesce(max(attempt.attempt_number),0) + 1 into next_attempt
  from public.training_attempts attempt
  where attempt.learner_id = resolved_learner_id
    and attempt.content_id = requested_content_id
    and attempt.source_mode = requested_source_mode;
  insert into public.training_attempts(
    learner_id, content_id, source_mode, attempt_number, language
  ) values (
    resolved_learner_id, requested_content_id, requested_source_mode,
    next_attempt, content.language
  ) returning * into created;
  return query select created.id, created.content_id, created.source_mode,
    created.attempt_number, created.language, created.started_at;
end
$function$;

alter function public.get_go_capabilities() owner to postgres;
alter function public.list_go_practice_catalog(text,uuid,integer,integer) owner to postgres;
alter function public.start_training_attempt(uuid,text) owner to postgres;

revoke all on function public.get_go_capabilities() from public,anon,service_role;
revoke all on function public.list_go_practice_catalog(text,uuid,integer,integer) from public,anon,service_role;
revoke all on function public.start_training_attempt(uuid,text) from public,anon,service_role;

grant execute on function public.get_go_capabilities() to authenticated;
grant execute on function public.list_go_practice_catalog(text,uuid,integer,integer) to authenticated;
grant execute on function public.start_training_attempt(uuid,text) to authenticated;

comment on function public.get_go_capabilities() is
  'Returns Staff GO product capabilities from active server-side permissions.';
comment on function public.list_go_practice_catalog(text,uuid,integer,integer) is
  'Lists only published scored content the current Staff learner may practice.';
comment on function public.start_training_attempt(uuid,text) is
  'Starts or safely resumes the current Staff learner scored attempt.';
comment on function pulse_private.require_staff_learner_link() is
  'Deferred trigger-only Staff learner integrity check; postgres-owned and not executable by browser roles.';

commit;
