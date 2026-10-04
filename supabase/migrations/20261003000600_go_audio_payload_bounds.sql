-- A signed playback URL must never contain audio outside the authored range.
begin;

create or replace function pulse_private.require_question_audio_clip()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
declare media public.training_media%rowtype;
  stored_duration_ms numeric;
begin
  if new.audio_start_ms is null and new.audio_end_ms is null then return new; end if;
  select * into media from public.training_media where id=new.media_id for share;
  if not found or media.status<>'ready' or media.media_kind<>'question_audio' or
    media.mime_type<>'audio/wav' or media.byte_size is null or media.byte_size<46 then
    raise exception 'audio clip requires ready trimmed WAV' using errcode='23514';
  end if;
  stored_duration_ms := (media.byte_size-44)::numeric * 1000 / (2*22050);
  if new.audio_start_ms<>0 or
    abs((new.audio_end_ms-new.audio_start_ms)-stored_duration_ms)>2 then
    raise exception 'audio clip must match the stored fragment' using errcode='23514';
  end if;
  return new;
end $function$;

commit;
