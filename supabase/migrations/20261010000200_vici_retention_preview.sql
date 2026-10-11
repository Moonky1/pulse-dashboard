-- Read-only retention simulation. No executor, DELETE, job or policy activation.
begin;
create function pulse_private.vici_retention_plan(requested_scope uuid,as_of_date date)
returns table(id uuid,report_date date,performance_generated_at timestamp,pause_generated_at timestamp,
  status text,performance_rows integer,pause_rows integer,decision text,reason text)
language sql stable security definer set search_path=pg_catalog as $$
  with observed as (
    select r.*,r.requested_from::date as source_date,
      r.id=h.active_run_id as active,
      exists(select 1 from public.vici_sync_runs d where d.duplicate_of=r.id) as referenced,
      r.requested_from=r.requested_from::date::timestamp and
        r.requested_to=r.requested_from::date::timestamp+interval '23:59:59' as full_day,
      r.performance_generated_at is not null and r.pause_generated_at is not null and
        r.performance_row_count=(select count(*) from public.vici_agent_performance_snapshots p where p.sync_run_id=r.id) and
        r.pause_row_count=(select count(*) from public.vici_agent_pause_snapshots p where p.sync_run_id=r.id) as complete_pair
    from public.vici_sync_runs r left join public.vici_integration_health h on h.scope_id=r.scope_id
    where r.scope_id=requested_scope
  ), ranked as (
    select o.id,
      row_number() over(partition by o.source_date order by o.performance_generated_at desc,o.pause_generated_at desc,o.completed_at desc,o.id) as daily_rank,
      row_number() over(order by o.source_date desc,o.performance_generated_at desc,o.pause_generated_at desc,o.completed_at desc,o.id) as latest_rank
    from observed o where o.status='success' and o.full_day and o.complete_pair
  ), reasons as (
    select o.*,case
      when o.status='running' or o.active then 'active_run'
      when o.status<>'success' then 'audit_metadata'
      when not o.full_day or not coalesce(o.complete_pair,false) then 'incomplete_pair'
      when o.source_date>as_of_date then 'future_date'
      when o.source_date>=as_of_date-6 then 'recent_detail'
      when o.source_date>=as_of_date-89 and k.daily_rank=1 then 'daily_close'
      when k.latest_rank=1 then 'latest_success'
      when o.referenced then 'duplicate_reference'
      when o.source_date<as_of_date-89 then 'expired_day'
      else 'intermediate_cut' end as why
    from observed o left join ranked k on k.id=o.id
  )
  select r.id,r.source_date,r.performance_generated_at,r.pause_generated_at,r.status,
    r.performance_row_count,r.pause_row_count,
    case when r.why in ('expired_day','intermediate_cut') then 'candidate'
      when r.why in ('recent_detail','daily_close') then 'retain'
      when r.why='audit_metadata' then 'metadata' else 'protected' end,r.why
  from reasons r;
$$;
revoke all on function pulse_private.vici_retention_plan(uuid,date) from public,anon,authenticated,service_role;

create function public.preview_vici_retention(requested_scope uuid,as_of_date date,page_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare result jsonb;
begin
  perform pulse_private.current_training_staff_user_id();
  if not public.can_import_vici_reports(requested_scope) or not pulse_private.vici_scope_reader(requested_scope) then
    raise exception 'Retention preview access denied' using errcode='42501';
  end if;
  if as_of_date is null or as_of_date not between date '1900-01-01' and date '2200-12-31'
    or page_offset is null or page_offset<0 or page_offset>1000000 then
    raise exception 'Invalid retention preview request' using errcode='22023';
  end if;
  with plan as materialized (select * from pulse_private.vici_retention_plan(requested_scope,as_of_date)),
  page as (select * from plan order by report_date desc,performance_generated_at desc nulls last,
    pause_generated_at desc nulls last,id limit 100 offset page_offset)
  select jsonb_build_object('scope_id',requested_scope,'as_of_date',as_of_date,'dry_run',true,'deletion_enabled',false,
    'source_time_zone',(select source_time_zone from public.vici_report_scopes where id=requested_scope),
    'policy',jsonb_build_object('detail_days',7,'daily_days',90,'recent_from',as_of_date-6,'daily_from',as_of_date-89),
    'totals',jsonb_build_object('versions',(select count(*) from plan),
      'retain',(select count(*) from plan where decision='retain'),
      'candidates',(select count(*) from plan where decision='candidate'),
      'protected',(select count(*) from plan where decision='protected'),
      'metadata',(select count(*) from plan where decision='metadata')),
    'offset',page_offset,'more',(select count(*) from plan)>page_offset+100,
    'rows',coalesce((select jsonb_agg(to_jsonb(p) order by report_date desc,performance_generated_at desc nulls last,
      pause_generated_at desc nulls last,id) from page p),'[]'::jsonb)) into result;
  return result;
end $$;
revoke all on function public.preview_vici_retention(uuid,date,integer) from public,anon,authenticated,service_role;
grant execute on function public.preview_vici_retention(uuid,date,integer) to authenticated;
commit;
