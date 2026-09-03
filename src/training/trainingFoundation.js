export const TRAINING_LANGUAGES = Object.freeze(['en', 'es'])

export const TRAINING_PERMISSIONS = Object.freeze({
  studioView: 'studio.view',
  studioCreate: 'studio.create',
  studioPublish: 'studio.publish',
  academyView: 'academy.view',
  academyManage: 'academy.manage',
  goPlay: 'go.play',
  goHost: 'go.host',
})

function permissionSet(value) {
  return new Set(Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [])
}

export function getStaffTrainingCapabilities(permissions) {
  const granted = permissionSet(permissions)

  return Object.freeze({
    studioView: granted.has(TRAINING_PERMISSIONS.studioView),
    studioCreate: granted.has(TRAINING_PERMISSIONS.studioCreate),
    studioPublish: granted.has(TRAINING_PERMISSIONS.studioPublish),
    academyView:
      granted.has(TRAINING_PERMISSIONS.academyView) ||
      granted.has(TRAINING_PERMISSIONS.academyManage),
    academyManage: granted.has(TRAINING_PERMISSIONS.academyManage),
    goPractice: granted.has(TRAINING_PERMISSIONS.goPlay),
    goHost: granted.has(TRAINING_PERMISSIONS.goHost),
  })
}

export function getAgentTrainingCapabilities({ playEntitled = false } = {}) {
  return Object.freeze({
    studioView: false,
    studioCreate: false,
    studioPublish: false,
    academyView: Boolean(playEntitled),
    academyManage: false,
    goPractice: Boolean(playEntitled),
    goHost: false,
  })
}

export function getTrainingCapabilities({ actorType, permissions, agentPlayEntitled } = {}) {
  if (actorType === 'staff') return getStaffTrainingCapabilities(permissions)
  if (actorType === 'agent') {
    return getAgentTrainingCapabilities({ playEntitled: agentPlayEntitled })
  }
  return getAgentTrainingCapabilities()
}

export function normalizeTrainingLanguage(value) {
  const language = String(value || '').trim().toLowerCase()
  return TRAINING_LANGUAGES.includes(language) ? language : null
}

export function isLearnerVisibleContent(content) {
  return content?.status === 'published'
}

export function getTrainingEntryActions({ actorType, permissions, agentPlayEntitled } = {}) {
  const capabilities = getTrainingCapabilities({ actorType, permissions, agentPlayEntitled })
  const actions = []

  if (capabilities.goHost) actions.push('go.host')
  if (capabilities.goPractice) actions.push('go.practice')
  if (capabilities.studioView) actions.push('studio')
  if (capabilities.academyView) actions.push('academy')

  return actions
}
