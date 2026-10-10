# DASHBOARD-1: VICIdial report connectivity

Server-only parsing, direct HTTP, storage, protected reads and the collector are
implemented. See [backend proof](dashboard-vici-backend.md) for local and Preview
results. There is no enabled schedule or operational Dashboard UI yet.

## Observed contract (9 October 2026)

An unauthenticated report GET returned `401` with `WWW-Authenticate: Basic`.
The operator subsequently authenticated in Chrome. We read the actual Reports →
Agent Performance Detail page and both rendered DOWNLOAD links.

Both CSVs use `GET /vicidial/AST_agent_performance_detail.php`:

| Parameter | Observed behavior |
| --- | --- |
| `query_date`, `query_time` | Start of the requested source-local range |
| `end_date`, `end_time` | End of the requested source-local range |
| `group[]` | Repeated campaign selections |
| `user_group[]` | Repeated user-group selections; UI supports multiple selection |
| `users[]` | `--ALL--` in this proof |
| `shift`, `DB` | `--`, `0` |
| `report_display_type` | `TEXT` |
| `file_download` | `1` = Performance, `2` = Pause Breakdown |
| `stage` | Empty |
| `show_percentages`, `live_agents`, `time_in_sec` | Empty / unchecked |
| `search_archived_data`, `show_defunct_users`, `breakdown_by_date` | Empty / unchecked |

Selecting All campaigns in the form expanded the export URLs into the campaign
IDs visible to that account. The client takes an explicit configured list; it does
not infer additional campaigns or permanently hardcode OpenersAsia. A multi-group
request uses repeated `user_group[]` parameters, but combined-group equivalence
has not yet been validated against separate live reports.

The two new authenticated browser downloads both contain 50 agents, the same ID
set and the same 2026-10-09 full-day range. All 23 Performance and 15 Pause additive
checks agree with their report totals. Generation clocks were 20:58:25 and
20:59:55 respectively. Those are independent source wall clocks, not UTC instants.
The Pause CSV still has unnamed positions 8 and 9; values remain explicitly
unmapped rather than receiving an invented pause-code meaning.

## Private direct-HTTP proof

Authenticated direct HTTP succeeded from the local server runtime for the
2026-10-09 full-day range. No browser session or cookies were used. Each export
contained 50 agents, both ID sets agreed, and all 23 Performance plus 15 Pause
additive checks matched. Source generation clocks were `2026-10-09 21:13:24`
and `2026-10-09 21:13:34`; ingestion completed at `2026-10-10T04:13:34.089Z`
and `2026-10-10T04:13:49.663Z`. The only parser warning was the already-known
unnamed Pause columns. No raw source was persisted by the probe.

This proves authentication and report reads from this local runtime, not access
from a deployed Preview collector or its outbound IP. Source timezone remains
unconfirmed; the observed clock difference is not a timezone configuration.

`supabase/functions/_shared/viciReportClient.mjs` uses HTTPS GET with a Basic auth
header, no browser session and no automatic redirects. It reads at most 5 MiB,
aborts slow requests, validates the returned range, and returns normalized rows
only. A failed second export rejects the pair. It does not itself persist anything.

The CLI accepts a private local environment file and an explicit report date:

```text
npm run dashboard:probe -- .env.vici-report.local YYYY-MM-DD
```

Required keys are `VICI_BASE_URL`, `VICI_REPORT_USER`, `VICI_REPORT_PASSWORD`,
`VICI_REPORT_CAMPAIGNS` and `VICI_REPORT_USER_GROUPS`. Campaigns and groups are
comma-separated. `VICI_SOURCE_TIME_ZONE` is optional for this explicit-date probe;
the scheduler must require a confirmed IANA source timezone before choosing Today.

All `.env*` files are Git-ignored. The local file must never be uploaded as an
artifact, printed, committed, returned by an endpoint or used as a `VITE_*` value.
Fill it with the Reports account, not the separate IP-validation account. Quote
values containing `#` or spaces according to standard `.env` syntax.

The CLI prints only row counts, aggregate reconciliation outcomes, timestamps,
range and error categories. It never prints records, credentials, raw CSV, HTTP
headers, fetch errors or their causes. The original browser CSV downloads remain
in the operator's Downloads folder and are not copied into the repository.

## Failure contract

| Category | Behavior for the future collector |
| --- | --- |
| `authentication_failed`, `access_denied` | Stop; operator must resolve access |
| `requires_ip_validation` | Stop; no validation form submission or bypass |
| `unexpected_redirect` | Stop; do not forward credentials |
| `rate_limited` | Respect bounded Retry-After, at least 60 seconds |
| `source_unavailable`, `source_network_error`, `request_timeout` | Back off at least 60 seconds |
| Invalid HTML, CSV, range or oversized response | Reject; never replace the last success with an empty report |

The client makes no retries. The database now enforces leases, cooldown, backoff,
auth/IP halts, atomic pairs, idempotency, protected reads and last-success retention.
Scheduling and the user-facing freshness UI remain pending.
Classification tests do not prove that a live IP-validation failure was encountered.

## Remaining release gates

- Resolve the Preview runtime's source connection failure, then repeat its live proof.
- Confirm the IANA source timezone before scheduling. Pulse Preview is identified.
- Explicit configurable group-to-team mapping; keep unmapped Vici groups honest.
- Implement Dashboard UI, responsive QA, sequential 60-second sync proof and
  last-success preservation after a simulated failure.
- Define retention and obtain a separate Production release authorization.

`XFER` remains the supplied transfer count. `SPANIS` remains an independent
disposition. No English/Spanish transfer split is inferred.
