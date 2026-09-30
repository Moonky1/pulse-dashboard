import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPayload } from './build-preview-import.mjs'
import { buildProductionClassicReleaseSql } from './build-production-classic-release.mjs'

test('Production release contains only the six complete Classic levels', () => {
  const groups = buildPayload().filter(group => group.mode === 'classic')
  assert.equal(groups.length, 6)
  assert.equal(groups.reduce((count, group) => count + group.questions.length, 0), 240)
  for (const language of ['en', 'es']) {
    assert.deepEqual(groups.filter(group => group.language === language).map(group => group.difficulty).sort(),
      ['advanced', 'easy', 'medium'])
  }
  const sql = buildProductionClassicReleaseSql()
  assert.match(sql, /Requires migrations through 20260929000300/)
  assert.match(sql, /jsonb_array_length\(source\) <> 6/)
  assert.match(sql, /jsonb_array_length\(bank->'questions'\) <> 40/)
  assert.match(sql, /status='published' and is_current/)
  assert.match(sql, /insert into public\.training_topics\(code,name,description\)/)
  assert.doesNotMatch(sql, /Preview beta|10 questions per hosted game|valid-invalid-en-001/)
})
