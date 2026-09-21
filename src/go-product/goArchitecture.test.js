import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const read = name => readFile(new URL(name, import.meta.url), 'utf8')

test('GO routes are authenticated Staff routes and Workspace exposes capability-driven entry', async () => {
  const routes = await read('../auth/AuthApp.jsx')
  const workspace = await read('../auth/screens/WorkspacePage.jsx')
  assert.match(routes, /path="\/go"[\s\S]*AUTH_STATES\.ACTIVE/)
  assert.match(routes, /path="\/go\/practice\/:contentId"/)
  assert.match(routes, /path="\/go\/host"/)
  assert.match(routes, /path="\/go\/host\/:sessionId"/)
  assert.match(routes, /path="\/go\/room\/:sessionId"/)
  assert.match(workspace, /canPractice\(goAccess\.capabilities\).*canHost\(goAccess\.capabilities\)/)
})

test('product GO never imports legacy GO, stores identity locally, or performs direct table access', async () => {
  const sources = await Promise.all(['GoLandingPage.jsx', 'GoPracticeSelection.jsx', 'GoPracticePlayer.jsx', 'GoHostSelection.jsx', 'GoHostedRoomPage.jsx', 'useHostedRoom.js', 'GoShell.jsx', 'useGoAccess.js'].map(read))
  const source = sources.join('\n')
  assert.doesNotMatch(source, /src\/go|\.from\(|localStorage|pulse_user|Apps Script|Google Sheets|service_role/i)
  assert.doesNotMatch(source, /super_admin|team_leader|supervisor|\bqa\b/i)
})

test('Practice remains server scored while Hosted UI uses protected lifecycle contracts', async () => {
  const landing = await read('GoLandingPage.jsx')
  const player = await read('GoPracticePlayer.jsx')
  const hosted = await read('GoHostedRoomPage.jsx')
  assert.match(landing, /joinGoHostedSession/)
  assert.match(landing, /\/go\/host/)
  assert.match(player, /completeTrainingAttempt/)
  assert.doesNotMatch(player, /correct_answer\b|explanation|is_correct|score\s*[=:+]/i)
  assert.match(hosted, /startGoHostedSession/)
  assert.match(hosted, /submitGoHostedAnswer/)
  assert.match(hosted, /advanceGoHostedSession/)
  assert.doesNotMatch(hosted, /correct_answer\b|is_correct|leaderboard/i)
})

test('Hosted UI selectively preserves existing GO personality without legacy runtime imports', async () => {
  const host = await read('GoHostSelection.jsx')
  const room = await read('GoHostedRoomPage.jsx')
  const css = await read('goProduct.css')
  assert.match(host, /\/emojis\/certification\.webp/)
  assert.match(room, /\/emojis\/classic\.webp/)
  assert.match(room, /resultMedal/)
  assert.match(css, /image-rendering:pixelated/)
  assert.doesNotMatch(host + room, /lucide|heroicons|fontawesome|from ['"]\.\.\/go\//i)
})

test('GO landing stays compact, action-led, and reuses legacy visual personality', async () => {
  const landing = await read('GoLandingPage.jsx')
  const practice = await read('GoPracticeSelection.jsx')
  const player = await read('GoPracticePlayer.jsx')
  assert.match(landing, /Start practice/)
  assert.match(landing, /Host a game/)
  assert.match(landing, /Join a game/)
  assert.match(landing, /Enter your code/)
  assert.match(landing, /\/emojis\/classic\.webp/)
  assert.match(landing, /\/emojis\/medal1\.webp/)
  assert.match(practice, /PRACTICE_ART/)
  assert.match(practice, /languagePresentation/)
  assert.match(player, /resultMedal/)
  assert.doesNotMatch(`${landing}\n${practice}\n${player}`, /Train\. Practice\. Play\.|checkpoint/i)
})

test('VISUAL-2 keeps GO playful, responsive, and dependency-free', async () => {
  const [landing, practice, player, hosted, workspace, css] = await Promise.all([
    read('GoLandingPage.jsx'),
    read('GoPracticeSelection.jsx'),
    read('GoPracticePlayer.jsx'),
    read('GoHostedRoomPage.jsx'),
    read('../auth/screens/WorkspacePage.jsx'),
    read('goProduct.css'),
  ])
  const source = [landing, practice, player, hosted, workspace].join('\n')
  for (const asset of ['classic.webp', 'goal.webp', 'certification.webp', 'points.webp', 'medal1.webp', 'valid.webp']) {
    assert.match(source, new RegExp(asset.replace('.', '\\.')))
  }
  assert.match(css, /@media\(max-width:620px\)/)
  assert.match(css, /prefers-reduced-motion:reduce/)
  assert.match(css, /\.go-mode-grid/)
  assert.doesNotMatch(source, /lucide|heroicons|fontawesome|canvas|webgl/i)
})
