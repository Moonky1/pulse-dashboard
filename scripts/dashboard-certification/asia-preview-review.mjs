import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Guarded configuration is exercised only inside a rolled-back synthetic local fixture.
const database = process.argv[2]
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '')) throw Error('Local Dashboard review database required')
const source = readFileSync('scripts/dashboard-certification/configure-asia-preview.sql', 'utf8')
const body = source.match(/do \$\$\n([\s\S]*?)\nend \$\$;/)?.[1]
if (!body) throw Error('Expected guarded configuration body')
const input = `begin;
set local search_path=public,extensions;
select no_plan();
insert into public.business_areas(id,code,name) values('30000000-0000-4000-8000-000000000002','asia_test','Synthetic Asia review');
insert into public.campaigns(id,business_area_id,code,name) values('32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','asia_test','Synthetic Asia campaign');
insert into public.teams(id,business_area_id,campaign_id,code,name) values
('34000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','asia_team_a','Asia Team A'),
('34000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','asia_team_b','Asia Team B');
insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled) values
('426ab519-b87b-4410-bd42-e255b240bea1','garrett-openers-preview','Old A','alwaysbeclosing',array['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH'],array['OpenersAsia'],true);
create function pg_temp.apply_asia() returns void language plpgsql as $config$ ${body} end $config$;
select lives_ok('select pg_temp.apply_asia()','confirmed exact mapping applies');
select lives_ok('select pg_temp.apply_asia()','configuration is idempotent');
select is((select count(*) from public.vici_report_scopes),2::bigint,'two separate scopes, no duplicates');
select is((select count(*) from public.vici_group_mappings),2::bigint,'two canonical mappings only');
select is((select user_groups::text from public.vici_report_scopes where code='garrett-openers-preview'),'{OpenersAsia}','A source definition preserved');
select is((select user_groups::text from public.vici_report_scopes where code='garrett-asia-b-preview'),'{OpenersAsia1}','B exact current group');
select is((select t.name from public.vici_group_mappings m join public.teams t on t.id=m.team_id where m.vici_user_group='OpenersAsia1'),'Asia Team B','B maps to canonical B');
select is((select count(*) from public.users),0::bigint,'no Staff created or changed');
select is((select count(*) from public.agents),0::bigint,'no agents created or changed');
select is((select count(*) from public.vici_sync_runs),0::bigint,'no fabricated report history');
update public.vici_group_mappings set team_id=null where vici_user_group='OpenersAsia1';
select throws_ok('select pg_temp.apply_asia()','P0001','Existing mapping conflicts with the confirmed Asia teams','null/incomplete mapping cannot silently broaden access');
update public.vici_group_mappings set team_id='34000000-0000-4000-8000-000000000011' where vici_user_group='OpenersAsia1';
select throws_ok('select pg_temp.apply_asia()','P0001','Existing mapping conflicts with the confirmed Asia teams','wrong team fails closed');
update public.vici_group_mappings set team_id='34000000-0000-4000-8000-000000000012' where vici_user_group='OpenersAsia1';
update public.teams set is_active=false where code='asia_team_b';
select throws_ok('select pg_temp.apply_asia()','P0001','Canonical Asia teams differ from reviewed Preview configuration','inactive team fails closed');
select * from finish();
rollback;`
const result = spawnSync('docker', ['exec', '-i', 'supabase_db_auth-google-selector', 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database], { input, encoding: 'utf8', windowsHide: true })
if (result.status || /not ok|Looks like you failed/.test(result.stdout)) throw Error(result.stderr || result.stdout)
console.log(JSON.stringify({ database, assertions: (result.stdout.match(/\bok \d+ -/g) || []).length, result: 'passed', fixture: 'rolled back', remoteWrites: 0 }))
