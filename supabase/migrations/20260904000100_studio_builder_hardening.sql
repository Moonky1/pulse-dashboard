-- STUDIO-1B.2. Canonical LF bytes are the certification hash input.
-- Forward-only hardening. No business seeds or new role grants.
begin;

create function pulse_private.can_read_training_authoring(requested_content_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog
as $function$
  select coalesce((
    select pulse_private.has_training_content_permission('studio.publish',c.id)
      or (pulse_private.has_training_content_permission('studio.create',c.id)
        and (c.created_by_user_id = pulse_private.current_training_staff_user_id()
          or pulse_private.has_training_content_permission('academy.manage',c.id)))
    from public.training_content c where c.id=requested_content_id
  ),false)
$function$;
alter function pulse_private.can_read_training_authoring(uuid) owner to postgres;
revoke all on function pulse_private.can_read_training_authoring(uuid) from public,anon,authenticated,service_role;

create function public.get_studio_capabilities(requested_content_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog
as $function$
declare
  actor uuid := pulse_private.current_training_staff_user_id();
  item public.training_content%rowtype;
  readable boolean := false;
  editable boolean := false;
  publisher boolean := false;
begin
  if requested_content_id is not null then
    select * into item from public.training_content c where c.id=requested_content_id;
    readable := pulse_private.can_read_training_authoring(requested_content_id);
    if not readable then raise exception 'Studio content unavailable' using errcode='P0002'; end if;
    editable := item.status='draft'
      and pulse_private.has_training_content_permission('studio.create',item.id)
      and (item.created_by_user_id=actor or pulse_private.has_training_content_permission('academy.manage',item.id));
    publisher := pulse_private.has_training_content_permission('studio.publish',item.id);
  end if;
  return jsonb_build_object(
    'can_view_studio',pulse_private.has_any_training_permission(array['studio.view']),
    'can_create',pulse_private.has_any_training_permission(array['studio.create']),
    'can_create_global',pulse_private.has_training_target_permission('studio.create','global',null,null),
    'can_read_authoring',readable,
    'can_edit',editable,
    'can_publish',publisher and item.status='draft',
    'can_archive',publisher and item.status='published'
  );
end
$function$;
alter function public.get_studio_capabilities(uuid) owner to postgres;
revoke all on function public.get_studio_capabilities(uuid) from public,anon,service_role;
grant execute on function public.get_studio_capabilities(uuid) to authenticated;

-- Validate structure before any destructive question replacement. Also used by
-- the table trigger so privileged fixture writes cannot bypass answer integrity.
create function pulse_private.validate_training_answer(kind text, options jsonb, answer jsonb)
returns void language plpgsql immutable set search_path = pg_catalog
as $function$
begin
  if kind is null or kind not in ('multiple_choice','true_false','text')
    or jsonb_typeof(options) is distinct from 'array' or answer is null then
    raise exception 'invalid question structure' using errcode='22023';
  end if;
  if kind='multiple_choice' then
    if jsonb_array_length(options) not between 2 and 8
      or exists(select 1 from jsonb_array_elements(options) o
        where jsonb_typeof(o) <> 'string' or (o #>> '{}') !~ '[^[:space:]]' or length(btrim(o #>> '{}')) not between 1 and 1000)
      or jsonb_typeof(answer) is distinct from 'number' then
      raise exception 'invalid multiple-choice options' using errcode='22023';
    end if;
    if (answer #>> '{}') !~ '^[0-7]$' then
      raise exception 'invalid multiple-choice answer' using errcode='22023';
    end if;
    if (answer #>> '{}')::integer >= jsonb_array_length(options) then
      raise exception 'invalid multiple-choice answer' using errcode='22023';
    end if;
  elsif kind='true_false' then
    if jsonb_array_length(options) <> 0 or jsonb_typeof(answer) is distinct from 'boolean' then
      raise exception 'invalid true/false answer' using errcode='22023';
    end if;
  else
    if jsonb_array_length(options) <> 0 or jsonb_typeof(answer) is distinct from 'array' then
      raise exception 'invalid text answers' using errcode='22023';
    end if;
    if jsonb_array_length(answer) < 1 or exists(
      select 1 from jsonb_array_elements(answer) a
      where jsonb_typeof(a) <> 'string' or (a #>> '{}') !~ '[^[:space:]]' or length(btrim(a #>> '{}')) not between 1 and 1000
    ) then raise exception 'invalid text answers' using errcode='22023'; end if;
  end if;
end
$function$;
alter function pulse_private.validate_training_answer(text,jsonb,jsonb) owner to postgres;
revoke all on function pulse_private.validate_training_answer(text,jsonb,jsonb) from public,anon,authenticated,service_role;

create or replace function pulse_private.validate_training_question()
returns trigger language plpgsql set search_path = pg_catalog
as $function$
begin
  if not exists(select 1 from public.training_content c where c.id=new.content_id and c.status='draft') then
    raise exception 'questions may be changed only while content is draft';
  end if;
  perform pulse_private.validate_training_answer(new.question_type,new.answer_options,new.correct_answer);
  new.updated_at := clock_timestamp();
  return new;
end
$function$;
create or replace function pulse_private.enforce_training_content_lifecycle()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'new training content and modules must begin as draft';
  elsif tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.created_by_user_id is distinct from old.created_by_user_id
       or new.created_at is distinct from old.created_at then
      raise exception 'immutable training content identity fields cannot be changed';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('published', 'archived'))
      or (old.status = 'published' and new.status = 'archived')
    ) then
      raise exception 'invalid training content lifecycle transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'published' and old.status <> 'published' then
      if tg_table_name = 'training_content' then
        if not exists (
          select 1
          from public.training_content_topics content_topic
          join public.training_topics topic on topic.id = content_topic.topic_id and topic.is_active
          where content_topic.content_id = new.id
        ) then
          raise exception 'published training content requires an active Topic';
        end if;

        if not exists (
          select 1 from public.training_content_audiences audience
          left join public.campaigns campaign on campaign.id = audience.campaign_id
          left join public.teams team on team.id = audience.team_id
          where audience.content_id = new.id
            and (
              audience.scope_type = 'global'
              or (audience.scope_type = 'campaign' and campaign.is_active)
              or (audience.scope_type = 'team' and team.is_active)
            )
        ) then
          raise exception 'published training content requires a valid active audience';
        end if;

        if exists (
          select 1
          from public.training_content_position_targets target
          join public.positions position on position.id = target.position_id
          where target.content_id = new.id and not position.is_active
        ) then
          raise exception 'published training content cannot target an inactive Position';
        end if;

        if new.content_type in ('quiz', 'assessment') and not exists (
          select 1 from public.training_questions question where question.content_id = new.id
        ) then
          raise exception 'published quiz or assessment content requires questions';
        end if;
      elsif tg_table_name = 'training_modules' then
        if not exists (
          select 1 from public.training_module_items item where item.module_id = new.id
        ) or exists (
          select 1
          from public.training_module_items item
          join public.training_content content on content.id = item.content_id
          where item.module_id = new.id
            and (content.status <> 'published' or content.language <> new.language)
        ) then
          raise exception 'published modules require published same-language content';
        end if;
      end if;
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if new.status = 'archived' and new.archived_at is null then new.archived_at := now(); end if;
  new.updated_at := case when tg_op='UPDATE' then greatest(clock_timestamp(),old.updated_at + interval '1 microsecond') else clock_timestamp() end;
  return new;
end
$function$;

create or replace function public.update_training_content_draft(
  requested_content_id uuid,
  requested_title text,
  requested_description text,
  requested_language text,
  requested_topic_ids uuid[],
  requested_scope_type text,
  requested_campaign_id uuid,
  requested_team_id uuid,
  requested_position_ids uuid[],
  expected_updated_at timestamptz
)
returns table (id uuid, status text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  changed public.training_content%rowtype;
begin
  select * into existing from public.training_content where training_content.id = requested_content_id for update;
  if not found then raise exception 'training content not found' using errcode = 'P0002'; end if;
  actor_id := pulse_private.require_training_target_permission(
    'studio.create',requested_scope_type,requested_campaign_id,requested_team_id
  );
  perform pulse_private.require_training_content_permission('studio.create',requested_content_id);
  if existing.created_by_user_id <> actor_id and not pulse_private.has_training_target_permission(
    'academy.manage',requested_scope_type,requested_campaign_id,requested_team_id
  ) then raise exception 'destination manager authority required' using errcode='42501'; end if;
  if existing.status <> 'draft' then raise exception 'only draft content may be edited' using errcode = '55000'; end if;
  if existing.created_by_user_id <> actor_id
     and not pulse_private.has_training_content_permission('academy.manage',requested_content_id) then
    raise exception 'draft owner or Academy manager required' using errcode = '42501';
  end if;
  if expected_updated_at is null or existing.updated_at <> expected_updated_at then
    raise exception 'training draft changed; refresh before saving' using errcode = 'PT409';
  end if;
  if requested_language not in ('en','es')
     or length(btrim(coalesce(requested_title,''))) not between 2 and 180
     or length(btrim(coalesce(requested_description,''))) > 2000 then
    raise exception 'invalid Training draft fields' using errcode = '22023';
  end if;
  if coalesce(array_length(requested_topic_ids,1),0) < 1
     or exists (
       select 1 from unnest(requested_topic_ids) topic_id
       where not exists (select 1 from public.training_topics topic where topic.id=topic_id and topic.is_active)
     ) then raise exception 'active authoritative Topics are required' using errcode = '22023'; end if;
  if requested_scope_type='campaign' and not exists(select 1 from public.campaigns c where c.id=requested_campaign_id and c.is_active)
    then raise exception 'active Campaign target required' using errcode='22023'; end if;
  if requested_scope_type='team' and not exists(select 1 from public.teams t where t.id=requested_team_id and t.is_active and t.campaign_id is not null)
    then raise exception 'active Campaign-linked Team target required' using errcode='22023'; end if;
  if exists (
    select 1 from unnest(coalesce(requested_position_ids,'{}'::uuid[])) position_id
    where not exists(select 1 from public.positions p where p.id=position_id and p.is_active)
  ) then raise exception 'active authoritative Position targets required' using errcode='22023'; end if;

  delete from public.training_content_position_targets where content_id=requested_content_id;
  delete from public.training_content_topics where content_id=requested_content_id;
  delete from public.training_content_audiences where content_id=requested_content_id;
  insert into public.training_content_topics(content_id,topic_id)
    select requested_content_id,topic_id from (select distinct unnest(requested_topic_ids) topic_id) topics;
  insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id)
    values(requested_content_id,requested_scope_type,requested_campaign_id,requested_team_id);
  insert into public.training_content_position_targets(content_id,position_id)
    select requested_content_id,position_id
    from (select distinct unnest(coalesce(requested_position_ids,'{}'::uuid[])) position_id) positions;
  update public.training_content
  set title=btrim(requested_title),description=nullif(btrim(coalesce(requested_description,'')),''),language=requested_language
  where training_content.id=requested_content_id returning * into changed;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',changed.id,'training.content_updated','database',jsonb_build_object('scope_type',requested_scope_type));
  return query select changed.id,changed.status,changed.updated_at;
end
$function$;

create or replace function public.replace_training_questions(
  requested_content_id uuid,
  requested_questions jsonb,
  expected_updated_at timestamptz
)
returns table (content_id uuid, question_count integer, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  question jsonb;
  created_question_id uuid;
  question_topic_ids uuid[];
  count_questions integer;
  changed_at timestamptz;
begin
  select content.* into existing
  from public.training_content content
  where content.id=requested_content_id
  for update;
  if not found then raise exception 'training content not found' using errcode='P0002'; end if;
  actor_id := pulse_private.require_training_content_permission('studio.create',requested_content_id);
  if existing.status <> 'draft' then raise exception 'questions may be replaced only for draft content' using errcode='55000'; end if;
  if existing.created_by_user_id <> actor_id
     and not pulse_private.has_training_content_permission('academy.manage',requested_content_id) then
    raise exception 'draft owner or Academy manager required' using errcode='42501';
  end if;
  if expected_updated_at is null or existing.updated_at <> expected_updated_at then
    raise exception 'training draft changed; refresh before saving' using errcode='PT409';
  end if;
  if jsonb_typeof(requested_questions) is distinct from 'array'
     or jsonb_array_length(requested_questions) not between 1 and 100 then
    raise exception 'questions must be a bounded array' using errcode='22023';
  end if;

  delete from public.training_question_topics question_topic
    where question_topic.question_id in (
      select question.id from public.training_questions question
      where question.content_id=requested_content_id
    );
  delete from public.training_questions question
  where question.content_id=requested_content_id;

  for question in select value from jsonb_array_elements(requested_questions)
  loop
    perform pulse_private.validate_training_answer(question->>'question_type',question->'answer_options',question->'correct_answer');
    if jsonb_typeof(question) is distinct from 'object' or jsonb_typeof(question->'topic_ids') is distinct from 'array' then
      raise exception 'each question requires structured Topic IDs' using errcode='22023';
    end if;
    if (question->>'question_type') not in ('multiple_choice','true_false','text')
       or length(btrim(coalesce(question->>'prompt',''))) not between 2 and 2000
       or jsonb_typeof(coalesce(question->'answer_options','null'::jsonb)) <> 'array'
       or not (question ? 'correct_answer') then
      raise exception 'invalid structured question fields' using errcode='22023';
    end if;
    if question->>'question_type' = 'multiple_choice' and (
      jsonb_array_length(question->'answer_options') not between 2 and 8
      or jsonb_typeof(question->'correct_answer') <> 'number'
      or (question->>'correct_answer') !~ '^[0-9]+$'
      or (question->>'correct_answer')::integer >= jsonb_array_length(question->'answer_options')
    ) then
      raise exception 'invalid multiple-choice question' using errcode='22023';
    elsif question->>'question_type' = 'true_false' and (
      jsonb_array_length(question->'answer_options') <> 0
      or jsonb_typeof(question->'correct_answer') <> 'boolean'
    ) then
      raise exception 'invalid true/false question' using errcode='22023';
    elsif question->>'question_type' = 'text' and (
      jsonb_array_length(question->'answer_options') <> 0
      or jsonb_typeof(question->'correct_answer') <> 'array'
      or jsonb_array_length(question->'correct_answer') < 1
      or exists (
        select 1 from jsonb_array_elements(question->'correct_answer') accepted
        where jsonb_typeof(accepted) <> 'string'
          or length(btrim(accepted #>> '{}')) not between 1 and 1000
      )
    ) then
      raise exception 'invalid text question' using errcode='22023';
    end if;
    select array_agg(value::uuid) into question_topic_ids
    from jsonb_array_elements_text(question->'topic_ids');
    if coalesce(array_length(question_topic_ids,1),0)<1 or exists(
      select 1 from unnest(question_topic_ids) topic_id
      where not exists(
        select 1 from public.training_content_topics ct
        join public.training_topics t on t.id=ct.topic_id and t.is_active
        where ct.content_id=requested_content_id and ct.topic_id=topic_id
      )
    ) then raise exception 'question Topics must be active content Topics' using errcode='22023'; end if;

    insert into public.training_questions(
      content_id,position,question_type,prompt,answer_options,correct_answer,explanation,media_id
    ) values (
      requested_content_id,(question->>'position')::integer,question->>'question_type',question->>'prompt',
      coalesce(question->'answer_options','[]'::jsonb),question->'correct_answer',
      nullif(btrim(coalesce(question->>'explanation','')),''),
      nullif(question->>'media_id','')::uuid
    ) returning id into created_question_id;
    insert into public.training_question_topics(question_id,topic_id)
      select created_question_id,topic_id from (select distinct unnest(question_topic_ids) topic_id) topics;
  end loop;

  update public.training_content content
  set updated_at=now()
  where content.id=requested_content_id
  returning content.updated_at into changed_at;
  select count(*)::integer into count_questions
  from public.training_questions question
  where question.content_id=requested_content_id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',requested_content_id,'training.content_updated','database',jsonb_build_object('question_count',count_questions));
  return query select requested_content_id,count_questions,changed_at;
end
$function$;

create function public.publish_training_content(requested_content_id uuid, expected_updated_at timestamptz)
returns table (id uuid, status text, published_at timestamptz, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  existing public.training_content%rowtype;
  changed public.training_content%rowtype;
begin
  select * into existing
  from public.training_content content
  where content.id = requested_content_id
  for update;
  if not found then raise exception 'training content not found' using errcode='P0002'; end if;
  actor_id := pulse_private.require_training_content_permission('studio.publish',requested_content_id);
  if expected_updated_at is null or existing.updated_at <> expected_updated_at then
    raise exception 'reviewed content changed' using errcode='PT409';
  end if;
  if existing.status <> 'draft' then
    raise exception 'only draft training content may be published' using errcode='55000';
  end if;
  if existing.content_type in ('quiz','assessment') and (
    not exists (
      select 1 from public.training_questions question
      where question.content_id = requested_content_id
    )
    or exists (
      select 1
      from public.training_questions question
      where question.content_id = requested_content_id
        and not exists (
          select 1 from public.training_question_topics question_topic
          where question_topic.question_id = question.id
        )
    )
    or exists (
      select 1
      from public.training_question_topics question_topic
      join public.training_questions question on question.id = question_topic.question_id
      where question.content_id = requested_content_id
        and not exists (
          select 1 from public.training_content_topics content_topic
          where content_topic.content_id = requested_content_id
            and content_topic.topic_id = question_topic.topic_id
        )
    )
  ) then
    raise exception 'publish requires Topic-attributed valid questions' using errcode='23514';
  end if;

  update public.training_content content
  set status = 'published'
  where content.id = requested_content_id
  returning * into changed;

  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'training_content',changed.id,'training.content_published','database',
    jsonb_build_object('content_type',changed.content_type,'language',changed.language));
  return query select changed.id,changed.status,changed.published_at,changed.updated_at;
end
$function$;

-- Pulse Studio STUDIO-1B.1: protected, audit-neutral authoring read contract.
--
-- This RPC is intentionally the only authenticated browser path that returns
-- Training answer keys. Canonical Training tables remain deny-by-default.

create or replace function public.get_training_content_authoring_details(
  requested_content_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.current_training_staff_user_id();
  content_row public.training_content%rowtype;
  can_read boolean := false;
  response jsonb;
begin
  select content.*
  into content_row
  from public.training_content content
  where content.id = requested_content_id;

  if found then
    can_read := pulse_private.can_read_training_authoring(content_row.id);
  end if;

  -- Missing and inaccessible content intentionally share one response so the
  -- contract does not disclose whether a guessed identifier exists.
  if not found or not can_read then
    raise exception 'Studio content unavailable' using errcode = 'P0002';
  end if;

  select jsonb_build_object(
    'content', jsonb_build_object(
      'id', content.id,
      'title', content.title,
      'description', content.description,
      'content_type', content.content_type,
      'language', content.language,
      'status', content.status,
      'creator', jsonb_build_object(
        'display_name', coalesce(nullif(btrim(creator.display_name), ''), creator.full_name)
      ),
      'created_at', content.created_at,
      'updated_at', content.updated_at,
      'published_at', content.published_at,
      'archived_at', content.archived_at
    ),
    'topics', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', topic.id, 'code', topic.code, 'name', topic.name)
        order by topic.name, topic.id
      )
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id = content_topic.topic_id
      where content_topic.content_id = content.id
    ), '[]'::jsonb),
    'audience', jsonb_build_object(
      'scope_type', audience.scope_type,
      'campaign_id', campaign.id,
      'campaign_code', campaign.code,
      'campaign_name', campaign.name,
      'team_id', team.id,
      'team_code', team.code,
      'team_name', team.name
    ),
    'position_targets', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', position.id, 'code', position.code, 'name', position.name)
        order by position.name, position.id
      )
      from public.training_content_position_targets target
      join public.positions position on position.id = target.position_id
      where target.content_id = content.id
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', question.id,
          'position', question.position,
          'question_type', question.question_type,
          'prompt', question.prompt,
          'answer_options', question.answer_options,
          'correct_answer', question.correct_answer,
          'explanation', question.explanation,
          'media_id', question.media_id,
          'media', case when media.id is null then null else jsonb_build_object(
            'id', media.id,
            'media_type', media.media_type,
            'mime_type', media.mime_type,
            'alt_text', media.alt_text
          ) end,
          'topic_ids', coalesce((
            select jsonb_agg(question_topic.topic_id order by question_topic.topic_id)
            from public.training_question_topics question_topic
            where question_topic.question_id = question.id
          ), '[]'::jsonb),
          'topics', coalesce((
            select jsonb_agg(
              jsonb_build_object('id', topic.id, 'code', topic.code, 'name', topic.name)
              order by topic.name, topic.id
            )
            from public.training_question_topics question_topic
            join public.training_topics topic on topic.id = question_topic.topic_id
            where question_topic.question_id = question.id
          ), '[]'::jsonb)
        )
        order by question.position, question.id
      )
      from public.training_questions question
      left join public.training_media media on media.id = question.media_id
      where question.content_id = content.id
    ), '[]'::jsonb)
  )
  into response
  from public.training_content content
  join public.users creator on creator.id = content.created_by_user_id
  join public.training_content_audiences audience on audience.content_id = content.id
  left join public.campaigns campaign on campaign.id = audience.campaign_id
  left join public.teams team on team.id = audience.team_id
  where content.id = content_row.id;

  return response || jsonb_build_object('capabilities',public.get_studio_capabilities(requested_content_id));
end
$function$;

alter function public.get_training_content_authoring_details(uuid) owner to postgres;

revoke all on function public.get_training_content_authoring_details(uuid)
  from public, anon, service_role;
grant execute on function public.get_training_content_authoring_details(uuid)
  to authenticated;

comment on function public.get_training_content_authoring_details(uuid) is
  'Returns one complete, scope-authorized Studio authoring payload including answer keys without direct table access or audit side effects.';


create function public.list_studio_content(
  requested_status text default null,
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_search text default null,
  requested_limit integer default 50,
  requested_offset integer default 0
)
returns table (
  id uuid,
  content_type text,
  title text,
  description text,
  language text,
  status text,
  topics jsonb,
  audience jsonb,
  position_targets jsonb,
  creator_display text,
  published_at timestamptz,
  updated_at timestamptz,
  can_open boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid;
  requested_view constant text := 'studio';
  can_manage boolean;
  normalized_search text := nullif(btrim(coalesce(requested_search,'')), '');
begin
  if requested_status is not null and requested_status not in ('draft','published','archived') then
    raise exception 'invalid Training catalog view' using errcode = '22023';
  end if;
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid Training language' using errcode = '22023';
  end if;
  if requested_limit is null or requested_limit not between 1 and 100
     or requested_offset is null or requested_offset < 0 then
    raise exception 'invalid Training pagination' using errcode = '22023';
  end if;

  if requested_view = 'learner' then
    actor_id := pulse_private.require_any_training_permission(array['go.play','academy.view','studio.view']);
    can_manage := false;
  else
    actor_id := pulse_private.require_any_training_permission(array['studio.view']);
    can_manage := pulse_private.has_any_training_permission(array['studio.publish','academy.manage']);
  end if;

  return query
  select
    content.id,
    content.content_type,
    content.title,
    content.description,
    content.language,
    content.status,
    coalesce((
      select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id = content_topic.topic_id
      where content_topic.content_id = content.id
    ), '[]'::jsonb),
    jsonb_build_object(
      'scope_type', audience.scope_type,
      'campaign_id', campaign.id,
      'campaign_code', campaign.code,
      'campaign_name', campaign.name,
      'team_id', team.id,
      'team_code', team.code,
      'team_name', team.name
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object('id',position.id,'code',position.code,'name',position.name) order by position.name,position.id)
      from public.training_content_position_targets target
      join public.positions position on position.id = target.position_id
      where target.content_id = content.id
    ), '[]'::jsonb),
    coalesce(nullif(btrim(creator.display_name),''), creator.full_name),
    content.published_at,
    content.updated_at,
    pulse_private.can_read_training_authoring(content.id)
  from public.training_content content
  join public.training_content_audiences audience on audience.content_id = content.id
  join public.users creator on creator.id = content.created_by_user_id
  left join public.campaigns campaign on campaign.id = audience.campaign_id
  left join public.teams team on team.id = audience.team_id
  where (requested_status is null or content.status=requested_status)
    and (requested_language is null or content.language = requested_language)
    and (requested_topic_id is null or exists (
      select 1 from public.training_content_topics filter_topic
      where filter_topic.content_id = content.id and filter_topic.topic_id = requested_topic_id
    ))
    and (normalized_search is null
      or content.title ilike '%' || normalized_search || '%'
      or coalesce(content.description,'') ilike '%' || normalized_search || '%')
    and (
      (requested_view = 'learner' and (
        pulse_private.has_training_learner_content_permission('go.play',content.id,actor_id)
        or pulse_private.has_training_learner_content_permission('academy.view',content.id,actor_id)
        or pulse_private.has_training_learner_content_permission('studio.view',content.id,actor_id)
      ))
      or (requested_view = 'studio' and (
        pulse_private.can_read_training_authoring(content.id)
        or (can_manage
          and pulse_private.has_training_content_permission('studio.publish',content.id))
        or (content.status = 'published'
          and pulse_private.has_training_content_permission('studio.view',content.id))
      ))
    )
  order by content.updated_at desc, content.id
  limit requested_limit offset requested_offset;
end
$function$;
-- Keep the old arity only as an explicit fail-closed compatibility error.
create or replace function public.publish_training_content(requested_content_id uuid)
returns table (id uuid,status text,published_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path = pg_catalog
as $function$
begin
  raise exception 'reviewed version required' using errcode='22023';
end
$function$;
alter function public.publish_training_content(uuid,timestamptz) owner to postgres;
revoke all on function public.publish_training_content(uuid,timestamptz) from public,anon,service_role;
grant execute on function public.publish_training_content(uuid,timestamptz) to authenticated;
alter function public.list_studio_content(text,text,uuid,text,integer,integer) owner to postgres;
revoke all on function public.list_studio_content(text,text,uuid,text,integer,integer) from public,anon,service_role;
grant execute on function public.list_studio_content(text,text,uuid,text,integer,integer) to authenticated;
commit;
