# Agent-1 production release

## Scope and access

This release promotes `pulse/agent-1-go-identity` and the pending trimmed-question-audio work. Simon explicitly authorized the Production promotion, the twelve pending migrations, the protected media function and the two server-only Production settings on 2026-10-04.

- Canonical website: `https://www.pulse-kk.com`.
- Production backend remains Pulse Dev (`lhgnbcaundgjeofjrscg`). Preview remains a separate project; its identities, PINs and results are not copied.
- Staff enter at `/signin`. Agents enter at `/agent/signin`; each Agent uses their assigned ID and private PIN.
- Authorized administrators create an Opener identity with a real name, ID and active campaign Opener team, and privately deliver the one-time activation code. The Agent chooses their own PIN. Reissuing the code revokes the previous PIN and open sessions.
- Agent accounts are separate from Staff users/RBAC. Agents may play GO, use Academy and inspect their own profile; they cannot host, author in Studio, administer users or access Staff Dashboard.
- Active Staff may inspect `/profile/AgentID` through the protected Staff profile contract. Anonymous visitors cannot enumerate or inspect these profiles.
- Competitive points derive only from completed Hosted results. Practice and Certification do not award competitive points. Weekly views filter the persistent history; they do not delete all-time results.

## Release gates

The full `npm run pulse:release-check` passed. A schema-only dump of current Production was restored into a task-owned disposable database; no Production users or business records were copied. All twelve migrations were applied as one transaction and 149 SQL assertions passed across identity, PIN activation, Practice, Hosted participation, Realtime signal boundaries, progress, ranking and presentation metadata. Test transactions rolled back with zero Staff, Agents or results left in the disposable database.

Production migration batch:

- `20261003000500`–`20261003000600`: private trimmed question audio and payload bounds.
- `20261004000100`–`20261004001000`: separate Agent identities, protected player APIs, progress/ranking, shared scoring, Realtime change signals, self-set PIN activation, Openers-only provisioning and safe profile/presentation reads.

The batch registers each version in the migration ledger, uses a bounded lock/statement timeout and reloads the API schema cache. No remote `db push` is used. Before/after aggregate fingerprints cover existing Auth/Staff identities, assignments, teams, content/questions, attempts/results and Hosted rooms/memberships. Only new membership identifiers and nullable audio columns are excluded from this comparison.

The Agent API requires `PULSE_AGENT_SUPABASE_URL` and `PULSE_AGENT_SERVICE_ROLE_KEY` in Vercel Production, stored as sensitive server-only settings. Never prefix a privileged key with `VITE_`, put it in source, expose it in browser requests or write it to a release artifact. The `pulse-training-media` Edge Function retains JWT verification and protected media authorization. Its dedicated allowed origin is the canonical website.

## Verification and rollback

Confirm the deployed commit is Ready in Vercel and owns the canonical domain. Check the homepage, Staff/Agent entry pages, direct route refreshes and anonymous access denial without creating synthetic Production accounts. An authenticated Staff check uses an existing user session; do not change Simon or seed fictitious Agents for a production smoke test.

The production smoke check exposed an initial Staff token-refresh bootstrap race. The provider now hydrates the trusted profile on an initial refresh instead of prematurely marking the token resolved and leaving the page loading indefinitely. Normal refreshes of an already hydrated identity keep the previous behavior. Regression tests execute the provider's actual event callback. Existing authenticated bootstrap also refreshes Auth session metadata and the own-Google-avatar helper's `updated_at`; migration-time fingerprints were compared before these normal smoke-check refreshes.

Previous Ready Production deployment: `https://pulse-auhj8bhgt-pulsekk.vercel.app` (`dpl_9wTH9QRPwDKSLTLTurc7AdGr18cf`). If the frontend needs rollback, restore that deployment through the approved release process; preserve the additive schema and real results. Do not reset the database or force-push Git history.

## Remaining checkpoints

- Complete a live browser Hosted round with two separately activated Agents in Preview. SQL Hosted participation tests passed; this is not a substitute for that browser run.
- Question-audio authoring and playback in this release use Staff media authorization. Agent question-audio playback still needs a separate protected media-read contract; never reuse Staff privileges as a workaround.
- Transfers, commissions and operational performance need a reviewed real data source. Do not show invented values in Agent profiles.
- Dashboard implementation, real Agent bulk registration and OAuth/custom-domain/billing changes are outside this release.
