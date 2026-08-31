-- Pulse Foundation V2 ADMIN-6A: campaign domain and protected read foundation.
--
-- Campaign authorization scope is intentionally deferred. Existing RBAC
-- contracts continue to support only global, department, and team scopes.

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_code_format check (
    code = lower(btrim(code))
    and code ~ '^[a-z][a-z0-9_]{1,31}$'
  ),
  constraint campaigns_name_not_blank check (length(btrim(name)) between 2 and 120),
  constraint campaigns_description_length check (
    description is null or length(btrim(description)) <= 500
  )
);

create unique index campaigns_code_unique on public.campaigns (lower(code));
create unique index campaigns_name_unique on public.campaigns (lower(btrim(name)));
create index campaigns_active_idx on public.campaigns (is_active) where is_active;

alter table public.teams
  add column campaign_id uuid;

alter table public.teams
  add constraint teams_campaign_fk
  foreign key (campaign_id) references public.campaigns (id)
  on update restrict on delete restrict;

create index teams_campaign_idx on public.teams (campaign_id);
create unique index teams_campaign_code_unique
  on public.teams (campaign_id, lower(code)) where campaign_id is not null;
create unique index teams_campaign_name_unique
  on public.teams (campaign_id, lower(btrim(name))) where campaign_id is not null;

create function pulse_private.enforce_campaign_update()
returns trigger
language plpgsql
set search_path = pg_catalog
as $function$
begin
  if new.id is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'immutable campaign identity fields cannot be changed';
  end if;

  new.updated_at := now();
  return new;
end
$function$;

alter function pulse_private.enforce_campaign_update() owner to postgres;
revoke all on function pulse_private.enforce_campaign_update() from public, anon, authenticated, service_role;

create trigger campaigns_enforce_update
before update on public.campaigns
for each row execute function pulse_private.enforce_campaign_update();

insert into public.permissions (id, key, description)
values
  ('20000000-0000-0000-0000-000000000032', 'campaigns.view', 'View the protected campaign catalog.'),
  ('20000000-0000-0000-0000-000000000033', 'campaigns.manage', 'Manage campaign catalog information.');

-- Initial Foundation V2 catalog authority is deliberately limited to the
-- existing Super Admin system role. Broader grants require a separate review.
insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.key = 'super_admin'
  and permission.key in ('campaigns.view', 'campaigns.manage');

alter table public.campaigns enable row level security;

revoke all on table public.campaigns from public, anon, authenticated;
grant all on table public.campaigns to service_role;

create function public.list_managed_campaigns()
returns table (
  id uuid,
  code text,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  team_count bigint,
  active_team_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $function$
begin
  perform pulse_private.require_global_permission('admin.access');
  perform pulse_private.require_global_permission('campaigns.view');

  return query
  select
    campaign.id,
    campaign.code,
    campaign.name,
    campaign.description,
    campaign.is_active,
    campaign.created_at,
    campaign.updated_at,
    (select count(*) from public.teams team where team.campaign_id = campaign.id),
    (select count(*) from public.teams team where team.campaign_id = campaign.id and team.is_active)
  from public.campaigns campaign
  order by campaign.name, campaign.id;
end
$function$;

alter function public.list_managed_campaigns() owner to postgres;
revoke all on function public.list_managed_campaigns() from public, anon, service_role;
grant execute on function public.list_managed_campaigns() to authenticated;

comment on table public.campaigns is
  'Canonical business campaign catalog, independent from employment departments and authorization assignments.';
comment on column public.teams.campaign_id is
  'Optional transitional link to a canonical campaign. Department ownership remains unchanged in ADMIN-6A.';
comment on function public.list_managed_campaigns() is
  'Returns the protected read-only Campaign catalog to active global Admin operators with campaigns.view.';
