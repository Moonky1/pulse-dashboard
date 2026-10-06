import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

// Public frontend configuration only. Never uses env pull or a privileged key.
const source = 'https://pulse-kk-git-pulse-agent-1-go-identity-pulsekk.vercel.app'
const origin = 'https://pulse-kk-git-pulse-admin-2-people-access-pulsekk.vercel.app'
const branch = 'pulse/admin-2-people-access'
const project = 'sgshbawggqapuyqzkyhs'
function vercel(args, input) {
  if (args.some(value => /["&|<>\r\n]/.test(value))) throw new Error('Invalid CLI argument')
  const cli = process.env.PULSE_VERCEL_CLI_PATH || join(process.env.APPDATA, 'npm/node_modules/vercel/dist/vc.js')
  const result = spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 })
  if (result.status !== 0) throw new Error('Public Preview configuration operation failed: ' + (result.error?.code || (result.stderr + result.stdout).replace(/sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]+/g,'[public-key]')).slice(-900))
  return result.stdout
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
for (const [name, value] of Object.entries(values)) {
  vercel(['env', 'add', name, 'preview', '--git-branch', branch, '--no-sensitive', '--yes'], value)
  console.log('Configured public variable ' + name + ' for ' + branch)
}
console.log(JSON.stringify({ branch, origin, backend: project, publicVariables: Object.keys(values).length, privilegedKeysCopied: 0, productionOperations: 0 }))
