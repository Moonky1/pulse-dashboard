-- Shared alert configuration only. No thresholds activated, report writes or jobs.
begin;
create function pulse_private.valid_vici_alert_rules(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare item jsonb; keys text[]; expected text[]=array['talk_avg','dead_avg','dispo_avg','break','callback','lunch','rr','tech'];
begin
  if jsonb_typeof(value) is distinct from 'array' then return false; end if;
  if jsonb_array_length(value)<>8 then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if not (item ?& array['id','enabled','threshold_seconds']) or item-array['id','enabled','threshold_seconds']<>'{}'::jsonb
      or jsonb_typeof(item->'id') is distinct from 'string'
      or not (item->>'id'=any(expected)) or jsonb_typeof(item->'enabled') is distinct from 'boolean' then return false; end if;
    keys=array_append(keys,item->>'id');
    if item->'threshold_seconds'='null'::jsonb then
      if (item->>'enabled')::boolean then return false; end if;
    elsif jsonb_typeof(item->'threshold_seconds') is distinct from 'number' then return false;
    elsif (item->>'threshold_seconds')::numeric<0 or (item->>'threshold_seconds')::numeric>31536000
      or trunc((item->>'threshold_seconds')::numeric)<>(item->>'threshold_seconds')::numeric then return false;
    end if;
  end loop;
  return (select count(distinct k)=8 from unnest(keys) k);
end $$;
revoke all on function pulse_private.valid_vici_alert_rules(jsonb) from public,anon,authenticated,service_role;

create function pulse_private.default_vici_alert_rules()
returns jsonb language sql immutable set search_path=pg_catalog as $$
  select jsonb_agg(jsonb_build_object('id',k,'enabled',false,'threshold_seconds',null) order by k)
  from unnest(array['talk_avg','dead_avg','dispo_avg','break','callback','lunch','rr','tech']) k;
$$;
revoke all on function pulse_private.default_vici_alert_rules() from public,anon,authenticated,service_role;

-- Every save is an immutable version and audit entry. No mutable current-row cache.
create table public.vici_alert_rule_versions (
  scope_id uuid not null references public.vici_report_scopes(id),
  revision integer not null check(revision>0),
  rules jsonb not null check(pulse_private.valid_vici_alert_rules(rules)),
  changed_by uuid not null references public.users(id),
  changed_by_name text not null,
  changed_at timestamptz not null default clock_timestamp(),
  primary key(scope_id,revision)
);
alter table public.vici_alert_rule_versions enable row level security;
revoke all on public.vici_alert_rule_versions from public,anon,authenticated,service_role;

create function pulse_private.require_vici_alert_reader(requested_scope uuid)
returns void language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  perform pulse_private.current_training_staff_user_id();
  if not exists(select 1 from public.vici_report_scopes where id=requested_scope and enabled)
    or not pulse_private.vici_scope_reader(requested_scope) then
    raise exception 'Alert rules access denied' using errcode='42501';
  end if;
end $$;
revoke all on function pulse_private.require_vici_alert_reader(uuid) from public,anon,authenticated,service_role;

create function public.get_vici_alert_rules(requested_scope uuid)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare v public.vici_alert_rule_versions;
begin
  perform pulse_private.require_vici_alert_reader(requested_scope);
  select * into v from public.vici_alert_rule_versions where scope_id=requested_scope order by revision desc limit 1;
  return jsonb_build_object('scope_id',requested_scope,'schema_version',1,'revision',coalesce(v.revision,0),
    'rules',coalesce(v.rules,pulse_private.default_vici_alert_rules()),'changed_at',v.changed_at,
    'changed_by_name',v.changed_by_name,'can_manage',public.can_import_vici_reports(requested_scope));
end $$;
revoke all on function public.get_vici_alert_rules(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_vici_alert_rules(uuid) to authenticated;

create function public.save_vici_alert_rules(requested_scope uuid,expected_revision integer,requested_rules jsonb)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare actor uuid; previous public.vici_alert_rule_versions; canonical jsonb;
begin
  perform pulse_private.require_vici_alert_reader(requested_scope);
  actor=pulse_private.vici_import_actor(auth.uid());
  if actor is null then raise exception 'Alert rules edit denied' using errcode='42501'; end if;
  if expected_revision is null or expected_revision<0 or expected_revision>=2147483647
    or not pulse_private.valid_vici_alert_rules(requested_rules) then
    raise exception 'Invalid alert configuration' using errcode='22023';
  end if;
  -- Serialize first and later saves for this scope. No report/collector lease is touched.
  perform 1 from public.vici_report_scopes where id=requested_scope and enabled for update;
  if not found then raise exception 'Alert rules access denied' using errcode='42501'; end if;
  -- A waiting writer must revalidate permissions after acquiring the lock.
  perform pulse_private.require_vici_alert_reader(requested_scope);
  actor=pulse_private.vici_import_actor(auth.uid());
  if actor is null then raise exception 'Alert rules edit denied' using errcode='42501'; end if;
  select * into previous from public.vici_alert_rule_versions where scope_id=requested_scope order by revision desc limit 1;
  if coalesce(previous.revision,0)<>expected_revision then
    raise exception 'Alert configuration changed; reload before saving' using errcode='40001';
  end if;
  select jsonb_agg(item order by item->>'id') into canonical from jsonb_array_elements(requested_rules) item;
  if canonical is distinct from coalesce(previous.rules,pulse_private.default_vici_alert_rules()) then
    insert into public.vici_alert_rule_versions(scope_id,revision,rules,changed_by,changed_by_name)
      select requested_scope,expected_revision+1,canonical,actor,coalesce(u.full_name,'Staff administrator') from public.users u where u.id=actor;
  end if;
  return public.get_vici_alert_rules(requested_scope);
end $$;
revoke all on function public.save_vici_alert_rules(uuid,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.save_vici_alert_rules(uuid,integer,jsonb) to authenticated;

create function public.list_vici_alert_rule_history(requested_scope uuid,before_revision integer default null)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  perform pulse_private.require_vici_alert_reader(requested_scope);
  if before_revision is not null and before_revision<1 then raise exception 'Invalid history cursor' using errcode='22023'; end if;
  return coalesce((select jsonb_agg(to_jsonb(v) order by revision desc) from
    (select revision,rules,changed_at,changed_by_name from public.vici_alert_rule_versions
      where scope_id=requested_scope and (before_revision is null or revision<before_revision)
      order by revision desc limit 20) v),'[]'::jsonb);
end $$;
revoke all on function public.list_vici_alert_rule_history(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.list_vici_alert_rule_history(uuid,integer) to authenticated;
commit;
