import { Button } from '../components/ui/Button.jsx'
import { formatPracticeReviewAnswer } from './goPracticeReview.js'

const REVIEW_LABELS = {
  'valid-invalid': { en: ['Your decision', 'Correct decision', 'Why'], es: ['Tu decisión', 'Decisión correcta', 'Por qué'] },
  'disposition-trainer': { en: ['Your disposition', 'Correct disposition', 'Why'], es: ['Tu disposición', 'Disposición correcta', 'Por qué'] },
  eligible: { en: ['Your decision', 'Correct decision', 'Reason'], es: ['Tu decisión', 'Decisión correcta', 'Motivo'] },
  'objection-battle': { en: ['Your response', 'Recommended response', 'Coaching note'], es: ['Tu respuesta', 'Respuesta recomendada', 'Consejo'] },
}

export function GoPracticeReview({ questions, loading, error, onRetry, language = 'en', mode = 'classic' }) {
  const es = language === 'es'
  const labels = REVIEW_LABELS[mode]?.[language] || (es ? ['Tu respuesta', 'Respuesta correcta', 'Explicación'] : ['Your answer', 'Correct answer', 'Explanation'])
  return <section className="go-practice-review" aria-label={es ? 'Revisión de respuestas' : 'Answer review'}>
    <header><p className="go-eyebrow">{es ? 'TU RONDA' : 'YOUR ROUND'}</p><h2>{es ? 'Revisa tus respuestas' : 'Review your answers'}</h2></header>
    {loading && <p role="status">{es ? 'Preparando las explicaciones…' : 'Loading explanations…'}</p>}
    {error && <div role="alert" className="go-practice-review__error"><p>{es ? 'No pudimos cargar las explicaciones todavía.' : 'We couldn’t load the explanations yet.'}</p><Button variant="secondary" onClick={onRetry}>{es ? 'Reintentar' : 'Try again'}</Button></div>}
    {!!questions?.length && <ol>{questions.map(question => <li className={`go-practice-review__item${question.is_correct ? ' go-practice-review__item--correct' : ''}`} key={question.position}>
      <div className="go-practice-review__top"><span>{String(question.position).padStart(2, '0')}</span><strong>{question.is_correct ? (es ? 'Correcta' : 'Correct') : (es ? 'Para repasar' : 'Review')}</strong></div>
      {mode === 'objection-battle' && <span className="go-practice-review__scenario-label">{es ? 'OBJECIÓN DEL CLIENTE' : 'CUSTOMER OBJECTION'}</span>}
      <h3>{question.prompt}</h3>
      <dl>
        <div><dt>{labels[0]}</dt><dd>{formatPracticeReviewAnswer(question, question.submitted_answer, language)}</dd></div>
        <div><dt>{labels[1]}</dt><dd>{formatPracticeReviewAnswer(question, question.correct_answer, language)}</dd></div>
      </dl>
      <p><strong>{labels[2]}</strong><span>{question.explanation || (es ? 'El creador aún no agregó una explicación.' : 'The creator has not added an explanation yet.')}</span></p>
    </li>)}</ol>}
  </section>
}
