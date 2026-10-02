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
  assert.match(player, /submitGoPracticeAnswer/)
  assert.match(player, /GoQuestionCountdown/)
  assert.doesNotMatch(player, /correct_answer\b|explanation|is_correct|score\s*[=:+]/i)
  assert.match(hosted, /startGoHostedSession/)
  assert.match(hosted, /submitGoHostedAnswer/)
  assert.match(hosted, /advanceGoHostedSession/)
  assert.match(hosted, /getGoHostedResults/)
  assert.match(hosted, /GoQuestionCountdown/)
  assert.doesNotMatch(hosted, /correct_answer\b|is_correct/i)
})

test('Hosted UI selectively preserves existing GO personality without legacy runtime imports', async () => {
  const host = await read('GoHostSelection.jsx')
  const room = await read('GoHostedRoomPage.jsx')
  const visuals = await read('goVisualAssets.js')
  const css = await read('goProduct.css')
  assert.match(host, /GO_ART\.certification/)
  assert.match(room, /GO_ART\.classic/)
  assert.match(visuals, /certification\.webp/)
  assert.match(visuals, /classic\.webp/)
  assert.match(visuals, /easy\.webp/)
  assert.match(visuals, /medium\.webp/)
  assert.match(visuals, /advanced\.webp/)
  assert.match(room, /resultMedal/)
  assert.match(css, /image-rendering:pixelated/)
  assert.doesNotMatch(host + room, /lucide|heroicons|fontawesome|from ['"]\.\.\/go\//i)
})

test('Classic hosting uses real flags and distinct level art without repeated catalog copy', async () => {
  const host = await read('GoHostSelection.jsx')
  const selection = await read('GoSelectionCards.jsx')
  const room = await read('GoHostedRoomPage.jsx')
  const flag = await read('GoFlag.jsx')
  const usFlag = await read('../../public/flags/united-states.svg')
  assert.match(selection, /GO_ART\[item\.level\]/)
  assert.match(selection, /<GoFlag language=\{choice\.code\}/)
  assert.match(room, /<GoFlag language=\{room\.content\.language\}/)
  assert.match(await read('GoPracticeSelection.jsx'), /GoLanguageChoices/)
  assert.match(flag, /\/flags\/mexico\.png/)
  assert.match(flag, /\/flags\/united-states\.svg/)
  assert.match(flag, /import mexicoFlag from/)
  assert.match(flag, /import unitedStatesFlag from/)
  assert.match(room, /import lobbyMusic from/)
  assert.doesNotMatch(room, /src="\/audio\/lobby-music\.mp3"/)
  assert.match(usFlag, /viewBox="0 0 741 390"/)
  assert.doesNotMatch(host, /Three Classic Quiz levels|40 questions from the Pulse GO Classic bank|Easy, Medium and Advanced/)
  assert.match(room, /Waiting for players/)
})

test('GO landing stays compact, action-led, and reuses legacy visual personality', async () => {
  const landing = await read('GoLandingPage.jsx')
  const practice = await read('GoPracticeSelection.jsx')
  const player = await read('GoPracticePlayer.jsx')
  const visuals = await read('goVisualAssets.js')
  assert.match(landing, /Start practice/)
  assert.match(landing, /Host a game/)
  assert.match(landing, /Join a game/)
  assert.match(landing, /Enter your code/)
  assert.match(landing, /GO_ART\.classic/)
  assert.match(landing, /GO_ART\.medal1/)
  assert.match(visuals, /classic\.webp/)
  assert.match(visuals, /medal1\.webp/)
  assert.match(practice, /GoLanguageChoices/)
  assert.match(practice, /GoPulseModeChoices/)
  assert.match(practice, /From our creators/)
  assert.match(practice, /classicPracticeLevels/)
  assert.match(player, /resultMedal/)
  assert.doesNotMatch(`${landing}\n${practice}\n${player}`, /Train\. Practice\. Play\.|checkpoint/i)
})

test('GO lists all six source modes, enabled only by classified published content', async () => {
  const modes = await read('goPulseModes.js')
  const cards = await read('GoSelectionCards.jsx')
  for (const title of ['Classic Quiz', 'Valid or Invalid XFER', 'Dispose It', 'Eligible or Not Eligible', 'Objection Battle', 'Certification Mode']) {
    assert.ok(modes.includes(title), `${title} should be represented`)
  }
  assert.match(cards, /modeItems\[mode\.key\]/)
  assert.match(cards, /ready && \(!host \|\| mode\.hosted\)/)
  assert.doesNotMatch(cards, /40 in the bank|banco de 40/)
})

test('GO catalogs omit redundant copy and empty creator sections', async () => {
  const practice = await read('GoPracticeSelection.jsx')
  const host = await read('GoHostSelection.jsx')
  for (const source of [practice, host]) {
    assert.doesNotMatch(source, /Original games, organized by mode|Los juegos originales, organizados por modo/)
    assert.doesNotMatch(source, /Published team games will appear here|Los juegos publicados por el equipo aparecerán aquí/)
    assert.match(source, /!!otherGames\.length && <GoCatalogSection/)
  }
})

test('VISUAL-2 keeps GO playful, responsive, and dependency-free', async () => {
  const [landing, practice, player, hosted, workspace, visuals, css] = await Promise.all([
    read('GoLandingPage.jsx'),
    read('GoPracticeSelection.jsx'),
    read('GoPracticePlayer.jsx'),
    read('GoHostedRoomPage.jsx'),
    read('../auth/screens/WorkspacePage.jsx'),
    read('goVisualAssets.js'),
    read('goProduct.css'),
  ])
  const source = [landing, practice, player, hosted, workspace].join('\n')
  for (const asset of ['classic.webp', 'goal.webp', 'certification.webp', 'points.webp', 'medal1.webp', 'valid.webp']) {
    assert.match(visuals, new RegExp(asset.replace('.', '\\.')))
  }
  assert.match(css, /@media\(max-width:620px\)/)
  assert.match(css, /prefers-reduced-motion:reduce/)
  assert.match(css, /\.go-mode-grid/)
  assert.doesNotMatch(source, /lucide|heroicons|fontawesome|canvas|webgl/i)
})
