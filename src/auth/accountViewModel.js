export function connectedGoogleAccount(authUser) {
  const providers = Array.isArray(authUser?.app_metadata?.providers) ? authUser.app_metadata.providers : []
  const identity = Array.isArray(authUser?.identities)
    ? authUser.identities.find((item) => item?.provider === 'google')
    : null
  const connected = providers.includes('google') || Boolean(identity)
  const email = identity?.identity_data?.email
  return { connected, email: typeof email === 'string' && email.includes('@') ? email : null }
}

export function canRecoverPassword(authUser) {
  const providers = Array.isArray(authUser?.app_metadata?.providers) ? authUser.app_metadata.providers : []
  return Boolean(authUser?.email && (providers.includes('email') || authUser?.app_metadata?.provider === 'email'))
}
