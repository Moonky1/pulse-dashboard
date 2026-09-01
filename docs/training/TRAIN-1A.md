# TRAIN-1A shared training foundation

## Current-system audit

- Production mounts `src/auth/main.jsx` and `AuthApp`; it does not currently mount the legacy `App.jsx` Studio, Academy, or GO routes.
- Legacy Academy is a bilingual static knowledge base backed by `academyData.js` and `goContent.js`. Its content can inform migration, but it is not canonical training data and stores language preference in local storage.
- Legacy GO uses local question pools plus direct browser access to `pulse_go_rooms`, `pulse_go_players`, and `pulse_go_answers`. Realtime room state is useful, but direct protected writes, local-storage player identity, and destructive room resets are not suitable canonical result contracts.
- Legacy Studio uses separate `pulse_studio_*` RPCs/tables and a public Storage URL workflow. It identifies creators with a derived name/team/role string and gates Studio with hardcoded role IDs. Classic question editing and the image/audio UX are reusable product behavior; identity, authorization, media policy, and persistence must be replaced.
- The deployed migration history contains no definitions for the legacy GO/Studio tables or RPCs, so TRAIN-1A does not alter or delete them.

## Canonical model implemented locally

```text
TRAINING CONTENT
├── training_topics
├── training_media (Storage references only)
├── training_content (lesson / quiz / assessment; EN / ES)
├── training_questions
├── training_content_audiences (Global / Campaign / Team)
├── training_content_position_targets
└── draft → published → archived

STUDIO
└── Future narrow RPCs create and publish shared training_content

ACADEMY
├── training_modules
└── training_module_items → shared published training_content

PULSE GO
├── Practice → shared published content
└── Hosted → shared published content + future session contract

RESULTS
├── training_learners
├── training_staff_learner_links
├── training_attempts (academy / go_practice / go_hosted / assessment)
├── training_results (append-only)
└── training_result_topics

FUTURE
training_results + production metrics → readiness / training ROI
```

## Identity boundary

`training_learners` is independent of Staff RBAC. TRAIN-1A permits only `learner_kind = 'staff'` and requires a restrictive bridge to `public.users`. Agent learner linkage is intentionally impossible until the real Agent Identity table exists. A later migration should add a separate, restrictive Agent bridge and expand the learner-kind constraint atomically. It must not add Agent rows to `public.users`.

## Authorization boundary

Frontend capability helpers accept canonical permission keys only. Staff hosting requires `go.host`; Staff practice requires `go.play`; Studio and Academy capabilities use their respective permissions. Agent practice uses a future Agent-domain entitlement and ignores Staff permission arrays.

TRAIN-1A adds no permission, role mapping, public RPC, or browser table grant. The current seed mappings are retained but audited: the existing Staff RBAC role named `agent` has `go.play` and `academy.view`, which conflicts conceptually with the new separate Agent Identity direction. Resolve that mapping only in an explicit RBAC checkpoint after Agent Identity exists.

## Implemented versus deferred

Implemented locally:

- reusable protected schema, lifecycle and referential-integrity constraints;
- explicit EN/ES language;
- content audience independent from authorization scope;
- Position targeting without title strings;
- question/media validation;
- same-content Academy module composition;
- Staff learner bridge and append-oriented result provenance;
- pure permission-driven Staff/Agent capability helpers and tests.

Deferred to TRAIN-1B or later:

- authenticated read catalogs and mutation RPCs with `studio.create`, `studio.publish`, `academy.manage`, `go.host`, and `go.play` checks;
- assignment/due-date/progress contracts;
- canonical GO session/participant/answer persistence and Realtime boundary;
- Storage bucket and upload policy;
- migration of legacy Studio games, static Academy content, or GO questions/results;
- Agent Identity bridge and Agent routes beyond the existing sign-in scaffold;
- readiness calculation and any comparison with operational production metrics.
