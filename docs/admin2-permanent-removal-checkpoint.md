# ADMIN-2 permanent removal and catalog cleanup

Scope: permanently remove a Staff account's own account history, make its email
eligible for a new invitation after Auth cleanup, and retire the unapproved TO
operating unit. No new roles, permissions, identity domains or product surfaces.

## Security boundary

- Existing `users.remove`, `admin.access` and `users.view` checks remain mandatory.
- Self-removal, the last active Super Admin and stale versions remain protected.
- Only an exact user-targeted audit event can be deleted through an owner-only,
  transaction-bound context tied to an active global removal operator. Direct
  audit mutations and browser/service context writes remain denied.
- Shared activity, unknown foreign keys, GO results, content and other retained
  dependencies block permanent removal. They are never silently deleted.
- Staff, role grants and refresh sessions are removed transactionally. The
  existing protected Edge function completes Auth and canonical avatar cleanup.
  Pending cleanup remains resumable; a completed receipt retains no raw target
  name, email, Staff UUID, Auth UUID or avatar path.
- Already-retired accounts require an explicit, reviewed exact-target recovery;
  a new browser request cannot silently upgrade a previous historical removal.

## Catalog

The follow-up migration removes only the known TO seed tuple and catalog row.
Foreign keys reject unexpected references. Applying the business catalog cannot
recreate TO. Existing Openers, Closers, teams and positions are preserved.

## Validation

- Product release check: lint, 367 tests, build and whitespace checks passed.
- Applicable local database checks: 1,004 assertions across administration,
  invitations, profile and Agent contracts, including 52 permanent-removal tests.
- Isolated browser certification: 17 groups passed with no console/API errors,
  including physical Staff/Auth/audit deletion and four responsive viewport sizes.
- Reinvitations are checked locally without sending mail to a real person.
- A historical Training fixture fails with `new media must belong to a draft`
  on the unchanged baseline as well; it is outside this checkpoint.

Generate the two-migration reviewed transaction with:

```text
node scripts/admin-certification/prepare-migration-bundle.mjs --permanent-removal
```

This command only writes an ignored SQL artifact. It never connects to a remote
database. Remote application and real-account removal require explicit approval.
