import assert from 'node:assert/strict'
import test from 'node:test'

import { AUTH_STATES, deriveAuthState, routeForAuthState } from './authState.js'

const session = { user: { id: 'auth-1' } }

test('derives every supported lifecycle state from trusted session and profile', () => {
  assert.equal(deriveAuthState({ loading: true }), AUTH_STATES.LOADING)
  assert.equal(deriveAuthState({ loading: false, session: null }), AUTH_STATES.ANONYMOUS)
  assert.equal(deriveAuthState({ loading: false, session, profile: null }), AUTH_STATES.MISSING_PROFILE)
  assert.equal(deriveAuthState({ loading: false, session, profile: { status: 'pending_approval' } }), AUTH_STATES.PENDING)
  assert.equal(deriveAuthState({ loading: false, session, profile: { status: 'active' } }), AUTH_STATES.ACTIVE)
  assert.equal(deriveAuthState({ loading: false, session, profile: { status: 'blocked' } }), AUTH_STATES.BLOCKED)
  assert.equal(deriveAuthState({ loading: false, session, profile: { status: 'inactive' } }), AUTH_STATES.INACTIVE)
  assert.equal(deriveAuthState({ loading: false, session, profile: null, profileError: new Error('RLS') }), AUTH_STATES.ERROR)
})

test('routes lifecycle states to isolated destinations', () => {
  assert.equal(routeForAuthState(AUTH_STATES.PENDING), '/pending-approval')
  assert.equal(routeForAuthState(AUTH_STATES.ACTIVE), '/workspace')
  assert.equal(routeForAuthState(AUTH_STATES.BLOCKED), '/account-blocked')
  assert.equal(routeForAuthState(AUTH_STATES.INACTIVE), '/account-inactive')
  assert.equal(routeForAuthState(AUTH_STATES.MISSING_PROFILE), '/account-error')
})
