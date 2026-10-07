# SIM-1 — visual Preview checkpoint (2026-10-07)

Scope: the already authorized Studio/Academy visual implementation, only on
`pulse/sim-1-interactive-training` and Pulse Preview. This is not all of SIM-1 and
is not a Production release. The original backend checkpoint remains historical.

## Delivered surfaces

- Studio: create a Simulation draft, edit metadata/audience, ordered steps,
  hints/feedback, click targets, placed text/select inputs, forward branches,
  private raster upload/reuse, draft-only preview, review/publish, archive and
  immutable published revisions. Existing Studio roles/scopes are reused.
- Academy: Simulations catalog, eligible team-scoped practice, owned saved
  attempts, server-scored mistakes/hints, resume, explicit restart/replay,
  results and history. No client-side completion/score authority and no GO points.
- The dialer uses a code-native reconstruction rasterized into private PNGs:
  gray/white VICIdial-like form, yellow paused status, green pause-code/manual
  panels and the colored transfer controls. Every customer/phone example is
  synthetic. Nothing calls a live dialer or records microphone audio.
- Two author templates: Callback (six steps; Mexico reference pages 30–31),
  and Asia Spanish routing (five steps; advise the customer → PRESETS → Spanish
  → LOCAL CLOSER → SPANISH SPEAKER; SPXFER is incorrect). The latter must be
  assigned to the intended Asia team, not applied to all regions by default.
- Desktop/tablet/mobile layout keeps the small dialer controls readable with a
  contained horizontal scroll and equivalent keyboard controls.

## Image transport and identity boundary

The separate `pulse-simulation-media` function requires verified active Staff
and canonical Studio rights for uploads. Learner reads check current eligibility
and the current step of the owned active attempt. Author previews check Studio
rights and create no attempts/results. Agent reads use the existing trusted
same-origin server cookie API; body-supplied Agent identity is ignored.

Local raster inputs are re-encoded to PNG to discard metadata. Server validation
checks actual streamed bytes, CRCs, dimensions and decompressed PNG pixel limits.
No SVG/HTML, animation or arbitrary remote image URLs are accepted. Storage is
private, writes do not overwrite, ready metadata is required, failed finalization
cleans up the new object, and read URLs have a 120-second lease.

## Verification

- 64 SIM-specific database assertions and 183 GO-4/Agent regressions: 247 pass
  against a fresh isolated local database, with rollback and zero fixture residue.
- 22 SIM source/template/media/Agent-screen tests, plus 12 existing Agent-server
  tests: 34 pass. Full Pulse release-check (lint, suites, build, diff check) passes.
- Eight real local browser flows cover Staff authoring, five private screen
  uploads, author preview without attempts, publish, pointer/keyboard actions,
  wrong action/hint, reload/resume, typed Callback, authoritative result, replay,
  revision cloning and Agent login/team-scoped Asia practice including rejected
  SPXFER. No browser errors. Screens inspected at 1440, 820 and 390 pixels.
- Auth, REST and Storage services run against a named disposable SIM database.
  Storage objects use an isolated tmpfs, not the shared local Storage directory.
  Only fictional fixture identities are used; no remote destructive tests.
- Live Pulse Preview function preflight allows only the exact feature origin
  and rejects an unrelated origin. Authenticated cloud authoring/player review
  remains separate from the isolated end-to-end certification.

## Remote scope

Pulse Preview: `sgshbawggqapuyqzkyhs`. The foundation migration was already applied
in the preceding authorized checkpoint. This checkpoint adds the private image
function and its dedicated allowed-origin setting. Vercel public backend/authoring
destination guards and server-only Agent secrets are limited to the exact feature
branch. Secrets never enter source, browser bundles or test artifacts.

No real Agents, Staff, SIM content, attempts or results were created remotely by
the certification. No Production backend (`lhgnbcaundgjeofjrscg`), main merge,
Production Vercel configuration, Simon, OAuth, SMTP, DNS or real people changed.

## Review and next checkpoint

Open the feature Preview as authorized Staff → Studio → `+ Simulation`. Set the
real topic/team audience, save a draft and import either template. Review the
draft before publishing it to the eligible Academy catalog. The catalog starts
empty until a Staff author publishes; the templates are authoring shortcuts,
not a hidden remote fixture installation.

The Asia PRESETS popup is explicitly approximate because its full screenshot
was not provided. Get a sanitized full capture before claiming pixel-perfect
fidelity. Other team-specific dialer workflows and disposition rules require
source/policy validation before publication. Unused private media management,
additional scenarios and Dashboard/performance integration are later work.
Production requires its own review and explicit checkpoint authorization.
