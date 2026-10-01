export function normalizePracticeReview(value, attemptId) {
  if (value?.attempt_id !== attemptId || !Array.isArray(value.questions) || value.questions.length !== 10) return null
  if (value.questions.some((question, index) =>
    question.position !== index + 1 || typeof question.prompt !== 'string' ||
    !Array.isArray(question.answer_options) || typeof question.is_correct !== 'boolean' ||
    !Object.hasOwn(question, 'submitted_answer') || !Object.hasOwn(question, 'correct_answer'))) return null
  return value.questions
}

export function formatPracticeReviewAnswer(question, answer, language = 'en') {
  if (answer === null || answer === undefined) return language === 'es' ? 'Sin respuesta' : 'No answer'
  if (question.question_type === 'multiple_choice') return question.answer_options[answer] ?? String(answer)
  if (question.question_type === 'true_false') {
    if (answer === true) return language === 'es' ? 'Verdadero' : 'True'
    if (answer === false) return language === 'es' ? 'Falso' : 'False'
  }
  if (Array.isArray(answer)) return answer.join(' · ')
  return String(answer)
}
