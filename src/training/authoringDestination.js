const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/

const clean = value => String(value || '').trim()

function configuredDestination() {
  return {
    approvedProjectRef: clean(import.meta.env?.VITE_TRAINING_AUTHORING_PROJECT_REF),
    approvedOrigin: clean(import.meta.env?.VITE_TRAINING_AUTHORING_ORIGIN),
  }
}

export function resolveTrainingAuthoringDestination(destination, {
  currentOrigin = globalThis.location?.origin,
  ...configuration
} = {}) {
  let backend
  try { backend = new URL(destination) } catch { return { allowed: false, mode: 'blocked' } }

  if (backend.protocol === 'http:' && LOCAL_HOSTS.has(backend.hostname) && backend.port === '54321') {
    return { allowed: true, mode: 'local' }
  }

  const defaults = configuredDestination()
  const approvedProjectRef = clean(configuration.approvedProjectRef ?? defaults.approvedProjectRef)
  const approvedOrigin = clean(configuration.approvedOrigin ?? defaults.approvedOrigin)

  if (backend.protocol !== 'https:' || !PROJECT_REF_PATTERN.test(approvedProjectRef)) {
    return { allowed: false, mode: 'blocked' }
  }

  let frontend
  try { frontend = new URL(approvedOrigin) } catch { return { allowed: false, mode: 'blocked' } }
  const exactFrontendOrigin = frontend.origin === approvedOrigin && frontend.protocol === 'https:'
  const exactBackendOrigin = backend.origin === `https://${approvedProjectRef}.supabase.co`
  const exactRuntimeOrigin = clean(currentOrigin) === approvedOrigin

  return exactFrontendOrigin && exactBackendOrigin && exactRuntimeOrigin
    ? { allowed: true, mode: 'remote', projectRef: approvedProjectRef, origin: approvedOrigin }
    : { allowed: false, mode: 'blocked' }
}

export function assertTrainingAuthoringDestination(destination, options) {
  const result = resolveTrainingAuthoringDestination(destination, options)
  if (!result.allowed) throw new Error('Studio authoring is not enabled for this destination.')
  return result
}

export const AUTHORING_MUTATIONS = new Set([
  'create_training_content_draft', 'update_training_content_draft',
  'replace_training_questions', 'publish_training_content', 'archive_training_content',
])
