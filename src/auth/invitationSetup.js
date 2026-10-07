const GOOGLE_INVITATION_KEY = 'pulse_invitation_google_return'

// Routing hint only. The server independently matches Auth UID and verified email.
export function rememberInvitationGoogle(setup, authUser, storage = globalThis.sessionStorage) {
  try { storage?.setItem(GOOGLE_INVITATION_KEY, JSON.stringify({ id: setup.id, authUserId: authUser.id })) } catch { /* optional routing hint */ }
}

export function readInvitationGoogle(storage = globalThis.sessionStorage) {
  try {
    const value = JSON.parse(storage?.getItem(GOOGLE_INVITATION_KEY) || 'null')
    return typeof value?.id === 'string' && typeof value?.authUserId === 'string' ? value : null
  } catch { return null }
}

export function clearInvitationGoogle(storage = globalThis.sessionStorage) {
  try { storage?.removeItem(GOOGLE_INVITATION_KEY) } catch { /* optional routing hint */ }
}

export function hasVerifiedGoogleIdentity(authUser) {
  return Boolean(authUser?.email_confirmed_at && authUser.identities?.some(identity =>
    identity.provider === 'google' && identity.identity_data?.email_verified === true
      && String(identity.identity_data.email).toLowerCase() === String(authUser.email).toLowerCase()))
}
