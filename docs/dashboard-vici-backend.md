# DASHBOARD-1 backend proof

## Delivered

Migration `20261009000100_vici_dashboard_storage` adds six RLS-enabled tables:
source scopes, explicit group mappings, sync runs, integration health, performance
snapshots and pause snapshots. No browser role can read the raw tables. Credentials
and raw CSV are absent. Durations are integer seconds; dispositions retain XFER
and SPANIS independently. Agent linkage is a read-time join on exact `agent_code`,
so unlinked observations remain valid and a later roster import resolves them.

Protected Staff RPCs are `list_vici_dashboard_scopes` and `get_vici_dashboard`.
Both require a real active Staff identity. `dashboard.view` is checked against the
canonical scope helpers. An unmapped Vici group is visible only to an existing
global Dashboard permission; a team-scoped caller cannot inherit its own team as
the scope of an unknown group. Every group in a multi-group scope must be allowed.
Moved/unmapped row identities also fail closed for scoped readers. No grants,
real identities or Vici-to-Pulse team mappings were invented.

The collector takes a database lease before contacting Vici. Performance and Pause
commit in one transaction. An invalid second export cannot leave half a snapshot.
The identity is scope + requested range + both source generation clocks; a hash of
canonical rows distinguishes exact retries from conflicting data. Row order and
ingestion time do not change the identity. Duplicate attempts remain auditable
without duplicating observations. An older source generation cannot replace the
latest source generation for a date.

Leases expire after 120 seconds. Starts are separated by at least 60 seconds.
Temporary failures use capped exponential backoff; rate-limit delays are honored.
Authentication, IP validation, unexpected redirects and configuration errors halt
the scope until explicit server-operator recovery through `resume_vici_sync`.
The scheduler must never call that recovery RPC automatically.

`pulse-vici-collector` accepts only POST requests with the collector-only server
secret. The platform JWT check remains enabled. It rejects browser origins,
unexpected fields, caller-selected URLs and oversized bodies. Vici credentials
come exclusively from server environment variables. The initial byte comparison
against the platform's internal service token was replaced by a domain-separated
collector secret; the gateway validation was not disabled. Preview's proof script
derives that token privately using HMAC-SHA256 keyed by its verified service key,
and installs it only when explicitly requested. It never prints it or publishes
it to the frontend. Only bounded error categories/reasons leave the server.

## Verification on 9 October 2026 (Bogota)

- 73 SQL assertions passed in a fresh schema-only disposable database. All
  synthetic Staff, Agents, scopes and runs rolled back to zero afterward.
- 70 Dashboard Node tests: 27 parser, 24 HTTP, 19 collector/endpoint checks.
- Full release check: 535 Node tests, lint, build and whitespace checks passed.
- A separate private local database ran the actual collector against Vici for
  `2026-10-09`, twice, with start intervals of 61 seconds. Each pair had 50
  Performance and 50 Pause observations. The database retained two generations
  (100 rows per snapshot table), not 100 distinct agents.
- The third cycle simulated source unavailability. Snapshot counts and the last
  successful sync timestamp stayed unchanged. No real Staff or Agents were created.
- Local live-proof database: `pulse_dashboard1_review_20261009_3`. It retains
  normalized private report observations for this review, not CSV or credentials.

## Remote state

The CLI and prior release documentation identified **Pulse Preview** as
`sgshbawggqapuyqzkyhs`. The new migration was applied and registered atomically only
there. Only `pulse-vici-collector` was deployed. Its secrets are server-only. One
integration scope reproduces the observed campaigns and `OpenersAsia`, with no
Pulse Team mapping and no assumed source timezone.

Anonymous invocation returned 401. The authenticated server invocation reached
the collector, but its Vici request failed with `source_network_error` at the
`connect` stage, before receiving an HTTP response. It did not
return an IP-validation page or a successful report. The source-specific cause
is not established by that category alone. No source CSV or zero-agent successful
snapshot was recorded. The failure is in persistent protected health.

Before/after checks show unchanged existing counts: Auth 13, Staff 13, Agents 3.
No Pulse Dev or Production data/configuration was changed. No scheduler was created.
The user suggested Pacific time but did not confirm its IANA configuration; a wall
clock screenshot alone cannot establish DST behavior. Explicit-date queries work
without that assumption; automatic Today is refused until it is confirmed.

## Scheduling and retention gates

Selected architecture: Supabase Cron + pg_net invokes the protected Edge endpoint
once per minute; server credentials belong in Vault, not literal job SQL. Supabase
documents this scheduling pattern and recommends at most eight concurrent jobs.
Sources checked: [scheduling](https://supabase.com/docs/guides/functions/schedule-functions)
and [Cron limits](https://supabase.com/docs/guides/cron).

No schedule is installed until remote connectivity and source timezone are proven.
A future job must send its trusted scope ID, let the server derive Today in the
confirmed timezone, respect database cooldown/halts, and avoid browser Vici calls.

Exact planned retention before Production: keep minute-level successful pairs for
7 days; for ages 8–90 days retain the last successful pair per scope and requested
source date; protect the latest successful pair for each scope even when older,
and every running/leased run. Retain sanitized failed/duplicate run metadata for
30 days. Purge duplicate references before their parent, never the active lease.
No rollup is presented as a sum of cumulative daily report snapshots. This policy
is documented, not activated: no source history was deleted during this checkpoint.

Remaining: resolve Preview-to-Vici connectivity with the provider, confirm timezone,
build the Dashboard screen and responsive QA, then prove multiple remote minute
cycles and failure freshness. Production still requires separate review/approval.
