import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
import { allTeamsCsv } from './all-teams-fixtures.mjs'
import { ALL_TEAMS_GROUPS, DATASET_ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'
const database = process.argv[2]
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '')) throw Error('Disposable local database required')
const root = DATASET_ALL_TEAMS_SCOPE_ID, actor = 'ad910000-0000-4000-8000-000000000001'
const campaigns = ['0ListHol','Listhol','Openers','Openers2','Openers3','Openers4','Openers5','Openers6','OpenersH']
const groups = [...ALL_TEAMS_GROUPS,'Monitors']
const quote = value => "'" + JSON.stringify(value).replaceAll("'","''") + "'::jsonb"
const fixture = readFileSync('supabase/tests/20261010000100_vici_manual_reports_test.sql','utf8').split('insert into public.vici_report_scopes')[0]
const prepared = process.argv.includes('--originals') ? inspectManualReports({
  performanceText:readFileSync('C:/Users/simon/Downloads/AGENT_PERFORMACE_DETAIL20261013-200930.csv','utf8'),
  pauseText:readFileSync('C:/Users/simon/Downloads/AST_PAUSE_CODE_BREAKDOWN20261013-201035.csv','utf8'),reportDate:'2026-10-13',userGroups:groups,
}) : inspectManualReports({performanceText:allTeamsCsv(),pauseText:allTeamsCsv('pause'),reportDate:'2026-10-09',userGroups:groups})
const date = process.argv.includes('--originals') ? '2026-10-13' : '2026-10-09'
const co = process.argv.includes('--originals') ? inspectManualReports({performanceText:readFileSync('C:/Users/simon/Downloads/AGENT_PERFORMACE_DETAIL20261013-202033.csv','utf8'),reportDate:date,userGroups:groups}) : {
  pair:{...prepared.pair,performance:{...prepared.pair.performance,rows:prepared.pair.performance.rows.filter(r=>r.current_user_group==='OpenersCO')},pause:null},verification:prepared.verification,
}
const arr = values => `array[${values.map(v=>"'"+v+"'").join(',')}]`
const importCall = (pair,verification,camps=campaigns,kind='general',parent=root,who=actor) => `public.import_vici_dataset('${parent}','${date}','${who}',${pair},${verification},${arr(camps)},'${kind}')`
const configBody = readFileSync('scripts/dashboard-certification/configure-all-teams-datasets.sql','utf8').match(/do \$\$\r?\n([\s\S]*?)\r?\nend \$\$;/)[1]
const globalCall=importCall('pair','verification')
const input = fixture + `
insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled) values
('542b1474-29c7-4000-a1be-b0496fd9809d','garrett-all-teams-20261013','All teams','alwaysbeclosing',${arr(campaigns)},${arr(ALL_TEAMS_GROUPS)},true);
create function pg_temp.configure_source() returns void language plpgsql as $config$ ${configBody} end $config$;
select lives_ok('select pg_temp.configure_source()','new source applies without updating old definition');
select lives_ok('select pg_temp.configure_source()','source configuration is idempotent');
create temp table dataset_test(pair jsonb,verification jsonb,global_id uuid,co_id uuid,subset_id uuid,test_id uuid);
insert into dataset_test(pair,verification) values(${quote(prepared.pair)},${quote(prepared.verification)});
grant all on dataset_test to authenticated,service_role;
select ok(not has_function_privilege('authenticated','public.import_vici_dataset(uuid,date,uuid,jsonb,jsonb,text[],text)','execute'),'browser cannot forge normalized import');
select ok(not has_table_privilege('authenticated','pulse_private.vici_report_datasets','select'),'dataset registry remains private');
select ok(not has_table_privilege('service_role','pulse_private.vici_report_datasets','insert'),'no direct registry write grant');
set local role service_role;
select throws_ok($q$select ${importCall('pair','verification',['Openers5'],'run_test')} from dataset_test$q$,'22023',null,'run test rejects anything except OP5/OP6');
select throws_ok($q$select ${importCall('pair','verification',['Unknown'])} from dataset_test$q$,'22023',null,'unknown campaign rejected');
select throws_ok($q$select ${importCall('pair','verification',campaigns,'general',root,'ad910000-0000-4000-8000-000000000002')} from dataset_test$q$,'42501',null,'team reader cannot create a general-source dataset');
select throws_ok($q$select ${importCall("jsonb_set(pair,'{performance,rows,0,calls}','-1')",'verification')} from dataset_test$q$,'23514',null,'invalid rows roll back new dataset and scope');
reset role;
select is((select count(*) from pulse_private.vici_report_datasets),0::bigint,'failed imports leave no datasets');
set local role service_role;
update dataset_test set global_id=(${globalCall}->>'scope_id')::uuid;
update dataset_test set co_id=(${importCall(quote(co.pair),quote(co.verification))}->>'scope_id')::uuid;
update dataset_test set subset_id=(${importCall(quote(co.pair),quote(co.verification),['Openers2','Openers3'])}->>'scope_id')::uuid;
update dataset_test set test_id=(${importCall(quote(co.pair),quote(co.verification),['Openers5','Openers6'],'run_test')}->>'scope_id')::uuid;
reset role;
select is((select count(*) from pulse_private.vici_report_datasets),4::bigint,'global, team, selected campaigns and run test are isolated');
select is((select cardinality(user_groups) from public.vici_report_scopes where id=(select global_id from dataset_test)),12,'global uses stable twelve-group definition');
select is((select user_groups from public.vici_report_scopes where id=(select co_id from dataset_test)),array['OpenersCO'],'Colombia stays its own report');
select is((select campaigns from public.vici_report_scopes where id=(select subset_id from dataset_test)),array['Openers2','Openers3'],'OP2/OP3 namespace retained');
select is((select campaigns from public.vici_report_scopes where id=(select test_id from dataset_test)),array['Openers5','Openers6'],'OP5/OP6 namespace retained');
select is((select count(*) from public.users),2::bigint,'no users added by imports');
select is((select count(*) from public.user_roles),2::bigint,'no roles granted by imports');
select throws_ok($q$update public.vici_report_scopes set campaigns=array['Openers'] where id=(select global_id from dataset_test)$q$,'22023',null,'immutable source guard remains');
update public.vici_sync_runs set started_at=started_at-interval '10 seconds';
set local role service_role;
select is((select ${globalCall}->>'status' from dataset_test),'duplicate','global retry does not duplicate figures');
select throws_ok($q$select public.import_vici_dataset(global_id,'${date}','${actor}',pair,verification,${arr(campaigns)},'general') from dataset_test$q$,'22023',null,'datasets cannot recursively create import sources');
reset role;
select set_config('request.jwt.claim.sub','${actor}',true);
set local role authenticated;
select is((select jsonb_array_length(public.get_vici_dashboard(global_id,'${date}')->'performance') from dataset_test),${prepared.pair.performance.rows.length},'fresh protected read retrieves full global after partial uploads');
select is((select jsonb_array_length(public.get_vici_dashboard(co_id,'${date}')->'performance') from dataset_test),${co.pair.performance.rows.length},'fresh protected read retrieves Colombia separately');
select is((select public.get_vici_dashboard(test_id,'${date}')#>>'{scope,id}' from dataset_test),(select test_id::text from dataset_test),'run test reads only its dataset');
select is((select count(*)::integer from jsonb_array_elements(public.list_vici_dashboard_scopes()) s where s->>'dataset_kind'='run_test'),1,'protected catalog identifies run test');
reset role;
select set_config('request.jwt.claim.sub','ad910000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(*)::integer from jsonb_array_elements(public.list_vici_dashboard_scopes()) s where s->>'parent_scope_id'='${root}'),0,'team reader cannot enumerate unmapped general-source subsets');
select throws_ok($q$select public.get_vici_dashboard(co_id,'${date}') from dataset_test$q$,'42501',null,'partial dataset is not a permission bypass');
reset role;
insert into public.vici_report_scopes(id,code,label,source_key,campaigns,user_groups,enabled) values
('dd910000-0000-4000-8000-000000000007','scoped-dataset-review','Mapped A','fixture',${arr(campaigns)},array['MappedA'],true);
insert into public.vici_group_mappings(scope_id,vici_user_group,team_id) values
('dd910000-0000-4000-8000-000000000007','MappedA','ed910000-0000-4000-8000-000000000001'),
('dd910000-0000-4000-8000-000000000007','MappedB','ed910000-0000-4000-8000-000000000002');
create temp table scoped_dataset_test(pair jsonb,verification jsonb,id uuid);
insert into scoped_dataset_test(pair,verification) values(replace(${quote(co.pair)}::text,'OpenersCO','MappedA')::jsonb,${quote(co.verification)});
grant all on scoped_dataset_test to service_role,authenticated;
set local role service_role;
select throws_ok($q$select public.import_vici_dataset('dd910000-0000-4000-8000-000000000007','${date}','ad910000-0000-4000-8000-000000000002',jsonb_set(pair,'{performance,rows,0,most_recent_user_group}','"MappedB"'),verification,${arr(campaigns)},'general') from scoped_dataset_test$q$,'42501',null,'moved-group rows remain denied for scoped imports');
update scoped_dataset_test set id=(public.import_vici_dataset('dd910000-0000-4000-8000-000000000007','${date}','ad910000-0000-4000-8000-000000000002',pair,verification,${arr(campaigns)},'general')->>'scope_id')::uuid;
reset role;
set local role authenticated;
select is((select jsonb_array_length(public.get_vici_dashboard(id,'${date}')->'performance') from scoped_dataset_test),${co.pair.performance.rows.length},'team Staff reads own child through existing mapping');
reset role;
select is((select count(*) from public.user_roles),2::bigint,'mapped child creation grants no role');
update public.users set status='blocked' where auth_user_id='ad910000-0000-4000-8000-000000000002';
set local role service_role;
select throws_ok($q$select public.import_vici_dataset('dd910000-0000-4000-8000-000000000007','${date}','ad910000-0000-4000-8000-000000000002',pair,verification,${arr(campaigns)},'general') from scoped_dataset_test$q$,'42501',null,'blocked scoped Staff cannot reimport');
reset role;
delete from public.user_roles where user_id='bd910000-0000-4000-8000-000000000011';
set local role service_role;
select throws_ok($q$select ${globalCall} from dataset_test$q$,'42501',null,'revocation denies repeat import');
reset role;
select * from finish(); rollback;`
const result = spawnSync('docker',['exec','-i','supabase_db_auth-google-selector','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d',database],{input,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024})
if(result.status || /not ok|Looks like you failed/.test(result.stdout)) throw Error(result.stderr || result.stdout)
console.log(JSON.stringify({assertions:(result.stdout.match(/\bok \d+ -/g)||[]).length,result:'passed',originalFiles:process.argv.includes('--originals'),globalAgents:prepared.pair.performance.rows.length,colombiaAgents:co.pair.performance.rows.length,fixtures:'rolled back',remoteWrites:0}))
