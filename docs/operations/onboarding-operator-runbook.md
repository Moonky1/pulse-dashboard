# Pulse onboarding operator runbook — controlled backend ready

## Selected transitional mechanism

For the next controlled users, use the company-controlled JavaScript CLI in `scripts/pulse-operator/`, authenticated as the operator through Supabase Auth. It calls only canonical RPCs with the operator JWT; it never uses `service_role`, accepts pasted access tokens, stores passwords, or updates tables directly. The audited lifecycle backend migration `20260825000200` was deployed and verified in AUTH-9B. The CLI source is normalized through AUTH-9C and must not be used for a real account mutation without a separately approved operator checkpoint.

Supabase SQL Editor is not the operational mechanism: it runs with database authority rather than the operator's normal Auth context and weakens actor attribution. Browser console snippets are also prohibited. A trusted admin UI can replace the CLI later.

### Operator setup after AUTH-9B deployment

Provide only public configuration in the operator terminal session:

- `PULSE_SUPABASE_URL`
- `PULSE_SUPABASE_PUBLISHABLE_KEY`

Run with `npm run operator -- <command>`. The CLI prompts for the operator's company email and a hidden password, disables session persistence/refresh, signs out on completion, and never accepts a JWT or database credential.

Supported commands:

- `users pending`
- `users inspect <user-id>`
- `users approve <user-id> <department-id> <team-id|none> <roles-json>`
- `users block <user-id> [reason]`
- `users reactivate <user-id> [reason]`
- `users inactivate <user-id> [reason]`
- `roles assign <user-id> <role-id> <scope> [department-id|none] [team-id|none]`
- `roles remove <user-id> <user-role-id>`

Every mutation first calls the narrow inspection RPC and prints the exact target/action. Normal sensitive operations require `CONFIRM <ACTION> <UUID>`; granting Super Admin requires `GRANT SUPER ADMIN <UUID>`. A timeout or unknown response must be reconciled with user state and audit events before retry.

## Approval procedure

Preconditions: target has exactly one verified Auth identity and one `pending_approval` Pulse profile; reviewer is active, is not the target, and has global `users.approve` plus `roles.assign`; department/team and requested roles/scopes are active; every assignment passes `role_grant_rules`; change ticket and second-person identity confirmation exist.

1. Sign the operator into the controlled CLI using the canonical Pulse origin/session flow.
2. List pending profiles through an authorized, minimal read path; select the exact Pulse user UUID and display verified email for confirmation.
3. Confirm employee identity out-of-band and match the verified Auth email.
4. Select one active department and, when applicable, one team belonging to it.
5. Select only approved roles and scopes; show effective assignment preview.
6. Validate the grant rules and enforce no self-approval.
7. Present a final immutable summary: target UUID/email, department/team, roles/scopes, operator, ticket/reason.
8. After explicit operator confirmation, call `approve_pending_user(target_user_id, selected_department_id, selected_team_id, requested_roles)` exactly once.
9. On timeout/unknown result, reconcile state and audit events before any retry.
10. Verify server-generated employee ID, `active` status, department/team, role assignments and effective permissions.
11. Verify one `account.approved` event and one `role.assigned` event per assignment.
12. Communicate access readiness without disclosing role internals or credentials.

Any failed precondition is fail-closed. Never compensate with direct `INSERT`/`UPDATE`, manually generate employee IDs, set JWT claims, or assign Super Admin outside separately approved executive/security review.

## Pending rejection

The existing `block_pending_user(target_user_id, reason)` RPC is approved for the future CLI. Confirm exact target, verified identity, pending state, reason and operator permission; call once; verify `blocked`, timestamp and `account.blocked` audit event. It prohibits self-blocking and non-pending targets.

## Active block, reactivation and offboarding

The deployed lifecycle backend provides canonical, permission-checked and audited RPCs for these transitions:

- active → blocked
- blocked/inactive → active
- active/blocked → inactive
- role removal or restoration during lifecycle changes

AUTH-9B deployed the permission-checked, idempotent and audited RPCs for block, reactivate and inactivate, plus narrow role assignment/removal operations. Direct table updates remain prohibited. Auth identity banning/session revocation remains separate: the Pulse lifecycle becomes fail-closed immediately, while a future server-side Auth administration checkpoint may coordinate session revocation without elevated credentials in the CLI.

## Audit coverage

| Operation | Current coverage |
| --- | --- |
| Pending profile created | canonical RPC audit event exists |
| Account approved | `account.approved` exists |
| Role assigned during approval | `role.assigned` per assignment exists |
| Pending rejected/blocked | `account.blocked` exists |
| Active blocked/reactivated/inactivated | audited RPCs/events deployed and verified in AUTH-9B |
| Role removed | audited RPC/event deployed and verified in AUTH-9B |
| Email changed | gap requiring Auth + Pulse reconciliation event |
| Employee metadata corrected | gap |

## AUTH-7 readiness matrix

| Gate | Status | Reason |
| --- | --- | --- |
| SMTP | NO-GO | custom SMTP disabled; provider/DNS approval unavailable |
| Sender identity | NO-GO | concept prepared, not company-approved |
| SPF / DKIM / DMARC | NO-GO | DNS owner must review provider-specific records |
| Verification / recovery delivery | NO-GO | default service is not production rollout infrastructure |
| Templates | PREPARED | local drafts only; not deployed/tested |
| Pending profile | GO | canonical idempotent RPC deployed |
| Approval backend | GO | canonical atomic RPC with permission/grant checks and audit |
| Operator approval mechanism | READY, NOT YET AUTHORIZED | CLI implemented/tested; backend deployed; real use requires a controlled operator checkpoint |
| Pending rejection | BACKEND GO | canonical audited RPC exists; operator surface missing |
| Active blocking | BACKEND DEPLOYED | canonical audited RPC is remote; real use requires an approved operator action |
| Reactivation/offboarding | BACKEND DEPLOYED | Pulse lifecycle RPCs are remote; Auth session coordination remains deferred |
| Monitoring | GO for pilot | native baseline/runbooks exist |
| Rollback | GO | Auth and Maintenance artifacts preserved |

Decision: AUTH-7 documentation/design can close, but Pulse is **not ready to authorize the second real user**.

## Explicit AUTH-8 deferrals

- Department/team changes are deferred because every scoped role must be revalidated atomically; a dedicated User Management backend should design that transaction.
- `full_name`/display-name correction is deferred until a narrow `users.manage` RPC and approved field/audit policy are reviewed.
- Login-email reconciliation remains separate from profile metadata and requires coordinated verified Supabase Auth identity handling.
