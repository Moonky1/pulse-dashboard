import assert from 'node:assert/strict'
import test from 'node:test'
import { admin2Error, inspectStaffRemoval, removeStaffIdentity, removeStaffInvitation, listAdminAgents } from './admin2Api.js'
const id = '11111111-1111-4111-8111-111111111111'
const key = '22222222-2222-4222-8222-222222222222'
test('removal inspection comes from the server and malformed identity cannot invoke it', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push([name, args]); return { data: { version: '2026-10-05T00:00:00Z', kind: 'historical' } } } }
  assert.ok((await inspectStaffRemoval(client, 'bad')).error)
  assert.equal((await inspectStaffRemoval(client, id)).data.kind, 'historical')
  assert.deepEqual(calls, [['inspect_staff_removal', { target_user_id: id }]])
})
test('removal requires explicit confirmation, optimistic version and one request key at the Edge', async () => {
  const calls = []
  const client = { functions: { invoke: async (name, args) => { calls.push([name, args.body]); return { data: { removed: true, cleanupPending: true } } } } }
  const plan = { version: '2026-10-05T00:00:00Z' }
  assert.ok((await removeStaffIdentity(client, id, plan, '', key)).error)
  assert.equal((await removeStaffIdentity(client, id, plan, 'REMOVE', key)).data.cleanupPending, true)
  assert.deepEqual(calls, [['pulse-staff-removal', { userId: id, version: plan.version, confirmation: 'REMOVE', requestKey: key }]])
})
test('invitation removal preserves its exact server version and confirmation', async () => {
  const client = { rpc: async (name, args) => { assert.equal(name, 'remove_staff_invitation'); assert.equal(args.expected_updated_at, 'version'); assert.equal(args.requested_confirmation, 'REMOVE'); return { data: { removed: true } } } }
  assert.ok((await removeStaffInvitation(client, { id, updatedAt: 'version' }, 'REMOVE')).data.removed)
})
test('Agent reads are capped, validated and send only directory filters', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push([name, args]); return { data: { agents: [] } } } }
  assert.ok((await listAdminAgents(client, { status: 'admin' })).error)
  assert.ok((await listAdminAgents(client, { query: 'a'.repeat(161) })).error)
  await listAdminAgents(client, { query: '  María  ', teamId: id, status: 'pending_activation', cursor: '990001' })
  assert.deepEqual(calls, [['list_admin_agents', { requested_query: 'María', requested_team_id: id, requested_status: 'pending_activation', after_agent_code: '990001', requested_limit: 50 }]])
})
test('backend errors never expose technical details or private identifiers', () => {
  for (const code of ['42501', '55000', 'P0002', 'XX000']) assert.doesNotMatch(admin2Error({ code, message: 'sensitive backend secret' }).message, /sensitive|secret/)
})

test('network failures and Edge errors are retryable without leaving Remove busy', async () => {
  const offline = { rpc: async () => { throw new Error('offline') }, functions: { invoke: async () => { throw new Error('offline') } } }
  assert.equal((await inspectStaffRemoval(offline, id)).error.code, 'unavailable')
  assert.equal((await removeStaffIdentity(offline, id, { version: 'version' }, 'REMOVE', key)).error.code, 'unavailable')
  const conflict = { functions: { invoke: async () => ({ error: { context: new Response(JSON.stringify({ code: '55000', message: 'private data' })) } }) } }
  const result = await removeStaffIdentity(conflict, id, { version: 'version' }, 'REMOVE', key)
  assert.equal(result.error.code, 'protected')
  assert.doesNotMatch(result.error.message, /private data/)
})
