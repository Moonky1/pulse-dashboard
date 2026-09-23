-- Pulse PROFILE-2: trusted Google avatars and protected custom Staff photos.

alter table public.users
  add column google_avatar_url text,
  add column custom_avatar_path text,
  add column avatar_updated_at timestamptz;

alter table public.users
  add constraint users_google_avatar_trusted_host check (
    google_avatar_url is null
    or (
      length(google_avatar_url) <= 2048
      and google_avatar_url ~ '^https://lh[1-6]\.googleusercontent\.com/[A-Za-z0-9._~!$&''()*+,;=:@%/?-]+$'
    )
  ),
  add constraint users_custom_avatar_canonical_path check (
    custom_avatar_path is null
    or custom_avatar_path = id::text || '/avatar.webp'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('staff-avatars', 'staff-avatars', false, 1048576, array['image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create function pulse_private.sanitize_google_avatar_url(candidate text)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $function$
  select case
    when length(candidate) <= 2048
      and candidate ~ '^https://lh[1-6]\.googleusercontent\.com/[A-Za-z0-9._~!$&''()*+,;=:@%/?-]+$'
    then candidate
    else null
  end
$function$;

create function public.refresh_own_google_avatar()
returns table (
  google_avatar_url text,
  custom_avatar_path text,
  avatar_updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  caller_auth_user_id uuid := auth.uid();
  trusted_avatar text;
begin
  if caller_auth_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select pulse_private.sanitize_google_avatar_url(
           coalesce(identity.identity_data ->> 'avatar_url', identity.identity_data ->> 'picture')
         )
  into trusted_avatar
  from auth.identities identity
  where identity.user_id = caller_auth_user_id
    and identity.provider = 'google'
  order by identity.last_sign_in_at desc nulls last, identity.updated_at desc, identity.id
  limit 1;

  return query
  update public.users profile
  set google_avatar_url = trusted_avatar,
      avatar_updated_at = case
        when profile.google_avatar_url is distinct from trusted_avatar then now()
        else profile.avatar_updated_at
      end
  where profile.auth_user_id = caller_auth_user_id
  returning profile.google_avatar_url, profile.custom_avatar_path, profile.avatar_updated_at;
end
$function$;

-- This mutation is intentionally service-role-only. The avatar Edge Function
-- authenticates the caller, validates the image bytes, and supplies only the
-- authenticated Auth user id. The database constructs the canonical path.
create function public.set_staff_custom_avatar(target_auth_user_id uuid)
returns table (
  user_id uuid,
  custom_avatar_path text,
  avatar_updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  return query
  update public.users profile
  set custom_avatar_path = profile.id::text || '/avatar.webp',
      avatar_updated_at = now()
  where profile.auth_user_id = target_auth_user_id
    and profile.status = 'active'
  returning profile.id, profile.custom_avatar_path, profile.avatar_updated_at;

  if not found then
    raise exception 'active Staff profile not found' using errcode = 'P0002';
  end if;
end
$function$;

create function public.clear_staff_custom_avatar(target_auth_user_id uuid)
returns table (
  user_id uuid,
  removed_avatar_path text,
  google_avatar_url text,
  avatar_updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  previous_path text;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  select profile.custom_avatar_path
  into previous_path
  from public.users profile
  where profile.auth_user_id = target_auth_user_id
    and profile.status = 'active';

  if not found then
    raise exception 'active Staff profile not found' using errcode = 'P0002';
  end if;

  return query
  update public.users profile
  set custom_avatar_path = null,
      avatar_updated_at = case when profile.custom_avatar_path is not null then now() else profile.avatar_updated_at end
  where profile.auth_user_id = target_auth_user_id
    and profile.status = 'active'
  returning profile.id, previous_path, profile.google_avatar_url, profile.avatar_updated_at;

end
$function$;

-- A signed URL may be created only for the owner or a currently active user
-- with the same users.view authorization already used by People surfaces.
create function pulse_private.can_read_staff_avatar(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from public.users target
    where target.id = target_profile_id
      and (
        target.auth_user_id = auth.uid()
        or pulse_private.has_permission('users.view', target.department_id, target.team_id)
      )
  )
$function$;

create policy staff_avatar_read_authorized
on storage.objects
for select
to authenticated
using (
  bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and array_length(storage.foldername(name), 1) = 1
  and storage.filename(name) = 'avatar.webp'
  and pulse_private.can_read_staff_avatar(((storage.foldername(name))[1])::uuid)
);

-- Extend the protected person projection. The public list remains unchanged;
-- People already hydrates each row through this exact-detail contract.
drop function public.get_managed_user(uuid);

create function public.get_managed_user(target_user_id uuid)
returns table (
  id uuid,
  email text,
  full_name text,
  display_name text,
  employee_id text,
  status text,
  department_id uuid,
  team_id uuid,
  auth_email_confirmed boolean,
  roles jsonb,
  position_id uuid,
  position_code text,
  position_name text,
  primary_assignment_id uuid,
  primary_campaign_id uuid,
  primary_campaign_code text,
  primary_campaign_name text,
  primary_operating_unit_id uuid,
  primary_operating_unit_code text,
  primary_operating_unit_name text,
  primary_team_id uuid,
  primary_team_code text,
  primary_team_name text,
  google_avatar_url text,
  custom_avatar_path text,
  avatar_updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select
    managed.id,
    managed.email,
    managed.full_name,
    managed.display_name,
    managed.employee_id,
    managed.status,
    managed.department_id,
    managed.team_id,
    managed.auth_email_confirmed,
    managed.roles,
    target.position_id,
    position.code,
    position.name,
    primary_assignment.id,
    campaign.id,
    campaign.code,
    campaign.name,
    operating_unit.id,
    operating_unit.code,
    operating_unit.name,
    operational_team.id,
    operational_team.code,
    operational_team.name,
    target.google_avatar_url,
    target.custom_avatar_path,
    target.avatar_updated_at
  from public.list_managed_users(null) managed
  join public.users target on target.id = managed.id
  left join public.positions position on position.id = target.position_id
  left join lateral (
    select assignment.*
    from public.user_operational_assignments assignment
    where assignment.user_id = target.id
      and assignment.ended_at is null
      and assignment.is_primary
    order by assignment.started_at desc, assignment.id
    limit 1
  ) primary_assignment on true
  left join public.campaigns campaign on campaign.id = primary_assignment.campaign_id
  left join public.teams operational_team on operational_team.id = primary_assignment.team_id
  left join public.operating_units operating_unit on operating_unit.id = operational_team.operating_unit_id
  where managed.id = target_user_id
$function$;

alter function public.refresh_own_google_avatar() owner to postgres;
alter function public.set_staff_custom_avatar(uuid) owner to postgres;
alter function public.clear_staff_custom_avatar(uuid) owner to postgres;
alter function pulse_private.sanitize_google_avatar_url(text) owner to postgres;
alter function pulse_private.can_read_staff_avatar(uuid) owner to postgres;
alter function public.get_managed_user(uuid) owner to postgres;

revoke all on function public.refresh_own_google_avatar() from public, anon, service_role;
revoke all on function public.set_staff_custom_avatar(uuid) from public, anon, authenticated;
revoke all on function public.clear_staff_custom_avatar(uuid) from public, anon, authenticated;
revoke all on function pulse_private.sanitize_google_avatar_url(text) from public, anon, authenticated, service_role;
revoke all on function pulse_private.can_read_staff_avatar(uuid) from public, anon, service_role;
revoke all on function public.get_managed_user(uuid) from public, anon, service_role;

grant execute on function public.refresh_own_google_avatar() to authenticated;
grant execute on function public.set_staff_custom_avatar(uuid) to service_role;
grant execute on function public.clear_staff_custom_avatar(uuid) to service_role;
grant execute on function pulse_private.can_read_staff_avatar(uuid) to authenticated;
grant execute on function public.get_managed_user(uuid) to authenticated;

comment on function public.refresh_own_google_avatar() is 'Refreshes only the caller Google avatar from trusted auth.identities provider metadata.';
comment on function public.set_staff_custom_avatar(uuid) is 'Service-only canonical avatar state transition after trusted image validation and storage write.';
comment on function public.clear_staff_custom_avatar(uuid) is 'Service-only custom avatar clear used by the authenticated avatar boundary.';
