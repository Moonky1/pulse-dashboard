# Pulse production operations baseline

Last verified: 2026-08-25 (America/Bogota). This is an operational reference, not a source of secrets.

## Known-good baseline

- Canonical origin: `https://www.pulse-kk.com`; apex redirects to `www`.
- Production: `dpl_p2KpJvSzkFsszbe89qWTVs11JV6Y` (`https://pulse-jknmkj13u-pulsekk.vercel.app`).
- Source: `origin/main` at `329e1ca41a0a7289270e05e4b4856a7d4f92442c`; tag `pulse-auth-live-2026-08-25`.
- Supabase: Pulse Dev (`lhgnbcaundgjeofjrscg`, `us-east-1`).
- Migrations: `20260824000100`, `20260824000200`, `20260825000100`, `20260825000200`.
- Lifecycle backend: migration `20260825000200` is deployed and verified in Pulse Dev; AUTH-9C carries its exact certified source into Git before further database work.
- Production variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Both are browser-readable configuration and must target Pulse Dev. No server credential belongs in `VITE_*`.
- Entrypoint: `src/auth/main.jsx`; Vercel rewrites app routes to `index.html`.

Expected counts: Auth users 1; Pulse users 1; departments 1; teams 0; roles 10; role scopes 12; permissions 31; role permissions 155; role grant rules 26; user roles 1; audit events 1; Storage buckets 0; Edge Functions 0. Simon remains `KK-000001`, active, Corporate, Super Admin, global, with 31 effective permissions.

## Monitoring matrix

| Area | Signal | Initial check | Escalate when |
| --- | --- | --- | --- |
| Availability | `www`, `/signin`, `/register` | external HTTPS check every 5 minutes | two failures or TLS/DNS failure |
| Access | anonymous `/workspace` goes to Sign In | post-deploy smoke test | protected content renders anonymously |
| Frontend | uncaught errors/Auth failures | Vercel logs and controlled console check | repeated error or login impact |
| Deployment | status, alias, commit | Vercel notifications and immutable ID | build/commit/alias mismatch |
| Supabase | Auth/API/DB health and utilization | status, logs, usage | sustained error or capacity warning |
| Identity | sign-in failures and count changes | Auth logs and daily reconciliation | anomaly or unapproved count change |
| Registration | RPC and approval audit failures | database/Auth logs when rollout starts | partial profile or missing audit event |
| Control plane | migration/function/storage inventory | every release | any unplanned change |

Never log passwords, tokens, authorization headers, confirmation links, SMTP credentials, or full Auth payloads. Native Vercel and Supabase observability is enough for the next controlled rollout. Add Sentry only when multi-user traffic or client failures justify it; first configure PII/token scrubbing, release/source-map controls, retention, and ownership.

## Reusable deployment checklist

### Pre-deploy

- [ ] Confirm scope, incident lead, release operator, and Supabase/Auth operator.
- [ ] Confirm intended diff; preserve `AGENTS.md` and unrelated work.
- [ ] Fetch safely; verify branch, `HEAD`, `origin/main`, PR, and tag plan.
- [ ] Run targeted/full tests, lint, and production build.
- [ ] Scan built client for Apps Script, Sheets, `pulse_user`, `service_role`, private keys, passwords, and tokens.
- [ ] Review migrations and remote ledger; never auto-run an unreviewed migration.
- [ ] Validate Preview routes, refresh, sign-out, console, and network.
- [ ] Verify Production variable names/project target without printing values.
- [ ] Record previous Auth and Maintenance rollback deployments.
- [ ] Make an explicit go/no-go decision.

### Post-deploy

- [ ] Record deployment ID, immutable URL, commit, and aliases.
- [ ] Verify canonical/apex plus `/signin`, `/register`, `/workspace`, callback and refresh.
- [ ] Authorized Auth smoke: sign in, refresh/session restore, authenticated `/signin`, sign out, protected-route denial.
- [ ] Review console/network for unexpected third parties or secrets.
- [ ] Reconcile Auth/business counts, lifecycle/RBAC, migrations, Functions, and Storage.
- [ ] Review Vercel/Supabase logs and retain rollback targets.

## First-user rollout gates

Normal employee onboarding is **not yet approved**. Before a second real user:

- company-owned custom SMTP, authenticated sending domain, authorized delivery test, and named email owner;
- named verification/recovery/expiry/resend/support owners;
- audited operator tooling for approval, department/team, least-privilege role, block/reactivate/offboard—without ad-hoc SQL;
- approved department/team and role policy for the employee;
- audit evidence and count monitoring for every lifecycle/RBAC action;
- duplicate-account, mismatch, email-ownership, and departure policies;
- Preview passes this checklist with a staffed rollback window.

Recommended next checkpoint: **SMTP + operator onboarding readiness**, not creation of another user.
