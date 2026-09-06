const SUPPORTED_TYPES = new Set(['multiple_choice', 'true_false', 'text'])

export function normalizePracticeContent(value) {
  if (!value || !Array.isArray(value.questions) || !value.questions.length) return null
  const questions = [...value.questions].sort((a, b) => a.position - b.position)
  if (questions.some(question => !SUPPORTED_TYPES.has(question.question_type))) return null
  return { ...value, questions }
}

export function isSafePracticePayload(value) {
  if (Array.isArray(value)) return value.every(isSafePracticePayload)
  if (!value || typeof value !== 'object') return true
  return Object.entries(value).every(([key, nested]) =>
    !['correct_answer', 'explanation'].includes(key.toLowerCase()) && isSafePracticePayload(nested))
}

export function normalizeCatalog(items = []) {
  return items.filter(item => item && ['quiz', 'assessment'].includes(item.content_type))
}

export function catalogOptions(items = []) {
  const languages = [...new Set(items.map(item => item.language).filter(Boolean))].sort()
  const topics = new Map()
  for (const item of items) for (const topic of item.topics || []) topics.set(topic.id, topic)
  return { languages, topics: [...topics.values()].sort((a, b) => a.name.localeCompare(b.name)) }
}

export function isAnswerReady(question, answer) {
  if (question?.question_type === 'multiple_choice') return Number.isInteger(answer) && answer >= 0
  if (question?.question_type === 'true_false') return typeof answer === 'boolean'
  if (question?.question_type === 'text') return typeof answer === 'string' && answer.trim().length > 0
  return false
}

export function buildAnswerSubmission(questions, answers) {
  return questions.map(question => ({ question_id: question.id, answer: answers[question.id] }))
}

export function normalizeResult(rows) {
  return Array.isArray(rows) ? rows[0] ?? null : rows ?? null
}
