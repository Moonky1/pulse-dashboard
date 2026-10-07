import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

// Branch-scoped configuration. Privileged server setup requires --agent-server.
// Never uses env pull or writes secret values to files or tool output.
const recovery = process.argv.includes('--recovery')
const origin = recovery ? 'https://pulse-kk-git-pulse-auth-go-join-recovery-pulsekk.vercel.app' : 'https://pulse-kk-git-pulse-admin-2-people-access-pulsekk.vercel.app'
const verifyOnly = process.argv.includes('--verify-only')
const source = verifyOnly ? origin : 'https://pulse-kk-git-pulse-admin-2-people-access-pulsekk.vercel.app'
const branch = recovery ? 'pulse/auth-go-join-recovery' : 'pulse/admin-2-people-access'
const project = 'sgshbawggqapuyqzkyhs'
function vercel(args, input) {
  if (args.some(value => /["&|<>\r\n]/.test(value))) throw new Error('Invalid CLI argument')
  const cli = process.env.PULSE_VERCEL_CLI_PATH || join(process.env.APPDATA, 'npm/node_modules/vercel/dist/vc.js')
  const result = spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 })
  if (result.status !== 0) throw new Error('Public Preview configuration operation failed: ' + (result.error?.code || (result.stderr + result.stdout).replace(/sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]+/g,'[public-key]')).slice(-900))
  return result.stdout
}
if (process.argv.includes('--agent-server')) {
  if (!recovery || verifyOnly) throw new Error('Server setup is restricted to the explicitly authorized recovery branch')
  // Explicit checkpoint authorization required. Values stay only in process memory
  // and Vercel server secrets; no env pull, file output or privileged browser key.
  const result = spawnSync('cmd.exe', ['/d', '/c', 'npx', 'supabase', 'projects', 'api-keys', '--project-ref', project, '--output', 'json'], { encoding: 'utf8', windowsHide: true })
  if (result.status !== 0) throw new Error('Authorized Preview key lookup failed; no key output is printed')
  const entries = JSON.parse(result.stdout)
  const serverKey = entries.find(entry => entry.name === 'service_role')?.api_key
  if (!serverKey) throw new Error('Preview service key is unavailable')
  const claims = JSON.parse(Buffer.from(serverKey.split('.')[1], 'base64url'))
  if (claims.ref !== project || claims.role !== 'service_role') throw new Error('Unexpected server key scope')
  vercel(['env', 'add', 'PULSE_AGENT_SUPABASE_URL', 'preview', '--git-branch', branch, '--sensitive', '--yes'], 'https://' + project + '.supabase.co')
  vercel(['env', 'add', 'PULSE_AGENT_SERVICE_ROLE_KEY', 'preview', '--git-branch', branch, '--sensitive', '--yes'], serverKey)
  console.log('Configured server-only Preview Agent secrets for the authorized branch; no values printed')
}
const html = vercel(['curl', '/', '--deployment', source, '--', '--silent', '--show-error'])
const asset = html.match(/<script[^>]+src="(\/assets\/[A-Za-z0-9._-]+\.js)"/)?.[1]
if (!asset) throw new Error('Public frontend bundle not found')
let bundle = vercel(['curl', asset, '--deployment', source, '--', '--silent', '--show-error'])
const runtimeImports = [...new Set(bundle.match(/\.\/(?:jsx-runtime|supabase)[A-Za-z0-9._-]*\.js/g) || [])].slice(0, 4)
for (const runtime of runtimeImports) bundle += vercel(['curl', '/assets/' + runtime.slice(2), '--deployment', source, '--', '--silent', '--show-error'])
if (!bundle.includes('https://' + project + '.supabase.co')) throw new Error('Source Preview backend does not match the authorized project')
const publishable = [...new Set(bundle.match(/sb_publishable_[A-Za-z0-9_-]+/g) || [])]
const anonymous = [...new Set(bundle.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [])].filter(value => {
  try { const claims = JSON.parse(Buffer.from(value.split('.')[1], 'base64url')); return claims.role === 'anon' && claims.ref === project } catch { return false }
})
const publicKeys = publishable.length ? publishable : anonymous
if (publicKeys.length !== 1) throw new Error('Expected exactly one nonprivileged public frontend key')
const values = {
  VITE_SUPABASE_URL: 'https://' + project + '.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: publicKeys[0],
  VITE_GO_PRACTICE_ORIGIN: origin, VITE_GO_PRACTICE_PROJECT_REF: project,
  VITE_GO_HOSTED_ORIGIN: origin, VITE_GO_HOSTED_PROJECT_REF: project,
  VITE_TRAINING_AUTHORING_ORIGIN: origin, VITE_TRAINING_AUTHORING_PROJECT_REF: project,
}
if (!verifyOnly) {
  for (const [name, value] of Object.entries(values)) {
    vercel(['env', 'add', name, 'preview', '--git-branch', branch, '--no-sensitive', '--yes'], value)
    console.log('Configured public variable ' + name + ' for ' + branch)
  }
}
console.log(JSON.stringify({ branch, origin, backend: project, publicVariables: Object.keys(values).length, verifyOnly, privilegedKeysCopied: process.argv.includes('--agent-server') ? 1 : 0, productionOperations: 0 }))
