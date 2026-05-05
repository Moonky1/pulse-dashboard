import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './dashboard.css'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const QA_SHEET_ID = '1rw-b5o5jK4O7uMP3-vSEtT6QgitUr-xyrP3GBIcm5ig'
const CLEAN_START_DATE = '2026-04-23'
const OFFICIAL_DATA_START = '2026-04-28'
const POLL_MS = 10000

const MEDALS = ['/emojis/medal1.webp', '/emojis/medal2.webp', '/emojis/medal3.webp']
const TEAM_RANK_EMOJIS = ['/emojis/goal1.webp', '/emojis/goal3.webp', '/emojis/goal4.webp']

const TEAM_TARGETS = {
  asia: 20,
  philippines: 10,
  colombia: 10,
  central: 10,
  mexico: 10,
  venezuela: 10,
}

const QA_SHEETS_BY_TEAM = {
  asia: ['ASIA - VICTOR', 'ASIA - ANTONIO'],
  philippines: ['PH - BETHANIE', 'PH - JAIRO'],
  colombia: ['COL - JHONATHAN', 'COL - DARLING'],
  central: ['CA - REYNALDO', 'CA - ANDRES'],
  mexico: ['MXBJ - DAHR', 'MXBJ - MIGUEL'],
  venezuela: ['VZ - PEDRO', 'VZ - MARTIN'],
}

const QA_DISPLAY_BY_TEAM = {
  asia: 'QA: Victor + Antonio',
  philippines: 'QA: Bethanie + Jairo',
  colombia: 'QA: Jhonathan + Darling',
  central: 'QA: Reynaldo + Andres',
  mexico: 'QA: Dahr + Miguel',
  venezuela: 'QA: Pedro + Martin',
}

const TEAMS = {
  asia: {
    id: 'asia',
    label: 'Asia',
    short: 'Asia',
    sheetName: 'AW GARRET ASIA LEXNER',
    sheetNameCandidates: ['AW GARRET ASIA LEXNER'],
    flag: '/flags/asia.png',
    extPrefix: '3',
    hasSpanish: true,
    live: true,
  },
  philippines: {
    id: 'philippines',
    label: 'Philippines',
    short: 'Philippines',
    sheetName: 'AW GARRET PHILIPPINES ',
    sheetNameCandidates: ['AW GARRET PHILIPPINES ', 'AW GARRET PHILIPPINES'],
    flag: '/flags/philippines.png',
    extPrefix: '1',
    hasSpanish: false,
    live: true,
  },
  colombia: {
    id: 'colombia',
    label: 'Colombia',
    short: 'Colombia',
    sheetName: 'AW GARRET COLOMBIA JUAN GARCIA',
    sheetNameCandidates: ['AW GARRET COLOMBIA JUAN GARCIA'],
    flag: '/flags/colombia.png',
    extPrefix: '2',
    hasSpanish: true,
    live: true,
  },
  central: {
    id: 'central',
    label: 'Central America',
    short: 'Central',
    sheetName: 'AW GARRET CENTRAL AMERICA - CAROLINA',
    sheetNameCandidates: ['AW GARRET CENTRAL AMERICA - CAROLINA'],
    flag: null,
    extPrefix: '4',
    hasSpanish: true,
    live: true,
  },
  mexico: {
    id: 'mexico',
    label: 'Mexico Baja',
    short: 'Mexico',
    sheetName: 'AW GARRET BAJA MX KEVIN',
    sheetNameCandidates: ['AW GARRET BAJA MX KEVIN'],
    flag: '/flags/mexico.png',
    extPrefix: '5',
    hasSpanish: false,
    live: true,
  },
  venezuela: {
    id: 'venezuela',
    label: 'Venezuela',
    short: 'Venezuela',
    sheetName: 'AW GARRET VENEZUELA PATRICIA',
    sheetNameCandidates: [
      'AW GARRET VENEZUELA PATRICIA',
      'AW GARRET VENEZUELA PATRICIA ',
      'AW GARRET VENEZUELA PATRICIA  ',
    ],
    flag: '/flags/venezuela.png',
    extPrefix: '6',
    hasSpanish: true,
    live: true,
  },
}

const TEAM_ORDER = ['asia', 'philippines', 'colombia', 'central', 'mexico', 'venezuela']

const SORT_OPTIONS = [
  { id: 'english', label: 'English Xfers' },
  { id: 'spanish', label: 'Spanish Xfers' },
  { id: 'total', label: 'Total Xfers' },
]
const SIDEBAR_GROUPS = [
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
      { id: 'alerts', label: 'Alerts', icon: '🔔' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
      { id: 'support', label: 'Support', icon: '◎' },
    ],
  },
]

const normalizeSearchText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function agentMatchesSearch(agent, query) {
  if (!query) return true

  const name = normalizeSearchText(agent?.name)
  const ext = normalizeSearchText(agent?.ext)

  return name.includes(query) || ext.includes(query)
}

function teamMatchesSearch(team, query) {
  if (!query) return true

  const label = normalizeSearchText(team?.label)
  const short = normalizeSearchText(team?.short)
  const id = normalizeSearchText(team?.id)

  return label.includes(query) || short.includes(query) || id.includes(query)
}

function filterParsedBySearch(parsed, query) {
  if (!parsed || !query) return parsed

  return {
    ...parsed,
    agents: (parsed.agents || []).filter(agent => agentMatchesSearch(agent, query)),
  }
}
function isOfficialDate(date) {
  if (!date) return true
  if (date === todayKey()) return true
  return String(date) >= OFFICIAL_DATA_START
}

function buildSearchSuggestions(teamData, query) {
  const q = normalizeSearchText(query)
  if (!q) return []

  const suggestions = []

  TEAM_ORDER.forEach(teamId => {
    const team = TEAMS[teamId]
    const parsed = teamData?.[teamId]

    const teamLabel = normalizeSearchText(team?.label)
    const teamShort = normalizeSearchText(team?.short)
    const teamKey = normalizeSearchText(teamId)

    if (teamLabel.includes(q) || teamShort.includes(q) || teamKey.includes(q)) {
      suggestions.push({
        type: 'team',
        id: teamId,
        label: team.label,
        sub: 'Team',
        icon: team.flag ? '🌐' : '🌎',
      })
    }

    ;(parsed?.agents || []).forEach(agent => {
      const name = normalizeSearchText(agent?.name)
      const ext = normalizeSearchText(agent?.ext)

      if (name.includes(q) || ext.includes(q)) {
        suggestions.push({
          type: 'agent',
          id: agent.ext,
          label: agent.name,
          sub: `${agent.ext} • ${team.label}`,
          icon: '👤',
        })
      }
    })
  })

  return suggestions.slice(0, 8)
}

function LovableSidebar({ collapsed, activeItem, onNavigate }) {
  return (
    <aside className={`lov-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="lov-brand">
        <div className="lov-brand-glow" />
        <span>Pulse</span>
      </div>

      <div className="lov-sidebar-scroll">
        {SIDEBAR_GROUPS.map(group => (
          <div className="lov-sidebar-group" key={group.title}>
            <div className="lov-sidebar-title">{group.title}</div>

            <div className="lov-sidebar-list">
              {group.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  className={`lov-sidebar-item ${activeItem === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item)}
                >
                  <span className="lov-sidebar-icon">{item.icon}</span>
                  <span className="lov-sidebar-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="lov-sidebar-status">
        <div className="lov-status-dot-row">
          <span className="lov-status-dot" />
          <strong>Pulse GO active</strong>
        </div>
        <span>All systems nominal</span>
      </div>
    </aside>
  )
}

function LovableHeader({
  sidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  suggestions = [],
  onSuggestionClick,
  userMenuOpen,
  onToggleUserMenu,
  onUserAction,
}) {
  return (
    <header className="lov-header">
      <button
        type="button"
        className={`lov-icon-btn lov-menu-toggle ${sidebarCollapsed ? 'active' : ''}`}
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        ☰
      </button>

      <div className="lov-search-wrap">
        <div className="lov-search">
          <span className="lov-search-icon">⌕</span>

          <input
            value={searchQuery}
            placeholder="Search agent name or extension..."
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSearchSubmit()
            }}
          />

          {searchQuery ? (
            <button
              type="button"
              className="lov-search-clear"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        {searchQuery && suggestions.length > 0 ? (
          <div className="lov-search-suggestions">
            {suggestions.map(item => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="lov-search-suggestion"
                onClick={() => onSuggestionClick(item)}
              >
                <span className="lov-suggestion-icon">{item.icon}</span>

                <span className="lov-suggestion-text">
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </span>

                <span className="lov-suggestion-action">
                  {item.type === 'agent' ? 'Open profile' : 'Open team'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lov-live-pill">● Today — LIVE</div>

      <nav className="lov-nav-pill">
        <button type="button" className="active">Home</button>
        <button type="button">Pulse GO</button>
        <button type="button">Academy</button>
      </nav>

      <div className="lov-header-actions">
        <button type="button" className="lov-icon-btn">◔</button>
        <button type="button" className="lov-icon-btn">🔔</button>

        <div className="lov-user-wrap">
          <button type="button" className="lov-user" onClick={onToggleUserMenu}>
            <div>
              <strong>Simon</strong>
              <span>Asia · Team Leader</span>
            </div>
            <div className="lov-avatar">SM</div>
          </button>

          {userMenuOpen ? (
            <div className="lov-user-menu">
              <button type="button" onClick={() => onUserAction('profile')}>
                👤 Profile
              </button>
              <button type="button" onClick={() => onUserAction('settings')}>
                ⚙️ Settings
              </button>
              <button type="button" onClick={() => onUserAction('logout')}>
                🚪 Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function LovableKpi({ title, value, tone }) {
  return (
    <div className={`lov-kpi-card ${tone}`}>
      <div className="lov-kpi-title">{title}</div>
      <div className="lov-kpi-value">{Number(value || 0).toLocaleString()}</div>
    </div>
  )
}
const safeInt = (val) => parseInt(String(val ?? '').replace(/,/g, '').trim(), 10) || 0
const cellUpper = (val) => String(val ?? '').trim().toUpperCase()

const colombiaDate = () => new Date(Date.now() - 5 * 60 * 60 * 1000)

const todayKey = () => {
  const d = colombiaDate()

  // Business day protection:
  // After midnight until 3:59am Colombia time, still show previous work date.
  if (d.getUTCHours() < 4) {
    d.setUTCDate(d.getUTCDate() - 1)
  }

  return d.toISOString().slice(0, 10)
}

const colombiaHour = () => colombiaDate().getUTCHours()
const includeOT = () => colombiaHour() >= 18

function normalizeDate(raw) {
  if (!raw) return null

  const s = String(raw).trim()
  if (!s) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  let match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const first = Number(match[1])
    const second = Number(match[2])
    const year = Number(match[3])

    const month = first > 12 ? second : first
    const day = first > 12 ? first : second

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  match = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (match) {
    const first = Number(match[1])
    const second = Number(match[2])
    const year = Number(match[3])

    const month = first > 12 ? second : first
    const day = first > 12 ? first : second

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}-${m}-${day}`
}

function rowText(row, limit = 10) {
  return (row || []).slice(0, limit).map(cellUpper).join(' | ')
}

function isFooterRow(txt) {
  return (
    txt.includes('AGENT LOGGED IN') ||
    txt.includes('AGENTS LOGGED IN') ||
    txt.includes('AGENT LOGGE IN') ||
    txt.includes('AGENTS LOGGE IN') ||
    txt.includes('AGENT LOG IN') ||
    txt.includes('AGENTS LOG IN') ||
    txt.includes('TOTAL TRANSFERS')
  )
}

function findFooterTotalsInRows(rows, startIndex, endIndex, englishIndex, spanishIndex, totalIndex) {
  let footer = null
  const end = Math.min(endIndex, rows.length)

  for (let i = startIndex; i < end; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const colA = cellUpper(row[0])

    const looksLikeFooter = isFooterRow(txt) || (colA.includes('AGENTS') && colA.includes('LOG'))
    if (!looksLikeFooter) continue

    const english = safeInt(row[englishIndex])
    const spanish = safeInt(row[spanishIndex])
    const total = safeInt(row[totalIndex]) || (english + spanish)

    if (english > 0 || spanish > 0 || total > 0) {
      footer = { english, spanish, total }
    }
  }

  return footer
}

function buildAgent(name, ext, spanish, english) {
  const sp = safeInt(spanish)
  const en = safeInt(english)

  return {
    name: String(name || '').trim(),
    ext: String(ext || '').replace(/,/g, '').trim(),
    spanish: sp,
    english: en,
    invalidTransfers: 0,
    rawTotal: sp + en,
    total: sp + en,
  }
}

function emptyParsedTeam() {
  return {
    agents: [],
    totals: { english: 0, spanish: 0, total: 0, rawTotal: 0, activeAgents: 0 },
    mainTotals: { english: 0, spanish: 0, total: 0 },
    otTotals: { english: 0, spanish: 0, total: 0 },
    includesOT: false,
    invalidTransfers: 0,
  }
}

function isAgentRow(nameCell, extCell, prefix) {
  const name = cellUpper(nameCell)
  const ext = String(extCell || '').replace(/,/g, '').trim()

  if (!new RegExp(`^${prefix}\\d{3}$`).test(ext)) return false
  if (!name) return false

  const banned = [
    'MANAGEMENT',
    'USER',
    'USERS',
    'SUPERVISOR',
    'EXTENSION',
    'OPENERS',
    'TRANSFERS',
    'TRANSFER',
    'SPANISH',
    'ENGLISH',
    'TOTAL',
    'LEXNER',
    'GENERAL MANAGER',
    'PACIFIC STANDARD TIME',
    'BREAK',
    'LUNCH',
    'DAILY TARGET',
    'XFER PER HOUR',
    'THIS HOUR GOAL',
    'GOAL+',
    'OUR GOAL',
    'AGENT LOGGED IN',
    'AGENTS LOGGED IN',
    'AGENT LOGGE IN',
    'AGENTS LOGGE IN',
    'AGENT LOG IN',
    'AGENTS LOG IN',
    'COLOMBIA OT',
    'VENEZUELA OT',
    'OT AW GARRET VENEZUELA',
    'JUAN GARCIA',
    'ASIA',
    'PHILIPPINES',
    'CENTRAL AMERICA',
    'CAROLINA',
    'GERMAN',
    'PATRICIA ASTORINO',
    'OT TAKERS',
    'PHILIPPINES OT',
    'AW PHIL',
    'ARWIN',
    'PER AGENT',
  ]

  return !banned.some(word => name.includes(word))
}

function sortAgentsByMetric(agents, metric) {
  return [...(agents || [])].sort((a, b) => {
    if ((b?.[metric] || 0) !== (a?.[metric] || 0)) return (b?.[metric] || 0) - (a?.[metric] || 0)
    if ((b?.total || 0) !== (a?.total || 0)) return (b?.total || 0) - (a?.total || 0)
    if ((b?.english || 0) !== (a?.english || 0)) return (b?.english || 0) - (a?.english || 0)
    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
}

function mergeAgentByExt(map, agent, mode = 'sum') {
  const prev = map.get(agent.ext)

  if (!prev) {
    map.set(agent.ext, { ...agent })
    return
  }

  if (mode === 'max') {
    if (agent.rawTotal > prev.rawTotal) map.set(agent.ext, { ...agent })
    return
  }

  const spanish = prev.spanish + agent.spanish
  const english = prev.english + agent.english
  const rawTotal = spanish + english

  map.set(agent.ext, {
    ...prev,
    english,
    spanish,
    rawTotal,
    total: rawTotal,
  })
}

function mergeMainAndOT(mainList, otList) {
  const merged = new Map()

  mainList.forEach(agent => merged.set(agent.ext, { ...agent }))

  otList.forEach(agent => {
    const prev = merged.get(agent.ext)

    if (!prev) {
      merged.set(agent.ext, { ...agent })
      return
    }

    const spanish = prev.spanish + agent.spanish
    const english = prev.english + agent.english
    const rawTotal = spanish + english

    merged.set(agent.ext, {
      ...prev,
      english,
      spanish,
      rawTotal,
      total: rawTotal,
    })
  })

  return [...merged.values()]
}

function countReachedTarget(teamId, agents) {
  const target = TEAM_TARGETS[teamId] || 10
  return (agents || []).filter(agent => Number(agent.english || 0) >= target).length
}

function applyInvalidTransfersToParsed(parsed, invalidInfo) {
  const byExt = invalidInfo?.byExt || {}
  const totalInvalid = Number(invalidInfo?.total || 0)

  const agents = (parsed.agents || []).map(agent => {
    const invalidTransfers = Number(byExt[agent.ext] || 0)
    const rawTotal = Number(agent.spanish || 0) + Number(agent.english || 0)
    const total = Math.max(0, rawTotal - invalidTransfers)

    return {
      ...agent,
      invalidTransfers,
      rawTotal,
      total,
    }
  })

  const english = Number(parsed.totals?.english || 0)
  const spanish = Number(parsed.totals?.spanish || 0)
  const rawTotal = english + spanish
  const netTotal = Math.max(0, rawTotal - totalInvalid)

  return {
    ...parsed,
    agents: sortAgentsByMetric(agents, 'total'),
    totals: {
      ...parsed.totals,
      english,
      spanish,
      rawTotal,
      total: netTotal,
    },
    invalidTransfers: totalInvalid,
  }
}

function parseAsiaRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()

  let inOT = false
  let mainFooter = null
  let otFooter = null

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('OT TAKERS')) {
      inOT = true
      continue
    }

    if (isFooterRow(txt)) {
      const footer = {
        spanish: safeInt(row[2]),
        english: safeInt(row[3]),
        total: safeInt(row[4]) || (safeInt(row[2]) + safeInt(row[3])),
      }

      if (!inOT) mainFooter = footer
      else otFooter = footer

      continue
    }

    if (!isAgentRow(name, ext, '3')) continue

    const agent = buildAgent(name, ext, row[2], row[3])

    if (!inOT) mergeAgentByExt(mainAgents, agent, 'max')
    else mergeAgentByExt(otAgents, agent, 'sum')
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT ? [...otAgents.values()] : []
  const agents = sortAgentsByMetric(mergeMainAndOT(mainList, otList), 'total')

  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, a) => sum + a.spanish, 0)
  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, a) => sum + a.english, 0)

  const otSpanish = withOT ? (otFooter ? otFooter.spanish : otList.reduce((sum, a) => sum + a.spanish, 0)) : 0
  const otEnglish = withOT ? (otFooter ? otFooter.english : otList.reduce((sum, a) => sum + a.english, 0)) : 0

  const english = mainEnglish + otEnglish
  const spanish = mainSpanish + otSpanish
  const rawTotal = english + spanish

  return {
    agents,
    totals: {
      spanish,
      english,
      rawTotal,
      total: rawTotal,
      activeAgents: agents.length,
    },
    mainTotals: {
      spanish: mainSpanish,
      english: mainEnglish,
      total: mainSpanish + mainEnglish,
    },
    otTotals: {
      spanish: otSpanish,
      english: otEnglish,
      total: otSpanish + otEnglish,
    },
    includesOT: withOT,
    invalidTransfers: 0,
  }
}

function parsePhilippinesRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()

  let inOT = false
  let sawOTSection = false
  let mainFooter = 0
  let otFooter = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('AW PHIL')) {
      break
    }

    if (txt.includes('PHILIPPINES OT')) {
      sawOTSection = true
      inOT = true
      continue
    }

    if (!inOT && isFooterRow(txt)) {
      const footer = Math.max(safeInt(row[2]), safeInt(row[3]))
      if (footer > 0) mainFooter = footer
      continue
    }

    if (inOT && isFooterRow(txt)) {
      const footer = Math.max(safeInt(row[2]), safeInt(row[3]))
      if (footer > 0) otFooter = footer

      // Important: after OT footer, stop reading.
      break
    }

    if (!isAgentRow(name, ext, '1')) continue

    const english = safeInt(row[2])
    const agent = buildAgent(name, ext, 0, english)

    if (!inOT) mergeAgentByExt(mainAgents, agent, 'max')
    else mergeAgentByExt(otAgents, agent, 'sum')
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT && sawOTSection ? [...otAgents.values()] : []
  const agents = sortAgentsByMetric(mergeMainAndOT(mainList, otList), 'total')

  const mainEnglish = mainFooter > 0 ? mainFooter : mainList.reduce((sum, a) => sum + a.english, 0)
  const otEnglish = withOT ? (otFooter > 0 ? otFooter : otList.reduce((sum, a) => sum + a.english, 0)) : 0
  const english = mainEnglish + otEnglish
  const rawTotal = english

  return {
    agents,
    totals: {
      english,
      spanish: 0,
      rawTotal,
      total: rawTotal,
      activeAgents: agents.length,
    },
    mainTotals: {
      english: mainEnglish,
      spanish: 0,
      total: mainEnglish,
    },
    otTotals: {
      english: otEnglish,
      spanish: 0,
      total: otEnglish,
    },
    includesOT: withOT && sawOTSection,
    invalidTransfers: 0,
  }
}

function parseColombiaRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()

  let inOT = false
  let sawOTSection = false
  let mainFooter = null
  let otFooter = null

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('COLOMBIA OT')) {
      sawOTSection = true
      inOT = true
      continue
    }

    if (isFooterRow(txt)) {
      const footer = {
        english: safeInt(row[3]),
        spanish: safeInt(row[4]),
        total: safeInt(row[5]) || (safeInt(row[3]) + safeInt(row[4])),
      }

      if (!inOT) {
        if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) mainFooter = footer
      } else {
        if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) otFooter = footer

        // Important: after OT footer, stop reading.
        break
      }

      continue
    }

    if (!isAgentRow(name, ext, '2')) continue

    const english = safeInt(row[3])
    const spanish = safeInt(row[4])
    const agent = buildAgent(name, ext, spanish, english)

    if (!inOT) mergeAgentByExt(mainAgents, agent, 'max')
    else mergeAgentByExt(otAgents, agent, 'sum')
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT && sawOTSection ? [...otAgents.values()] : []
  const agents = sortAgentsByMetric(mergeMainAndOT(mainList, otList), 'total')

  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, a) => sum + a.english, 0)
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, a) => sum + a.spanish, 0)

  const otEnglish = withOT ? (otFooter ? otFooter.english : otList.reduce((sum, a) => sum + a.english, 0)) : 0
  const otSpanish = withOT ? (otFooter ? otFooter.spanish : otList.reduce((sum, a) => sum + a.spanish, 0)) : 0

  const english = mainEnglish + otEnglish
  const spanish = mainSpanish + otSpanish
  const rawTotal = english + spanish

  return {
    agents,
    totals: {
      english,
      spanish,
      rawTotal,
      total: rawTotal,
      activeAgents: agents.length,
    },
    mainTotals: {
      english: mainEnglish,
      spanish: mainSpanish,
      total: mainEnglish + mainSpanish,
    },
    otTotals: {
      english: otEnglish,
      spanish: otSpanish,
      total: otEnglish + otSpanish,
    },
    includesOT: withOT && sawOTSection,
    invalidTransfers: 0,
  }
}

function parseMexicoRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()

  let inOT = false
  let sawOTSection = false
  let mainFooter = 0
  let otFooter = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('MEXICO OT') || txt.includes('MEXICO BAJA OT')) {
      sawOTSection = true
      inOT = true
      continue
    }

    if (!inOT && isFooterRow(txt)) {
      const direct = safeInt(row[3])
      if (direct > 0) mainFooter = direct
      continue
    }

    if (inOT && isFooterRow(txt)) {
      const direct = safeInt(row[3])
      if (direct > 0) otFooter = direct
      continue
    }

    if (!isAgentRow(name, ext, '5')) continue

    const english = safeInt(row[3])
    const agent = buildAgent(name, ext, 0, english)

    if (!inOT) mergeAgentByExt(mainAgents, agent, 'max')
    else mergeAgentByExt(otAgents, agent, 'sum')
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT && sawOTSection ? [...otAgents.values()] : []
  const agents = sortAgentsByMetric(mergeMainAndOT(mainList, otList), 'total')

  const mainSum = mainList.reduce((sum, agent) => sum + agent.english, 0)
  const otSum = otList.reduce((sum, agent) => sum + agent.english, 0)

  const mainEnglish = mainFooter > 0 ? mainFooter : mainSum
  const otEnglish = withOT ? (otFooter > 0 ? otFooter : otSum) : 0
  const english = mainEnglish + otEnglish
  const rawTotal = english

  return {
    agents,
    totals: {
      english,
      spanish: 0,
      rawTotal,
      total: rawTotal,
      activeAgents: agents.length,
    },
    mainTotals: {
      english: mainEnglish,
      spanish: 0,
      total: mainEnglish,
    },
    otTotals: {
      english: otEnglish,
      spanish: 0,
      total: otEnglish,
    },
    includesOT: withOT,
    invalidTransfers: 0,
  }
}

function findDateInRow(row) {
  for (let i = 0; i < Math.min((row || []).length, 8); i++) {
    const date = normalizeDate(row[i])
    if (date) return date
  }

  return null
}

function parseVenezuelaRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()

  let inOT = false
  let sawOTSection = false
  let mainFooter = null
  let otFooter = null
  let otStartIndex = rows.length

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)

    if (txt.includes('OT AW GARRET VENEZUELA') || txt.includes('VENEZUELA OT')) {
      const otDate = findDateInRow(row)

      // If the OT block has an old date, do not read it.
      if (otDate && otDate !== todayKey()) {
        break
      }

      sawOTSection = true
      inOT = true
      otStartIndex = i
      continue
    }

    if (!inOT && isFooterRow(txt)) {
      const footer = {
        english: safeInt(row[3]),
        spanish: safeInt(row[4]),
        total: safeInt(row[5]) || (safeInt(row[3]) + safeInt(row[4])),
      }

      if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) {
        mainFooter = footer
      }

      continue
    }

    // Venezuela OT block is shifted one column to the right:
    // B = name, C = ext, D = English, E = Spanish, F = Total
    if (inOT) {
      const otName = String(row[1] || '').trim()
      const otExt = String(row[2] || '').replace(/,/g, '').trim()

      const otEnglish = safeInt(row[3])
      const otSpanish = safeInt(row[4])
      const otTotal = safeInt(row[5]) || (otEnglish + otSpanish)

      const looksLikeOTFooter =
        !isAgentRow(otName, otExt, '6') &&
        (otEnglish > 0 || otSpanish > 0 || otTotal > 0)

      if (looksLikeOTFooter) {
        otFooter = {
          english: otEnglish,
          spanish: otSpanish,
          total: otTotal,
        }
        break
      }

      if (!isAgentRow(otName, otExt, '6')) continue

      const agent = buildAgent(otName, otExt, otSpanish, otEnglish)
      mergeAgentByExt(otAgents, agent, 'sum')
      continue
    }

    // Main Venezuela block:
    // A = name, B = ext, D = English, E = Spanish, F = Total
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (!isAgentRow(name, ext, '6')) continue

    const english = safeInt(row[3])
    const spanish = safeInt(row[4])
    const agent = buildAgent(name, ext, spanish, english)

    mergeAgentByExt(mainAgents, agent, 'max')
  }

  const forcedMainFooter = findFooterTotalsInRows(rows, 0, otStartIndex, 3, 4, 5)

  if (forcedMainFooter) mainFooter = forcedMainFooter

  const mainList = [...mainAgents.values()]

  // For Venezuela: if today's OT block exists, include it.
  const useVenezuelaOT = sawOTSection
  const otList = useVenezuelaOT ? [...otAgents.values()] : []

  const agents = sortAgentsByMetric(mergeMainAndOT(mainList, otList), 'total')

  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, a) => sum + a.english, 0)
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, a) => sum + a.spanish, 0)

  const otEnglish = useVenezuelaOT
    ? (otFooter ? otFooter.english : otList.reduce((sum, a) => sum + a.english, 0))
    : 0

  const otSpanish = useVenezuelaOT
    ? (otFooter ? otFooter.spanish : otList.reduce((sum, a) => sum + a.spanish, 0))
    : 0

  const english = mainEnglish + otEnglish
  const spanish = mainSpanish + otSpanish
  const rawTotal = english + spanish

  return {
    agents,
    totals: {
      english,
      spanish,
      rawTotal,
      total: rawTotal,
      activeAgents: agents.length,
    },
    mainTotals: {
      english: mainEnglish,
      spanish: mainSpanish,
      total: mainEnglish + mainSpanish,
    },
    otTotals: {
      english: otEnglish,
      spanish: otSpanish,
      total: otEnglish + otSpanish,
    },
    includesOT: useVenezuelaOT,
    invalidTransfers: 0,
  }
}

function parseCentralRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()

  let inOT = false
  let sawOTSection = false
  let mainFooter = null
  let otFooter = null
  let sawMainFooter = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    const looksLikeCentralHeader = txt.includes('CENTRAL AMERICA')
    const looksLikeOTTime = txt.includes('16:00') || txt.includes('17:00 PST') || txt.includes('16:00 - 17:00')
    const looksLikeExplicitOT = txt.includes('CENTRAL OT') || txt.includes('CENTRAL AMERICA OT')

    if (!inOT && (looksLikeExplicitOT || looksLikeOTTime || (sawMainFooter && looksLikeCentralHeader && i > 20))) {
      inOT = true
      sawOTSection = true
      continue
    }

    if (isFooterRow(txt)) {
      const footer = {
        english: safeInt(row[3]),
        spanish: safeInt(row[4]),
        total: safeInt(row[5]) || (safeInt(row[3]) + safeInt(row[4])),
      }

      if (!inOT) {
        if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) {
          mainFooter = footer
          sawMainFooter = true
        }
      } else {
        if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) {
          otFooter = footer
        }
      }

      continue
    }

    if (!isAgentRow(name, ext, '4')) continue

    const english = safeInt(row[3])
    const spanish = safeInt(row[4])
    const agent = buildAgent(name, ext, spanish, english)

    if (!inOT) mergeAgentByExt(mainAgents, agent, 'max')
    else mergeAgentByExt(otAgents, agent, 'sum')
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT && sawOTSection ? [...otAgents.values()] : []
  const agents = sortAgentsByMetric(mergeMainAndOT(mainList, otList), 'total')

  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, agent) => sum + agent.english, 0)
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, agent) => sum + agent.spanish, 0)

  const otEnglish = withOT ? (otFooter ? otFooter.english : otList.reduce((sum, agent) => sum + agent.english, 0)) : 0
  const otSpanish = withOT ? (otFooter ? otFooter.spanish : otList.reduce((sum, agent) => sum + agent.spanish, 0)) : 0

  const english = mainEnglish + otEnglish
  const spanish = mainSpanish + otSpanish
  const rawTotal = english + spanish

  return {
    agents,
    totals: {
      english,
      spanish,
      rawTotal,
      total: rawTotal,
      activeAgents: agents.length,
    },
    mainTotals: {
      english: mainEnglish,
      spanish: mainSpanish,
      total: mainEnglish + mainSpanish,
    },
    otTotals: {
      english: otEnglish,
      spanish: otSpanish,
      total: otEnglish + otSpanish,
    },
    includesOT: withOT,
    invalidTransfers: 0,
  }
}

function parseLiveSheet(teamId, rows) {
  const withOT = includeOT()

  if (teamId === 'asia') return parseAsiaRows(rows, withOT)
  if (teamId === 'philippines') return parsePhilippinesRows(rows, withOT)
  if (teamId === 'colombia') return parseColombiaRows(rows, withOT)
  if (teamId === 'central') return parseCentralRows(rows, withOT)
  if (teamId === 'mexico') return parseMexicoRows(rows, withOT)
  if (teamId === 'venezuela') return parseVenezuelaRows(rows, withOT)

  return emptyParsedTeam()
}

function getDefaultQAConfig(sheetName = '') {
  const upper = cellUpper(sheetName)

  const validIndex = (
    upper.includes('BETHANIE') ||
    upper.includes('JAIRO') ||
    upper.includes('PEDRO')
  ) ? 6 : 7

  return {
    dateIndex: 0,
    extIndex: 2,
    dispositionIndex: 4,
    validIndex,
  }
}

function detectQAHeader(row, sheetName = '') {
  const upper = (row || []).map(cellUpper)
  const hasDate = upper.some(cell => cell === 'DATE')
  const hasOpenerId = upper.some(cell => cell.includes('ID') && cell.includes('OPENER'))
  const hasDisposition = upper.some(cell => cell.includes('DISPOSITION'))
  const hasValidInvalid = upper.some(cell => cell.includes('VALID') && cell.includes('INVALID'))

  if (!hasDate || !hasOpenerId || !hasDisposition || !hasValidInvalid) return null

  const fallback = getDefaultQAConfig(sheetName)

  const dateIndex = upper.findIndex(cell => cell === 'DATE')
  const extIndex = upper.findIndex(cell => cell.includes('ID') && cell.includes('OPENER'))
  const dispositionIndex = upper.findIndex(cell => cell.includes('DISPOSITION'))
  const validIndex = upper.findIndex(cell => cell.includes('VALID') && cell.includes('INVALID'))

  return {
    dateIndex: dateIndex >= 0 ? dateIndex : fallback.dateIndex,
    extIndex: extIndex >= 0 ? extIndex : fallback.extIndex,
    dispositionIndex: dispositionIndex >= 0 ? dispositionIndex : fallback.dispositionIndex,
    validIndex: validIndex >= 0 ? validIndex : fallback.validIndex,
  }
}

function getQATeamPrefix(sheetName = '') {
  const upper = cellUpper(sheetName)

  if (upper.includes('PH')) return '1'
  if (upper.includes('COL')) return '2'
  if (upper.includes('ASIA')) return '3'
  if (upper.includes('CA')) return '4'
  if (upper.includes('MX')) return '5'
  if (upper.includes('VZ') || upper.includes('VENEZUELA')) return '6'

  return ''
}

function getQAExtFromRow(row, config, sheetName = '') {
  const prefix = getQATeamPrefix(sheetName)

  const direct = String(row?.[config.extIndex] || '').replace(/,/g, '').trim()
  if (/^\d{3,5}$/.test(direct) && (!prefix || direct.startsWith(prefix))) {
    return direct
  }

  // Fallback: scan the first columns only.
  // This avoids grabbing phone numbers / links later in the row.
  for (let i = 0; i < Math.min(row.length, 6); i++) {
    const candidate = String(row[i] || '').replace(/,/g, '').trim()

    if (/^\d{4}$/.test(candidate) && (!prefix || candidate.startsWith(prefix))) {
      return candidate
    }
  }

  return ''
}

function getQADateFromRow(row, config) {
  const direct = normalizeDate(row?.[config.dateIndex])
  if (direct) return direct

  // Fallback: sometimes Apps Script / Sheets returns date columns weirdly.
  for (let i = 0; i < Math.min(row.length, 4); i++) {
    const candidate = normalizeDate(row[i])
    if (candidate) return candidate
  }

  return null
}

function rowHasInvalidStatus(row, config) {
  const configured = cellUpper(row?.[config.validIndex])
  if (configured === 'INVALID' || configured.includes('INVALID')) return true

  // Fallback: scan only first 12 cells.
  // We use exact-ish status matching to avoid counting long QA notes by accident.
  return (row || []).slice(0, 12).some(cell => {
    const value = cellUpper(cell)
    return value === 'INVALID' || value === 'INVALID TRANSFER'
  })
}

function parseQAInvalidRows(rows, date, sheetName = '') {
  let total = 0
  const byExt = {}
  let config = getDefaultQAConfig(sheetName)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const detectedHeader = detectQAHeader(row, sheetName)

    if (detectedHeader) {
      config = detectedHeader
      continue
    }

    const rowDate = getQADateFromRow(row, config)
    if (rowDate !== date) continue

    if (!rowHasInvalidStatus(row, config)) continue

    const ext = getQAExtFromRow(row, config, sheetName)
    if (!ext) continue

    total += 1
    byExt[ext] = (byExt[ext] || 0) + 1
  }

  return { total, byExt }
}
function mergeInvalidInfo(items) {
  const merged = { total: 0, byExt: {} }

  items.forEach(info => {
    merged.total += Number(info?.total || 0)

    Object.entries(info?.byExt || {}).forEach(([ext, count]) => {
      merged.byExt[ext] = (merged.byExt[ext] || 0) + Number(count || 0)
    })
  })

  return merged
}

async function fetchSheetViaScript(sheetName, sheetId = SHEET_ID) {
  const url = `${SCRIPT_URL}?action=getSheet&sheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`
  const res = await fetch(url)
  const data = await res.json()

  if (!Array.isArray(data)) throw new Error(`getSheet failed: ${sheetName}`)

  return data.map(row => row.map(cell => String(cell ?? '')))
}

async function fetchTeamSheetViaScript(team) {
  const candidates = team.sheetNameCandidates?.length ? team.sheetNameCandidates : [team.sheetName]
  let lastError = null

  for (const sheetName of candidates) {
    try {
      return await fetchSheetViaScript(sheetName, SHEET_ID)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error(`getSheet failed: ${team.sheetName}`)
}

async function fetchInvalidTransfersForDate(date) {
  const result = {}

  const teamEntries = Object.entries(QA_SHEETS_BY_TEAM)

  for (const [teamId, sheetNames] of teamEntries) {
    const reads = await Promise.allSettled(
      sheetNames.map(sheetName => fetchSheetViaScript(sheetName, QA_SHEET_ID))
    )

    const parsedItems = reads
      .map((item, index) => {
        if (item.status !== 'fulfilled') return null
        return parseQAInvalidRows(item.value, date, sheetNames[index])
      })
      .filter(Boolean)

    result[teamId] = mergeInvalidInfo(parsedItems)
  }

  return result
}

async function scriptCall(params) {
  const url = `${SCRIPT_URL}?${new URLSearchParams(params)}&t=${Date.now()}`
  const res = await fetch(url)
  return res.json()
}


function normalizeSupabaseAgent(row) {
  const english = Number(row?.english || 0)
  const spanish = Number(row?.spanish || 0)
  const invalidTransfers = Number(row?.invalid_transfers || 0)

  const rawTotal = Number(row?.raw_total ?? (english + spanish))
  const total = Number(row?.net_total ?? Math.max(0, rawTotal - invalidTransfers))

  return {
    ext: String(row?.agent_ext || '').trim(),
    name: String(row?.agent_name || '').trim(),
    team: String(row?.team || '').trim(),
    english,
    spanish,
    invalidTransfers,
    rawTotal,
    total,
  }
}

function getSupabaseAgentScore(agent) {
  if (!agent) return 0

  const english = Number(agent?.english || 0)
  const spanish = Number(agent?.spanish || 0)
  const rawTotal = Number(agent?.rawTotal ?? (english + spanish))
  const total = Number(agent?.total ?? rawTotal)

  return Math.max(total, rawTotal, english + spanish)
}

function dedupeSupabaseAgents(agentRows = [], teamId) {
  const byExt = new Map()

  agentRows
    .filter(row => String(row.team || '') === teamId)
    .map(normalizeSupabaseAgent)
    .filter(agent => agent.ext)
    .forEach(agent => {
      const prev = byExt.get(agent.ext)

      if (!prev) {
        byExt.set(agent.ext, agent)
        return
      }

      // Supabase can contain more than one row for the same ext/date when the
      // sync ran before the unique keys were fully protected. Do NOT sum those
      // duplicates. Keep the strongest snapshot for that agent.
      if (getSupabaseAgentScore(agent) >= getSupabaseAgentScore(prev)) {
        byExt.set(agent.ext, {
          ...prev,
          ...agent,
          name: agent.name || prev.name,
        })
      }
    })

  return [...byExt.values()]
}

function buildParsedTeamsFromSupabase(teamRows = [], agentRows = []) {
  const teamMap = {}

  TEAM_ORDER.forEach(teamId => {
    const teamRow = teamRows.find(row => String(row.team || '') === teamId)

    const agents = agentRows
      .filter(row => String(row.team || '') === teamId)
      .map(normalizeSupabaseAgent)
      .filter(agent => agent.ext)

    if (!teamRow && agents.length === 0) return

    const fallbackEnglish = agents.reduce((sum, agent) => sum + Number(agent.english || 0), 0)
    const fallbackSpanish = agents.reduce((sum, agent) => sum + Number(agent.spanish || 0), 0)
    const fallbackInvalid = agents.reduce((sum, agent) => sum + Number(agent.invalidTransfers || 0), 0)
    const fallbackRawTotal = agents.reduce((sum, agent) => sum + Number(agent.rawTotal || 0), 0)
    const fallbackTotal = agents.reduce((sum, agent) => sum + Number(agent.total || 0), 0)

    const english = Number(teamRow?.english ?? fallbackEnglish)
    const spanish = Number(teamRow?.spanish ?? fallbackSpanish)
    const invalidTransfers = Number(teamRow?.invalid_transfers ?? fallbackInvalid)

    // v2 uses raw_total and net_total, not total.
    const rawTotal = Number(teamRow?.raw_total ?? (fallbackRawTotal || english + spanish))
    const total = Number(teamRow?.net_total ?? (fallbackTotal || Math.max(0, rawTotal - invalidTransfers)))
    const activeAgents = Number(teamRow?.active_agents ?? agents.length)

    teamMap[teamId] = {
      agents: sortAgentsByMetric(agents, 'total'),
      totals: {
        english,
        spanish,
        rawTotal,
        total,
        activeAgents,
      },
      mainTotals: null,
      otTotals: null,
      includesOT: false,
      invalidTransfers,
    }
  })

  return teamMap
}

async function fetchSupabaseDashboardDate(date) {
  const [teamResult, agentResult] = await Promise.all([
    supabase
      .from('daily_team_stats_v2')
      .select('*')
      .eq('date', date),

    supabase
      .from('daily_agent_stats_v2')
      .select('*')
      .eq('date', date)
      .range(0, 9999),
  ])

  if (teamResult.error) throw teamResult.error
  if (agentResult.error) throw agentResult.error

  return buildParsedTeamsFromSupabase(teamResult.data || [], agentResult.data || [])
}

async function fetchSupabaseDates() {
  const { data, error } = await supabase
    .from('daily_team_stats_v2')
    .select('date')
    .gte('date', CLEAN_START_DATE)
    .order('date', { ascending: false })

  if (error) throw error

  return [...new Set(
    (data || [])
      .map(row => normalizeDate(row.date))
      .filter(Boolean)
  )].sort((a, b) => b.localeCompare(a))
}
function getParsedScore(parsed) {
  if (!parsed) return 0

  const english = Number(parsed?.totals?.english || 0)
  const spanish = Number(parsed?.totals?.spanish || 0)
  const rawTotal = Number(parsed?.totals?.rawTotal || 0)
  const total = Number(parsed?.totals?.total || 0)

  return Math.max(rawTotal, english + spanish, total)
}

function getParsedAgentCount(parsed) {
  return Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0)
}

function isSuspiciousLiveJump(liveParsed, savedParsed, previousParsed) {
  if (!liveParsed) return false

  const liveScore = getParsedScore(liveParsed)
  const savedScore = getParsedScore(savedParsed)
  const previousScore = getParsedScore(previousParsed)
  const baseline = Math.max(savedScore, previousScore)

  if (baseline <= 0) return false

  const liveAgents = getParsedAgentCount(liveParsed)
  const baselineAgents = Math.max(getParsedAgentCount(savedParsed), getParsedAgentCount(previousParsed))

  // A real 10-second refresh should not suddenly jump hundreds/thousands.
  // These spikes usually happen when Sheets briefly exposes an old chart/range.
  const maxAllowedJump = Math.max(80, baseline * 0.35)
  if (liveScore > baseline + maxAllowedJump) return true

  // Also reject cases where totals look close but the agent list is clearly from
  // a partial/old range.
  if (baselineAgents > 20 && liveAgents > 0 && liveAgents < baselineAgents * 0.45) return true

  return false
}

function protectTodayWithSupabase(liveParsed, savedParsed, previousParsed = null) {
  if (!liveParsed && !savedParsed && !previousParsed) return emptyParsedTeam()
  if (!liveParsed && savedParsed) return savedParsed
  if (!liveParsed && previousParsed) return previousParsed

  const liveScore = getParsedScore(liveParsed)
  const savedScore = getParsedScore(savedParsed)
  const previousScore = getParsedScore(previousParsed)

  if (isSuspiciousLiveJump(liveParsed, savedParsed, previousParsed)) {
    return savedScore >= previousScore ? savedParsed : previousParsed
  }

  // Never let a cleared/moved chart lower the UI if Supabase already has a
  // stronger protected snapshot.
  if (savedParsed && savedScore > liveScore) return savedParsed

  // Same protection against regressions inside the current visible session.
  if (previousParsed && previousScore > liveScore) {
    const previousAgents = getParsedAgentCount(previousParsed)
    const liveAgents = getParsedAgentCount(liveParsed)

    if (previousAgents > liveAgents || previousScore > liveScore + 10) {
      return previousParsed
    }
  }

  const liveAgents = getParsedAgentCount(liveParsed)
  const savedAgents = getParsedAgentCount(savedParsed)

  if (savedParsed && savedScore === liveScore && savedAgents > liveAgents) return savedParsed

  return liveParsed || savedParsed || previousParsed || emptyParsedTeam()
}

function getYesterdayKey() {
  const d = colombiaDate()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeExtValue(ext) {
  const raw = String(ext ?? '').trim()
  if (!raw) return ''
  return raw.startsWith('#') ? raw : `#${raw}`
}

function sanitizeSheetName(name = 'Sheet') {
  return String(name)
    .replace(/[\\/*?:[\]]/g, '')
    .slice(0, 31) || 'Sheet'
}

async function downloadStyledDashboardExcel({
  date,
  label,
  entries,
  selectedTeam,
}) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Pulse Dashboard'
  workbook.created = new Date()
  workbook.modified = new Date()

  const border = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
  }

  const topFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2F0D9' },
  }

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9EAD3' },
  }

  const applyRowStyle = (row, totalCols = 7, centerFromCol = 3) => {
    for (let col = 1; col <= totalCols; col += 1) {
      const cell = row.getCell(col)
      cell.border = border
      cell.alignment = {
        vertical: 'middle',
        horizontal: col >= centerFromCol ? 'center' : 'left',
      }
    }
  }

  entries.forEach(({ teamId, parsed }) => {
    const teamLabel = TEAMS[teamId]?.label || teamId
    const worksheet = workbook.addWorksheet(sanitizeSheetName(teamLabel))

    worksheet.views = [{ state: 'frozen', ySplit: 2 }]
    worksheet.properties.defaultRowHeight = 22

    worksheet.columns = [
      { key: 'rank', width: 8 },
      { key: 'agent', width: 30 },
      { key: 'ext', width: 14 },
      { key: 'spanish', width: 12 },
      { key: 'english', width: 12 },
      { key: 'invalid', width: 14 },
      { key: 'total', width: 12 },
    ]

    const totals = parsed?.totals || {}
    const agents = sortAgentsByMetric(parsed?.agents || [], 'total')

    worksheet.getCell('A1').value = `${teamLabel} agents`
    worksheet.getCell('A1').font = { bold: true, size: 15 }
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }

    worksheet.getCell('D1').value = safeNumber(totals.spanish)
    worksheet.getCell('E1').value = safeNumber(totals.english)
    worksheet.getCell('F1').value = safeNumber(parsed?.invalidTransfers)
    worksheet.getCell('G1').value = safeNumber(totals.total)

    for (let col = 1; col <= 7; col += 1) {
      const cell = worksheet.getRow(1).getCell(col)
      cell.fill = topFill
      cell.border = border

      if (col >= 4) {
        cell.font = { bold: true, size: 13 }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    }

    const headerRow = worksheet.getRow(2)
    headerRow.values = ['#', 'Agent', 'Ext', 'Spanish', 'English', 'Invalid xfers', 'Total']
    headerRow.font = { bold: true, size: 11 }
    headerRow.height = 24

    for (let col = 1; col <= 7; col += 1) {
      const cell = headerRow.getCell(col)
      cell.fill = headerFill
      cell.border = border
      cell.alignment = {
        vertical: 'middle',
        horizontal: col >= 3 ? 'center' : 'left',
      }
    }

    worksheet.autoFilter = 'A2:G2'

    if (!agents.length) {
      const row = worksheet.getRow(3)
      row.values = ['', 'N/A', '', 'N/A', 'N/A', 'N/A', 'N/A']
      applyRowStyle(row)
    } else {
      agents.forEach((agent, index) => {
        const row = worksheet.addRow([
          index + 1,
          agent.name || '',
          normalizeExtValue(agent.ext),
          safeNumber(agent.spanish),
          safeNumber(agent.english),
          safeNumber(agent.invalidTransfers),
          safeNumber(agent.total),
        ])

        row.height = 22
        row.getCell(2).font = { bold: true }
        applyRowStyle(row)
      })
    }
  })

  const fileName = `pulse_${selectedTeam === 'all' ? 'all_teams' : selectedTeam}_${date}_${label}.xlsx`
  const buffer = await workbook.xlsx.writeBuffer()

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  saveAs(blob, fileName)
}
function formatDateLabel(date) {
  if (date === todayKey()) return 'Today — LIVE'

  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function FlagImg({ src, size = 18, alt = '' }) {
  if (!src) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>🌎</span>

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={Math.round(size * 0.72)}
      style={{ borderRadius: 3, objectFit: 'cover', display: 'inline-block' }}
    />
  )
}

function Medal({ index, size = 18 }) {
  return <img src={MEDALS[index]} alt="" width={size} height={size} style={{ objectFit: 'contain' }} />
}

function TeamTabs({ selectedTeam, onChange }) {
  return (
    <div className="pulse-tabs-grid">
      <button className={`pulse-tab ${selectedTeam === 'all' ? 'active' : ''}`} onClick={() => onChange('all')}>
        <span>All Teams</span>
      </button>

      {TEAM_ORDER.map(teamId => {
        const team = TEAMS[teamId]
        const active = selectedTeam === teamId

        return (
          <button key={teamId} className={`pulse-tab ${active ? 'active' : ''}`} onClick={() => onChange(teamId)}>
            <FlagImg src={team.flag} size={18} alt="" />
            <span>{team.short}</span>
          </button>
        )
      })}
    </div>
  )
}

function SortTabs({ sortMetric, onChange }) {
  return (
    <div className="pulse-sort-tabs">
      {SORT_OPTIONS.map(option => (
        <button
          key={option.id}
          className={`pulse-sort-tab ${sortMetric === option.id ? 'active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({ title, value, color, subtitle, titleColor }) {
  return (
    <div className="pulse-summary-card">
      <div className="pulse-summary-title" style={{ color: titleColor || undefined }}>{title}</div>
      <div className="pulse-summary-value" style={{ color }}>{Number(value || 0).toLocaleString()}</div>
      <div className="pulse-summary-subtitle">{subtitle || ''}</div>
    </div>
  )
}

function TeamOverviewCard({ team, parsed, sortMetric, onOpen, rankIndex = 0 }) {
  const topThree = sortAgentsByMetric(parsed.agents, sortMetric).slice(0, 3)
  const teamRankIcon = TEAM_RANK_EMOJIS[rankIndex] || null

  return (
    <div className="pulse-team-card" onClick={() => onOpen(team.id)}>
      <div className="pulse-team-card-top">
        <div className="pulse-team-rank-badge">
          {teamRankIcon ? (
            <img src={teamRankIcon} alt={`#${rankIndex + 1}`} width={28} height={28} style={{ objectFit: 'contain' }} />
          ) : (
            <span className="pulse-team-rank-text">#{rankIndex + 1}</span>
          )}
        </div>

        <div className="pulse-team-title-wrap">
          <FlagImg src={team.flag} size={24} alt="" />
          <div>
            <div className="pulse-team-name">{team.label}</div>
            <div className="pulse-team-sub">{parsed.totals.activeAgents} active agents</div>
          </div>
        </div>

        <div className="pulse-team-metric">
          <div className="pulse-team-metric-label">{SORT_OPTIONS.find(opt => opt.id === sortMetric)?.label}</div>
          <div className="pulse-team-metric-value">{Number(parsed.totals[sortMetric] || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="pulse-team-stats-grid">
        <div><span className="stat-k blue">English</span><span className="stat-v blue">{parsed.totals.english.toLocaleString()}</span></div>
        <div><span className="stat-k green">Spanish</span><span className="stat-v green">{parsed.totals.spanish.toLocaleString()}</span></div>
        <div><span className="stat-k red">Invalid</span><span className="stat-v red">{Number(parsed.invalidTransfers || 0).toLocaleString()}</span></div>
        <div><span className="stat-k orange">Total</span><span className="stat-v orange">{parsed.totals.total.toLocaleString()}</span></div>
      </div>

      <div className="pulse-top3-list">
        {topThree.map((agent, index) => (
          <div key={`${team.id}-${agent.ext}`} className="pulse-top3-item">
            <Medal index={index} size={17} />
            <span className="pulse-top3-name">{agent.name}</span>
            <span className="pulse-top3-val">{agent[sortMetric]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamComingSoonCard({ team }) {
  return (
    <div className="pulse-team-card pulse-coming-soon">
      <div className="pulse-team-title-wrap">
        <FlagImg src={team.flag} size={24} alt="" />
        <div>
          <div className="pulse-team-name">{team.label}</div>
          <div className="pulse-team-sub">No live data loaded yet for this team.</div>
        </div>
      </div>
    </div>
  )
}

function TopRow({ title, metric, agents }) {
  const top = sortAgentsByMetric(agents, metric).slice(0, 3)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">{title}</div>

      {top.map((agent, index) => (
        <div key={`${metric}-${agent.ext}`} className="pulse-top-block-item">
          <Medal index={index} size={19} />
          <span className="pulse-top-block-name">{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value">{agent[metric]}</span>
        </div>
      ))}
    </div>
  )
}

function AgentTable({ team, agents, navigate }) {
  const displayAgents = sortAgentsByMetric(agents, 'english')

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{team.label} agents</div>

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Ext</th>
              <th className="th-spanish">Spanish</th>
              <th className="th-english">English</th>
              <th className="th-invalid">Invalid xfers</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {displayAgents.map((agent, index) => (
              <tr key={agent.ext}>
                <td>{index + 1}</td>
                <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td>#{agent.ext}</td>
                <td className="green">{agent.spanish}</td>
                <td className="blue">{agent.english}</td>
                <td className="red">{agent.invalidTransfers || 0}</td>
                <td className="orange">{agent.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


function getMetricLabel(metric) {
  if (metric === 'english') return 'English'
  if (metric === 'spanish') return 'Spanish'
  if (metric === 'invalid') return 'Invalid'
  if (metric === 'total') return 'Total'
  return metric
}

function getMetricColor(metric) {
  if (metric === 'english') return '#38bdf8'
  if (metric === 'spanish') return '#34d399'
  if (metric === 'invalid') return '#fb7185'
  return '#ff8a2a'
}

function getTeamName(teamId) {
  return TEAMS[teamId]?.label || teamId || 'Unknown team'
}

function getTeamFlag(teamId) {
  return TEAMS[teamId]?.flag || null
}

function flattenAgentsForRankings(teamData) {
  const agents = []

  TEAM_ORDER.forEach(teamId => {
    const parsed = teamData?.[teamId]
    const team = TEAMS[teamId]

    ;(parsed?.agents || []).forEach(agent => {
      const english = Number(agent?.english || 0)
      const spanish = Number(agent?.spanish || 0)
      const invalidTransfers = Number(agent?.invalidTransfers || 0)
      const rawTotal = Number(agent?.rawTotal ?? (english + spanish))
      const total = Number(agent?.total ?? Math.max(0, rawTotal - invalidTransfers))

      if (!agent?.ext) return
      if (english <= 0 && spanish <= 0 && total <= 0) return

      agents.push({
        ...agent,
        teamId,
        teamLabel: team?.label || teamId,
        teamFlag: team?.flag || null,
        english,
        spanish,
        invalidTransfers,
        rawTotal,
        total,
      })
    })
  })

  return agents
}

function sortRankingAgents(agents, metric = 'total') {
  return [...(agents || [])].sort((a, b) => {
    const metricDiff = Number(b?.[metric] || 0) - Number(a?.[metric] || 0)
    if (metricDiff !== 0) return metricDiff

    const totalDiff = Number(b?.total || 0) - Number(a?.total || 0)
    if (totalDiff !== 0) return totalDiff

    const englishDiff = Number(b?.english || 0) - Number(a?.english || 0)
    if (englishDiff !== 0) return englishDiff

    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
}

function buildCurrentTeamRankings(teamData, metric = 'total') {
  return TEAM_ORDER
    .map(teamId => {
      const parsed = teamData?.[teamId]
      if (!parsed) return null

      return {
        teamId,
        teamLabel: getTeamName(teamId),
        teamFlag: getTeamFlag(teamId),
        english: Number(parsed?.totals?.english || 0),
        spanish: Number(parsed?.totals?.spanish || 0),
        invalidTransfers: Number(parsed?.invalidTransfers || 0),
        total: Number(parsed?.totals?.total || 0),
        activeAgents: Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0),
        value: Number(metric === 'invalid' ? parsed?.invalidTransfers || 0 : parsed?.totals?.[metric] || 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const metricDiff = Number(b?.value || 0) - Number(a?.value || 0)
      if (metricDiff !== 0) return metricDiff
      return Number(b?.total || 0) - Number(a?.total || 0)
    })
}

function normalizeHistoryAgent(row) {
  const english = Number(row?.english || 0)
  const spanish = Number(row?.spanish || 0)
  const invalidTransfers = Number(row?.invalid_transfers || 0)
  const rawTotal = Number(row?.raw_total ?? (english + spanish))
  const total = Number(row?.net_total ?? Math.max(0, rawTotal - invalidTransfers))
  const teamId = String(row?.team || '').trim()

  return {
    date: normalizeDate(row?.date),
    ext: String(row?.agent_ext || '').trim(),
    name: String(row?.agent_name || '').trim(),
    teamId,
    teamLabel: getTeamName(teamId),
    teamFlag: getTeamFlag(teamId),
    english,
    spanish,
    invalidTransfers,
    rawTotal,
    total,
  }
}

function normalizeHistoryTeam(row) {
  const teamId = String(row?.team || '').trim()
  const english = Number(row?.english || 0)
  const spanish = Number(row?.spanish || 0)
  const invalidTransfers = Number(row?.invalid_transfers || 0)
  const total = Number(row?.total ?? Math.max(0, english + spanish - invalidTransfers))

  return {
    date: normalizeDate(row?.date),
    teamId,
    teamLabel: getTeamName(teamId),
    teamFlag: getTeamFlag(teamId),
    english,
    spanish,
    invalidTransfers,
    total,
    activeAgents: Number(row?.active_agents || 0),
  }
}

function buildAllTimeAgentRankings(agentRows = []) {
  const byAgent = new Map()

  agentRows
    .map(normalizeHistoryAgent)
    .filter(agent => agent.date && agent.ext && (agent.english > 0 || agent.spanish > 0 || agent.total > 0))
    .forEach(agent => {
      const key = agent.ext
      const current = byAgent.get(key) || {
        ext: agent.ext,
        name: agent.name,
        teamId: agent.teamId,
        teamLabel: agent.teamLabel,
        teamFlag: agent.teamFlag,
        english: 0,
        spanish: 0,
        invalidTransfers: 0,
        rawTotal: 0,
        total: 0,
        daysTracked: 0,
        bestEnglish: 0,
        bestSpanish: 0,
        bestTotal: 0,
        bestDate: agent.date,
      }

      current.name = agent.name || current.name
      current.teamId = agent.teamId || current.teamId
      current.teamLabel = agent.teamLabel || current.teamLabel
      current.teamFlag = agent.teamFlag || current.teamFlag
      current.english += Number(agent.english || 0)
      current.spanish += Number(agent.spanish || 0)
      current.invalidTransfers += Number(agent.invalidTransfers || 0)
      current.rawTotal += Number(agent.rawTotal || 0)
      current.total += Number(agent.total || 0)
      current.daysTracked += 1

      if (Number(agent.english || 0) > current.bestEnglish) current.bestEnglish = Number(agent.english || 0)
      if (Number(agent.spanish || 0) > current.bestSpanish) current.bestSpanish = Number(agent.spanish || 0)
      if (Number(agent.total || 0) > current.bestTotal) {
        current.bestTotal = Number(agent.total || 0)
        current.bestDate = agent.date
      }

      byAgent.set(key, current)
    })

  return [...byAgent.values()]
}

function buildEnglishPlacementAgents(agentRows = []) {
  const byDate = new Map()

  agentRows
    .map(normalizeHistoryAgent)
    .filter(agent => agent.date && agent.ext && agent.english > 0)
    .forEach(agent => {
      if (!byDate.has(agent.date)) byDate.set(agent.date, [])
      byDate.get(agent.date).push(agent)
    })

  const byAgent = new Map()

  byDate.forEach((agents, date) => {
    const sorted = sortRankingAgents(agents, 'english')

    sorted.slice(0, 3).forEach((agent, index) => {
      const current = byAgent.get(agent.ext) || {
        ext: agent.ext,
        name: agent.name,
        teamId: agent.teamId,
        teamLabel: agent.teamLabel,
        teamFlag: agent.teamFlag,
        firstPlaces: 0,
        top3Days: 0,
        bestEnglish: 0,
        bestTotal: 0,
        bestDate: date,
      }

      if (index === 0) current.firstPlaces += 1
      current.top3Days += 1

      if (Number(agent.english || 0) > Number(current.bestEnglish || 0)) {
        current.bestEnglish = Number(agent.english || 0)
        current.bestTotal = Number(agent.total || 0)
        current.bestDate = date
      }

      byAgent.set(agent.ext, current)
    })
  })

  const rows = [...byAgent.values()]

  return {
    mostFirst: [...rows].sort((a, b) => {
      const firstDiff = Number(b.firstPlaces || 0) - Number(a.firstPlaces || 0)
      if (firstDiff !== 0) return firstDiff
      const top3Diff = Number(b.top3Days || 0) - Number(a.top3Days || 0)
      if (top3Diff !== 0) return top3Diff
      return Number(b.bestEnglish || 0) - Number(a.bestEnglish || 0)
    }),
    mostTop3: [...rows].sort((a, b) => {
      const top3Diff = Number(b.top3Days || 0) - Number(a.top3Days || 0)
      if (top3Diff !== 0) return top3Diff
      const firstDiff = Number(b.firstPlaces || 0) - Number(a.firstPlaces || 0)
      if (firstDiff !== 0) return firstDiff
      return Number(b.bestEnglish || 0) - Number(a.bestEnglish || 0)
    }),
  }
}

function buildAllTimeTeamRankings(teamRows = []) {
  const byTeam = new Map()

  teamRows
    .map(normalizeHistoryTeam)
    .filter(team => team.date && team.teamId)
    .forEach(team => {
      const current = byTeam.get(team.teamId) || {
        teamId: team.teamId,
        teamLabel: team.teamLabel,
        teamFlag: team.teamFlag,
        english: 0,
        spanish: 0,
        invalidTransfers: 0,
        total: 0,
        activeAgents: 0,
        daysTracked: 0,
        bestEnglish: 0,
        bestSpanish: 0,
        bestTotal: 0,
        bestDate: team.date,
      }

      current.english += Number(team.english || 0)
      current.spanish += Number(team.spanish || 0)
      current.invalidTransfers += Number(team.invalidTransfers || 0)
      current.total += Number(team.total || 0)
      current.activeAgents = Math.max(Number(current.activeAgents || 0), Number(team.activeAgents || 0))
      current.daysTracked += 1

      if (Number(team.english || 0) > Number(current.bestEnglish || 0)) current.bestEnglish = Number(team.english || 0)
      if (Number(team.spanish || 0) > Number(current.bestSpanish || 0)) current.bestSpanish = Number(team.spanish || 0)
      if (Number(team.total || 0) > Number(current.bestTotal || 0)) {
        current.bestTotal = Number(team.total || 0)
        current.bestDate = team.date
      }

      byTeam.set(team.teamId, current)
    })

  return [...byTeam.values()]
}

function buildTeamWinnerCounts(teamRows = [], metric = 'english') {
  const byDate = new Map()

  teamRows
    .map(normalizeHistoryTeam)
    .filter(team => team.date && team.teamId && Number(team?.[metric] || 0) > 0)
    .forEach(team => {
      if (!byDate.has(team.date)) byDate.set(team.date, [])
      byDate.get(team.date).push(team)
    })

  const byTeam = new Map()

  byDate.forEach((teams, date) => {
    const topTeam = [...teams].sort((a, b) => {
      const metricDiff = Number(b?.[metric] || 0) - Number(a?.[metric] || 0)
      if (metricDiff !== 0) return metricDiff
      return Number(b?.total || 0) - Number(a?.total || 0)
    })[0]

    if (!topTeam) return

    const current = byTeam.get(topTeam.teamId) || {
      teamId: topTeam.teamId,
      teamLabel: topTeam.teamLabel,
      teamFlag: topTeam.teamFlag,
      wins: 0,
      bestValue: 0,
      bestDate: date,
      bestTotal: 0,
    }

    current.wins += 1

    if (Number(topTeam?.[metric] || 0) > current.bestValue) {
      current.bestValue = Number(topTeam?.[metric] || 0)
      current.bestDate = date
      current.bestTotal = Number(topTeam.total || 0)
    }

    byTeam.set(topTeam.teamId, current)
  })

  return [...byTeam.values()].sort((a, b) => {
    const winDiff = Number(b.wins || 0) - Number(a.wins || 0)
    if (winDiff !== 0) return winDiff
    return Number(b.bestValue || 0) - Number(a.bestValue || 0)
  })
}

function buildRankingHistoryInsights(agentRows = [], teamRows = []) {
  const cleanAgentRows = (agentRows || []).filter(row => normalizeDate(row?.date) >= OFFICIAL_DATA_START)
  const cleanTeamRows = (teamRows || []).filter(row => normalizeDate(row?.date) >= OFFICIAL_DATA_START)
  const dates = [...new Set(cleanTeamRows.map(row => normalizeDate(row?.date)).filter(Boolean))].sort()
  const allTimeAgents = buildAllTimeAgentRankings(cleanAgentRows)
  const allTimeTeams = buildAllTimeTeamRankings(cleanTeamRows)
  const englishPlacement = buildEnglishPlacementAgents(cleanAgentRows)

  return {
    datesTracked: dates.length,
    allTimeAgents,
    allTimeTeams,
    topAllTimeTotalAgents: sortRankingAgents(allTimeAgents, 'total').slice(0, 10),
    topAllTimeEnglishAgents: sortRankingAgents(allTimeAgents, 'english').slice(0, 10),
    topAllTimeSpanishAgents: sortRankingAgents(allTimeAgents, 'spanish').slice(0, 10),
    mostEnglishFirstPlaceAgents: englishPlacement.mostFirst.slice(0, 10),
    mostEnglishTop3Agents: englishPlacement.mostTop3.slice(0, 10),
    englishTeamWinners: buildTeamWinnerCounts(cleanTeamRows, 'english').slice(0, 10),
    spanishTeamWinners: buildTeamWinnerCounts(cleanTeamRows, 'spanish').slice(0, 10),
    totalTeamWinners: buildTeamWinnerCounts(cleanTeamRows, 'total').slice(0, 10),
  }
}

async function fetchRankingHistoryInsights() {
  const [agentResult, teamResult] = await Promise.all([
    supabase
      .from('daily_agent_stats')
      .select('date,agent_ext,agent_name,team,english,spanish,invalid_transfers,raw_total,net_total')
      .gte('date', OFFICIAL_DATA_START)
      .order('date', { ascending: false })
      .range(0, 9999),

    supabase
      .from('daily_team_stats')
      .select('date,team,english,spanish,invalid_transfers,total,active_agents')
      .gte('date', OFFICIAL_DATA_START)
      .order('date', { ascending: false })
      .range(0, 9999),
  ])

  if (agentResult.error) throw agentResult.error
  if (teamResult.error) throw teamResult.error

  return buildRankingHistoryInsights(agentResult.data || [], teamResult.data || [])
}

function RankMarker({ index }) {
  if (index < 3) return <Medal index={index} size={20} />
  return <span className="pulse-team-rank-text">#{index + 1}</span>
}

function TeamInlineLabel({ teamId, teamFlag, teamLabel }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>
      <FlagImg src={teamFlag || getTeamFlag(teamId)} size={18} alt="" />
      {teamLabel || getTeamName(teamId)}
    </span>
  )
}

function RankingTopBlock({ title, metric, rows = [], navigate }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">{title}</div>

      {rows.slice(0, 5).map((agent, index) => (
        <div key={`${title}-${agent.ext}-${index}`} className="pulse-top-block-item">
          <RankMarker index={index} />
          <span className="pulse-top-block-name linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value" style={{ color }}>{Number(agent?.[metric] || 0).toLocaleString()}</span>
        </div>
      ))}

      {!rows.length ? <div className="pulse-summary-subtitle">No ranking data available yet.</div> : null}
    </div>
  )
}

function AgentRankingTable({ title, subtitle, rows = [], metric = 'total', navigate }) {
  const showEnglish = metric === 'english' || metric === 'total'
  const showSpanish = metric === 'spanish' || metric === 'total'

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      {subtitle ? <div className="pulse-summary-subtitle" style={{ margin: '0 0 12px' }}>{subtitle}</div> : null}

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Team</th>
              <th>Ext</th>
              {showEnglish ? <th className="th-english">English</th> : null}
              {showSpanish ? <th className="th-spanish">Spanish</th> : null}
              <th className="th-invalid">Invalid</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((agent, index) => (
              <tr key={`${title}-${agent.ext}-${index}`}>
                <td><RankMarker index={index} /></td>
                <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                <td>#{agent.ext}</td>
                {showEnglish ? <td className="blue" style={{ fontWeight: metric === 'english' ? 950 : 800 }}>{Number(agent.english || 0).toLocaleString()}</td> : null}
                {showSpanish ? <td className="green" style={{ fontWeight: metric === 'spanish' ? 950 : 800 }}>{Number(agent.spanish || 0).toLocaleString()}</td> : null}
                <td className="red">{Number(agent.invalidTransfers || 0).toLocaleString()}</td>
                <td className="orange" style={{ fontWeight: 950 }}>{Number(agent.total || 0).toLocaleString()}</td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan={showEnglish && showSpanish ? 8 : 7}>No ranking data available yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EnglishPlacementTable({ title, subtitle, rows = [], loading, error, navigate, mode = 'first' }) {
  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      {subtitle ? <div className="pulse-summary-subtitle" style={{ margin: '0 0 12px' }}>{subtitle}</div> : null}

      {loading ? <div className="pulse-loading">Loading ranking history...</div> : null}
      {error ? <div className="pulse-error">{error}</div> : null}

      {!loading && !error ? (
        <div className="pulse-table-scroll">
          <table className="pulse-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Team</th>
                <th>Ext</th>
                <th>#1 Days</th>
                <th>Top 3 Days</th>
                <th>Best English</th>
                <th>Best Day</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((agent, index) => (
                <tr key={`${mode}-${agent.ext}-${index}`}>
                  <td><RankMarker index={index} /></td>
                  <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                  <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                  <td>#{agent.ext}</td>
                  <td className="orange">{Number(agent.firstPlaces || 0).toLocaleString()}</td>
                  <td className="green">{Number(agent.top3Days || 0).toLocaleString()}</td>
                  <td className="blue">{Number(agent.bestEnglish || 0).toLocaleString()}</td>
                  <td>{agent.bestDate ? formatDateLabel(agent.bestDate) : 'N/A'}</td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan="8">No English placement history available yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function TeamWinnerTable({ title, rows = [], metric }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>#1 Days</th>
              <th>Best {getMetricLabel(metric)}</th>
              <th>Best Total</th>
              <th>Best Day</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((team, index) => (
              <tr key={`${title}-${team.teamId}-${index}`}>
                <td><RankMarker index={index} /></td>
                <td><TeamInlineLabel teamId={team.teamId} teamFlag={team.teamFlag} teamLabel={team.teamLabel} /></td>
                <td className="orange">{Number(team.wins || 0).toLocaleString()}</td>
                <td style={{ color, fontWeight: 950 }}>{Number(team.bestValue || 0).toLocaleString()}</td>
                <td className="orange">{Number(team.bestTotal || 0).toLocaleString()}</td>
                <td>{team.bestDate ? formatDateLabel(team.bestDate) : 'N/A'}</td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan="6">No team ranking history available yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RankingsPage({ teamData, selectedDate, rangeMode, history, historyLoading, historyError, navigate }) {
  const isAllTime = rangeMode === 'all_time'
  const currentAgents = useMemo(() => flattenAgentsForRankings(teamData), [teamData])
  const rankingAgents = isAllTime ? (history?.allTimeAgents || []) : currentAgents

  const topTotal = useMemo(() => sortRankingAgents(rankingAgents, 'total').slice(0, 10), [rankingAgents])
  const topEnglish = useMemo(() => sortRankingAgents(rankingAgents, 'english').slice(0, 10), [rankingAgents])
  const topSpanish = useMemo(() => sortRankingAgents(rankingAgents, 'spanish').slice(0, 10), [rankingAgents])

  const currentTeamEnglish = useMemo(() => buildCurrentTeamRankings(teamData, 'english')[0], [teamData])
  const currentTeamSpanish = useMemo(() => buildCurrentTeamRankings(teamData, 'spanish')[0], [teamData])
  const currentTeamTotal = useMemo(() => buildCurrentTeamRankings(teamData, 'total')[0], [teamData])
  const allTimeTeams = history?.allTimeTeams || []

  const teamEnglish = isAllTime
    ? [...allTimeTeams].sort((a, b) => Number(b.english || 0) - Number(a.english || 0))[0]
    : currentTeamEnglish

  const teamSpanish = isAllTime
    ? [...allTimeTeams].sort((a, b) => Number(b.spanish || 0) - Number(a.spanish || 0))[0]
    : currentTeamSpanish

  const teamTotal = isAllTime
    ? [...allTimeTeams].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0]
    : currentTeamTotal

  const mostFirst = history?.mostEnglishFirstPlaceAgents || []
  const mostTop3 = history?.mostEnglishTop3Agents || []
  const topFirstAgent = mostFirst[0]
  const topTop3Agent = mostTop3[0]
  const periodLabel = isAllTime ? 'All Time' : formatDateLabel(selectedDate)

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">{periodLabel}</div>

          <div className="pulse-hero-title-row">
            <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
            <div className="pulse-hero-title">Rankings</div>
          </div>

          <div className="pulse-hero-sub">
            Global performance from the official Supabase data. #1 and Top 3 streaks are based on English xfers.
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard
          title="Best Team English"
          value={teamEnglish?.english || 0}
          color="#38bdf8"
          titleColor="#38bdf8"
          subtitle={teamEnglish ? `${teamEnglish.teamLabel} • ${teamEnglish.activeAgents || 0} agents` : historyLoading ? 'Loading history...' : 'N/A'}
        />
        <SummaryCard
          title="Best Team Spanish"
          value={teamSpanish?.spanish || 0}
          color="#34d399"
          titleColor="#34d399"
          subtitle={teamSpanish ? `${teamSpanish.teamLabel} • ${teamSpanish.activeAgents || 0} agents` : historyLoading ? 'Loading history...' : 'N/A'}
        />
        <SummaryCard
          title="Best Team Total"
          value={teamTotal?.total || 0}
          color="#ff8a2a"
          titleColor="#ff8a2a"
          subtitle={teamTotal ? `${teamTotal.teamLabel} • ${teamTotal.activeAgents || 0} agents` : historyLoading ? 'Loading history...' : 'N/A'}
        />
        <SummaryCard
          title="Most #1 Days"
          value={topFirstAgent?.firstPlaces || 0}
          color="#fbbf24"
          titleColor="#fbbf24"
          subtitle={topFirstAgent ? `${topFirstAgent.name} • #${topFirstAgent.ext}` : historyLoading ? 'Loading history...' : 'N/A'}
        />
        <SummaryCard
          title="Most Top 3 Days"
          value={topTop3Agent?.top3Days || 0}
          color="#22c55e"
          titleColor="#22c55e"
          subtitle={topTop3Agent ? `${topTop3Agent.name} • #${topTop3Agent.ext}` : historyLoading ? 'Loading history...' : 'N/A'}
        />
        <SummaryCard
          title="Days Tracked"
          value={history?.datesTracked || 0}
          color="#c084fc"
          titleColor="#c084fc"
          subtitle={`Since ${formatDateLabel(OFFICIAL_DATA_START)}`}
        />
      </div>

      <div className="pulse-top-blocks-grid">
        <RankingTopBlock title="Top Total" metric="total" rows={topTotal} navigate={navigate} />
        <RankingTopBlock title="Top English" metric="english" rows={topEnglish} navigate={navigate} />
        <RankingTopBlock title="Top Spanish" metric="spanish" rows={topSpanish} navigate={navigate} />
      </div>

      <AgentRankingTable
        title="🏆 Top 10 Total Xfers"
        subtitle={isAllTime ? 'All-time totals from the official Supabase data.' : 'Sorted by total xfers for the selected date.'}
        rows={topTotal}
        metric="total"
        navigate={navigate}
      />

      <AgentRankingTable
        title="🔵 Top 10 English Xfers"
        subtitle={isAllTime ? 'All-time English xfers. Columns kept clean: English, Invalid and Total.' : 'Best English performance for the selected date.'}
        rows={topEnglish}
        metric="english"
        navigate={navigate}
      />

      <AgentRankingTable
        title="🟢 Top 10 Spanish Xfers"
        subtitle={isAllTime ? 'All-time Spanish xfers. Columns kept clean: Spanish, Invalid and Total.' : 'Best Spanish performance for the selected date.'}
        rows={topSpanish}
        metric="spanish"
        navigate={navigate}
      />

      <div className="pulse-top-blocks-grid">
        <EnglishPlacementTable
          title="🏆 Most #1 Days by English"
          subtitle="Agents who finished #1 the most times. This is always based on English xfers."
          rows={mostFirst}
          loading={historyLoading}
          error={historyError}
          navigate={navigate}
          mode="first"
        />

        <EnglishPlacementTable
          title="🥇 Most Top 3 Days by English"
          subtitle="Agents who appeared in the daily Top 3 the most times. This is also based on English xfers."
          rows={mostTop3}
          loading={historyLoading}
          error={historyError}
          navigate={navigate}
          mode="top3"
        />
      </div>

      <div className="pulse-top-blocks-grid">
        <TeamWinnerTable title="🏆 Team #1 Days by English" metric="english" rows={history?.englishTeamWinners || []} />
        <TeamWinnerTable title="🏆 Team #1 Days by Spanish" metric="spanish" rows={history?.spanishTeamWinners || []} />
      </div>
    </>
  )
}

function TeamDetail({ team, parsed, selectedDate, navigate, onDownload }) {
  const showOT = parsed.includesOT && (parsed.otTotals?.total || 0) > 0
  const reachedTarget = countReachedTarget(team.id, parsed.agents)
  const target = TEAM_TARGETS[team.id] || 10
  const invalidTransfers = Number(parsed.invalidTransfers || 0)

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">{formatDateLabel(selectedDate)}</div>

          <div className="pulse-hero-title-row">
            <FlagImg src={team.flag} size={28} alt="" />
            <div className="pulse-hero-title">{team.label}</div>
            <button
              type="button"
              className="lov-export-btn pulse-team-download-btn"
              onClick={() => onDownload?.(team.id)}
            >
              Download
            </button>
          </div>

          <div className="pulse-hero-sub">
            {parsed.totals.activeAgents} active agents{showOT ? ' • OT included' : ''}
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard title="English" value={parsed.totals.english} color="#60a5fa" titleColor="#60a5fa" subtitle={parsed.mainTotals ? `Main: ${parsed.mainTotals.english}` : ''} />
        <SummaryCard title="Spanish" value={parsed.totals.spanish} color="#34d399" titleColor="#34d399" subtitle={parsed.mainTotals ? `Main: ${parsed.mainTotals.spanish}` : ''} />
        <SummaryCard title="Invalid xfers" value={invalidTransfers} color="#f87171" titleColor="#f87171" subtitle={QA_DISPLAY_BY_TEAM[team.id] || 'QA not connected yet'} />
        <SummaryCard title="Total" value={parsed.totals.total} color="#f59e0b" titleColor="#f59e0b" subtitle={showOT ? `OT: ${parsed.otTotals.total}` : `Raw: ${parsed.totals.rawTotal || parsed.totals.total}`} />
        <SummaryCard title="Reached target" value={reachedTarget} color="#22c55e" titleColor="#22c55e" subtitle={`Goal: ${target} English`} />
        <SummaryCard title="Active agents" value={parsed.totals.activeAgents} color="#c084fc" titleColor="#c084fc" subtitle={selectedDate === todayKey() ? 'Live snapshot' : 'Saved snapshot'} />
      </div>

      <div className="pulse-top-blocks-grid">
        <TopRow title="Top English" metric="english" agents={parsed.agents} />
        <TopRow title="Top Spanish" metric="spanish" agents={parsed.agents} />
        <TopRow title="Top Total" metric="total" agents={parsed.agents} />
      </div>

      <AgentTable team={team} agents={parsed.agents} navigate={navigate} />
    </>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [sortMetric, setSortMetric] = useState('english')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamData, setTeamData] = useState({})
  const [remoteDates, setRemoteDates] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [rangeMode, setRangeMode] = useState('day')
  const [activeView, setActiveView] = useState('overview')
  const [rankingsHistory, setRankingsHistory] = useState({ insights: null, loading: false, error: '' })

  const liveTeamIds = useMemo(() => TEAM_ORDER.filter(teamId => TEAMS[teamId].live), [])
  const isToday = selectedDate === todayKey()

  const selectedDateRef = useRef(selectedDate)
  const activeLoadIdRef = useRef(0)
  const teamDataRef = useRef({})

  const setSelectedDateSafe = useCallback((date) => {
    selectedDateRef.current = date
    setSelectedDate(date)
  }, [])

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

  useEffect(() => {
    teamDataRef.current = teamData
  }, [teamData])

const loadRemoteDates = useCallback(async () => {
  const dates = await fetchSupabaseDates()
  setRemoteDates(dates)
}, [])

const loadLiveTeams = useCallback(async () => {
  setError('')

  const today = todayKey()
  const supabaseData = await fetchSupabaseDashboardDate(today)

  setTeamData(supabaseData)
  setLastUpdate(new Date())

  loadRemoteDates().catch(() => {})
}, [loadRemoteDates])

const loadHistoricalTeams = useCallback(async (date) => {
  setError('')

  const supabaseData = await fetchSupabaseDashboardDate(date)

  setTeamData(supabaseData)
  setLastUpdate(null)
}, [])
const loadRankingsHistory = useCallback(async () => {
  setRankingsHistory(prev => ({
    ...prev,
    loading: true,
    error: '',
  }))

  try {
    const [agentResult, teamResult] = await Promise.all([
      supabase
        .from('daily_agent_stats_v2')
        .select('*')
        .gte('date', OFFICIAL_DATA_START)
        .range(0, 49999),

      supabase
        .from('daily_team_stats_v2')
        .select('*')
        .gte('date', OFFICIAL_DATA_START)
        .range(0, 9999),
    ])

    if (agentResult.error) throw agentResult.error
    if (teamResult.error) throw teamResult.error

    const insights = buildRankingHistoryInsights(
      agentResult.data || [],
      teamResult.data || []
    )

    setRankingsHistory({
      insights,
      loading: false,
      error: '',
    })
  } catch (err) {
    console.error('Failed loading rankings history:', err)

    setRankingsHistory({
      insights: null,
      loading: false,
      error: String(err?.message || err || 'Failed loading rankings history'),
    })
  }
}, [])
  useEffect(() => {
    let cancelled = false
    const requestedDate = selectedDate

    const run = async () => {
      selectedDateRef.current = requestedDate
      setLoading(true)
      setError('')

      // Clear the previous date/team data before loading the new selection.
      // This prevents the UI from briefly showing old high numbers while
      // the requested date is still loading.
      teamDataRef.current = {}
      setTeamData({})

      try {
        if (requestedDate === todayKey()) await loadLiveTeams()
        else await loadHistoricalTeams(requestedDate)
      } catch (err) {
        if (!cancelled) setError(String(err?.message || err || 'Failed to load dashboard data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [selectedDate, isToday, loadLiveTeams, loadHistoricalTeams])

  useEffect(() => {
    loadRemoteDates().catch(() => {})
  }, [loadRemoteDates])

  useEffect(() => {
    if (activeView !== 'rankings') return
    if (rankingsHistory.loading || rankingsHistory.insights) return

    loadRankingsHistory().catch(() => {})
  }, [activeView, loadRankingsHistory, rankingsHistory.insights, rankingsHistory.loading])

  useEffect(() => {
    if (!isToday) return

    let cancelled = false
    let timer = null

    const scheduleNext = () => {
      if (cancelled) return

      timer = window.setTimeout(async () => {
        try {
          await loadLiveTeams()
        } catch (err) {
          console.warn('Live refresh failed:', err)
        } finally {
          scheduleNext()
        }
      }, POLL_MS)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [isToday, loadLiveTeams])

  const dateTabs = useMemo(() => {
    const set = new Set([todayKey(), ...remoteDates])
    return [...set].filter(date => date >= CLEAN_START_DATE).sort((a, b) => b.localeCompare(a))
  }, [remoteDates])

  const allTeamCards = useMemo(() => {
    const liveCards = TEAM_ORDER
      .filter(teamId => teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: teamData[teamId] }))
      .sort((a, b) => {
        const diff = (b.parsed?.totals?.[sortMetric] || 0) - (a.parsed?.totals?.[sortMetric] || 0)
        if (diff !== 0) return diff

        return (b.parsed?.totals?.total || 0) - (a.parsed?.totals?.total || 0)
      })

    const missingCards = TEAM_ORDER
      .filter(teamId => !teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: null }))

    return [...liveCards, ...missingCards]
  }, [sortMetric, teamData])

  const selectedParsed = selectedTeam !== 'all' ? teamData[selectedTeam] : null
  const selectedTeamMeta = selectedTeam !== 'all' ? TEAMS[selectedTeam] : null
const dashboardTotals = useMemo(() => {
  if (activeView === 'rankings' && rangeMode === 'all_time') {
    const allTimeAgents = rankingsHistory.insights?.allTimeAgents || []

    return allTimeAgents.reduce((acc, agent) => {
      acc.english += Number(agent?.english || 0)
      acc.spanish += Number(agent?.spanish || 0)
      acc.invalid += Number(agent?.invalidTransfers || 0)
      acc.total += Number(agent?.total || 0)
      acc.activeAgents += 1
      return acc
    }, {
      english: 0,
      spanish: 0,
      invalid: 0,
      total: 0,
      activeAgents: 0,
    })
  }

  const source =
    selectedTeam === 'all'
      ? TEAM_ORDER.map(teamId => teamData[teamId]).filter(Boolean)
      : selectedParsed
        ? [selectedParsed]
        : []

  return source.reduce((acc, parsed) => {
    acc.english += Number(parsed?.totals?.english || 0)
    acc.spanish += Number(parsed?.totals?.spanish || 0)
    acc.invalid += Number(parsed?.invalidTransfers || 0)
    acc.total += Number(parsed?.totals?.total || 0)
    acc.activeAgents += Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0)
    return acc
  }, {
    english: 0,
    spanish: 0,
    invalid: 0,
    total: 0,
    activeAgents: 0,
  })
}, [activeView, rangeMode, rankingsHistory.insights, selectedTeam, selectedParsed, teamData])
const getExportEntriesFromData = useCallback((sourceData, teamId) => {
  if (!sourceData || !teamId || teamId === 'all') return []

  return sourceData[teamId]
    ? [
        {
          teamId,
          parsed: sourceData[teamId],
        },
      ]
    : []
}, [])

const handleDownloadTeamData = useCallback(async (teamId) => {
  if (!teamId || teamId === 'all') return

  try {
    const date = selectedDate
    const sourceData = teamData?.[teamId]
      ? teamData
      : await fetchSupabaseDashboardDate(date)

    const entries = getExportEntriesFromData(sourceData, teamId)

    if (!entries.length) {
      window.alert(`No data available for ${TEAMS[teamId]?.label || teamId} on ${date}.`)
      return
    }

    await downloadStyledDashboardExcel({
      date,
      label: date === todayKey() ? 'today' : 'saved',
      entries,
      selectedTeam: teamId,
    })
  } catch (err) {
    console.error('Export failed:', err)
    window.alert(`Could not export data: ${err?.message || err}`)
  }
}, [getExportEntriesFromData, selectedDate, teamData])

const normalizedSearch = useMemo(() => {
  return normalizeSearchText(searchQuery)
}, [searchQuery])

const activeSidebarItem = activeView === 'rankings' ? 'rankings' : selectedTeam === 'all' ? 'overview' : 'teams'

const visibleAllTeamCards = useMemo(() => {
  if (!normalizedSearch) return allTeamCards

  return allTeamCards
    .map(({ team, parsed }) => {
      const teamMatch = teamMatchesSearch(team, normalizedSearch)

      if (!parsed) {
        return teamMatch ? { team, parsed } : null
      }

      const filteredParsed = filterParsedBySearch(parsed, normalizedSearch)
      const hasAgentMatches = (filteredParsed?.agents || []).length > 0

      if (!teamMatch && !hasAgentMatches) return null

      return {
        team,
        parsed: teamMatch ? parsed : filteredParsed,
      }
    })
    .filter(Boolean)
}, [allTeamCards, normalizedSearch])

const selectedParsedForView = useMemo(() => {
  return filterParsedBySearch(selectedParsed, normalizedSearch)
}, [selectedParsed, normalizedSearch])

const officialDateTabs = useMemo(() => {
  return dateTabs.filter(date => isOfficialDate(date))
}, [dateTabs])

const searchSuggestions = useMemo(() => {
  return buildSearchSuggestions(teamData, searchQuery)
}, [teamData, searchQuery])

const handleSidebarNavigate = useCallback((item) => {
  if (item.id === 'overview') {
    setActiveView('overview')
    setSelectedTeam('all')
    setSelectedDateSafe(todayKey())
    setSortMetric('english')
    setRangeMode('day')
    setSearchQuery('')
    setUserMenuOpen(false)
    navigate('/dashboard')
    loadLiveTeams().catch(() => {})
    return
  }

  if (item.id === 'teams') {
    setActiveView('overview')
    setSelectedTeam('all')
    setRangeMode('day')
    setSearchQuery('')
    setUserMenuOpen(false)
    return
  }

  if (item.id === 'rankings') {
    setActiveView('rankings')
    setSelectedTeam('all')
    setRangeMode('all_time')
    setSearchQuery('')
    setUserMenuOpen(false)
    return
  }

  if (item.id === 'pulse-go') {
    navigate('/go')
    return
  }

  if (item.id === 'settings') {
    navigate('/settings')
    return
  }

  window.alert(`${item.label} is coming soon.`)
}, [loadLiveTeams, navigate, setSelectedDateSafe])

const handleTeamTabChange = useCallback((teamId) => {
  setActiveView('overview')
  setRangeMode('day')
  setSelectedTeam(teamId)
}, [])

const handleSuggestionClick = useCallback((item) => {
  if (!item) return

  if (item.type === 'agent') {
    setSearchQuery('')
    setUserMenuOpen(false)
    navigate(`/profile/${item.id}`)
    return
  }

  if (item.type === 'team') {
    setSearchQuery('')
    setUserMenuOpen(false)
    setActiveView('overview')
    setRangeMode('day')
    setSelectedTeam(item.id)
  }
}, [navigate])

const handleSearchSubmit = useCallback(() => {
  const first = searchSuggestions[0]
  if (first) handleSuggestionClick(first)
}, [searchSuggestions, handleSuggestionClick])

const handleUserAction = useCallback((action) => {
  setUserMenuOpen(false)

  if (action === 'profile') {
    navigate('/profile/3134')
    return
  }

  if (action === 'settings') {
    navigate('/settings')
    return
  }

  if (action === 'logout') {
    localStorage.removeItem('pulse_user')
    navigate('/signin')
  }
}, [navigate])

    return (
    <div className={`dash-root ${sidebarCollapsed ? 'lov-sidebar-collapsed' : ''}`}>
      <div className="lov-shell">
        <LovableSidebar
  collapsed={sidebarCollapsed}
  activeItem={activeSidebarItem}
  onNavigate={handleSidebarNavigate}
/>

        <div className="lov-main">
<LovableHeader
  sidebarCollapsed={sidebarCollapsed}
  onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onSearchSubmit={handleSearchSubmit}
  suggestions={searchSuggestions}
  onSuggestionClick={handleSuggestionClick}
  userMenuOpen={userMenuOpen}
  onToggleUserMenu={() => setUserMenuOpen(prev => !prev)}
  onUserAction={handleUserAction}
/>

          <main className="lov-content">
            <section className="lov-hero">
              <div className="lov-hero-left">
                <div className="lov-hero-badge">
                  {activeView === 'rankings' ? '🏆 Rankings · All Time' : '✦ AutoWarrantyGarrett · Live'}
                </div>

                <h1 className="lov-hero-title">
                  {activeView === 'rankings' ? '🏆 Rankings' : 'AutoWarranty Garrett'}
                </h1>

              
              </div>

<div className="lov-hero-right">
  <div className="lov-range-tabs">
    {activeView === 'rankings' ? (
      <button
        type="button"
        className={rangeMode === 'all_time' ? 'active' : ''}
        onClick={() => setRangeMode('all_time')}
      >
        All Time
      </button>
    ) : null}

    <button
      type="button"
      className={rangeMode === 'range' ? 'active' : ''}
      onClick={() => setRangeMode('range')}
    >
      Range
    </button>

    <button
      type="button"
      className={rangeMode === 'day' ? 'active' : ''}
      onClick={() => setRangeMode('day')}
    >
      Day
    </button>

    <button
      type="button"
      className={rangeMode === 'week' ? 'active' : ''}
      onClick={() => setRangeMode('week')}
    >
      Week
    </button>

    <button
      type="button"
      className={rangeMode === 'month' ? 'active' : ''}
      onClick={() => setRangeMode('month')}
    >
      Month
    </button>
  </div>
</div>

            </section>

<section className="lov-kpi-grid lov-kpi-grid-main">
  <LovableKpi title="English" value={dashboardTotals.english} tone="blue" />
  <LovableKpi title="Spanish" value={dashboardTotals.spanish} tone="green" />
  <LovableKpi title="Invalid" value={dashboardTotals.invalid} tone="red" />
  <LovableKpi title="Total Xfers" value={dashboardTotals.total} tone="orange" />
</section>

            {activeView === 'rankings' ? null : (
              <>
                <section className="lov-control-row">
                  <TeamTabs selectedTeam={selectedTeam} onChange={handleTeamTabChange} />

                  <SortTabs sortMetric={sortMetric} onChange={setSortMetric} />
                </section>

                <section className="lov-date-row">
                  {officialDateTabs.map(date => {
                    const active = date === selectedDate

                    return (
                      <button
                        key={date}
                        type="button"
                        className={`lov-date-btn ${active ? 'active' : ''}`}
                        onClick={() => setSelectedDateSafe(date)}
                      >
                        {formatDateLabel(date)}
                      </button>
                    )
                  })}
                </section>
              </>
            )}

            {loading ? (
              <div className="pulse-loading">Loading live team data...</div>
            ) : error ? (
              <div className="pulse-error">{error}</div>
            ) : activeView === 'rankings' ? (
              <RankingsPage
                teamData={teamData}
                selectedDate={selectedDate}
                rangeMode={rangeMode}
                history={rankingsHistory.insights}
                historyLoading={rankingsHistory.loading}
                historyError={rankingsHistory.error}
                navigate={navigate}
              />
            ) : selectedTeam === 'all' ? (
              <div className="pulse-overview-grid">
                {visibleAllTeamCards.map(({ team, parsed }, index) => (
                  parsed
                    ? (
                      <TeamOverviewCard
                        key={team.id}
                        team={team}
                        parsed={parsed}
                        sortMetric={sortMetric}
                        onOpen={teamId => { setActiveView('overview'); setRangeMode('day'); setSelectedTeam(teamId) }}
                        rankIndex={index}
                      />
                    )
                    : <TeamComingSoonCard key={team.id} team={team} />
                ))}
              </div>
            ) : selectedParsed && selectedTeamMeta ? (
<TeamDetail
  team={selectedTeamMeta}
  parsed={selectedParsedForView}
  selectedDate={selectedDate}
  navigate={navigate}
  onDownload={handleDownloadTeamData}
/>
            ) : (
              <TeamComingSoonCard team={TEAMS[selectedTeam]} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}