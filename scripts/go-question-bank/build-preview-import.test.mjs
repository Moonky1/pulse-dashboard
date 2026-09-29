import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPayload, buildPreviewSql } from './build-preview-import.mjs'

test('legacy bank groups preserve all 640 unique questions as review-only drafts', () => {
  const groups = buildPayload()
  assert.equal(groups.length, 16)
  assert.equal(groups.reduce((n, group) => n + group.questions.length, 0), 640)
  assert.equal(new Set(groups.flatMap(group => group.sourceIds)).size, 640)
  assert.ok(groups.every(group => group.questions.length === 40 && group.questions.every(
    (question, index) => question.position === index + 1 &&
      question.options[question.correct]?.trim() && question.explanation.trim(),
  )))
  assert.equal(groups.filter(group => group.mode === 'classic').length, 6)
  assert.equal(groups.filter(group => group.language === 'es').length, 8)
})

test('Preview import is a guarded transaction with no publication or real-user changes', () => {
  const sql = buildPreviewSql()
  assert.match(sql, /PULSE PREVIEW ONLY: sgshbawggqapuyqzkyhs/)
  assert.match(sql, /begin;[\s\S]*commit;/)
  assert.match(sql, /'draft',creator_id,'pulse'/)
  assert.match(sql, /on conflict \(id\) do nothing/)
  assert.doesNotMatch(sql, /status\s*=\s*'published'|insert into auth\.users|update public\.users/i)
})
