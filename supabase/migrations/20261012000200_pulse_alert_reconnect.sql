begin;
-- A bounded reconnect read, never a schedule poll or an independent scheduler.
create function public.agent_pending_pulse_alerts(requested_session_hash text,requested_lease_id uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare agent uuid; connected timestamptz;
begin
 agent=pulse_private.require_pulse_alert_session(requested_session_hash);
 select connected_at into connected from pulse_private.pulse_alert_leases where id=requested_lease_id and agent_id=agent and session_hash=requested_session_hash and expires_at>clock_timestamp();
 if connected is null then raise exception 'Connection unavailable' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('occurrence_id',id,'expires_at',expires_at)) from (
  select o.id,o.expires_at from public.pulse_alert_occurrences o join public.pulse_alert_deliveries d on d.occurrence_id=o.id
  where d.agent_id=agent and d.claimed_lease is null and o.scheduled_at>=connected and o.scheduled_at<=clock_timestamp() and o.expires_at>clock_timestamp()
  order by o.scheduled_at limit 10
 ) pending),'[]'::jsonb);
end $$;
revoke all on function public.agent_pending_pulse_alerts(text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.agent_pending_pulse_alerts(text,uuid) to service_role;
commit;
