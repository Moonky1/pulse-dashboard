-- AGENT-1: a separate company player identity. No Agent is a Staff user.
-- All credential/session access stays behind service-only contracts.
begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

insert into public.permissions(key, description)
values ('agents.manage', 'Provision and manage approved Pulse GO agents.')
on conflict (key) do nothing;

insert into public.role_permissions(role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.key in ('admin', 'super_admin') and permission.key = 'agents.manage'
on conflict do nothing;

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null unique,
  display_name text not null,
  full_name text,
  status text not null default 'active',
  team_id uuid not null references public.teams(id) on update restrict on delete restrict,
  operating_unit_id uuid references public.operating_units(id) on update restrict on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agents_code_valid check (agent_code ~ '^[0-9]{4,12}$'),
  constraint agents_display_valid check (length(btrim(display_name)) between 2 and 80),
  constraint agents_full_name_valid check (full_name is null or length(btrim(full_name)) between 2 and 160),
  constraint agents_status_valid check (status in ('active', 'inactive', 'blocked'))
);
create index agents_team_active_idx on public.agents(team_id, id) where status = 'active';
create index agents_operating_unit_idx on public.agents(operating_unit_id) where operating_unit_id is not null;
create trigger agents_set_updated_at before update on public.agents
for each row execute function pulse_private.set_updated_at();

create table public.agent_credentials (
  agent_id uuid primary key references public.agents(id) on update restrict on delete restrict,
  pin_hash text not null,
  changed_at timestamptz not null default now(),
  constraint agent_credentials_hash_valid check (left(pin_hash, 4) in ('$2a$', '$2b$', '$2y$'))
);

create table public.agent_login_throttle (
  agent_code text primary key,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint agent_login_throttle_code_valid check (agent_code ~ '^[0-9]{4,12}$'),
  constraint agent_login_throttle_attempts_valid check (failed_attempts between 0 and 20)
);

create table public.agent_sessions (
  token_hash text primary key,
  agent_id uuid not null references public.agents(id) on update restrict on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint agent_sessions_hash_valid check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint agent_sessions_expiry_valid check (expires_at > created_at)
);
create index agent_sessions_active_idx on public.agent_sessions(agent_id, expires_at desc)
where revoked_at is null;

alter table public.training_learners drop constraint training_learners_kind_train1a;
alter table public.training_learners add constraint training_learners_kind_agent1
  check (learner_kind in ('staff', 'agent'));

create table public.training_agent_learner_links (
  learner_id uuid primary key references public.training_learners(id) on update restrict on delete restrict,
  agent_id uuid not null unique references public.agents(id) on update restrict on delete restrict,
  linked_at timestamptz not null default now()
);

create or replace function pulse_private.require_staff_learner_link()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $function$
declare staff_links integer; agent_links integer;
begin
  select count(*) into staff_links from public.training_staff_learner_links
  where learner_id = new.id;
  select count(*) into agent_links from public.training_agent_learner_links
  where learner_id = new.id;
  if (new.learner_kind = 'staff' and staff_links <> 1) or
     (new.learner_kind = 'agent' and agent_links <> 1) or
     staff_links + agent_links <> 1 then
    raise exception 'Training learner requires exactly one canonical identity link';
  end if;
  return null;
end
$function$;

create function pulse_private.agent_link_identity_guard()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $function$
begin
  if not exists (select 1 from public.training_learners
    where id = new.learner_id and learner_kind = 'agent') then
    raise exception 'Agent learner link requires an Agent learner';
  end if;
  return new;
end
$function$;
create trigger training_agent_link_guard before insert or update
on public.training_agent_learner_links for each row
execute function pulse_private.agent_link_identity_guard();

create function pulse_private.require_linked_learner_identity()
returns trigger language plpgsql security definer set search_path = pg_catalog
as $function$
declare linked_learner uuid;
  kind text; staff_links integer; agent_links integer;
begin
  linked_learner := case when tg_op='DELETE' then old.learner_id else new.learner_id end;
  select learner_kind into kind from public.training_learners where id=linked_learner;
  if not found then return null; end if;
  select count(*) into staff_links from public.training_staff_learner_links
  where learner_id=linked_learner;
  select count(*) into agent_links from public.training_agent_learner_links
  where learner_id=linked_learner;
  if (kind='staff' and staff_links<>1) or (kind='agent' and agent_links<>1)
    or staff_links+agent_links<>1 then
    raise exception 'Training learner requires exactly one canonical identity link';
  end if;
  return null;
end
$function$;
create constraint trigger training_staff_link_identity
after insert or update or delete on public.training_staff_learner_links
deferrable initially deferred for each row
execute function pulse_private.require_linked_learner_identity();
create constraint trigger training_agent_link_identity
after insert or update or delete on public.training_agent_learner_links
deferrable initially deferred for each row
execute function pulse_private.require_linked_learner_identity();

create function public.admin_provision_agent(
  requested_agent_code text, requested_display_name text,
  requested_team_id uuid, requested_pin text,
  requested_full_name text default null,
  requested_operating_unit_id uuid default null
)
returns uuid language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
  created_agent uuid; created_learner uuid;
begin
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$'
    or length(btrim(coalesce(requested_display_name,''))) not between 2 and 80
    or requested_pin is null or requested_pin !~ '^[0-9]{6,12}$' then
    raise exception 'Invalid Agent details' using errcode = '22023';
  end if;
  if not exists (select 1 from public.teams team
      where team.id = requested_team_id and team.is_active) then
    raise exception 'Active team required' using errcode = '22023';
  end if;
  if requested_operating_unit_id is not null and not exists (
    select 1 from public.operating_units unit
    where unit.id = requested_operating_unit_id and unit.is_active) then
    raise exception 'Active operating unit required' using errcode = '22023';
  end if;
  insert into public.agents(agent_code,display_name,full_name,team_id,operating_unit_id)
  values(requested_agent_code,btrim(requested_display_name),nullif(btrim(requested_full_name),''),
    requested_team_id,requested_operating_unit_id)
  returning id into created_agent;
  insert into public.agent_credentials(agent_id,pin_hash)
  values(created_agent,extensions.crypt(requested_pin,extensions.gen_salt('bf',12)));
  insert into public.training_learners(learner_kind) values('agent') returning id into created_learner;
  insert into public.training_agent_learner_links(learner_id,agent_id)
  values(created_learner,created_agent);
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'agent',created_agent,'agent.provisioned','server',
    jsonb_build_object('agent_code',requested_agent_code,'team_id',requested_team_id));
  return created_agent;
end
$function$;

create function public.admin_reset_agent_pin(requested_agent_id uuid, requested_pin text)
returns void language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
begin
  if requested_pin is null or requested_pin !~ '^[0-9]{6,12}$' then
    raise exception 'PIN must contain 6 to 12 digits' using errcode = '22023';
  end if;
  update public.agent_credentials set
    pin_hash = extensions.crypt(requested_pin,extensions.gen_salt('bf',12)), changed_at = now()
  where agent_id = requested_agent_id;
  if not found then raise exception 'Agent unavailable' using errcode = 'P0002'; end if;
  update public.agent_sessions set revoked_at = now()
  where agent_id = requested_agent_id and revoked_at is null;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'agent',requested_agent_id,'agent.pin_reset','server','{}'::jsonb);
end
$function$;

create function public.admin_update_agent(
  requested_agent_id uuid, requested_status text,
  requested_team_id uuid, requested_operating_unit_id uuid default null
)
returns void language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
  previous public.agents%rowtype;
begin
  if requested_status not in ('active','inactive','blocked') or requested_team_id is null then
    raise exception 'Invalid Agent update' using errcode = '22023';
  end if;
  if not exists (select 1 from public.teams team where team.id=requested_team_id and team.is_active) then
    raise exception 'Active team required' using errcode = '22023';
  end if;
  if requested_operating_unit_id is not null and not exists (
    select 1 from public.operating_units unit
    where unit.id=requested_operating_unit_id and unit.is_active) then
    raise exception 'Active operating unit required' using errcode = '22023';
  end if;
  select * into previous from public.agents where id=requested_agent_id for update;
  if not found then raise exception 'Agent unavailable' using errcode = 'P0002'; end if;
  update public.agents set status=requested_status,team_id=requested_team_id,
    operating_unit_id=requested_operating_unit_id where id=requested_agent_id;
  if requested_status <> 'active' then
    update public.agent_sessions set revoked_at=now()
    where agent_id=requested_agent_id and revoked_at is null;
  end if;
  if previous.status is distinct from requested_status then
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor_id,'agent',requested_agent_id,'agent.status_changed','server',
      jsonb_build_object('from',previous.status,'to',requested_status));
  end if;
  if previous.team_id is distinct from requested_team_id then
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
    values(actor_id,'agent',requested_agent_id,'agent.team_assignment_changed','server',
      jsonb_build_object('from',previous.team_id,'to',requested_team_id));
  end if;
end
$function$;

-- The caller is an authenticated server boundary, never a browser role.
-- It supplies only SHA-256(token); the raw token is never stored in Postgres.
create function public.agent_login_with_pin(
  requested_agent_code text, requested_pin text, requested_token_hash text
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare target public.agents%rowtype; credential text;
  throttle public.agent_login_throttle%rowtype; learner uuid;
begin
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$'
    or requested_pin is null or requested_pin !~ '^[0-9]{6,12}$'
    or requested_token_hash is null or requested_token_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('authenticated',false);
  end if;
  insert into public.agent_login_throttle(agent_code) values(requested_agent_code)
  on conflict (agent_code) do nothing;
  select * into throttle from public.agent_login_throttle
  where agent_code=requested_agent_code for update;
  select * into target from public.agents where agent_code=requested_agent_code;
  select pin_hash into credential from public.agent_credentials where agent_id=target.id;
  if throttle.locked_until > now() or credential is null or
     extensions.crypt(requested_pin,coalesce(credential,extensions.gen_salt('bf',12)))
       is distinct from credential then
    update public.agent_login_throttle set
      failed_attempts = case when locked_until > now() then failed_attempts
        when updated_at < now() - interval '15 minutes' then 1
        else least(failed_attempts+1,20) end,
      locked_until = case when locked_until > now() then locked_until
        when (case when updated_at < now() - interval '15 minutes' then 1
          else failed_attempts+1 end) >= 5 then now()+interval '15 minutes'
        else null end,
      updated_at=now() where agent_code=requested_agent_code;
    return jsonb_build_object('authenticated',false);
  end if;
  if target.status <> 'active' or not exists (
    select 1 from public.teams team where team.id=target.team_id and team.is_active) then
    raise exception 'Your Pulse access is currently unavailable' using errcode = '42501';
  end if;
  update public.agent_login_throttle set failed_attempts=0,locked_until=null,updated_at=now()
  where agent_code=requested_agent_code;
  select link.learner_id into learner from public.training_agent_learner_links link
  where link.agent_id=target.id;
  insert into public.agent_sessions(token_hash,agent_id,expires_at)
  values(requested_token_hash,target.id,now()+interval '12 hours');
  return jsonb_build_object('authenticated',true,'agent_id',target.id,'learner_id',learner,
    'display_name',target.display_name,'agent_code',target.agent_code,
    'team_id',target.team_id,'expires_at',now()+interval '12 hours');
end
$function$;

create function public.agent_session_profile(requested_token_hash text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare found_agent record;
begin
  if requested_token_hash is null or requested_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Agent session unavailable' using errcode='28000';
  end if;
  select agent.id,agent.agent_code,agent.display_name,agent.team_id,
    team.name as team_name,link.learner_id,session.expires_at,session.last_used_at
  into found_agent
  from public.agent_sessions session
  join public.agents agent on agent.id=session.agent_id and agent.status='active'
  join public.teams team on team.id=agent.team_id and team.is_active
  join public.training_agent_learner_links link on link.agent_id=agent.id
  where session.token_hash=requested_token_hash and session.revoked_at is null
    and session.expires_at > now();
  if not found then raise exception 'Agent session unavailable' using errcode='28000'; end if;
  if found_agent.last_used_at < now()-interval '5 minutes' then
    update public.agent_sessions set last_used_at=now() where token_hash=requested_token_hash;
  end if;
  return jsonb_build_object('agent_id',found_agent.id,'agent_code',found_agent.agent_code,
    'display_name',found_agent.display_name,'team_id',found_agent.team_id,
    'team_name',found_agent.team_name,'learner_id',found_agent.learner_id,
    'expires_at',found_agent.expires_at);
end
$function$;

create function public.agent_logout(requested_token_hash text)
returns void language plpgsql volatile security definer set search_path = pg_catalog
as $function$
begin
  update public.agent_sessions set revoked_at=now()
  where token_hash=requested_token_hash and revoked_at is null;
end
$function$;

alter table public.agents enable row level security;
alter table public.agent_credentials enable row level security;
alter table public.agent_login_throttle enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.training_agent_learner_links enable row level security;
revoke all on public.agents,public.agent_credentials,public.agent_login_throttle,
  public.agent_sessions,public.training_agent_learner_links from public,anon,authenticated;
grant all on public.agents,public.agent_credentials,public.agent_login_throttle,
  public.agent_sessions,public.training_agent_learner_links to service_role;

revoke all on function pulse_private.agent_link_identity_guard() from public,anon,authenticated,service_role;
revoke all on function pulse_private.require_linked_learner_identity() from public,anon,authenticated,service_role;
revoke all on function public.admin_provision_agent(text,text,uuid,text,text,uuid) from public,anon,service_role;
revoke all on function public.admin_reset_agent_pin(uuid,text) from public,anon,service_role;
revoke all on function public.admin_update_agent(uuid,text,uuid,uuid) from public,anon,service_role;
grant execute on function public.admin_provision_agent(text,text,uuid,text,text,uuid) to authenticated;
grant execute on function public.admin_reset_agent_pin(uuid,text) to authenticated;
grant execute on function public.admin_update_agent(uuid,text,uuid,uuid) to authenticated;
revoke all on function public.agent_login_with_pin(text,text,text) from public,anon,authenticated;
revoke all on function public.agent_session_profile(text) from public,anon,authenticated;
revoke all on function public.agent_logout(text) from public,anon,authenticated;
grant execute on function public.agent_login_with_pin(text,text,text) to service_role;
grant execute on function public.agent_session_profile(text) to service_role;
grant execute on function public.agent_logout(text) to service_role;

comment on table public.agents is 'Company-provisioned GO players, separate from Staff users and RBAC.';
comment on table public.agent_sessions is 'Only SHA-256 hashes of opaque 256-bit Agent session tokens are stored.';
commit;
