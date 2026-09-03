# TRAIN-1B secure contracts and identity boundary

## Canonical TRAIN-1A table catalog

| Table | Class | Purpose | TRAIN-1B browser contract |
| --- | --- | --- | --- |
| `training_topics` | catalog | Authoritative bilingual content taxonomy | protected filter/catalog RPCs |
| `training_media` | supporting | Metadata reference to future controlled Storage objects | deferred; no browser table access |
| `training_content` | content | Shared lesson, quiz, and assessment lifecycle | catalog and narrow mutation RPCs |
| `training_content_topics` | supporting/junction | Content-to-Topic membership | composed by server RPCs |
| `training_content_audiences` | targeting | Independent Global/Campaign/Team content audience | resolved and validated by server |
| `training_content_position_targets` | targeting | Optional Position AND-filter | resolved and validated by server |
| `training_questions` | content | Certified question definitions and answer keys | safe Practice projection plus mutation RPC |
| `training_modules` | composition/module | Academy module lifecycle | Academy read RPC |
| `training_module_items` | composition/module | Ordered module-to-content composition | Academy read RPC |
| `training_learners` | learner | Identity-neutral learner root; Staff only in TRAIN-1B | server-resolved only |
| `training_staff_learner_links` | learner/supporting | Restrictive Staff bridge from `public.users` | server-resolved only |
| `training_attempts` | attempt/result | Durable attempt identity, mode, and lifecycle | start/complete/history RPCs |
| `training_results` | attempt/result | Append-only canonical overall score | complete/history RPCs |
| `training_result_topics` | attempt/result | Append-only Topic outcome breakdown | complete/history RPCs |

TRAIN-1B adds `training_question_topics` for exact question attribution and
`training_attempt_answers` for immutable server-scored answer history. Neither is
directly exposed to the browser.

## Staff, Agent, and the legacy `agent` role

Staff identity remains Supabase Auth → `public.users` → RBAC. Real operational
Agents remain a future, separate Agent Identity domain. TRAIN-1B creates only
Staff learner links from `auth.uid()` and provides no caller-supplied learner ID,
Agent bridge, Agent row, or Staff-to-Agent conversion.

The legacy Staff RBAC role key `agent` is retained for referential history but is
renamed as deprecated, made inactive, stripped of `go.play` and `academy.view`,
and removed from grant rules. It is not hard-deleted and no authorization checks
use its name or key. Remote pre-deployment verification must still confirm that
no assignment depends on it.

The final local Training permission matrix intentionally introduces no new role
or permission:

| Staff role | Training permissions |
| --- | --- |
| Super Admin, Admin, Supervisor, QA | all seven canonical Training permissions |
| Team Leader | `studio.view`, `studio.create`, `studio.publish`, `go.play`, `go.host`, `academy.view` |
| Employee, HR, Payroll, IT | none |
| legacy `agent` | none; inactive and non-grantable |

All scope semantics continue to come from `user_roles`, not role names.

## Implemented contracts

- `list_training_catalog`: bounded learner/Studio catalog. Learners receive only
  published, eligible content. Studio draft visibility is owner/permission scoped.
- `get_training_filter_options`: active Topics/languages and exact Campaign,
  Campaign-linked Team, and Position selections authorized for Studio creation.
- `create_training_content_draft`, `update_training_content_draft`, and
  `replace_training_questions`: server identity, draft-only editing, active
  authoritative references, exact target permission, and timestamp stale-write
  protection.
- `publish_training_content` and `archive_training_content`: separate
  `studio.publish` lifecycle actions with integrity checks and Admin audit.
- `list_academy_modules`: eligible published Academy modules/items plus the
  current Staff learner's latest result summary where one exists.
- `get_go_practice_content`: published eligible scored content without answer
  key or explanation leakage.
- `start_training_attempt`: supports only `go_practice` and `academy`; resolves
  or creates the Staff learner bridge and allocates attempt number under lock.
- `complete_training_attempt`: accepts one structured answer set, verifies exact
  question identity, calculates correctness/score/Topic outcomes in PostgreSQL,
  persists immutable answer/result history, and rejects replay.
- `list_my_training_results`: bounded own-history only. A cross-learner review
  RPC is intentionally absent because no existing permission cleanly expresses
  Training-history review.

Content targeting and RBAC remain independent. Eligibility may use current Staff
employment Team/Position and active Operational Assignments. A target never
grants permission. Agent eligibility remains deferred until Agent Identity exists.

## Audit strategy

Low-frequency content administration emits `training.content_created`,
`training.content_updated`, `training.content_published`, and
`training.content_archived`. Practice answers and normal completions remain in
Training history and do not flood global Admin audit.

## GO Host design boundary

Hosted GO is design-only in TRAIN-1B. GO-1 should add a server-owned session root
with Staff host identity, collision-resistant room code, published content/config
snapshot, language/Topic configuration, lobby/running/ended lifecycle, and
started/ended timestamps. Participants must reference the canonical learner
abstraction, with a separate Agent bridge only after Agent Identity exists.
Durable participant membership, question/config references, accepted final
answers, attempts, and results belong in PostgreSQL.

Realtime should carry only ephemeral presence, lobby display state, current
question, timer/state, and answer-received indicators. It should not persist UI
heartbeats or become the source of final results.

## Storage policy recommendation

Use one private `training-media` bucket. Reads should use narrowly authorized
signed URLs. Uploads should use a server-authorized path rooted by Staff user and
content draft, never arbitrary public browser writes. Permit only certified image
and audio MIME types with server-verified type, bounded file sizes, sanitized
names, and matching `training_media` ownership. A scheduled reconciliation should
delete unreferenced staged objects after a retention window; referenced media is
restrictively retained. Bucket/policies remain design-only and no remote Storage
state is changed in TRAIN-1B.

## Legacy transition matrix

| Legacy asset | TRAIN-1B disposition | Later checkpoint |
| --- | --- | --- |
| `pulse_go_rooms` | keep temporarily; canonical contracts do not depend on it | GO-1 supersedes with hosted sessions, then controlled archive |
| `pulse_go_players` | keep temporarily; localStorage identity is forbidden | GO-1 migrates only referentially valid identities/results |
| `pulse_go_answers` | keep temporarily; not a canonical score source | GO-1 validates any retained history before archive |
| `pulse_studio_games` | keep; no new canonical dependency | STUDIO-1 controlled content migration/versioning |
| `pulse_studio_questions` | keep; no direct browser use | STUDIO-1 maps only validated question types/answers |
| `pulse_studio_game_stars` | keep as legacy engagement data | decide migration value after identity mapping exists |
| legacy Storage paths | inventory only | STUDIO-1 copies validated assets into private policy; cleanup later |

No legacy table is altered or dropped and no old product route is remounted.

## Security and deferred work

All public RPCs are authenticated, active-Staff, `SECURITY DEFINER`, PostgreSQL
owned, fixed to `search_path = pg_catalog`, and denied to PUBLIC/anon. Canonical
tables retain deny-by-default RLS and no frontend service-role dependency exists.

Design-only/deferred: Agent learner bridge, hosted GO session schema and
Realtime contracts, Training Storage bucket/policies, assignments/due dates,
cross-learner history review permission, legacy migration, and visible Studio,
Academy, or GO product routes.
