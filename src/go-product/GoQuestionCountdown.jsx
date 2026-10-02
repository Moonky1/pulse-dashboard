export function GoQuestionCountdown({ timing, remainingMs, secondsLeft, language = 'en' }) {
  const limit = Number(timing?.time_limit_seconds) || 30
  const progress = remainingMs === null ? 100 : Math.max(0, Math.min(100, remainingMs / (limit * 1000) * 100))
  return <div className={`go-question-clock${secondsLeft !== null && secondsLeft <= 5 ? ' go-question-clock--urgent' : ''}`}>
    <div className="go-question-clock__label"><span>{language === 'es' ? 'Tiempo para responder' : 'Time to answer'}</span><strong role="timer" aria-live="off">{secondsLeft === null ? '—' : `${secondsLeft}s`}</strong></div>
    <div className="go-question-clock__track" role="progressbar" aria-label={language === 'es' ? 'Tiempo restante' : 'Time remaining'} aria-valuemin="0" aria-valuemax={limit} aria-valuenow={secondsLeft ?? limit}><span style={{ width: `${progress}%` }} /></div>
  </div>
}
