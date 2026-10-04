import assert from 'node:assert/strict'
import test from 'node:test'

import { provisionAgent } from './agentAdminApi.js'

const TEAM = '34000000-0000-4000-8000-000000000011'

test('Agent provisioning validates details before any server call', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: null, error: null } } }
  for (const values of [
    { code: '3248', displayName: 'QA Agent', teamId: TEAM, pin: '123' },
    { code: 'abcd', displayName: 'QA Agent', teamId: TEAM, pin: '123456' },
    { code: '3248', displayName: 'Q', teamId: TEAM, pin: '123456' },
    { code: '3248', displayName: 'QA Agent', teamId: 'wrong', pin: '123456' },
  ]) {
    assert.equal((await provisionAgent(client, values)).error.code, 'invalid_request')
  }
  assert.equal(calls, 0)
})

test('Agent provisioning calls the Staff-only audited RPC, never a table insert', async () => {
  const calls = []
  const client = { rpc: async (...args) => { calls.push(args); return { data: 'new-agent-id', error: null } } }
  const result = await provisionAgent(client, { code: ' 3248 ', displayName: ' QA Agent 3248 ', teamId: TEAM, pin: '731482' })
  assert.equal(result.data, 'new-agent-id')
  assert.deepEqual(calls, [['admin_provision_agent', {
    requested_agent_code: '3248', requested_display_name: 'QA Agent 3248',
    requested_team_id: TEAM, requested_pin: '731482',
    requested_full_name: null, requested_operating_unit_id: null,
  }]])
})

test('Agent provisioning returns safe duplicate and permission errors', async () => {
  const values = { code: '3248', displayName: 'QA Agent 3248', teamId: TEAM, pin: '731482' }
  const duplicate = await provisionAgent({ rpc: async () => ({ error: { code: '23505' } }) }, values)
  assert.equal(duplicate.error.code, 'duplicate')
  const denied = await provisionAgent({ rpc: async () => ({ error: { code: '42501' } }) }, values)
  assert.equal(denied.error.code, 'access_denied')
})
