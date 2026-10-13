# Public Schedule correction

The user clarified the intended workflow: anyone opens `/schedule`, sees the
weekly Pacific timetable, changes the display timezone, and receives notices
manually sent by authorized Pulse Admin. No Agent account, ID or PIN is required.

- `/schedule` is no longer wrapped in `GoPlayerGate`; its header has no account menu.
- The page defaults to the weekly timetable. Today/countdown remains an optional view.
- Public read RPCs expose only operational schedule/current notice content, never
  Staff/Agent identities, private reports or raw tables.
- An anonymously readable Realtime channel is read-only for browser roles. Signals
  carry an ID; the browser resolves the actual message through the server's public
  notice projection. Forged messages and expired notices cannot become alarms.
- Admin remains behind Staff Auth and `alerts.manage`; Send alert confirms the
  public audience. Requests are idempotent and consecutive sends are limited.
- Anonymous visitors create no identity leases and send no delivery/attendance
  receipts. Only expiring notice IDs are stored locally to suppress duplicate display.
- The previous Preview Agent scheduler was disabled and its exact task-owned cron
  job removed. Other jobs and all existing identities/business data are preserved.
- Sound needs a trusted browser interaction, not an account. The page has a simple
  Enable sound button; normal interaction also arms it. Hardware volume and browser
  suspension still apply.
- Preview alias publication is limited to this branch domain. No Production
  protection settings, deployments, database or broadcasts are changed.

Validation: 81 legacy database assertions plus the public schedule/security suite,
16 Alerts unit tests, full Pulse release checks, responsive public-browser tests
at five widths, and a real anonymous Preview Realtime connection. Anonymous send,
Admin-history and private-delivery reads are denied. The public browser fixture
tests manual-send confirmation, notice audio, payload verification and zero Agent
tracking calls. Deployment acceptance also checks a fresh visitor without cookies,
Staff login or a Vercel bypass header.
