# VICIdial manual reports and history — Preview checkpoint

## Workflow

1. Select the configured reporting scope and the explicit VICIdial source date.
2. An active global Admin or Super Admin with `dashboard.view` uploads both original CSV exports: Agent Performance Detail and Pause Code Breakdown.
3. Confirm the displayed campaign and user-group filters. Campaigns are not encoded by the exports, so Pulse cannot independently verify them. Current agent groups are verified server-side.
4. The server parses both files, validates the same full-day range, identical agent IDs and every additive TOTALS field, then commits the pair atomically. A failed upload does not replace the existing report.
5. Use History & comparisons to open a stored version or compare two versions of the same date and scope. Source clocks must progress in both reports.

## Storage and meaning

- Each distinct successful pair retains normalized per-agent metrics, all disposition and pause columns (including additional and unnamed columns), source generation times, original totals/averages, validation summary and uploader attribution.
- The original CSV bytes and filenames are **not** stored. This is report-data history, not a downloadable original-file archive.
- Source times remain VICIdial local wall-clock values. The server timezone is not confirmed; Pulse does not invent a timezone or label a manual upload Live.
- Identical exports are idempotent: the existing snapshot is reused and a duplicate attempt is recorded. The current dashboard selects the newest source version, not simply the last uploaded file.
- Comparisons subtract cumulative counters. They never sum uploads or subtract averages to invent interval averages. Added/missing agents and missing columns are not zero; decreased counters are identified as revision/reset signals.
- Historical versions remain stored; this checkpoint adds no deletion or scheduled retention. A retention policy and original-file archive would require a separate storage/access checkpoint.
- Missing SPXFER is reported as missing, not inferred from SPANIS. Screenshot thresholds, labor costs, sales attribution, and guessed team membership are not new business rules.

## Security and deployment

- Existing Staff identity and scope/group read authorization are reused. Browser roles are not trusted. Agents, ordinary viewers, anonymous users and scoped-only admins cannot import.
- `pulse-vici-import` requires platform JWT verification, an explicit origin allowlist, real `auth.getUser()` validation and a second role check inside the database transaction.
- Five MiB per CSV; bounded streamed body; no arbitrary payload fields, credentials or raw CSV persistence/logging. Both reports commit together through the service-only RPC.
- Manual imports share the collector serialization lock but do not clear automatic errors, backoff, active leases or halted status. Remote VICIdial connectivity remains an independent issue.
- Apply only `20261010000100_vici_manual_reports.sql` to the authorized Preview project. The preparation script generates a transaction and migration registry entry; it does not connect to a database. Do not run a broad remote database push.
- Deploy the import function with JWT verification enabled and configure `PULSE_VICI_IMPORT_ALLOWED_ORIGINS` for the exact Preview origin. No Production configuration or schema change belongs to this checkpoint.

## Verification

`npm run test:dashboard`, disposable local `npm run test:dashboard:db -- <fresh-review-db>`, `npm run test:dashboard:browser`, `npm run test:dashboard:manual-browser`, and `npm run pulse:release-check`.

Tests cover RBAC, atomic rollback, duplicate identity, history isolation, original totals, missing columns, independent report clocks, negative/added/missing comparisons, body limits, CORS, revoked permissions, invalid uploads preserving data, and responsive UI. Fixtures are synthetic and never become application data.
