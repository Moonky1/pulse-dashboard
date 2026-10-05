import assert from 'node:assert/strict'
import test from 'node:test'

import { getGoHostedSession, getGoPracticeContent, getGoQuestionBankGroups, listGoPracticeCatalog } from '../training/trainingApi.js'
import { agentGoOperation } from './agentGoOperations.js'

const ID = '11111111-1111-4111-8111-111111111111'

test('current shared Practice and Hosted readers reach their cookie-bound Agent actions', async () => {
  const calls = []
  const client = {
    supabaseUrl: 'http://127.0.0.1:54321',
    async rpc(name, args) {
      const operation = agentGoOperation(name, args)
      assert.ok(operation, `${name} must be supported for Agent players`)
      calls.push(operation)
      return { data: [], error: null }
    },
  }
  await getGoPracticeContent(client, ID)
  await getGoHostedSession(client, ID)
  await getGoQuestionBankGroups(client, [ID])
  await listGoPracticeCatalog(client, { language: 'en' })
  assert.deepEqual(calls, [
    ['content', { contentId: ID }],
    ['roomSnapshot', { sessionId: ID }],
    ['metadata', { contentIds: [ID] }],
    ['catalog', { language: 'en', limit: 100, offset: 0 }],
  ])
})

test('Agent operation allowlist excludes authoring, hosting, Staff access and prototype keys', () => {
  for (const name of ['create_training_content_draft', 'create_go_hosted_session', 'start_go_hosted_session', 'admin_provision_agent', 'get_staff_agent_profile', 'toString', '__proto__']) {
    assert.equal(agentGoOperation(name, {}), null)
  }
  assert.equal(agentGoOperation('start_training_attempt', { requested_content_id: ID, requested_source_mode: 'academy' }), null)
})
