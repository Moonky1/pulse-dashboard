# DASHBOARD-1 operational screen

The active-Staff `/dashboard` route now renders the existing protected reporting
RPCs instead of the In Development placeholder. The application header, session,
role gate and canonical server permission checks are unchanged.

## Read contract

- The baseline reads `list_vici_dashboard_scopes` and `get_vici_dashboard`. The
  manual-report checkpoint adds protected history/snapshot RPCs and the upload
  function described in [dashboard-vici-manual.md](dashboard-vici-manual.md).
  The browser does not contact VICIdial, read raw tables or trigger the collector.
- A visible page reads the selected stored report at most once per 60 seconds
  automatically. Manual Refresh can read it immediately; neither starts a sync.
- Failed reads preserve only the last snapshot for the exact same scope/date.
  Changing either clears previous observations. Obsolete asynchronous responses
  cannot replace the current scope. Permission errors clear displayed data and
  stop automatic reads until explicit retry.
- Validate report identity, integral nonnegative counts and seconds, unique string
  agent IDs and matching XFER counts before accepting a response. Raw error text
  never appears in the screen.
- Today is disabled without a confirmed source timezone. The initial browser
  calendar date is explicitly labelled as such; it is not claimed to be Vici Today.

## Views

Overview totals, actual Vici user groups, searchable/sortable paginated Agents,
Time & Pause, and a keyboard-accessible native agent-detail dialog. On narrow
screens, agent cards retain access to every metric through the detail dialog.
Durations retain hours greater than 24. Missing snapshots display dashes rather
than fabricated zeroes. Averages are source-provided per-agent values, never an
invented aggregate. SPANIS is not added to XFER. Report time categories are not
presented as a mutually exclusive breakdown.

Pulse teams are labelled only when the backend returns an explicit mapping. Agent
profile links require a verified exact `agent_code` linkage and a supported route
ID. Unlinked observations remain visible to authorized Staff.

The screen distinguishes live, delayed, awaiting-data and connection-issue states;
shows last successful/failed synchronization and safe source error categories;
and retains both source generation clocks and UTC ingestion times in provenance.

## Reproducible validation

- `npm run test:dashboard`: parser, transport, collector and 23 UI contract tests.
- `npm run test:dashboard:browser`: 12 grouped browser checks. Requires Chrome and
  Playwright; set `PULSE_PLAYWRIGHT_ROOT` to its node_modules root when not using
  the configured desktop runtime. No new production dependency is required.
- Browser review uses the actual Dashboard component with a local-only synthetic
  RPC adapter. All non-loopback requests are blocked. Fixtures never enter the
  application import graph, authentication or a database.
- Viewports: 1440x1000, 1180x820, 820x1180 and 390x844. Covers overflow, dialogs,
  keyboard dismissal, pagination, leading-zero search, profile linkage, sorting,
  permission revocation, failed refresh, empty dates, scope switching and polling.
- Screenshots are local ignored artifacts under `review-evidence.local/dashboard-ui`.

## Shared alert rules in Preview

The Alerts & rules panel loads shared configuration only when opened. Eight rules
are supported: Talk Avg (strictly below), Dead Avg and Dispo Avg (strictly above),
and cumulative Break, Callback, Lunch, RR and Tech seconds (strictly above).
Equality does not match. No rule or numeric threshold is activated by default.
Limits are whole seconds from 0 through 31,536,000; this validation bound is not
an operational recommendation. Enabled rules require a limit.

Migration `20261010000300_vici_alert_rules` adds an RLS-protected append-only
version table. Browser and service roles have no direct table access. Protected
read/history RPCs require active Staff, enabled scope and canonical scope read
permission. Save additionally requires the existing global Admin/Super Admin
Dashboard capability; identity is derived server-side. Scoped-only Staff cannot
edit. The scope row lock serializes saves; an expected revision rejects stale
writes with a conflict. Identical saves are no-ops. Every changed configuration
retains its full rule set, verified Staff author and timestamp. History uses
exclusive revision cursors and pages of 20, without any deletion endpoint.

The frontend evaluates only the authorized selected snapshot using the displayed
saved rule revision. Drafts never affect results. Reload fetches other admins'
changes; saved historical reports use current rules and are labelled accordingly,
not presented as historical verdicts. Average checks with zero calls, missing
metrics and missing report sides are non-evaluable, never passing zeroes. Group
summaries use the performance identity (pause identity when performance is absent);
each check also names its own source group. No Pulse team mapping is inferred.
Matches are review indicators, not judgments, notifications or automatic actions.

Scope/date changes, access revocation, failed configuration reads and unconfirmed
saves do not reuse misleading results. Server scope authorization remains decisive;
frontend evaluation and editor visibility do not grant report or write access.

Validate with the existing Dashboard tests and disposable SQL suite, plus
`npm run test:dashboard:alerts-browser` for editor, attribution, filters, paging,
conflicts, failure/revocation and responsive checks. Only synthetic local tests
activate sample rules. The preparation script's `--alert-rules` flag generates
only this migration transaction for authorized Preview publication; it never
connects or performs a broad remote database push. Production remains separate.

## Separate live-data gate

This UI does not resolve the previously recorded Preview-to-Vici connection
failure. Real remote snapshots and an automatic source schedule must not be
claimed until connectivity and the source timezone are proven. No fixtures are
substituted into the authenticated Preview. Production is outside this checkpoint.
