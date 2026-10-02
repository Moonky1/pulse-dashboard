import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyGoCatalog, modeForContent, ORIGINAL_MODE_CODES } from './goModeCatalog.js'
import { goModeResultLine } from './goModeCopy.js'

test('all original modes are recognized without mixing languages or creator games', () => {
  assert.equal(ORIGINAL_MODE_CODES.length, 6)
  const items = [
    { id: 'valid-en', language: 'en' },
    { id: 'valid-es', language: 'es' },
    { id: 'creator-en', language: 'en' },
  ]
  const groups = [
    { id: 'valid-en', game_mode: 'valid-invalid', review_required: false },
    { id: 'valid-es', game_mode: 'valid-invalid', review_required: false },
  ]
  const catalog = classifyGoCatalog(items.filter(item => item.language === 'en'), groups, 'en')
  assert.equal(catalog.modeItems['valid-invalid']?.id, 'valid-en')
  assert.deepEqual(catalog.otherGames.map(item => item.id), ['creator-en'])
  assert.equal(modeForContent(groups, 'valid-es'), 'valid-invalid')
})

test('draft or unreviewed original modes do not unlock', () => {
  const items = [{ id: 'unreviewed', language: 'en' }]
  const groups = [{ id: 'unreviewed', game_mode: 'eligible', review_required: true }]
  const catalog = classifyGoCatalog(items, groups, 'en')
  assert.equal(catalog.modeItems.eligible, undefined)
  assert.deepEqual(catalog.otherGames, [])
})

test('results use each mode’s meaning in both languages', () => {
  assert.match(goModeResultLine('valid-invalid', 8, 10, 'en'), /transfer decisions/)
  assert.match(goModeResultLine('disposition-trainer', 8, 10, 'en'), /disposed calls/)
  assert.match(goModeResultLine('eligible', 8, 10, 'es'), /elegibilidad/)
  assert.match(goModeResultLine('objection-battle', 8, 10, 'es'), /respuestas/)
})
