import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const database = process.argv[2]
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '')) throw Error('Disposable local Dashboard database required')
const source = readFileSync('scripts/dashboard-certification/configure-all-teams.sql', 'utf8')
const body = source.match(/do \$\$\r?\n([\s\S]*?)\r?\nend \$\$;/)?.[1]
if (!body) throw Error('Guarded configuration required')
const fixture = readFileSync('supabase/tests/20261010000100_vici_manual_reports_test.sql', 'utf8').split('insert into public.vici_report_scopes')[0]
const id = '98991d5e-5cc2-4257-966a-f5865a288f6f'
const input = fixture + `
insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled) values
('426ab519-b87b-4410-bd42-e255b240bea1','garrett-asia-a','Asia A','alwaysbeclosing',array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'],array['OpenersAsia'],true);
create function pg_temp.apply_all_teams() returns void language plpgsql as $config$ ${body} end $config$;
select lives_ok('select pg_temp.apply_all_teams()','All teams configuration applies');
select lives_ok('select pg_temp.apply_all_teams()','All teams configuration is idempotent');
select is((select cardinality(user_groups) from public.vici_report_scopes where id='${id}'),10,'ten reviewed exact groups');
select is((select count(*) from public.vici_group_mappings where scope_id='${id}'),0::bigint,'no implicit permission mappings');
select is((select count(*) from public.users),2::bigint,'configuration changes no Staff');
select is((select count(*) from public.user_roles),2::bigint,'configuration grants no roles');
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000001',true);
set local role authenticated;
select ok(public.can_import_vici_reports('${id}'),'existing global Dashboard reader can import');
select lives_ok($$select public.get_vici_dashboard('${id}','2026-10-09')$$,'global reader can read');
select ok(exists(select 1 from jsonb_array_elements(public.list_vici_dashboard_scopes()) s where s->>'id'='${id}'),'global catalog includes All teams');
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
