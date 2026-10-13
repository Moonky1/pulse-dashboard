begin;
select plan(7);
select ok(pulse_private.valid_pulse_schedule(config||jsonb_build_object('sound',sound)),sound||' allowed') from public.pulse_schedule_events cross join unnest(array['iphone_radar','reveille','alarm_effect']) sound where id='a1120000-0000-4000-8000-000000000001';
select ok(not pulse_private.valid_pulse_schedule(config||jsonb_build_object('sound','https://untrusted.example/a.mp3')),'Arbitrary audio URL rejected') from public.pulse_schedule_events limit 1;
select ok(not pulse_private.valid_pulse_schedule(config||jsonb_build_object('volume',101)),'Gain remains bounded') from public.pulse_schedule_events limit 1;
select ok(not pulse_private.valid_pulse_schedule(config||jsonb_build_object('duration_seconds',31)),'Duration remains bounded') from public.pulse_schedule_events limit 1;
select ok(to_regclass('public.pulse_schedule_notices_live_idx') is not null,'Live-notice recovery indexed');
select * from finish();
rollback;
