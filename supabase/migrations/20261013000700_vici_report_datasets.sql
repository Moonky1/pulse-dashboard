-- Campaign selections are explicitly attested by the uploader: these CSVs
-- contain no campaign column. Dataset identity is server-owned and immutable.
-- Existing reports, roles, users, scope definitions and read checks are retained.
begin;
create table pulse_private.vici_report_datasets (
  scope_id uuid primary key references public.vici_report_scopes(id),
  parent_scope_id uuid not null references public.vici_report_scopes(id),
  kind text not null check(kind in ('general','run_test')),
  identity_hash text not null unique check(identity_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
alter table pulse_private.vici_report_datasets enable row level security;
revoke all on pulse_private.vici_report_datasets from public,anon,authenticated,service_role;

create function public.import_vici_dataset(requested_scope uuid,report_date date,actor_auth_id uuid,
  pair jsonb,verification jsonb,requested_campaigns text[],requested_kind text)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare
  source public.vici_report_scopes; selected_campaigns text[]; observed_groups text[];
  selected_groups text[]; expected_groups text[]; fingerprint text; target uuid;
  label_prefix text; group_label text; campaign_label text; result jsonb;
begin
  if not pulse_private.vici_actor_scope_reader(actor_auth_id,requested_scope) then
    raise exception 'Import access denied' using errcode='42501';
  end if;
  select * into source from public.vici_report_scopes where id=requested_scope and enabled;
  if not found or exists(select 1 from pulse_private.vici_report_datasets where scope_id=requested_scope)
    or requested_kind is null or requested_kind not in ('general','run_test')
    or requested_campaigns is null or cardinality(requested_campaigns) not between 1 and 100
    or array_position(requested_campaigns,null) is not null
    or not requested_campaigns <@ source.campaigns then
    raise exception 'Invalid report selection' using errcode='22023';
  end if;
  select array_agg(distinct c order by c) into selected_campaigns from unnest(requested_campaigns) c;
  if cardinality(selected_campaigns)<>cardinality(requested_campaigns)
    or (requested_kind='run_test' and selected_campaigns<>array['Openers5','Openers6']) then
    raise exception 'Invalid report selection' using errcode='22023';
  end if;
  if jsonb_typeof(pair) is distinct from 'object' or jsonb_typeof(verification) is distinct from 'object'
    or verification->>'scope_attested' is distinct from 'true' then
    raise exception 'Invalid import verification' using errcode='22023';
  end if;
  select array_agg(distinct v->>'current_user_group' order by v->>'current_user_group') into observed_groups
    from (select v from jsonb_array_elements(pair#>'{performance,rows}') v
          union all select v from jsonb_array_elements(pair#>'{pause,rows}') v) q;
  if observed_groups is null or array_position(observed_groups,null) is not null
    or not observed_groups <@ source.user_groups
    or exists(select 1 from (
       select v from jsonb_array_elements(pair#>'{performance,rows}') v
       union all select v from jsonb_array_elements(pair#>'{pause,rows}') v) q
       where not pulse_private.vici_actor_group_reader(actor_auth_id,source.id,v->>'current_user_group')
          or not pulse_private.vici_actor_group_reader(actor_auth_id,source.id,v->>'most_recent_user_group')) then
    raise exception 'Report group differs from scope' using errcode='42501';
  end if;
  -- All ordinary groups represented => a stable global dataset across dates.
  -- Optional ADMIN/Monitors/Training rows do not change global dataset identity.
  -- Otherwise preserve the exact team subset; do not overwrite the global cut.
  select array_agg(g order by g) into expected_groups from unnest(source.user_groups) g
    where g not in ('ADMIN','Monitors','OpenersTraining');
  if expected_groups is not null and expected_groups <@ observed_groups then
    select array_agg(g order by g) into selected_groups from unnest(source.user_groups) g;
  else selected_groups=observed_groups; end if;
  fingerprint=encode(extensions.digest(convert_to(jsonb_build_array(source.id,requested_kind,
    selected_campaigns,selected_groups)::text,'UTF8'),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('vici-dataset/'||source.id::text,0));
  -- Recheck permission after waiting: neither a stale client catalog nor role
  -- revocation may authorize creating a dataset or committing an import.
  if not pulse_private.vici_actor_scope_reader(actor_auth_id,source.id) then
    raise exception 'Import access denied' using errcode='42501';
  end if;
  select scope_id into target from pulse_private.vici_report_datasets where identity_hash=fingerprint;
  if target is null then
    if (select count(*) from pulse_private.vici_report_datasets where parent_scope_id=source.id)>=512 then
      raise exception 'Report selection limit reached' using errcode='54000';
    end if;
    target=gen_random_uuid();
    group_label=case when selected_groups=source.user_groups or selected_groups @> source.user_groups then source.label
      when cardinality(selected_groups)>1 then cardinality(selected_groups)::text||' teams'
      else case selected_groups[1] when 'OpenersAsia' then 'Asia A' when 'OpenersAsia1' then 'Asia B'
        when 'OpenersCA' then 'Central' when 'OpenersCO' then 'Colombia' when 'OpenersPH' then 'Philippines'
        when 'OpenersVZ' then 'Venezuela' when 'OpenersNIC' then 'Nicaragua'
        when 'OpenersMXBJ' then 'Mexico Baja' when 'OpenersMXBJ1' then 'Mexico Baja B'
        else selected_groups[1] end end;
    if selected_campaigns @> source.campaigns then campaign_label='All campaigns';
    else select string_agg(replace(c,'Openers','OP'),' / ' order by c) into campaign_label from unnest(selected_campaigns) c; end if;
    label_prefix=case when requested_kind='run_test' then 'Run test · OP5 / OP6 · ' else '' end;
    insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,source_time_zone,enabled)
      values(target,'vici-dataset-'||target::text,left(label_prefix||group_label||case when requested_kind='general' then ' · '||campaign_label else '' end,120),
        source.source_key,selected_campaigns,selected_groups,source.source_time_zone,true);
    -- Reuse only the parent's existing canonical resource mappings. Never create
    -- identity/role grants or map an unmapped general report to a team.
    insert into public.vici_group_mappings(scope_id,vici_user_group,campaign_id,team_id)
      select target,m.vici_user_group,m.campaign_id,m.team_id from public.vici_group_mappings m
      where m.scope_id=source.id;
    insert into pulse_private.vici_report_datasets(scope_id,parent_scope_id,kind,identity_hash)
      values(target,source.id,requested_kind,fingerprint);
  end if;
  -- The existing atomic writer validates row fields, IDs, hashes, cooldown,
  -- independent sides and live authorization; no alternate write path.
  result=public.import_vici_reports(target,report_date,actor_auth_id,pair,verification);
  return result||jsonb_build_object('scope_id',target,'parent_scope_id',source.id,'dataset_kind',requested_kind);
end $$;
revoke all on function public.import_vici_dataset(uuid,date,uuid,jsonb,jsonb,text[],text) from public,anon,authenticated,service_role;
grant execute on function public.import_vici_dataset(uuid,date,uuid,jsonb,jsonb,text[],text) to service_role;

create or replace function public.list_vici_dashboard_scopes()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  perform pulse_private.current_training_staff_user_id();
  return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'label',s.label,'user_groups',s.user_groups,
    'source_time_zone',s.source_time_zone,'campaigns',s.campaigns,'can_import',public.can_import_vici_reports(s.id),
    'can_manage_reports',public.can_manage_vici_reports(s.id),'dataset_kind',d.kind,'parent_scope_id',d.parent_scope_id)
    order by s.created_at desc,s.label)
    from public.vici_report_scopes s left join pulse_private.vici_report_datasets d on d.scope_id=s.id
    where pulse_private.vici_scope_reader(s.id)),'[]'::jsonb);
end $$;
commit;
