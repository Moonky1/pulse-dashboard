import { audienceLabel, languageLabel, typeLabel } from './builderModel.js'

export function StudioReview({ details }) {
  return <div className="studio-review"><div className="studio-review-summary"><p className="studio-eyebrow">{typeLabel(details.content.content_type)} · {languageLabel(details.content.language)}</p><h2>{details.content.title}</h2><p>{details.content.description}</p><dl><div><dt>Topics</dt><dd>{details.topics.map(t => t.name).join(', ')}</dd></div><div><dt>Audience</dt><dd>{audienceLabel(details.audience)}</dd></div><div><dt>Job positions</dt><dd>{details.position_targets.map(p => p.name).join(', ') || 'All positions'}</dd></div><div><dt>Questions</dt><dd>{details.questions.length}</dd></div></dl></div>
    {details.questions.map((q, i) => <article className="studio-review-question" key={q.id || i}><p className="studio-eyebrow">Question {i + 1}</p><h3>{q.prompt}</h3>{q.answer_options.length > 0 && <ol type="A">{q.answer_options.map((o, oi) => <li key={oi} className={q.correct_answer === oi ? 'studio-correct' : ''}>{o}{q.correct_answer === oi ? ' ✓' : ''}</li>)}</ol>}<p className="studio-correct">Answer: {q.question_type === 'multiple_choice' ? q.answer_options[q.correct_answer] : q.question_type === 'true_false' ? q.correct_answer ? 'True' : 'False' : q.correct_answer.join(' / ')}</p>{q.explanation && <p>{q.explanation}</p>}</article>)}
  </div>
}
