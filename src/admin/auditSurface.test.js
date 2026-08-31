import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const areaUrl = new URL('./AdminArea.jsx', import.meta.url)
const detailUrl = new URL('./pages/AdminUserDetailPage.jsx', import.meta.url)
const pageUrl = new URL('./pages/AdminAuditPage.jsx', import.meta.url)
const timelineUrl = new URL('./components/AuditTimeline.jsx', import.meta.url)
const hookUrl = new URL('./hooks/useAuditEvents.js', import.meta.url)

test('Audit is lazy-routed and user history renders only behind its permission gate', async () => {
  const [area, detail] = await Promise.all([readFile(areaUrl, 'utf8'), readFile(detailUrl, 'utf8')])
  assert.match(area, /lazy\(.*AdminAuditPage/)
  assert.match(area, /path="audit"/)
  assert.match(detail, /canViewUserHistory\(permissionKeys\).*UserAuditHistory/)
})

test('Audit UI contains read controls only and no mutation or direct-table client calls', async () => {
  const [page, timeline, hook] = await Promise.all([readFile(pageUrl, 'utf8'), readFile(timelineUrl, 'utf8'), readFile(hookUrl, 'utf8')])
  assert.match(page, /Refresh/)
  assert.match(page, /AuditTimeline/)
  assert.doesNotMatch(page, /\.from\(|insert\(|update\(|delete\(|approve_|block_|assign_|remove_/)
  assert.match(timeline, /Loading audit history/)
  assert.match(timeline, /No audit events/)
  assert.match(timeline, /Audit history unavailable/)
  assert.match(timeline, /Load older events/)
  assert.match(timeline, /Audit note:/)
  assert.match(hook, /getUserAuditHistory/)
  assert.match(hook, /listAuditEvents/)
  assert.doesNotMatch(hook, /\.from\(['"]audit_events['"]\)|insert\(|delete\(/)
})
