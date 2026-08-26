# Pulse Auth incident and account runbook

## Rules

Preserve evidence. Identify by trusted Auth UUID and Pulse user ID, not name. Redact tokens/links. Use supported Supabase Admin/Dashboard and audited Pulse procedures; do not directly mutate `auth.users` with SQL. Never solve identity issues by changing RBAC, duplicating an account, or setting browser state.

## Incidents A–J

### A. Cannot sign in
Check canonical origin, identity/provider, verification, Pulse status, project status and sanitized logs. Separate wrong password from lifecycle/profile denial; use supported recovery. Do not reveal account existence, inspect passwords, change roles, or duplicate users. Escalate multiple-user failure or Auth success with fail-closed profile failure.

### B. Verification email absent
Check SMTP/provider, default-service recipient restrictions, rate limits, bounce/suppression/spam, redirects and Auth logs. After cooldown/reconciliation, send once through supported resend. Never auto-confirm, copy links, or spam retries. Escalate delivery/domain degradation.

### C. Recovery email absent
Follow B and verify recovery route. Keep public response non-enumerating. Never set/request the password. Escalate persistent callback/provider errors.

### D. Link expired
Differentiate expiry from wrong redirect/already-used token. Request one new link. Never extend/reconstruct a token. Escalate fresh links that immediately fail.

### E. Auth exists, Pulse profile missing
Confirm Auth UUID/verified email and missing `public.users`; inspect RPC/audit failure. Keep denied and reconcile through a reviewed idempotent server procedure. Do not hand-insert active profile/role. Treat as data integrity incident.

### F. Pulse profile/Auth mismatch
Keep denied; preserve UUIDs, email history, roles and audit evidence. Determine duplicate/email-change/corruption. Never relink by name/email alone or edit FKs ad hoc. Require security review and documented reconciliation.

### G. Unexpected blocked/inactive
Confirm lifecycle audit actor/reason. Preserve block while investigating. Reactivate only with identity and business approval through lifecycle tooling. Never bypass with cache/role changes. Missing audit evidence is immediate escalation.

### H. Session refresh failure
Check provider status, time, network, expiry and client version; allow one normal SDK retry. If invalid, sign out and require normal sign-in. Never log tokens or loop retries. Escalate multi-user failure.

### I. Supabase Auth outage
Confirm official/project status, pause onboarding/approval, preserve logs, and use Maintenance if identity is untrustworthy. Never weaken fail-closed access or add fallback identity. Restore only after recovery and reconciliation smoke tests.

### J. Frontend deployment failure
Confirm deployment/alias/commit and backend safety. Use Level 1 for frontend-only regression; Level 2 Maintenance for uncertain Auth/security/backend. Do not redeploy repeatedly or mutate Supabase to compensate. Canonical/callback/protected-route regressions escalate immediately.

## Account procedures: two separate control planes

| Operation | Supabase Auth identity | Pulse lifecycle/RBAC |
| --- | --- | --- |
| Resend | supported resend after cooldown | remains pending/fail-closed |
| Password help | initiate recovery; user sets password | none |
| Block | optionally revoke sessions/ban under policy | blocked transition with reason/actor/audit |
| Reactivate | remove ban after review | approved transition; explicitly restore only approved assignments |
| Profile correction | Auth metadata is not business authority | validated canonical update with audit |
| Email change | verified supported Auth change | reconcile canonical contact/link; never match by name |
| Duplicate | preserve identities/evidence; select canonical UUID | transactionally reconcile/retire without implicit RBAC merge |
| Offboard | disable/ban, revoke sessions/providers per retention | inactive, revoke assignments/access, preserve audit |

Every action needs ticket/reason, actor, before/after, timestamp, and independent review for Super Admin. Auth state and Pulse lifecycle/RBAC must both authorize access.
