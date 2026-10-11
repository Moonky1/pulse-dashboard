# VICIdial manual reports and history — Preview checkpoint

## Workflow

1. Select the configured reporting scope. The upload date is read from the CSV full-day range, independently of the current Dashboard date.
2. Active Staff with canonical `dashboard.view` access to the entire scope may upload Call Stats Breakdown, Pause Code Breakdown, or both.
3. Confirm the displayed campaign and user-group filters. Campaigns are not encoded by the exports, so Pulse cannot independently verify them. Current agent groups are verified server-side.
4. The server validates each provided file's full-day range, group membership and every additive TOTALS field. If both are provided, dates and agent IDs must agree. The upload commits atomically; a failed upload never replaces existing data.
5. The Dashboard combines the latest Call Stats and latest Pause snapshot for the exact same scope/date. A one-sided upload never clears the other side. Each original upload remains independently readable in History. Comparisons require at least one shared report type and non-reversed shared source clocks.

## Storage and meaning

- Each distinct successful upload retains normalized per-agent metrics, all disposition and pause columns (including additional and unnamed columns), source generation times, original totals/averages, validation summary and uploader attribution. Combined Dashboard responses also include source IDs and attribution per report type. Missing report sides are not zero-filled.
- The original CSV bytes and filenames are **not** stored. This is report-data history, not a downloadable original-file archive.
- Source times remain VICIdial local wall-clock values. The server timezone is not confirmed; Pulse does not invent a timezone or label a manual upload Live.
- Identical exports are idempotent: the existing snapshot is reused and a duplicate attempt is recorded. The current dashboard selects the newest source version, not simply the last uploaded file.
- Comparisons subtract cumulative counters. They never sum uploads or subtract averages to invent interval averages. Added/missing agents and missing columns are not zero; decreased counters are identified as revision/reset signals.
- Historical versions remain stored. The subsequent [retention preview](dashboard-vici-retention.md) simulates the approved 7/90 policy without deletion or scheduling. An executor and original-file archive remain separate checkpoints.
- Missing SPXFER is reported as missing, not inferred from SPANIS. Screenshot thresholds, labor costs, sales attribution, and guessed team membership are not new business rules.

## Security and deployment

- Existing Staff identity and canonical scope/group read authorization are reused, including a service-transaction recheck of the authenticated actor. Browser roles are not trusted. Non-Staff, inactive accounts, and Staff lacking access to any requested group cannot import. Current and most-recent source groups must both be readable. Alert-rule management and retention remain global Admin/Super Admin capabilities, separately from upload permission.
- `pulse-vici-import` requires platform JWT verification, an explicit origin allowlist, real `auth.getUser()` validation and a second role check inside the database transaction.
- Five MiB per CSV; bounded streamed body; no arbitrary payload fields, credentials or raw CSV persistence/logging. One or both reports commit through the service-only RPC. A one-second per-uploader/scope cooldown permits independent uploaders without removing the shared write lock.
- Manual imports share the collector serialization lock but do not clear automatic errors, backoff, active leases or halted status. Remote VICIdial connectivity remains an independent issue.
- This incremental checkpoint is `20261011000100_vici_independent_reports.sql`, after the existing manual-report, retention and alert migrations. Prepare it with `prepare-manual-migration.mjs --independent-reports`. The script only generates an explicit transaction and registry entry; never run a broad remote database push.
- Deploy the import function with JWT verification enabled and configure `PULSE_VICI_IMPORT_ALLOWED_ORIGINS` for the exact Preview origin. No Production configuration or schema change belongs to this checkpoint.

## Verification

`npm run test:dashboard`, disposable local `npm run test:dashboard:db -- <fresh-review-db>`, `npm run test:dashboard:browser`, `npm run test:dashboard:manual-browser`, and `npm run pulse:release-check`.

Tests cover RBAC, atomic rollback, duplicate identity, history isolation, original totals, missing columns, independent report clocks, negative/added/missing comparisons, body limits, CORS, revoked permissions, invalid uploads preserving data, and responsive UI. Fixtures are synthetic and never become application data.

## Fast, concise upload UI

The main screen omits connection/timezone boilerplate and metric subtitles. Full source detail remains collapsed. Header date detection reads at most 4 KiB; all authoritative parsing stays server-side. Authentication/scope checks run concurrently. The import returns the protected Dashboard read in the same response so the browser can render it without a second network round trip. A failed follow-up read never changes an already confirmed save into a failed import. Requests that began before a successful import cannot replace the newly accepted result.

The target is under two seconds for ordinary CSV uploads. Local synthetic browser timings exclude real network, Edge cold starts and remote database latency; report them separately from any measured Preview timing.

## Confirmed Asia teams

Operator confirmation on 2026-10-11: `OpenersAsia` is **Asia A** (`asia_team_a`), and `OpenersAsia1` is **Asia B** (`asia_team_b`). Both use a 15 English XFER daily goal. Exact current user groups and canonical mapping are used, never agent-name prefixes or the most-recent group. Team chips count distinct IDs in the displayed report type; Call Stats plus Pause does not double the count. Missing reports are not zero-agent teams.

`scripts/dashboard-certification/configure-asia-preview.sql` is a guarded, idempotent **Preview-only** configuration transaction. It preserves the existing A scope/source/history, creates a distinct B scope, and maps each to its already-existing canonical team. It does not change users, roles or agent rosters. Existing conflicting mappings or source definitions abort the transaction. Scoped reads/uploads continue through the canonical Dashboard permissions.

`Openers`, `Openers2`, … are VICIdial **campaigns**, not A/B user groups. The supplied CSV schemas contain no per-agent campaign column; a combined export cannot support campaign-specific counts. Keep that breakdown unavailable until separately identified campaign exports or a source contract provide it. Do not infer it from names, Agent IDs, `SPANIS`, or the group suffix `1`.
