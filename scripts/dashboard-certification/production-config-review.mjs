import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Only rolled-back synthetic local data. No remote operation or identity changes.
const database = process.argv[2]
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '')) throw Error('Local Dashboard review database required')
const source = readFileSync('scripts/dashboard-certification/configure-asia-production.sql', 'utf8')
const body = source.match(/do \$\$\n([\s\S]*?)\nend \$\$;/)?.[1]
if (!body) throw Error('Expected guarded configuration body')
const input = `begin;
set local search_path=public,extensions;
select no_plan();
create schema supabase_migrations;
create table supabase_migrations.schema_migrations(version text primary key);
insert into supabase_migrations.schema_migrations values('20261009000100'),('20261010000100'),('20261010000200'),('20261010000300'),('20261011000100');
insert into public.business_areas(id,code,name) values('30000000-0000-4000-8000-000000000002','asia_test','Synthetic Asia review');
insert into public.campaigns(id,business_area_id,code,name) values('32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','auto_warranty_garrett','Auto Warranty Garrett');
insert into public.teams(id,business_area_id,campaign_id,code,name) values
('34000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','asia_team_a','Asia Team A'),
('34000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','asia_team_b','Asia Team B');
create function pg_temp.apply_asia() returns void language plpgsql as $config$ ${body} end $config$;
select lives_ok('select pg_temp.apply_asia()','verified canonical configuration applies');
select lives_ok('select pg_temp.apply_asia()','configuration is idempotent');
select is((select count(*) from public.vici_report_scopes),2::bigint,'two separate scopes only');
select is((select count(*) from public.vici_group_mappings),2::bigint,'two canonical mappings only');
select is((select user_groups::text from public.vici_report_scopes where code='garrett-asia-a'),'{OpenersAsia}','A exact source definition');
select is((select user_groups::text from public.vici_report_scopes where code='garrett-asia-b'),'{OpenersAsia1}','B exact source definition');
select is((select count(*) from public.users),0::bigint,'no Staff mutations');
select is((select count(*) from public.agents),0::bigint,'no agent mutations');
select is((select count(*) from public.vici_sync_runs),0::bigint,'no imported history');
update public.vici_group_mappings set team_id=null where vici_user_group='OpenersAsia1';
select throws_ok('select pg_temp.apply_asia()','P0001','Existing Production mapping differs from approved definition','null mapping fails closed');
update public.vici_group_mappings set team_id='34000000-0000-4000-8000-000000000011' where vici_user_group='OpenersAsia1';
select throws_ok('select pg_temp.apply_asia()','P0001','Existing Production mapping differs from approved definition','wrong mapping fails closed');
update public.vici_group_mappings set team_id='34000000-0000-4000-8000-000000000012' where vici_user_group='OpenersAsia1';
update public.teams set is_active=false where code='asia_team_b';
select throws_ok('select pg_temp.apply_asia()','P0001','Canonical Production teams differ from reviewed configuration','inactive team fails closed');
update public.teams set is_active=true where code='asia_team_b';
delete from supabase_migrations.schema_migrations where version='20261011000100';
select throws_ok('select pg_temp.apply_asia()','P0001','Dashboard schema release incomplete','incomplete release fails closed');
select * from finish();
rollback;`
const result = spawnSync('docker', ['exec', '-i', 'supabase_db_auth-google-selector', 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database], { input, encoding: 'utf8', windowsHide: true })
if (result.status || /not ok|Looks like you failed/.test(result.stdout)) throw Error(result.stderr || result.stdout)
console.log(JSON.stringify({ database, assertions: (result.stdout.match(/\bok \d+ -/g) || []).length, result: 'passed', fixture: 'rolled back', remoteWrites: 0 }))
