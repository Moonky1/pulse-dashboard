const TEAM_TONES = Object.freeze({
  'auto_warranty_garrett:philippines': 'azure',
  'auto_warranty_garrett:venezuela': 'deep-blue',
  'auto_warranty_garrett:colombia': 'gold',
  'auto_warranty_garrett:central_america': 'crimson',
  'auto_warranty_garrett:mexico_team_group_a': 'green',
  'auto_warranty_garrett:mexico_team_group_b': 'emerald',
  'auto_warranty_garrett:asia_team_a': 'teal',
  'auto_warranty_garrett:asia_team_b': 'cyan',
  'auto_warranty_garrett:nicaragua': 'violet',
  'auto_warranty_garrett:junior_closers': 'copper',
  'auto_warranty_joe:latam': 'rose',
  'auto_warranty_joe:nicaragua': 'plum',
  'auto_warranty_joe:mexico': 'lime',
  'auto_warranty_joe:junior_closers': 'amber',
  recruitment: 'rose',
  qa_closers: 'teal',
  qa_trainers_openers: 'violet',
  compliance: 'emerald',
  retention: 'cyan',
  welcome_calls: 'azure',
  collections: 'gold',
  ccr: 'deep-blue',
  dialer_management: 'cyan',
  administrative_support: 'slate',
})

const ROLE_TONES = Object.freeze({
  super_admin: 'iridescent',
  admin: 'indigo',
  supervisor: 'amber',
  team_leader: 'cyan',
  team_lead: 'cyan',
  quality_assurance: 'teal',
  qa: 'teal',
  trainer: 'violet',
  human_resources: 'rose',
  recruiter: 'coral',
  legal: 'silver',
  accounting: 'gold',
  dialer_manager: 'blue',
  agent: 'steel',
  employee: 'steel',
})

const FALLBACK_TEAM_TONES = Object.freeze(['azure', 'violet', 'teal', 'gold', 'rose', 'emerald', 'slate'])

function normalized(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s/-]+/g, '_')
}

function stableIndex(value, length) {
  let hash = 0
  for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  return Math.abs(hash) % length
}

export function teamTone({ code, campaignCode } = {}) {
  const teamCode = normalized(code)
  const campaign = normalized(campaignCode)
  return TEAM_TONES[`${campaign}:${teamCode}`]
    ?? TEAM_TONES[teamCode]
    ?? FALLBACK_TEAM_TONES[stableIndex(`${campaign}:${teamCode}`, FALLBACK_TEAM_TONES.length)]
}

export function roleTone({ key, name } = {}) {
  const roleKey = normalized(key || name)
  if (ROLE_TONES[roleKey]) return ROLE_TONES[roleKey]
  if (roleKey.includes('super_admin')) return 'iridescent'
  if (roleKey.includes('admin')) return 'indigo'
  if (roleKey.includes('supervisor')) return 'amber'
  if (roleKey.includes('team_lead')) return 'cyan'
  if (roleKey.includes('quality') || roleKey.startsWith('qa')) return 'teal'
  if (roleKey.includes('trainer')) return 'violet'
  if (roleKey.includes('human_resources') || roleKey.includes('recruit')) return 'rose'
  if (roleKey.includes('legal')) return 'silver'
  if (roleKey.includes('account')) return 'gold'
  if (roleKey.includes('dialer')) return 'blue'
  return 'steel'
}

export function leadershipGroup(positionName = '') {
  const position = normalized(positionName)
  return position.includes('supervisor') || position.includes('team_lead') || position.includes('team_leader')
    ? 'leadership'
    : 'staff'
}
