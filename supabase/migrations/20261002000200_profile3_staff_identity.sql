-- PROFILE-3: Staff-owned display identity with opt-in Staff-only visibility.
-- The users table remains read-only to authenticated clients. Only these narrow
-- functions can write or share the new profile fields.

alter table public.users
  add column profile_bio text,
  add column profile_presence text,
  add column profile_visible_to_staff boolean not null default false,
  add constraint users_profile_bio_length check (
    profile_bio is null or length(btrim(profile_bio)) between 1 and 280
  ),
  add constraint users_profile_presence_valid check (
    profile_presence is null or profile_presence in ('available', 'focused', 'away')
  );

create function public.update_own_staff_profile(
  requested_display_name text,
  requested_bio text,
  requested_presence text,
  requested_visible_to_staff boolean
)
returns table (
  display_name text,
  profile_bio text,
  profile_presence text,
  profile_visible_to_staff boolean
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  clean_name text := nullif(btrim(requested_display_name), '');
  clean_bio text := nullif(btrim(requested_bio), '');
  clean_presence text := nullif(btrim(requested_presence), '');
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if clean_name is not null and length(clean_name) not between 2 and 80 then
    raise exception 'display name must be 2 to 80 characters' using errcode = '22023';
  end if;
  if clean_bio is not null and length(clean_bio) > 280 then
    raise exception 'bio must be at most 280 characters' using errcode = '22023';
  end if;
  if clean_presence is not null and clean_presence not in ('available', 'focused', 'away') then
    raise exception 'invalid profile status' using errcode = '22023';
  end if;
  if requested_visible_to_staff is null then
    raise exception 'visibility choice required' using errcode = '22023';
  end if;

  return query
  update public.users profile
  set display_name = clean_name,
      profile_bio = clean_bio,
      profile_presence = clean_presence,
      profile_visible_to_staff = requested_visible_to_staff
  where profile.auth_user_id = auth.uid()
    and profile.status = 'active'
  returning profile.display_name, profile.profile_bio,
            profile.profile_presence, profile.profile_visible_to_staff;

  if not found then
    raise exception 'active Staff profile required' using errcode = '42501';
  end if;
end
$function$;

create function public.get_staff_public_profile(target_profile_id uuid)
returns table (
  id uuid,
  name text,
  bio text,
  presence text,
  google_avatar_url text,
  custom_avatar_path text,
  avatar_updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select profile.id,
         coalesce(nullif(btrim(profile.display_name), ''), profile.full_name),
         profile.profile_bio,
         profile.profile_presence,
         profile.google_avatar_url,
         profile.custom_avatar_path,
         profile.avatar_updated_at
  from public.users profile
  where profile.id = target_profile_id
    and profile.status = 'active'
    and profile.profile_visible_to_staff
    and pulse_private.current_user_is_active()
$function$;

-- Existing owner and users.view access is preserved. Opted-in profiles also
-- let active Staff request signed URLs for their custom photo.
create or replace function pulse_private.can_read_staff_avatar(target_profile_id uuid)
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
        or (
          target.status = 'active'
          and target.profile_visible_to_staff
          and pulse_private.current_user_is_active()
        )
      )
  )
$function$;

alter function public.update_own_staff_profile(text, text, text, boolean) owner to postgres;
alter function public.get_staff_public_profile(uuid) owner to postgres;
alter function pulse_private.can_read_staff_avatar(uuid) owner to postgres;

revoke all on function public.update_own_staff_profile(text, text, text, boolean) from public, anon, service_role;
revoke all on function public.get_staff_public_profile(uuid) from public, anon, service_role;
grant execute on function public.update_own_staff_profile(text, text, text, boolean) to authenticated;
grant execute on function public.get_staff_public_profile(uuid) to authenticated;

comment on function public.update_own_staff_profile(text, text, text, boolean) is 'Updates only the active caller display name, bio, presence, and Staff-only visibility.';
comment on function public.get_staff_public_profile(uuid) is 'Returns only opted-in active Staff profile details to another active Staff caller; never emails or roles.';
