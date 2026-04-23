import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './dashboard.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const CLEAN_START_DATE = '2026-04-23'
const POLL_MS = 30000

const SHEETS = {
  asia: { id: 'asia', label: 'Asia', sheetName: 'AW GARRET ASIA LEXNER', flag: '/flags/asia.png', extPrefix: '3', hasSpanish: true },
  colombia: { id: 'colombia', label: 'Colombia', sheetName: 'AW GARRET COLOMBIA JUAN GARCIA', flag: '/flags/colombia.png', extPrefix: '2', hasSpanish: true },
}

const TEAM_TABS = [
  { id: 'all', label: 'All Teams', emoji: null, live: true },
  { id: 'asia', label: 'Asia', emoji: '🇨🇳', live: true },
  { id: 'philippines', label: 'Philippines', emoji: '🇵🇭', live: false },
  { id: 'colombia', label: 'Colombia', emoji: '🇨🇴', live: true },
  { id: 'central', label: 'Central', emoji: '🌎', live: false },
  { id: 'mexico', label: 'Mexico', emoji: '🇲🇽', live: false },
  { id: 'venezuela', label: 'Venezuela', emoji: '🇻🇪', live: false },
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
    'MANAGEMENT', 'USER', 'SUPERVISOR', 'EXTENSION', 'OPENERS', 'TRANSFERS', 'SPANISH', 'ENGLISH', 'TOTAL',
    'LEXNER', 'GENERAL MANAGER', 'PACIFIC STANDARD TIME', 'BREAK', 'LUNCH', 'DAILY TARGET', 'XFER PER HOUR',
    'THIS HOUR GOAL', 'GOAL+', 'AGENT LOGGED IN', 'AGENTS LOGGED IN', 'COLOMBIA OT', 'JUAN GARCIA', 'ASIA', 'OT TAKERS'
  ]
  return !banned.some(word => name.includes(word))
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

  const agents = [...merged.values()].sort((a, b) => b.total - a.total || b.english - a.english || a.name.localeCompare(b.name))
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
      // if footer row is broken, ignore it and use sums below
      if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) mainFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '2')) continue

    // Main Colombia block uses D/E = English/Spanish. OT block also uses D/E but footer is broken.
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

  const agents = [...merged.values()].sort((a, b) => b.total - a.total || b.english - a.english || a.name.localeCompare(b.name))
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

function parseLiveSheet(teamId, rows) {
  if (teamId === 'asia') return parseAsiaRows(rows, includeOT())
  if (teamId === 'colombia') return parseColombiaRows(rows, includeOT())
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
  try {
    const url = `${SCRIPT_URL}?${new URLSearchParams(params)}&t=${Date.now()}`
    const res = await fetch(url)
    return await res.json()
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

async function scriptPost(params) {
  try {
    const body = new URLSearchParams(params)
    await fetch(SCRIPT_URL, { method: 'POST', body, mode: 'no-cors' })
  } catch (error) {}
}

async function persistTeamSnapshot(date, teamId, parsed) {
  const totalsPayload = JSON.stringify([
    {
      id: teamId,
      name: SHEETS[teamId].label,
      english: parsed.totals.english,
      spanish: parsed.totals.spanish,
      total: parsed.totals.total,
      agents: parsed.totals.activeAgents,
      noSpanish: false,
    }
  ])

  const agentsPayload = JSON.stringify(
    parsed.agents.map(agent => ({
      ext: agent.ext,
      name: agent.name,
      english: agent.english,
      spanish: agent.spanish,
      total: agent.total,
      team: teamId,
    }))
  )

  const saveKey = `pulse_${teamId}_saved_${date}_${parsed.totals.total}_${parsed.totals.activeAgents}_${parsed.includesOT ? 'ot' : 'main'}`
  if (sessionStorage.getItem(saveKey)) return
  sessionStorage.setItem(saveKey, '1')

  await scriptPost({ action: 'saveDailyTotals', date, teams: totalsPayload })
  await scriptPost({ action: 'saveTeamSnapshot', date, teamId, agents: agentsPayload })
  await scriptPost({ action: 'saveAgentSnapshots', date, snapshots: agentsPayload })
  await scriptPost({ action: 'saveToWeeklySheet', date, team: teamId, agents: agentsPayload })
}

function formatDateLabel(date) {
  const today = todayKey()
  if (date === today) return 'Today — LIVE'
  const d = new Date(`${date}T12:00:00`)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${day} ${dd}/${mm}`
}

function TeamTabs({ selectedTeam, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      padding: 8,
      borderRadius: 999,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 22
    }}>
      {TEAM_TABS.map(tab => {
        const active = selectedTeam === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              border: active ? '1px solid rgba(249,115,22,0.9)' : '1px solid transparent',
              background: active ? 'rgba(249,115,22,0.18)' : 'transparent',
              color: active ? '#fff' : '#cbd5e1',
              borderRadius: 999,
              padding: '11px 16px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {tab.emoji ? <span>{tab.emoji}</span> : null}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function DatesPanel({ dateTabs, selectedDate, onSelect }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
      position: 'sticky',
      top: 86
    }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, fontWeight: 800, letterSpacing: '0.08em' }}>DATES</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {dateTabs.map(date => {
          const active = date === selectedDate
          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              style={{
                border: active ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.02)',
                color: active ? '#fff' : '#cbd5e1',
                borderRadius: 14,
                padding: '12px 10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {formatDateLabel(date)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TeamCard({ team, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(59,130,246,0.06))' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: 24,
        textAlign: 'left',
        cursor: 'pointer',
        color: '#fff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <img src={team.flag} alt={team.label} width="32" height="22" style={{ borderRadius: 4 }} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{team.label}</div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>{team.data.totals.activeAgents} active agents</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        <StatMini label="English" value={team.data.totals.english} color="#60a5fa" />
        <StatMini label="Spanish" value={team.data.totals.spanish} color="#34d399" />
        <StatMini label="Total" value={team.data.totals.total} color="#f59e0b" />
        <StatMini label="OT total" value={team.data.otTotals?.total || 0} color="#c084fc" />
      </div>
    </button>
  )
}

function StatMini({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{Number(value || 0).toLocaleString()}</div>
    </div>
  )
}

function SummaryCard({ title, value, color, subtitle }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: '18px 20px'
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color }}>{Number(value || 0).toLocaleString()}</div>
      {subtitle ? <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>{subtitle}</div> : null}
    </div>
  )
}

function AgentTable({ agents, navigate }) {
  return (
    <div style={{
      marginTop: 18,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 24, fontWeight: 900 }}>
        Agents
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Agent</th>
              <th style={thStyle}>Ext</th>
              <th style={thStyle}>Spanish</th>
              <th style={thStyle}>English</th>
              <th style={thStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <tr key={agent.ext} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#f8fafc', cursor: 'pointer' }} onClick={() => navigate(`/profile/${agent.ext}`)}>
                  {agent.name}
                </td>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>#{agent.ext}</td>
                <td style={{ ...tdStyle, color: '#34d399', fontWeight: 700 }}>{agent.spanish}</td>
                <td style={{ ...tdStyle, color: '#60a5fa', fontWeight: 700 }}>{agent.english}</td>
                <td style={{ ...tdStyle, color: '#f59e0b', fontWeight: 800 }}>{agent.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComingSoonCard({ label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: '36px 24px',
      textAlign: 'center',
      color: '#94a3b8'
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🚧</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 14 }}>This team tab is visible already, but live reading is not enabled yet.</div>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  fontSize: 12,
  color: '#94a3b8',
  padding: '12px 16px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase'
}

const tdStyle = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#e5e7eb'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liveData, setLiveData] = useState({ asia: null, colombia: null })
  const [historicalData, setHistoricalData] = useState({ asia: null, colombia: null })
  const [remoteDates, setRemoteDates] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)

  const isToday = selectedDate === todayKey()

  const loadRemoteDates = useCallback(async () => {
    const data = await scriptCall({ action: 'getDailyTotals' })
    if (!Array.isArray(data)) return
    const dates = data
      .map(entry => normalizeDate(entry.date))
      .filter(date => date && date >= CLEAN_START_DATE)
    setRemoteDates([...new Set(dates)].sort((a, b) => b.localeCompare(a)))
  }, [])

  const loadLive = useCallback(async () => {
    setError('')
    const [asiaRows, colombiaRows] = await Promise.all([
      fetchSheetViaScript(SHEETS.asia.sheetName),
      fetchSheetViaScript(SHEETS.colombia.sheetName),
    ])

    const parsedAsia = parseLiveSheet('asia', asiaRows)
    const parsedColombia = parseLiveSheet('colombia', colombiaRows)
    const date = todayKey()

    setLiveData({ asia: parsedAsia, colombia: parsedColombia })
    setLastUpdate(new Date())

    await Promise.all([
      persistTeamSnapshot(date, 'asia', parsedAsia),
      persistTeamSnapshot(date, 'colombia', parsedColombia),
    ])
    await loadRemoteDates()
  }, [loadRemoteDates])

  const loadHistorical = useCallback(async (date) => {
    setError('')
    const [asiaSnap, colombiaSnap, totals] = await Promise.all([
      scriptCall({ action: 'getTeamSnapshot', date, teamId: 'asia' }),
      scriptCall({ action: 'getTeamSnapshot', date, teamId: 'colombia' }),
      scriptCall({ action: 'getDailyTotals' }),
    ])

    const dailyEntry = Array.isArray(totals) ? totals.find(entry => normalizeDate(entry.date) === date) : null
    const getTotalsFor = (teamId) => {
      const t = Array.isArray(dailyEntry?.teams) ? dailyEntry.teams.find(team => String(team.id) === teamId) : null
      return {
        english: Number(t?.english) || 0,
        spanish: Number(t?.spanish) || 0,
        total: Number(t?.total) || ((Number(t?.english) || 0) + (Number(t?.spanish) || 0)),
        activeAgents: Number(t?.agents) || 0,
      }
    }

    setHistoricalData({
      asia: {
        agents: [...(asiaSnap?.ok && Array.isArray(asiaSnap.agents) ? asiaSnap.agents : [])].sort((a, b) => b.total - a.total || b.english - a.english),
        totals: getTotalsFor('asia'),
        mainTotals: null,
        otTotals: null,
        includesOT: false,
      },
      colombia: {
        agents: [...(colombiaSnap?.ok && Array.isArray(colombiaSnap.agents) ? colombiaSnap.agents : [])].sort((a, b) => b.total - a.total || b.english - a.english),
        totals: getTotalsFor('colombia'),
        mainTotals: null,
        otTotals: null,
        includesOT: false,
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        if (isToday) await loadLive()
        else await loadHistorical(selectedDate)
      } catch (err) {
        if (!cancelled) setError(String(err?.message || err || 'Failed to load dashboard data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedDate, isToday, loadLive, loadHistorical])

  useEffect(() => {
    loadRemoteDates()
  }, [loadRemoteDates])

  useEffect(() => {
    if (!isToday) return
    const timer = setInterval(() => {
      loadLive().catch(() => {})
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [isToday, loadLive])

  const dateTabs = useMemo(() => {
    const set = new Set([todayKey(), ...remoteDates])
    return [...set].filter(date => date >= CLEAN_START_DATE).sort((a, b) => b.localeCompare(a))
  }, [remoteDates])

  const currentData = isToday ? liveData : historicalData
  const visibleTeams = useMemo(() => {
    const list = [
      { ...SHEETS.asia, data: currentData.asia },
      { ...SHEETS.colombia, data: currentData.colombia },
    ].filter(team => team.data)

    if (selectedTeam === 'all') return list
    return list.filter(team => team.id === selectedTeam)
  }, [currentData, selectedTeam])

  const selectedTeamData = useMemo(() => {
    if (selectedTeam === 'all') return null
    return currentData[selectedTeam] || null
  }, [currentData, selectedTeam])

  return (
    <div style={{ minHeight: '100vh', background: '#040812', color: '#fff' }}>
      <Navbar />

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '26px 20px 60px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>Pulse</h1>
            </div>
            <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 14 }}>
              Clean start from {CLEAN_START_DATE}. For now, only Asia and Colombia are reading live. Other teams stay visible while we add them safely.
            </div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for first load...'}
          </div>
        </div>

        <TeamTabs selectedTeam={selectedTeam} onChange={setSelectedTeam} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 18,
          alignItems: 'start'
        }}>
          <div>
            {loading ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: '48px 24px',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                Loading dashboard data...
              </div>
            ) : error ? (
              <div style={{
                background: 'rgba(127,29,29,0.18)',
                border: '1px solid rgba(248,113,113,0.35)',
                borderRadius: 20,
                padding: '20px 22px',
                color: '#fecaca'
              }}>
                {error}
              </div>
            ) : (
              <>
                {selectedTeam === 'all' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
                    {visibleTeams.map(team => (
                      <TeamCard key={team.id} team={team} active={false} onClick={() => setSelectedTeam(team.id)} />
                    ))}
                    {TEAM_TABS.filter(t => !['all', 'asia', 'colombia'].includes(t.id)).map(tab => (
                      <ComingSoonCard key={tab.id} label={tab.label} />
                    ))}
                  </div>
                ) : selectedTeamData ? (
                  <>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(59,130,246,0.06))',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 24,
                      padding: 24,
                      marginBottom: 18
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{formatDateLabel(selectedDate)}</div>
                          <div style={{ fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={SHEETS[selectedTeam].flag} alt={SHEETS[selectedTeam].label} width="32" height="22" style={{ borderRadius: 4 }} />
                            {SHEETS[selectedTeam].label}
                          </div>
                          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 14 }}>
                            {selectedTeamData.totals.activeAgents} active agents
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
                      <SummaryCard title="English" value={selectedTeamData.totals.english} color="#60a5fa" subtitle={selectedTeamData.mainTotals ? `Main: ${selectedTeamData.mainTotals.english}` : ''} />
                      <SummaryCard title="Spanish" value={selectedTeamData.totals.spanish} color="#34d399" subtitle={selectedTeamData.mainTotals ? `Main: ${selectedTeamData.mainTotals.spanish}` : ''} />
                      <SummaryCard title="Total" value={selectedTeamData.totals.total} color="#f59e0b" subtitle={selectedTeamData.otTotals && selectedTeamData.includesOT ? `OT: ${selectedTeamData.otTotals.total}` : ''} />
                      <SummaryCard title="Active agents" value={selectedTeamData.totals.activeAgents} color="#c084fc" subtitle={selectedDate === todayKey() ? 'Live snapshot' : 'Saved snapshot'} />
                    </div>

                    <AgentTable agents={selectedTeamData.agents} navigate={navigate} />
                  </>
                ) : (
                  <ComingSoonCard label={TEAM_TABS.find(t => t.id === selectedTeam)?.label || 'Team'} />
                )}
              </>
            )}
          </div>

          <DatesPanel dateTabs={dateTabs} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>
      </div>
    </div>
  )
}
