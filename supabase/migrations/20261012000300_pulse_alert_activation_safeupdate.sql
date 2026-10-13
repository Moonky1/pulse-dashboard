begin;
-- Keep safeupdate enabled: even the single settings row is addressed explicitly.
create or replace function public.activate_preview_pulse_alert_scheduler()
returns void language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
 if auth.jwt()->>'ref' is distinct from 'sgshbawggqapuyqzkyhs' then raise exception 'Isolated Pulse Preview credential required' using errcode='42501'; end if;
 if not exists(select 1 from pg_extension where extname='pg_cron') then raise exception 'pg_cron unavailable' using errcode='55000'; end if;
 if not exists(select 1 from public.pulse_alert_settings where singleton=true and environment='preview') then raise exception 'Preview only' using errcode='42501'; end if;
 execute 'select cron.schedule_in_database($1,$2,$3,$4)' using 'pulse-alerts-v1-'||current_database(),'* * * * *','select public.pulse_alert_scheduler_tick();',current_database();
 update public.pulse_alert_settings set enabled=true where singleton=true and environment='preview';
end $$;
revoke all on function public.activate_preview_pulse_alert_scheduler() from public,anon,authenticated,service_role;
grant execute on function public.activate_preview_pulse_alert_scheduler() to service_role;
commit;
