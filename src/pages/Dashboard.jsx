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
const POLL_MS = 30000

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
const todayKey = () => colombiaDate().toISOString().slice(0, 10)
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
    const fallbackRawTotal = fallbackEnglish + fallbackSpanish
    const fallbackTotal = agents.reduce((sum, agent) => sum + Number(agent.total || 0), 0)

    const english = Number(teamRow?.english ?? fallbackEnglish)
    const spanish = Number(teamRow?.spanish ?? fallbackSpanish)
    const invalidTransfers = Number(teamRow?.invalid_transfers ?? fallbackInvalid)
    const rawTotal = english + spanish
    const total = Number(teamRow?.total ?? (fallbackTotal || Math.max(0, rawTotal - invalidTransfers)))
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
      .from('daily_team_stats')
      .select('*')
      .eq('date', date),

    supabase
      .from('daily_agent_stats')
      .select('*')
      .eq('date', date)
      .range(0, 4999),
  ])

  if (teamResult.error) throw teamResult.error
  if (agentResult.error) throw agentResult.error

  return buildParsedTeamsFromSupabase(teamResult.data || [], agentResult.data || [])
}

async function fetchSupabaseDates() {
  const { data, error } = await supabase
    .from('daily_team_stats')
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

function protectTodayWithSupabase(liveParsed, savedParsed) {
  if (!liveParsed && !savedParsed) return emptyParsedTeam()
  if (!savedParsed) return liveParsed
  if (!liveParsed) return savedParsed

  const liveScore = getParsedScore(liveParsed)
  const savedScore = getParsedScore(savedParsed)

  // Main rule:
  // If Sheets got cleared/moved and Supabase has a stronger snapshot,
  // keep Supabase for Today LIVE.
  if (savedScore > liveScore) return savedParsed

  // Extra protection:
  // Sometimes the total is similar but live sheet has way fewer agents
  // because the chart was moved/cleared.
  const liveAgents = getParsedAgentCount(liveParsed)
  const savedAgents = getParsedAgentCount(savedParsed)

  if (savedScore === liveScore && savedAgents > liveAgents) return savedParsed

  return liveParsed
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

  const liveTeamIds = useMemo(() => TEAM_ORDER.filter(teamId => TEAMS[teamId].live), [])
  const isToday = selectedDate === todayKey()

  const selectedDateRef = useRef(selectedDate)

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

const loadRemoteDates = useCallback(async () => {
  try {
    const dates = await fetchSupabaseDates()
    setRemoteDates(dates)
    return
  } catch (err) {
    console.warn('Supabase dates failed, falling back to Apps Script:', err)
  }

  const data = await scriptCall({ action: 'getDailyTotals' })

  if (!Array.isArray(data)) return

  const dates = data
    .map(entry => normalizeDate(entry.date))
    .filter(date => date && date >= CLEAN_START_DATE)

  setRemoteDates([...new Set(dates)].sort((a, b) => b.localeCompare(a)))
}, [])

const loadLiveTeams = useCallback(async () => {
  setError('')

  const today = todayKey()

  const [savedTodayResult, sheetResults, invalidCounts] = await Promise.all([
    fetchSupabaseDashboardDate(today)
      .then(data => ({ ok: true, data }))
      .catch(err => {
        console.warn('Supabase today read failed:', err)
        return { ok: false, data: {} }
      }),

    Promise.allSettled(
      liveTeamIds.map(teamId => fetchTeamSheetViaScript(TEAMS[teamId]))
    ),

    fetchInvalidTransfersForDate(today).catch(() => ({})),
  ])

  const savedToday = savedTodayResult?.ok ? savedTodayResult.data : {}
  const next = {}

  liveTeamIds.forEach((teamId, index) => {
    const invalidInfo = invalidCounts?.[teamId] || { total: 0, byExt: {} }

    let liveParsed = null

    if (sheetResults[index].status === 'fulfilled') {
      try {
        const parsed = parseLiveSheet(teamId, sheetResults[index].value)
        liveParsed = applyInvalidTransfersToParsed(parsed, invalidInfo)
      } catch (err) {
        console.error(`Error parsing ${teamId}:`, err)
        liveParsed = applyInvalidTransfersToParsed(emptyParsedTeam(), invalidInfo)
      }
    } else {
      console.warn(`Failed loading ${teamId}:`, sheetResults[index].reason)
      liveParsed = applyInvalidTransfersToParsed(emptyParsedTeam(), invalidInfo)
    }

    const savedParsed = savedToday?.[teamId]
      ? applyInvalidTransfersToParsed(savedToday[teamId], invalidInfo)
      : null

    next[teamId] = protectTodayWithSupabase(liveParsed, savedParsed)
  })

  if (!Object.keys(next).length) throw new Error('Failed to read live team sheets')

  // Prevent an old LIVE request from overwriting a historical date
  // after the user clicks a saved day like 28/04.
  if (selectedDateRef.current !== todayKey()) return next

  setTeamData(next)
  setLastUpdate(new Date())

  loadRemoteDates().catch(() => {})
  return next
}, [liveTeamIds, loadRemoteDates])

const loadHistoricalTeams = useCallback(async (date) => {
  setError('')

  try {
    const supabaseData = await fetchSupabaseDashboardDate(date)

    if (Object.keys(supabaseData).length) {
      if (selectedDateRef.current !== date) return supabaseData

      setTeamData(supabaseData)
      setLastUpdate(null)
      return supabaseData
    }

    // Official data starts on 2026-04-28.
    // For official dates, do NOT fall back to old Apps Script snapshots,
    // because that can overwrite good Supabase data with zeros.
    if (date >= OFFICIAL_DATA_START) {
      if (selectedDateRef.current !== date) return {}

      setTeamData({})
      setLastUpdate(null)
      return {}
    }
  } catch (err) {
    console.warn('Supabase historical read failed:', err)

    if (date >= OFFICIAL_DATA_START) {
      throw err
    }
  }

  const [teamSnapshots, totals, invalidCounts] = await Promise.all([
    Promise.all(liveTeamIds.map(teamId => scriptCall({ action: 'getTeamSnapshot', date, teamId }))),
    scriptCall({ action: 'getDailyTotals' }),
    fetchInvalidTransfersForDate(date).catch(() => ({})),
  ])

  const dailyEntry = Array.isArray(totals)
    ? totals.find(entry => normalizeDate(entry.date) === date)
    : null

  const next = {}

  liveTeamIds.forEach((teamId, index) => {
    const snap = teamSnapshots[index]
    const agents = snap?.ok && Array.isArray(snap.agents) ? snap.agents : []
    const totalsRow = Array.isArray(dailyEntry?.teams)
      ? dailyEntry.teams.find(team => String(team.id) === teamId)
      : null

    const invalidInfo = invalidCounts?.[teamId] || { total: 0, byExt: {} }

    const parsed = {
      agents: sortAgentsByMetric(agents, 'total'),
      totals: {
        english: Number(totalsRow?.english) || agents.reduce((sum, agent) => sum + (agent.english || 0), 0),
        spanish: Number(totalsRow?.spanish) || agents.reduce((sum, agent) => sum + (agent.spanish || 0), 0),
        rawTotal: Number(totalsRow?.rawTotal) || agents.reduce((sum, agent) => sum + ((agent.spanish || 0) + (agent.english || 0)), 0),
        total: Number(totalsRow?.total) || agents.reduce((sum, agent) => sum + (agent.total || 0), 0),
        activeAgents: Number(totalsRow?.agents) || agents.length,
      },
      mainTotals: null,
      otTotals: null,
      includesOT: false,
      invalidTransfers: Number(totalsRow?.invalidTransfers || 0),
    }

    next[teamId] = applyInvalidTransfersToParsed(parsed, invalidInfo)
  })

  if (selectedDateRef.current !== date) return next

  setTeamData(next)
  return next
}, [liveTeamIds])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)

      try {
        if (isToday) await loadLiveTeams()
        else await loadHistoricalTeams(selectedDate)
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
    if (!isToday) return

    const timer = setInterval(() => {
      loadLiveTeams().catch(() => {})
    }, POLL_MS)

    return () => clearInterval(timer)
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
}, [selectedTeam, selectedParsed, teamData])
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

const activeSidebarItem = selectedTeam === 'all' ? 'overview' : 'teams'

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
    setSelectedTeam('all')
    setSelectedDate(todayKey())
    setSortMetric('english')
    setSearchQuery('')
    setUserMenuOpen(false)
    navigate('/dashboard')
    loadLiveTeams().catch(() => {})
    return
  }

  if (item.id === 'teams') {
    setSelectedTeam('all')
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
}, [loadLiveTeams, navigate])

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
                <div className="lov-hero-badge">✦ AutoWarrantyGarrett · Live</div>

                <h1 className="lov-hero-title">AutoWarranty Garrett</h1>

              
              </div>

<div className="lov-hero-right">
  <div className="lov-range-tabs">
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

            <section className="lov-control-row">
              <TeamTabs selectedTeam={selectedTeam} onChange={setSelectedTeam} />

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
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatDateLabel(date)}
                  </button>
                )
              })}
            </section>

            {loading ? (
              <div className="pulse-loading">Loading live team data...</div>
            ) : error ? (
              <div className="pulse-error">{error}</div>
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
                        onOpen={setSelectedTeam}
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