import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const areaUrl = new URL('./AdminArea.jsx', import.meta.url)
const shellUrl = new URL('./components/AdminShell.jsx', import.meta.url)
const positionsPageUrl = new URL('./pages/AdminPositionsPage.jsx', import.meta.url)
const positionsHookUrl = new URL('./hooks/usePositionCatalog.js', import.meta.url)
const detailUrl = new URL('./pages/AdminUserDetailPage.jsx', import.meta.url)
const assignmentsUrl = new URL('./components/OperationalAssignments.jsx', import.meta.url)
const assignmentsHookUrl = new URL('./hooks/useOperationalAssignments.js', import.meta.url)

test('Positions is lazy-routed, permission-gated, searchable, and read-only', async () => {
  const [area, shell, page, hook] = await Promise.all([
    readFile(areaUrl, 'utf8'),
    readFile(shellUrl, 'utf8'),
    readFile(positionsPageUrl, 'utf8'),
    readFile(positionsHookUrl, 'utf8'),
  ])
  assert.match(area, /lazy\(.*AdminPositionsPage/)
  assert.match(area, /path="positions"/)
  assert.match(area, /canViewPositions\(permissionKeys\)/)
  assert.match(shell, /positionsAccess.*NavLink to="\/admin\/positions"/s)
  assert.match(page, /No positions/)
  assert.match(page, /No matching Positions/)
  assert.match(page, /Search Positions/)
  assert.match(page, /Refresh/)
  assert.match(page, /what people do at work/)
  assert.match(hook, /listManagedPositions\(supabase\)/)
  assert.doesNotMatch(`${page}\n${hook}`, /Confirm|Create Position|Edit Position|Deactivate|\.from\(/)
})

test('staff profile separates work details, position, campaign assignments, and Pulse access', async () => {
  const [detail, assignments, hook] = await Promise.all([
    readFile(detailUrl, 'utf8'),
    readFile(assignmentsUrl, 'utf8'),
    readFile(assignmentsHookUrl, 'utf8'),
  ])
  assert.match(detail, /Work details/)
  assert.match(detail, /Team/)
  assert.match(detail, /Position/)
  assert.match(detail, /Pulse access/)
  assert.match(detail, /canViewOperationalAssignments/)
  assert.match(assignments, /Campaign assignments/)
  assert.match(assignments, /Campaign-wide/)
  assert.match(assignments, /Historical/)
  assert.match(assignments, /No campaign assignments yet/)
  assert.match(assignments, /where this person works day to day/)
  assert.match(hook, /getUserOperationalAssignments\(supabase, userId\)/)
  assert.doesNotMatch(`${assignments}\n${hook}`, /createOperational|updateOperational|endOperational|\.from\(/)
})
