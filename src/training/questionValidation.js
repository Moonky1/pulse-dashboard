export function validateQuestions(questions, contentTopicIds = null) {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) return 'Add between 1 and 100 questions.'
  const text = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit
  for (const [index, q] of questions.entries()) {
    const prefix = `Question ${index + 1}: `
    if (!q || !text(q.prompt, 2000) || q.prompt.trim().length < 2) return prefix + 'write a prompt between 2 and 2,000 characters.'
    if (q.position !== index + 1) return prefix + 'check the question order.'
    if ((q.explanation || '').length > 4000) return prefix + 'keep the explanation within 4,000 characters.'
    if (!Array.isArray(q.topic_ids) || !q.topic_ids.length || (contentTopicIds && q.topic_ids.some(id => !contentTopicIds.includes(id)))) return prefix + 'choose a topic from this item.'
    if (!Array.isArray(q.answer_options)) return prefix + 'check the answer options.'
    if (q.question_type === 'multiple_choice') {
      if (q.answer_options.length < 2 || q.answer_options.length > 8 || q.answer_options.some(o => !text(o, 1000))) return prefix + 'write 2–8 non-empty options (up to 1,000 characters each).'
      if (!Number.isInteger(q.correct_answer) || q.correct_answer < 0 || q.correct_answer >= q.answer_options.length) return prefix + 'choose the correct answer.'
    } else if (q.question_type === 'true_false') {
      if (q.answer_options.length || typeof q.correct_answer !== 'boolean') return prefix + 'choose True or False.'
    } else if (q.question_type === 'text') {
      if (q.answer_options.length || !Array.isArray(q.correct_answer) || !q.correct_answer.length || q.correct_answer.some(a => !text(a, 1000))) return prefix + 'write at least one accepted answer.'
    } else return prefix + 'choose a question type.'
  }
  return null
}
