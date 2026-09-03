import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  archiveTrainingContent,
  completeTrainingAttempt,
  createTrainingContentDraft,
  getGoPracticeContent,
  getTrainingContentAuthoringDetails,
  getTrainingFilterOptions,
  listAcademyModules,
  listMyTrainingResults,
  listTrainingCatalog,
  normalizeTrainingError,
  publishTrainingContent,
  replaceTrainingQuestions,
  startTrainingAttempt,
  updateTrainingContentDraft,
} from './trainingApi.js'

const CONTENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const TOPIC_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const CAMPAIGN_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const ATTEMPT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const UPDATED_AT = '2026-09-01T12:00:00.000Z'

function recorder(data = []) {
  const calls = []
  return {
    calls,
    client: { rpc: async (name, args) => { calls.push({ name, args }); return { data, error: null } } },
  }
}

test('catalog and filter clients use only bounded protected RPCs', async () => {
  const { client, calls } = recorder()
  await listTrainingCatalog(client, { view: 'learner', language: 'es', topicId: TOPIC_ID, search: ' policy ', limit: 20, offset: 5 })
  await getTrainingFilterOptions(client, 'studio')
  await listAcademyModules(client, 'en')
  assert.deepEqual(calls, [
    { name: 'list_training_catalog', args: { requested_view: 'learner', requested_language: 'es', requested_topic_id: TOPIC_ID, requested_search: 'policy', requested_limit: 20, requested_offset: 5 } },
    { name: 'get_training_filter_options', args: { requested_context: 'studio' } },
    { name: 'list_academy_modules', args: { requested_language: 'en' } },
  ])
})

test('authoring details use the one protected answer-key RPC and preserve server timestamps', async () => {
  const payload = { content: { id: CONTENT_ID, updated_at: UPDATED_AT }, questions: [] }
  const { client, calls } = recorder(payload)
  const result = await getTrainingContentAuthoringDetails(client, CONTENT_ID)
  assert.deepEqual(calls, [{
    name: 'get_training_content_authoring_details',
    args: { requested_content_id: CONTENT_ID },
  }])
  assert.equal(result.data.content.updated_at, UPDATED_AT)
  assert.equal(result.data, payload)
})

test('authoring details reject malformed identifiers without reaching Supabase', async () => {
  const { client, calls } = recorder()
  const result = await getTrainingContentAuthoringDetails(client, 'not-a-uuid')
  assert.equal(result.error.code, 'invalid_request')
  assert.deepEqual(calls, [])
})

test('draft creation sends business fields but never creator identity or lifecycle', async () => {
  const { client, calls } = recorder()
  await createTrainingContentDraft(client, {
    contentType: 'quiz', title: 'Policy practice', description: 'Safe draft', language: 'en',
    topicIds: [TOPIC_ID], scopeType: 'campaign', campaignId: CAMPAIGN_ID, positionIds: [],
    creatorId: 'forged', status: 'published',
  })
  assert.equal(calls[0].name, 'create_training_content_draft')
  assert.equal(calls[0].args.requested_content_type, 'quiz')
  assert.equal(calls[0].args.requested_campaign_id, CAMPAIGN_ID)
  assert.equal('creator_id' in calls[0].args, false)
  assert.equal('status' in calls[0].args, false)
})

test('draft update and structured questions preserve stale-write token', async () => {
  const { client, calls } = recorder()
  const draft = {
    contentType: 'quiz', title: 'Updated practice', language: 'es', topicIds: [TOPIC_ID],
    scopeType: 'global', positionIds: [], expectedUpdatedAt: UPDATED_AT,
  }
  await updateTrainingContentDraft(client, CONTENT_ID, draft)
  await replaceTrainingQuestions(client, CONTENT_ID, [{ position: 1, question_type: 'true_false', prompt: 'Ready?', answer_options: [], correct_answer: true, topic_ids: [TOPIC_ID] }], UPDATED_AT)
  assert.equal(calls[0].args.expected_updated_at, UPDATED_AT)
  assert.equal(calls[1].name, 'replace_training_questions')
  assert.equal(calls[1].args.expected_updated_at, UPDATED_AT)
})

test('publish, archive and GO Practice use exact content actions', async () => {
  const { client, calls } = recorder()
  await publishTrainingContent(client, CONTENT_ID)
  await archiveTrainingContent(client, CONTENT_ID)
  await getGoPracticeContent(client, CONTENT_ID)
  assert.deepEqual(calls.map(({ name }) => name), [
    'publish_training_content', 'archive_training_content', 'get_go_practice_content',
  ])
  assert.ok(calls.every(({ args }) => Object.keys(args).join() === 'requested_content_id'))
})

test('attempt start cannot submit learner identity and completion cannot submit score', async () => {
  const { client, calls } = recorder()
  await startTrainingAttempt(client, CONTENT_ID, 'go_practice', { learnerId: 'forged' })
  await completeTrainingAttempt(client, ATTEMPT_ID, [{ question_id: TOPIC_ID, answer: 0 }], 14, { score: 100 })
  assert.deepEqual(calls[0], { name: 'start_training_attempt', args: { requested_content_id: CONTENT_ID, requested_source_mode: 'go_practice' } })
  assert.deepEqual(calls[1], { name: 'complete_training_attempt', args: { requested_attempt_id: ATTEMPT_ID, requested_answers: [{ question_id: TOPIC_ID, answer: 0 }], requested_duration_seconds: 14 } })
  assert.doesNotMatch(JSON.stringify(calls), /learner|score|correct_answers/i)
})

test('history is own-only and takes no target learner identifier', async () => {
  const { client, calls } = recorder()
  await listMyTrainingResults(client, 25)
  assert.deepEqual(calls, [{ name: 'list_my_training_results', args: { requested_limit: 25 } }])
})

test('invalid local input never reaches the backend', async () => {
  const { client, calls } = recorder()
  assert.equal((await listTrainingCatalog(client, { limit: 101 })).error.code, 'invalid_request')
  assert.equal((await createTrainingContentDraft(client, { contentType: 'quiz' })).error.code, 'invalid_request')
  assert.equal((await startTrainingAttempt(client, CONTENT_ID, 'go_hosted')).error.code, 'invalid_request')
  assert.equal((await completeTrainingAttempt(client, 'bad-id', [], -1)).error.code, 'invalid_request')
  assert.deepEqual(calls, [])
})

test('backend errors are sanitized without exposing SQL details', () => {
  assert.equal(normalizeTrainingError({ code: '42501', message: 'private role row' }).code, 'access_denied')
  const hidden = normalizeTrainingError({ code: 'XX000', message: 'sensitive SQL stack' })
  assert.equal(hidden.code, 'unavailable')
  assert.doesNotMatch(hidden.message, /SQL|stack/i)
})

test('Training client has no direct tables, role-name gates, localStorage, or legacy identity', async () => {
  const source = await readFile(new URL('./trainingApi.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\.from\(|localStorage|pulse_user|service_role/i)
  assert.doesNotMatch(source, /super_admin|supervisor|team_leader|\bqa\b/i)
  for (const rpcName of [
    'list_training_catalog', 'get_training_filter_options', 'create_training_content_draft',
    'get_training_content_authoring_details',
    'replace_training_questions', 'publish_training_content', 'get_go_practice_content',
    'start_training_attempt', 'complete_training_attempt', 'list_my_training_results',
  ]) assert.match(source, new RegExp(rpcName))
})
