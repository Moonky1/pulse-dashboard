import test from 'node:test'
import assert from 'node:assert/strict'
import { validateQuestions } from '../training/questionValidation.js'
import { assertLocalTrainingDestination } from '../training/localIsolation.js'
import { createTrainingContentDraft, publishTrainingContent, listStudioContent, normalizeTrainingError } from '../training/trainingApi.js'
import { emptyDraft, draftFromDetails, questionsFromDetails, orderedQuestions, validateAudience, validateBasics } from './builderModel.js'

const topic = '23200000-0000-4000-8000-000000000001'
const content = '43200000-0000-4000-8000-000000000001'
const mc = { position: 1, question_type: 'multiple_choice', prompt: 'Which one?', answer_options: ['Alpha', 'Beta'], correct_answer: 1, topic_ids: [topic] }
const draft = { ...emptyDraft(), contentType: 'quiz', title: 'A test title', topicIds: [topic], scopeType: 'global' }

test('authoring rejects every remote destination before invoking transport', async () => {
  for (const url of ['https://example.supabase.co', 'http://127.0.0.1:9999', 'http://localhost.evil.test:54321', 'https://localhost:54321', undefined]) {
    assert.throws(() => assertLocalTrainingDestination(url))
    let calls = 0
    const result = await createTrainingContentDraft({ supabaseUrl: url, rpc: () => { calls++ } }, draft)
    assert.equal(result.error.code, 'local_only')
    assert.equal(calls, 0)
  }
  assert.doesNotThrow(() => assertLocalTrainingDestination('http://127.0.0.1:54321'))
})
test('publish requires and preserves microsecond reviewed token', async () => {
  const calls = []
  const client = { supabaseUrl: 'http://127.0.0.1:54321', rpc: async (name,args) => { calls.push({ name,args }); return { data: [] } } }
  assert.equal((await publishTrainingContent(client, content)).error.code, 'invalid_request')
  await publishTrainingContent(client, content, '2026-09-04T10:11:12.123456+00:00')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].args.expected_updated_at, '2026-09-04T10:11:12.123456+00:00')
})
test('status and offset are sent together to the server, not filtered afterward', async () => {
  let args
  await listStudioContent({ rpc: async (_,input) => { args = input; return { data: [] } } }, { status: 'archived', offset: 48 })
  assert.equal(args.requested_status, 'archived')
  assert.equal(args.requested_offset, 48)
})
for (const options of [['', 'B'], ['   ', 'B'], [null,'B'], [0,'B'], [{},'B'], ['A'], Array(9).fill('A'), {}]) {
  test('MC rejects unusable options ' + JSON.stringify(options), () => assert.ok(validateQuestions([{ ...mc, answer_options: options }])))
}
test('all three types mirror backend answer structure', () => {
  assert.equal(validateQuestions([mc]), null)
  assert.equal(validateQuestions([{ ...mc, question_type: 'true_false', answer_options: [], correct_answer: false }]), null)
  assert.ok(validateQuestions([{ ...mc, question_type: 'true_false', answer_options: [], correct_answer: 'false' }]))
  assert.equal(validateQuestions([{ ...mc, question_type: 'text', answer_options: [], correct_answer: [' Answer '] }]), null)
  assert.ok(validateQuestions([{ ...mc, question_type: 'text', answer_options: [], correct_answer: [' '] }]))
})
test('100 ordered questions supported; 101 and invalid topics denied', () => {
  const questions = orderedQuestions(Array.from({ length: 100 }, () => ({ ...mc })))
  assert.equal(validateQuestions(questions, [topic]), null)
  assert.ok(validateQuestions([...questions, { ...mc, position: 101 }]))
  assert.ok(validateQuestions([mc], []))
})
test('draft creation needs Basics and an authorized Audience, not a page visit', () => {
  assert.ok(validateBasics(emptyDraft()))
  assert.equal(validateBasics(draft), null)
  assert.ok(validateAudience(draft, {}, { can_create_global: false }))
  assert.equal(validateAudience(draft, {}, { can_create_global: true }), null)
})
test('authoring state is reconstructed entirely from the server payload', () => {
  const body = { content: { content_type: 'quiz', title: 'Restored', description: null, language: 'en' }, topics: [{ id: topic }], audience: { scope_type: 'global' }, position_targets: [], questions: [{ ...mc, id: content }] }
  assert.equal(draftFromDetails(body).title, 'Restored')
  assert.deepEqual(questionsFromDetails(body)[0].answer_options, mc.answer_options)
  assert.equal('id' in questionsFromDetails(body)[0], false)
})
test('known authoring errors are actionable without exposing raw internals', () => {
  assert.equal(normalizeTrainingError({ code: '40001' }).code, 'stale_draft')
  assert.equal(normalizeTrainingError({ code: 'P0001', message: 'published training content requires an active Topic' }).code, 'invalid_request')
  assert.equal(normalizeTrainingError({ code: 'P0001', message: 'secret internal error' }).code, 'unavailable')
})
