-- GO question audio: retain only the selected segment in private Storage.
begin;

-- The editor encodes only the selected segment as 22.05 kHz mono PCM WAV.
-- No unselected part of the source recording is ever sent to Storage.
update storage.buckets set allowed_mime_types=array[
  'image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/wav'
] where id='training-media';
alter table public.training_media drop constraint training_media_kind_mime;
alter table public.training_media add constraint training_media_kind_mime check (status='legacy' or
  (media_kind in ('game_cover','question_image') and mime_type in ('image/jpeg','image/png','image/webp')) or
  (media_kind in ('question_audio','lobby_audio') and mime_type in ('audio/mpeg','audio/mp4','audio/wav')));

alter table public.training_questions
  add column audio_start_ms integer,
  add column audio_end_ms integer,
  add constraint training_questions_audio_clip_valid check (
    (audio_start_ms is null and audio_end_ms is null) or
    (media_id is not null and audio_start_ms is not null and audio_end_ms is not null and
      audio_start_ms between 0 and 600000 and
      audio_end_ms > audio_start_ms and audio_end_ms <= 600000 and
      audio_end_ms - audio_start_ms <= time_limit_seconds * 1000)
  );

create function pulse_private.require_question_audio_clip()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
begin
  if (new.audio_start_ms is not null or new.audio_end_ms is not null) and not exists (
    select 1 from public.training_media media
    where media.id=new.media_id and media.status='ready' and media.media_kind='question_audio'
  ) then
    raise exception 'audio clip requires ready question audio' using errcode='23514';
  end if;
  return new;
end $function$;
create trigger training_questions_audio_clip_guard before insert or update of media_id,audio_start_ms,audio_end_ms
  on public.training_questions for each row execute function pulse_private.require_question_audio_clip();

create function public.replace_training_questions_v3(requested_content_id uuid,
  requested_questions jsonb, expected_updated_at timestamptz)
returns table (content_id uuid, question_count integer, updated_at timestamptz)
language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare item jsonb; saved record;
begin
  if jsonb_typeof(requested_questions) is distinct from 'array' then
    raise exception 'questions must be an array' using errcode='22023';
  end if;
  for item in select value from jsonb_array_elements(requested_questions) loop
    if (item ? 'audio_start_ms' or item ? 'audio_end_ms') and
      not (item->>'audio_start_ms' is null and item->>'audio_end_ms' is null) and
      (jsonb_typeof(item->'audio_start_ms') is distinct from 'number' or
       jsonb_typeof(item->'audio_end_ms') is distinct from 'number' or
       (item->>'audio_start_ms') !~ '^[0-9]{1,6}$' or
       (item->>'audio_end_ms') !~ '^[0-9]{1,6}$') then
      raise exception 'invalid audio clip' using errcode='22023';
    end if;
  end loop;
  select * into saved from public.replace_training_questions_v2(
    requested_content_id,requested_questions,expected_updated_at);
  update public.training_questions question
    set audio_start_ms=(item.value->>'audio_start_ms')::integer,
        audio_end_ms=(item.value->>'audio_end_ms')::integer
  from jsonb_array_elements(requested_questions) with ordinality item(value,ordinality)
  where question.content_id=requested_content_id and question.position=item.ordinality;
  return query select saved.content_id,saved.question_count,saved.updated_at;
end $function$;

create function public.get_training_content_authoring_details_v3(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare details jsonb := public.get_training_content_authoring_details_v2(requested_content_id);
  questions jsonb;
begin
  select coalesce(jsonb_agg(item.value || jsonb_build_object(
    'audio_start_ms',question.audio_start_ms,'audio_end_ms',question.audio_end_ms)
    order by item.ordinality),'[]'::jsonb) into questions
  from jsonb_array_elements(details->'questions') with ordinality item(value,ordinality)
  join public.training_questions question on question.id=(item.value->>'id')::uuid;
  return jsonb_set(details,'{questions}',questions);
end $function$;

create function public.get_go_practice_content_v3(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare content jsonb := public.get_go_practice_content_v2(requested_content_id);
  questions jsonb;
begin
  select coalesce(jsonb_agg(item.value || jsonb_build_object(
    'audio_start_ms',question.audio_start_ms,'audio_end_ms',question.audio_end_ms)
    order by item.ordinality),'[]'::jsonb) into questions
  from jsonb_array_elements(content->'questions') with ordinality item(value,ordinality)
  join public.training_questions question on question.id=(item.value->>'id')::uuid;
  return jsonb_set(content,'{questions}',questions);
end $function$;

create function public.get_go_hosted_experience_v2(requested_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare snapshot jsonb := public.get_go_hosted_experience(requested_session_id);
  question public.training_questions%rowtype;
begin
  if snapshot->>'status'='active' and snapshot->'current_question'->>'id' is not null then
    select * into question from public.training_questions
      where id=(snapshot->'current_question'->>'id')::uuid;
    if found then
      snapshot := jsonb_set(snapshot,'{current_question}',snapshot->'current_question' ||
        jsonb_build_object('media_id',question.media_id,
          'audio_start_ms',question.audio_start_ms,'audio_end_ms',question.audio_end_ms));
    end if;
  end if;
  return snapshot;
end $function$;

create function public.create_training_content_revision_v3(requested_content_id uuid)
returns table (id uuid, game_id uuid, version_number integer, created boolean)
language plpgsql volatile security definer set search_path=pg_catalog as $function$
declare cloned record;
begin
  select * into cloned from public.create_training_content_revision_v2(requested_content_id);
  if cloned.created then
    update public.training_questions question
      set audio_start_ms=source_question.audio_start_ms,
          audio_end_ms=source_question.audio_end_ms
    from public.training_questions source_question
    where question.content_id=cloned.id and source_question.content_id=requested_content_id
      and source_question.position=question.position;
  end if;
  return query select cloned.id,cloned.game_id,cloned.version_number,cloned.created;
end $function$;

alter function pulse_private.require_question_audio_clip() owner to postgres;
alter function public.replace_training_questions_v3(uuid,jsonb,timestamptz) owner to postgres;
alter function public.get_training_content_authoring_details_v3(uuid) owner to postgres;
alter function public.get_go_practice_content_v3(uuid) owner to postgres;
alter function public.get_go_hosted_experience_v2(uuid) owner to postgres;
alter function public.create_training_content_revision_v3(uuid) owner to postgres;
revoke all on function pulse_private.require_question_audio_clip() from public,anon,authenticated,service_role;
revoke all on function public.replace_training_questions_v3(uuid,jsonb,timestamptz) from public,anon,service_role;
revoke all on function public.get_training_content_authoring_details_v3(uuid) from public,anon,service_role;
revoke all on function public.get_go_practice_content_v3(uuid) from public,anon,service_role;
revoke all on function public.get_go_hosted_experience_v2(uuid) from public,anon,service_role;
revoke all on function public.create_training_content_revision_v3(uuid) from public,anon,service_role;
grant execute on function public.replace_training_questions_v3(uuid,jsonb,timestamptz) to authenticated;
grant execute on function public.get_training_content_authoring_details_v3(uuid) to authenticated;
grant execute on function public.get_go_practice_content_v3(uuid) to authenticated;
grant execute on function public.get_go_hosted_experience_v2(uuid) to authenticated;
grant execute on function public.create_training_content_revision_v3(uuid) to authenticated;
commit;
