begin;
-- Public operational timetable and Admin notices, not public Agent identities.
create table public.pulse_schedule_notices (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null, sent_by uuid not null references public.users(id),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null, payload jsonb not null,
 unique(sent_by,request_id)
);
alter table public.pulse_schedule_notices enable row level security;
revoke all on public.pulse_schedule_notices from public,anon,authenticated,service_role;

create function public.get_public_pulse_schedule()
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('timezone','America/Los_Angeles','server_now',clock_timestamp(),
 'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'revision',revision,'config',config) order by config->>'start',id)
 from public.pulse_schedule_events where (config->>'enabled')::boolean),'[]'::jsonb));
$$;
create function public.get_public_pulse_notice(requested_id uuid)
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('id',id,'expires_at',expires_at,'payload',payload)
 from public.pulse_schedule_notices where id=requested_id and expires_at>clock_timestamp() and created_at<=clock_timestamp();
$$;
create function public.get_current_public_pulse_notices()
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select coalesce(jsonb_agg(jsonb_build_object('occurrence_id',id,'expires_at',expires_at)),'[]'::jsonb)
 from (select id,expires_at from public.pulse_schedule_notices where expires_at>clock_timestamp() and created_at<=clock_timestamp() order by created_at limit 10) n;
$$;
create function public.send_public_pulse_notice(requested_event_id uuid,requested_phase text,requested_request_id uuid,confirmed boolean)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor uuid; event public.pulse_schedule_events; notice public.pulse_schedule_notices; starts timestamptz; ends timestamptz; duration interval;
begin
 actor=pulse_private.require_global_permission('alerts.manage');
 if confirmed is distinct from true or requested_request_id is null or requested_phase is null or requested_phase not in ('pre','start','end') then raise exception 'Confirm the public audience' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(120004);
 select * into notice from public.pulse_schedule_notices where sent_by=actor and request_id=requested_request_id;
 if notice.id is not null then return jsonb_build_object('id',notice.id,'expires_at',notice.expires_at); end if;
 select * into event from public.pulse_schedule_events where id=requested_event_id and (config->>'enabled')::boolean;
 if event.id is null then raise exception 'Event unavailable' using errcode='P0002'; end if;
 if exists(select 1 from public.pulse_schedule_notices where created_at>clock_timestamp()-interval '30 seconds') then raise exception 'Wait before sending another alert' using errcode='55000'; end if;
 duration=(event.config->>'end')::time-(event.config->>'start')::time;
 starts=clock_timestamp()+case when requested_phase='pre' then (event.config->>'pre_minutes')::integer*interval '1 minute' when requested_phase='end' then -duration else interval '0 seconds' end;
 ends=case when requested_phase='end' then clock_timestamp() else starts+duration end;
 insert into public.pulse_schedule_notices(request_id,sent_by,expires_at,payload) values(requested_request_id,actor,clock_timestamp()+interval '90 seconds',
 jsonb_build_object('event',event.config,'phase',requested_phase,'start_at',starts,'end_at',ends,'timezone','America/Los_Angeles')) returning * into notice;
 perform realtime.send(jsonb_build_object('occurrence_id',notice.id,'expires_at',notice.expires_at),'notice','pulse-schedule-notices-v1',true);
 return jsonb_build_object('id',notice.id,'expires_at',notice.expires_at);
end $$;
create function public.list_public_pulse_notices()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
 perform pulse_private.require_global_permission('alerts.view');
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'scheduled_at',created_at,'phase',payload->>'phase','payload',payload)) from (select * from public.pulse_schedule_notices order by created_at desc limit 20)n),'[]'::jsonb);
end $$;
revoke all on function public.get_public_pulse_schedule(),public.get_public_pulse_notice(uuid),public.get_current_public_pulse_notices(),public.send_public_pulse_notice(uuid,text,uuid,boolean),public.list_public_pulse_notices() from public,anon,authenticated,service_role;
grant execute on function public.get_public_pulse_schedule(),public.get_public_pulse_notice(uuid),public.get_current_public_pulse_notices() to anon,authenticated;
grant execute on function public.send_public_pulse_notice(uuid,text,uuid,boolean),public.list_public_pulse_notices() to authenticated;

-- No login needed to READ this specific channel; nobody in a browser may SEND.
-- Separate the old anonymous guard so anon never invokes a Staff-only function.
drop policy pulse_alerts_guard on realtime.messages;
create policy pulse_alerts_guard on realtime.messages as restrictive for all to authenticated
 using(realtime.topic()<>'pulse-alerts-v1' or (extension='broadcast' and pulse_private.can_receive_pulse_alerts())) with check(realtime.topic()<>'pulse-alerts-v1');
create policy pulse_alerts_anonymous_guard on realtime.messages as restrictive for all to anon
 using(realtime.topic()<>'pulse-alerts-v1') with check(realtime.topic()<>'pulse-alerts-v1');
create policy public_schedule_receive on realtime.messages for select to anon,authenticated
 using(realtime.topic()='pulse-schedule-notices-v1' and extension='broadcast');
create policy public_schedule_send_guard on realtime.messages as restrictive for all to anon,authenticated
 using(realtime.topic()<>'pulse-schedule-notices-v1' or extension='broadcast') with check(realtime.topic()<>'pulse-schedule-notices-v1');
create function pulse_private.public_schedule_changed()
returns trigger language plpgsql security definer set search_path=pg_catalog as $$
begin
 perform realtime.send(jsonb_build_object('changed',true),'schedule_changed','pulse-schedule-notices-v1',true);
 return null;
end $$;
revoke all on function pulse_private.public_schedule_changed() from public,anon,authenticated,service_role;
create trigger public_schedule_changed after insert or update or delete on public.pulse_schedule_events for each statement execute function pulse_private.public_schedule_changed();

-- This corrected public tab has manual Admin notices, not Agent tracking/jobs.
update public.pulse_alert_settings set enabled=false where singleton=true;
do $$ declare job record; begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  for job in execute 'select jobid from cron.job where jobname=$1' using 'pulse-alerts-v1-'||current_database() loop
   execute 'select cron.unschedule($1)' using job.jobid;
  end loop;
 end if;
end $$;
commit;
