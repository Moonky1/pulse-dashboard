import assert from 'node:assert/strict'
import test from 'node:test'

import { leadershipGroup, roleTone, teamTone } from './visualIdentity.js'

test('canonical operational Teams keep stable Campaign-aware colors', () => {
  assert.equal(teamTone({ campaignCode: 'auto_warranty_garrett', code: 'asia_team_a' }), 'teal')
  assert.equal(teamTone({ campaignCode: 'auto_warranty_garrett', code: 'colombia' }), 'gold')
  assert.equal(teamTone({ campaignCode: 'auto_warranty_joe', code: 'nicaragua' }), 'plum')
  assert.notEqual(
    teamTone({ campaignCode: 'auto_warranty_garrett', code: 'nicaragua' }),
    teamTone({ campaignCode: 'auto_warranty_joe', code: 'nicaragua' }),
  )
})

test('unknown Team color is deterministic instead of random', () => {
  const first = teamTone({ campaignCode: 'new_campaign', code: 'new_team' })
  assert.equal(first, teamTone({ campaignCode: 'new_campaign', code: 'new_team' }))
  assert.ok(['azure', 'violet', 'teal', 'gold', 'rose', 'emerald', 'slate'].includes(first))
})

test('role color and leadership grouping come from canonical identity', () => {
  assert.equal(roleTone({ key: 'super_admin' }), 'iridescent')
  assert.equal(roleTone({ name: 'Team Leader' }), 'cyan')
  assert.equal(roleTone({ name: 'QA Analyst' }), 'teal')
  assert.equal(leadershipGroup('Team Lead'), 'leadership')
  assert.equal(leadershipGroup('Supervisor'), 'leadership')
  assert.equal(leadershipGroup('Opener'), 'staff')
})
