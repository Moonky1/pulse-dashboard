# Pulse rollback and recovery

Record incident start, deployment/aliases/commit, symptoms, and counts before action. Keep one incident lead.

## Level 1 — previous Auth

- `dpl_8uswNktnyBjB6QhRJWEdEKW7zeVw`
- `https://pulse-1t9kbkirm-pulsekk.vercel.app`
- Use for frontend/routing/visual/build/Auth-SPA regression while Supabase remains trustworthy.

Inspect the immutable target, use Vercel's supported rollback operation for that exact URL/ID, then verify canonical/apex, SPA refresh, Sign In, session/profile, sign-out, protected-route denial, console/network and unchanged Supabase state. Record aliases. Do not change Git history during containment.

## Level 2 — static Maintenance

- `dpl_FVRz9ZeAFmowSqB9VeukDCziuLfU`
- `https://pulse-8vicqpaov-pulsekk.vercel.app`
- Use when Auth/backend integrity is uncertain, Supabase is unavailable, configuration is unsafe, security is suspected, or state needs reconciliation.

Inspect then promote that exact deployment. Verify `www`, apex and old routes serve Maintenance with zero Supabase/Auth/Storage/Realtime/Google requests. Freeze onboarding/mutations. Restore Auth only after root cause, reconciliation, tests and explicit go/no-go.

Current Vercel mechanism: `vercel rollback <deployment-url>` (or Dashboard equivalent), followed by `vercel rollback status`. Act on immutable identity, never a guessed alias.

## Source references

- `pulse-auth-live-2026-08-25`: reproduce/compare normalized live Auth.
- `pulse-pre-auth-live-2026-08-25`: forensic pre-live boundary, not automatic redeploy.
- `pulse-pre-clean-reset-2026-08-24`: historical pre-rebuild recovery only; never mix its legacy runtime with the new Foundation.

Tags are references, not reset instructions. Recover through reviewed branch/PR or immutable Vercel artifact. Never force-push `main`.

## Supabase recovery

- Keep forward migrations in version control and verify ledger each release.
- Pro projects have daily backups; evaluate PITR before one-day potential data loss is unacceptable.
- Keep encrypted off-platform logical exports with checksums, project ref, date, tool/Postgres version and restore instructions.
- Test Auth recovery: identity/provider/session/config portability differs from public schema. After restore, revoke/revalidate sessions and reconcile Auth UUIDs to `public.users` before reopening.
- Preserve `audit_events` and incident evidence.
- Before Storage adoption, define inventory, retention/versioning, encryption, checksums and off-platform object backup; restore objects and metadata together.
- Quarterly, restore into isolated non-production and verify migrations, counts, RLS/policies/grants/functions, Auth-profile integrity, audit continuity and app smoke tests. Never overwrite Production for a drill.

After restore, keep Maintenance active until counts/ledger, RLS/grants, Auth/profile/RBAC, functions/buckets, and signed-out/authorized smoke tests pass.

## Ownership

- Incident lead: containment, communication, evidence, go/no-go.
- Release operator: Vercel/Git action and route checks.
- Supabase/Auth operator: health/reconciliation; avoid self-approving privileged identity changes.
- Email owner: SMTP/domain reputation and provider escalation.

Simon may temporarily fill roles during the one-person pilot, but actions still need written reason/evidence. Add independent approval before more Super Admins or employees.

References: https://vercel.com/docs/deployments/rollback-production-deployment · https://supabase.com/docs/guides/platform/backups · https://supabase.com/docs/guides/platform/clone-project
