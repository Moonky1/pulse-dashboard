import assert from 'node:assert/strict'
import test from 'node:test'

import { invitationOptionKey, invitationRoleOptions, invitationScopeLabel, staffInvitationProposal } from './invitationActions.js'

const DEPARTMENT = '11111111-1111-4111-8111-111111111111'
const TEAM = '22222222-2222-4222-8222-222222222222'
const CAMPAIGN = '33333333-3333-4333-8333-333333333333'
const ROLE = '44444444-4444-4444-8444-444444444444'
const POSITION = '55555555-5555-4555-8555-555555555555'
const options = {
  departments: [{ id: DEPARTMENT, name: 'Quality Assurance' }],
  teams: [{ id: TEAM, departmentId: DEPARTMENT, name: 'Garrett QA' }],
  positions: [{ id: POSITION, name: 'QA Analyst' }],
  roleOptions: [
    { roleId: ROLE, roleName: 'QA', scopeType: 'global', departmentId: null, campaignId: null, teamId: null },
    { roleId: ROLE, roleName: 'QA', scopeType: 'department', departmentId: DEPARTMENT, campaignId: null, teamId: null },
    { roleId: ROLE, roleName: 'QA', scopeType: 'campaign', departmentId: null, campaignId: CAMPAIGN, campaignName: 'Garrett', teamId: null },
    { roleId: ROLE, roleName: 'QA', scopeType: 'team', departmentId: null, campaignId: null, teamId: TEAM },
  ],
}

test('invitation role choices are exact server options filtered by employment placement', () => {
  assert.equal(invitationRoleOptions(options.roleOptions, DEPARTMENT, '').length, 3)
  assert.equal(invitationRoleOptions(options.roleOptions, DEPARTMENT, TEAM).length, 4)
  assert.equal(invitationScopeLabel(options.roleOptions[2], options), 'Garrett')
})

test('proposal keeps employment, position, and authorization separate without arbitrary IDs', () => {
  const campaign = options.roleOptions[2]
  const proposal = staffInvitationProposal({ email: '  QA@Example.com ', fullName: '  Casey Rivera ', departmentId: DEPARTMENT, teamId: '', positionId: POSITION, optionKey: invitationOptionKey(campaign) }, options)
  assert.deepEqual(proposal, {
    email: 'qa@example.com', fullName: 'Casey Rivera', departmentId: DEPARTMENT, teamId: null, positionId: POSITION,
    roleId: ROLE, scopeType: 'campaign', scopeDepartmentId: null, scopeCampaignId: CAMPAIGN, scopeTeamId: null,
  })
})

test('foreign placement and fabricated option keys fail closed', () => {
  assert.equal(staffInvitationProposal({ email: 'qa@example.com', fullName: 'Casey', departmentId: DEPARTMENT, teamId: CAMPAIGN, positionId: '', optionKey: invitationOptionKey(options.roleOptions[0]) }, options), null)
  assert.equal(staffInvitationProposal({ email: 'qa@example.com', fullName: 'Casey', departmentId: DEPARTMENT, teamId: '', positionId: '', optionKey: 'fabricated' }, options), null)
})
