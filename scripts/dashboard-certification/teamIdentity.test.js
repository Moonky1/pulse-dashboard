import test from 'node:test'
import assert from 'node:assert/strict'
import { reportTeamStyle } from '../../src/dashboard/teamIdentity.js'
import { teamBadgeStyle } from '../../src/admin/visualIdentity.js'
import { ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'
test('dashboard badges reuse exact Admin campaign palettes without identity writes',()=>{
  for (const [group,code] of Object.entries({OpenersAsia:'asia_team_a',OpenersAsia1:'asia_team_b',OpenersCA:'central_america',OpenersCO:'colombia',OpenersPH:'philippines',OpenersNIC:'nicaragua',OpenersVZ:'venezuela',OpenersMXBJ:'mexico_team_group_a',OpenersMXBJ1:'mexico_team_group_b'})) assert.deepEqual(reportTeamStyle(ALL_TEAMS_SCOPE_ID,group),teamBadgeStyle({campaignCode:'auto_warranty_garrett',code}))
  assert.equal(reportTeamStyle('other-source','OpenersAsia'),undefined)
  assert.equal(reportTeamStyle(ALL_TEAMS_SCOPE_ID,'Unknown'),undefined)
})
