import test from 'node:test'
import assert from 'node:assert/strict'
import { executeOperatorCommand, confirmationPhrase, SUPER_ADMIN_ROLE_ID } from './operator.js'

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ROLE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const ASSIGNMENT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

function mockClient() {
  const calls = []
  return {
    calls,
    async rpc(name, args) {
      calls.push({ name, args })
      if (name === 'get_managed_user') return { data: [{ id: USER, status: 'active', roles: [] }], error: null }
      return { data: [{ ok: true }], error: null }
    },
  }
}

test('sensitive lifecycle command inspects, confirms, then calls canonical RPC', async () => {
  const client = mockClient()
  const result = await executeOperatorCommand({ client, args: ['users', 'block', USER, 'reviewed reason'], confirm: async () => true })
  assert.deepEqual(client.calls.map((call) => call.name), ['get_managed_user', 'block_user'])
  assert.deepEqual(client.calls[1].args, { target_user_id: USER, reason: 'reviewed reason' })
  assert.equal(result[0].ok, true)
})

test('cancelled confirmation performs no mutation RPC', async () => {
  const client = mockClient()
  await assert.rejects(() => executeOperatorCommand({ client, args: ['users', 'inactivate', USER], confirm: async () => false }), /cancelled/)
  assert.deepEqual(client.calls.map((call) => call.name), ['get_managed_user'])
})

test('Super Admin grant requires stronger phrase', () => {
  assert.equal(confirmationPhrase('role-assign', USER, { roleId: SUPER_ADMIN_ROLE_ID }), `GRANT SUPER ADMIN ${USER}`)
})

test('role removal targets one exact assignment', async () => {
  const client = mockClient()
  await executeOperatorCommand({ client, args: ['roles', 'remove', USER, ASSIGNMENT], confirm: async () => true })
  assert.deepEqual(client.calls[1], { name: 'remove_user_role', args: { target_user_id: USER, target_user_role_id: ASSIGNMENT } })
})

test('role assignment carries only explicit scope values', async () => {
  const client = mockClient()
  await executeOperatorCommand({ client, args: ['roles', 'assign', USER, ROLE, 'global', 'none', 'none'], confirm: async () => true })
  assert.equal(client.calls[1].name, 'assign_user_role')
  assert.equal(client.calls[1].args.requested_department_id, null)
  assert.equal(client.calls[1].args.requested_team_id, null)
})
