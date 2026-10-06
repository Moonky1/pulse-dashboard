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

const TEAM_GRADIENTS = Object.freeze({
  asia_team_a: ['#103846', '#173c69', '#332b51', '#76d9f2'],
  asia_team_b: ['#203b64', '#30335f', '#45305d', '#b4c0ff'],
  philippines: ['#183d61', '#16484c', '#203650', '#86dce7'],
  colombia: ['#493b23', '#563226', '#452c35', '#ffd09a'],
  nicaragua: ['#193a61', '#283b69', '#253047', '#a6caff'],
  mexico_team_group_a: ['#173e2f', '#20483f', '#173d45', '#96e2bd'],
  mexico_team_group_b: ['#1c443d', '#174d4a', '#223f50', '#8ee0cd'],
  venezuela: ['#4c4023', '#51402a', '#3b3229', '#ffe0a2'],
  central_america: ['#153d42', '#1b4845', '#263e51', '#90ded4'],
})

const TONE_GRADIENTS = Object.freeze({
  azure: ['#183d61', '#224963', '#273957', '#9dd4ff'],
  'deep-blue': ['#192e53', '#213a60', '#303f58', '#afc7ff'],
  gold: ['#493b23', '#563c2b', '#423a31', '#ffd09a'],
  crimson: ['#492c38', '#4c3044', '#3b314b', '#f9b8c9'],
  green: ['#173e2f', '#284936', '#1e403e', '#96e2bd'],
  emerald: ['#1c443d', '#214d46', '#254450', '#8ee0cd'],
  teal: ['#103846', '#174751', '#303e55', '#76d9f2'],
  cyan: ['#203b64', '#29405e', '#303a5b', '#b4c0ff'],
  violet: ['#342e55', '#3c325f', '#413353', '#d0c0ff'],
  copper: ['#4a342a', '#4e3c2f', '#403537', '#e9bc9e'],
  rose: ['#4a3045', '#4c3550', '#3e3451', '#efb5d9'],
  plum: ['#3e2b4b', '#473354', '#3a3555', '#d5b7f3'],
  lime: ['#343e26', '#3b472f', '#2f4135', '#c5de9f'],
  amber: ['#4b3b25', '#4e4130', '#423a32', '#eed49b'],
  slate: ['#263548', '#333451', '#273641', '#d3dcef'],
})

export function teamVisual(identity = {}) {
  const key = normalized(identity.code)
  const palette = normalized(identity.campaignCode) === 'auto_warranty_garrett' ? TEAM_GRADIENTS[key] : null
  const colors = palette || TONE_GRADIENTS[teamTone(identity)] || TONE_GRADIENTS.slate
  return {
    gradient: `linear-gradient(125deg, ${colors[0]}, ${colors[1]} 58%, ${colors[2]})`,
    border: `${colors[3]}70`, text: '#f0f5ff', accent: colors[3],
    softGlow: `0 2px 15px ${colors[3]}20`, stops: colors.slice(0, 3),
  }
}

export function teamBadgeStyle(identity) {
  const visual = teamVisual(identity)
  return { background: visual.gradient, borderColor: visual.border, color: visual.text, boxShadow: visual.softGlow }
}

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
