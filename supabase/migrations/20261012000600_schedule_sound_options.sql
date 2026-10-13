begin;
create or replace function pulse_private.valid_pulse_schedule(value jsonb)
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
  and value->>'sound' in ('emergency_pulse','double_alert','shift_bell','critical_alarm','iphone_radar','reveille','alarm_effect');
exception when others then return false;
end $$;
create index pulse_schedule_notices_live_idx on public.pulse_schedule_notices(expires_at,created_at);
commit;
