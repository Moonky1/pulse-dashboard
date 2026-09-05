export const typeLabel = value => ({ quiz: 'Quiz', assessment: 'Assessment' }[value] || 'Lesson')
export const languageLabel = value => value === 'es' ? 'Español' : 'English'
export const audienceLabel = audience => audience?.scope_type === 'campaign' ? audience.campaign_name : audience?.scope_type === 'team' ? audience.team_name : 'Everyone'
export const emptyDraft = () => ({ contentType: '', title: '', description: '', language: 'en', topicIds: [], scopeType: '', campaignId: '', teamId: '', positionIds: [] })
export function draftFromDetails(data) {
  return { contentType: data.content.content_type, title: data.content.title, description: data.content.description || '', language: data.content.language,
    topicIds: data.topics.map(t => t.id), scopeType: data.audience.scope_type, campaignId: data.audience.campaign_id || '', teamId: data.audience.team_id || '', positionIds: data.position_targets.map(p => p.id) }
}
export function questionsFromDetails(data) {
  return data.questions.map(q => ({ position: q.position, question_type: q.question_type, prompt: q.prompt, answer_options: q.answer_options,
    correct_answer: q.correct_answer, explanation: q.explanation || '', topic_ids: q.topic_ids, media_id: q.media_id || null }))
}
export function newQuestion(topicIds) {
  return { position: 1, question_type: 'multiple_choice', prompt: '', answer_options: ['', ''], correct_answer: 0, explanation: '', topic_ids: topicIds.slice(0, 1), media_id: null }
}
export const orderedQuestions = questions => questions.map((q, i) => ({ ...q, position: i + 1 }))
export function validateBasics(draft) {
  if (!['quiz', 'assessment'].includes(draft.contentType)) return 'Choose Quiz or Assessment.'
  if (draft.title.trim().length < 2 || draft.title.trim().length > 180) return 'Give this item a title between 2 and 180 characters.'
  if (draft.description.trim().length > 2000) return 'Keep the description within 2,000 characters.'
  if (!draft.topicIds.length) return 'Choose at least one topic.'
  return null
}
export function validateAudience(draft, options, capabilities) {
  if (draft.scopeType === 'global' && capabilities?.can_create_global) return null
  if (draft.scopeType === 'campaign' && options?.campaigns?.some(c => c.id === draft.campaignId)) return null
  if (draft.scopeType === 'team' && options?.teams?.some(t => t.id === draft.teamId)) return null
  return 'Choose an available audience.'
}
