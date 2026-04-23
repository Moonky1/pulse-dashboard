import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './dashboard.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const ASIA_SHEET_NAME = 'AW GARRET ASIA LEXNER'
const CLEAN_START_DATE = '2026-04-23'
const POLL_MS = 30000

const FLAG_ASIA = '/flags/asia.png'

const safeInt = (val) => parseInt(String(val ?? '').replace(/,/g, '').trim(), 10) || 0
const cellUpper = (val) => String(val || '').trim().toUpperCase()
const normalizeDate = (raw) => {
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
const todayKey = () => new Date().toISOString().slice(0, 10)
const colombiaHour = () => (new Date().getUTCHours() - 5 + 24) % 24
const includeOT = () => colombiaHour() >= 18 || colombiaHour() < 6

const rowText = (row, limit = 8) => (row || []).slice(0, limit).map(cellUpper).join(' | ')

function isAsiaAgentRow(nameCell, extCell) {
  const name = cellUpper(nameCell)
  const ext = String(extCell || '').replace(/,/g, '').trim()
  if (!/^3\d{3}$/.test(ext)) return false
  if (!name) return false
  const banned = [
    'ASIA', 'OT TAKERS', 'MANAGEMENT', 'USER', 'TRANSFERS', 'SPANISH', 'ENGLISH', 'TOTAL',
    'LEXNER', 'GENERAL MANAGER', 'PACIFIC STANDARD TIME', 'BREAK', 'LUNCH', 'DAILY TARGET',
    'XFER PER HOUR', 'THIS HOUR GOAL', 'GOAL+', 'AGENT LOGGED IN', 'AGENTS LOGGED IN'
  ]
  return !banned.some(word => name.includes(word))
}

function parseAsiaSheetRows(rows, withOT) {
  const mainAgents = new Map()
  const otAgents = new Map()
  let mainFooter = null
  let otFooter = null
  let inOT = false

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row, 8)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('OT TAKERS')) {
      inOT = true
      continue
    }

    const looksLikeFooter = txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS')
    if (looksLikeFooter) {
      const footer = {
        spanish: safeInt(row[2]),
        english: safeInt(row[3]),
        total: safeInt(row[4]) || (safeInt(row[2]) + safeInt(row[3]))
      }
      if (!inOT) mainFooter = footer
      else otFooter = footer
      continue
    }

    if (!isAsiaAgentRow(name, ext)) continue

    const agent = {
      name,
      ext,
      spanish: safeInt(row[2]),
      english: safeInt(row[3]),
      total: safeInt(row[4]) || (safeInt(row[2]) + safeInt(row[3]))
    }

    if (!inOT) {
      mainAgents.set(agent.ext, agent)
    } else {
      const prev = otAgents.get(agent.ext)
      if (!prev) otAgents.set(agent.ext, agent)
      else {
        otAgents.set(agent.ext, {
          ...prev,
          english: prev.english + agent.english,
          spanish: prev.spanish + agent.spanish,
          total: prev.total + agent.total
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
        total: prev.total + agent.total
      })
    }
  })

  const agents = [...merged.values()].sort((a, b) => {
    if (b.english !== a.english) return b.english - a.english
    if (b.total !== a.total) return b.total - a.total
    return a.name.localeCompare(b.name)
  })

  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((sum, a) => sum + a.spanish, 0)
  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((sum, a) => sum + a.english, 0)
  const mainTotal = mainFooter ? mainFooter.total : mainSpanish + mainEnglish

  const otSpanish = withOT ? (otFooter ? otFooter.spanish : otList.reduce((sum, a) => sum + a.spanish, 0)) : 0
  const otEnglish = withOT ? (otFooter ? otFooter.english : otList.reduce((sum, a) => sum + a.english, 0)) : 0
  const otTotal = withOT ? (otFooter ? otFooter.total : otSpanish + otEnglish) : 0

  return {
    agents,
    totals: {
      spanish: mainSpanish + otSpanish,
      english: mainEnglish + otEnglish,
      total: mainTotal + otTotal,
      activeAgents: agents.length
    },
    mainTotals: { spanish: mainSpanish, english: mainEnglish, total: mainTotal },
    otTotals: { spanish: otSpanish, english: otEnglish, total: otTotal },
    includesOT: withOT
  }
}

async function fetchSheetViaScript(sheetId, sheetName) {
  const url = `${SCRIPT_URL}?action=getSheet&sheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`
  const res = await fetch(url)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('getSheet failed')
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

async function persistAsiaSnapshot(date, parsed) {
  const totalsPayload = JSON.stringify([
    {
      id: 'asia',
      name: 'Asia',
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
      team: 'asia',
    }))
  )

  const saveKey = `pulse_asia_saved_${date}_${parsed.totals.total}_${parsed.totals.activeAgents}_${parsed.includesOT ? 'ot' : 'main'}`
  if (sessionStorage.getItem(saveKey)) return
  sessionStorage.setItem(saveKey, '1')

  await scriptPost({ action: 'saveDailyTotals', date, teams: totalsPayload })
  await scriptPost({ action: 'saveTeamSnapshot', date, teamId: 'asia', agents: agentsPayload })
  await scriptPost({ action: 'saveAgentSnapshots', date, snapshots: agentsPayload })
  await scriptPost({ action: 'saveToWeeklySheet', date, team: 'asia', agents: agentsPayload })
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

function AsiaSummaryCard({ title, value, color, subtitle }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: '18px 20px'
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color }}>{value.toLocaleString()}</div>
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
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 800, color: '#e5e7eb' }}>
        Asia agents
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [asiaRows, setAsiaRows] = useState([])
  const [asiaData, setAsiaData] = useState(null)
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

  const loadLiveAsia = useCallback(async () => {
    setError('')
    const rows = await fetchSheetViaScript(SHEET_ID, ASIA_SHEET_NAME)
    const parsed = parseAsiaSheetRows(rows, includeOT())
    const date = todayKey()

    setAsiaRows(rows)
    setAsiaData(parsed)
    setLastUpdate(new Date())

    await persistAsiaSnapshot(date, parsed)
    await loadRemoteDates()
  }, [loadRemoteDates])

  const loadHistoricalAsia = useCallback(async (date) => {
    setError('')
    const [teamSnap, totals] = await Promise.all([
      scriptCall({ action: 'getTeamSnapshot', date, teamId: 'asia' }),
      scriptCall({ action: 'getDailyTotals' })
    ])

    const agents = teamSnap?.ok && Array.isArray(teamSnap.agents) ? teamSnap.agents : []
    const dailyEntry = Array.isArray(totals)
      ? totals.find(entry => normalizeDate(entry.date) === date)
      : null
    const asiaTotals = Array.isArray(dailyEntry?.teams)
      ? dailyEntry.teams.find(team => String(team.id) === 'asia')
      : null

    setAsiaRows([])
    setAsiaData({
      agents: [...agents].sort((a, b) => b.english - a.english || b.total - a.total),
      totals: {
        english: Number(asiaTotals?.english) || 0,
        spanish: Number(asiaTotals?.spanish) || 0,
        total: Number(asiaTotals?.total) || ((Number(asiaTotals?.english) || 0) + (Number(asiaTotals?.spanish) || 0)),
        activeAgents: Number(asiaTotals?.agents) || agents.length,
      },
      mainTotals: null,
      otTotals: null,
      includesOT: false,
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        if (isToday) await loadLiveAsia()
        else await loadHistoricalAsia(selectedDate)
      } catch (err) {
        if (!cancelled) setError(String(err?.message || err || 'Failed to load Asia data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [selectedDate, isToday, loadLiveAsia, loadHistoricalAsia])

  useEffect(() => {
    loadRemoteDates()
  }, [loadRemoteDates])

  useEffect(() => {
    if (!isToday) return
    const timer = setInterval(() => {
      loadLiveAsia().catch(() => {})
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [isToday, loadLiveAsia])

  const dateTabs = useMemo(() => {
    const set = new Set([todayKey(), ...remoteDates])
    return [...set].filter(date => date >= CLEAN_START_DATE).sort((a, b) => b.localeCompare(a))
  }, [remoteDates])

  const topThree = useMemo(() => asiaData?.agents?.slice(0, 3) || [], [asiaData])

  return (
    <div style={{ minHeight: '100vh', background: '#040812', color: '#fff' }}>
      <Navbar />

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '26px 20px 60px' }}>
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
              <img src={FLAG_ASIA} alt="Asia" width="30" height="22" style={{ borderRadius: 4 }} />
              <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900 }}>Pulse — Asia only</h1>
              <span style={{ background: '#f97316', color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>RESET</span>
            </div>
            <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 14 }}>
              Clean start from {CLEAN_START_DATE}. Cross-device data comes from Apps Script snapshots.
            </div>
          </div>

          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for first load...'}
          </div>
        </div>

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
                Loading Asia data...
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
            ) : asiaData ? (
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
                      <div style={{ fontSize: 30, fontWeight: 900 }}>Asia</div>
                      <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 14 }}>
                        {asiaData.totals.activeAgents} active agents • OT {asiaData.includesOT ? 'included' : 'not included yet'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#f59e0b' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: asiaData.includesOT ? '#22c55e' : '#f59e0b', display: 'inline-block' }} />
                      {asiaData.includesOT ? 'After 6 pm Colombia — OT is counted' : 'Before 6 pm Colombia — main block only'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
                  <AsiaSummaryCard title="English" value={asiaData.totals.english} color="#60a5fa" subtitle={asiaData.mainTotals ? `Main: ${asiaData.mainTotals.english}` : ''} />
                  <AsiaSummaryCard title="Spanish" value={asiaData.totals.spanish} color="#34d399" subtitle={asiaData.mainTotals ? `Main: ${asiaData.mainTotals.spanish}` : ''} />
                  <AsiaSummaryCard title="Total" value={asiaData.totals.total} color="#f59e0b" subtitle={asiaData.otTotals && asiaData.includesOT ? `OT: ${asiaData.otTotals.total}` : ''} />
                  <AsiaSummaryCard title="Active agents" value={asiaData.totals.activeAgents} color="#c084fc" subtitle={selectedDate === todayKey() ? 'Live snapshot' : 'Saved snapshot'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14, marginTop: 18 }}>
                  {topThree.map((agent, index) => (
                    <div key={agent.ext} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      padding: '18px 20px'
                    }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Top #{index + 1}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc' }}>{agent.name}</div>
                      <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>#{agent.ext}</div>
                      <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
                        <span style={{ color: '#34d399', fontWeight: 800 }}>SP {agent.spanish}</span>
                        <span style={{ color: '#60a5fa', fontWeight: 800 }}>EN {agent.english}</span>
                        <span style={{ color: '#f59e0b', fontWeight: 900 }}>TOT {agent.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <AgentTable agents={asiaData.agents} navigate={navigate} />
              </>
            ) : null}
          </div>

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
                    onClick={() => setSelectedDate(date)}
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
        </div>
      </div>
    </div>
  )
}
