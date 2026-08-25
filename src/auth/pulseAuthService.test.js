import assert from 'node:assert/strict'
import test from 'node:test'

import { createPendingProfile, exchangeAuthCode, isEmailFormatValid, loadOwnProfile, normalizeEmail, requestPasswordRecovery, resendSignupVerification, signInWithPassword, signOutSession, signUpWithPassword, updateAccountPassword, validatePasswordUpdate, validateRegistration } from './pulseAuthService.js'

test('normalizes email without treating its domain as authorization', () => {
  assert.equal(normalizeEmail('  Simon@KampaignKings.com '), 'simon@kampaignkings.com')
  assert.equal(isEmailFormatValid('person@example.org'), true)
  assert.equal(isEmailFormatValid('not-an-email'), false)
})

test('validates registration fields and password confirmation', () => {
  assert.deepEqual(validateRegistration({ fullName: '', email: 'bad', password: 'short', confirmPassword: 'different' }), {
    fullName: 'Enter your full name.',
    email: 'Enter a valid email address.',
    password: 'Use at least 8 characters.',
    confirmPassword: 'Passwords do not match.',
  })
  assert.deepEqual(validateRegistration({ fullName: 'Alex Rivera', email: 'alex@example.org', password: 'safe-pass-123', confirmPassword: 'safe-pass-123' }), {})
})

test('passes password only to Supabase Auth and never persists it', async () => {
  let received
  const client = { auth: { signInWithPassword: async (payload) => { received = payload; return { data: {}, error: null } } } }
  await signInWithPassword(client, { email: ' USER@EXAMPLE.ORG ', password: 'secret-value' })
  assert.deepEqual(received, { email: 'user@example.org', password: 'secret-value' })
})

test('sign up carries only profile name metadata and verification redirect', async () => {
  let received
  const client = { auth: { signUp: async (payload) => { received = payload; return { data: {}, error: null } } } }
  await signUpWithPassword(client, { fullName: '  Alex Rivera ', email: 'ALEX@example.org', password: 'secret', emailRedirectTo: 'http://localhost/auth/verify' })
  assert.deepEqual(received, { email: 'alex@example.org', password: 'secret', options: { emailRedirectTo: 'http://localhost/auth/verify', data: { full_name: 'Alex Rivera' } } })
})

test('loads only the caller profile through the auth_user_id filter', async () => {
  const calls = []
  const query = { select(fields) { calls.push(['select', fields]); return this }, eq(field, value) { calls.push(['eq', field, value]); return this }, async maybeSingle() { return { data: { status: 'active' }, error: null } } }
  const result = await loadOwnProfile({ from(table) { calls.push(['from', table]); return query } }, 'auth-123')
  assert.equal(result.data.status, 'active')
  assert.deepEqual(calls[1].slice(0, 1), ['select'])
  assert.deepEqual(calls[2], ['eq', 'auth_user_id', 'auth-123'])
})

test('pending profile creation uses the trusted RPC and unwraps its row', async () => {
  let received
  const client = { async rpc(name, payload) { received = [name, payload]; return { data: [{ id: 'profile-1', status: 'pending_approval' }], error: null } } }
  const result = await createPendingProfile(client, '  Alex Rivera ')
  assert.deepEqual(received, ['create_pending_profile', { requested_full_name: 'Alex Rivera' }])
  assert.equal(result.data.status, 'pending_approval')
})

test('sign out delegates to real Supabase Auth', async () => {
  let called = false
  await signOutSession({ auth: { async signOut() { called = true; return { error: null } } } })
  assert.equal(called, true)
})

test('recovery and verification calls use only normalized email and trusted redirects', async () => {
  const calls = []
  const client = { auth: {
    async resetPasswordForEmail(email, options) { calls.push(['recovery', email, options]); return { error: null } },
    async resend(payload) { calls.push(['resend', payload]); return { error: null } },
  } }
  await requestPasswordRecovery(client, { email: ' User@Example.org ', redirectTo: 'https://www.pulse-kk.com/auth/callback?flow=recovery' })
  await resendSignupVerification(client, { email: ' User@Example.org ', emailRedirectTo: 'https://www.pulse-kk.com/auth/callback?flow=verification' })
  assert.deepEqual(calls[0], ['recovery', 'user@example.org', { redirectTo: 'https://www.pulse-kk.com/auth/callback?flow=recovery' }])
  assert.equal(calls[1][1].email, 'user@example.org')
  assert.equal(calls[1][1].type, 'signup')
})

test('password update and PKCE exchange delegate without persisting secrets', async () => {
  const calls = []
  const client = { auth: {
    async updateUser(payload) { calls.push(['update', payload]); return { error: null } },
    async exchangeCodeForSession(code) { calls.push(['exchange', code]); return { error: null } },
  } }
  assert.deepEqual(validatePasswordUpdate({ password: 'short', confirmPassword: 'other' }), { password: 'Use at least 8 characters.', confirmPassword: 'Passwords do not match.' })
  await updateAccountPassword(client, 'new-secret')
  await exchangeAuthCode(client, 'one-time-code')
  assert.deepEqual(calls, [['update', { password: 'new-secret' }], ['exchange', 'one-time-code']])
})
