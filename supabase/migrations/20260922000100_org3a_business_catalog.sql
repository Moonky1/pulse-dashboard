-- PULSE ORG-3A: canonical business catalog and controlled seed contract.
--
-- This migration separates top-level business areas and campaign operating
-- units from employment Departments. It does not create or modify Staff,
-- role assignments, operational assignments, invitations, QA coverage, or
-- reporting relationships. The approved catalog is applied only through the
-- authenticated, permission-checked apply_org3a_business_catalog() RPC.

create table public.business_areas (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_areas_code_format check (
    code = lower(btrim(code)) and code ~ '^[a-z][a-z0-9_]{1,31}$'
  ),
  constraint business_areas_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint business_areas_description_length check (description is null or length(description) <= 500)
);

create unique index business_areas_code_unique on public.business_areas(lower(code));
create unique index business_areas_name_unique on public.business_areas(lower(btrim(name)));
create index business_areas_active_idx on public.business_areas(is_active) where is_active;

create trigger business_areas_set_updated_at
before update on public.business_areas
for each row execute function pulse_private.set_updated_at();

alter table public.departments
  add column business_area_id uuid,
  add constraint departments_business_area_fk foreign key(business_area_id)
    references public.business_areas(id) on update restrict on delete restrict;

alter table public.campaigns
  add column business_area_id uuid,
  add constraint campaigns_business_area_fk foreign key(business_area_id)
    references public.business_areas(id) on update restrict on delete restrict;

create index departments_business_area_idx on public.departments(business_area_id);
create index campaigns_business_area_idx on public.campaigns(business_area_id);

create table public.operating_units (
  id uuid primary key default gen_random_uuid(),
  business_area_id uuid not null,
  campaign_id uuid,
  parent_unit_id uuid,
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operating_units_business_area_fk foreign key(business_area_id)
    references public.business_areas(id) on update restrict on delete restrict,
  constraint operating_units_campaign_fk foreign key(campaign_id)
    references public.campaigns(id) on update restrict on delete restrict,
  constraint operating_units_parent_fk foreign key(parent_unit_id)
    references public.operating_units(id) on update restrict on delete restrict,
  constraint operating_units_not_self_parent check (parent_unit_id is null or parent_unit_id <> id),
  constraint operating_units_code_format check (
    code = lower(btrim(code)) and code ~ '^[a-z][a-z0-9_]{1,31}$'
  ),
  constraint operating_units_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint operating_units_description_length check (description is null or length(description) <= 500)
);

create unique index operating_units_campaign_code_unique
  on public.operating_units(campaign_id, lower(code)) where campaign_id is not null;
create unique index operating_units_campaign_name_unique
  on public.operating_units(campaign_id, lower(btrim(name))) where campaign_id is not null;
create unique index operating_units_area_code_unique
  on public.operating_units(business_area_id, lower(code)) where campaign_id is null;
create index operating_units_parent_idx on public.operating_units(parent_unit_id);
create index operating_units_active_idx on public.operating_units(is_active) where is_active;

create trigger operating_units_set_updated_at
before update on public.operating_units
for each row execute function pulse_private.set_updated_at();

alter table public.teams alter column department_id drop not null;
alter table public.teams
  add column business_area_id uuid,
  add column operating_unit_id uuid,
  add constraint teams_business_area_fk foreign key(business_area_id)
    references public.business_areas(id) on update restrict on delete restrict,
  add constraint teams_operating_unit_fk foreign key(operating_unit_id)
    references public.operating_units(id) on update restrict on delete restrict,
  add constraint teams_structural_parent_required check (
    department_id is not null or business_area_id is not null
  );

create index teams_business_area_idx on public.teams(business_area_id);
create index teams_operating_unit_idx on public.teams(operating_unit_id);
create unique index teams_area_code_unique
  on public.teams(business_area_id, lower(code))
  where department_id is null and campaign_id is null;

create function pulse_private.validate_operating_unit_structure()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  campaign_area_id uuid;
  parent_area_id uuid;
  parent_campaign_id uuid;
begin
  if new.campaign_id is not null then
    select campaign.business_area_id into campaign_area_id
    from public.campaigns campaign where campaign.id = new.campaign_id;
    if campaign_area_id is null or campaign_area_id <> new.business_area_id then
      raise exception 'operating unit campaign must belong to the same business area' using errcode = '23514';
    end if;
  end if;

  if new.parent_unit_id is not null then
    select unit.business_area_id, unit.campaign_id into parent_area_id, parent_campaign_id
    from public.operating_units unit where unit.id = new.parent_unit_id;
    if parent_area_id is null
       or parent_area_id <> new.business_area_id
       or parent_campaign_id is distinct from new.campaign_id then
      raise exception 'operating unit parent must belong to the same business area and campaign' using errcode = '23514';
    end if;
  end if;
  return new;
end
$function$;

create trigger operating_units_validate_structure
before insert or update on public.operating_units
for each row execute function pulse_private.validate_operating_unit_structure();

create function pulse_private.validate_team_structure()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
declare
  department_area_id uuid;
  campaign_area_id uuid;
  unit_area_id uuid;
  unit_campaign_id uuid;
begin
  if new.department_id is not null then
    select department.business_area_id into department_area_id
    from public.departments department where department.id = new.department_id;
    if department_area_id is distinct from new.business_area_id then
      raise exception 'team department must belong to the same business area' using errcode = '23514';
    end if;
  end if;

  if new.campaign_id is not null then
    select campaign.business_area_id into campaign_area_id
    from public.campaigns campaign where campaign.id = new.campaign_id;
    if campaign_area_id is distinct from new.business_area_id then
      raise exception 'team campaign must belong to the same business area' using errcode = '23514';
    end if;
  end if;

  if new.operating_unit_id is not null then
    select unit.business_area_id, unit.campaign_id into unit_area_id, unit_campaign_id
    from public.operating_units unit where unit.id = new.operating_unit_id;
    if new.business_area_id is null
       or unit_area_id is null
       or unit_area_id <> new.business_area_id
       or unit_campaign_id is distinct from new.campaign_id then
      raise exception 'team operating unit must belong to the same business area and campaign' using errcode = '23514';
    end if;
  end if;
  return new;
end
$function$;

create trigger teams_validate_structure
before insert or update on public.teams
for each row execute function pulse_private.validate_team_structure();

alter function pulse_private.validate_operating_unit_structure() owner to postgres;
alter function pulse_private.validate_team_structure() owner to postgres;
revoke all on function pulse_private.validate_operating_unit_structure() from public, anon, authenticated, service_role;
revoke all on function pulse_private.validate_team_structure() from public, anon, authenticated, service_role;

insert into public.permissions(id,key,description)
values
  ('20000000-0000-0000-0000-000000000037','business_catalog.view','View the canonical business-area and operating-unit catalog.'),
  ('20000000-0000-0000-0000-000000000038','business_catalog.manage','Apply an approved canonical business catalog through a protected operator contract.');

insert into public.role_permissions(role_id,permission_id)
select role.id, permission.id
from public.roles role
join public.permissions permission on permission.key = 'business_catalog.view'
where role.key in ('admin','super_admin');

insert into public.role_permissions(role_id,permission_id)
select role.id, permission.id
from public.roles role
join public.permissions permission on permission.key = 'business_catalog.manage'
where role.key = 'super_admin';

alter table public.business_areas enable row level security;
alter table public.operating_units enable row level security;
revoke all on table public.business_areas from public, anon, authenticated;
revoke all on table public.operating_units from public, anon, authenticated;
grant all on table public.business_areas to service_role;
grant all on table public.operating_units to service_role;

create function public.list_business_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('business_catalog.view');

  return jsonb_build_object(
    'business_areas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', area.id, 'code', area.code, 'name', area.name,
        'description', area.description, 'is_active', area.is_active
      ) order by area.name)
      from public.business_areas area
    ), '[]'::jsonb),
    'departments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', department.id, 'business_area_id', department.business_area_id,
        'code', department.code, 'name', department.name,
        'description', department.description, 'is_active', department.is_active
      ) order by department.name)
      from public.departments department
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', campaign.id, 'business_area_id', campaign.business_area_id,
        'code', campaign.code, 'name', campaign.name,
        'description', campaign.description, 'is_active', campaign.is_active
      ) order by campaign.name)
      from public.campaigns campaign
    ), '[]'::jsonb),
    'operating_units', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', unit.id, 'business_area_id', unit.business_area_id,
        'campaign_id', unit.campaign_id, 'parent_unit_id', unit.parent_unit_id,
        'code', unit.code, 'name', unit.name,
        'description', unit.description, 'is_active', unit.is_active
      ) order by unit.name)
      from public.operating_units unit
    ), '[]'::jsonb),
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', team.id, 'business_area_id', team.business_area_id,
        'department_id', team.department_id, 'campaign_id', team.campaign_id,
        'operating_unit_id', team.operating_unit_id,
        'code', team.code, 'name', team.name,
        'description', team.description, 'is_active', team.is_active
      ) order by team.name)
      from public.teams team
    ), '[]'::jsonb),
    'positions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', position.id, 'code', position.code, 'name', position.name,
        'description', position.description, 'is_active', position.is_active
      ) order by position.name)
      from public.positions position
    ), '[]'::jsonb),
    'catalog_version', 'org-3a-2026-09'
  );
end
$function$;

create function public.apply_org3a_business_catalog()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  actor_id uuid := pulse_private.require_global_permission('admin.access');
  corporate_area_id uuid;
  operations_area_id uuid;
  human_resources_department_id uuid;
  quality_department_id uuid;
  customer_service_department_id uuid;
  garrett_campaign_id uuid;
  joe_campaign_id uuid;
  garrett_openers_id uuid;
  garrett_closers_id uuid;
  joe_closers_id uuid;
  affected integer := 0;
  delta integer := 0;
  before_users bigint;
  before_roles bigint;
  before_assignments bigint;
begin
  perform pulse_private.require_global_permission('business_catalog.manage');
  perform pg_advisory_xact_lock(20260922000100::bigint);

  select count(*) into before_users from public.users;
  select count(*) into before_roles from public.user_roles;
  select count(*) into before_assignments from public.user_operational_assignments;

  insert into public.business_areas(id,code,name,description,is_active)
  values
    ('30000000-0000-4000-8000-000000000001','corporate','Corporate','Company services and governance.',true),
    ('30000000-0000-4000-8000-000000000002','operations','Operations','Campaign delivery and operational support.',true)
  on conflict(lower(code)) do update set
    name=excluded.name, description=excluded.description, is_active=excluded.is_active
  where (public.business_areas.name,public.business_areas.description,public.business_areas.is_active)
    is distinct from (excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  select id into corporate_area_id from public.business_areas where code='corporate';
  select id into operations_area_id from public.business_areas where code='operations';

  update public.departments set business_area_id=corporate_area_id
  where code='corporate' and business_area_id is distinct from corporate_area_id;
  get diagnostics delta = row_count; affected := affected + delta;

  insert into public.departments(id,business_area_id,code,name,description,is_active)
  values
    ('31000000-0000-4000-8000-000000000001',corporate_area_id,'human_resources','Human Resources','People operations and employee support.',true),
    ('31000000-0000-4000-8000-000000000002',corporate_area_id,'legal','Legal','Legal operations and guidance.',true),
    ('31000000-0000-4000-8000-000000000003',corporate_area_id,'accounting','Accounting','Accounting and financial administration.',true),
    ('31000000-0000-4000-8000-000000000004',corporate_area_id,'quality_assurance','Quality Assurance','Quality standards and operational compliance.',true),
    ('31000000-0000-4000-8000-000000000005',corporate_area_id,'customer_service','Customer Service','Customer support and account care.',true)
  on conflict(lower(code)) do update set
    business_area_id=excluded.business_area_id,name=excluded.name,description=excluded.description,is_active=excluded.is_active
  where (public.departments.business_area_id,public.departments.name,public.departments.description,public.departments.is_active)
    is distinct from (excluded.business_area_id,excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  insert into public.campaigns(id,business_area_id,code,name,description,is_active)
  values
    ('32000000-0000-4000-8000-000000000001',operations_area_id,'auto_warranty_garrett','Auto Warranty Garrett','Garrett auto warranty operations.',true),
    ('32000000-0000-4000-8000-000000000002',operations_area_id,'auto_warranty_joe','Auto Warranty Joe','Joe auto warranty operations.',true)
  on conflict(lower(code)) do update set
    business_area_id=excluded.business_area_id,name=excluded.name,description=excluded.description,is_active=excluded.is_active
  where (public.campaigns.business_area_id,public.campaigns.name,public.campaigns.description,public.campaigns.is_active)
    is distinct from (excluded.business_area_id,excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  select id into human_resources_department_id from public.departments where code='human_resources';
  select id into quality_department_id from public.departments where code='quality_assurance';
  select id into customer_service_department_id from public.departments where code='customer_service';
  select id into garrett_campaign_id from public.campaigns where code='auto_warranty_garrett';
  select id into joe_campaign_id from public.campaigns where code='auto_warranty_joe';

  insert into public.operating_units(id,business_area_id,campaign_id,parent_unit_id,code,name,description,is_active)
  values
    ('33000000-0000-4000-8000-000000000001',operations_area_id,garrett_campaign_id,null,'openers','Openers','Garrett opener teams.',true),
    ('33000000-0000-4000-8000-000000000002',operations_area_id,garrett_campaign_id,null,'closers','Closers','Garrett closer teams.',true),
    ('33000000-0000-4000-8000-000000000003',operations_area_id,garrett_campaign_id,null,'to','TO','Garrett transfer operations.',true),
    ('33000000-0000-4000-8000-000000000004',operations_area_id,garrett_campaign_id,null,'trainers','Trainers','Garrett training operations.',true),
    ('33000000-0000-4000-8000-000000000005',operations_area_id,joe_campaign_id,null,'closers','Closers','Joe closer teams.',true)
  on conflict(campaign_id,lower(code)) where campaign_id is not null do update set
    business_area_id=excluded.business_area_id,name=excluded.name,description=excluded.description,is_active=excluded.is_active
  where (public.operating_units.business_area_id,public.operating_units.name,public.operating_units.description,public.operating_units.is_active)
    is distinct from (excluded.business_area_id,excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  select id into garrett_openers_id from public.operating_units where campaign_id=garrett_campaign_id and code='openers';
  select id into garrett_closers_id from public.operating_units where campaign_id=garrett_campaign_id and code='closers';
  select id into joe_closers_id from public.operating_units where campaign_id=joe_campaign_id and code='closers';

  insert into public.teams(id,business_area_id,department_id,campaign_id,operating_unit_id,code,name,description,is_active)
  values
    ('34000000-0000-4000-8000-000000000011',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'asia_team_a','Asia Team A','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000012',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'asia_team_b','Asia Team B','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000013',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'philippines','Philippines','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000014',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'colombia','Colombia','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000015',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'central_america','Central America','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000016',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'mexico_team_group_a','Mexico Team Group A','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000017',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'mexico_team_group_b','Mexico Team Group B','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000018',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'venezuela','Venezuela','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000019',operations_area_id,null,garrett_campaign_id,garrett_openers_id,'nicaragua','Nicaragua','Garrett Openers team.',true),
    ('34000000-0000-4000-8000-000000000020',operations_area_id,null,garrett_campaign_id,garrett_closers_id,'junior_closers','Junior Closers','Garrett junior closer team.',true),
    ('34000000-0000-4000-8000-000000000021',operations_area_id,null,joe_campaign_id,null,'latam','LATAM','Joe LATAM team.',true),
    ('34000000-0000-4000-8000-000000000022',operations_area_id,null,joe_campaign_id,null,'nicaragua','Nicaragua','Joe Nicaragua team.',true),
    ('34000000-0000-4000-8000-000000000023',operations_area_id,null,joe_campaign_id,null,'mexico','Mexico','Joe Mexico team.',true),
    ('34000000-0000-4000-8000-000000000024',operations_area_id,null,joe_campaign_id,joe_closers_id,'junior_closers','Junior Closers','Joe junior closer team.',true)
  on conflict(campaign_id,lower(code)) where campaign_id is not null do update set
    business_area_id=excluded.business_area_id,department_id=excluded.department_id,
    operating_unit_id=excluded.operating_unit_id,name=excluded.name,
    description=excluded.description,is_active=excluded.is_active
  where (public.teams.business_area_id,public.teams.department_id,public.teams.operating_unit_id,public.teams.name,public.teams.description,public.teams.is_active)
    is distinct from (excluded.business_area_id,excluded.department_id,excluded.operating_unit_id,excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  -- Corporate and Operations support teams do not have Campaign IDs, so they
  -- use their existing Department/Business Area uniqueness contracts.
  insert into public.teams(id,business_area_id,department_id,campaign_id,operating_unit_id,code,name,description,is_active)
  values
    ('34000000-0000-4000-8000-000000000001',corporate_area_id,human_resources_department_id,null,null,'recruitment','Recruitment','Talent acquisition and recruiting operations.',true),
    ('34000000-0000-4000-8000-000000000002',corporate_area_id,null,null,null,'administrative_support','Administrative Support','Corporate administrative support.',true),
    ('34000000-0000-4000-8000-000000000003',corporate_area_id,quality_department_id,null,null,'qa_closers','QA Closers','Quality review for closer operations.',true),
    ('34000000-0000-4000-8000-000000000004',corporate_area_id,quality_department_id,null,null,'qa_trainers_openers','QA / Trainers Openers','Quality and training support for opener operations.',true),
    ('34000000-0000-4000-8000-000000000005',corporate_area_id,quality_department_id,null,null,'compliance','Compliance','Quality compliance operations.',true),
    ('34000000-0000-4000-8000-000000000006',corporate_area_id,customer_service_department_id,null,null,'retention','Retention','Customer retention operations.',true),
    ('34000000-0000-4000-8000-000000000007',corporate_area_id,customer_service_department_id,null,null,'welcome_calls','Welcome Calls','New-customer welcome calls.',true),
    ('34000000-0000-4000-8000-000000000008',corporate_area_id,customer_service_department_id,null,null,'collections','Collections','Customer collections operations.',true),
    ('34000000-0000-4000-8000-000000000009',corporate_area_id,customer_service_department_id,null,null,'ccr','CCR','Customer care operations.',true),
    ('34000000-0000-4000-8000-000000000010',operations_area_id,null,null,null,'dialer_management','Dialer Management','Operational dialer support.',true)
  on conflict(id) do update set
    business_area_id=excluded.business_area_id,department_id=excluded.department_id,
    campaign_id=excluded.campaign_id,operating_unit_id=excluded.operating_unit_id,
    code=excluded.code,name=excluded.name,description=excluded.description,is_active=excluded.is_active
  where (public.teams.business_area_id,public.teams.department_id,public.teams.campaign_id,public.teams.operating_unit_id,public.teams.code,public.teams.name,public.teams.description,public.teams.is_active)
    is distinct from (excluded.business_area_id,excluded.department_id,excluded.campaign_id,excluded.operating_unit_id,excluded.code,excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  insert into public.positions(id,code,name,description,is_active)
  values
    ('35000000-0000-4000-8000-000000000001','supervisor','Supervisor','Operational people leader.',true),
    ('35000000-0000-4000-8000-000000000002','team_lead','Team Lead','Team-level people leader.',true),
    ('35000000-0000-4000-8000-000000000003','opener','Opener','Front-line opener position.',true),
    ('35000000-0000-4000-8000-000000000004','service_advisor','Service Advisor','Customer service advisor position.',true),
    ('35000000-0000-4000-8000-000000000005','junior_closer','Junior Closer','Junior closer position.',true),
    ('35000000-0000-4000-8000-000000000006','trainer','Trainer','Training delivery position.',true),
    ('35000000-0000-4000-8000-000000000007','qa_analyst','QA Analyst','Quality assurance analyst position.',true),
    ('35000000-0000-4000-8000-000000000008','recruiter','Recruiter','Recruitment position.',true),
    ('35000000-0000-4000-8000-000000000009','hr','HR','Human Resources position.',true),
    ('35000000-0000-4000-8000-000000000010','legal','Legal','Legal position.',true),
    ('35000000-0000-4000-8000-000000000011','accounting','Accounting','Accounting position.',true),
    ('35000000-0000-4000-8000-000000000012','dialer_manager','Dialer Manager','Dialer operations manager position.',true)
  on conflict(lower(code)) do update set
    name=excluded.name,description=excluded.description,is_active=excluded.is_active
  where (public.positions.name,public.positions.description,public.positions.is_active)
    is distinct from (excluded.name,excluded.description,excluded.is_active);
  get diagnostics delta = row_count; affected := affected + delta;

  if before_users <> (select count(*) from public.users)
     or before_roles <> (select count(*) from public.user_roles)
     or before_assignments <> (select count(*) from public.user_operational_assignments) then
    raise exception 'catalog seed changed protected people or access state' using errcode = '55000';
  end if;

  if affected > 0 then
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor_id,'organization_catalog',null,'business_catalog.applied','operator',
      jsonb_build_object('catalog_version','org-3a-2026-09','changed_rows',affected,'support_position','held'));
  end if;

  return jsonb_build_object(
    'catalog_version','org-3a-2026-09',
    'changed_rows',affected,
    'idempotent',affected=0,
    'business_areas',(select count(*) from public.business_areas where code in ('corporate','operations')),
    'departments',(select count(*) from public.departments where code in ('corporate','human_resources','legal','accounting','quality_assurance','customer_service')),
    'campaigns',(select count(*) from public.campaigns where code in ('auto_warranty_garrett','auto_warranty_joe')),
    'operating_units',(select count(*) from public.operating_units where campaign_id in (garrett_campaign_id,joe_campaign_id)),
    'teams',(select count(*) from public.teams where id::text like '34000000-0000-4000-8000-%'),
    'positions',(select count(*) from public.positions where id::text like '35000000-0000-4000-8000-%')
  );
end
$function$;

alter function public.list_business_catalog() owner to postgres;
alter function public.apply_org3a_business_catalog() owner to postgres;
revoke all on function public.list_business_catalog() from public, anon, service_role;
revoke all on function public.apply_org3a_business_catalog() from public, anon, service_role;
grant execute on function public.list_business_catalog() to authenticated;
grant execute on function public.apply_org3a_business_catalog() to authenticated;

comment on table public.business_areas is
  'Canonical top-level company containers. Business areas are not employment Departments.';
comment on table public.operating_units is
  'Canonical Campaign operating units that may contain Teams without overloading Team semantics.';
comment on function public.list_business_catalog() is
  'Protected read projection for the canonical organization, Campaign, Team/unit, and Position catalog.';
comment on function public.apply_org3a_business_catalog() is
  'Authenticated, permission-checked, idempotent ORG-3A catalog seed. It never mutates Staff or access assignments.';
