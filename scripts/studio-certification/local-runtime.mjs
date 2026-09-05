import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

export const container = 'supabase_db_pulse-dashboard'
export const apiUrl = 'http://127.0.0.1:54321'
export const appUrl = 'http://127.0.0.1:5177'
export function sql(statement) {
  const result = spawnSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], { input: statement, encoding: 'utf8', windowsHide: true })
  if (result.status !== 0) throw new Error(result.stderr || 'Local SQL failed')
  return result.stdout.trim()
}
export function sqlAsync(statement) {
  return new Promise((resolveResult, reject) => {
    const child = spawn('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], { windowsHide: true })
    let output = '', error = ''
    child.stdout.on('data', b => { output += b })
    child.stderr.on('data', b => { error += b })
    child.on('error', reject)
    child.on('close', code => resolveResult({ code, output: output.trim(), error }))
    child.stdin.end(statement)
  })
}
export function prepareLocal() {
  const list = spawnSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8', windowsHide: true })
  if (!list.stdout?.split(/\r?\n/).includes(container)) throw new Error('Expected disposable local Supabase container is not running.')
  if (sql('select current_database()') !== 'postgres') throw new Error('Unexpected local database')
  const unrelated = sql("select count(*) from auth.users where email !~ '^studio[1-8]@example[.]test$'")
  if (unrelated !== '0') throw new Error('Refusing fixtures: this database contains unrelated identities.')
  if (sql('select count(*) from auth.users') === '0') sql(readFileSync(new URL('./fixtures.sql', import.meta.url), 'utf8'))
  const password = randomBytes(24).toString('hex')
  // Ephemeral credential exists only in memory and the disposable Auth store.
  sql("update auth.users set encrypted_password=extensions.crypt('" + password + "',extensions.gen_salt('bf')) where email ~ '^studio[1-8]@example[.]test$'")
  return password
}
export function localAnonKey() {
  const result = spawnSync('cmd.exe', ['/d', '/s', '/c', 'npx supabase status -o json'], { encoding: 'utf8', windowsHide: true })
  if (result.status !== 0) throw new Error('Cannot read local Supabase status')
  const local = JSON.parse(result.stdout)
  if (local.API_URL !== apiUrl || !local.ANON_KEY) throw new Error('Unexpected local backend configuration')
  // Never print the status payload or pass privileged keys to the browser.
  return local.ANON_KEY
}
export async function startBrowserRuntime() {
  const root = process.env.PULSE_PLAYWRIGHT_ROOT
  if (!root) throw new Error('Set PULSE_PLAYWRIGHT_ROOT to the existing Playwright package directory; no runtime dependency is added to Pulse.')
  const { chromium } = createRequire(resolve(root, 'package.json'))('playwright')
  return chromium.launch({ channel: 'chrome', headless: true })
}
export async function startLocalApp(anonKey) {
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5177', '--strictPort'], {
    windowsHide: true, env: { ...process.env, VITE_SUPABASE_URL: apiUrl, VITE_SUPABASE_ANON_KEY: anonKey }, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let errors = ''
  child.stderr.on('data', b => { errors += b })
  child.stdout.on('data', () => {})
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('Local Vite exited: ' + errors)
    try { if ((await fetch(appUrl)).ok) return child } catch { /* startup */ }
    await new Promise(r => setTimeout(r, 200))
  }
  child.kill()
  throw new Error('Local Vite did not start')
}
