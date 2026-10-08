# Vici Simulator — practice expansion (2026-10-07)

This checkpoint is authorized for local certification and Pulse Preview only,
on `pulse/sim-1-interactive-training`. The prior Production release is unchanged.
The original [SIM foundation](sim-1-contract-checkpoint.md) and
[visual checkpoint](sim-1-visual-preview.md) remain historical records.

## Reviewed processes

Nine version-3 practices reuse the canonical Training authoring, attempts,
eligibility, revisions and immutable results. Staff reference practice is
unrecorded; official learner attempts remain limited to eligible Openers.

| Practice | Required outcome |
| --- | --- |
| Login | Welcome → Agent Login → phone login → campaign login → pause menu → active |
| Callback | Pause menu → CB → VICI logo → Manual Dial → exact current customer phone → Dial Now → hang up → NI → Submit |
| English Transfer | Transfer/Conference → Dial With Customer → advisor introduction for 15 seconds → Leave 3-Way Call → XFER → Submit |
| SPXFER | Transfer/Conference → Presets → Spanish → Dial With Customer → advisor introduction for 15 seconds → Leave 3-Way Call → SPXFER → Submit |
| Local Spanish Transfer | Transfer/Conference → Presets → Spanish → Local Closer → SPANISH SPEAKER → SPANIS → Submit |
| Dead Air | Hang up → DAIR → Submit |
| Answering Machine | Hang up → A → Submit |
| Full Voicemail | Hang up → A → Submit |
| Mock Customer Information | Opening and missing-information practice; stated customer refusal → hang up → NI → Submit |

The user confirmed English and SPXFER have the same 15-second introduction rule.
Full voicemail uses Answering Machine (canonical `A`, not a new `AM` code).
Colombia, Central America and Venezuela use the Spanish advisor/SPXFER process;
Asia, Philippines and Mexico immediately route Spanish calls through the local
SPANISH SPEAKER process and wrap up as SPANIS. Publication rejects mismatched
regional audiences. It does not create or rename canonical teams or campaigns.

Twenty code-generated fictional customers cycle through New customer before
the workflow starts. Some omit monthly payment or origination date. No real
customers, contact lists or extra account records are generated. Mock speech is
not recorded or automatically graded. Login uses `0001` / `TRAINING`; typed
passwords never enter an API command or activity history. The displayed manual
dial prefix/list and campaign selections are simulation labels, not live dialer
configuration. VICIphone controls are local UI only, with no microphone access,
telephony connection or real call.

## Server and private-media boundary

- Migration `20261007000400` adds version 3 without rewriting published version
  1/2 challenges or history. Canonical ordered commands, current customer phone,
  real server elapsed time, replay IDs and state versions are checked on the
  server. Anonymous/browser execution of Agent command RPCs remains denied.
- Migration `20261007000500` adds optional customer/advisor clip bindings and
  private WAV reads. Only canonical PCM WAV, 0.1–60 seconds, is accepted.
  Advisor clips must begin with their introduction and last at least 15 seconds.
  Their timer starts on the accepted playback event; without a clip, the written
  introduction starts on connection. No speech/transcription scoring is added.
- Studio trims/re-encodes an authorized, anonymized excerpt and requires an
  explicit attestation. This removes file metadata, not spoken personal data;
  authors must remove spoken names, phone/account details and credentials first.
- Uploads require existing active Staff/draft authoring rights. Bindings require
  same-family ready private media and compare-and-swap draft timestamps.
  Published bindings are immutable, revisions clone them, and referenced media
  cannot be deleted. Audio is never public or embedded in the browser bundle.
- Agent identity comes from the existing verified server cookie. Audio signing
  checks the owned active attempt's current cue and eligibility, with a 120-second
  URL lease. Wrong owner/content, future cue and ended calls cannot obtain a new
  URL. Current snapshots expose no future answers or audio IDs.
- No real recordings were supplied. Written situations work by default;
  certification uses local synthetic PCM only. Gentle control clicks are enabled
  without a Sounds toggle, subject to ordinary browser audio restrictions.

## Validation and delivery

The full Pulse release check passes, including lint, regression suites, build
and whitespace checks. The SIM suite has 51 passing checks. Fresh disposable
database certification has 486 passing assertions, including 183 existing
GO/Agent regressions; rolled-back fixtures leave zero people/content/attempts.
All 14 browser flows pass without browser errors, using isolated local Auth/REST
and tmpfs Storage with fictional identities. Screens at 1440, 820 and 390 pixels
have no page overflow. This includes fake login, callback, all transfer processes,
private synthetic clip upload/read, wrong-disposition retry and immutable replay.
The successful owned database and tmpfs objects were disposed after certification.

Pulse Preview `sgshbawggqapuyqzkyhs` has migrations `20261007000400` and
`20261007000500` applied and individually registered. The existing unrelated
missing `20261004001000` ledger entry was not touched. Only
`pulse-simulation-media` was redeployed (version 2, active, JWT verification on);
its origin allowlist and secrets were preserved. Read-only checks confirm denied
anonymous authoring, denied browser Agent commands/audio, trusted server execution
and audio RLS. Auth 13, Staff 13, Agents 3, content 26, attempts 19 and results 19
match the pre-deployment counts. Existing challenge versions remain unchanged,
with zero audio bindings. No remote destructive fixtures or automatic publication
of new practices are part of this checkpoint. Authorized
Staff must review and publish a team-scoped new draft for official Opener use;
the nine unrecorded reference practices are available immediately in Preview.
Production deployment requires a separate review and authorization.
