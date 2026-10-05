import assert from 'node:assert/strict'
import test from 'node:test'

import { provisionAgent, reissueAgentActivation } from './agentAdminApi.js'

const TEAM = '34000000-0000-4000-8000-000000000011'

test('Agent provisioning validates details before any server call', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: null, error: null } } }
  for (const values of [
    { code: 'abcd', name: 'María López', teamId: TEAM },
    { code: '3248', name: 'María López', teamId: 'wrong' },
    { code: '3248', teamId: TEAM },
    ...['', '   ', 'M', 'M'.repeat(81), 2304].map(name => ({ code: '3248', name, teamId: TEAM })),
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
  const result = await provisionAgent(client, { code: ' 3248 ', name: ' María López ', teamId: TEAM })
  assert.deepEqual(result.data, activation)
  assert.deepEqual(calls, [['admin_prepare_agent_activation', {
    requested_agent_code: '3248', requested_display_name: 'María López',
    requested_team_id: TEAM, requested_full_name: 'María López', requested_operating_unit_id: null,
  }]])
  assert.equal(JSON.stringify(calls).includes('pin'), false)
})

test('names are presentation only: the ID identifies Agents even when names repeat', async () => {
  const calls = []
  const client = { rpc: async (operation, args) => { calls.push([operation, args]); return { data: { agent_code: args.requested_agent_code }, error: null } } }
  for (const code of ['2304', '2305']) {
    assert.equal((await provisionAgent(client, { code, name: 'María López', teamId: TEAM })).data.agent_code, code)
  }
  assert.deepEqual(calls.map(([, args]) => [args.requested_agent_code, args.requested_display_name]), [
    ['2304', 'María López'], ['2305', 'María López'],
  ])
})

test('Staff can request a fresh one-time code without setting a PIN', async () => {
  const calls = []
  const client = { rpc: async (...args) => { calls.push(args); return { data: { activation_code: 'fedcba9876543210' }, error: null } } }
  assert.equal((await reissueAgentActivation(client, ' 3248 ')).data.activation_code, 'fedcba9876543210')
  assert.deepEqual(calls, [['admin_reissue_agent_activation', { requested_agent_code: '3248' }]])
})

test('Agent provisioning returns safe duplicate and permission errors', async () => {
  const values = { code: '3248', name: 'María López', teamId: TEAM }
  const duplicate = await provisionAgent({ rpc: async () => ({ error: { code: '23505' } }) }, values)
  assert.equal(duplicate.error.code, 'duplicate')
  const denied = await provisionAgent({ rpc: async () => ({ error: { code: '42501' } }) }, values)
  assert.equal(denied.error.code, 'access_denied')
})
