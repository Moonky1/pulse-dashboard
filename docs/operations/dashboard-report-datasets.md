# Dashboard report selections

Checkpoint: 2026-10-13. Existing users, grants and stored reports are preserved.

## Upload contract

- Original full-day Call Stats and/or Pause CSVs remain independently accepted. Dates come from the file header, not its name or the browser clock.
- The operator chooses campaigns and explicitly confirms that the same filters were used to export every file. VICIdial exports contain no campaign column: this is attestation, not automatic proof of campaign membership.
- Run test accepts exactly `Openers5` and `Openers6`, with its own saved selections. It does not display ordinary production goals or coaching evaluations. Dispositions retain their original codes; no code is guessed to mean answering machine.
- Current user groups are derived by the server. An export containing all ordinary source groups uses a stable full-source namespace; optional ADMIN, Training or Monitors rows do not change that namespace. Other exports retain their exact group subset.
- Dataset identity is parent source + kind + sorted campaigns + sorted groups. Dates and immutable versions are stored inside that dataset. Partial exports never sum into, or replace, a different selection.
- Call Stats and Pause submitted together must still contain the same Agent IDs. Otherwise upload each original separately or re-export both using identical filters.

## Storage and authorization

Migration `20261013000700` adds a private registry and the service-only `import_vici_dataset` wrapper around the existing atomic writer. The browser cannot submit normalized rows or select an actor. Existing Staff checks run before parsing and again at commit. Child scopes copy only existing canonical parent resource mappings; no roles or identities are granted. General-source subsets remain restricted to existing global Dashboard readers when that source has no team mappings.

New immutable general source: `829f3d68-fbcb-43ec-b6f7-f12e8bcca76f`. It adds the observed Monitors source group. Earlier source definitions and snapshots are not modified or reclassified. Existing source guards remain active. The new UI uses dataset imports; the old import protocol remains available to existing clients.

Refresh reads stored data for the selected date/report, never a newly downloaded local file. Updating an export requires selecting the updated file and uploading again. Identical retries are deduplicated. URL filters preserve the saved selection across reloads; no report data is stored in browser persistence.

## Validation / rollout

- `npm run pulse:release-check`
- `node scripts/dashboard-certification/db-review.mjs <fresh-local-db>`
- `node scripts/dashboard-certification/datasets-db-review.mjs <local-db> [--originals]` (originals remain local; transaction rolls back)
- `node scripts/dashboard-certification/datasets-browser.mjs`
- `node scripts/dashboard-certification/manual-browser.mjs`
- `node scripts/dashboard-certification/all-teams-browser.mjs`

Rollout order: exact migration bundle, guarded source configuration, JWT-verified import Edge Function, Preview UI verification, then the same authorized Production checkpoint. Never use a broad remote database push or copy Preview identities/data/secrets to Production. No real Production report upload is needed for release certification.

Rollback UI to the prior verified deployment if required. Keep the additive registry/source and all report history intact; do not drop datasets or rewrite older reports as rollback.
