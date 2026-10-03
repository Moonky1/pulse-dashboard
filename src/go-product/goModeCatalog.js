export const ORIGINAL_MODE_CODES = Object.freeze([
  'classic', 'valid-invalid', 'disposition-trainer', 'eligible',
  'objection-battle', 'certification',
])

const knownModes = new Set(ORIGINAL_MODE_CODES)

export function classifyGoCatalog(items, groups, language) {
  const itemById = new Map(items.map(item => [item.id, item]))
  const classifiedIds = new Set()
  const modeItems = {}
  for (const group of groups || []) {
    if (!knownModes.has(group?.game_mode)) continue
    const item = itemById.get(group.id)
    if (!item || item.language !== language || item.authorship_kind !== 'pulse') continue
    classifiedIds.add(item.id)
    if (!group.review_required && group.game_mode !== 'classic') {
      modeItems[group.game_mode] = item
    }
  }
  return { modeItems, otherGames: items.filter(item =>
    !classifiedIds.has(item.id) && item.authorship_kind === 'staff' &&
    Number(item.question_count) >= 10) }
}

export function modeForContent(groups, contentId) {
  return (groups || []).find(group => group.id === contentId && knownModes.has(group.game_mode))?.game_mode || 'classic'
}
