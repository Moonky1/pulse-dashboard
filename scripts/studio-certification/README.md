# Studio local certification

These scripts mutate **only** the disposable `supabase_db_pulse-dashboard` Docker database. They refuse a database containing identities other than their eight `studioN@example.test` fixtures. Never run them against a shared development database. No remote connection parameter exists.

## Prerequisites and sequence

Use the existing Node/npm dependencies, Docker Desktop, the local Supabase CLI, installed Chrome, and an existing Playwright installation. No application dependency was added. Set `PULSE_PLAYWRIGHT_ROOT` to the directory containing the existing Playwright installation and its `package.json`.

From the repository, with the disposable local stack running:

```powershell
npx supabase db reset --local
$env:PULSE_LOCAL_ENGINE_WORKAROUND = 'supautils-hints'
node scripts/studio-certification/prepare-engine.mjs
npx supabase test db
npm run test:studio:browser
npm run test:studio:concurrency
npm run pulse:release-check
```

**Order matters:** the historical database suites expect an empty business-data baseline. Browser and concurrency scripts persist fictitious data. Reset locally before rerunning the database suites; do not interpret fixture collisions or baseline-count failures after browser tests as application regressions. Do not run browser and concurrency scripts simultaneously: each rotates fixture credentials.

The runtime creates random fixture passwords in memory and the disposable Auth database only. It reads the local anon key without printing the status payload; no service-role key reaches the browser. The app listens on `127.0.0.1:5177`; Supabase is `127.0.0.1:54321`. Browser routing rejects other destinations. Screenshots are written to ignored `studio-artifacts.local/`.

## Local engine compatibility exception

The tested PostgreSQL 17.6 image crashed with signal 11 when Supautils generated its automatic role hint after denied function execution. This was reproduced on both the new capabilities function and the unchanged archive function. The permissions themselves correctly deny access.

The explicit opt-in preparation disables **only** `supautils.hint_roles` inside the fixed local container and restarts that container. It does not alter roles, ACLs, RLS, migrations, or application grants. The container's existing internal administrative credential is consumed internally and is never printed or stored in this repository. A local reset restores the original engine setting, so preparation must follow reset.

This is an environment workaround, not part of the feature migration or a proposed remote setting change. Before any remote stage, separately verify the actual target engine's behavior for denied anonymous calls. Do not automatically carry this workaround to Pulse Dev or Production.

## Evidence boundaries

- Browser checks cover real local Auth, section persistence, recovery, two-client stale writes, reviewed-version publication, archive, responsive layouts, keyboard focus, explicit search, pagination, and delayed-response races.
- The simulated 503 and deliberate 409 conflicts are expected negative-test responses, not unexplained console errors.
- Browser Preview performs no RPC, learner, attempt, result, or audit write.
- The separate concurrency/scoring script intentionally creates a fictitious local learner/attempt/result to certify unchanged text scoring. It is not the browser Preview path.
- Independent PostgreSQL connections hold a real row lock and prove stale publication fails after the competing update commits.
- Stop the disposable project when finished with `npx supabase stop --no-backup` if its data is no longer needed. Do not use that command for any shared project.
