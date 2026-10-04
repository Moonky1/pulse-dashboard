-- AGENT-1 activation: Staff approves identity, Agent chooses the private PIN.
-- Existing activated Agents keep their credentials until Staff explicitly reissues.
begin;

alter table public.agent_credentials alter column pin_hash drop not null;

create table public.agent_activations (
  agent_id uuid primary key references public.agents(id) on update restrict on delete restrict,
  code_hash text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  failed_attempts integer not null default 0,
  last_attempt_at timestamptz,
  locked_until timestamptz,
  constraint agent_activations_hash_valid check (code_hash ~ '^[0-9a-f]{64}$'),
  constraint agent_activations_expiry_valid check (expires_at > issued_at),
  constraint agent_activations_attempts_valid check (failed_attempts between 0 and 5)
);

alter table public.agent_activations enable row level security;
revoke all on public.agent_activations from public, anon, authenticated;
grant all on public.agent_activations to service_role;

create function pulse_private.issue_agent_activation(requested_agent_id uuid)
returns text language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare activation_code text := encode(extensions.gen_random_bytes(8), 'hex');
begin
  insert into public.agent_activations(agent_id,code_hash,issued_at,expires_at)
  values(requested_agent_id,encode(extensions.digest(activation_code,'sha256'),'hex'),now(),now()+interval '24 hours')
  on conflict (agent_id) do update set
    code_hash=excluded.code_hash,issued_at=excluded.issued_at,expires_at=excluded.expires_at,
    used_at=null,failed_attempts=0,last_attempt_at=null,locked_until=null;
  return activation_code;
end
$function$;

create function public.admin_prepare_agent_activation(
  requested_agent_code text, requested_display_name text,
  requested_team_id uuid, requested_full_name text default null,
  requested_operating_unit_id uuid default null
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
  created_agent uuid; created_learner uuid; activation_code text;
begin
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$'
    or length(btrim(coalesce(requested_display_name,''))) not between 2 and 80
    or (requested_full_name is not null and length(btrim(requested_full_name)) not between 2 and 160) then
    raise exception 'Invalid Agent details' using errcode = '22023';
  end if;
  if not exists (select 1 from public.teams team
      where team.id=requested_team_id and team.is_active) then
    raise exception 'Active team required' using errcode = '22023';
  end if;
  if requested_operating_unit_id is not null and not exists (
    select 1 from public.operating_units unit
    where unit.id=requested_operating_unit_id and unit.is_active) then
    raise exception 'Active operating unit required' using errcode = '22023';
  end if;
  insert into public.agents(agent_code,display_name,full_name,team_id,operating_unit_id)
  values(requested_agent_code,btrim(requested_display_name),nullif(btrim(requested_full_name),''),
    requested_team_id,requested_operating_unit_id)
  returning id into created_agent;
  insert into public.agent_credentials(agent_id,pin_hash) values(created_agent,null);
  insert into public.training_learners(learner_kind) values('agent') returning id into created_learner;
  insert into public.training_agent_learner_links(learner_id,agent_id)
  values(created_learner,created_agent);
  activation_code := pulse_private.issue_agent_activation(created_agent);
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'agent',created_agent,'agent.provisioned','server',
    jsonb_build_object('agent_code',requested_agent_code,'team_id',requested_team_id,
      'activation_expires_at',now()+interval '24 hours'));
  return jsonb_build_object('agent_id',created_agent,'agent_code',requested_agent_code,
    'activation_code',activation_code);
end
$function$;

create function public.admin_reissue_agent_activation(requested_agent_code text)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare actor_id uuid := pulse_private.require_global_permission('agents.manage');
  target public.agents%rowtype; activation_code text;
begin
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$' then
    raise exception 'Invalid Agent ID' using errcode = '22023';
  end if;
  select * into target from public.agents where agent_code=requested_agent_code for update;
  if not found then raise exception 'Agent unavailable' using errcode = 'P0002'; end if;
  if target.status <> 'active' or not exists (
    select 1 from public.teams team where team.id=target.team_id and team.is_active) then
    raise exception 'Agent access unavailable' using errcode = '42501';
  end if;
  update public.agent_credentials set pin_hash=null,changed_at=now()
  where agent_id=target.id;
  update public.agent_sessions set revoked_at=now()
  where agent_id=target.id and revoked_at is null;
  activation_code := pulse_private.issue_agent_activation(target.id);
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(actor_id,'agent',target.id,'agent.activation_reissued','server',
    jsonb_build_object('activation_expires_at',now()+interval '24 hours'));
  return jsonb_build_object('agent_id',target.id,'agent_code',target.agent_code,
    'activation_code',activation_code);
end
$function$;

-- Called only by the same-origin Agent API using the server-side service role.
-- The code is single-use, expires in 24 hours, and is rate-limited per Agent ID.
create function public.agent_activate_with_code(
  requested_agent_code text, requested_activation_code text, requested_pin text
)
returns jsonb language plpgsql volatile security definer set search_path = pg_catalog
as $function$
declare target public.agents%rowtype; activation public.agent_activations%rowtype;
  next_attempts integer;
begin
  if requested_agent_code is null or requested_agent_code !~ '^[0-9]{4,12}$'
    or requested_activation_code is null or requested_activation_code !~ '^[0-9a-f]{16}$'
    or requested_pin is null or requested_pin !~ '^[0-9]{6,12}$' then
    return jsonb_build_object('activated',false);
  end if;
  select * into target from public.agents where agent_code=requested_agent_code for update;
  if not found then return jsonb_build_object('activated',false); end if;
  select * into activation from public.agent_activations
  where agent_id=target.id for update;
  if not found or activation.used_at is not null or activation.expires_at <= now()
    or activation.locked_until > now() then
    return jsonb_build_object('activated',false);
  end if;
  if activation.code_hash <> encode(extensions.digest(requested_activation_code,'sha256'),'hex') then
    next_attempts := case when activation.last_attempt_at < now()-interval '15 minutes' then 1
      else least(activation.failed_attempts+1,5) end;
    update public.agent_activations set failed_attempts=next_attempts,
      last_attempt_at=now(),
      locked_until=case when next_attempts >= 5 then now()+interval '15 minutes' else null end
    where agent_id=target.id;
    return jsonb_build_object('activated',false);
  end if;
  if target.status <> 'active' or not exists (
    select 1 from public.teams team where team.id=target.team_id and team.is_active) then
    return jsonb_build_object('activated',false);
  end if;
  update public.agent_credentials set
    pin_hash=extensions.crypt(requested_pin,extensions.gen_salt('bf',12)),changed_at=now()
  where agent_id=target.id and pin_hash is null;
  if not found then return jsonb_build_object('activated',false); end if;
  update public.agent_activations set used_at=now(),failed_attempts=0,
    last_attempt_at=null,locked_until=null where agent_id=target.id;
  insert into public.audit_events(actor_user_id,target_type,target_id,action,source,metadata)
  values(null,'agent',target.id,'agent.activated','server','{}'::jsonb);
  return jsonb_build_object('activated',true);
end
$function$;

-- Retire the Staff-set-PIN contracts; existing PINs remain valid until reissue.
revoke all on function public.admin_provision_agent(text,text,uuid,text,text,uuid) from authenticated;
revoke all on function public.admin_reset_agent_pin(uuid,text) from authenticated;
revoke all on function pulse_private.issue_agent_activation(uuid) from public,anon,authenticated,service_role;
revoke all on function public.admin_prepare_agent_activation(text,text,uuid,text,uuid) from public,anon,service_role;
revoke all on function public.admin_reissue_agent_activation(text) from public,anon,service_role;
revoke all on function public.agent_activate_with_code(text,text,text) from public,anon,authenticated;
grant execute on function public.admin_prepare_agent_activation(text,text,uuid,text,uuid) to authenticated;
grant execute on function public.admin_reissue_agent_activation(text) to authenticated;
grant execute on function public.agent_activate_with_code(text,text,text) to service_role;

comment on table public.agent_activations is 'One-time hashed Agent activation codes; no browser table access.';
commit;
