import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('Studio is lazy-routed through the authenticated Staff application and shown only after canonical access', async () => {
  const app = await readFile(new URL('../auth/AuthApp.jsx', import.meta.url), 'utf8')
  const workspace = await readFile(new URL('../auth/screens/WorkspacePage.jsx', import.meta.url), 'utf8')
  const page = await readFile(new URL('./StudioPage.jsx', import.meta.url), 'utf8')
  assert.match(app, /lazy\(\(\) => import\('\.\.\/studio\/StudioPage\.jsx'\)/)
  assert.match(app, /path="\/studio"[\s\S]*RouteGate allow=\{\[AUTH_STATES\.ACTIVE\]\}/)
  assert.match(workspace, /studioAccess\.state === 'allowed'/)
  assert.match(page, /access\.state === 'denied'.*StudioDenied/s)
  assert.match(page, /Create content/)
  assert.match(page, /Content creation is coming next/)
})

test('Studio supports protected catalog filters, empty state, refresh, pagination, and keyboard-accessible fields', async () => {
  const page = await readFile(new URL('./StudioPage.jsx', import.meta.url), 'utf8')
  assert.match(page, /Search catalog/)
  assert.match(page, /Language/)
  assert.match(page, /Topic/)
  assert.match(page, /Lifecycle/)
  assert.match(page, /Refresh/)
  assert.match(page, /Previous/)
  assert.match(page, /Next/)
  assert.match(page, /No training content yet/)
  assert.match(page, /event\.key === 'Enter'/)
})
