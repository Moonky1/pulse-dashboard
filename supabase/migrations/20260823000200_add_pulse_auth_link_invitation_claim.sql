alter table public.pulse_auth_links
  add column invitation_claim_id uuid,
  add column invitation_claimed_at timestamptz;

alter table public.pulse_auth_links
  drop constraint pulse_auth_links_migration_state_valid,
  add constraint pulse_auth_links_migration_state_valid
    check (migration_state in (
      'pending_review', 'approved', 'inviting', 'invited', 'linked',
      'inactive', 'blocked', 'conflict'
    )),
  add constraint pulse_auth_links_invitation_claim_complete
    check (
      (migration_state = 'inviting' and invitation_claim_id is not null and invitation_claimed_at is not null)
      or
      (migration_state <> 'inviting' and invitation_claim_id is null and invitation_claimed_at is null)
    );
