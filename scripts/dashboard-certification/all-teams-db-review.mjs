import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { allTeamsCsv } from './all-teams-fixtures.mjs'
import { ALL_TEAMS_GROUPS } from '../../src/dashboard/allTeamsScope.js'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
const database = process.argv[2]
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '')) throw Error('Disposable local Dashboard database required')
const source = readFileSync('scripts/dashboard-certification/configure-all-teams-current.sql', 'utf8')
const previousBody = readFileSync('scripts/dashboard-certification/configure-all-teams.sql', 'utf8').match(/do \$\$\r?\n([\s\S]*?)\r?\nend \$\$;/)?.[1]
const body = source.match(/do \$\$\r?\n([\s\S]*?)\r?\nend \$\$;/)?.[1]
if (!body) throw Error('Guarded configuration required')
const fixture = readFileSync('supabase/tests/20261010000100_vici_manual_reports_test.sql', 'utf8').split('insert into public.vici_report_scopes')[0]
const id = '542b1474-29c7-4000-a1be-b0496fd9809d'
const prepared = inspectManualReports({ performanceText: allTeamsCsv(), reportDate: '2026-10-09', userGroups: ALL_TEAMS_GROUPS })
const pair = JSON.stringify(prepared.pair).replaceAll("'", "''"), verification = JSON.stringify(prepared.verification).replaceAll("'", "''")
const importSql = `select public.import_vici_reports('${id}','2026-10-09','ad910000-0000-4000-8000-000000000001','${pair}'::jsonb,'${verification}'::jsonb)`
const input = fixture + `
insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled) values
('426ab519-b87b-4410-bd42-e255b240bea1','garrett-asia-a','Asia A','alwaysbeclosing',array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'],array['OpenersAsia'],true);
create function pg_temp.apply_all_teams() returns void language plpgsql as $config$ ${body} end $config$;
create function pg_temp.apply_previous_all_teams() returns void language plpgsql as $config$ ${previousBody} end $config$;
select pg_temp.apply_previous_all_teams();
select lives_ok('select pg_temp.apply_all_teams()','All teams configuration applies');
select lives_ok('select pg_temp.apply_all_teams()','All teams configuration is idempotent');
select is((select cardinality(user_groups) from public.vici_report_scopes where id='${id}'),11,'eleven reviewed exact groups including ADMIN');
select is((select cardinality(user_groups) from public.vici_report_scopes where id='98991d5e-5cc2-4257-966a-f5865a288f6f'),10,'earlier source definition is preserved');
select throws_ok($$update public.vici_report_scopes set user_groups=array['ADMIN'] where id='98991d5e-5cc2-4257-966a-f5865a288f6f'$$,'22023','Create a new scope for a different source definition','immutable history guard remains active');
select ok((select 'ADMIN'=any(user_groups) from public.vici_report_scopes where id='${id}'),'ADMIN source rows are allowed in All teams');
select is((select count(*) from public.vici_group_mappings where scope_id='${id}'),0::bigint,'no implicit permission mappings');
select is((select count(*) from public.users),2::bigint,'configuration changes no Staff');
select is((select count(*) from public.user_roles),2::bigint,'configuration grants no roles');
set local role service_role;
select lives_ok($import$${importSql}$import$,'general performance report including ADMIN saves to the database');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select ok(public.can_import_vici_reports('${id}'),'existing global Dashboard reader can import');
select lives_ok($$select public.get_vici_dashboard('${id}','2026-10-09')$$,'global reader can read');
select ok(exists(select 1 from jsonb_array_elements(public.list_vici_dashboard_scopes()) s where s->>'id'='${id}'),'global catalog includes All teams');
select is(jsonb_array_length(public.get_vici_dashboard('${id}','2026-10-09')->'performance'),22,'fresh protected read returns all stored rows');
select is(jsonb_array_length(public.get_vici_dashboard('${id}','2026-10-12')->'performance'),0,'a different date does not masquerade as the stored report');
reset role;
select pg_sleep(1.1);
set local role service_role;
select is((${importSql})->>'status','duplicate','same source upload stays idempotent');
reset role;
set local role authenticated;
select is(jsonb_array_length(public.get_vici_dashboard('${id}','2026-10-09')->'performance'),22,'duplicate upload preserves the stored report for future reads');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select ok(not public.can_import_vici_reports('${id}'),'team-only Staff cannot import general data');
select throws_ok($$select public.get_vici_dashboard('${id}','2026-10-09')$$,'42501','Dashboard access denied','team-only Staff cannot read general data');
select ok(not exists(select 1 from jsonb_array_elements(public.list_vici_dashboard_scopes()) s where s->>'id'='${id}'),'team-only catalog does not leak global scope');
reset role;
delete from public.user_roles where user_id='bd910000-0000-4000-8000-000000000011';
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select ok(not public.can_import_vici_reports('${id}'),'revoked global grant cannot import');
reset role;
insert into public.vici_group_mappings(scope_id,vici_user_group,team_id) values('${id}','OpenersAsia','ed910000-0000-4000-8000-000000000001');
select throws_ok('select pg_temp.apply_all_teams()','P0001','All teams requires existing global access; unexpected group mapping','configuration rejects unexpected permission mapping');
select * from finish();
rollback;`
const result = spawnSync('docker', ['exec','-i','supabase_db_auth-google-selector','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d',database], { input, encoding:'utf8', windowsHide:true })
if (result.status || /not ok|Looks like you failed/.test(result.stdout)) throw Error(result.stderr || result.stdout)
console.log(JSON.stringify({ assertions:(result.stdout.match(/\bok \d+ -/g)||[]).length, result:'passed', fixture:'rolled back', remoteWrites:0 }))
