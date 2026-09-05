// STUDIO-1B.2 is local-only until a separately authorized release removes this gate.
export function assertLocalTrainingDestination(destination) {
  const url = new URL(destination)
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.port !== '54321') {
    throw new Error('Studio authoring is restricted to the isolated local backend.')
  }
}

export const AUTHORING_MUTATIONS = new Set([
  'create_training_content_draft', 'update_training_content_draft',
  'replace_training_questions', 'publish_training_content', 'archive_training_content',
])
