import assert from 'node:assert/strict'
import test from 'node:test'

import { classicHostLevels, isPublishedClassicLevel } from './goClassicCatalog.js'

const level = (language, title, id) => ({
  id, language, title, content_type: 'quiz', question_count: 40,
  topics: [{ code: 'product_skills' }],
})

test('Classic levels appear in difficulty order for the selected language only', () => {
  const items = [
    level('es', 'Classic Quiz · Avanzado', 'es-advanced'),
    level('en', 'Classic Quiz · Medium', 'en-medium'),
    level('es', 'Classic Quiz · Fácil', 'es-easy'),
    level('en', 'Classic Quiz · Easy', 'en-easy'),
    level('es', 'Classic Quiz · Medio', 'es-medium'),
    level('en', 'Classic Quiz · Advanced', 'en-advanced'),
  ]
  assert.deepEqual(classicHostLevels(items, 'es').map(item => item.id),
    ['es-easy', 'es-medium', 'es-advanced'])
  assert.deepEqual(classicHostLevels(items, 'en').map(item => item.id),
    ['en-easy', 'en-medium', 'en-advanced'])
  assert.deepEqual(classicHostLevels(items, ''), [])
})

test('Synthetic or incomplete quizzes cannot masquerade as a Classic level', () => {
  const valid = level('en', 'Classic Quiz · Easy', 'valid')
  assert.equal(isPublishedClassicLevel(valid), true)
  assert.equal(isPublishedClassicLevel({ ...valid, question_count: 10 }), false)
  assert.equal(isPublishedClassicLevel({ ...valid, topics: [] }), false)
  assert.equal(isPublishedClassicLevel({ ...valid, title: 'GO Bank · Classic Quiz · Easy' }), false)
})
