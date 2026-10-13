# PULSE ALERTS-1 — current-state contract audit

Date: 2026-10-12 (America/Bogota).
Base: `5013dc74d6022ac0d2b3083a0dd2dccf87e6ccbe`, fetched current `origin/main`.
Branch: `pulse/alerts-1-schedule-pet`.
Historical audit status: backend/security contract gap at initial inspection.
The user subsequently authorized implementing that contract. See
[the implementation and certification report](pulse-alerts-1-report.md) for current status.
This audit is retained as evidence of the original stop, not a current release claim.

## Why implementation stopped

The applicable Pulse work rules say: “If a checkpoint reveals a missing
backend/security contract, stop and report the exact gap instead of inventing
a bypass.” Inspection found no canonical shift-event, scheduled-occurrence,
alarm-delivery, or authenticated operational-presence contract in the current
repository. The existing Dashboard review rules inspect saved Vici reports;
they do not deliver operational alarms to Agent sessions.

The requested feature explicitly includes creating a backend. The unresolved
security boundary is how cookie-authenticated Agents participate in global
Realtime presence with an identity the server can verify. Treating browser
Agent IDs or public-channel presence as verified delivery would bypass the
existing identity boundary. No such implementation was introduced.

## Evidence from the current implementation

| Existing component | What it provides | What it does not provide |
| --- | --- | --- |
| `src/auth/AuthApp.jsx` | Shared router; `GoPlayerGate` protects Agent/player pages; one global Pet layer | `/schedule`, global operational alert listener, Admin schedule route |
| `src/go-product/AgentSession.jsx` | Verified Agent profile via same-origin API; session survives route navigation | Agent Realtime subscription credentials or operational presence |
| `api/agent.js` | HttpOnly `__Host-pulse_agent`; verifies `agent_session_profile`; derives Agent ID server-side | Schedule/event reads, receipts, presence handshake, alert dispatch |
| `src/go-product/useHostedRoom.js` | Public `go-room-…` change broadcast followed by cookie-authorized snapshot reads | Authenticated Agent identity in Realtime presence; alarm occurrence payloads |
| `20261004000600_agent_go_realtime_signals.sql` | `realtime.send` with `{changed:true}` and public-channel flag | Private Agent channel authorization or global scheduler |
| `20261004001000_go_player_identity_presentation.sql` | Profile verification; `last_used_at` updated at most once per five minutes on profile reads | Proof a browser is currently connected or audio started |
| `src/pet/PulsePetLayer.jsx`, `petModel.js`, `PulsePet.jsx` | Existing body/face assets, global identity gate, hidden preference, reduced-motion behavior | Drum/trumpet alarm mode, schedule placement, playback-state lifecycle |
| `src/admin/access.js`, `AdminArea.jsx` | Canonical Staff permission helpers and protected Admin shell | Alert-specific editing/reporting permissions and server enforcement |

`agent_sessions.last_used_at` must not be relabeled as live presence or
attendance. A self-reported `agent_id` from an anonymous Realtime client cannot
establish verified Agent presence. The HttpOnly Agent cookie must remain inside
the same-origin server boundary; a Staff token or service-role key cannot be
borrowed by Agent clients.

Search scope: current `src`, `api`, `supabase/migrations`, `supabase/functions`,
and certification scripts. No matching operational schedule, occurrence,
receipt, alert-private-channel policy, or scheduler definition was found.
This is repository evidence, not a claim to have inspected every remote
database or external scheduler.

## Next backend contract checkpoint

Implement and certify these contracts first in a disposable local database,
then the existing isolated Pulse Preview environment. Do not run remote
`db push` or touch Pulse Dev/Production business data.

1. **Canonical editable schedule.** Server-owned events with name, type, IANA
   timezone, local start/end times, ISO weekdays, enabled state and revision.
   Sound ID, bounded application gain, duration, repeat count and independent
   pre/start/end switches belong to the same validated event configuration.
   Changes use revision conflict checks and an audit record.
2. **Server occurrence and dispatch.** One scheduler evaluates enabled events
   using the server clock and `America/Los_Angeles`. A unique event/revision/
   Pacific-date/phase occurrence prevents duplicate dispatch. A bounded expiry
   prevents old alarms from playing after reconnect. Retries, DST, disabled
   events, schedule edits and overlapping alerts need explicit semantics.
   Scheduler execution must be limited to the intended environment and stay
   disabled until the local/Preview certification is complete.
3. **Agent-authorized delivery.** Extend the existing cookie-bound Agent API
   for schedule reads, occurrence reads and bounded receipt writes. Always
   derive Agent identity from the verified session. Clients cannot send global
   alarms, alter canonical time, or read another Agent's delivery history.
4. **Verified Realtime presence.** Establish a reviewed server-bound subscription
   and ephemeral-presence contract tied to that verified Agent session, with
   expiry/revocation and multi-tab behavior. Public GO change signals may be
   reused as a wake-up pattern, but must not be promoted into trusted Agent
   identity. Define how an Admin obtains a recent presence snapshot without
   continuous permanent heartbeat writes.
5. **Staff management and reporting.** Add canonical least-privilege permissions
   for schedule/alarm editing and global delivery reports, with server checks.
   Specify authorized role mappings in the backend checkpoint; do not infer
   authorization from a display name. Keep Agent reads separate from global
   reports. An optional manual global-send operation needs an explicit
   confirmation and a server-validated audience; local sound previews never
   broadcast.

Initial seed data for that contract, not hardcoded React execution:

| Days | Event | Pacific start | Pacific end |
| --- | --- | --- | --- |
| Monday–Friday | Shift | 06:45 | 17:00 |
| Monday–Friday | Break 1 | 09:00 | 09:15 |
| Monday–Friday | Lunch | 12:00 | 13:00 |
| Monday–Friday | Break 2 | 14:30 | 14:40 |
| Saturday | Shift | 08:45 | 14:00 |

Saturday has no scheduled breaks. The new operational schedule must not silently
replace the existing Dashboard performance-target business rules: those currently
use a separately confirmed 3 ENG/hour goal and their own production-hour reference.

## Frontend work after the contracts

Mount one Agent operational listener alongside the existing global Pet layer,
above route content, so route changes do not duplicate subscriptions. Add
`/schedule` through the current player gate and Admin Alerts & Schedule through
the current Admin shell. Fetch the schedule on authenticated initialization and
refresh from server change signals/reconnect; avoid per-Agent schedule polling.
The local countdown displays state but never dispatches a global occurrence.

Browser timezone conversion is display-only; always retain Pacific Time in the
UI. Persist only an appropriate device audio preference/timezone preference,
not identity or authorization. A successful user gesture may resume browser
audio; a remembered preference cannot guarantee audio permission in a fresh or
suspended browser session. Blocked audio still shows the alert and records
`audio_blocked`, with no repeated play spam.

Create original small Emergency Pulse, Double Alert, Shift Bell and Critical
Alarm options. Admin preview uses configured app gain on that device only.
Pet drum/trumpet accessories should reuse the current body/face proportions
and the main alarm's lifecycle; no second sound stream. Hidden Pet stays hidden.
Reduced motion uses a static pose. Responsive alert placement must reserve
space for the Pet without covering the title, countdown or controls.

Background alerts may change the title and use already-permitted system
notifications. Locked/background iOS pages may be suspended; web V1 cannot
certify always-on locked-phone alarms or prove physical hearing.

## Required certification gates

- SQL authorization: anonymous denied; Agent read/own receipts only; global
  report and mutations limited to authorized Staff; revoked sessions denied.
- Scheduler: weekdays, Saturday, Pacific DST in both directions, independent
  pre/start/end phases, single occurrence, retry, stale reconnect and edits.
- Client: one listener across GO/Academy/Profile/Schedule, deduplication,
  multi-tab behavior, background title restoration, visual fallback and bounded
  audio attempts/volume/repeats.
- Pet: visible/hidden, start/finish/normal recovery, asset failure, reduced
  motion, no obstruction and no duplicate audio.
- Responsive Agent and Admin QA at 390×844, 430×932, 820×1180, 1180×820 and
  desktop 1440+, including editor, local preview, volume and delivery cards.
- Isolated Preview synthetic Agents only. No Production broadcast test.
- Admin approval of sounds, volume, Pet animation, schedule, conversions and
  delivery report before any Production promotion.

Delivery terminology stays bounded: targeted, pulse_open, client_received,
visual_displayed, sound_started, audio_blocked, no_active_pulse_session and
unknown. Receipt reports are client observations, not proof of hearing or
attendance. Presence semantics and timeout must be agreed before claiming
“Not connected” from missing receipts alone.

## Delivery status for this audit

Only this documentation checkpoint is completed. No schedule page, scheduler,
new sound, Pet alarm animation, listener, presence or delivery report is
implemented/certified. No new migration, RPC, user, permission mapping,
scheduler job or remote setting was applied. No operational Preview URL or
responsive screenshots exist yet; an unchanged application deployment would
not demonstrate Alerts-1.

Production: **NO-GO**. Proceed with the backend contract checkpoint described
above before the requested end-to-end implementation.
