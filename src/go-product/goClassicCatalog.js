const LEVELS = {
  en: [
    { key: 'easy', title: 'Classic Quiz · Easy', label: 'Easy' },
    { key: 'medium', title: 'Classic Quiz · Medium', label: 'Medium' },
    { key: 'advanced', title: 'Classic Quiz · Advanced', label: 'Advanced' },
  ],
  es: [
    { key: 'easy', title: 'Classic Quiz · Fácil', label: 'Fácil' },
    { key: 'medium', title: 'Classic Quiz · Medio', label: 'Medio' },
    { key: 'advanced', title: 'Classic Quiz · Avanzado', label: 'Avanzado' },
  ],
}

const LEVEL_DESCRIPTIONS = {
  en: {
    easy: 'Basics for new agents: consent, eligibility and safe wording.',
    medium: 'Real scenarios for quality judgment and call-flow decisions.',
    advanced: 'Challenging consent, handoff, eligibility and compliance scenarios.',
  },
  es: {
    easy: 'Fundamentos: consentimiento, elegibilidad y lenguaje seguro.',
    medium: 'Escenarios para evaluar decisiones de calidad y flujo de llamadas.',
    advanced: 'Casos exigentes de consentimiento, transferencias y cumplimiento.',
  },
}

export function classicLevelDescription(language, level) {
  return LEVEL_DESCRIPTIONS[language]?.[level] || ''
}

export function isPublishedClassicLevel(item) {
  return item?.content_type === 'quiz' && item.question_count === 40 &&
    LEVELS[item.language]?.some(level => level.title === item.title) === true &&
    item.topics?.some(topic => topic.code === 'product_skills') === true
}

export function classicHostLevels(items, language) {
  if (!LEVELS[language]) return []
  return LEVELS[language].map(level => {
    const item = items.find(candidate => isPublishedClassicLevel(candidate) &&
      candidate.language === language && candidate.title === level.title)
    return item ? { ...item, level: level.key, levelLabel: level.label } : null
  }).filter(Boolean)
}

export function classicPracticeLevels(items, language) {
  if (!LEVELS[language]) return []
  return LEVELS[language].map(level => {
    const item = items.find(candidate => candidate?.content_type === 'quiz' &&
      candidate.language === language && candidate.title === level.title &&
      candidate.topics?.some(topic => topic.code === 'product_skills'))
    return item ? { ...item, level: level.key, levelLabel: level.label } : null
  }).filter(Boolean)
}
