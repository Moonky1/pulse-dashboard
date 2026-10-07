# SIM-1 — server contract checkpoint (2026-10-06)

This is a backend checkpoint, not a finished simulator or a Production release.
The user authorized isolated certification followed by Pulse Preview only.

## Source clarification

Asia Guide.docx was read in full (121 paragraphs, zero tables). Its SHA-256 and
bounded relevant paragraph references are recorded in the source map. Raw notes,
customer examples, embedded image and real dialer URLs are not distributed.

For Asia, tell the customer about the Spanish-speaking representative transfer,
then PRESETS → English to Spanish → LOCAL CLOSER → SPANISH SPEAKER. Never SPXFER.
Being able to handle Spanish and immediately routing a Spanish call are different
workflows. The older map's exclusive-SPANISH-SPEAKER interpretation was corrected.
Do not apply every Asia policy to Mexico or Latin teams without team-specific
approval. No canonical campaign, team or role was created or renamed.

## Implemented contract

Migration 20261006000500_simulation_foundation extends canonical Training content,
learners, attempts, published revisions and append-only results. It adds bounded
simulation steps/events/state rather than a separate identity or ranking system.

- Existing scoped Studio permissions create/edit/publish. Published steps are
  immutable; the existing revision operation clones steps within its transaction.
- Learners receive only the current step, not expected answers, future steps or
  branch definitions. Every call checks current eligibility and own attempt.
- Active attempts resume. Explicit restart abandons an unfinished attempt or
  creates a fresh replay; previous results are never deleted. Existing attempts
  remain pinned to their exact published revision.
- Correct steps, incorrect actions and hints are evaluated/recorded on the
  server. Duplicate request IDs do not double-advance or double-score. Concurrent
  stale state/step requests fail closed.
- Training score is max(0, 100 − 5 × mistakes − 10 × hints). This is a product
  training metric, not an employment/quality policy. Time is server-reported and
  is not a scoring penalty. Existing quiz score/count validation is unchanged.
- Private PNG/JPEG/WebP screenshot references require ready media in the same
  content family. Referenced screenshots cannot be deleted. Learner screenshot
  authorization is limited to the owned active attempt's current step; author
  preview uses real Studio rights. The upload/signing transport is still pending.
- Agent actions are allowlisted in the existing same-origin cookie API. Agent ID
  always comes from the verified server session, not the request body. No browser
  role may call the service-only Agent database functions or access step tables.
- No submitted phone/text values are persisted in event history. No real dialing,
  microphone/call capture, transcription, AI scoring or Dashboard analytics.

The shared schema also protects publication through the existing generic publish
RPC: an empty simulation, missing interactive screenshot, out-of-range branch or
noncontiguous step set cannot be published. The migration refuses to replace an
unexpected pre-existing result validator.

## Validation and remote state

- Fresh disposable local database: pulse_sim1_review_20261006_5.
- 64 SIM-specific database assertions and 183 current GO-4/Agent regressions
  passed (247 total). Transaction rollback left zero Staff, Agents, content or
  attempts in the certification database.
- 20 source-map/Agent-server tests passed; targeted lint and Pulse release-check
  passed, including the existing application test suites and build.
- The old TRAIN-1 fixture scripts predate the current private-media lifecycle and
  are not valid against this current baseline. Current GO-4/Agent regression
  fixtures were used; the local runner recreates extension-owned pgcrypto helpers
  omitted by a schema-only dump.
- Pulse Preview sgshbawggqapuyqzkyhs: migration applied and registered. Read-only
  verification found the new tables, denied anonymous start and browser Agent
  execution, allowed trusted Agent execution, and confirmed zero SIM content/
  attempts. Remote destructive fixtures were not run.
- Pulse Dev/Production, real people, Simon, OAuth, SMTP, DNS and Vercel secrets
  were not modified. No main merge or Production deployment.

## Next checkpoint (within the already authorized Preview work)

Implement the Studio visual builder/draft preview, validated private raster
upload/signed-URL transport, and Academy Simulations catalog/player. Produce
sanitized training screens with synthetic values, author complete Callback and
Asia Spanish-routing workflows, certify actual Staff/Agent browser flows and
responsive layouts, then present Preview for human visual review. Do not call
this checkpoint complete SIM-1 or move it to Production.
