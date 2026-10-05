const actions = {
  list_go_practice_catalog_v3: args => ['catalog', {
    language: args.requested_language, limit: args.requested_limit, offset: args.requested_offset,
  }],
  get_go_question_bank_groups: args => ['metadata', { contentIds: args.requested_content_ids }],
  get_go_game_identity: args => ['metadata', { contentIds: args.requested_content_ids }],
  get_go_practice_content_v2: args => ['content', { contentId: args.requested_content_id }],
  get_go_practice_content_v3: args => ['content', { contentId: args.requested_content_id }],
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
  get_go_hosted_experience_v2: args => ['roomSnapshot', { sessionId: args.requested_session_id }],
  get_go_hosted_timing: args => ['roomTiming', { sessionId: args.requested_session_id }],
  submit_go_hosted_answer: args => ['roomAnswer', {
    sessionId: args.requested_session_id, questionId: args.requested_question_id,
    answer: args.requested_answer, position: args.expected_question_position,
  }],
  get_go_global_ranking: args => ['ranking', { period: args.requested_period }],
  get_my_go_progress: () => ['progress', {}],
}

// An explicit player-only allowlist, not a generic RPC forwarding mechanism.
export function agentGoOperation(name, args = {}) {
  return Object.hasOwn(actions, name) ? actions[name](args) : null
}
