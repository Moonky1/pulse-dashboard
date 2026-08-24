export const TEAM_MAP = {
  Global: 'global', Philippines: 'philippines', Venezuela: 'venezuela',
  Colombia: 'colombia', 'Mexico Baja': 'mexico', 'Mexico BJ': 'mexico',
  'Central America': 'central', Asia: 'asia',
}

export const ROLE_MAP = {
  Global: 'global', Supervisor: 'supervisor', QA: 'qa', 'Team Leader': 'leader',
}

export function mapLegacyValue(value, map) {
  return Object.entries(map).find(
    ([label]) => label.toLowerCase() === String(value || '').toLowerCase()
  )?.[1] || null
}

export function normalizeCorporateEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function isExpectedCorporateEmail(value) {
  return /^[^\s@]+@kampaignkings\.com$/i.test(normalizeCorporateEmail(value))
}

export function createCompatibilityProfile(profile) {
  if (!profile?.legacy_user_id || !profile?.name) {
    throw new Error('INVALID_COMPATIBILITY_PROFILE')
  }

  return {
    legacyUserId: profile.legacy_user_id,
    name: profile.name,
    team: mapLegacyValue(profile.team, TEAM_MAP),
    role: mapLegacyValue(profile.role, ROLE_MAP),
    agentExt: profile.agentExt || null,
    rowIndex: profile.rowIndex || null,
    bookId: profile.bookId || null,
  }
}

export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/dashboard'
  } catch {
    return '/dashboard'
  }
}

