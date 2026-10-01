-- GO-2B: version the existing canonical Training content, without moving attempts.
begin;

alter table public.training_content
  add column game_id uuid,
  add column version_number integer,
  add column is_current boolean not null default false;

-- Every pre-existing item is its own first version. Existing published content
-- remains the playable version and every old attempt keeps its exact content_id.
update public.training_content
set game_id = id, version_number = 1, is_current = status = 'published';

alter table public.training_content
  alter column game_id set not null,
  alter column version_number set not null,
  add constraint training_content_game_root_fk foreign key (game_id)
    references public.training_content(id) on update restrict on delete restrict,
  add constraint training_content_version_positive check (version_number > 0),
  add constraint training_content_current_published check (not is_current or status = 'published'),
  add constraint training_content_game_version_unique unique (game_id, version_number);

create unique index training_content_one_current_game
  on public.training_content(game_id) where is_current;
create unique index training_content_one_update_draft
  on public.training_content(game_id) where status = 'draft' and version_number > 1;
create index training_content_game_history_idx
  on public.training_content(game_id, version_number desc);

-- Browser roles still have no direct Training-table privileges. New first
-- drafts receive their own stable game identity; only the protected revision
-- RPC supplies an existing game_id and server-owned version number.
create function pulse_private.set_training_game_identity()
returns trigger language plpgsql set search_path = pg_catalog as $function$
begin
  if new.game_id is null then
    new.game_id := new.id;
    new.version_number := 1;
  elsif new.game_id = new.id then
    if new.version_number is distinct from 1 then
      raise exception 'first game version must be 1' using errcode = '23514';
    end if;
  elsif new.version_number is null or new.version_number < 2 or not exists (
    select 1 from public.training_content root
    where root.id = new.game_id and root.game_id = root.id and root.version_number = 1
  ) then
    raise exception 'invalid game revision identity' using errcode = '23514';
  end if;
  if new.is_current then
    raise exception 'new game versions must begin as draft' using errcode = '23514';
  end if;
  return new;
end $function$;

create trigger training_content_game_identity before insert on public.training_content
  for each row execute function pulse_private.set_training_game_identity();

-- Publication freezes gameplay data. The current-pointer bit is metadata, not
-- part of a version's definition; it changes only during an atomic publish.
create function pulse_private.protect_training_game_version()
returns trigger language plpgsql set search_path = pg_catalog as $function$
begin
  if new.game_id is distinct from old.game_id or
     new.version_number is distinct from old.version_number then
    raise exception 'game version identity is immutable' using errcode = '55000';
  end if;
  if old.version_number > 1 and (new.language is distinct from old.language or
     new.content_type is distinct from old.content_type) then
    raise exception 'game update must keep its language and type' using errcode = '55000';
  end if;
  if old.status in ('published', 'archived') and (
    new.content_type is distinct from old.content_type or
    new.title is distinct from old.title or
    new.description is distinct from old.description or
    new.language is distinct from old.language or
    new.cover_media_id is distinct from old.cover_media_id or
    new.lobby_audio_media_id is distinct from old.lobby_audio_media_id
  ) then
    raise exception 'published game definition is immutable' using errcode = '55000';
  end if;
  if old.status = 'published' and new.status = 'archived' and not old.is_current then
    raise exception 'historical game version cannot be archived' using errcode = '55000';
  end if;
  if new.status = 'published' and old.status = 'draft' then
    perform pg_advisory_xact_lock(hashtextextended('training-game:' || new.game_id::text, 0));
    if new.version_number > 1 and not exists (
      select 1 from public.training_content current_game
      where current_game.game_id = new.game_id and current_game.is_current
        and current_game.status = 'published'
    ) then
      raise exception 'current published game unavailable' using errcode = '55000';
    end if;
    update public.training_content current_game set is_current = false
      where current_game.game_id = new.game_id and current_game.is_current;
    new.is_current := true;
  elsif new.status = 'archived' then
    new.is_current := false;
  end if;
  return new;
end $function$;

create trigger training_content_protect_version before update on public.training_content
  for each row execute function pulse_private.protect_training_game_version();

-- An update draft may reuse an already-published file within its logical game.
-- The original media row and object remain immutable and reference-protected.
create or replace function pulse_private.require_ready_training_media_reference()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
declare item public.training_media%rowtype;
  target_game uuid;
  source_game uuid;
begin
  if tg_table_name = 'training_questions' then
    if new.media_id is null then return new; end if;
    select * into item from public.training_media where id = new.media_id for share;
    if item.status = 'ready' then
      select game_id into target_game from public.training_content where id = new.content_id;
      select game_id into source_game from public.training_content where id = item.bound_content_id;
    end if;
    if not found or item.status not in ('ready','legacy') or
       (item.status = 'ready' and (target_game is distinct from source_game or
         item.media_kind not in ('question_image','question_audio'))) then
      raise exception 'question media is unavailable' using errcode = '23514';
    end if;
  else
    if tg_op = 'UPDATE' and old.status <> 'draft' and
      (new.cover_media_id is distinct from old.cover_media_id or
       new.lobby_audio_media_id is distinct from old.lobby_audio_media_id) then
      raise exception 'published media references are immutable' using errcode = '55000';
    end if;
    for item in select * from public.training_media
      where id in (new.cover_media_id, new.lobby_audio_media_id) for share
    loop
      select game_id into source_game from public.training_content where id = item.bound_content_id;
      if item.status <> 'ready' or source_game is distinct from new.game_id or
        (item.id = new.cover_media_id and item.media_kind <> 'game_cover') or
        (item.id = new.lobby_audio_media_id and item.media_kind <> 'lobby_audio') then
        raise exception 'game media is unavailable' using errcode = '23514';
      end if;
    end loop;
    if (new.cover_media_id is not null and not exists (
      select 1 from public.training_media where id = new.cover_media_id
    )) or (new.lobby_audio_media_id is not null and not exists (
      select 1 from public.training_media where id = new.lobby_audio_media_id
    )) then
      raise exception 'game media is unavailable' using errcode = '23514';
    end if;
  end if;
  return new;
end $function$;

-- The creator does not grant an authorization bypass. The operator must have
-- the exact Studio-create permission in scope and be the creator or a manager.
create function public.create_training_content_revision(requested_content_id uuid)
returns table (id uuid, game_id uuid, version_number integer, created boolean)
language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  source public.training_content%rowtype;
  draft public.training_content%rowtype;
  old_question public.training_questions%rowtype;
  new_question_id uuid;
  next_number integer;
begin
  select * into source from public.training_content
    where training_content.id = requested_content_id;
  if not found or source.status <> 'published' or not source.is_current then
    raise exception 'current published game unavailable' using errcode = 'P0002';
  end if;
  if not pulse_private.has_training_content_permission('studio.create',source.id) or
    (source.created_by_user_id <> actor and not
      pulse_private.has_training_content_permission('academy.manage',source.id)) then
    raise exception 'Studio edit permission required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('training-game:' || source.game_id::text, 0));
  select * into source from public.training_content
    where training_content.id = requested_content_id for share;
  if not source.is_current or source.status <> 'published' then
    raise exception 'current published game changed' using errcode = '40001';
  end if;
  select * into draft from public.training_content content
    where content.game_id = source.game_id and content.status = 'draft'
      and content.version_number > 1;
  if found then
    return query select draft.id, draft.game_id, draft.version_number, false;
    return;
  end if;
  select coalesce(max(content.version_number),0) + 1 into next_number
    from public.training_content content where content.game_id = source.game_id;
  insert into public.training_content(
    content_type,title,description,language,created_by_user_id,
    cover_media_id,lobby_audio_media_id,game_id,version_number
  ) values (
    source.content_type,source.title,source.description,source.language,
    source.created_by_user_id,source.cover_media_id,source.lobby_audio_media_id,
    source.game_id,next_number
  ) returning * into draft;

  insert into public.training_content_topics(content_id,topic_id)
    select draft.id,topic_id from public.training_content_topics where content_id = source.id;
  insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id)
    select draft.id,scope_type,campaign_id,team_id
      from public.training_content_audiences where content_id = source.id;
  insert into public.training_content_position_targets(content_id,position_id)
    select draft.id,position_id from public.training_content_position_targets
      where content_id = source.id;
  for old_question in select * from public.training_questions
    where content_id = source.id order by position loop
    insert into public.training_questions(
      content_id,position,question_type,prompt,answer_options,correct_answer,explanation,media_id
    ) values (
      draft.id,old_question.position,old_question.question_type,old_question.prompt,
      old_question.answer_options,old_question.correct_answer,old_question.explanation,
      old_question.media_id
    ) returning training_questions.id into new_question_id;
    insert into public.training_question_topics(question_id,topic_id)
      select new_question_id,topic_id from public.training_question_topics
        where question_id = old_question.id;
  end loop;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor,'training_content',draft.id,'training.revision_created','database',
    jsonb_build_object('game_id',source.game_id,'version',next_number,'based_on',source.id));
  return query select draft.id,draft.game_id,draft.version_number,true;
end $function$;

create function public.get_training_game_versions(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  item public.training_content%rowtype;
begin
  select * into item from public.training_content where id = requested_content_id;
  if not found or not pulse_private.can_read_training_authoring(item.id) then
    raise exception 'Studio game unavailable' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'game_id',item.game_id,
    'version_number',item.version_number,
    'can_edit_update',item.status = 'published' and item.is_current and
      pulse_private.has_training_content_permission('studio.create',item.id) and
      (item.created_by_user_id = actor or
        pulse_private.has_training_content_permission('academy.manage',item.id)),
    'versions',coalesce((select jsonb_agg(jsonb_build_object(
      'id',v.id,'number',v.version_number,'status',v.status,
      'current',v.is_current,'published_at',v.published_at
    ) order by v.version_number desc) from public.training_content v
      where v.game_id = item.game_id),'[]'::jsonb)
  );
end $function$;

-- Existing Practice and Hosted attempts/sessions already reference the exact
-- content revision. Only new activity must require today's current version.
create function pulse_private.require_current_game_for_new_play()
returns trigger language plpgsql security definer set search_path = pg_catalog as $function$
begin
  if tg_table_name = 'go_sessions' then
    if not exists (select 1 from public.training_content content
      where content.id = new.content_id and content.status = 'published'
        and content.is_current) then
      raise exception 'current published game required' using errcode = '55000';
    end if;
  elsif new.source_mode = 'go_practice' then
    if not exists (select 1 from public.training_content content
      where content.id = new.content_id and content.status = 'published'
        and content.is_current) then
      raise exception 'current published game required' using errcode = '55000';
    end if;
  end if;
  return new;
end $function$;
create trigger training_attempts_require_current_game before insert on public.training_attempts
  for each row execute function pulse_private.require_current_game_for_new_play();
create trigger go_sessions_require_current_game before insert on public.go_sessions
  for each row execute function pulse_private.require_current_game_for_new_play();

create or replace function public.list_go_practice_catalog(
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (id uuid,content_type text,title text,description text,
  language text,topics jsonb,published_at timestamptz)
language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor_id uuid := pulse_private.require_any_training_permission(array['go.play']);
begin
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid GO Practice language' using errcode = '22023';
  end if;
  if requested_limit not between 1 and 100 or requested_offset < 0 then
    raise exception 'invalid GO Practice pagination' using errcode = '22023';
  end if;
  return query
  select content.id,content.content_type,content.title,content.description,
    content.language,coalesce((select jsonb_agg(jsonb_build_object(
      'id',topic.id,'code',topic.code,'name',topic.name
    ) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id=content_topic.topic_id and topic.is_active
      where content_topic.content_id=content.id),'[]'::jsonb),content.published_at
  from public.training_content content
  where content.status='published' and content.is_current
    and content.content_type in ('quiz','assessment')
    and (requested_language is null or content.language=requested_language)
    and (requested_topic_id is null or exists(select 1 from public.training_content_topics t
      where t.content_id=content.id and t.topic_id=requested_topic_id))
    and pulse_private.has_training_learner_content_permission('go.play',content.id,actor_id)
  order by content.title,content.id limit requested_limit offset requested_offset;
end $function$;

create or replace function public.list_go_host_catalog(
  requested_language text default null,
  requested_limit integer default 100,
  requested_offset integer default 0
)
returns table (id uuid,content_type text,title text,description text,
  language text,question_count integer,topics jsonb,published_at timestamptz)
language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor_id uuid := pulse_private.require_any_training_permission(array['go.host']);
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
    coalesce((select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,
      'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics content_topic
      join public.training_topics topic on topic.id=content_topic.topic_id and topic.is_active
      where content_topic.content_id=content.id),'[]'::jsonb),content.published_at
  from public.training_content content
  where content.status='published' and content.is_current
    and content.content_type in ('quiz','assessment')
    and (requested_language is null or content.language=requested_language)
    and exists(select 1 from public.training_questions question where question.content_id=content.id)
    and pulse_private.go_staff_has_content_permission('go.host',content.id,actor_id)
  order by content.title,content.id limit requested_limit offset requested_offset;
end $function$;

-- The default Studio library shows one card per logical game. Status tabs may
-- still inspect the current published version and its in-progress draft.
create or replace function public.list_studio_content(
  requested_status text default null,
  requested_language text default null,
  requested_topic_id uuid default null,
  requested_search text default null,
  requested_limit integer default 50,
  requested_offset integer default 0
)
returns table (id uuid,content_type text,title text,description text,
  language text,status text,topics jsonb,audience jsonb,
  position_targets jsonb,creator_display text,published_at timestamptz,
  updated_at timestamptz,can_open boolean)
language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor_id uuid := pulse_private.require_any_training_permission(array['studio.view']);
  normalized_search text := nullif(btrim(coalesce(requested_search,'')), '');
  can_manage boolean := pulse_private.has_any_training_permission(array['studio.publish','academy.manage']);
begin
  if requested_status is not null and requested_status not in ('draft','published','archived') then
    raise exception 'invalid Training catalog view' using errcode = '22023';
  end if;
  if requested_language is not null and requested_language not in ('en','es') then
    raise exception 'invalid Training language' using errcode = '22023';
  end if;
  if requested_limit is null or requested_limit not between 1 and 100 or
     requested_offset is null or requested_offset < 0 then
    raise exception 'invalid Training pagination' using errcode = '22023';
  end if;
  return query
  select content.id,content.content_type,content.title,content.description,
    content.language,content.status,
    coalesce((select jsonb_agg(jsonb_build_object('id',topic.id,'code',topic.code,
      'name',topic.name) order by topic.name,topic.id)
      from public.training_content_topics ct
      join public.training_topics topic on topic.id=ct.topic_id
      where ct.content_id=content.id),'[]'::jsonb),
    jsonb_build_object('scope_type',audience.scope_type,'campaign_id',campaign.id,
      'campaign_code',campaign.code,'campaign_name',campaign.name,'team_id',team.id,
      'team_code',team.code,'team_name',team.name),
    coalesce((select jsonb_agg(jsonb_build_object('id',position.id,'code',position.code,
      'name',position.name) order by position.name,position.id)
      from public.training_content_position_targets target
      join public.positions position on position.id=target.position_id
      where target.content_id=content.id),'[]'::jsonb),
    coalesce(nullif(btrim(creator.display_name),''),creator.full_name),
    content.published_at,content.updated_at,
    pulse_private.can_read_training_authoring(content.id)
  from public.training_content content
  join public.training_content_audiences audience on audience.content_id=content.id
  join public.users creator on creator.id=content.created_by_user_id
  left join public.campaigns campaign on campaign.id=audience.campaign_id
  left join public.teams team on team.id=audience.team_id
  where (requested_status is null or content.status=requested_status)
    and (requested_language is null or content.language=requested_language)
    and (requested_topic_id is null or exists(select 1 from public.training_content_topics t
      where t.content_id=content.id and t.topic_id=requested_topic_id))
    and (normalized_search is null or content.title ilike '%'||normalized_search||'%' or
      coalesce(content.description,'') ilike '%'||normalized_search||'%')
    and (pulse_private.can_read_training_authoring(content.id) or
      (can_manage and pulse_private.has_training_content_permission('studio.publish',content.id)) or
      (content.status='published' and pulse_private.has_training_content_permission('studio.view',content.id)))
    and (content.status <> 'published' or content.is_current)
    and (requested_status is not null or content.status <> 'published' or not exists (
      select 1 from public.training_content update_draft
      where update_draft.game_id=content.game_id and update_draft.status='draft'
        and update_draft.version_number > 1
    ))
  order by content.updated_at desc,content.id
  limit requested_limit offset requested_offset;
end $function$;

alter function pulse_private.set_training_game_identity() owner to postgres;
alter function pulse_private.protect_training_game_version() owner to postgres;
alter function pulse_private.require_ready_training_media_reference() owner to postgres;
alter function pulse_private.require_current_game_for_new_play() owner to postgres;
alter function public.create_training_content_revision(uuid) owner to postgres;
alter function public.get_training_game_versions(uuid) owner to postgres;
revoke all on function pulse_private.set_training_game_identity() from public,anon,authenticated,service_role;
revoke all on function pulse_private.protect_training_game_version() from public,anon,authenticated,service_role;
revoke all on function pulse_private.require_current_game_for_new_play() from public,anon,authenticated,service_role;
revoke all on function public.create_training_content_revision(uuid) from public,anon,service_role;
revoke all on function public.get_training_game_versions(uuid) from public,anon,service_role;
grant execute on function public.create_training_content_revision(uuid) to authenticated;
grant execute on function public.get_training_game_versions(uuid) to authenticated;

commit;
