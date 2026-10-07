import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = file => readFile(new URL(file, import.meta.url), 'utf8')

test('decorative card glow never intercepts Join or other card actions', async () => {
  assert.match(await read('goProduct.css'), /\.go-mode-card::after\s*\{\s*pointer-events:\s*none;\s*\}/)
})

test('Agent navigation reuses the Staff visual shell without Staff destinations or mutations', async () => {
  const header = await read('AgentGoHeader.jsx')
  assert.match(header, /ProductHeader\.css/)
  assert.match(header, /pulse-product-header__inner/)
  assert.match(header, /to="\/go"[\s\S]*<PulseOrb[\s\S]*to="\/academy"/)
  assert.match(header, /<details className="pulse-product-account"/)
  assert.match(header, /to="\/agent\/settings"/)
  assert.match(header, /to=\{`\/profile\/\$\{agent.agent_code\}`\}/)
  assert.doesNotMatch(header, /to="\/(?:workspace|dashboard|studio|admin|settings)(?:\/|")|updateOwnStaffProfile|useAdminAccess|supabase/)
})

test('Agent settings uses only verified account facts and existing game preferences', async () => {
  const page = await read('AgentSettingsPage.jsx')
  const routes = await read('../auth/AuthApp.jsx')
  assert.match(routes, /path="\/agent\/settings" element=\{<GoPlayerGate>/)
  assert.match(page, /kind !== 'agent'/)
  assert.match(page, /agent\.agent_code/)
  assert.match(page, /GoSoundToggle/)
  assert.doesNotMatch(page, /AvatarControls|updateOwnStaffProfile|\.rpc\(|\.from\(|PIN|password/)
})

test('Agent name is primary with a smaller ID below, while activation and login keep the ID', async () => {
  const header = await read('AgentGoHeader.jsx')
  const css = await read('../components/ProductHeader.css')
  const admin = await read('../admin/pages/AdminAgentsPage.jsx')
  const entry = await read('../auth/screens/AgentSignInPage.jsx')
  assert.match(header, /name = goPlayerName\(agent/)
  assert.match(header, /name--agent[^]*<strong title=\{name\}>\{name\}<\/strong><small>ID: \{agent.agent_code\}<\/small>/)
  assert.match(header, /<GoTeamBadge player=\{agent\}/)
  assert.match(css, /name--agent small \{[^}]*font-size: \.68rem/)
  assert.match(admin, /<span>Name<\/span><input[^]*minLength=\{2\} maxLength=\{80\}/)
  assert.match(admin, /provisionAgent\(supabase, \{ code, name, teamId \}\)/)
  assert.doesNotMatch(admin, /The player will appear as Agent/)
  assert.match(entry, /signIn\(code.trim\(\), pin\)/)
  assert.match(entry, /Staff has already registered your name and team/)
})

test('player landing centers two cards and does not advertise hosting', async () => {
  const landing = await read('GoLandingPage.jsx')
  const css = await read('goProduct.css')
  assert.match(landing, /canHost\(access.capabilities\) \? 'Practice, host,[^']+' : 'Practice or join a live round'/)
  assert.match(landing, /go-mode-grid--player/)
  assert.match(landing, /<h2>Play solo<\/h2>/)
  assert.match(landing, /Join a round/)
  assert.match(css, /\.go-mode-grid--player \{[^}]*repeat\(2,[^}]*margin-inline: auto;/)
})
