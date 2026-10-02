import assert from 'node:assert/strict'
import test from 'node:test'

import { orderedModeOptions } from './goOptionOrder.js'

const question = { id: 'question-1', answer_options: ['A', 'B', 'C', 'D'] }

test('disposition and objection options vary by round while preserving server answer indexes', () => {
  for (const mode of ['disposition-trainer', 'objection-battle']) {
    const first = orderedModeOptions(question, mode, 'attempt-1')
    assert.deepEqual(first, orderedModeOptions(question, mode, 'attempt-1'))
    assert.deepEqual(first.map(({ originalIndex }) => originalIndex).sort(), [0, 1, 2, 3])
    const orders = new Set(Array.from({ length: 12 }, (_, index) =>
      orderedModeOptions(question, mode, `attempt-${index}`).map(({ originalIndex }) => originalIndex).join(',')))
    assert.ok(orders.size > 1)
  }
})

test('binary decisions and certification retain their authored order', () => {
  for (const mode of ['valid-invalid', 'eligible', 'certification']) {
    assert.deepEqual(orderedModeOptions(question, mode, 'attempt-1').map(({ originalIndex }) => originalIndex), [0, 1, 2, 3])
  }
})
