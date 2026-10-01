-- GO-2: additive game presentation and server-owned Hosted timing.
begin;

alter table public.training_content
  add column variant_family_id uuid,
  add column authorship_kind text not null default 'staff',
  add column timer_seconds integer,
  add constraint training_content_authorship_kind_valid
    check (authorship_kind in ('staff','pulse')),
  add constraint training_content_timer_seconds_valid
    check (timer_seconds is null or timer_seconds in (15,30,45,60));

update public.training_content set variant_family_id = game_id;
alter table public.training_content
  alter column variant_family_id set not null,
  add constraint training_content_variant_family_fk foreign key (variant_family_id)
    references public.training_content(id) on update restrict on delete restrict;

create unique index training_content_one_current_language_variant
  on public.training_content(variant_family_id,language)
  where status = 'published' and is_current;
create unique index training_content_one_draft_language_variant
  on public.training_content(variant_family_id,language)
  where status = 'draft' and version_number = 1;

create function pulse_private.inherit_go2_game_settings()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare source public.training_content%rowtype;
begin
  if new.version_number > 1 then
    select * into source from public.training_content
      where game_id = new.game_id and is_current and status = 'published';
    if not found then raise exception 'current game version required' using errcode='55000'; end if;
    if source.authorship_kind='pulse' and auth.uid() is not null and not
      pulse_private.has_training_content_permission('academy.manage',source.id) then
      raise exception 'canonical game manager permission required' using errcode='42501';
    end if;
    new.variant_family_id := source.variant_family_id;
    new.authorship_kind := source.authorship_kind;
    new.timer_seconds := source.timer_seconds;
  elsif new.variant_family_id is null then
    new.variant_family_id := new.game_id;
  end if;
  return new;
end $function$;

create trigger training_content_go2_settings before insert on public.training_content
  for each row execute function pulse_private.inherit_go2_game_settings();

create function pulse_private.protect_go2_game_settings()
returns trigger language plpgsql set search_path = pg_catalog as $function$
begin
  if (old.authorship_kind='pulse' or new.authorship_kind='pulse') and
    auth.uid() is not null and not
    pulse_private.has_training_content_permission('academy.manage',old.id) then
    raise exception 'canonical game manager permission required' using errcode='42501';
  end if;
  if new.variant_family_id is distinct from old.variant_family_id then
    raise exception 'game language family is immutable' using errcode='55000';
  end if;
  if old.status in ('published','archived') and (
    new.authorship_kind is distinct from old.authorship_kind or
    new.timer_seconds is distinct from old.timer_seconds
  ) then raise exception 'published game settings are immutable' using errcode='55000'; end if;
  return new;
end $function$;

create trigger training_content_protect_go2_settings before update on public.training_content
  for each row execute function pulse_private.protect_go2_game_settings();

create function pulse_private.protect_go2_canonical_questions()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare target public.training_content%rowtype;
begin
  select * into target from public.training_content
    where id=case when tg_op='DELETE' then old.content_id else new.content_id end;
  if target.authorship_kind='pulse' and auth.uid() is not null and not
    pulse_private.has_training_content_permission('academy.manage',target.id) then
    raise exception 'canonical game manager permission required' using errcode='42501';
  end if;
  return case when tg_op='DELETE' then old else new end;
end $function$;

create trigger training_questions_canonical_manager
  before insert or update or delete on public.training_questions
  for each row execute function pulse_private.protect_go2_canonical_questions();

-- The existing Studio draft/ownership contract remains the only write gate.
create function public.set_training_game_timer(
  requested_content_id uuid, requested_timer_seconds integer,
  expected_updated_at timestamptz
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  item public.training_content%rowtype;
begin
  if requested_timer_seconds is not null and requested_timer_seconds not in (15,30,45,60) then
    raise exception 'invalid game timer' using errcode='22023';
  end if;
  select * into item from public.training_content where id=requested_content_id for update;
  if not found then raise exception 'content unavailable' using errcode='P0002'; end if;
  if item.status <> 'draft' or
    not pulse_private.has_training_content_permission('studio.create',item.id) or
    (item.created_by_user_id <> actor and not
      pulse_private.has_training_content_permission('academy.manage',item.id)) then
    raise exception 'Studio edit permission required' using errcode='42501';
  end if;
  if expected_updated_at is null or item.updated_at <> expected_updated_at then
    raise exception 'draft changed' using errcode='PT409';
  end if;
  update public.training_content set timer_seconds=requested_timer_seconds,
    updated_at=clock_timestamp() where id=item.id returning * into item;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor,'training_content',item.id,'training.timer_changed','database',
      jsonb_build_object('timer_seconds',item.timer_seconds));
  return jsonb_build_object('id',item.id,'timer_seconds',item.timer_seconds,
    'updated_at',item.updated_at);
end $function$;

-- "Made by Pulse" is explicit and can only be designated by a manager on a draft.
create function public.mark_training_game_canonical(requested_content_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  item public.training_content%rowtype;
begin
  select * into item from public.training_content where id=requested_content_id for update;
  if not found then raise exception 'content unavailable' using errcode='P0002'; end if;
  if item.status <> 'draft' or
    not pulse_private.has_training_content_permission('academy.manage',item.id) or
    not pulse_private.has_training_content_permission('studio.publish',item.id) then
    raise exception 'game manager permission required' using errcode='42501';
  end if;
  if item.authorship_kind <> 'pulse' then
    update public.training_content set authorship_kind='pulse',updated_at=clock_timestamp()
      where id=item.id returning * into item;
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
      values(actor,'training_content',item.id,'training.canonical_marked','database','{}'::jsonb);
  end if;
  return jsonb_build_object('id',item.id,'authorship_kind',item.authorship_kind,
    'updated_at',item.updated_at);
end $function$;

-- A language variant starts as a separate logical game in the same family.
-- Its questions and media are deliberately empty: nothing is translated or
-- published automatically. Repeated requests reopen the same draft.
create function public.create_training_language_variant(
  requested_content_id uuid, requested_language text
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  source public.training_content%rowtype;
  variant public.training_content%rowtype;
begin
  if requested_language not in ('en','es') then
    raise exception 'invalid game language' using errcode='22023';
  end if;
  select * into source from public.training_content where id=requested_content_id;
  if not found or source.status <> 'published' or not source.is_current then
    raise exception 'current published game unavailable' using errcode='P0002';
  end if;
  if source.language=requested_language then
    raise exception 'choose a different game language' using errcode='22023';
  end if;
  if not pulse_private.has_training_content_permission('studio.create',source.id) or
    (source.created_by_user_id <> actor and not
      pulse_private.has_training_content_permission('academy.manage',source.id)) then
    raise exception 'Studio create permission required' using errcode='42501';
  end if;
  if source.authorship_kind='pulse' and not
    pulse_private.has_training_content_permission('academy.manage',source.id) then
    raise exception 'canonical game manager permission required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(
    'training-variant:'||source.variant_family_id::text||':'||requested_language,0));
  select * into variant from public.training_content content
    where content.variant_family_id=source.variant_family_id
      and content.language=requested_language and content.status='draft'
      and content.version_number=1;
  if found then
    if variant.created_by_user_id<>actor and not
      pulse_private.has_training_content_permission('academy.manage',variant.id) then
      raise exception 'Studio create permission required' using errcode='42501';
    end if;
    return jsonb_build_object('id',variant.id,'created',false);
  end if;
  if exists(select 1 from public.training_content content
    where content.variant_family_id=source.variant_family_id
      and content.language=requested_language and content.is_current) then
    raise exception 'language variant already exists' using errcode='55000';
  end if;
  insert into public.training_content(
    content_type,title,language,created_by_user_id,variant_family_id
  ) values (
    source.content_type,
    left(case when requested_language='es' then 'Spanish draft — '
      else 'English draft — ' end || source.title,180),
    requested_language,actor,source.variant_family_id
  ) returning * into variant;
  insert into public.training_content_topics(content_id,topic_id)
    select variant.id,topic_id from public.training_content_topics
      where content_id=source.id;
  insert into public.training_content_audiences(content_id,scope_type,campaign_id,team_id)
    select variant.id,scope_type,campaign_id,team_id
      from public.training_content_audiences where content_id=source.id;
  insert into public.training_content_position_targets(content_id,position_id)
    select variant.id,position_id from public.training_content_position_targets
      where content_id=source.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor,'training_content',variant.id,'training.language_variant_created','database',
      jsonb_build_object('source_content_id',source.id,'language',requested_language));
  return jsonb_build_object('id',variant.id,'created',true);
end $function$;

-- This batch lookup never trusts an ID list as authorization. Every row is
-- checked against the existing Studio, Practice, or Host read contracts.
create function public.get_go_game_identity(requested_content_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
begin
  if requested_content_ids is null or cardinality(requested_content_ids) > 100 then
    raise exception 'invalid game identity request' using errcode='22023';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',content.id,'creator_label',case when content.authorship_kind='pulse'
      then 'Made by Pulse' else 'Created by ' || coalesce(
        nullif(btrim(creator.display_name),''),nullif(btrim(creator.full_name),''),'Pulse') end,
    'variant_family_id',content.variant_family_id,
    'authorship_kind',content.authorship_kind,
    'is_current',content.is_current,
    'can_mark_canonical',content.status='draft' and
      pulse_private.has_training_content_permission('academy.manage',content.id) and
      pulse_private.has_training_content_permission('studio.publish',content.id),
    'can_create_language_variant',content.status='published' and content.is_current and
      pulse_private.has_training_content_permission('studio.create',content.id) and
      (content.created_by_user_id=actor or
        pulse_private.has_training_content_permission('academy.manage',content.id)) and
      (content.authorship_kind<>'pulse' or
        pulse_private.has_training_content_permission('academy.manage',content.id)),
    'can_edit_update',content.status='published' and content.is_current and
      pulse_private.has_training_content_permission('studio.create',content.id) and
      (content.created_by_user_id=actor or
        pulse_private.has_training_content_permission('academy.manage',content.id)) and
      (content.authorship_kind<>'pulse' or
        pulse_private.has_training_content_permission('academy.manage',content.id)),
    'cover_media_id',content.cover_media_id,
    'lobby_audio_media_id',content.lobby_audio_media_id,
    'timer_seconds',content.timer_seconds,
    'question_count',(select count(*) from public.training_questions question
      where question.content_id=content.id)
  ) order by content.id) from public.training_content content
    join public.users creator on creator.id=content.created_by_user_id
    where content.id=any(requested_content_ids) and (
      pulse_private.can_read_training_authoring(content.id) or
      (content.status='published' and (
        pulse_private.has_training_learner_content_permission('go.play',content.id,actor) or
        pulse_private.go_staff_has_content_permission('go.host',content.id,actor)
      ))
    )),'[]'::jsonb);
end $function$;

alter table public.go_sessions
  add column question_started_at timestamptz,
  add column question_deadline_at timestamptz,
  add constraint go_sessions_question_deadline_valid check (
    question_deadline_at is null or
    (question_started_at is not null and question_deadline_at > question_started_at)
  );

create function pulse_private.set_go_question_deadline()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare duration integer;
begin
  if new.status='active' and (old.status <> 'active' or
    new.current_question_position <> old.current_question_position) then
    select timer_seconds into duration from public.training_content where id=new.content_id;
    new.question_started_at := clock_timestamp();
    new.question_deadline_at := case when duration is null then null
      else new.question_started_at + make_interval(secs => duration) end;
  end if;
  return new;
end $function$;

create trigger go_sessions_question_deadline before update of status,current_question_position
  on public.go_sessions for each row execute function pulse_private.set_go_question_deadline();

-- A server-side insert guard closes the race between rendering a countdown
-- and submitting an answer. Existing Practice attempts are unaffected.
create function pulse_private.reject_late_go_answer()
returns trigger language plpgsql set search_path = pg_catalog as $function$
declare target public.go_sessions%rowtype;
begin
  select session.* into target from public.go_session_memberships membership
    join public.go_sessions session on session.id=membership.session_id
    where membership.attempt_id=new.attempt_id and membership.member_kind='participant';
  if found and (target.status <> 'active' or
    (target.question_deadline_at is not null and
      clock_timestamp() >= target.question_deadline_at)) then
    raise exception 'GO answer deadline has passed' using errcode='55000';
  end if;
  return new;
end $function$;

create trigger training_attempt_answers_go_deadline before insert
  on public.training_attempt_answers for each row execute function pulse_private.reject_late_go_answer();

-- Keep the established hosted snapshot and append only authorized presentation
-- fields after the existing membership check has succeeded.
create function public.get_go_hosted_experience(requested_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog as $function$
declare snapshot jsonb := public.get_go_hosted_session(requested_session_id);
  target public.go_sessions%rowtype;
  content public.training_content%rowtype;
  label text;
begin
  select * into target from public.go_sessions where id=requested_session_id;
  select * into content from public.training_content where id=target.content_id;
  select case when content.authorship_kind='pulse' then 'Made by Pulse'
    else 'Created by ' || coalesce(nullif(btrim(creator.display_name),''),
      nullif(btrim(creator.full_name),''),'Pulse') end into label
    from public.users creator where creator.id=content.created_by_user_id;
  snapshot := jsonb_set(snapshot,'{content}',
    snapshot->'content' || jsonb_build_object(
      'cover_media_id',content.cover_media_id,
      'lobby_audio_media_id',content.lobby_audio_media_id,
      'creator_label',label,
      'timer_seconds',content.timer_seconds));
  return snapshot || jsonb_build_object(
    'question_started_at',target.question_started_at,
    'question_deadline_at',target.question_deadline_at);
end $function$;

alter function pulse_private.inherit_go2_game_settings() owner to postgres;
alter function pulse_private.protect_go2_game_settings() owner to postgres;
alter function pulse_private.protect_go2_canonical_questions() owner to postgres;
alter function pulse_private.set_go_question_deadline() owner to postgres;
alter function pulse_private.reject_late_go_answer() owner to postgres;
alter function public.set_training_game_timer(uuid,integer,timestamptz) owner to postgres;
alter function public.mark_training_game_canonical(uuid) owner to postgres;
alter function public.create_training_language_variant(uuid,text) owner to postgres;
alter function public.get_go_game_identity(uuid[]) owner to postgres;
alter function public.get_go_hosted_experience(uuid) owner to postgres;
revoke all on function pulse_private.inherit_go2_game_settings() from public,anon,authenticated,service_role;
revoke all on function pulse_private.protect_go2_game_settings() from public,anon,authenticated,service_role;
revoke all on function pulse_private.protect_go2_canonical_questions() from public,anon,authenticated,service_role;
revoke all on function pulse_private.set_go_question_deadline() from public,anon,authenticated,service_role;
revoke all on function pulse_private.reject_late_go_answer() from public,anon,authenticated,service_role;
revoke all on function public.set_training_game_timer(uuid,integer,timestamptz) from public,anon,service_role;
revoke all on function public.mark_training_game_canonical(uuid) from public,anon,service_role;
revoke all on function public.create_training_language_variant(uuid,text) from public,anon,service_role;
revoke all on function public.get_go_game_identity(uuid[]) from public,anon,service_role;
revoke all on function public.get_go_hosted_experience(uuid) from public,anon,service_role;
grant execute on function public.set_training_game_timer(uuid,integer,timestamptz) to authenticated;
grant execute on function public.mark_training_game_canonical(uuid) to authenticated;
grant execute on function public.create_training_language_variant(uuid,text) to authenticated;
grant execute on function public.get_go_game_identity(uuid[]) to authenticated;
grant execute on function public.get_go_hosted_experience(uuid) to authenticated;
commit;
