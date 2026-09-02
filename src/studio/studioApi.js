const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function publicError(code, message) {
  return { code, message }
}

export function normalizeStudioError(error) {
  if (!error) return null
  if (['42501', '28000'].includes(error.code)) return publicError('access_denied', 'You do not have permission to view Studio.')
  if (['22023', '22P02'].includes(error.code)) return publicError('invalid_request', 'One or more Studio filters are not valid.')
  return publicError('unavailable', 'Pulse Studio is temporarily unavailable. Try again shortly.')
}

function invalidRequest() {
  return { data: [], error: normalizeStudioError({ code: '22023' }) }
}

function isOptionalUuid(value) {
  return value === null || value === undefined || UUID_PATTERN.test(value)
}

export async function listStudioCatalog(client, {
  language = null,
  topicId = null,
  search = '',
  limit = 24,
  offset = 0,
} = {}) {
  if (!['en', 'es', null].includes(language) || !isOptionalUuid(topicId) || !Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) return invalidRequest()
  try {
    const { data, error } = await client.rpc('list_training_catalog', {
      requested_view: 'studio',
      requested_language: language,
      requested_topic_id: topicId || null,
      requested_search: typeof search === 'string' ? search.trim() || null : null,
      requested_limit: limit,
      requested_offset: offset,
    })
    return error ? { data: [], error: normalizeStudioError(error) } : { data: Array.isArray(data) ? data : [], error: null }
  } catch {
    return { data: [], error: normalizeStudioError({ code: 'unavailable' }) }
  }
}

export async function getStudioFilterOptions(client) {
  try {
    const { data, error } = await client.rpc('get_training_filter_options', { requested_context: 'studio' })
    return error ? { data: null, error: normalizeStudioError(error) } : {
      data: {
        languages: Array.isArray(data?.languages) ? data.languages : [],
        topics: Array.isArray(data?.topics) ? data.topics : [],
        campaigns: Array.isArray(data?.campaigns) ? data.campaigns : [],
        teams: Array.isArray(data?.teams) ? data.teams : [],
        positions: Array.isArray(data?.positions) ? data.positions : [],
      },
      error: null,
    }
  } catch {
    return { data: null, error: normalizeStudioError({ code: 'unavailable' }) }
  }
}
