# Dashboard retention preview (read-only)

The approved 7/90 policy can now be simulated by an active global Admin or Super Admin with dashboard access. This checkpoint contains no deletion function, job, automatic activation, source connection change, or Production change.

## Explicit calendar boundaries

The user chooses a hypothetical reference date in the VICIdial source calendar. Its initial browser-calendar value is labelled as such; it is not a claim about Vici Today. A missing source timezone does not prevent simulation and still blocks scheduling.

- Reference date minus 6 through reference date: retain every successful pair (seven calendar dates inclusive).
- Reference date minus 89 through reference date minus 7: retain the last valid full-day pair per scope/date; older intermediate pairs become candidates.
- Earlier source dates: successful pairs become candidates, subject to the safety exceptions below.
- Last means the same ordering as the dashboard: performance generation, pause generation, completion time; stable ID resolves ties. Never sum cumulative report versions.

Both reports form one decision. Partial ranges or mismatched actual row counts are protected for review. No individual agent record is selected for deletion.

## Safety exceptions and limitations

Running records and all records referenced by an active_run_id (even an expired lease) are protected. Future-dated reports, incomplete pairs, and the latest valid successful pair for a scope are also protected, including beyond 90 dates. Duplicate references protect their parent: we do not invent a cascade that would destroy the existing audit trail. Failed and duplicate metadata is shown as audit-only and is outside this cleanup plan.

Consequently, candidates are not a promise of immediately reclaimable disk space. No plan is a durable execution token; data may change after a read. A future executor must recompute authorization, cutoffs, dependencies and locks, define late-upload grace and audit retention, and be separately reviewed before activation.

## Contract and access

`preview_vici_retention(scope, as_of_date, page_offset)` is a STABLE, read-only, security-definer RPC with a pinned search path. It validates active Staff, global Admin/Super Admin import capability, enabled scope and canonical read permission. Anonymous and service-role invocation are revoked; the private planner is not directly callable by browser roles. It returns only report metadata and aggregate counts, not agent names or raw CSV.

Each page contains at most 100 decisions. Whole-scope counts use the same materialized read as that page. The UI labels hypothetical cutoffs, never offers Execute/Delete, clears results after invalid/failed reads or date/scope changes, and ignores obsolete responses. Reopening after an upload recomputes the simulation; this panel does not poll automatically.

## Validation and delivery

`npm run test:dashboard`, `npm run test:dashboard:db -- <fresh-local-review-db>`, `npm run test:dashboard:retention-browser`, plus existing browser suites and `npm run pulse:release-check`.

Prepare only this migration with `node scripts/dashboard-certification/prepare-manual-migration.mjs --retention-preview`. Apply the resulting reviewed transaction only to the authorized Preview project; never a broad remote db push. There is no Edge-function or secret change for this checkpoint.

Pending: confirmed source timezone and operational cutoff, an execution/audit contract and explicit cleanup activation. Configurable performance alerts and Production promotion remain separate checkpoints.
