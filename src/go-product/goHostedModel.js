const STATES = new Set(['lobby', 'active', 'completed', 'cancelled', 'expired'])

export function normalizeRoomCode(value) {
  const compact = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^KK\d{4}$/.test(compact) ? `KK ${compact.slice(2)}` : compact.slice(0, 6)
}

export function normalizeHostedRoom(value) {
  if (!value || !STATES.has(value.status) || !['host', 'participant'].includes(value.viewer_role)) return null
  if (!Number.isInteger(value.version) || value.version < 1) return null
  if (value.current_question && Object.keys(value.current_question).some(key => /correct|explanation/i.test(key))) return null
  return value
}

export function roomPath(room) {
  return room?.viewer_role === 'host'
    ? `/go/host/${room.session_id}`
    : `/go/room/${room.session_id}`
}

export function hostedAnswerReady(question, answer) {
  if (question?.question_type === 'multiple_choice') return Number.isInteger(answer) && answer >= 0
  if (question?.question_type === 'true_false') return typeof answer === 'boolean'
  return question?.question_type === 'text' && typeof answer === 'string' && answer.trim().length > 0
}

export function languagePresentation(language) {
  return language === 'es' ? { flag: '🇲🇽', label: 'Español' } : { flag: '🇺🇸', label: 'English' }
}

export function resultMedal(score) {
  const value = Number(score)
  if (value >= 85) return { image: '/emojis/medal1.webp', label: 'Outstanding run' }
  if (value >= 65) return { image: '/emojis/medal2.webp', label: 'Strong finish' }
  return { image: '/emojis/medal3.webp', label: 'Keep building' }
}
