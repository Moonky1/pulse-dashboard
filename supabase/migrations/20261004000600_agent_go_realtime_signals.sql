-- Realtime signals contain no game data. Both Agent and Staff players reload
-- their authorized snapshots from Postgres after a change signal.
begin;

create function pulse_private.signal_go_room_change()
returns trigger language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare room_id uuid;
begin
  if tg_table_name='go_sessions' then
    room_id := new.id;
  else
    room_id := new.session_id;
  end if;
  perform realtime.send(jsonb_build_object('changed',true),
    'changed','go-room-'||room_id::text,false);
  return new;
end
$function$;

create trigger signal_go_session_change
after insert or update on public.go_sessions
for each row execute function pulse_private.signal_go_room_change();

create trigger signal_go_participant_change
after insert or update on public.go_session_participants
for each row execute function pulse_private.signal_go_room_change();

revoke all on function pulse_private.signal_go_room_change()
from public,anon,authenticated,service_role;

commit;
