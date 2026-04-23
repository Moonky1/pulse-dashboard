import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './dashboard.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const CLEAN_START_DATE = '2026-04-23'
const POLL_MS = 30000

const MEDALS = ['/emojis/medal1.webp', '/emojis/medal2.webp', '/emojis/medal3.webp']

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
  },
  central: {
    id: 'central',
    label: 'Central America',
    short: 'Central',
    flag: null,
    extPrefix: '4',
    hasSpanish: true,
    live: false,
  },
  mexico: {
    id: 'mexico',
    label: 'Mexico Baja',
    short: 'Mexico',
    flag: '/flags/mexico.png',
    extPrefix: '5',
    hasSpanish: false,
    live: false,
  },
  venezuela: {
    id: 'venezuela',
    label: 'Venezuela',
    short: 'Venezuela',
    flag: '/flags/venezuela.png',
    extPrefix: '6',
    hasSpanish: true,
    live: false,
  },
}

const TEAM_ORDER = ['asia', 'philippines', 'colombia', 'central', 'mexico', 'venezuela']
const SORT_OPTIONS = [
  { id: 'english', label: 'English Xfers' },
  { id: 'spanish', label: 'Spanish Xfers' },
  { id: 'total', label: 'Total Xfers' },
]

const safeInt = (val) => parseInt(String(val ?? '').replace(/,/g, '').trim(), 10) || 0
const cellUpper = (val) => String(val ?? '').trim().toUpperCase()
const todayKey = () => new Date().toISOString().slice(0, 10)
const colombiaHour = () => (new Date().getUTCHours() - 5 + 24) % 24
const includeOT = () => colombiaHour() >= 18 || colombiaHour() < 6

function normalizeDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
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

function buildAgent(name, ext, spanish, english) {
  const sp = safeInt(spanish)
  const en = safeInt(english)
  return {
    name: String(name || '').trim(),
    ext: String(ext || '').replace(/,/g, '').trim(),
    spanish: sp,
    english: en,
    total: sp + en,
  }
}

function isAgentRow(nameCell, extCell, prefix) {
  const name = cellUpper(nameCell)
  const ext = String(extCell || '').replace(/,/g, '').trim()
  if (!new RegExp(`^${prefix}\\d{3}$`).test(ext)) return false
  if (!name) return false
  const banned = [
    'MANAGEMENT', 'USER', 'USERS', 'SUPERVISOR', 'EXTENSION', 'OPENERS', 'TRANSFERS', 'TRANSFER', 'SPANISH', 'ENGLISH', 'TOTAL',
    'LEXNER', 'GENERAL MANAGER', 'PACIFIC STANDARD TIME', 'BREAK', 'LUNCH', 'DAILY TARGET', 'XFER PER HOUR',
    'THIS HOUR GOAL', 'GOAL+', 'AGENT LOGGED IN', 'AGENTS LOGGED IN', 'COLOMBIA OT', 'JUAN GARCIA', 'ASIA', 'PHILIPPINES',
    'OT TAKERS', 'PHILIPPINES OT', 'AW PHIL', 'ARWIN', 'SUPERVISOR', 'PER AGENT'
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

    if (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS')) {
      const footer = {
        spanish: safeInt(row[2]),
        english: safeInt(row[3]),
        total: safeInt(row[4]) || (safeInt(row[2]) + safeInt(row[3]))
      }
      if (!inOT) mainFooter = footer
      else otFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '3')) continue
    const agent = buildAgent(name, ext, row[2], row[3])

    if (!inOT) mainAgents.set(agent.ext, agent)
    else {
      const prev = otAgents.get(agent.ext)
      if (!prev) otAgents.set(agent.ext, agent)
      else {
        otAgents.set(agent.ext, {
          ...prev,
          english: prev.english + agent.english,
          spanish: prev.spanish + agent.spanish,
          total: prev.total + agent.total,
        })
      }
    }
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT ? [...otAgents.values()] : []
  const merged = new Map()
  mainList.forEach(agent => merged.set(agent.ext, { ...agent }))
  otList.forEach(agent => {
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

  const agents = sortAgentsByMetric([...merged.values()], 'total')
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, a) => sum + a.spanish, 0)
  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, a) => sum + a.english, 0)
  const otSpanish = withOT ? (otFooter ? otFooter.spanish : otList.reduce((sum, a) => sum + a.spanish, 0)) : 0
  const otEnglish = withOT ? (otFooter ? otFooter.english : otList.reduce((sum, a) => sum + a.english, 0)) : 0

  return {
    agents,
    totals: {
      spanish: mainSpanish + otSpanish,
      english: mainEnglish + otEnglish,
      total: mainSpanish + mainEnglish + otSpanish + otEnglish,
      activeAgents: agents.length,
    },
    mainTotals: { spanish: mainSpanish, english: mainEnglish, total: mainSpanish + mainEnglish },
    otTotals: { spanish: otSpanish, english: otEnglish, total: otSpanish + otEnglish },
    includesOT: withOT,
  }
}

function parseColombiaRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()
  let inOT = false
  let sawOTSection = false
  let mainFooter = null

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

    if (!inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS'))) {
      const footer = {
        english: safeInt(row[3]),
        spanish: safeInt(row[4]),
        total: safeInt(row[5]) || (safeInt(row[3]) + safeInt(row[4]))
      }
      if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) mainFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '2')) continue

    const english = safeInt(row[3])
    const spanish = safeInt(row[4])
    const agent = buildAgent(name, ext, spanish, english)

    if (!inOT) mainAgents.set(agent.ext, agent)
    else {
      const prev = otAgents.get(agent.ext)
      if (!prev) otAgents.set(agent.ext, agent)
      else {
        otAgents.set(agent.ext, {
          ...prev,
          english: prev.english + agent.english,
          spanish: prev.spanish + agent.spanish,
          total: prev.total + agent.total,
        })
      }
    }
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT && sawOTSection ? [...otAgents.values()] : []
  const merged = new Map()
  mainList.forEach(agent => merged.set(agent.ext, { ...agent }))
  otList.forEach(agent => {
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

  const agents = sortAgentsByMetric([...merged.values()], 'total')
  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, a) => sum + a.english, 0)
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, a) => sum + a.spanish, 0)
  const otEnglish = withOT ? otList.reduce((sum, a) => sum + a.english, 0) : 0
  const otSpanish = withOT ? otList.reduce((sum, a) => sum + a.spanish, 0) : 0

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

function parsePhilippinesRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()
  let inOT = false
  let mainFooter = 0
  let otFooter = 0
  let sawOTSection = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('PHILIPPINES OT')) {
      sawOTSection = true
      inOT = true
      continue
    }

    if (!inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN'))) {
      // Main footer is column C in current sheet layout.
      mainFooter = Math.max(mainFooter, safeInt(row[2]), safeInt(row[3]))
      continue
    }

    if (inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN'))) {
      // OT footer is column C in the OT block. Ignore until after 6pm Colombia.
      otFooter = Math.max(otFooter, safeInt(row[2]), safeInt(row[3]))
      continue
    }

    if (!isAgentRow(name, ext, '1')) continue

    if (!inOT) {
      const english = safeInt(row[2])
      const agent = buildAgent(name, ext, 0, english)
      mainAgents.set(agent.ext, agent)
    } else {
      const english = safeInt(row[2])
      const agent = buildAgent(name, ext, 0, english)
      const prev = otAgents.get(agent.ext)
      if (!prev) otAgents.set(agent.ext, agent)
      else {
        otAgents.set(agent.ext, {
          ...prev,
          english: prev.english + agent.english,
          total: prev.total + agent.total,
        })
      }
    }
  }

  const mainList = [...mainAgents.values()]
  const otList = withOT && sawOTSection ? [...otAgents.values()] : []
  const merged = new Map()
  mainList.forEach(agent => merged.set(agent.ext, { ...agent }))
  otList.forEach(agent => {
    const prev = merged.get(agent.ext)
    if (!prev) merged.set(agent.ext, { ...agent })
    else {
      merged.set(agent.ext, {
        ...prev,
        english: prev.english + agent.english,
        total: prev.total + agent.total,
      })
    }
  })

  const agents = sortAgentsByMetric([...merged.values()], 'total')
  const mainEnglish = Math.max(mainFooter, mainList.reduce((sum, a) => sum + a.english, 0))
  const otEnglish = withOT ? Math.max(otFooter, otList.reduce((sum, a) => sum + a.english, 0)) : 0

  return {
    agents,
    totals: {
      english: mainEnglish + otEnglish,
      spanish: 0,
      total: mainEnglish + otEnglish,
      activeAgents: agents.length,
    },
    mainTotals: { english: mainEnglish, spanish: 0, total: mainEnglish },
    otTotals: { english: otEnglish, spanish: 0, total: otEnglish },
    includesOT: withOT,
  }
}

function parseLiveSheet(teamId, rows) {
  if (teamId === 'asia') return parseAsiaRows(rows, includeOT())
  if (teamId === 'colombia') return parseColombiaRows(rows, includeOT())
  if (teamId === 'philippines') return parsePhilippinesRows(rows, includeOT())
  return { agents: [], totals: { english: 0, spanish: 0, total: 0, activeAgents: 0 }, mainTotals: null, otTotals: null, includesOT: false }
}

async function fetchSheetViaScript(sheetName) {
  const url = `${SCRIPT_URL}?action=getSheet&sheetId=${encodeURIComponent(SHEET_ID)}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`
  const res = await fetch(url)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`getSheet failed: ${sheetName}`)
  return data.map(row => row.map(cell => String(cell ?? '')))
}

async function scriptCall(params) {
  const url = `${SCRIPT_URL}?${new URLSearchParams(params)}&t=${Date.now()}`
  const res = await fetch(url)
  return res.json()
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
    if (!parsed) continue

    totalsPayload.push({
      id: teamId,
      name: TEAMS[teamId]?.label || teamId,
      english: parsed.totals.english,
      spanish: parsed.totals.spanish,
      total: parsed.totals.total,
      agents: parsed.totals.activeAgents,
      noSpanish: !TEAMS[teamId]?.hasSpanish,
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

    await scriptPost({
      action: 'saveTeamSnapshot',
      date,
      teamId,
      agents: JSON.stringify(parsed.agents),
    })

    await scriptPost({
      action: 'saveToWeeklySheet',
      date,
      team: teamId,
      agents: JSON.stringify(parsed.agents),
    })
  }

  await scriptPost({
    action: 'saveDailyTotals',
    date,
    teams: JSON.stringify(totalsPayload),
  })

  await scriptPost({
    action: 'saveAgentSnapshots',
    date,
    snapshots: JSON.stringify(allAgents),
  })
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

function SummaryCard({ title, value, color, subtitle }) {
  return (
    <div className="pulse-summary-card">
      <div className="pulse-summary-title">{title}</div>
      <div className="pulse-summary-value" style={{ color }}>{Number(value || 0).toLocaleString()}</div>
      <div className="pulse-summary-subtitle">{subtitle || ''}</div>
    </div>
  )
}

function TeamOverviewCard({ team, parsed, sortMetric, onOpen }) {
  const topThree = sortAgentsByMetric(parsed.agents, sortMetric).slice(0, 3)
  return (
    <div className="pulse-team-card" onClick={() => onOpen(team.id)}>
      <div className="pulse-team-card-top">
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
              <th>Spanish</th>
              <th>English</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <tr key={agent.ext}>
                <td>{index + 1}</td>
                <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td>#{agent.ext}</td>
                <td className="green">{agent.spanish}</td>
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

function TeamDetail({ team, parsed, selectedDate, navigate }) {
  const showOT = parsed.includesOT && (parsed.otTotals?.total || 0) > 0
  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">{formatDateLabel(selectedDate)}</div>
          <div className="pulse-hero-title-row">
            <FlagImg src={team.flag} size={28} alt="" />
            <div className="pulse-hero-title">{team.label}</div>
          </div>
          <div className="pulse-hero-sub">{parsed.totals.activeAgents} active agents{showOT ? ' • OT included' : ''}</div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard title="English" value={parsed.totals.english} color="#60a5fa" subtitle={parsed.mainTotals ? `Main: ${parsed.mainTotals.english}` : ''} />
        <SummaryCard title="Spanish" value={parsed.totals.spanish} color="#34d399" subtitle={parsed.mainTotals ? `Main: ${parsed.mainTotals.spanish}` : ''} />
        <SummaryCard title="Total" value={parsed.totals.total} color="#f59e0b" subtitle={showOT ? `OT: ${parsed.otTotals.total}` : ''} />
        <SummaryCard title="Active agents" value={parsed.totals.activeAgents} color="#c084fc" subtitle={selectedDate === todayKey() ? 'Live snapshot' : 'Saved snapshot'} />
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

  const liveTeamIds = useMemo(() => TEAM_ORDER.filter(teamId => TEAMS[teamId].live), [])
  const isToday = selectedDate === todayKey()

  const loadRemoteDates = useCallback(async () => {
    const data = await scriptCall({ action: 'getDailyTotals' })
    if (!Array.isArray(data)) return
    const dates = data
      .map(entry => normalizeDate(entry.date))
      .filter(date => date && date >= CLEAN_START_DATE)
    setRemoteDates([...new Set(dates)].sort((a, b) => b.localeCompare(a)))
  }, [])

  const loadLiveTeams = useCallback(async () => {
    setError('')
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

    setTeamData(next)
    setLastUpdate(new Date())
    await persistSnapshots(todayKey(), next)
    await loadRemoteDates()
  }, [liveTeamIds, loadRemoteDates])

  const loadHistoricalTeams = useCallback(async (date) => {
    setError('')
    const [teamSnapshots, totals] = await Promise.all([
      Promise.all(liveTeamIds.map(teamId => scriptCall({ action: 'getTeamSnapshot', date, teamId }))),
      scriptCall({ action: 'getDailyTotals' }),
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

      next[teamId] = {
        agents: sortAgentsByMetric(agents, 'total'),
        totals: {
          english: Number(totalsRow?.english) || agents.reduce((sum, agent) => sum + (agent.english || 0), 0),
          spanish: Number(totalsRow?.spanish) || agents.reduce((sum, agent) => sum + (agent.spanish || 0), 0),
          total: Number(totalsRow?.total) || agents.reduce((sum, agent) => sum + (agent.total || 0), 0),
          activeAgents: Number(totalsRow?.agents) || agents.length,
        },
        mainTotals: null,
        otTotals: null,
        includesOT: false,
      }
    })

    setTeamData(next)
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
    return () => { cancelled = true }
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
        .pulse-page{max-width:1320px;margin:0 auto;padding:26px 20px 60px}
        .pulse-topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
        .pulse-title{margin:0;font-size:32px;font-weight:900;color:#f8fafc}
        .pulse-subtext{margin-top:8px;color:#94a3b8;font-size:14px;line-height:1.5}
        .pulse-updated{color:#94a3b8;font-size:13px}
        .pulse-tabs-grid{display:flex;flex-wrap:wrap;gap:10px;padding:16px;border-radius:28px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);margin-bottom:18px}
        .pulse-tab{border:1px solid transparent;background:transparent;color:#cbd5e1;border-radius:999px;padding:12px 16px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:15px}
        .pulse-tab.active{border-color:rgba(249,115,22,0.55);background:rgba(249,115,22,0.18);color:#fff}
        .pulse-sort-tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
        .pulse-sort-tab{border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:#cbd5e1;border-radius:16px;padding:12px 16px;font-weight:800;cursor:pointer;font-size:14px}
        .pulse-sort-tab.active{border-color:#f97316;background:rgba(249,115,22,0.12);color:#fff}
        .pulse-content-grid{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px;align-items:start}
        .pulse-sidebar{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:16px;position:sticky;top:86px}
        .pulse-sidebar-title{font-size:12px;color:#94a3b8;margin-bottom:12px;font-weight:800;letter-spacing:0.08em}
        .pulse-dates-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .pulse-date-btn{border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:#cbd5e1;border-radius:14px;padding:12px 10px;font-weight:800;cursor:pointer}
        .pulse-date-btn.active{border-color:#f97316;background:rgba(249,115,22,0.12);color:#fff}
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
        .pulse-team-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
        .stat-k{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px}
        .stat-v{display:block;font-size:18px;font-weight:900}
        .blue{color:#60a5fa}.green{color:#34d399}.orange{color:#f59e0b}.purple{color:#c084fc}
        .pulse-top3-list{display:grid;gap:8px;margin-top:18px}
        .pulse-top3-item{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:8px;align-items:center}
        .pulse-top3-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e5e7eb;font-size:13px}
        .pulse-top3-val{font-weight:900;color:#f8fafc;font-size:13px}
        .pulse-hero-card{background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(59,130,246,0.06));border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:24px;margin-bottom:18px}
        .pulse-hero-date{font-size:13px;color:#94a3b8;margin-bottom:6px}
        .pulse-hero-title-row{display:flex;align-items:center;gap:12px}
        .pulse-hero-title{font-size:30px;font-weight:900}
        .pulse-hero-sub{margin-top:6px;color:#94a3b8;font-size:14px}
        .pulse-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .pulse-summary-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:18px}
        .pulse-summary-title{font-size:13px;color:#94a3b8;margin-bottom:10px}
        .pulse-summary-value{font-size:42px;font-weight:900;line-height:1}
        .pulse-summary-subtitle{margin-top:10px;color:#94a3b8;font-size:13px;min-height:18px}
        .pulse-top-blocks-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
        .pulse-top-block{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:18px}
        .pulse-top-block-title{font-size:14px;font-weight:800;color:#f8fafc;margin-bottom:12px}
        .pulse-top-block-item{display:grid;grid-template-columns:20px minmax(0,1fr) auto auto;gap:8px;align-items:center;margin-top:8px}
        .pulse-top-block-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;color:#f8fafc}
        .pulse-top-block-ext{font-size:12px;color:#94a3b8}
        .pulse-top-block-value{font-size:14px;font-weight:900;color:#f59e0b}
        .pulse-table-wrap{margin-top:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:18px;overflow:hidden}
        .pulse-table-title{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:800;color:#e5e7eb}
        .pulse-table-scroll{overflow-x:auto}
        .pulse-table{width:100%;border-collapse:collapse}
        .pulse-table th{padding:12px 16px;text-align:left;font-size:12px;color:#94a3b8;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:rgba(255,255,255,0.02)}
        .pulse-table td{padding:12px 16px;font-size:14px;color:#e5e7eb;border-top:1px solid rgba(255,255,255,0.04)}
        .pulse-table .linkish{font-weight:700;color:#f8fafc;cursor:pointer}
        .pulse-loading,.pulse-error{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:48px 24px;text-align:center;color:#94a3b8}
        .pulse-error{background:rgba(127,29,29,0.18);border-color:rgba(248,113,113,0.35);color:#fecaca}
        @media (max-width: 1100px){
          .pulse-content-grid{grid-template-columns:1fr}
          .pulse-sidebar{position:static}
          .pulse-overview-grid{grid-template-columns:1fr 1fr}
        }
        @media (max-width: 860px){
          .pulse-overview-grid,.pulse-summary-grid,.pulse-top-blocks-grid{grid-template-columns:1fr}
          .pulse-team-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .pulse-title{font-size:28px}
          .pulse-hero-title{font-size:26px}
          .pulse-summary-value{font-size:34px}
        }
        @media (max-width: 640px){
          .pulse-page{padding:18px 14px 44px}
          .pulse-tabs-grid{padding:12px;border-radius:22px}
          .pulse-tab{padding:10px 12px;font-size:14px}
          .pulse-sort-tab{padding:10px 12px;font-size:13px}
          .pulse-dates-grid{grid-template-columns:1fr}
          .pulse-team-card{padding:16px;min-height:auto}
          .pulse-team-card-top{display:block}
          .pulse-team-metric{text-align:left;margin-top:12px}
          .pulse-top-block-item{grid-template-columns:20px minmax(0,1fr) auto}
          .pulse-top-block-ext{display:none}
          .pulse-team-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        }
      `}</style>

      <div className="pulse-page">
        <div className="pulse-topbar">
          <div>
            <h1 className="pulse-title">AutoWarrantyGarrett</h1>
            <div className="pulse-subtext">
              Live now: Asia, Philippines and Colombia. Other teams stay visible while we add them slowly and safely.
            </div>
          </div>

          <div className="pulse-updated">
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for first load...'}
          </div>
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
                  {allTeamCards.map(({ team, parsed }) => (
                    parsed
                      ? <TeamOverviewCard key={team.id} team={team} parsed={parsed} sortMetric={sortMetric} onOpen={setSelectedTeam} />
                      : <TeamComingSoonCard key={team.id} team={team} />
                  ))}
                </div>
              </>
            ) : selectedParsed && selectedTeamMeta ? (
              <TeamDetail team={selectedTeamMeta} parsed={selectedParsed} selectedDate={selectedDate} navigate={navigate} />
            ) : (
              <TeamComingSoonCard team={TEAMS[selectedTeam]} />
            )}
          </div>

          <div className="pulse-sidebar">
            <div className="pulse-sidebar-title">DATES</div>
            <div className="pulse-dates-grid">
              {dateTabs.map(date => {
                const active = date === selectedDate
                return (
                  <button key={date} className={`pulse-date-btn ${active ? 'active' : ''}`} onClick={() => setSelectedDate(date)}>
                    {formatDateLabel(date)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
