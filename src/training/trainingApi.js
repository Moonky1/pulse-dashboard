const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LANGUAGES = new Set(['en', 'es'])
const SCOPES = new Set(['global', 'campaign', 'team'])
const CONTENT_TYPES = new Set(['lesson', 'quiz', 'assessment'])

function publicError(code, message) {
  return { code, message }
}

export function normalizeTrainingError(error) {
  if (!error) return null
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission for this Training action.')
  }
  if (error.code === 'P0002') return publicError('not_found', 'This Training item is unavailable.')
  if (error.code === '40001') return publicError('stale_draft', 'This draft changed. Refresh before saving again.')
  if (error.code === '55000') return publicError('invalid_state', 'This Training item is no longer in the required state.')
  if (['22023', '22P02', '23503', '23514', '23505'].includes(error.code)) {
    return publicError('invalid_request', 'Review the Training selection and try again.')
  }
  return publicError('unavailable', 'Pulse Training is temporarily unavailable.')
}

async function rpc(client, name, args) {
  try {
    const { data, error } = await client.rpc(name, args)
    return error ? { data: null, error: normalizeTrainingError(error) } : { data, error: null }
  } catch {
    return { data: null, error: normalizeTrainingError({ code: 'unavailable' }) }
  }
}

function validUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

function validUuidList(value, { required = false } = {}) {
  return Array.isArray(value) && (!required || value.length > 0) && value.every(validUuid)
}

function invalidRequest() {
  return { data: null, error: normalizeTrainingError({ code: '22023' }) }
}

export function listTrainingCatalog(client, {
  view = 'learner', language = null, topicId = null, search = null, limit = 50, offset = 0,
} = {}) {
  if (!['learner', 'studio'].includes(view) || (language && !LANGUAGES.has(language)) ||
      (topicId && !validUuid(topicId)) || !Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isInteger(offset) || offset < 0) return Promise.resolve(invalidRequest())
  return rpc(client, 'list_training_catalog', {
    requested_view: view,
    requested_language: language,
    requested_topic_id: topicId,
    requested_search: typeof search === 'string' ? search.trim() || null : null,
    requested_limit: limit,
    requested_offset: offset,
  })
}

export function getTrainingFilterOptions(client, context = 'learner') {
  if (!['learner', 'studio'].includes(context)) return Promise.resolve(invalidRequest())
  return rpc(client, 'get_training_filter_options', { requested_context: context })
}

export function listAcademyModules(client, language = null) {
  if (language && !LANGUAGES.has(language)) return Promise.resolve(invalidRequest())
  return rpc(client, 'list_academy_modules', { requested_language: language })
}

function validDraft(input) {
  if (!input || !CONTENT_TYPES.has(input.contentType) || !LANGUAGES.has(input.language) ||
      typeof input.title !== 'string' || input.title.trim().length < 2 ||
      !validUuidList(input.topicIds, { required: true }) || !SCOPES.has(input.scopeType) ||
      !validUuidList(input.positionIds || [])) return false
  if (input.scopeType === 'global') return !input.campaignId && !input.teamId
  if (input.scopeType === 'campaign') return validUuid(input.campaignId) && !input.teamId
  return validUuid(input.teamId) && !input.campaignId
}

function draftArgs(input) {
  return {
    requested_title: input.title.trim(),
    requested_description: typeof input.description === 'string' ? input.description.trim() || null : null,
    requested_language: input.language,
    requested_topic_ids: [...new Set(input.topicIds)],
    requested_scope_type: input.scopeType,
    requested_campaign_id: input.campaignId || null,
    requested_team_id: input.teamId || null,
    requested_position_ids: [...new Set(input.positionIds || [])],
  }
}

export function createTrainingContentDraft(client, input) {
  if (!validDraft(input)) return Promise.resolve(invalidRequest())
  return rpc(client, 'create_training_content_draft', {
    requested_content_type: input.contentType,
    ...draftArgs(input),
  })
}

export function updateTrainingContentDraft(client, contentId, input) {
  if (!validUuid(contentId) || !validDraft(input) || !input.expectedUpdatedAt) {
    return Promise.resolve(invalidRequest())
  }
  return rpc(client, 'update_training_content_draft', {
    requested_content_id: contentId,
    ...draftArgs(input),
    expected_updated_at: input.expectedUpdatedAt,
  })
}

export function replaceTrainingQuestions(client, contentId, questions, expectedUpdatedAt) {
  if (!validUuid(contentId) || !Array.isArray(questions) || questions.length < 1 || !expectedUpdatedAt) {
    return Promise.resolve(invalidRequest())
  }
  return rpc(client, 'replace_training_questions', {
    requested_content_id: contentId,
    requested_questions: questions,
    expected_updated_at: expectedUpdatedAt,
  })
}

function contentAction(client, name, contentId) {
  if (!validUuid(contentId)) return Promise.resolve(invalidRequest())
  return rpc(client, name, { requested_content_id: contentId })
}

export const publishTrainingContent = (client, contentId) => contentAction(client, 'publish_training_content', contentId)
export const archiveTrainingContent = (client, contentId) => contentAction(client, 'archive_training_content', contentId)
export const getGoPracticeContent = (client, contentId) => contentAction(client, 'get_go_practice_content', contentId)

export function startTrainingAttempt(client, contentId, sourceMode) {
  if (!validUuid(contentId) || !['go_practice', 'academy'].includes(sourceMode)) {
    return Promise.resolve(invalidRequest())
  }
  return rpc(client, 'start_training_attempt', {
    requested_content_id: contentId,
    requested_source_mode: sourceMode,
  })
}

export function completeTrainingAttempt(client, attemptId, answers, durationSeconds = null) {
  if (!validUuid(attemptId) || !Array.isArray(answers) || answers.length < 1 ||
      (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 0))) {
    return Promise.resolve(invalidRequest())
  }
  return rpc(client, 'complete_training_attempt', {
    requested_attempt_id: attemptId,
    requested_answers: answers,
    requested_duration_seconds: durationSeconds,
  })
}

export function listMyTrainingResults(client, limit = 50) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return Promise.resolve(invalidRequest())
  return rpc(client, 'list_my_training_results', { requested_limit: limit })
}
