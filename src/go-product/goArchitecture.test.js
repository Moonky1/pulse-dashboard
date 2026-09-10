import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const read = name => readFile(new URL(name, import.meta.url), 'utf8')

test('GO routes are authenticated Staff routes and Workspace exposes capability-driven entry', async () => {
  const routes = await read('../auth/AuthApp.jsx')
  const workspace = await read('../auth/screens/WorkspacePage.jsx')
  assert.match(routes, /path="\/go"[\s\S]*AUTH_STATES\.ACTIVE/)
  assert.match(routes, /path="\/go\/practice\/:contentId"/)
  assert.match(workspace, /canPractice\(goAccess\.capabilities\).*canHost\(goAccess\.capabilities\)/)
})

test('product GO never imports legacy GO, stores identity locally, or performs direct database access', async () => {
  const sources = await Promise.all(['GoLandingPage.jsx', 'GoPracticeSelection.jsx', 'GoPracticePlayer.jsx', 'GoShell.jsx', 'useGoAccess.js'].map(read))
  const source = sources.join('\n')
  assert.doesNotMatch(source, /src\/go|\.from\(|localStorage|pulse_user|Apps Script|Google Sheets|service_role/i)
  assert.doesNotMatch(source, /super_admin|team_leader|supervisor|\bqa\b/i)
})

test('Practice UI has honest Stage 1 boundaries and no client scoring', async () => {
  const landing = await read('GoLandingPage.jsx')
  const player = await read('GoPracticePlayer.jsx')
  assert.match(landing, /Live rooms are not open yet/)
  assert.match(landing, /No room was created/)
  assert.match(player, /completeTrainingAttempt/)
  assert.doesNotMatch(player, /correct_answer\b|explanation|is_correct|score\s*[=:+]/i)
})
