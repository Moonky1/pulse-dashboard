import assert from 'node:assert/strict'
import test from 'node:test'

import { getStaffAgentProfile, validAgentCode } from './agentProfileService.js'

test('Agent profile URLs require an exact numeric Agent ID', () => {
  assert.equal(validAgentCode('990001'), true)
  for (const code of ['302', '1234567890123', ' 990001', '990001x', '../admin']) assert.equal(validAgentCode(code), false)
})

test('Staff profile read uses only the protected profile RPC', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push([name, args]); return { data: { agent_code: '990001' }, error: null } } }
  assert.equal((await getStaffAgentProfile(client, '990001')).data.agent_code, '990001')
  assert.deepEqual(calls, [['get_staff_agent_profile', { requested_agent_code: '990001' }]])
  assert.equal((await getStaffAgentProfile(client, 'bad')).error.code, 'invalid_request')
  assert.equal(calls.length, 1)
})
