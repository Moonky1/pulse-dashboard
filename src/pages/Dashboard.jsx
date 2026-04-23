import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './dashboard.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const POLL_MS = 30000
const CACHE_KEY = 'pulse_dashboard_live_cache_v4'

const MEDALS = ['/emojis/medal1.webp', '/emojis/medal2.webp', '/emojis/medal3.webp']
const TEAM_RANK_EMOJIS = ['/emojis/goal1.webp', '/emojis/goal3.webp', '/emojis/goal4.webp']

const TEAMS = {
  asia: {
    id: 'asia',
    label: 'Asia',
    short: 'Asia',
    sheetName: 'AW GARRET ASIA LEXNER',
    flag: '/flags/asia.png',
    extPrefix: '3',
    hasSpanish: true,
    live: true,
    type: 'asia',
  },
  philippines: {
    id: 'philippines',
    label: 'Philippines',
    short: 'Philippines',
    sheetName: 'AW GARRET PHILIPPINES ',
    flag: '/flags/philippines.png',
    extPrefix: '1',
    hasSpanish: false,
    live: true,
    type: 'philippines',
  },
  colombia: {
    id: 'colombia',
    label: 'Colombia',
    short: 'Colombia',
    sheetName: 'AW GARRET COLOMBIA JUAN GARCIA',
    flag: '/flags/colombia.png',
    extPrefix: '2',
    hasSpanish: true,
    live: true,
    type: 'colombia',
  },
  mexico: {
    id: 'mexico',
    label: 'Mexico Baja',
    short: 'Mexico',
    sheetName: 'AW GARRET BAJA MX KEVIN',
    flag: '/flags/mexico.png',
    extPrefix: '5',
    hasSpanish: false,
    live: true,
    type: 'mexico',
  },
  central: {
    id: 'central',
    label: 'Central America',
    short: 'Central',
    flag: null,
    extPrefix: '4',
    hasSpanish: true,
    live: false,
    type: 'coming',
  },
  venezuela: {
    id: 'venezuela',
    label: 'Venezuela',
    short: 'Venezuela',
    flag: '/flags/venezuela.png',
    extPrefix: '6',
    hasSpanish: true,
    live: false,
    type: 'coming',
  },
}

const TEAM_ORDER = ['asia', 'philippines', 'colombia', 'mexico', 'central', 'venezuela']
const SORT_OPTIONS = [
  { id: 'english', label: 'English Xfers' },
  { id: 'spanish', label: 'Spanish Xfers' },
  { id: 'total', label: 'Total Xfers' },
]

const safeInt = (val) => {
  const cleaned = String(val ?? '').replace(/[$,]/g, '').trim()
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : 0
}
const cellUpper = (val) => String(val ?? '').trim().toUpperCase()
const rowText = (row, limit = 10) => (row || []).slice(0, limit).map(cellUpper).join(' | ')
const todayKey = () => new Date().toISOString().slice(0, 10)
const colombiaHour = () => (new Date().getUTCHours() - 5 + 24) % 24
const includeOT = () => colombiaHour() >= 18 || colombiaHour() < 6

const glassButtonBase = {
  appearance: 'none',
  WebkitAppearance: 'none',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: '#cbd5e1',
  borderRadius: 999,
  padding: '12px 16px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontSize: 15,
  lineHeight: 1,
  boxShadow: 'none',
  fontFamily: "'Sora', system-ui, sans-serif",
}

function tabStyle(active) {
  return active
    ? {
        ...glassButtonBase,
        borderColor: 'rgba(249,115,22,0.65)',
        background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.08))',
        color: '#fff',
      }
    : glassButtonBase
}

function sortButtonStyle(active) {
  return active
    ? {
        ...glassButtonBase,
        borderRadius: 14,
        borderColor: '#f97316',
        background: 'rgba(249,115,22,0.15)',
        color: '#fff',
      }
    : { ...glassButtonBase, borderRadius: 14 }
}

function dateButtonStyle(active) {
  return active
    ? {
        ...glassButtonBase,
        width: '100%',
        borderRadius: 14,
        borderColor: '#f97316',
        background: 'rgba(249,115,22,0.15)',
        color: '#fff',
        padding: '13px 10px',
      }
    : {
        ...glassButtonBase,
        width: '100%',
        borderRadius: 14,
        padding: '13px 10px',
      }
}

function normalizeAgent(name, ext, english, spanish = 0) {
  const en = safeInt(english)
  const sp = safeInt(spanish)
  return {
    name: String(name || '').trim(),
    ext: String(ext || '').replace(/,/g, '').trim(),
    english: en,
    spanish: sp,
    total: en + sp,
  }
}

function isAgentRow(nameCell, extCell, prefix) {
  const name = cellUpper(nameCell)
  const ext = String(extCell || '').replace(/,/g, '').trim()
  if (!new RegExp(`^${prefix}\\d{3}$`).test(ext)) return false
  if (!name) return false

  const banned = [
    'MANAGEMENT', 'USER', 'USERS', 'SUPERVISOR', 'EXTENSION', 'OPENERS', 'TRANSFERS', 'TRANSFER',
    'SPANISH', 'ENGLISH', 'TOTAL', 'TOTAL XFER', 'TOTAL XFERS', 'LEXNER', 'GENERAL MANAGER',
    'PACIFIC STANDARD TIME', 'BREAK', 'LUNCH', 'DAILY TARGET', 'XFER PER HOUR', 'THIS HOUR GOAL',
    'GOAL+', 'AGENT LOGGED IN', 'AGENTS LOGGED IN', 'LOG IN', 'LOGGED IN', 'COLOMBIA OT',
    'PHILIPPINES OT', 'MEXICO OT', 'JUAN GARCIA', 'ASIA', 'PHILIPPINES', 'MEXICO TEAM',
    'OT TAKERS', 'AW PHIL', 'ARWIN', 'PER AGENT', 'A U T O W A R R A N T Y',
  ]

  return !banned.some(word => name.includes(word))
}

function sortAgentsByMetric(agents, metric) {
  return [...(agents || [])].sort((a, b) => {
    const diff = (b?.[metric] || 0) - (a?.[metric] || 0)
    if (diff !== 0) return diff
    const totalDiff = (b?.total || 0) - (a?.total || 0)
    if (totalDiff !== 0) return totalDiff
    const englishDiff = (b?.english || 0) - (a?.english || 0)
    if (englishDiff !== 0) return englishDiff
    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
}

function mergeAgentMaps(mainMap, otMap, allowOT) {
  const merged = new Map()
  mainMap.forEach(agent => merged.set(agent.ext, { ...agent }))

  if (allowOT) {
    otMap.forEach(agent => {
      const prev = merged.get(agent.ext)
      if (!prev) merged.set(agent.ext, { ...agent })
      else {
        merged.set(agent.ext, {
          ...prev,
          english: prev.english + agent.english,
          spanish: prev.spanish + agent.spanish,
          total: prev.total + agent.total,
        })
      }
    })
  }

  return merged
}

function parseAsiaRows(rows, withOT) {
  const main = new Map()
  const ot = new Map()
  let inOT = false
  let mainFooter = null
  let otFooter = null

  for (const row of rows || []) {
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('OT TAKERS')) {
      inOT = true
      continue
    }

    if (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS')) {
      const footer = {
        spanish: safeInt(row[2]),
        english: safeInt(row[3]),
        total: safeInt(row[4]) || safeInt(row[2]) + safeInt(row[3]),
      }
      if (!inOT) mainFooter = footer
      else otFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '3')) continue
    const agent = normalizeAgent(name, ext, row[3], row[2])
    const target = inOT ? ot : main
    const prev = target.get(agent.ext)
    if (!prev) target.set(agent.ext, agent)
    else target.set(agent.ext, { ...prev, english: prev.english + agent.english, spanish: prev.spanish + agent.spanish, total: prev.total + agent.total })
  }

  return buildParsedTeam(main, ot, withOT, mainFooter, otFooter, true)
}

function parseColombiaRows(rows, withOT) {
  const main = new Map()
  const ot = new Map()
  let inOT = false
  let mainFooter = null

  for (const row of rows || []) {
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('COLOMBIA OT')) {
      inOT = true
      continue
    }

    if (!inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS'))) {
      const footer = {
        english: safeInt(row[3]),
        spanish: safeInt(row[4]),
        total: safeInt(row[5]) || safeInt(row[3]) + safeInt(row[4]),
      }
      if (footer.english || footer.spanish || footer.total) mainFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '2')) continue
    const agent = normalizeAgent(name, ext, row[3], row[4])
    const target = inOT ? ot : main
    const prev = target.get(agent.ext)
    if (!prev) target.set(agent.ext, agent)
    else target.set(agent.ext, { ...prev, english: prev.english + agent.english, spanish: prev.spanish + agent.spanish, total: prev.total + agent.total })
  }

  return buildParsedTeam(main, ot, withOT, mainFooter, null, true)
}

function parsePhilippinesRows(rows, withOT) {
  const main = new Map()
  const ot = new Map()
  let inOT = false
  let mainFooter = null
  let otFooter = null

  for (const row of rows || []) {
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('PHILIPPINES OT')) {
      inOT = true
      continue
    }

    if (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS')) {
      const value = Math.max(safeInt(row[2]), safeInt(row[3]), safeInt(row[4]))
      if (!inOT) mainFooter = { english: value, spanish: 0, total: value }
      else otFooter = { english: value, spanish: 0, total: value }
      continue
    }

    if (!isAgentRow(name, ext, '1')) continue
    const agent = normalizeAgent(name, ext, row[2], 0)
    const target = inOT ? ot : main
    const prev = target.get(agent.ext)
    if (!prev) target.set(agent.ext, agent)
    else target.set(agent.ext, { ...prev, english: prev.english + agent.english, total: prev.total + agent.total })
  }

  return buildParsedTeam(main, ot, withOT, mainFooter, otFooter, false)
}

function parseMexicoRows(rows, withOT) {
  const main = new Map()
  const ot = new Map()
  let inOT = false
  let mainFooter = null
  let otFooter = null

  for (const row of rows || []) {
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('MEXICO OT')) {
      inOT = true
      continue
    }

    if (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('AGENTS LOG IN') || txt.includes('TOTAL TRANSFERS')) {
      const value = Math.max(safeInt(row[3]), safeInt(row[4]), safeInt(row[5]), safeInt(row[2]))
      if (!inOT) mainFooter = { english: value, spanish: 0, total: value }
      else otFooter = { english: value, spanish: 0, total: value }
      continue
    }

    if (!isAgentRow(name, ext, '5')) continue
    const agent = normalizeAgent(name, ext, row[3], 0)
    const target = inOT ? ot : main
    const prev = target.get(agent.ext)
    if (!prev) target.set(agent.ext, agent)
    else target.set(agent.ext, { ...prev, english: prev.english + agent.english, total: prev.total + agent.total })
  }

  return buildParsedTeam(main, ot, withOT, mainFooter, otFooter, false)
}

function buildParsedTeam(mainMap, otMap, withOT, mainFooter, otFooter, hasSpanish) {
  const mainList = [...mainMap.values()]
  const otList = withOT ? [...otMap.values()] : []
  const merged = mergeAgentMaps(mainMap, otMap, withOT)
  const agents = sortAgentsByMetric([...merged.values()], 'total')

  const mainEnglishSum = mainList.reduce((sum, a) => sum + a.english, 0)
  const mainSpanishSum = mainList.reduce((sum, a) => sum + a.spanish, 0)
  const otEnglishSum = otList.reduce((sum, a) => sum + a.english, 0)
  const otSpanishSum = otList.reduce((sum, a) => sum + a.spanish, 0)

  const mainEnglish = Math.max(mainFooter?.english || 0, mainEnglishSum)
  const mainSpanish = hasSpanish ? Math.max(mainFooter?.spanish || 0, mainSpanishSum) : 0
  const otEnglish = withOT ? Math.max(otFooter?.english || 0, otEnglishSum) : 0
  const otSpanish = hasSpanish && withOT ? Math.max(otFooter?.spanish || 0, otSpanishSum) : 0

  return {
    agents,
    totals: {
      english: mainEnglish + otEnglish,
      spanish: mainSpanish + otSpanish,
      total: mainEnglish + mainSpanish + otEnglish + otSpanish,
      activeAgents: agents.length,
    },
    mainTotals: { english: mainEnglish, spanish: mainSpanish, total: mainEnglish + mainSpanish },
    otTotals: { english: otEnglish, spanish: otSpanish, total: otEnglish + otSpanish },
    includesOT: withOT,
  }
}

function parseLiveSheet(teamId, rows) {
  if (teamId === 'asia') return parseAsiaRows(rows, includeOT())
  if (teamId === 'philippines') return parsePhilippinesRows(rows, includeOT())
  if (teamId === 'colombia') return parseColombiaRows(rows, includeOT())
  if (teamId === 'mexico') return parseMexicoRows(rows, includeOT())
  return { agents: [], totals: { english: 0, spanish: 0, total: 0, activeAgents: 0 }, mainTotals: null, otTotals: null, includesOT: false }
}

async function fetchSheetViaScript(sheetName) {
  const url = `${SCRIPT_URL}?action=getSheet&sheetId=${encodeURIComponent(SHEET_ID)}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`
  const res = await fetch(url)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`getSheet failed: ${sheetName}`)
  return data.map(row => row.map(cell => String(cell ?? '')))
}

async function scriptPost(params) {
  const body = new URLSearchParams(params)
  await fetch(SCRIPT_URL, { method: 'POST', body, mode: 'no-cors' })
}

async function persistSnapshots(date, teamDataMap) {
  const totalsPayload = []
  const allAgents = []

  for (const teamId of Object.keys(teamDataMap || {})) {
    const parsed = teamDataMap[teamId]
    const team = TEAMS[teamId]
    if (!parsed || !team) continue

    totalsPayload.push({
      id: teamId,
      name: team.label,
      english: parsed.totals.english,
      spanish: parsed.totals.spanish,
      total: parsed.totals.total,
      agents: parsed.totals.activeAgents,
      noSpanish: !team.hasSpanish,
    })

    parsed.agents.forEach(agent => {
      allAgents.push({
        ext: agent.ext,
        name: agent.name,
        english: agent.english,
        spanish: agent.spanish,
        total: agent.total,
        team: teamId,
      })
    })

    await scriptPost({ action: 'saveTeamSnapshot', date, teamId, agents: JSON.stringify(parsed.agents) })
    await scriptPost({ action: 'saveToWeeklySheet', date, team: teamId, agents: JSON.stringify(parsed.agents) })
  }

  await scriptPost({ action: 'saveDailyTotals', date, teams: JSON.stringify(totalsPayload) })
  await scriptPost({ action: 'saveAgentSnapshots', date, snapshots: JSON.stringify(allAgents) })
}

function formatDateLabel(date) {
  if (date === todayKey()) return 'Today — LIVE'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function FlagImg({ src, size = 18, alt = '' }) {
  if (!src) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>🌎</span>
  return <img src={src} alt={alt} width={size} height={Math.round(size * 0.72)} style={{ borderRadius: 3, objectFit: 'cover', display: 'inline-block' }} />
}

function Medal({ index, size = 18 }) {
  return <img src={MEDALS[index]} alt="" width={size} height={size} style={{ objectFit: 'contain' }} />
}

function TeamTabs({ selectedTeam, onChange }) {
  return (
    <div className="pulse-tabs-grid">
      <button type="button" className={`pulse-tab ${selectedTeam === 'all' ? 'active' : ''}`} style={tabStyle(selectedTeam === 'all')} onClick={() => onChange('all')}>
        <span>All Teams</span>
      </button>

      {TEAM_ORDER.map(teamId => {
        const team = TEAMS[teamId]
        const active = selectedTeam === teamId
        return (
          <button key={teamId} type="button" className={`pulse-tab ${active ? 'active' : ''}`} style={tabStyle(active)} onClick={() => onChange(teamId)}>
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
        <button key={option.id} type="button" className={`pulse-sort-tab ${sortMetric === option.id ? 'active' : ''}`} style={sortButtonStyle(sortMetric === option.id)} onClick={() => onChange(option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({ title, value, color, subtitle }) {
  return (
    <div className="pulse-summary-card">
      <div className="pulse-summary-title">{title}</div>
      <div className="pulse-summary-value" style={{ color }}>{Number(value || 0).toLocaleString()}</div>
      <div className="pulse-summary-subtitle">{subtitle || ''}</div>
    </div>
  )
}

function TeamOverviewCard({ team, parsed, sortMetric, onOpen, rankIndex = 0 }) {
  const topThree = sortAgentsByMetric(parsed.agents, sortMetric).slice(0, 3)
  const teamRankIcon = TEAM_RANK_EMOJIS[rankIndex] || null
  const metricLabel = SORT_OPTIONS.find(opt => opt.id === sortMetric)?.label || 'Xfers'

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
          <div className="pulse-team-metric-label">{metricLabel}</div>
          <div className="pulse-team-metric-value">{Number(parsed.totals[sortMetric] || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="pulse-team-stats-grid">
        <div><span className="stat-k">English</span><span className="stat-v blue">{parsed.totals.english.toLocaleString()}</span></div>
        <div><span className="stat-k">Spanish</span><span className="stat-v green">{parsed.totals.spanish.toLocaleString()}</span></div>
        <div><span className="stat-k">Total</span><span className="stat-v orange">{parsed.totals.total.toLocaleString()}</span></div>
        <div><span className="stat-k">OT total</span><span className="stat-v purple">{parsed.otTotals?.total?.toLocaleString() || 0}</span></div>
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
          <div className="pulse-team-sub">Live reading is not enabled yet for this team.</div>
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
              {team.hasSpanish && <th>Spanish</th>}
              <th>English</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <tr key={agent.ext || `${agent.name}-${index}`}>
                <td>{index + 1}</td>
                <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td>#{agent.ext}</td>
                {team.hasSpanish && <td className="green">{agent.spanish}</td>}
                <td className="blue">{agent.english}</td>
                <td className="orange">{agent.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TeamDetail({ team, parsed, navigate }) {
  const showOT = parsed.includesOT && (parsed.otTotals?.total || 0) > 0
  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">Today — LIVE</div>
          <div className="pulse-hero-title-row">
            <FlagImg src={team.flag} size={28} alt="" />
            <div className="pulse-hero-title">{team.label}</div>
          </div>
          <div className="pulse-hero-sub">{parsed.totals.activeAgents} active agents{showOT ? ' • OT included' : ''}</div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard title="English" value={parsed.totals.english} color="#60a5fa" subtitle={parsed.mainTotals ? `Main: ${parsed.mainTotals.english}` : ''} />
        {team.hasSpanish && <SummaryCard title="Spanish" value={parsed.totals.spanish} color="#34d399" subtitle={parsed.mainTotals ? `Main: ${parsed.mainTotals.spanish}` : ''} />}
        <SummaryCard title="Total" value={parsed.totals.total} color="#f59e0b" subtitle={showOT ? `OT: ${parsed.otTotals.total}` : ''} />
        <SummaryCard title="Active agents" value={parsed.totals.activeAgents} color="#c084fc" subtitle="Live snapshot" />
      </div>

      <div className="pulse-top-blocks-grid">
        <TopRow title="Top English" metric="english" agents={parsed.agents} />
        {team.hasSpanish && <TopRow title="Top Spanish" metric="spanish" agents={parsed.agents} />}
        <TopRow title="Top Total" metric="total" agents={parsed.agents} />
      </div>

      <AgentTable team={team} agents={parsed.agents} navigate={navigate} />
    </>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [sortMetric, setSortMetric] = useState('english')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamData, setTeamData] = useState({})
  const [lastUpdate, setLastUpdate] = useState(null)

  const liveTeamIds = useMemo(() => TEAM_ORDER.filter(teamId => TEAMS[teamId].live), [])

  const loadCache = useCallback(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached?.teamData) {
        setTeamData(cached.teamData)
        if (cached.lastUpdate) setLastUpdate(new Date(cached.lastUpdate))
        setLoading(false)
      }
    } catch (e) {}
  }, [])

  const loadLiveTeams = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setError('')

    const results = await Promise.allSettled(
      liveTeamIds.map(teamId => fetchSheetViaScript(TEAMS[teamId].sheetName))
    )

    const next = {}
    liveTeamIds.forEach((teamId, index) => {
      if (results[index].status === 'fulfilled') {
        next[teamId] = parseLiveSheet(teamId, results[index].value)
      }
    })

    if (!Object.keys(next).length) throw new Error('Failed to read live team sheets')

    setTeamData(prev => {
      const merged = { ...prev, ...next }
      localStorage.setItem(CACHE_KEY, JSON.stringify({ teamData: merged, lastUpdate: new Date().toISOString() }))
      return merged
    })

    setLastUpdate(new Date())
    persistSnapshots(todayKey(), next).catch(() => {})
  }, [liveTeamIds])

  useEffect(() => {
    let cancelled = false
    loadCache()

    const run = async () => {
      try {
        await loadLiveTeams({ silent: false })
      } catch (err) {
        if (!cancelled) setError(String(err?.message || err || 'Failed to load dashboard data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [loadCache, loadLiveTeams])

  useEffect(() => {
    const timer = setInterval(() => {
      loadLiveTeams({ silent: true }).catch(() => {})
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [loadLiveTeams])

  const allTeamCards = useMemo(() => {
    const liveCards = liveTeamIds
      .filter(teamId => teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: teamData[teamId] }))
      .sort((a, b) => {
        const diff = (b.parsed?.totals?.[sortMetric] || 0) - (a.parsed?.totals?.[sortMetric] || 0)
        if (diff !== 0) return diff
        return (b.parsed?.totals?.total || 0) - (a.parsed?.totals?.total || 0)
      })

    const placeholders = TEAM_ORDER
      .filter(teamId => !TEAMS[teamId].live)
      .map(teamId => ({ team: TEAMS[teamId], parsed: null }))

    return [...liveCards, ...placeholders]
  }, [liveTeamIds, sortMetric, teamData])

  const selectedParsed = selectedTeam !== 'all' ? teamData[selectedTeam] : null
  const selectedTeamMeta = selectedTeam !== 'all' ? TEAMS[selectedTeam] : null

  return (
    <div style={{ minHeight: '100vh', background: '#040812', color: '#fff' }}>
      <Navbar />

      <style>{`
        button{font-family:'Sora',system-ui,sans-serif}
        .pulse-page{max-width:1320px;margin:0 auto;padding:26px 20px 60px}
        .pulse-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
        .pulse-title{margin:0;font-size:32px;font-weight:900;color:#f8fafc}
        .pulse-subtext{margin-top:8px;color:#94a3b8;font-size:14px;line-height:1.5}
        .pulse-updated{color:#94a3b8;font-size:13px}
        .pulse-tabs-grid{display:flex;flex-wrap:wrap;gap:10px;padding:16px;border-radius:28px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);margin-bottom:18px}
        .pulse-sort-tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
        .pulse-content-grid{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px;align-items:start}
        .pulse-sidebar{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:16px;position:sticky;top:86px}
        .pulse-sidebar-title{font-size:12px;color:#94a3b8;margin-bottom:12px;font-weight:800;letter-spacing:0.08em}
        .pulse-dates-grid{display:grid;grid-template-columns:1fr;gap:10px}
        .pulse-overview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .pulse-team-card{background:linear-gradient(135deg,rgba(249,115,22,0.10),rgba(59,130,246,0.05));border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:20px;cursor:pointer;min-height:220px}
        .pulse-coming-soon{background:rgba(255,255,255,0.03);min-height:130px;cursor:default}
        .pulse-team-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
        .pulse-team-title-wrap{display:flex;align-items:center;gap:12px}
        .pulse-team-name{font-size:20px;font-weight:900;color:#f8fafc}
        .pulse-team-sub{margin-top:4px;font-size:13px;color:#94a3b8;line-height:1.45}
        .pulse-team-metric{text-align:right}
        .pulse-team-metric-label{font-size:12px;color:#94a3b8}
        .pulse-team-metric-value{margin-top:4px;font-size:22px;font-weight:900;color:#60a5fa}
        .pulse-team-rank-badge{min-width:28px;display:flex;align-items:center;justify-content:center}
        .pulse-team-rank-text{font-weight:900;color:#94a3b8;font-size:14px}
        .pulse-team-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
        .stat-k{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px}.stat-v{display:block;font-size:18px;font-weight:900}
        .blue{color:#60a5fa}.green{color:#34d399}.orange{color:#f59e0b}.purple{color:#c084fc}
        .pulse-top3-list{display:grid;gap:8px;margin-top:18px}.pulse-top3-item{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:8px;align-items:center}.pulse-top3-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e5e7eb;font-size:13px}.pulse-top3-val{font-weight:900;color:#f8fafc;font-size:13px}
        .pulse-hero-card{background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(59,130,246,0.06));border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:24px;margin-bottom:18px}.pulse-hero-date{font-size:13px;color:#94a3b8;margin-bottom:6px}.pulse-hero-title-row{display:flex;align-items:center;gap:12px}.pulse-hero-title{font-size:30px;font-weight:900}.pulse-hero-sub{margin-top:6px;color:#94a3b8;font-size:14px}
        .pulse-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.pulse-summary-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:18px}.pulse-summary-title{font-size:13px;color:#94a3b8;margin-bottom:10px}.pulse-summary-value{font-size:42px;font-weight:900;line-height:1}.pulse-summary-subtitle{margin-top:10px;color:#94a3b8;font-size:13px;min-height:18px}
        .pulse-top-blocks-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.pulse-top-block{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px}.pulse-top-block-title{font-size:14px;font-weight:800;color:#f8fafc;margin-bottom:12px}.pulse-top-block-item{display:grid;grid-template-columns:20px minmax(0,1fr) auto auto;gap:8px;align-items:center;margin-top:8px}.pulse-top-block-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;color:#f8fafc}.pulse-top-block-ext{font-size:12px;color:#94a3b8}.pulse-top-block-value{font-size:14px;font-weight:900;color:#f59e0b}
        .pulse-table-wrap{margin-top:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden}.pulse-table-title{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:800;color:#e5e7eb}.pulse-table-scroll{overflow-x:auto}.pulse-table{width:100%;border-collapse:collapse}.pulse-table th{padding:12px 16px;text-align:left;font-size:12px;color:#94a3b8;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:rgba(255,255,255,0.02)}.pulse-table td{padding:12px 16px;font-size:14px;color:#e5e7eb;border-top:1px solid rgba(255,255,255,0.04)}.pulse-table .linkish{font-weight:700;color:#f8fafc;cursor:pointer}
        .pulse-loading,.pulse-error{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:48px 24px;text-align:center;color:#94a3b8}.pulse-error{background:rgba(127,29,29,0.18);border-color:rgba(248,113,113,0.35);color:#fecaca}
        @media (max-width:1100px){.pulse-content-grid{grid-template-columns:1fr}.pulse-sidebar{position:static}.pulse-overview-grid{grid-template-columns:1fr 1fr}}
        @media (max-width:860px){.pulse-overview-grid,.pulse-summary-grid,.pulse-top-blocks-grid{grid-template-columns:1fr}.pulse-team-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr)}.pulse-title{font-size:28px}.pulse-hero-title{font-size:26px}.pulse-summary-value{font-size:34px}}
        @media (max-width:640px){.pulse-page{padding:18px 14px 44px}.pulse-tabs-grid{padding:12px;border-radius:22px}.pulse-team-card{padding:16px;min-height:auto}.pulse-team-card-top{display:block}.pulse-team-metric{text-align:left;margin-top:12px}.pulse-top-block-item{grid-template-columns:20px minmax(0,1fr) auto}.pulse-top-block-ext{display:none}.pulse-team-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr)}}
      `}</style>

      <div className="pulse-page">
        <div className="pulse-topbar">
          <div>
            <h1 className="pulse-title">Pulse</h1>
            <div className="pulse-subtext">Live now: Asia, Philippines, Colombia and Mexico. Other teams stay visible while we add them slowly and safely.</div>
          </div>
          <div className="pulse-updated">{lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for first load...'}</div>
        </div>

        <TeamTabs selectedTeam={selectedTeam} onChange={setSelectedTeam} />

        <div className="pulse-content-grid">
          <div>
            {loading ? (
              <div className="pulse-loading">Loading live team data...</div>
            ) : error ? (
              <div className="pulse-error">{error}</div>
            ) : selectedTeam === 'all' ? (
              <>
                <SortTabs sortMetric={sortMetric} onChange={setSortMetric} />
                <div className="pulse-overview-grid">
                  {allTeamCards.map(({ team, parsed }, index) => (
                    parsed
                      ? <TeamOverviewCard key={team.id} team={team} parsed={parsed} sortMetric={sortMetric} onOpen={setSelectedTeam} rankIndex={index} />
                      : <TeamComingSoonCard key={team.id} team={team} />
                  ))}
                </div>
              </>
            ) : selectedParsed && selectedTeamMeta ? (
              <TeamDetail team={selectedTeamMeta} parsed={selectedParsed} navigate={navigate} />
            ) : (
              <TeamComingSoonCard team={TEAMS[selectedTeam]} />
            )}
          </div>

          <div className="pulse-sidebar">
            <div className="pulse-sidebar-title">DATES</div>
            <div className="pulse-dates-grid">
              <button type="button" style={dateButtonStyle(true)}>Today — LIVE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
