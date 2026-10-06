# ADMIN-2 Production release

Released on 2026-10-05 after explicit user authorization and remote Preview certification.

## Scope

- Canonical website remains `https://www.pulse-kk.com`; backend remains Pulse Dev (`lhgnbcaundgjeofjrscg`).
- People opens on Active + Pending. Blocked and Inactive remain accessible only through explicit filters. Removed identities are excluded even from All statuses.
- Super Admin removal requires live permissions, target-version validation and typed REMOVE. Dependency-free identities are purged; required historical attribution is retained internally with access and presentation removed. Self-removal and removal of the last active Super Admin are denied.
- Staff profiles have compact access administration and a lazy, initially collapsed Activity log. Agents use a bounded, credential-free directory. Obsolete invitations support safe removal; accepted invitations remain protected, and active invitations must be revoked first.
- The invitation origin addition applies only to the named ADMIN-2 Preview URL and its invitation function. Existing shared origins, SMTP, delivery mode and Production invitation configuration were not changed.

## Certification

The full release check passed 367 tests, lint, build and diff validation. The reviewed schema-only local copy passed 635 SQL assertions (73 ADMIN-2, 562 regressions); isolated browser tests passed 17 groups across desktop, tablet, landscape and mobile.

Remote Preview used exactly two disposable Staff accounts and three fictitious invitations. Actual authenticated UI and Edge removal completed both cleanup jobs. Final verification passed 18 assertions, plus the initial ordinary-Staff denial: deleted Auth for the dependency-free identity, blocked Auth for the historical identity, preserved attribution, no remaining roles or refresh sessions, old access tokens denied by RLS, new sign-ins and refreshes denied, obsolete invitation purged, revoked invitation hidden with history retained, and accepted invitation preserved. No real person or Production fixture was changed; temporary credentials were held only in process memory and discarded when verification completed.

## Production backend and smoke checks

Only two reviewed migrations were applied in one bounded transaction, with ledger registration and API schema reload; no remote db push:

- `20261005000100_admin2_people_removal.sql`: SHA-256 `4475d25857c4c9677afc4620270cb09055d3540c6dc30728fb363d0214751c4b`.
- `20261005000200_admin2_directory_and_invitations.sql`: SHA-256 `5e3cbb4c68b8d3b5c3eb0845cae40319f2c6d5af0b2df668c53b7efc4a877437`.

`pulse-staff-removal` is ACTIVE with JWT verification enabled and its dedicated allowed origin restricted to the canonical website. Production OPTIONS returns 204 for www and 403 for Preview; unauthenticated POST returns 401. Anonymous clients cannot prepare removal and browser-authenticated clients cannot execute privileged cleanup.

Implementation commit `8cbd11c5bd38ac2f43244c8bf2cc290fd343aa1b` was verified READY on Vercel Production from main. Public bundle inspection confirmed Pulse Dev and no privileged frontend JWT; the Agent visitor API returned 401. The existing Staff session loaded People with three Active/Pending rows, excluding the existing Inactive person. The real Agent directory and the Active + Pending invitation catalog also loaded. No real removal was performed: zero removed Staff/invitations; the two active Staff and one global Super Admin assignment remained.

The final documentation/test-runner closure is a subsequent main commit; its exact Ready deployment and Git equality are checked at handoff. Screenshots and temporary verification files stay ignored in `review-evidence.local/admin2/`.

## Recovery and next checkpoint

If a frontend rollback is needed, restore the previously approved deployment through the release process. Preserve the additive schema, audit history and real results; do not reset the database or force-push Git history. Pending cleanup is durable and retryable through the same request.

ADMIN-2 has no remaining release blocker. Dashboard implementation, real Agent bulk registration, transfers/commissions and Agent question-audio authorization require their own reviewed checkpoints; this release does not invent these data or permissions.
