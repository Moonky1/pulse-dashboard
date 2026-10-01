import { Button } from '../components/ui/Button.jsx'
import { formatPracticeReviewAnswer } from './goPracticeReview.js'

export function GoPracticeReview({ questions, loading, error, onRetry, language = 'en' }) {
  const es = language === 'es'
  return <section className="go-practice-review" aria-label={es ? 'Revisión de respuestas' : 'Answer review'}>
    <header><p className="go-eyebrow">{es ? 'TU RONDA' : 'YOUR ROUND'}</p><h2>{es ? 'Revisa tus respuestas' : 'Review your answers'}</h2></header>
    {loading && <p role="status">{es ? 'Preparando las explicaciones…' : 'Loading explanations…'}</p>}
    {error && <div role="alert" className="go-practice-review__error"><p>{es ? 'No pudimos cargar las explicaciones todavía.' : 'We couldn’t load the explanations yet.'}</p><Button variant="secondary" onClick={onRetry}>{es ? 'Reintentar' : 'Try again'}</Button></div>}
    {!!questions?.length && <ol>{questions.map(question => <li className={`go-practice-review__item${question.is_correct ? ' go-practice-review__item--correct' : ''}`} key={question.position}>
      <div className="go-practice-review__top"><span>{String(question.position).padStart(2, '0')}</span><strong>{question.is_correct ? (es ? 'Correcta' : 'Correct') : (es ? 'Para repasar' : 'Review')}</strong></div>
      <h3>{question.prompt}</h3>
      <dl>
        <div><dt>{es ? 'Tu respuesta' : 'Your answer'}</dt><dd>{formatPracticeReviewAnswer(question, question.submitted_answer, language)}</dd></div>
        <div><dt>{es ? 'Respuesta correcta' : 'Correct answer'}</dt><dd>{formatPracticeReviewAnswer(question, question.correct_answer, language)}</dd></div>
      </dl>
      <p><strong>{es ? 'Explicación' : 'Explanation'}</strong><span>{question.explanation || (es ? 'El creador aún no agregó una explicación.' : 'The creator has not added an explanation yet.')}</span></p>
    </li>)}</ol>}
  </section>
}
