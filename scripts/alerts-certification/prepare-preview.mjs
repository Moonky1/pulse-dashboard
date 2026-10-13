import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
const project='sgshbawggqapuyqzkyhs',version=process.argv.includes('--safeupdate')?'20261012000300':process.argv.includes('--reconnect')?'20261012000200':'20261012000100'
const name=version==='20261012000300'?'pulse_alert_activation_safeupdate':version==='20261012000200'?'pulse_alert_reconnect':'pulse_operational_alerts'
if(process.argv[2]!==project)throw Error('Only isolated Pulse Preview is accepted')
const source=readFileSync('supabase/migrations/'+version+'_'+name+'.sql','utf8')
const body=source.replace(/^begin;\s*$/m,'').replace(/^commit;\s*$/m,'')
const sql=`begin isolation level repeatable read;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $$ begin
 if exists(select 1 from supabase_migrations.schema_migrations where version='${version}') ${version==='20261012000100'?"or to_regclass('public.pulse_schedule_events') is not null":"or to_regclass('public.pulse_schedule_events') is null"} then raise exception 'Unexpected Alerts contract preserved; inspect before applying'; end if;
end $$;
create temporary table alerts_business_fingerprint(name text,hash text);
insert into alerts_business_fingerprint
select 'users',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.users t union all
select 'agents',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.agents t union all
select 'teams',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.teams t union all
select 'results',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.training_results t;
${body}
do $$ declare mismatches integer; begin
 select count(*) into mismatches from alerts_business_fingerprint before
 join (
 select 'users' as name,md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) as hash from public.users t union all
 select 'agents',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.agents t union all
 select 'teams',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.teams t union all
 select 'results',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.training_results t
 ) after using(name) where before.hash<>after.hash;
 if mismatches<>0 or (select enabled from public.pulse_alert_settings) then raise exception 'Business data changed or dispatch activated; abort'; end if;
end $$;
insert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name}',array['${source.replaceAll("'","''")}']);
notify pgrst,'reload schema';
commit;
select '${version}' as applied_version,(select count(*) from public.pulse_schedule_events) as schedule_events,(select enabled from public.pulse_alert_settings) as dispatch_enabled;
`
mkdirSync('review-evidence.local/alerts-1',{recursive:true})
writeFileSync('review-evidence.local/alerts-1/preview-migration.sql',sql)
console.log(JSON.stringify({project,version,sourceSha256:createHash('sha256').update(source).digest('hex'),file:'review-evidence.local/alerts-1/preview-migration.sql',dispatchEnabled:false}))
