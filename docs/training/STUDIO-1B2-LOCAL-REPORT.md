# STUDIO-1B.2 — Local complete implementation report

Date: 2026-09-04. Scope: local feature implementation and isolated certification only. Base: `f0a052ffb7f19feb90c4c0a9e2c970331969aebd`. Branch: `pulse/studio-1b2-content-builder`.

## A. Architecture

Studio now has a library, a four-step Quiz/Assessment builder, one persisted content detail route, a review component, a non-persistent Preview dialog, and a shared question editor. `trainingApi` owns the Training contracts; `studioApi` is a thin compatibility re-export. The existing authenticated Staff route gate remains in use. No generic authorization framework, dependency, Workspace redesign, or Orb change was introduced.

## B. Backend hardening

One additive migration introduces a protected capability RPC and a status-aware Studio catalog, narrows authoring-read/manager policy, checks source and destination authority for retargeting, validates answer structures in both the mutation and table trigger, and requires a reviewed timestamp when publishing. Existing table shapes, RLS, protected-table grants, and system role catalogs are unchanged. Function owners remain postgres, paths are pinned to pg_catalog, and intended public RPCs are authenticated-only; PUBLIC/anon/service_role have no execute grant on new RPCs.

The content lifecycle trigger now produces a monotonically increasing timestamp, including multiple changes in one transaction. Its existing transitions and module lifecycle rules are retained. The old one-argument publish function returns an explicit validation error; it cannot bypass the reviewed-version requirement. No ambiguous defaulted publish overload is introduced.

## C. Final authorization policy

All decisions use canonical permissions and resource context, never role names or employment placement. Studio access requires an active Staff identity and effective `studio.view` in some supported scope.

| Actor permissions in the exact content context | Read authoring answers | Edit draft | Publish / archive |
| --- | --- | --- | --- |
| Creator with studio.create | Yes, including own published/archived history | Yes | Only with studio.publish |
| Non-creator with studio.create AND academy.manage | Yes | Yes | Only with studio.publish |
| studio.publish | Yes | Not by itself | Publish draft / archive published |
| studio.view only | Published library metadata only | No | No |

For manager retargeting, create and manage authority must both apply to the source and destination. Creator retargeting requires create authority over both. Permissions in unrelated Campaigns/Teams cannot be combined to gain edit or answer-key access. Global authority retains its existing meaning. UI capability flags do not replace mutation authorization.

## D–G. Product, routes, library, builder

- `/studio`: concise Pulse Studio library, Create, All/Drafts/Published/Archived, explicit search, collapsible language/topic filters, compact cards, stable server-side pagination, and stale-response cancellation. Status filtering precedes limit/offset; explicit NULL cannot bypass bounds.
- `/studio/create`: choose Quiz or Assessment, then Basics → Audience → Questions → Review. Visiting creates no database row. First save waits for valid title/type/language/topics and an authorized audience.
- `/studio/content/:contentId`: recover saved details, continue a permitted draft, or inspect read-only published/archived content. Unsupported Lesson content is not exposed as editable/publishable through this builder.

No metric-card dashboard, visible UUIDs, checkpoint copy, oversized permanent filter panel, fake Create control, or new identity footer. Audience controls use human-readable server options. Studio-specific white actions and responsive layouts do not alter shared Orb/Workspace styling.

## H–J. Persistence, scope, questions

Basics/Audience and Questions save independently. Successful writes refetch canonical state and chain its exact updated_at. A failed section does not roll back a previously saved section or silently discard other unsaved edits. A successful write followed by failed refetch locks subsequent saves until reload. Dirty navigation warns the user; there is no localStorage document persistence.

Two real browser clients and two independent PostgreSQL connections certify stale-write and publish races. Business version conflicts use `PT409` (HTTP 409), not `40001`: the local PostgREST behavior retried serialization errors and left requests pending. The client also understands the historical code but never displays it to users.

Global, Campaign, and Team Staff receive only authoritative permitted audience options, with optional canonical Positions independent of RBAC. Cross-Campaign/Team and revoked-source cases are denied.

Questions support 1–100 items, accessible up/down ordering, multiple choice (2–8 nonblank string options and an in-range integer answer), true/false (boolean, no options), and text (usable accepted strings, no options). Prompts, explanations, and topics use existing contract limits. Text scoring remains case-insensitive exact matching with outer-space trimming; no fuzzy/AI grading. Failed replacement is transactional and preserves prior questions.

## K–M. Review, Preview, publish, archive, errors

Review refetches saved canonical details, answers, audience, positions, and explanations, retaining the exact reviewed timestamp. A later change blocks publication and requires a new review. Preview uses already-authorized in-memory state, traps dialog focus, supports Escape, and makes no network or persistence request. Successful publication makes the content read-only; archive keeps its questions/history and removes learner availability. There is no hard delete.

Known validation, permission, stale-version, unavailable/not-found, network, and post-save-refetch failures have sanitized actionable messages. Missing and inaccessible answer-key targets share the same response. Published UI handlers are guarded, not merely hidden.

## N. Isolation evidence

The client API rejects non-loopback authoring destinations before transport. The Supabase transport guard independently rejects remote authoring RPCs in all builds and all remote Supabase requests in development. Redirects fail closed. Browser certification recorded only `http://127.0.0.1:5177` and `http://127.0.0.1:54321`, with 721 requests in the final full run.

Observed Training RPCs: get_studio_capabilities, get_training_filter_options, list_studio_content, get_training_content_authoring_details, create_training_content_draft, update_training_content_draft, replace_training_questions, publish_training_content, archive_training_content. Existing Auth/self-profile access is retained. No direct protected Training table access, legacy endpoint, service-role browser credential, or learner RPC was used by Studio.

## O–Q. Certification

Final results: **743/743 DB assertions PASS** (historical 652 plus 91 new, 13 files); **18/18 real Chromium browser groups PASS**; **3/3 independent-connection/scoring groups PASS**; Auth 24, Admin 90, Training 19, Studio 22, Operator 12 (**167/167 application tests PASS**). Release check, lint, local Production build, and staged/unstaged git diff checks PASS. Browser and connection tests were rerun against the final migration hash below. Expected 503 transport-failure and 409 conflict responses were verified; no unexpected browser errors were observed.

Important environment qualification: the bundled PostgreSQL 17.6 / Supautils error-hint path crashed on denied function execution, including an unchanged existing function. Isolated certification disables only local `supautils.hint_roles`; no grants/RLS are weakened. The default unmodified image is not certified clean. See the reproduction README. Running historical DB suites after persistent browser fixtures also produces expected fixture/baseline conflicts; reset first. These failed exploratory runs are not hidden by the final clean-baseline result.

## R–S. Files and Git

Changes are limited to Studio components/styles/model/tests, shared Training API/validation, a local transport guard, three route additions, two npm test scripts, isolated fixtures/runners, SQL LF policy, one new migration, its tests, minimal historical test expectations for updated contracts, and this documentation. No package-lock/dependency changes. All three certified Training/authoring migrations remain byte-equivalent in Git; the earlier certified commit/branch is not rewritten. AGENTS.md and supabase/.branches/ remain untracked. Final local commit/HEAD is reported in the completion response; no push is authorized or performed.

## T. Remote activity

No GitHub, Vercel, Pulse Dev, or Production mutation command or tool action was invoked in this implementation. No push, PR, merge, remote db push, deployment, or real-data RPC. Supabase commands were local start/status/reset/test/stop operations; Docker operations targeted the disposable project. CLI/package/image acquisition may contact distribution infrastructure, not Pulse business APIs. No fresh remote business counts or migration ledger were read, so this report does not claim independent current remote-state verification. Evidence supports non-mutation by this implementation, not a claim that no other actor changed remote state.

## U–V. Limitations and readiness

Local functional scope is complete subject to final recorded tests. No Lesson body builder, media/storage/upload, GO/Academy UI, Agent Identity, realtime/multiplayer, draft deletion, revision duplication, or Workspace redesign. Empty question replacement is not supported by the canonical 1–100 contract. Browser certification is Chromium, not Firefox/Safari; internal history navigation warnings use the Navigation API where available, with link/unload fallback elsewhere. No remote browser/session or remote engine compatibility was certified.

Ready to request a separately authorized remote-validation stage, **not** ready for an automatic deployment. Two explicit prerequisites: verify the target engine safely handles permission-denied calls, and separately authorize/configure an exact-target authoring guard for that stage. The current build intentionally blocks remote authoring even if accidentally hosted.

## W. Migration inventory and hashes

Hashes are SHA-256 of canonical LF/Git-blob SQL, not an arbitrary CRLF working copy. `.gitattributes` pins migration/test SQL to LF without rewriting old migrations.

| Migration | Canonical LF SHA-256 |
| --- | --- |
| 20260901000100_training_shared_foundation.sql (unchanged prerequisite) | BCF4640B30FA8FCA5A5B2BB0D2A67790CEABE0412CDC497CBFF0A4E567C99808 |
| 20260901000200_training_secure_contracts.sql (unchanged prerequisite) | 8081C8F204569B7E4349FA4A3072CAF51364A6278A209586448369D1036897AB |
| 20260902000100_training_authoring_read_contract.sql (prior local contract) | EE62257C19F37CECAF7D436F5C2AFEF641BBEE9569EC5C372A904CAA93325262 |
| 20260904000100_studio_builder_hardening.sql (new) | D145D5E5B6E463667B9D1AED55D0031350F76D8370C7E9A12060A5B62EC9C1CC |

The expected future pending pair is 20260902000100 followed by 20260904000100. A new read-only target ledger check must establish the exact missing set first; do not reapply already-deployed migrations or assume this historical expectation is the current remote ledger.

## X. Recommended next stage

1. Obtain explicit remote-validation authorization identifying target project, allowed migrations, fixture policy, and permitted hosted actions.
2. Read current target ledger/engine/version and business-state baseline. Verify hashes and compatibility; stop on divergence. Verify safe anonymous denial without applying local engine settings remotely.
3. Authorize and test an explicit exact-target runtime configuration replacing the local-only authoring gate for the validation build, without unrestricted fallback.
4. Apply only the missing approved migration pair in order; verify ownership, grants, search paths, RLS, and versioned RPC contract. Do not seed real company data.
5. Use a separately isolated remote validation environment for mutation fixtures, or keep shared Pulse Dev QA read-only unless fictitious mutations there are explicitly approved. Never manufacture real users/content to populate the screen.
6. Validate scoped flows, conflict handling, answer-key privacy, network destinations, and unchanged real-data counts. Preview is a separately authorized deployment; Production/merge remain separate decisions.

STOP: this report does not authorize or initiate those steps.
