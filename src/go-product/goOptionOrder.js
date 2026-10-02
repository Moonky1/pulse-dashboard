const SHUFFLED_MODES = new Set(['disposition-trainer', 'objection-battle'])

function seedHash(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return hash >>> 0
}

export function orderedModeOptions(question, mode, roundSeed = '') {
  const options = (question.answer_options || []).map((option, originalIndex) => ({ option, originalIndex }))
  if (!SHUFFLED_MODES.has(mode) || options.length < 2) return options

  let state = seedHash(`${roundSeed}:${question.id}`) || 1
  for (let index = options.length - 1; index > 0; index -= 1) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    const swap = (state >>> 0) % (index + 1)
    ;[options[index], options[swap]] = [options[swap], options[index]]
  }
  return options
}
