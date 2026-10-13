# Public Schedule correction

The user clarified the intended workflow: anyone opens `/schedule`, sees
today's Pacific timetable, changes the display timezone, and receives notices
manually sent by authorized Pulse Admin. No Agent account, ID or PIN is required.

- `/schedule` is no longer wrapped in `GoPlayerGate`; its header has no account menu.
- Today keeps the requested countdown card on the left and timeline on the right,
  with Pacific/local clocks, no weekly toggle, shift-complete badge or audio panel.
  Daily team meeting reminder is generic: no invented team membership/meeting links.
- Weekday dialing starts 07:00 (login 06:55); Saturday 09:00–14:00 (login 08:55),
  no Saturday breaks. Existing weekday end 17:00 and break/lunch times are preserved.
- Break/lunch Admin cards have a separate Go active button using the existing
  confirmed `end` notice. It sends a reminder, never changes VICIdial state.
- Five task-owned rows use the bounded eight-second Loud siren, at least 90% Pulse
  gain, preserving existing higher volume and all unrelated Admin settings.
- Schedule always mounts the existing Pet independently of account Hide Pet/sleep
  preferences: work, coffee break, lunch, full-body sleep after shift/no shift.
  Alerts wake it and animate alternating hands/drumsticks; normal cursor gaze and
  a temporary click/keyboard greeting remain interactive. System reduced motion
  and hidden-tab animation pause are respected. No new bitmap assets or identity state.
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
- Public sound attempts to arm on entry where browser autoplay permits. If blocked,
  ordinary pointer/keyboard interaction retries until the context is running. No
  sound button, permission prompt or account is required. Browser restrictions,
  hardware volume and suspension still apply; visual alerts work when audio is blocked.
- Preview Admin Google return: added only this branch's exact `flow=google` callback
  to isolated Preview's allowed redirects, with explicit user approval. The old
  default Site URL, existing URLs, providers, identities and Production are unchanged.
- Preview alias publication is limited to this branch domain. No Production
  protection settings, deployments, database or broadcasts are changed.

Validation: 81 legacy database assertions plus the public schedule/security suite,
18 Alerts unit tests, full Pulse release checks, responsive public-browser tests
at five widths, and a real anonymous Preview Realtime connection. Anonymous send,
Admin-history and private-delivery reads are denied. The public browser fixture
tests manual-send confirmation, notice audio, payload verification and zero Agent
tracking calls. Deployment acceptance also checks a fresh visitor without cookies,
Staff login or a Vercel bypass header.
