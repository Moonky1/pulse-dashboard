import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
const container='supabase_db_auth-google-selector',baseline='pulse_dashboard1_review_20261009_104'
const database=process.argv[2]
if(!/^pulse_alerts1_review_20261012_[0-9]{1,3}$/.test(database||'')) throw Error('Fresh task-owned LOCAL database required')
function docker(args,input){const r=spawnSync('docker',args,{input,encoding:'utf8',windowsHide:true,maxBuffer:40*1024*1024});if(r.status!==0)throw Error((r.stderr||r.stdout).slice(-5000));return r.stdout}
function sql(input,role='postgres',db=database){return docker(['exec','-i',container,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U',role,'-d',db],input)}
if(!process.argv.includes('--tests-only')){
 if(sql(`select count(*) from pg_database where datname='${database}'`,'supabase_admin','postgres').trim()!=='0') throw Error('Existing database preserved; select a fresh name')
 sql(`create database ${database} owner supabase_admin`,'supabase_admin','postgres')
 const support=docker(['exec',container,'pg_dump','-U','supabase_admin','-d','postgres','--schema-only','--no-owner','--no-acl','-n','auth','-n','extensions','-n','storage','-n','realtime'])
 const policies=(support.match(/^CREATE POLICY[\s\S]*?;\s*$/gm)||[]).join('\n')
 sql(support.replace(/^CREATE POLICY[\s\S]*?;\s*$/gm,''),'supabase_admin')
 sql(`grant usage on schema auth,storage,realtime,extensions to postgres; grant all on all tables in schema auth,storage,realtime to postgres; grant execute on all functions in schema realtime to postgres; alter database ${database} owner to postgres;`,'supabase_admin')
 const schema=docker(['exec',container,'pg_dump','-U','postgres','-d',baseline,'--schema-only','--no-owner','-n','public','-n','pulse_private'])
 sql(schema.replace(/^CREATE SCHEMA public;$/m,''))
 sql(policies,'supabase_admin')
 sql(docker(['exec',container,'pg_dump','-U','postgres','-d',baseline,'--data-only','--column-inserts','--no-owner','--no-acl','-t','public.roles','-t','public.permissions','-t','public.role_permissions','-t','public.role_scopes','-t','public.role_grant_rules']))
 sql('create extension if not exists pgcrypto with schema extensions; create extension if not exists pgtap with schema extensions;')
 sql(readFileSync('supabase/migrations/20261012000100_pulse_operational_alerts.sql','utf8'))
 sql(readFileSync('supabase/migrations/20261012000200_pulse_alert_reconnect.sql','utf8'))
}
sql('grant usage on schema extensions to authenticated,service_role;', 'supabase_admin')
sql('grant usage on schema realtime to authenticated; grant select,insert on realtime.messages to authenticated;', 'supabase_admin')
const result=sql(readFileSync('supabase/tests/20261012000100_pulse_operational_alerts_test.sql','utf8'))
if(/not ok|Looks like you failed/i.test(result))throw Error(result)
const assertions=(result.match(/\bok \d+ -/g)||[]).length
if(!assertions)throw Error('Database assertions required')
console.log(JSON.stringify({database,assertions,result:'passed',leftovers:sql("select json_build_object('staff',(select count(*) from public.users),'agents',(select count(*) from public.agents),'occurrences',(select count(*) from public.pulse_alert_occurrences),'leases',(select count(*) from pulse_private.pulse_alert_leases),'dispatch_enabled',(select enabled from public.pulse_alert_settings));").trim()}))
