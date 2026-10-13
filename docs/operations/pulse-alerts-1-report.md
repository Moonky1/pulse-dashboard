# PULSE ALERTS-1 — Preview implementation and certification

Date: 2026-10-12, America/Bogota. Status: implemented in isolated Preview; **Production NO-GO until Master review**.

## Delivery and Git

- Repository: `Moonky1/pulse-dashboard`.
- Current-main base: `5013dc74d6022ac0d2b3083a0dd2dccf87e6ccbe`.
- Branch: `pulse/alerts-1-schedule-pet`. No main merge, force-push, Production deployment, Production configuration change or Production broadcast.
- Contract audit: `10c14e366a0e83c4c75ec1025355c695d01383d0`.
- Backend: `12d30a0ffd6ef262cb0e6eef8c4d990ff49ba772`.
- Schedule/Admin/audio: `50146cf654936ed97eb9eadedb2407de3dcba7dd`.
- Pet: `6d82b07df5f72047e8d3f0d83c6958125ed012b7`.
- Final implementation: `6803e28759858f5ab0b1ce074dae68a4efd2050b`.
- The final documentation/certification commit follows that implementation. The handoff message records its immutable final SHA and confirms local = remote and clean worktree.

Preview: [Schedule](https://pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app/schedule), [Alerts & Schedule](https://pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app/admin/alerts).

The Preview is Vercel-protected and uses its separate test identities/backend (`sgshbawggqapuyqzkyhs`), not Production credentials/data. Its only active Agents were checked to be synthetic `990001`, `990002`, `990003`. Configuration is scoped to this Git branch. No secret values were printed, committed or written into evidence files.

## Requested 30-point report

| # | Area | Result and evidence boundary |
| --- | --- | --- |
| 1 | Base/final SHA | Base and implementation SHA above; final delivery SHA in handoff. |
| 2 | Git/commits | Logical backend, UI, Pet, refinement and report commits; branch push only. |
| 3 | Schedule architecture | Validated, revisioned server data; Staff permission checks and change history. Initial weekdays 06:45–17:00, breaks 09:00–09:15 / 14:30–14:40, lunch 12:00–13:00; Saturday 08:45–14:00 with no breaks. |
| 4 | Pacific/DST | `America/Los_Angeles`, never fixed UTC−8. Spring/fall, ambiguous and nonexistent local times tested. PostgreSQL's standard-time fold/gap resolution is mirrored in display conversion. |
| 5 | Agent Schedule | `/schedule`, read-only, authenticated Agent/active Staff; status, next boundary, countdown, return time and timeline. Agent/Staff sign-in return paths include Schedule. |
| 6 | Phone Schedule | Responsive next-event card and vertical timeline at 390×844 / 430×932; no horizontal overflow. Separate Pet space keeps schedule controls unobstructed. |
| 7 | iPad Schedule | Side-by-side summary/timeline at 820×1180 / 1180×820; responsive Chrome certification, not physical Safari certification. |
| 8 | Local/Pacific | Browser IANA timezone only, no location tracking. Managua, Bogota, Manila including next local date tested; canonical Pacific always available. |
| 9 | Global listener | One listener above routes; no per-route alarm listeners or browser-owned schedule execution. Tested between Schedule and another route, and deployed Schedule / GO / Academy. |
| 10 | Audio arming | Trusted navigation/menu/key gesture resumes one Web Audio context; local setup preference remembered. Unarmed clients still display alerts and record blocked audio. |
| 11 | Sound library | Four original synthesized sounds: Emergency Pulse, Double Alert, Shift Bell, Critical Alarm; no third-party audio assets. |
| 12 | Volume | App gain 0–100%, with bounded envelope. Does not change hardware volume. Zero app gain is reported as playback not started (`audio_blocked`), not as audible delivery. |
| 13 | Admin preview | Test on this device and Preview sound play locally at selected gain; never dispatch a server alarm or write delivery receipts. |
| 14 | Pet performance | Original small SVG drum/sticks/trumpet over the existing body/face; alternating performance, restrained bounce, short finishing animation, normal/sleep behavior restored. |
| 15 | Pet mobile | Small Pet in the alert's reserved footer, above the page rather than over its controls. Schedule also reserves a separate normal Pet area. |
| 16 | Hidden Pet | Existing visibility preference respected. Actual deployed test with hidden preference confirms text alert and blocked receipt without any Pet mount. |
| 17 | Background tab | Temporary title, optional already-permitted system notification, bounded playback attempt; stale visible pose is cleared on resume. Title restoration tested locally. |
| 18 | iOS/iPad limitation | A running browser page is required; suspended/locked iOS pages are not certified to always sound. No native overlay over Vici or other sites, no hardware override or proof of hearing. |
| 19 | Realtime | One private `pulse-alerts-v1` broadcast topic, occurrence-ID signal followed by cookie-authorized claim. Short-lived connection JWT is not a Staff identity; actual private receive/send policies tested. |
| 20 | Server scheduler | One Preview `pg_cron` job, every minute, using the server clock. Extension 1.6.4 installed in Preview only. Job active and a real run succeeded; after-hours ticks emitted no invented alarm. |
| 21 | Presence | Server-bound unlogged connection leases: renew after 120 seconds, expire after 180. Recent observed Pulse session, not attendance or proof of live focus. No permanent rapid heartbeat history. |
| 22 | Receipts | Targeted, Pulse open, received, visual, sound started, audio blocked, no recent session, unknown. Server timestamps; audio outcomes cannot contradict; claim/receipt ownership and expiry enforced. |
| 23 | Admin reporting | Permission-gated occurrence history, counts, paged 50-Agent cards/accordions, IDs/teams/timestamps. Browser fixtures exercise report and editor at every width; SQL tests certify Master access. |
| 24 | 600+ scale | One job/occurrence/broadcast, not one per Agent. 1,000 synthetic delivery targets tested in rollback; two deployed browser tabs tested. **Not a 1,000-websocket load test or a Production quota certification.** |
| 25 | Security | Cookie-derived identity, same-origin JSON API, service-only Agent RPCs, deny-default raw-table grants/RLS, global Staff permissions, revoked/expired session checks and browser broadcast denial. |
| 26 | Responsive QA | Five required viewports, Chrome headless, actual components with synthetic transport; editor, preview gain, save, report, hidden Pet, reduced motion, dedup and expiry. No physical-device claim. |
| 27 | Preview URL | Protected isolated branch links above; verified Vercel Ready. Only `api/agent` is a public function; the signing utility is outside API routes. |
| 28 | Screenshots | Local Schedule/editor/report at all five widths; real Preview alarm and blocked/hidden-Pet captures under ignored `review-evidence.local/alerts-1/`. See handoff links. |
| 29 | Remaining review | Master must approve sounds/gain/Pet/schedule/conversions/report. Physical iPhone/iPad/Android checks and Production Realtime capacity/connection-load validation remain before broad launch. |
| 30 | Production decision | **NO-GO for Production now. GO for isolated Preview review.** Production alarm/broadcast/configuration and real identities remain untouched. |

## Certification results

- `npm run pulse:release-check`: lint, existing Pulse suites, 14 Alerts unit/API/audio/timezone tests, build, whitespace checks passed.
- Fresh disposable local database `pulse_alerts1_review_20261012_6`: **81 assertions passed**, including 1,000 targets. Test transaction left zero Staff, Agents, occurrences or leases and dispatch off.
- Preview migrations `20261012000100`, `20261012000200`, `20261012000300`: applied explicitly to isolated Preview, registered atomically, with before/after fingerprints confirming existing users, Agents, teams and training results unchanged. No remote `db push`.
- Anonymous Preview probes: five schedule/report/reconnect/scheduler RPCs all rejected with 401; no probe writes.
- Local responsive browser: **12 grouped checks passed**, no page errors or external API requests. All five widths fit; event save refreshes shared schedule; audio gain/repeat clamps, stale recovery, route survival, claim retry, hidden Pet, reduced motion and title restoration covered.
- Deployed browser: actual cookie API + private Realtime, two tabs for the same synthetic Agent. One targeted / received / visual / **sound started**; zero blocked. Duplicate signal did not restart oscillators, and only one tab displayed the alert.
- Deployed unarmed/hidden-Pet run: one targeted / received / visual / **audio blocked**, zero sound started; no AudioContext or Pet was created. No Production API requests.
- Temporary sessions, connection leases, synthetic QA occurrence and delivery rows were removed using exact task-owned IDs/hashes. No Agent, Staff profile, PIN or business data was deleted. The Preview cron remains enabled for its three existing synthetic Agents.

## Important implementation limits

No manual “All Agents” send button exists in V1, so there is no unconfirmed global-send path. Local preview is not a broadcast. The selected synthetic-Agent operator test is a certification tool, not an Agent-facing endpoint.

V1 does not support overnight event intervals: end must follow start on the same Pacific date. Occurrence uniqueness is event + Pacific date + phase, deliberately excluding edit revision so changing an already-fired event cannot replay its same phase. Reconnect reads at most ten fresh, unclaimed events and never polls the schedule to decide alarm time.

Delivery counts are client observations, not proof that a person saw or heard something. “Pulse open” means a recently observed session (up to three minutes), not attendance. Missing receipts are not automatically labeled misconduct or a disconnected human.

Production promotion is a separate checkpoint: review the Master-approved configuration, verify production signing/capacity/cron contracts, apply reviewed migrations with separate authorization, then explicitly activate. The current Preview activation function rejects non-Preview project credentials.

## Reference and verification commands

Use the ordinary Pulse npm checks plus `node scripts/alerts-certification/browser.mjs` for local browser QA. The disposable DB runner requires a fresh task-owned database name. Preview certification/configuration tools hardcode the isolated project and branch, require the project argument, and keep keys in process memory.

The configured existing signing secret was read from the documented [Management API PostgREST config endpoint](https://supabase.com/docs/reference/api/v1-get-postgrest-service-config), verified cryptographically against Preview's public key, and stored as a server-only branch secret. No JWT rotation or Staff-token substitution was used. Private-channel authorization follows [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization). The scheduler module follows [Supabase Cron installation](https://supabase.com/docs/guides/cron/install).
