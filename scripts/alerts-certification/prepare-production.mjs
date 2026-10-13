import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
const project='lhgnbcaundgjeofjrscg'
if(process.argv[2]!==project || !process.argv.includes('--production-approved'))throw Error('Explicit Production checkpoint authorization required')
const names=['pulse_operational_alerts','pulse_alert_reconnect','pulse_alert_activation_safeupdate','public_schedule_admin_notices','schedule_times_loud_siren','schedule_sound_options']
const migrations=names.map((name,i)=>{const version='20261012000'+(i+1)+'00',source=readFileSync('supabase/migrations/'+version+'_'+name+'.sql','utf8');return {version,name,source}})
const sql=`begin isolation level repeatable read;
set local lock_timeout='5s';set local statement_timeout='60s';
do $$ begin
 if to_regclass('public.pulse_schedule_events') is not null or exists(select 1 from supabase_migrations.schema_migrations where version in (${migrations.map(m=>"'"+m.version+"'").join(',')})) then raise exception 'Production contract changed; inspect before applying'; end if;
 if to_regprocedure('pulse_private.require_global_permission(text)') is null or to_regprocedure('pulse_private.current_training_staff_user_id()') is null then raise exception 'Required security contract missing'; end if;
end $$;
create temporary table schedule_before(name text,hash text);
insert into schedule_before select 'users',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.users t union all select 'agents',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.agents t union all select 'teams',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.teams t union all select 'results',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.training_results t;
${migrations.map(m=>m.source.replace(/^begin;\s*$/m,'').replace(/^commit;\s*$/m,'')+"\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('"+m.version+"','"+m.name+"',array['"+m.source.replaceAll("'","''")+"']);").join('\n')}
do $$ begin
 if exists(select 1 from schedule_before b join (select 'users' as name,md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) as hash from public.users t union all select 'agents',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.agents t union all select 'teams',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.teams t union all select 'results',md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.training_results t) a using(name) where a.hash<>b.hash) then raise exception 'Business records changed; rollback'; end if;
 if (select enabled from public.pulse_alert_settings) or (select count(*) from public.pulse_schedule_events)<>5 or exists(select 1 from public.pulse_schedule_notices) or exists(select 1 from public.pulse_alert_occurrences) or exists(select 1 from pulse_private.pulse_alert_leases) then raise exception 'Unexpected dispatch or imported test data'; end if;
end $$;
notify pgrst,'reload schema';commit;
select 'public_schedule' as feature,(select count(*) from public.pulse_schedule_events) as events,(select enabled from public.pulse_alert_settings) as automatic_dispatch;
`
mkdirSync('review-evidence.local/alerts-production',{recursive:true});writeFileSync('review-evidence.local/alerts-production/release.sql',sql)
console.log(JSON.stringify({project,migrations:migrations.map(m=>({version:m.version,sha256:createHash('sha256').update(m.source).digest('hex')})),file:'review-evidence.local/alerts-production/release.sql',copiesPreviewData:false,automaticDispatch:false}))
