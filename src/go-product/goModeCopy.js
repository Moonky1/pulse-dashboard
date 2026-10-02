export function goModeResultLine(mode, correct, total, language = 'en') {
  const es = language === 'es'
  const label = {
    'valid-invalid': es ? 'decisiones de transferencia correctas' : 'correct transfer decisions',
    'disposition-trainer': es ? 'llamadas clasificadas correctamente' : 'correctly disposed calls',
    eligible: es ? 'decisiones de elegibilidad correctas' : 'correct eligibility decisions',
    'objection-battle': es ? 'respuestas recomendadas' : 'recommended responses',
  }[mode]
  return label ? `${correct} / ${total} ${label}` : `${correct} / ${total} ${es ? 'correctas' : 'correct'}`
}

export function goResultHeading(score, language = 'en') {
  if (language !== 'es') return Number(score) >= 85 ? 'Outstanding run' : Number(score) >= 65 ? 'Strong finish' : 'Keep building'
  return Number(score) >= 85 ? 'Excelente ronda' : Number(score) >= 65 ? 'Buen resultado' : 'Sigue practicando'
}
