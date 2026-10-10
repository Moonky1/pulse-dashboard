// Bounded LOCAL proof: exactly two report pairs and one simulated failed cycle.
// Does not schedule a job, deploy code, modify a remote DB, or create any Staff.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { collectViciScope } from '../../supabase/functions/_shared/viciCollector.mjs'
const [database, configPath, reportDate] = process.argv.slice(2)
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '') || !configPath || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate || '')) {
  throw new Error('Usage: local-live-proof.mjs <fresh Dashboard local DB> <private-env-file> <explicit-date>')
}
const env = parseEnv(readFileSync(configPath, 'utf8'))
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const json = value => quote(JSON.stringify(value)) + '::jsonb'
function sql(statement) {
  const result = spawnSync('docker', ['exec', '-i', 'supabase_db_auth-google-selector', 'psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database],
    { input: statement, encoding: 'utf8', windowsHide: true, maxBuffer: 12 * 1024 * 1024 })
  if (result.status !== 0) throw new Error('Private local persistence proof failed')
  return result.stdout.trim()
}
function rpc(name, args) { return JSON.parse(sql('select public.' + name + '(' + args.join(',') + ')')) }
const source = { key: 'local_vici_proof', baseUrl: env.VICI_BASE_URL, user: env.VICI_REPORT_USER, password: env.VICI_REPORT_PASSWORD }
if (!source.baseUrl || !source.user || !source.password || !env.VICI_REPORT_CAMPAIGNS || !env.VICI_REPORT_USER_GROUPS) throw new Error('Private source configuration incomplete')
if (sql('select (select count(*) from public.vici_sync_runs)+(select count(*) from public.vici_report_scopes)+(select count(*) from public.users)+(select count(*) from public.agents)') !== '0') {
  throw new Error('Live proof requires an empty task-owned local database')
}
const campaigns = env.VICI_REPORT_CAMPAIGNS.split(',').map(v => v.trim())
const groups = env.VICI_REPORT_USER_GROUPS.split(',').map(v => v.trim())
const scopeId = sql("insert into public.vici_report_scopes(code,label,source_key,campaigns,user_groups,enabled) values('local_live_proof','Private local report proof','local_vici_proof',array[" +
  campaigns.map(quote).join(',') + '],array[' + groups.map(quote).join(',') + '],true) returning id')
const repository = {
  scope: async () => ({ enabled: true, source_key: source.key, source_time_zone: null }),
  begin: async (id, date) => rpc('begin_vici_sync', [quote(id), quote(date)]),
  complete: async (run, pair) => rpc('complete_vici_sync', [quote(run), json(pair)]),
  fail: async (run, category, retry) => { sql('select public.fail_vici_sync(' + [quote(run), quote(category), retry].join(',') + ')') },
}
const summary = () => JSON.parse(sql("select json_build_object('successful_pairs',(select count(*) from public.vici_sync_runs where status='success'),'performance_rows',(select count(*) from public.vici_agent_performance_snapshots),'pause_rows',(select count(*) from public.vici_agent_pause_snapshots),'last_success_at',last_success_at,'last_failed_at',last_failure_at,'last_error_category',last_error_category) from public.vici_integration_health where scope_id=" + quote(scopeId)))
const starts = []
let lastGood
for (let cycle = 0; cycle < 3; cycle++) {
  if (cycle) await new Promise(resolve => setTimeout(resolve, Math.max(0, 61000 - (Date.now() - starts.at(-1)))))
  starts.push(Date.now())
  const result = await collectViciScope({ scopeId, reportDate, repository, source,
    ...(cycle === 2 ? { makeClient: () => ({ readPair: async () => { throw { category: 'source_unavailable' } } }) } : {}),
  })
  const state = summary()
  console.log(JSON.stringify({ cycle: cycle + 1, simulatedFailure: cycle === 2, result, ...state }))
  if (cycle < 2 && !['success', 'duplicate'].includes(result.status)) throw new Error('Local report cycle did not complete; no automatic retry')
  if (cycle === 2 && (result.status !== 'failed' || result.category !== 'source_unavailable')) throw new Error('Expected simulated failure')
  if (cycle === 1) lastGood = state
  if (cycle === 2 && ['successful_pairs', 'performance_rows', 'pause_rows', 'last_success_at'].some(key => state[key] !== lastGood[key])) {
    throw new Error('Failed cycle changed last successful data')
  }
}
console.log(JSON.stringify({ proof: 'local_collector_database', sourceRequests: 4, intervalsSeconds: starts.slice(1).map((start, i) => Math.round((start - starts[i]) / 1000)),
  credentialsPrinted: false, remoteDatabaseWrites: false, rawCsvPersisted: false, latestDataPreserved: summary().successful_pairs >= 1 }))
