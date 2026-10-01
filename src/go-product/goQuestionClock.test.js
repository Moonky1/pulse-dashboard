import assert from 'node:assert/strict'
import test from 'node:test'

import { questionSecondsLeft, remainingQuestionMs } from './goQuestionClock.js'

test('question countdown uses server time and survives client clock skew', () => {
  const timing = { deadline_at: '2026-10-01T00:00:30Z', server_now: '2026-10-01T00:00:00Z' }
  assert.equal(remainingQuestionMs(timing, 100000, 105000), 25000)
  assert.equal(questionSecondsLeft(remainingQuestionMs(timing, 100000, 105000)), 25)
  assert.equal(remainingQuestionMs(timing, 100000, 131000), 0)
  assert.equal(questionSecondsLeft(0), 0)
})

test('malformed timing never creates a fake countdown', () => {
  assert.equal(remainingQuestionMs({}, 100, 100), null)
  assert.equal(questionSecondsLeft(null), null)
})
