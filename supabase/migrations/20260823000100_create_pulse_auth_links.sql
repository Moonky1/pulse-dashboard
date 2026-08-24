create table public.pulse_auth_links (
  legacy_user_id uuid primary key default gen_random_uuid(),
  legacy_book_id text not null,
  legacy_row_index bigint not null,
  legacy_name text not null,
  legacy_team text,
  legacy_role text,
  legacy_agent_ext text,
  corporate_email text,
  auth_user_id uuid references auth.users (id) on delete restrict,
  migration_state text not null default 'pending_review',
  legacy_registered_at timestamptz,
  legacy_registration_raw jsonb,
  approved_at timestamptz,
  invited_at timestamptz,
  auth_created_at timestamptz,
  linked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pulse_auth_links_legacy_name_not_blank
    check (btrim(legacy_name) <> ''),
  constraint pulse_auth_links_corporate_email_not_blank
    check (
      corporate_email is null
      or (
        corporate_email = btrim(corporate_email)
        and corporate_email <> ''
      )
    ),
  constraint pulse_auth_links_registration_raw_is_object
    check (
      legacy_registration_raw is null
      or jsonb_typeof(legacy_registration_raw) = 'object'
    ),
  constraint pulse_auth_links_migration_state_valid
    check (
      migration_state in (
        'pending_review',
        'approved',
        'invited',
        'linked',
        'inactive',
        'blocked',
        'conflict'
      )
    ),
  constraint pulse_auth_links_approved_states_have_email
    check (
      migration_state not in ('approved', 'invited', 'linked')
      or corporate_email is not null
    ),
  constraint pulse_auth_links_invited_states_have_invited_at
    check (
      migration_state not in ('invited', 'linked')
      or invited_at is not null
    ),
  constraint pulse_auth_links_linked_state_complete
    check (
      migration_state <> 'linked'
      or (
        auth_user_id is not null
        and linked_at is not null
      )
    )
);

create unique index pulse_auth_links_corporate_email_lower_key
  on public.pulse_auth_links (lower(corporate_email))
  where corporate_email is not null;

create unique index pulse_auth_links_auth_user_id_key
  on public.pulse_auth_links (auth_user_id)
  where auth_user_id is not null;

create function public.pulse_auth_links_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.legacy_user_id is distinct from old.legacy_user_id then
    raise exception 'legacy_user_id is immutable';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger pulse_auth_links_before_update
before update on public.pulse_auth_links
for each row
execute function public.pulse_auth_links_before_update();

alter table public.pulse_auth_links enable row level security;

revoke all on table public.pulse_auth_links from public, anon, authenticated;
revoke all on function public.pulse_auth_links_before_update() from public, anon, authenticated;

grant select, insert, update, delete on table public.pulse_auth_links to service_role;

comment on table public.pulse_auth_links is
  'Protected mapping between reviewed legacy Pulse staff records and Supabase Auth users.';

comment on column public.pulse_auth_links.legacy_user_id is
  'Immutable Pulse identity assigned during reviewed legacy migration.';

comment on column public.pulse_auth_links.legacy_row_index is
  'Mutable migration provenance only; never a permanent identity key.';

comment on column public.pulse_auth_links.corporate_email is
  'Administrator-approved staff email. Domain eligibility is enforced by the protected backend.';
