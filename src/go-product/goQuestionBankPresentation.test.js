import assert from 'node:assert/strict'
import test from 'node:test'
import { questionBankModeOptions, questionBankTitle } from './goQuestionBankPresentation.js'

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
