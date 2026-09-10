const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export function resolveGoHostedDestination(destination) {
  try {
    const backend = new URL(destination)
    return backend.protocol === 'http:' && LOCAL_HOSTS.has(backend.hostname) && backend.port === '54321'
      ? { allowed: true, mode: 'local' }
      : { allowed: false, mode: 'blocked' }
  } catch {
    return { allowed: false, mode: 'blocked' }
  }
}

export function assertGoHostedDestination(destination) {
  const result = resolveGoHostedDestination(destination)
  if (!result.allowed) throw new Error('GO Hosted Sessions are enabled only in the isolated local environment.')
  return result
}
