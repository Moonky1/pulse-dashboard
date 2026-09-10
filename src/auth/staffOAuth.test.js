import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeStaffReturnPath, readStaffReturnPath, rememberStaffReturnPath, STAFF_OAUTH_RETURN_KEY, takeStaffReturnPath } from './staffOAuth.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

test('accepts only known internal protected Pulse destinations', () => {
  assert.equal(normalizeStaffReturnPath('/studio/content/123?mode=review#question'), '/studio/content/123')
  assert.equal(normalizeStaffReturnPath('/go/practice/123'), '/go/practice/123')
  assert.equal(normalizeStaffReturnPath('/admin/users'), '/admin/users')
  assert.equal(normalizeStaffReturnPath('/workspace'), '/workspace')
  assert.equal(normalizeStaffReturnPath('https://evil.example/studio'), null)
  assert.equal(normalizeStaffReturnPath('//evil.example/studio'), null)
  assert.equal(normalizeStaffReturnPath('/signin'), null)
  assert.equal(normalizeStaffReturnPath('/admin.evil'), null)
  assert.equal(normalizeStaffReturnPath('/studio\\@evil.example'), null)
})

test('stores the destination in session storage and consumes it exactly once', () => {
  const storage = memoryStorage()
  assert.equal(rememberStaffReturnPath('/studio/create', storage), '/studio/create')
  assert.equal(storage.getItem(STAFF_OAUTH_RETURN_KEY), '/studio/create')
  assert.equal(readStaffReturnPath(storage), '/studio/create')
  assert.equal(readStaffReturnPath(storage), '/studio/create')
  assert.equal(takeStaffReturnPath(storage), '/studio/create')
  assert.equal(takeStaffReturnPath(storage), null)
})

test('invalid destinations clear a previously stored return path', () => {
  const storage = memoryStorage()
  rememberStaffReturnPath('/admin', storage)
  rememberStaffReturnPath('https://evil.example', storage)
  assert.equal(storage.getItem(STAFF_OAUTH_RETURN_KEY), null)
})
