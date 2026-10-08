-- Bounded private clips, optional for new v3 practices. No public media or real recordings.
begin;
alter table public.training_media drop constraint training_media_kind_valid;
alter table public.training_media add constraint training_media_kind_valid check(media_kind in ('game_cover','question_image','question_audio','lobby_audio','simulation_screen','simulation_audio') or status='legacy');
alter table public.training_media drop constraint training_media_kind_mime;
alter table public.training_media add constraint training_media_kind_mime check(status='legacy' or
(media_kind in ('game_cover','question_image','simulation_screen') and mime_type in ('image/jpeg','image/png','image/webp')) or
(media_kind in ('question_audio','lobby_audio') and mime_type in ('audio/mpeg','audio/mp4','audio/wav')) or (media_kind='simulation_audio' and mime_type='audio/wav' and media_type='audio' and byte_size between 4454 and 2646044 and storage_bucket='training-media'));
create table public.training_vici_audio(
 content_id uuid not null references public.training_content(id) on delete restrict,
 cue text not null check(cue in ('customer','advisor')),
 media_id uuid not null references public.training_media(id) on delete restrict,
 primary key(content_id,cue)
);
alter table public.training_vici_audio enable row level security;
revoke all on public.training_vici_audio from public,anon,authenticated,service_role;
create function pulse_private.guard_vici_audio()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; media public.training_media%rowtype; scenario text;
begin
 select * into item from public.training_content where id=case when tg_op='DELETE' then old.content_id else new.content_id end for share;
 select v.scenario into scenario from public.training_vici_challenges v where v.content_id=item.id and workflow_version=3;
 if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' or scenario is null then raise exception 'editable v3 simulation required' using errcode='55000'; end if;
 if tg_op='DELETE' then return old; end if;
 if tg_op='UPDATE' and (new.content_id,new.cue) is distinct from (old.content_id,old.cue) then raise exception 'clip identity immutable' using errcode='55000'; end if;
 select * into media from public.training_media where id=new.media_id for share;
 if media.status is distinct from 'ready' or media.media_kind is distinct from 'simulation_audio' or media.mime_type is distinct from 'audio/wav'
 or not exists(select 1 from public.training_content where id=media.bound_content_id and game_id=item.game_id)
 or new.cue='advisor' and (scenario not in ('english','spxfer') or media.byte_size<661544) then raise exception 'ready same-family private clip required; advisor introduction at least 15 seconds' using errcode='23514'; end if;
 return new;
end $fn$;
create trigger vici_audio_draft_guard before insert or update or delete on public.training_vici_audio for each row execute function pulse_private.guard_vici_audio();
create function pulse_private.protect_vici_audio()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if new.status is distinct from old.status and exists(select 1 from public.training_vici_audio where media_id=old.id) then raise exception 'referenced practice clip cannot be removed' using errcode='55000'; end if;
 return new;
end $fn$;
create trigger vici_audio_reference_guard before update of status on public.training_media for each row execute function pulse_private.protect_vici_audio();
-- Changing a draft scenario cannot leave incompatible advisor clips publishable.
do $publication$
declare source text;
begin
 source:=pg_get_functiondef('pulse_private.validate_vici_practice(uuid)'::regprocedure);
 source:=replace(source,'if actual is distinct from wanted','if exists(select 1 from public.training_vici_audio v join public.training_media m on m.id=v.media_id where v.content_id=content and (m.status<>''ready'' or v.cue=''advisor'' and (scenario not in (''english'',''spxfer'') or m.byte_size<661544))) then raise exception ''incompatible private practice clip'' using errcode=''23514''; end if; if actual is distinct from wanted');
 execute source;
end $publication$;
create function public.configure_vici_audio(requested_content_id uuid,requested_cue text,requested_media_id uuid,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare item public.training_content%rowtype; actor uuid;
begin
 select * into item from public.training_content where id=requested_content_id for update;
 actor:=pulse_private.require_training_content_permission('studio.create',requested_content_id);
 if item.status is distinct from 'draft' or item.content_type is distinct from 'simulation' then raise exception 'simulation draft required' using errcode='55000'; end if;
 if item.created_by_user_id<>actor and not pulse_private.has_training_content_permission('academy.manage',item.id) then raise exception 'draft owner or manager required' using errcode='42501'; end if;
 if expected_updated_at is null or item.updated_at is distinct from expected_updated_at then raise exception 'draft changed' using errcode='40001'; end if;
 if requested_cue is null or requested_cue not in ('customer','advisor') then raise exception 'known cue required' using errcode='22023'; end if;
 if requested_media_id is null then delete from public.training_vici_audio where content_id=item.id and cue=requested_cue;
 else insert into public.training_vici_audio values(item.id,requested_cue,requested_media_id) on conflict(content_id,cue) do update set media_id=excluded.media_id; end if;
 update public.training_content set updated_at=clock_timestamp() where id=item.id returning * into item;
 insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata) values(actor,'training_content',item.id,'training.vici_audio_configured','database',jsonb_build_object('cue',requested_cue,'media_id',requested_media_id));
 return jsonb_build_object('id',item.id,'updated_at',item.updated_at);
end $fn$;
create function pulse_private.clone_vici_audio()
returns trigger language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if new.content_type='simulation' and new.version_number>1 then
 insert into public.training_vici_audio(content_id,cue,media_id) select new.id,v.cue,v.media_id from public.training_vici_audio v join public.training_content c on c.id=v.content_id where c.game_id=new.game_id and c.is_current and c.status='published';
 end if;return new;
end $fn$;
-- Run after the challenge clone so its protocol is already present.
create trigger vici_z_audio_revision_clone after insert on public.training_content for each row execute function pulse_private.clone_vici_audio();
create function pulse_private.can_read_vici_audio(requested_agent_id uuid,requested_media_id uuid,requested_content_id uuid,requested_attempt_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; clip_cue text;
begin
 if not exists(select 1 from public.training_media m join public.training_content c on c.id=requested_content_id join public.training_content origin on origin.id=m.bound_content_id and origin.game_id=c.game_id
 where m.id=requested_media_id and m.status='ready' and m.media_kind='simulation_audio' and m.mime_type='audio/wav' and c.content_type='simulation') then return false; end if;
 if requested_agent_id is null and requested_attempt_id is null then return pulse_private.can_read_training_authoring(requested_content_id) and (
 exists(select 1 from public.training_content where id=requested_content_id and status='draft') or exists(select 1 from public.training_vici_audio where content_id=requested_content_id and media_id=requested_media_id)); end if;
 if requested_agent_id is null then return false; end if;
 snap:=pulse_private.simulation_snapshot(requested_attempt_id,requested_agent_id);
 if snap->>'status'<>'started' or (snap->>'content_id')::uuid<>requested_content_id or snap->'challenge'->>'workflow_version'<>'3' then return false; end if;
 clip_cue:=case when snap->'dialer'->>'phase'='conference' then 'advisor' when snap->'dialer'->>'phase'='live' then 'customer' else null end;
 return exists(select 1 from public.training_vici_audio v where v.content_id=requested_content_id and v.media_id=requested_media_id and v.cue=clip_cue);
end $fn$;
create function public.can_read_vici_audio(requested_media_id uuid,requested_content_id uuid)
returns boolean language sql security definer set search_path=pg_catalog as $fn$
 select pulse_private.can_read_vici_audio(null,requested_media_id,requested_content_id,null) $fn$;
create function public.agent_can_read_vici_audio(requested_agent_id uuid,requested_media_id uuid,requested_content_id uuid,requested_attempt_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog as $fn$
begin
 if auth.role() is distinct from 'service_role' or requested_agent_id is null then raise exception 'trusted Agent server required' using errcode='42501'; end if;
 return pulse_private.can_read_vici_audio(requested_agent_id,requested_media_id,requested_content_id,requested_attempt_id);
end $fn$;
-- Wrap only the new snapshot with the currently permitted cue; no future audio IDs.
do $clone$
declare source text;
begin
 source:=pg_get_functiondef('pulse_private.simulation_snapshot(uuid,uuid)'::regprocedure);
 execute replace(source,'pulse_private.simulation_snapshot(','pulse_private.simulation_snapshot_v3(');
end $clone$;
create or replace function pulse_private.simulation_snapshot(requested_attempt_id uuid,requested_agent_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $fn$
declare snap jsonb; clip_cue text;
begin
 snap:=pulse_private.simulation_snapshot_v3(requested_attempt_id,requested_agent_id);
 if snap->'challenge'->>'workflow_version'='3' and snap->>'status'='started' then
 clip_cue:=case when snap->'dialer'->>'phase'='conference' then 'advisor' when snap->'dialer'->>'phase'='live' then 'customer' else null end;
 snap:=snap||jsonb_build_object('audio',coalesce((select jsonb_agg(jsonb_build_object('cue',v.cue,'media_id',v.media_id)) from public.training_vici_audio v where v.content_id=(snap->>'content_id')::uuid and v.cue=clip_cue),'[]'));
 end if;return snap;
end $fn$;
-- An assigned advisor clip starts its introduction on the explicit playback event.
do $command$
declare source text;
begin
 source:=pg_get_functiondef('public.agent_submit_vici_command(uuid,uuid,integer,uuid,text,text)'::regprocedure);
 source:=replace(source,'''phoneLogin'',''campaignLogin'')','''phoneLogin'',''campaignLogin'',''advisorIntro'')');
 source:=replace(source,'if requested_command=''newCustomer''','if requested_command=''advisorIntro'' and phase=''conference'' and session.intro_started_at is null and exists(select 1 from public.training_vici_audio where content_id=(snap->>''content_id'')::uuid and cue=''advisor'') then update public.training_vici_sessions set intro_started_at=clock_timestamp() where attempt_id=requested_attempt_id; neutral:=true; elsif requested_command=''newCustomer''');
 source:=replace(source,'when expected=''connect'' then clock_timestamp()','when expected=''connect'' then case when exists(select 1 from public.training_vici_audio where content_id=(snap->>''content_id'')::uuid and cue=''advisor'') then null else clock_timestamp() end');
 execute source;
end $command$;
alter table public.training_vici_control_events drop constraint training_vici_control_events_command_check;
alter table public.training_vici_control_events add constraint training_vici_control_events_command_check check(command in ('status','break','lunch','callbacks','manage','restroom','tech','resume','closePause','back','logo','manual','hangup','callDisposition','newCustomer','advisorIntro'));
create or replace function public.get_simulation_authoring(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $fn$
begin
 return public.get_simulation_authoring_foundation(requested_content_id)||jsonb_build_object('scenario',(select scenario from public.training_vici_challenges where content_id=requested_content_id),
 'workflow_version',(select workflow_version from public.training_vici_challenges where content_id=requested_content_id),
 'audio',coalesce((select jsonb_agg(jsonb_build_object('cue',cue,'media_id',media_id)) from public.training_vici_audio where content_id=requested_content_id),'[]'));
end $fn$;
do $grants$
declare f record;
begin
 for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','pulse_private') and (p.proname like '%vici_audio%' or p.proname='simulation_snapshot_v3') loop
 execute 'alter function '||f.signature||' owner to postgres';execute 'revoke all on function '||f.signature||' from public,anon,authenticated,service_role';
 if f.nspname='public' and f.proname='agent_can_read_vici_audio' then execute 'grant execute on function '||f.signature||' to service_role';
 elsif f.nspname='public' then execute 'grant execute on function '||f.signature||' to authenticated'; end if;
 end loop;
end $grants$;
notify pgrst,'reload schema';commit;
