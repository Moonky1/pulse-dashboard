import assert from 'node:assert/strict'
import test from 'node:test'

import { provisionAgent, reissueAgentActivation } from './agentAdminApi.js'

const TEAM = '34000000-0000-4000-8000-000000000011'

test('Agent provisioning validates details before any server call', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: null, error: null } } }
  for (const values of [
    { code: 'abcd', displayName: 'QA Agent', teamId: TEAM },
    { code: '3248', displayName: 'Q', teamId: TEAM },
    { code: '3248', displayName: 'QA Agent', teamId: 'wrong' },
  ]) {
    assert.equal((await provisionAgent(client, values)).error.code, 'invalid_request')
  }
  assert.equal((await reissueAgentActivation(client, 'invalid')).error.code, 'invalid_request')
  assert.equal(calls, 0)
})

test('Staff provisions an approved Agent without choosing their PIN', async () => {
  const calls = []
  const activation = { agent_id: 'new-agent-id', agent_code: '3248', activation_code: '0123456789abcdef' }
  const client = { rpc: async (...args) => { calls.push(args); return { data: activation, error: null } } }
  const result = await provisionAgent(client, { code: ' 3248 ', displayName: ' QA Agent 3248 ', teamId: TEAM })
  assert.deepEqual(result.data, activation)
  assert.deepEqual(calls, [['admin_prepare_agent_activation', {
    requested_agent_code: '3248', requested_display_name: 'QA Agent 3248',
    requested_team_id: TEAM, requested_full_name: null, requested_operating_unit_id: null,
  }]])
  assert.equal(JSON.stringify(calls).includes('pin'), false)
})

test('Staff can request a fresh one-time code without setting a PIN', async () => {
  const calls = []
  const client = { rpc: async (...args) => { calls.push(args); return { data: { activation_code: 'fedcba9876543210' }, error: null } } }
  assert.equal((await reissueAgentActivation(client, ' 3248 ')).data.activation_code, 'fedcba9876543210')
  assert.deepEqual(calls, [['admin_reissue_agent_activation', { requested_agent_code: '3248' }]])
})

test('Agent provisioning returns safe duplicate and permission errors', async () => {
  const values = { code: '3248', displayName: 'QA Agent 3248', teamId: TEAM }
  const duplicate = await provisionAgent({ rpc: async () => ({ error: { code: '23505' } }) }, values)
  assert.equal(duplicate.error.code, 'duplicate')
  const denied = await provisionAgent({ rpc: async () => ({ error: { code: '42501' } }) }, values)
  assert.equal(denied.error.code, 'access_denied')
})
