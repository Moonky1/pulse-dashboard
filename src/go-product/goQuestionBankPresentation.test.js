import assert from 'node:assert/strict'
import test from 'node:test'
import { classicHostLevels, hostedQuestionCount, questionBankDifficulty, questionBankModeOptions, questionBankTitle } from './goQuestionBankPresentation.js'

test('question bank presentation uses product labels, not import labels', () => {
  assert.equal(questionBankTitle({ game_mode: 'classic', difficulty: 'easy' }), 'Classic Quiz · Easy')
  assert.equal(questionBankTitle({ game_mode: 'valid-invalid', difficulty: null }), 'Valid or Invalid XFER')
  assert.equal(questionBankTitle(null), null)
  assert.equal(questionBankTitle({ game_mode: 'unknown' }), null)
})

test('mode choices are unique and derived only from server-classified games', () => {
  assert.deepEqual(questionBankModeOptions([
    { question_bank: { game_mode: 'classic' } },
    { question_bank: { game_mode: 'classic' } },
    { question_bank: { game_mode: 'eligible' } },
    { title: 'Synthetic QA' },
  ]), [
    { value: 'classic', label: 'Classic Quiz' },
    { value: 'eligible', label: 'Eligible or Not Eligible' },
  ])
})

test('Classic host card shows all 40 source questions', () => {
  assert.equal(hostedQuestionCount({ question_bank: { game_mode: 'classic' }, question_count: 40 }), 40)
  assert.equal(hostedQuestionCount({ question_count: 3 }), 3)
  assert.equal(questionBankDifficulty({ difficulty: 'easy' }, 'es'), 'Fácil')
})

test('language choice reveals only its three Classic levels in order', () => {
  const levels = ['advanced', 'easy', 'medium']
  const items = [
    ...levels.map(difficulty => ({ id: `en-${difficulty}`, language: 'en', question_bank: { game_mode: 'classic', difficulty } })),
    ...levels.map(difficulty => ({ id: `es-${difficulty}`, language: 'es', question_bank: { game_mode: 'classic', difficulty } })),
    { id: 'other', language: 'en', question_bank: { game_mode: 'eligible' } },
  ]
  assert.deepEqual(classicHostLevels(items, ''), [])
  assert.deepEqual(classicHostLevels(items, 'en').map(item => item.id), ['en-easy', 'en-medium', 'en-advanced'])
  assert.deepEqual(classicHostLevels(items, 'es').map(item => item.id), ['es-easy', 'es-medium', 'es-advanced'])
})
