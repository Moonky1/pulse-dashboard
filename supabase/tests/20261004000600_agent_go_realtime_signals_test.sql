begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select ok(exists(select 1 from pg_trigger where tgrelid='public.go_sessions'::regclass
  and tgname='signal_go_session_change' and not tgisinternal),
  'GO session changes send a room signal');
select ok(exists(select 1 from pg_trigger where tgrelid='public.go_session_participants'::regclass
  and tgname='signal_go_participant_change' and not tgisinternal),
  'GO participant changes send a room signal');
select ok(not has_function_privilege('anon','pulse_private.signal_go_room_change()','EXECUTE'),
  'anonymous browser cannot call the room-signal function');
select ok(not has_function_privilege('authenticated','pulse_private.signal_go_room_change()','EXECUTE'),
  'Staff browser cannot call the room-signal function directly');
select ok(strpos(pg_get_functiondef('pulse_private.signal_go_room_change()'::regprocedure),
  'jsonb_build_object(''changed'',true)')>0,
  'signal payload is a data-free changed flag');

select * from finish();
rollback;
