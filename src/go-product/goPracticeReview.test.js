import assert from 'node:assert/strict'
import test from 'node:test'

import { formatPracticeReviewAnswer, normalizePracticeReview } from './goPracticeReview.js'

const attemptId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const questions = Array.from({ length: 10 }, (_, index) => ({
  position: index + 1, prompt: `Question ${index + 1}`, question_type: 'multiple_choice',
  answer_options: ['No', 'Yes'], submitted_answer: index === 1 ? null : 1,
  correct_answer: 1, is_correct: index !== 1, explanation: `Why ${index + 1}`,
}))

test('completed review must match the requested attempt and contain ten ordered questions', () => {
  assert.deepEqual(normalizePracticeReview({ attempt_id: attemptId, questions }, attemptId), questions)
  assert.equal(normalizePracticeReview({ attempt_id: 'other', questions }, attemptId), null)
  assert.equal(normalizePracticeReview({ attempt_id: attemptId, questions: questions.slice(0, 9) }, attemptId), null)
  assert.equal(normalizePracticeReview({ attempt_id: attemptId, questions: [{ ...questions[0], position: 2 }, ...questions.slice(1)] }, attemptId), null)
})

test('review labels submitted, correct and missing answers without changing the score', () => {
  assert.equal(formatPracticeReviewAnswer(questions[0], 1), 'Yes')
  assert.equal(formatPracticeReviewAnswer(questions[1], null, 'es'), 'Sin respuesta')
  assert.equal(formatPracticeReviewAnswer({ question_type: 'true_false' }, false, 'es'), 'Falso')
  assert.equal(formatPracticeReviewAnswer({ question_type: 'text' }, ['first', 'second']), 'first · second')
})
