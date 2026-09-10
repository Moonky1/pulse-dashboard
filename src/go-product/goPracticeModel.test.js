import assert from 'node:assert/strict'
import test from 'node:test'

import { buildAnswerSubmission, catalogOptions, isAnswerReady, isSafePracticePayload, normalizeCatalog, normalizePracticeContent, normalizeResult } from './goPracticeModel.js'

const questions = [
  { id: 'text', position: 3, question_type: 'text', prompt: 'Name it' },
  { id: 'choice', position: 1, question_type: 'multiple_choice', prompt: 'Choose', answer_options: ['A', 'B'] },
  { id: 'truth', position: 2, question_type: 'true_false', prompt: 'True?' },
]

test('Practice model supports and orders the three certified question types', () => {
  const content = normalizePracticeContent({ id: 'content', questions })
  assert.deepEqual(content.questions.map(question => question.id), ['choice', 'truth', 'text'])
  assert.equal(normalizePracticeContent({ questions: [{ question_type: 'rating', position: 1 }] }), null)
})

test('answer readiness and canonical submission preserve exact server question ids', () => {
  assert.equal(isAnswerReady(questions[1], 0), true)
  assert.equal(isAnswerReady(questions[2], false), true)
  assert.equal(isAnswerReady(questions[0], '  '), false)
  assert.deepEqual(buildAnswerSubmission(questions, { text: 'Pulse', choice: 1, truth: false }), [
    { question_id: 'text', answer: 'Pulse' }, { question_id: 'choice', answer: 1 }, { question_id: 'truth', answer: false },
  ])
})

test('learner payload rejects answer keys and explanations before rendering', () => {
  assert.equal(isSafePracticePayload({ questions }), true)
  assert.equal(isSafePracticePayload({ questions: [{ prompt: 'Explain the explanation policy' }] }), true)
  assert.equal(isSafePracticePayload({ correct_answer: true }), false)
  assert.equal(isSafePracticePayload({ questions, explanation: 'secret' }), false)
})

test('catalog is scored-only and derives stable filter options from server rows', () => {
  const topic = { id: 't1', name: 'Policy' }
  const items = normalizeCatalog([{ id: 'a', content_type: 'quiz', language: 'en', topics: [topic] }, { id: 'b', content_type: 'lesson', language: 'es', topics: [] }, { id: 'c', content_type: 'assessment', language: 'es', topics: [topic] }])
  assert.deepEqual(items.map(item => item.id), ['a', 'c'])
  assert.deepEqual(catalogOptions(items), { languages: ['en', 'es'], topics: [topic] })
})

test('Supabase singleton and array RPC result shapes normalize identically', () => {
  assert.deepEqual(normalizeResult([{ attempt_id: 'a' }]), { attempt_id: 'a' })
  assert.deepEqual(normalizeResult({ attempt_id: 'a' }), { attempt_id: 'a' })
  assert.equal(normalizeResult([]), null)
})
