import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { goPlayerName, goTeamIdentity } from './goPlayerIdentity.js'

const read = name => readFile(new URL(name, import.meta.url), 'utf8')

test('names stay real and IDs are not inferred from names or replaced in stored identities', () => {
  assert.equal(goPlayerName({ display_name: ' María López ', agent_code: '2304' }), 'María López')
  assert.equal(goPlayerName({ display_name: 'Agent 990001', agent_code: '990001' }), 'Player')
  assert.equal(goPlayerName({ display_name: 'Agent 990001', full_name: 'María López', agent_code: '990001' }), 'María López')
  assert.equal(goPlayerName({ display_name: 'María 3242' }), 'María 3242')
  assert.equal(goPlayerName({}), 'Player')
})

test('team flags and glowing tones reuse canonical membership and Staff colors', () => {
  const asia = { team_name: 'Asia Team A', team_code: 'asia_team_a', campaign_code: 'auto_warranty_garrett' }
  assert.deepEqual(goTeamIdentity(asia), { code: 'asia_team_a', label: 'Asia A · Garrett', flag: 'asia', campaignCode: 'auto_warranty_garrett', tone: 'teal' })
  assert.equal(goTeamIdentity(asia, false).label, 'Asia A')
  assert.equal(goTeamIdentity({ ...asia, team_code: 'asia_team_b' }).tone, 'cyan')
  assert.equal(goTeamIdentity({ ...asia, team_name: 'Central America', team_code: 'central_america' }).flag, 'central')
  for (const code of ['', 'unknown', '__proto__', 'constructor']) assert.equal(goTeamIdentity({ team_code: code }).flag, 'team')
})

test('ranking uses IDs and a flag for every row without weekly reset copy or admin links', async () => {
  const [ranking, badge, css] = await Promise.all([read('GoGlobalRanking.jsx'), read('GoTeamBadge.jsx'), read('goProduct.css')])
  assert.match(ranking, /goPlayerName\(player\).*player.agent_code/)
  assert.match(ranking, /<GoTeamBadge player=\{player\} includeCampaign=\{false\}/)
  assert.doesNotMatch(ranking, /Weekly results reset/)
  assert.match(badge, /<TeamBadge linked=\{false\}/)
  assert.match(badge, /Team: \{identity.label\}/)
  assert.match(css, /article > \.go-question-number \{ position: static;/)
})

test('only ordinary Practice gets outcome-specific ending cues; hidden-answer modes stay neutral', async () => {
  const player = await read('GoPracticePlayer.jsx')
  const hosted = await read('GoHostedRoomPage.jsx')
  assert.match(player, /session.mode !== 'certification' && \['correct', 'incorrect'\]/)
  assert.match(player, /session.mode === 'certification' \? 'complete' : practiceCompletionSound\(completedResult\?\.score_percent\)/)
  assert.match(hosted, /playGoSound\('complete'\)/)
  assert.doesNotMatch(hosted, /practiceCompletionSound|playGoSound\('(?:correct|incorrect|practice-)/)
})
