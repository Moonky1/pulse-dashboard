const MODE_COPY = {
  'valid-invalid': { en: ['TRANSFER DECISION', 'Choose your decision'], es: ['DECISIÓN DE TRANSFERENCIA', 'Elige tu decisión'] },
  'disposition-trainer': { en: ['CALL SCENARIO', 'Choose the disposition'], es: ['SITUACIÓN DE LLAMADA', 'Elige la disposición'] },
  eligible: { en: ['QUALIFICATION CHECK', 'Does this qualify?'], es: ['EVALUACIÓN DE ELEGIBILIDAD', '¿Cumple los requisitos?'] },
  'objection-battle': { en: ['CUSTOMER', 'YOUR RESPONSE'], es: ['CLIENTE', 'TU RESPUESTA'] },
  certification: { en: ['CERTIFICATION', 'Choose one answer'], es: ['CERTIFICACIÓN', 'Elige una respuesta'] },
}

export function GoModePrompt({ mode, question, language = 'en', heading = 'h1' }) {
  const copy = MODE_COPY[mode]?.[language] || MODE_COPY[mode]?.en
  const title = heading === 'h2' ? <h2>{question.prompt}</h2> : <h1>{question.prompt}</h1>
  if (!copy) return title
  return <div className={`go-mode-prompt go-mode-prompt--${mode}`}>
    <span>{copy[0]}</span>{title}
  </div>
}

export function GoModeAnswers({ mode, question, answer, onChange, disabled = false, language = 'en' }) {
  const copy = MODE_COPY[mode]?.[language] || MODE_COPY[mode]?.en
  const options = question.answer_options || []
  if (!copy || question.question_type !== 'multiple_choice') return null
  return <fieldset className={`go-mode-answers go-mode-answers--${mode}`} disabled={disabled}>
    <legend>{copy[1]}</legend>
    <div>{options.map((option, index) => <button type="button" key={index} aria-pressed={answer === index}
      className={answer === index ? 'is-selected' : ''} onClick={() => onChange(index)}>
      {(mode === 'valid-invalid' || mode === 'eligible') && <span className="go-mode-answers__decision-icon" aria-hidden="true">{index === 0 ? '✓' : '×'}</span>}
      {mode === 'disposition-trainer' && <span className="go-mode-answers__index">{String(index + 1).padStart(2, '0')}</span>}
      {mode === 'objection-battle' && <span className="go-mode-answers__speaker">{language === 'es' ? 'AGENTE' : 'AGENT'}</span>}
      <strong>{option}</strong>
    </button>)}</div>
  </fieldset>
}
