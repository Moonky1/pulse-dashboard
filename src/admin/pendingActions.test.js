import assert from 'node:assert/strict'
import test from 'node:test'

import { pendingApprovalCatalogState, pendingApprovalChoices, pendingApprovalOptionKey, pendingApprovalSuccessMessage, pendingBlockSuccessMessage, pendingReviewState, resolvePendingApprovalSelection } from './pendingActions.js'

const option = {
  departmentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  teamId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  roleId: '10000000-0000-0000-0000-000000000002',
  scopeType: 'team',
}

test('pending review actions require both lifecycle and canonical permissions', () => {
  assert.deepEqual(pendingReviewState({ status: 'pending_approval' }, { canBlock: true, canApprove: true }), {
    pending: true,
    canBlock: true,
    canApprove: true,
    approvalAvailable: false,
  })
  assert.equal(pendingReviewState({ status: 'pending_approval' }, { canApprove: true, approvalOptionCount: 1 }).approvalAvailable, true)
  assert.equal(pendingReviewState({ status: 'active' }, { canBlock: true, canApprove: true }).canBlock, false)
  assert.equal(pendingReviewState({ status: 'pending_approval' }).canApprove, false)
})

test('approval resolves only an exact server-provided organization and role combination', () => {
  const optionKey = pendingApprovalOptionKey(option)
  assert.equal(resolvePendingApprovalSelection([option], { departmentId: option.departmentId, teamId: option.teamId, optionKey }), option)
  assert.equal(resolvePendingApprovalSelection([option], { departmentId: option.departmentId, teamId: 'ffffffff-ffff-4fff-8fff-ffffffffffff', optionKey }), null)
  assert.equal(resolvePendingApprovalSelection([option], { departmentId: option.departmentId, teamId: option.teamId, optionKey: `${optionKey}:arbitrary` }), null)
})

test('approval choices cascade department to team and exact role scope', () => {
  const departmentOnly = { ...option, teamId: null, roleId: '10000000-0000-0000-0000-000000000001', scopeType: 'global' }
  const otherDepartment = { ...option, departmentId: 'ffffffff-ffff-4fff-8fff-ffffffffffff', teamId: null }
  const choices = pendingApprovalChoices([option, departmentOnly, otherDepartment], option.departmentId, option.teamId)
  assert.equal(choices.departments.length, 2)
  assert.deepEqual(choices.teams.map((choice) => choice.teamId), [option.teamId])
  assert.deepEqual(choices.roleOptions, [option])
  assert.deepEqual(pendingApprovalChoices([option, departmentOnly], option.departmentId, '').roleOptions, [departmentOnly])
})

test('approval catalog exposes explicit loading, failure, empty, and ready states', () => {
  assert.equal(pendingApprovalCatalogState({ loading: true }), 'loading')
  assert.equal(pendingApprovalCatalogState({ error: { code: 'unavailable' } }), 'error')
  assert.equal(pendingApprovalCatalogState({ options: [] }), 'empty')
  assert.equal(pendingApprovalCatalogState({ options: [option] }), 'ready')
})

test('pending block success is described only after canonical refetch', () => {
  assert.match(pendingBlockSuccessMessage(), /server-confirmed record has been refreshed/i)
  assert.match(pendingApprovalSuccessMessage(), /server-confirmed record has been refreshed/i)
})
