import { supabase } from '../utils/supabase.js'

export async function agentRequest(action, args = {}) {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args }),
    })
    const payload = await response.json()
    return payload?.error ? { data: null, error: payload.error } : { data: payload?.data ?? null, error: null }
  } catch {
    return { data: null, error: { code: 'unavailable', message: 'Pulse GO is temporarily unavailable.' } }
  }
}

export async function getAgentSession() {
  try {
    const response = await fetch('/api/agent', { credentials: 'same-origin', cache: 'no-store' })
    const payload = await response.json()
    return payload?.error ? { data: null, error: payload.error } : { data: payload?.data ?? null, error: null }
  } catch {
    return { data: null, error: { code: 'unavailable', message: 'Pulse GO is temporarily unavailable.' } }
  }
}

const actions = {
  list_go_practice_catalog_v3: args => ['catalog', {
    language: args.requested_language, limit: args.requested_limit, offset: args.requested_offset,
  }],
  get_go_question_bank_groups: args => ['metadata', { contentIds: args.requested_content_ids }],
  get_go_game_identity: args => ['metadata', { contentIds: args.requested_content_ids }],
  get_go_practice_content_v2: args => ['content', { contentId: args.requested_content_id }],
  start_training_attempt: args => args.requested_source_mode === 'go_practice'
    ? ['practiceStart', { contentId: args.requested_content_id }] : null,
  get_go_practice_timing: args => ['practiceTiming', { attemptId: args.requested_attempt_id }],
  submit_go_practice_answer_with_feedback: args => ['practiceAnswer', {
    attemptId: args.requested_attempt_id, questionId: args.requested_question_id, answer: args.requested_answer,
  }],
  get_go_practice_completed_review: args => ['practiceReview', { attemptId: args.requested_attempt_id }],
  get_go_certification_result: args => ['certificationResult', { attemptId: args.requested_attempt_id }],
  join_go_hosted_session: args => ['roomJoin', { roomCode: args.requested_room_code }],
  get_go_hosted_session: args => ['roomSnapshot', { sessionId: args.requested_session_id }],
  get_go_hosted_timing: args => ['roomTiming', { sessionId: args.requested_session_id }],
  submit_go_hosted_answer: args => ['roomAnswer', {
    sessionId: args.requested_session_id, questionId: args.requested_question_id,
    answer: args.requested_answer, position: args.expected_question_position,
  }],
  get_go_global_ranking: args => ['ranking', { period: args.requested_period }],
  get_my_go_progress: () => ['progress', {}],
}

export const agentGoClient = {
  // Preserve existing GO destination guards while routing Agent calls through
  // the same-origin cookie boundary. This is never a privileged browser client.
  supabaseUrl: supabase.supabaseUrl,
  async rpc(name, args = {}) {
    if (name === 'get_go_capabilities') return { data: { can_practice: true, can_host: false }, error: null }
    const operation = actions[name]?.(args)
    if (!operation) return { data: null, error: { code: 'access_denied', message: 'This action is not available to Agent players.' } }
    return agentRequest(operation[0], operation[1])
  },
}
