const MODE_LABELS = {
  classic: 'Classic Quiz',
  'valid-invalid': 'Valid or Invalid XFER',
  'disposition-trainer': 'Dispose It',
  eligible: 'Eligible or Not Eligible',
  'objection-battle': 'Objection Battle',
  certification: 'Certification Mode',
}

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', advanced: 'Advanced' }

export function questionBankTitle(bank) {
  if (!bank) return null
  const mode = MODE_LABELS[bank.game_mode]
  if (!mode) return null
  const difficulty = bank.difficulty && DIFFICULTY_LABELS[bank.difficulty]
  return difficulty ? `${mode} · ${difficulty}` : mode
}

export function questionBankDifficulty(bank) {
  return DIFFICULTY_LABELS[bank?.difficulty] || null
}

export function questionBankModeOptions(items) {
  return [...new Set(items.map(item => item.question_bank?.game_mode).filter(Boolean))]
    .map(value => ({ value, label: MODE_LABELS[value] || value }))
}
