import assert from 'node:assert/strict'
import test from 'node:test'

import { assertGoPracticeDestination, resolveGoPracticeDestination } from './goPracticeDestination.js'

test('GO Practice writes allow only exact local Supabase origins', () => {
  for (const origin of ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321']) {
    assert.equal(resolveGoPracticeDestination(origin).allowed, true)
    assert.doesNotThrow(() => assertGoPracticeDestination(origin))
  }
})

test('GO Practice writes fail closed for hosted, malformed, and lookalike destinations', () => {
  for (const origin of ['https://abc.supabase.co', 'http://localhost:54322', 'http://127.0.0.1:54321.evil.test', '', 'not-a-url']) {
    assert.equal(resolveGoPracticeDestination(origin).allowed, false)
    assert.throws(() => assertGoPracticeDestination(origin))
  }
})
