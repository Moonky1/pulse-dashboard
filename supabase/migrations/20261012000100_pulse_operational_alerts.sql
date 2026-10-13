-- ALERTS-1 backend. Additive; dispatch remains OFF. No real identities are seeded.
begin;

insert into public.permissions(key,description) values
 ('alerts.manage','Manage the global Pulse operational schedule and alarm settings.'),
 ('alerts.view','Read global Pulse operational alarm delivery reports.')
on conflict(key) do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.key='super_admin' and p.key in ('alerts.manage','alerts.view')
on conflict do nothing;

create table public.pulse_alert_settings (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 environment text not null default 'preview' check(environment='preview')
);
insert into public.pulse_alert_settings default values;

create function pulse_private.valid_pulse_schedule(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare day jsonb; seconds integer;
begin
 if jsonb_typeof(value) is distinct from 'object' or
 not(value ?& array['name','type','start','end','days','timezone','enabled','pre_enabled','start_enabled','end_enabled','pre_minutes','sound','volume','duration_seconds','repeat']) or
 value-array['name','type','start','end','days','timezone','enabled','pre_enabled','start_enabled','end_enabled','pre_minutes','sound','volume','duration_seconds','repeat']<>'{}'::jsonb then return false; end if;
 if exists(select 1 from unnest(array['name','type','start','end','timezone','sound']) k where jsonb_typeof(value->k) is distinct from 'string') then return false; end if;
 if length(btrim(value->>'name')) not between 1 and 80
 or value->>'type' not in ('shift','break','lunch','custom') or value->>'timezone'<>'America/Los_Angeles'
 or value->>'start' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or value->>'end' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or (value->>'end')::time <= (value->>'start')::time
 or jsonb_typeof(value->'days')<>'array' or jsonb_array_length(value->'days') not between 1 and 7 then return false; end if;
 for day in select * from jsonb_array_elements(value->'days') loop
  if jsonb_typeof(day)<>'number' or day::text !~ '^[1-7]$' then return false; end if;
 end loop;
 if (select count(distinct d) from jsonb_array_elements(value->'days') d)<>jsonb_array_length(value->'days') then return false; end if;
 if exists(select 1 from unnest(array['enabled','pre_enabled','start_enabled','end_enabled']) k where jsonb_typeof(value->k) is distinct from 'boolean') then return false; end if;
 if exists(select 1 from unnest(array['pre_minutes','volume','duration_seconds','repeat']) k where jsonb_typeof(value->k) is distinct from 'number' or (value->>k) !~ '^[0-9]+$') then return false; end if;
 seconds=(value->>'duration_seconds')::integer;
 return (value->>'pre_minutes')::integer between 1 and 30 and (value->>'volume')::integer between 0 and 100
  and seconds between 1 and 15 and (value->>'repeat')::integer between 1 and 3
  and seconds*(value->>'repeat')::integer<=30
  and value->>'sound' in ('emergency_pulse','double_alert','shift_bell','critical_alarm');
exception when others then return false;
end $$;

create table public.pulse_schedule_events (
 id uuid primary key default gen_random_uuid(),
 revision integer not null default 1 check(revision>0),
 config jsonb not null check(pulse_private.valid_pulse_schedule(config)),
 updated_by uuid references public.users(id),
 updated_at timestamptz not null default clock_timestamp()
);
create table public.pulse_schedule_versions (
 event_id uuid not null references public.pulse_schedule_events(id),
 revision integer not null, config jsonb not null,
 changed_by uuid references public.users(id), changed_at timestamptz not null default clock_timestamp(),
 primary key(event_id,revision)
);

insert into public.pulse_schedule_events(id,config)
select id::uuid,jsonb_build_object('name',name,'type',kind,'start',starts,'end',ends,'days',days,'timezone','America/Los_Angeles',
 'enabled',true,'pre_enabled',true,'start_enabled',true,'end_enabled',true,'pre_minutes',5,
 'sound','shift_bell','volume',60,'duration_seconds',4,'repeat',1)
from (values
 ('a1120000-0000-4000-8000-000000000001','Weekday shift','shift','06:45','17:00','[1,2,3,4,5]'::jsonb),
 ('a1120000-0000-4000-8000-000000000002','Break 1','break','09:00','09:15','[1,2,3,4,5]'::jsonb),
 ('a1120000-0000-4000-8000-000000000003','Lunch','lunch','12:00','13:00','[1,2,3,4,5]'::jsonb),
 ('a1120000-0000-4000-8000-000000000004','Break 2','break','14:30','14:40','[1,2,3,4,5]'::jsonb),
 ('a1120000-0000-4000-8000-000000000005','Saturday shift','shift','08:45','14:00','[6]'::jsonb)
) seed(id,name,kind,starts,ends,days);
insert into public.pulse_schedule_versions(event_id,revision,config) select id,revision,config from public.pulse_schedule_events;

-- Ephemeral server-observed leases, not permanent heartbeat/attendance history.
-- Renew once per 120s and on reconnect; expire after 180s. Crash => unknown/offline.
create unlogged table pulse_private.pulse_alert_leases (
 id uuid primary key default gen_random_uuid(),
 connection_id uuid not null,
 session_hash text not null references public.agent_sessions(token_hash) on delete cascade,
 agent_id uuid not null references public.agents(id) on delete cascade,
 connected_at timestamptz not null, observed_at timestamptz not null, expires_at timestamptz not null,
 unique(session_hash,connection_id)
);
create index pulse_alert_leases_agent_idx on pulse_private.pulse_alert_leases(agent_id,expires_at);
create table public.pulse_alert_occurrences (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.pulse_schedule_events(id),
 event_revision integer not null,
 pacific_date date not null, phase text not null check(phase in ('pre','start','end')),
 scheduled_at timestamptz not null, created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null, payload jsonb not null,
 unique(event_id,pacific_date,phase)
);
create table public.pulse_alert_deliveries (
 occurrence_id uuid not null references public.pulse_alert_occurrences(id),
 agent_id uuid not null references public.agents(id),
 agent_code text not null, agent_name text not null, team_name text not null,
 pulse_open boolean not null, presence_observed_at timestamptz,
 claimed_lease uuid, claim_request uuid,
 received_at timestamptz, visual_at timestamptz, sound_at timestamptz, blocked_at timestamptz,
 primary key(occurrence_id,agent_id),
 check(not(sound_at is not null and blocked_at is not null))
);

alter table public.pulse_alert_settings enable row level security;
alter table public.pulse_schedule_events enable row level security;
alter table public.pulse_schedule_versions enable row level security;
alter table pulse_private.pulse_alert_leases enable row level security;
alter table public.pulse_alert_occurrences enable row level security;
alter table public.pulse_alert_deliveries enable row level security;
revoke all on public.pulse_alert_settings,public.pulse_schedule_events,public.pulse_schedule_versions,
 pulse_private.pulse_alert_leases,public.pulse_alert_occurrences,public.pulse_alert_deliveries from public,anon,authenticated,service_role;

create function pulse_private.pulse_schedule_payload()
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select jsonb_build_object('timezone','America/Los_Angeles','server_now',clock_timestamp(),
  'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'revision',revision,'config',config) order by config->>'start',id)
   from public.pulse_schedule_events),'[]'::jsonb));
$$;
create function public.get_pulse_schedule()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
 perform pulse_private.current_training_staff_user_id();
 return pulse_private.pulse_schedule_payload();
end $$;
create function public.agent_get_pulse_schedule(requested_agent_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
 if not exists(select 1 from public.agents a join public.teams t on t.id=a.team_id and t.is_active where a.id=requested_agent_id and a.status='active') then raise exception 'Agent access denied' using errcode='42501'; end if;
 return pulse_private.pulse_schedule_payload();
end $$;
create function public.save_pulse_schedule_event(requested_id uuid,expected_revision integer,requested_config jsonb)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor uuid; saved public.pulse_schedule_events;
begin
 actor=pulse_private.require_global_permission('alerts.manage');
 if requested_id is null or expected_revision is null or expected_revision<0 or not pulse_private.valid_pulse_schedule(requested_config) then raise exception 'Invalid schedule event' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(requested_id::text,12));
 select * into saved from public.pulse_schedule_events where id=requested_id for update;
 if coalesce(saved.revision,0)<>expected_revision then raise exception 'Schedule changed' using errcode='40001'; end if;
 if saved.id is null then
  if (select count(*) from public.pulse_schedule_events)>=100 then raise exception 'Schedule limit reached' using errcode='22023'; end if;
  insert into public.pulse_schedule_events(id,config,updated_by) values(requested_id,requested_config,actor) returning * into saved;
 else
  update public.pulse_schedule_events set revision=revision+1,config=requested_config,updated_by=actor,updated_at=clock_timestamp() where id=requested_id returning * into saved;
 end if;
 insert into public.pulse_schedule_versions(event_id,revision,config,changed_by) values(saved.id,saved.revision,saved.config,actor);
 perform realtime.send(jsonb_build_object('changed',true),'schedule_changed','pulse-alerts-v1',true);
 return jsonb_build_object('id',saved.id,'revision',saved.revision,'config',saved.config);
end $$;

create function pulse_private.require_pulse_alert_session(requested_hash text)
returns uuid language plpgsql stable security definer set search_path=pg_catalog as $$
declare agent uuid;
begin
 select a.id into agent from public.agent_sessions s join public.agents a on a.id=s.agent_id and a.status='active'
 join public.teams t on t.id=a.team_id and t.is_active
 where s.token_hash=requested_hash and s.expires_at>clock_timestamp() and s.revoked_at is null;
 if agent is null then raise exception 'Agent session unavailable' using errcode='28000'; end if;
 return agent;
end $$;
create function public.agent_open_pulse_alert_connection(requested_session_hash text,requested_connection_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare agent uuid; lease pulse_private.pulse_alert_leases;
begin
 agent=pulse_private.require_pulse_alert_session(requested_session_hash);
 if requested_connection_id is null then raise exception 'Connection required' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(requested_session_hash,13));
 delete from pulse_private.pulse_alert_leases where expires_at<clock_timestamp()-interval '5 minutes';
 if (select count(*) from pulse_private.pulse_alert_leases where session_hash=requested_session_hash and expires_at>clock_timestamp())>=8
 and not exists(select 1 from pulse_private.pulse_alert_leases where session_hash=requested_session_hash and connection_id=requested_connection_id) then raise exception 'Too many connections' using errcode='22023'; end if;
 insert into pulse_private.pulse_alert_leases(connection_id,session_hash,agent_id,connected_at,observed_at,expires_at)
 values(requested_connection_id,requested_session_hash,agent,clock_timestamp(),clock_timestamp(),clock_timestamp()+interval '180 seconds')
 on conflict(session_hash,connection_id) do update set connected_at=case when pulse_private.pulse_alert_leases.expires_at<=clock_timestamp() then excluded.connected_at else pulse_private.pulse_alert_leases.connected_at end,
 observed_at=excluded.observed_at,expires_at=excluded.expires_at returning * into lease;
 return jsonb_build_object('lease_id',lease.id,'expires_at',lease.expires_at,'refresh_after_seconds',120,'topic','pulse-alerts-v1');
end $$;
create function public.agent_close_pulse_alert_connection(requested_session_hash text,requested_lease_id uuid)
returns void language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 perform pulse_private.require_pulse_alert_session(requested_session_hash);
 delete from pulse_private.pulse_alert_leases where id=requested_lease_id and session_hash=requested_session_hash;
end $$;

-- JWT sub is a random lease ID, never a Staff Auth UID. Read-only broadcast scope.
create function pulse_private.can_receive_pulse_alerts()
returns boolean language sql stable security definer set search_path=pg_catalog as $$
 select exists(select 1 from pulse_private.pulse_alert_leases l
 join public.agent_sessions s on s.token_hash=l.session_hash and s.revoked_at is null and s.expires_at>clock_timestamp()
 join public.agents a on a.id=l.agent_id and a.status='active'
 join public.teams t on t.id=a.team_id and t.is_active
 where l.id=auth.uid() and l.id::text=auth.jwt()->>'pulse_alert_lease' and l.expires_at>clock_timestamp());
$$;
create policy pulse_alerts_receive on realtime.messages for select to authenticated
 using(realtime.topic()='pulse-alerts-v1' and extension='broadcast' and pulse_private.can_receive_pulse_alerts());
-- Restrictive guard prevents any broader existing policy granting alert send rights.
create policy pulse_alerts_guard on realtime.messages as restrictive for all to anon,authenticated
 using(realtime.topic()<>'pulse-alerts-v1' or (extension='broadcast' and pulse_private.can_receive_pulse_alerts()))
 with check(realtime.topic()<>'pulse-alerts-v1');

create function pulse_private.collect_pulse_alerts(at_time timestamptz)
returns integer language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.pulse_schedule_events; day date; starts timestamptz; ends timestamptz; due timestamptz;
 alarm_phase text; occurrence uuid; fired integer=0;
begin
 if not exists(select 1 from public.pulse_alert_settings where enabled and environment='preview') then return 0; end if;
 perform pg_advisory_xact_lock(120001);
 for day in select d::date from generate_series((at_time at time zone 'America/Los_Angeles')::date-1,(at_time at time zone 'America/Los_Angeles')::date+1,interval '1 day') d loop
  for e in select * from public.pulse_schedule_events where (config->>'enabled')::boolean loop
   if not exists(select 1 from jsonb_array_elements_text(e.config->'days') d where d::integer=extract(isodow from day)::integer) then continue; end if;
   starts=(day+(e.config->>'start')::time) at time zone 'America/Los_Angeles';
   ends=(day+(e.config->>'end')::time) at time zone 'America/Los_Angeles';
   for alarm_phase in select unnest(array['pre','start','end']) loop
    if not (e.config->>(alarm_phase||'_enabled'))::boolean then continue; end if;
    due=case alarm_phase when 'pre' then starts-(e.config->>'pre_minutes')::integer*interval '1 minute' when 'start' then starts else ends end;
    if due>at_time or due<=at_time-interval '90 seconds' then continue; end if;
    occurrence=null;
    insert into public.pulse_alert_occurrences(event_id,event_revision,pacific_date,phase,scheduled_at,expires_at,payload)
    values(e.id,e.revision,day,alarm_phase,due,due+interval '90 seconds',jsonb_build_object('event',e.config,'phase',alarm_phase,'start_at',starts,'end_at',ends,'scheduled_at',due,'timezone','America/Los_Angeles'))
    on conflict(event_id,pacific_date,phase) do nothing returning id into occurrence;
    if occurrence is null then continue; end if;
    insert into public.pulse_alert_deliveries(occurrence_id,agent_id,agent_code,agent_name,team_name,pulse_open,presence_observed_at)
    select occurrence,a.id,a.agent_code,a.display_name,t.name,coalesce(p.observed_at>=due-interval '180 seconds' and p.observed_at<=at_time,false),p.observed_at
    from public.agents a join public.teams t on t.id=a.team_id and t.is_active
    left join lateral(select max(l.observed_at) observed_at from pulse_private.pulse_alert_leases l
     join public.agent_sessions s on s.token_hash=l.session_hash and s.revoked_at is null and s.expires_at>at_time
     where l.agent_id=a.id and l.connected_at<=due and l.expires_at>at_time) p on true where a.status='active';
    perform realtime.send(jsonb_build_object('occurrence_id',occurrence,'expires_at',due+interval '90 seconds'),'alarm','pulse-alerts-v1',true);
    fired=fired+1;
   end loop;
  end loop;
 end loop;
 return fired;
end $$;
create function public.pulse_alert_scheduler_tick()
returns integer language sql volatile security definer set search_path=pg_catalog as $$
 select pulse_private.collect_pulse_alerts(clock_timestamp());
$$;

create function public.agent_claim_pulse_alert(requested_session_hash text,requested_lease_id uuid,requested_occurrence_id uuid,requested_request_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare agent uuid; o public.pulse_alert_occurrences; d public.pulse_alert_deliveries;
begin
 agent=pulse_private.require_pulse_alert_session(requested_session_hash);
 if requested_request_id is null or not exists(select 1 from pulse_private.pulse_alert_leases where id=requested_lease_id and agent_id=agent and session_hash=requested_session_hash and expires_at>clock_timestamp()) then raise exception 'Connection unavailable' using errcode='42501'; end if;
 select * into o from public.pulse_alert_occurrences where id=requested_occurrence_id and expires_at>clock_timestamp() and scheduled_at<=clock_timestamp();
 if o.id is null then return null; end if;
 select * into d from public.pulse_alert_deliveries where occurrence_id=o.id and agent_id=agent for update;
 if not found or (d.claimed_lease is not null and (d.claimed_lease<>requested_lease_id or d.claim_request<>requested_request_id)) then return null; end if;
 -- Only a lease observed before the occurrence can claim it. Late opens see schedule only.
 if not exists(select 1 from pulse_private.pulse_alert_leases where id=requested_lease_id and connected_at<=o.scheduled_at) then return null; end if;
 update public.pulse_alert_deliveries set claimed_lease=requested_lease_id,claim_request=requested_request_id,received_at=coalesce(received_at,clock_timestamp()) where occurrence_id=o.id and agent_id=agent;
 return jsonb_build_object('id',o.id,'expires_at',o.expires_at,'payload',o.payload);
end $$;
create function public.agent_record_pulse_alert_receipt(requested_session_hash text,requested_lease_id uuid,requested_occurrence_id uuid,requested_state text)
returns void language plpgsql volatile security definer set search_path=pg_catalog as $$
declare agent uuid; d public.pulse_alert_deliveries;
begin
 agent=pulse_private.require_pulse_alert_session(requested_session_hash);
 if requested_state is null or requested_state not in ('visual_displayed','sound_started','audio_blocked') then raise exception 'Invalid receipt' using errcode='22023'; end if;
 if not exists(select 1 from pulse_private.pulse_alert_leases where id=requested_lease_id and session_hash=requested_session_hash and expires_at>clock_timestamp()) then raise exception 'Connection unavailable' using errcode='42501'; end if;
 select * into d from public.pulse_alert_deliveries where occurrence_id=requested_occurrence_id and agent_id=agent and claimed_lease=requested_lease_id and received_at is not null for update;
 if not found or not exists(select 1 from public.pulse_alert_occurrences where id=requested_occurrence_id and expires_at+interval '30 seconds'>clock_timestamp()) then raise exception 'Receipt unavailable' using errcode='42501'; end if;
 if requested_state<>'visual_displayed' and d.visual_at is null then raise exception 'Visual receipt required' using errcode='22023'; end if;
 if (requested_state='sound_started' and d.blocked_at is not null) or (requested_state='audio_blocked' and d.sound_at is not null) then raise exception 'Audio outcome already recorded' using errcode='40001'; end if;
 update public.pulse_alert_deliveries set
 visual_at=case when requested_state='visual_displayed' then coalesce(visual_at,clock_timestamp()) else visual_at end,
 sound_at=case when requested_state='sound_started' then coalesce(sound_at,clock_timestamp()) else sound_at end,
 blocked_at=case when requested_state='audio_blocked' then coalesce(blocked_at,clock_timestamp()) else blocked_at end
 where occurrence_id=requested_occurrence_id and agent_id=agent;
end $$;

create function public.get_pulse_alert_report(requested_occurrence_id uuid,requested_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare o public.pulse_alert_occurrences; response jsonb;
begin
 perform pulse_private.require_global_permission('alerts.view');
 if requested_offset is null or requested_offset<0 or requested_offset>100000 then raise exception 'Invalid page' using errcode='22023'; end if;
 select * into o from public.pulse_alert_occurrences where id=requested_occurrence_id;
 if not found then raise exception 'Alarm unavailable' using errcode='P0002'; end if;
 select jsonb_build_object('targeted',count(*),'pulse_open',count(*) filter(where pulse_open),'client_received',count(received_at),
 'visual_displayed',count(visual_at),'sound_started',count(sound_at),'audio_blocked',count(blocked_at),
 'no_active_pulse_session',count(*) filter(where not pulse_open and received_at is null),
 'unknown',count(*) filter(where pulse_open and received_at is null)) into response from public.pulse_alert_deliveries where occurrence_id=o.id;
 return jsonb_build_object('occurrence',to_jsonb(o),'counts',response,'agents',coalesce((select jsonb_agg(to_jsonb(r)) from
 (select agent_code,agent_name,team_name,pulse_open,presence_observed_at,received_at,visual_at,sound_at,blocked_at
 from public.pulse_alert_deliveries where occurrence_id=o.id order by agent_code limit 50 offset requested_offset) r),'[]'::jsonb));
end $$;
create function public.list_pulse_alert_occurrences(requested_limit integer default 20)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
 perform pulse_private.require_global_permission('alerts.view');
 if requested_limit is null or requested_limit not between 1 and 50 then raise exception 'Invalid limit' using errcode='22023'; end if;
 return coalesce((select jsonb_agg(to_jsonb(r)) from (select id,event_id,pacific_date,phase,scheduled_at,payload from public.pulse_alert_occurrences order by scheduled_at desc,id limit requested_limit) r),'[]'::jsonb);
end $$;

-- Explicit Preview operator activation, never scheduled by migration or UI save.
create function public.activate_preview_pulse_alert_scheduler()
returns void language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 if auth.jwt()->>'ref' is distinct from 'sgshbawggqapuyqzkyhs' then raise exception 'Isolated Pulse Preview credential required' using errcode='42501'; end if;
 if not exists(select 1 from pg_extension where extname='pg_cron') then raise exception 'pg_cron unavailable' using errcode='55000'; end if;
 if not exists(select 1 from public.pulse_alert_settings where environment='preview') then raise exception 'Preview only' using errcode='42501'; end if;
 execute 'select cron.schedule_in_database($1,$2,$3,$4)' using 'pulse-alerts-v1-'||current_database(),'* * * * *','select public.pulse_alert_scheduler_tick();',current_database();
 update public.pulse_alert_settings set enabled=true;
end $$;

-- No browser can execute service Agent/scheduler methods, or raw tables.
revoke all on function pulse_private.valid_pulse_schedule(jsonb),pulse_private.pulse_schedule_payload(),pulse_private.require_pulse_alert_session(text),pulse_private.collect_pulse_alerts(timestamptz) from public,anon,authenticated,service_role;
revoke all on function pulse_private.can_receive_pulse_alerts() from public,anon,authenticated,service_role;
grant execute on function pulse_private.can_receive_pulse_alerts() to authenticated;
revoke all on function public.get_pulse_schedule(),public.save_pulse_schedule_event(uuid,integer,jsonb),public.get_pulse_alert_report(uuid,integer),public.list_pulse_alert_occurrences(integer) from public,anon,authenticated,service_role;
grant execute on function public.get_pulse_schedule(),public.save_pulse_schedule_event(uuid,integer,jsonb),public.get_pulse_alert_report(uuid,integer),public.list_pulse_alert_occurrences(integer) to authenticated;
revoke all on function public.agent_get_pulse_schedule(uuid),public.agent_open_pulse_alert_connection(text,uuid),public.agent_close_pulse_alert_connection(text,uuid),public.agent_claim_pulse_alert(text,uuid,uuid,uuid),public.agent_record_pulse_alert_receipt(text,uuid,uuid,text),public.pulse_alert_scheduler_tick(),public.activate_preview_pulse_alert_scheduler() from public,anon,authenticated,service_role;
grant execute on function public.agent_get_pulse_schedule(uuid),public.agent_open_pulse_alert_connection(text,uuid),public.agent_close_pulse_alert_connection(text,uuid),public.agent_claim_pulse_alert(text,uuid,uuid,uuid),public.agent_record_pulse_alert_receipt(text,uuid,uuid,text),public.pulse_alert_scheduler_tick(),public.activate_preview_pulse_alert_scheduler() to service_role;
commit;
