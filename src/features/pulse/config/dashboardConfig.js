// src/pages/dashboardConfig.js

export const CLEAN_START_DATE = '2026-03-23'
export const OFFICIAL_DATA_START = '2026-03-23'
export const POLL_MS = 10000
export const SUPABASE_PAGE_SIZE = 1000

export const MEDALS = [
  '/emojis/medal1.webp',
  '/emojis/medal2.webp',
  '/emojis/medal3.webp',
]

export const TEAM_RANK_EMOJIS = [
  '/emojis/goal1.webp',
  '/emojis/goal3.webp',
  '/emojis/goal4.webp',
]

export const TEAM_TARGETS = {
  asia: 20,
  philippines: 10,
  colombia: 10,
  central: 10,
  mexico: 10,
  venezuela: 10,
}

export const TEAMS = {
  asia: {
    id: 'asia',
    label: 'Asia',
    short: 'Asia',
    flag: '/flags/asia.png',
  },

  philippines: {
    id: 'philippines',
    label: 'Philippines',
    short: 'Philippines',
    flag: '/flags/philippines.png',
  },

  colombia: {
    id: 'colombia',
    label: 'Colombia',
    short: 'Colombia',
    flag: '/flags/colombia.png',
  },

  central: {
    id: 'central',
    label: 'Central America',
    short: 'Central',
    flag: null,
  },

  mexico: {
    id: 'mexico',
    label: 'Mexico Baja',
    short: 'Mexico',
    flag: '/flags/mexico.png',
  },

  venezuela: {
    id: 'venezuela',
    label: 'Venezuela',
    short: 'Venezuela',
    flag: '/flags/venezuela.png',
  },
}

export const TEAM_ORDER = [
  'asia',
  'philippines',
  'colombia',
  'central',
  'mexico',
  'venezuela',
]

export const SORT_OPTIONS = [
  { id: 'english', label: 'English Xfers' },
  { id: 'spanish', label: 'Spanish Xfers' },
  { id: 'total', label: 'Total Xfers' },
]

export const TEAM_COLORS = {
  philippines: '#38bdf8',
  mexico: '#34d399',
  colombia: '#f59e0b',
  asia: '#8b5cf6',
  central: '#fb923c',
  venezuela: '#fb7185',
}

export const BUSINESS_HOURS = {
  weekday: [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ],

  saturday: [
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ],
}

export const SIDEBAR_GROUPS = [
  {
    title: 'WORKSPACE',
    items: [
      { id: 'overview', label: 'Overview', icon: '▦' },
      { id: 'analytics', label: 'Analytics', icon: '▥' },
      { id: 'rankings', label: 'Rankings', icon: '🏆' },
      { id: 'teams', label: 'Teams', icon: '👥' },
      { id: 'commissions', label: 'Commissions', icon: '$' },
    ],
  },

  {
    title: 'APPS',
    items: [
      { id: 'pulse-go', label: 'Pulse GO', icon: '⚡' },
      { id: 'academy', label: 'Academy', icon: '📖' },
    ],
  },

  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️' },
      { id: 'support', label: 'Support', icon: '◎' },
    ],
  },
]