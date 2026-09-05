import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { getStudioFilterOptions, listStudioCatalog, normalizeStudioError } from './studioApi.js'
import { canCreateStudioContent, resolveStudioAccess } from './studioAccess.js'

const TOPIC_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function recorder(data = []) {
  const calls = []
  return { calls, client: { rpc: async (name, args) => { calls.push({ name, args }); return { data, error: null } } } }
}

test('Studio catalog calls only its protected read RPCs with bounded canonical arguments', async () => {
  const { client, calls } = recorder([])
  await listStudioCatalog(client, { language: 'es', topicId: TOPIC_ID, search: ' policy ', limit: 24, offset: 24 })
  await getStudioFilterOptions(client)
  assert.deepEqual(calls, [
    { name: 'list_studio_content', args: { requested_status: null, requested_language: 'es', requested_topic_id: TOPIC_ID, requested_search: 'policy', requested_limit: 24, requested_offset: 24 } },
    { name: 'get_training_filter_options', args: { requested_context: 'studio' } },
  ])
})

test('invalid Studio inputs fail locally without reaching the backend', async () => {
  const { client, calls } = recorder()
  const result = await listStudioCatalog(client, { topicId: 'not-a-uuid', limit: 200 })
  assert.equal(result.error.code, 'invalid_request')
  assert.deepEqual(calls, [])
})

test('Studio access is permission-key based and create capability stays independent', () => {
  assert.equal(resolveStudioAccess({ loading: true, permissionKeys: ['studio.view'] }), 'loading')
  assert.equal(resolveStudioAccess({ permissionKeys: [] }), 'denied')
  assert.equal(resolveStudioAccess({ permissionKeys: ['studio.view'] }), 'allowed')
  assert.equal(canCreateStudioContent(['studio.view']), false)
  assert.equal(canCreateStudioContent(['studio.create']), true)
})

test('Studio sanitizes protected errors and contains no direct training-table access or mutation RPC', async () => {
  assert.equal(normalizeStudioError({ code: '42501', message: 'private table' }).code, 'access_denied')
  assert.doesNotMatch(normalizeStudioError({ code: 'XX000', message: 'SQL stack' }).message, /SQL|stack/i)
  const source = await readFile(new URL('./studioApi.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\.from\(|service_role|localStorage|create_training_content_draft|update_training_content_draft|publish_training_content|archive_training_content/i)
})
