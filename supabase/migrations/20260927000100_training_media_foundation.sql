-- GO-2A: one private Training media catalog and storage boundary.
begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('training-media','training-media',false,4194304,
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Restrictive policies protect this bucket even if a permissive Storage policy
-- is introduced for an unrelated bucket in the future. Only the trusted Edge
-- Function's service role can write objects or sign reads.
create policy training_media_no_browser_select on storage.objects as restrictive
  for select to anon,authenticated using (bucket_id <> 'training-media');
create policy training_media_no_browser_insert on storage.objects as restrictive
  for insert to anon,authenticated with check (bucket_id <> 'training-media');
create policy training_media_no_browser_update on storage.objects as restrictive
  for update to anon,authenticated using (bucket_id <> 'training-media')
  with check (bucket_id <> 'training-media');
create policy training_media_no_browser_delete on storage.objects as restrictive
  for delete to anon,authenticated using (bucket_id <> 'training-media');

alter table public.training_media
  add column media_kind text,
  add column bound_content_id uuid references public.training_content(id) on update restrict on delete restrict,
  add column byte_size integer,
  add column width_px integer,
  add column height_px integer,
  add column sha256 text,
  add column upload_key uuid,
  add column status text not null default 'legacy',
  add column finalized_at timestamptz;
alter table public.training_media alter column status set default 'pending';
alter table public.training_media
  add constraint training_media_kind_valid check (media_kind in
    ('game_cover','question_image','question_audio','lobby_audio') or status='legacy'),
  add constraint training_media_status_valid check (status in ('legacy','pending','ready','deleting','deleted')),
  add constraint training_media_size_valid check (byte_size is null or byte_size between 1 and 4194304),
  add constraint training_media_dimensions_valid check (
    (width_px is null and height_px is null) or
    (width_px between 1 and 4096 and height_px between 1 and 4096)),
  add constraint training_media_sha_valid check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  add constraint training_media_ready_metadata check (status <> 'ready' or
    (media_kind is not null and bound_content_id is not null and byte_size is not null
      and sha256 is not null and finalized_at is not null)),
  add constraint training_media_kind_mime check (status='legacy' or
    (media_kind in ('game_cover','question_image') and mime_type in ('image/jpeg','image/png','image/webp')) or
    (media_kind in ('question_audio','lobby_audio') and mime_type in ('audio/mpeg','audio/mp4')));
create unique index training_media_upload_idempotency on public.training_media(created_by_user_id,upload_key)
  where upload_key is not null;
create index training_media_pending_cleanup on public.training_media(created_at,id)
  where status='pending';
create index training_media_content_idx on public.training_media(bound_content_id,id);

create function pulse_private.guard_training_media_lifecycle()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
declare content_status text;
  check_draft boolean := tg_op='INSERT';
begin
  if tg_op='UPDATE' then
    check_draft := old.status='pending';
    if (new.id,new.created_by_user_id,new.media_type,new.media_kind,new.bound_content_id,
      new.storage_bucket,new.storage_path,new.mime_type,new.byte_size,new.width_px,new.height_px,
      new.sha256,new.upload_key) is distinct from
      (old.id,old.created_by_user_id,old.media_type,old.media_kind,old.bound_content_id,
       old.storage_bucket,old.storage_path,old.mime_type,old.byte_size,old.width_px,old.height_px,
       old.sha256,old.upload_key) then
      raise exception 'media identity and object metadata are immutable' using errcode='55000';
    end if;
    if not ((old.status='pending' and new.status in ('ready','deleting','deleted')) or
      (old.status='ready' and new.status='deleting') or
      (old.status='deleting' and new.status='deleted') or old.status=new.status) then
      raise exception 'invalid media lifecycle transition' using errcode='55000';
    end if;
    if old.status<>'pending' and new.finalized_at is distinct from old.finalized_at then
      raise exception 'finalized media metadata is immutable' using errcode='55000';
    end if;
  end if;
  if new.status in ('pending','ready') and check_draft then
    select c.status into content_status from public.training_content c
      where c.id=new.bound_content_id for share;
    if content_status is distinct from 'draft' then
      raise exception 'new media must belong to a draft' using errcode='55000';
    end if;
  end if;
  return new;
end $function$;
create trigger training_media_lifecycle_guard before insert or update on public.training_media
  for each row execute function pulse_private.guard_training_media_lifecycle();

create function pulse_private.audit_training_media_ready()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
begin
  if old.status='pending' and new.status='ready' then
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(new.created_by_user_id,'training_media',new.id,'training.media_uploaded','database',
      jsonb_build_object('content_id',new.bound_content_id,'kind',new.media_kind,'byte_size',new.byte_size));
  end if;
  return new;
end $function$;
create trigger training_media_ready_audit after update of status on public.training_media
  for each row execute function pulse_private.audit_training_media_ready();

alter table public.training_content
  add column cover_media_id uuid references public.training_media(id) on update restrict on delete restrict,
  add column lobby_audio_media_id uuid references public.training_media(id) on update restrict on delete restrict;

-- Locks the media row while attaching it, serializing against a concurrent
-- removal. Published rows remain immutable under the existing lifecycle trigger.
create function pulse_private.require_ready_training_media_reference()
returns trigger language plpgsql security definer set search_path=pg_catalog as $function$
declare item public.training_media%rowtype;
begin
  if tg_table_name='training_questions' then
    if new.media_id is null then return new; end if;
    select * into item from public.training_media where id=new.media_id for share;
    if not found or item.status not in ('ready','legacy') or
       (item.status='ready' and (item.bound_content_id<>new.content_id or
         item.media_kind not in ('question_image','question_audio'))) then
      raise exception 'question media is unavailable' using errcode='23514';
    end if;
  else
    if tg_op='UPDATE' and old.status<>'draft' and
      (new.cover_media_id is distinct from old.cover_media_id or
       new.lobby_audio_media_id is distinct from old.lobby_audio_media_id) then
      raise exception 'published media references are immutable' using errcode='55000';
    end if;
    if new.cover_media_id is not null then
      select * into item from public.training_media where id=new.cover_media_id for share;
      if not found or item.status<>'ready' or item.bound_content_id<>new.id or
         item.media_kind<>'game_cover' then
        raise exception 'cover media is unavailable' using errcode='23514';
      end if;
    end if;
    if new.lobby_audio_media_id is not null then
      select * into item from public.training_media where id=new.lobby_audio_media_id for share;
      if not found or item.status<>'ready' or item.bound_content_id<>new.id or
         item.media_kind<>'lobby_audio' then
        raise exception 'lobby audio is unavailable' using errcode='23514';
      end if;
    end if;
  end if;
  return new;
end $function$;
create trigger training_questions_media_guard before insert or update of media_id,content_id
  on public.training_questions for each row execute function pulse_private.require_ready_training_media_reference();
create trigger training_content_media_guard before update of cover_media_id,lobby_audio_media_id
  on public.training_content for each row execute function pulse_private.require_ready_training_media_reference();

-- This browser-callable RPC returns only a boolean; paths stay behind the
-- trusted media boundary. A draft claim is readable only under Studio rights.
create function public.can_read_training_media(requested_media_id uuid,requested_content_id uuid,
  requested_session_id uuid default null)
returns boolean language plpgsql stable security definer set search_path=pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
begin
  return exists (
    select 1 from public.training_media media
    join public.training_content content on content.id=requested_content_id
    where media.id=requested_media_id and media.status='ready'
      and ((content.status='draft' and media.bound_content_id=content.id) or
        content.cover_media_id=media.id or content.lobby_audio_media_id=media.id or exists (
          select 1 from public.training_questions q
          where q.content_id=content.id and q.media_id=media.id))
      and (
        pulse_private.can_read_training_authoring(content.id)
        or (content.status='published' and (
          pulse_private.has_training_learner_content_permission('go.play',content.id,actor)
          or pulse_private.go_staff_has_content_permission('go.host',content.id,actor)
          or exists(select 1 from public.go_sessions s
            join public.go_session_memberships m on m.session_id=s.id
            where s.id=requested_session_id and s.content_id=content.id and m.staff_user_id=actor)
        ))
        or exists(select 1 from public.training_attempts a
          join public.training_staff_learner_links l on l.learner_id=a.learner_id
          where a.content_id=content.id and l.staff_user_id=actor
            and pulse_private.has_any_training_permission(array['go.play']))
      )
  );
end $function$;

-- All uploads are bound to a draft with canonical Studio edit permission.
-- The only object path is generated by the Edge Function from a server UUID.
create function public.can_write_training_media(requested_content_id uuid)
returns boolean language plpgsql stable security definer set search_path=pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
begin
  return exists(select 1 from public.training_content c where c.id=requested_content_id
    and c.status='draft' and pulse_private.has_training_content_permission('studio.create',c.id)
    and (c.created_by_user_id=actor or
      pulse_private.has_training_content_permission('academy.manage',c.id)));
end $function$;

create function public.get_training_content_media(requested_content_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $function$
declare item public.training_content%rowtype;
begin
  select * into item from public.training_content where id=requested_content_id;
  if not found or not pulse_private.can_read_training_authoring(item.id) then
    raise exception 'content unavailable' using errcode='P0002';
  end if;
  return jsonb_build_object('cover_media_id',item.cover_media_id,
    'lobby_audio_media_id',item.lobby_audio_media_id);
end $function$;

create function public.set_training_content_media(requested_content_id uuid,
  requested_cover_media_id uuid,requested_lobby_audio_media_id uuid,expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  item public.training_content%rowtype;
begin
  select * into item from public.training_content where id=requested_content_id for update;
  if not found then raise exception 'content unavailable' using errcode='P0002'; end if;
  if not public.can_write_training_media(item.id) then
    raise exception 'Studio edit permission required' using errcode='42501'; end if;
  if item.updated_at is distinct from expected_updated_at then
    raise exception 'draft changed' using errcode='40001'; end if;
  update public.training_content set cover_media_id=requested_cover_media_id,
    lobby_audio_media_id=requested_lobby_audio_media_id,updated_at=now()
  where id=item.id returning * into item;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor,'training_content',item.id,'training.media_changed','database',
    jsonb_build_object('cover_media_id',item.cover_media_id,'lobby_audio_media_id',item.lobby_audio_media_id));
  return jsonb_build_object('id',item.id,'cover_media_id',item.cover_media_id,
    'lobby_audio_media_id',item.lobby_audio_media_id,'updated_at',item.updated_at);
end $function$;

create function public.mark_training_media_deleting(requested_media_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog as $function$
declare actor uuid := pulse_private.current_training_staff_user_id();
  item public.training_media%rowtype;
begin
  select * into item from public.training_media where id=requested_media_id for update;
  if not found then return false; end if;
  if item.created_by_user_id<>actor or not public.can_write_training_media(item.bound_content_id) then
    raise exception 'media delete permission required' using errcode='42501'; end if;
  if item.status='deleted' then return true; end if;
  if item.status not in ('ready','pending','deleting') then
    raise exception 'media cannot be deleted' using errcode='55000'; end if;
  if exists(select 1 from public.training_questions q where q.media_id=item.id) or
    exists(select 1 from public.training_content c where c.cover_media_id=item.id or c.lobby_audio_media_id=item.id) then
    raise exception 'referenced media cannot be deleted' using errcode='55000'; end if;
  update public.training_media set status='deleting' where id=item.id;
  return true;
end $function$;

-- Edge-only completion; browser roles cannot finalize or select catalog rows.
create function public.finish_training_media_delete(requested_media_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog as $function$
declare item public.training_media%rowtype;
begin
  if auth.role()<>'service_role' then raise exception 'service role required' using errcode='42501'; end if;
  select * into item from public.training_media where id=requested_media_id for update;
  if not found or item.status='deleted' then return; end if;
  if item.status<>'deleting' then raise exception 'media not marked for deletion' using errcode='55000'; end if;
  update public.training_media set status='deleted' where id=item.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(item.created_by_user_id,'training_media',item.id,'training.media_deleted','database',
    jsonb_build_object('content_id',item.bound_content_id));
end $function$;

alter function pulse_private.require_ready_training_media_reference() owner to postgres;
alter function pulse_private.guard_training_media_lifecycle() owner to postgres;
alter function pulse_private.audit_training_media_ready() owner to postgres;
alter function public.can_read_training_media(uuid,uuid,uuid) owner to postgres;
alter function public.can_write_training_media(uuid) owner to postgres;
alter function public.get_training_content_media(uuid) owner to postgres;
alter function public.set_training_content_media(uuid,uuid,uuid,timestamptz) owner to postgres;
alter function public.mark_training_media_deleting(uuid) owner to postgres;
alter function public.finish_training_media_delete(uuid) owner to postgres;
revoke all on function pulse_private.require_ready_training_media_reference() from public,anon,authenticated,service_role;
revoke all on function pulse_private.guard_training_media_lifecycle() from public,anon,authenticated,service_role;
revoke all on function pulse_private.audit_training_media_ready() from public,anon,authenticated,service_role;
revoke all on function public.can_read_training_media(uuid,uuid,uuid) from public,anon,service_role;
revoke all on function public.can_write_training_media(uuid) from public,anon,service_role;
revoke all on function public.get_training_content_media(uuid) from public,anon,service_role;
revoke all on function public.set_training_content_media(uuid,uuid,uuid,timestamptz) from public,anon,service_role;
revoke all on function public.mark_training_media_deleting(uuid) from public,anon,service_role;
revoke all on function public.finish_training_media_delete(uuid) from public,anon,authenticated;
grant execute on function public.can_read_training_media(uuid,uuid,uuid) to authenticated;
grant execute on function public.can_write_training_media(uuid) to authenticated;
grant execute on function public.get_training_content_media(uuid) to authenticated;
grant execute on function public.set_training_content_media(uuid,uuid,uuid,timestamptz) to authenticated;
grant execute on function public.mark_training_media_deleting(uuid) to authenticated;
grant execute on function public.finish_training_media_delete(uuid) to service_role;

commit;
