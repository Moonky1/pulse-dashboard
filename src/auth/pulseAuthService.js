import { STAFF_OAUTH_PROVIDER } from './staffOAuth.js'

const PROFILE_FIELDS = 'id, auth_user_id, email, full_name, display_name, employee_id, department_id, team_id, status, approved_at, created_at, updated_at'

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function isEmailFormatValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
}

export function validateRegistration({ fullName, email, password, confirmPassword }) {
  const errors = {}
  const cleanName = String(fullName ?? '').trim()
  if (cleanName.length < 2 || cleanName.length > 160) errors.fullName = 'Enter your full name.'
  if (!isEmailFormatValid(email)) errors.email = 'Enter a valid email address.'
  if (String(password ?? '').length < 8) errors.password = 'Use at least 8 characters.'
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export function validatePasswordUpdate({ password, confirmPassword }) {
  const errors = {}
  if (String(password ?? '').length < 8) errors.password = 'Use at least 8 characters.'
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export async function loadOwnProfile(client, authUserId) {
  if (!authUserId) return { data: null, error: null }
  const { data, error } = await client.from('users').select(PROFILE_FIELDS).eq('auth_user_id', authUserId).maybeSingle()
  return { data, error }
}

export async function createPendingProfile(client, fullName) {
  const { data, error } = await client.rpc('create_pending_profile', { requested_full_name: String(fullName ?? '').trim() })
  return { data: Array.isArray(data) ? (data[0] ?? null) : data, error }
}

export async function acceptOwnStaffInvitation(client) {
  const { data, error } = await client.rpc('accept_own_staff_invitation')
  return { data: Array.isArray(data) ? (data[0] ?? null) : data, error }
}

export function signInWithPassword(client, { email, password }) {
  return client.auth.signInWithPassword({ email: normalizeEmail(email), password })
}

export function signInWithGoogle(client, { redirectTo }) {
  return client.auth.signInWithOAuth({
    provider: STAFF_OAUTH_PROVIDER,
    options: {
      redirectTo,
      scopes: 'openid email profile',
    },
  })
}

export function signUpWithPassword(client, { fullName, email, password, emailRedirectTo }) {
  return client.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: { emailRedirectTo, data: { full_name: String(fullName ?? '').trim() } },
  })
}

export function signOutSession(client) {
  return client.auth.signOut()
}

export function requestPasswordRecovery(client, { email, redirectTo }) {
  return client.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo })
}

export function resendSignupVerification(client, { email, emailRedirectTo }) {
  return client.auth.resend({ type: 'signup', email: normalizeEmail(email), options: { emailRedirectTo } })
}

export function updateAccountPassword(client, password) {
  return client.auth.updateUser({ password })
}

export function exchangeAuthCode(client, code) {
  return client.auth.exchangeCodeForSession(code)
}

export function getPendingProfileName(authUser) {
  const metadata = authUser?.user_metadata ?? {}
  const candidates = [metadata.full_name, metadata.name, metadata.display_name]

  for (const value of candidates) {
    const name = String(value ?? '').trim()
    if (name.length >= 2 && name.length <= 160) return name
  }

  const emailName = String(authUser?.email ?? '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return emailName.length >= 2 && emailName.length <= 160 ? emailName : ''
}
