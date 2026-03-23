import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './dashboard.css'

const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'

const csvUrl = (sheet) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') { inQuotes = !inQuotes; continue }
      if (row[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
      current += row[i]
    }
    result.push(current.trim())
    return result
  })
}

async function fetchSheet(name) {
  const res = await fetch(csvUrl(name))
  const text = await res.text()
  return parseCSV(text)
}

const TEAMS_ORDER = ['PHILIPPINES','VENEZUELA','COLOMBIA','MEXICO BAJA','CENTRAL AMERICA','ASIA']

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')
  const team = APP_CONFIG.teams.find(t => t.id === user?.team)

  const [generalData, setGeneralData] = useState([])
  const [asiaData, setAsiaData]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [lastUpdate, setLastUpdate]   = useState(null)
  const [activeTab, setActiveTab]     = useState('general')

  const loadData = async () => {
    try {
      const [general, asia] = await Promise.all([
        fetchSheet("WELL'S REPORT"),
        fetchSheet('AW GARRET ASIA LEXNER'),
      ])
      setGeneralData(general)
      setAsiaData(asia)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    localStorage.removeItem('pulse_user')
    navigate('/')
  }

  // Parse WELL'S REPORT — only first 6 unique team rows (Garrett section)
  const teamRows = (() => {
    const found = []
    for (const row of generalData) {
      const name = row[0]?.toUpperCase().trim()
      if (TEAMS_ORDER.some(t => name === t)) {
        if (!found.find(f => f.name.toUpperCase() === name)) {
          found.push({
            name:    row[0]?.trim() || '',
            agents:  parseInt(row[2]) || 0,
            english: parseInt(row[3]) || 0,
            spanish: row[4] === '-' ? 0 : parseInt(row[4]) || 0,
            total:   parseInt(row[5]) || 0,
          })
        }
      }
      if (found.length === 6) break
    }
    return found
  })()

  const teamsSorted = [...teamRows].sort((a, b) => b.english - a.english)

  // Parse Asia agents
  // Col A=name, B=ext, C=spanish, D=english, E=total
  // Stop at "AGENT LOGGED IN" row
  const asiaAgents = (() => {
    const agents = []
    for (const row of asiaData) {
      const name = row[0]?.toUpperCase().trim()
      if (name?.includes('AGENT LOGGED') || name?.includes('LOGGED IN')) break
      const ext = parseInt(row[1])
      if (!isNaN(ext) && ext > 1000 && ext < 9999 && row[0]?.length > 1) {
        agents.push({
          name:    row[0]?.trim() || '',
          ext:     row[1]?.trim() || '',
          spanish: parseInt(row[2]) || 0,  // C = Spanish
          english: parseInt(row[3]) || 0,  // D = English
          total:   parseInt(row[4]) || 0,  // E = Total
        })
      }
    }
    return agents
  })()

  const goal        = APP_CONFIG.dailyGoal
  const hitGoal     = asiaAgents.filter(a => a.english >= goal)
  const atZero      = asiaAgents.filter(a => a.total === 0)
  const top3English = [...asiaAgents].sort((a,b) => b.english - a.english).slice(0,3)
  const top3Total   = [...asiaAgents].sort((a,b) => b.total   - a.total  ).slice(0,3)

  const totalEnglish = asiaAgents.reduce((s,a) => s + a.english, 0)
  const totalSpanish = asiaAgents.reduce((s,a) => s + a.spanish, 0)
  const totalXfers   = asiaAgents.reduce((s,a) => s + a.total, 0)

  const getFlag = (name) => {
    const n = name.toUpperCase()
    if (n.includes('PHIL'))    return 'ph'
    if (n.includes('VENE'))    return 've'
    if (n.includes('COLOM'))   return 'co'
    if (n.includes('MEXICO'))  return 'mx'
    if (n.includes('CENTRAL')) return 'hn'
    if (n.includes('ASIA'))    return 'cn'
    return 'un'
  }

  const isMyTeam = (name) => {
    const n = name.toUpperCase()
    return (team?.id === 'asia'        && n.includes('ASIA'))    ||
           (team?.id === 'philippines' && n.includes('PHIL'))    ||
           (team?.id === 'venezuela'   && n.includes('VENE'))    ||
           (team?.id === 'colombia'    && n.includes('COLOM'))   ||
           (team?.id === 'mexico'      && n.includes('MEXICO'))  ||
           (team?.id === 'central'     && n.includes('CENTRAL'))
  }

  const getRankStyle = (rank) => {
    if (rank === 0) return { color: '#FFD700', fontWeight: 700 }
    if (rank === 1) return { color: '#C0C0C0', fontWeight: 700 }
    if (rank === 2) return { color: '#CD7F32', fontWeight: 700 }
    return { color: '#6b7280' }
  }

  const getRankLabel = (rank) => {
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
    return `#${rank + 1}`
  }

  return (
    <div className="dash-root">

      <nav className="dash-nav">
        <div className="dash-nav-left">
          <div className="nav-pulse-badge">P</div>
          <span className="nav-appname">Pulse</span>
        </div>
        <div className="dash-nav-right">
          <div className="nav-user">
            <div className="nav-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="nav-info">
              <span className="nav-name">{user?.name}</span>
              <span className="nav-role">{team?.name} · {user?.role}</span>
            </div>
          </div>
          {lastUpdate && (
            <span className="nav-update">
              Updated {lastUpdate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </span>
          )}
          <button className="nav-logout" onClick={logout}>Log out</button>
        </div>
      </nav>

      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab==='general'?'active':''}`} onClick={()=>setActiveTab('general')}>
          All Teams
        </button>
        <button className={`dash-tab ${activeTab==='asia'?'active':''}`} onClick={()=>setActiveTab('asia')}>
          🌏 Asia Detail
        </button>
      </div>

      <div className="dash-content">
        {loading ? (
          <div className="dash-loading">
            <div className="dash-spinner" />
            <p>Loading live data...</p>
          </div>
        ) : activeTab === 'general' ? (

          <div className="fade-in">
            <h2 className="section-title">
              Auto Warranty Garrett — Teams Overview
              <span className="live-badge">LIVE</span>
            </h2>
            {teamRows.length === 0 ? (
              <p style={{color:'#6b7280'}}>No data found.</p>
            ) : (
              <div className="teams-grid">
                {teamRows.map((row, i) => {
                  const rank = teamsSorted.findIndex(t => t.name === row.name)
                  const noSpanish = row.spanish === 0
                  return (
                    <div key={i} className={`team-card-dash ${isMyTeam(row.name) ? 'highlight' : ''}`}>
                      <div className="tc-header">
                        <div className="tc-rank-badge" style={getRankStyle(rank)}>
                          {getRankLabel(rank)}
                        </div>
                        <img src={`https://flagcdn.com/w40/${getFlag(row.name)}.png`} alt="" className="tc-flag" />
                        <div>
                          <div className="tc-name">{row.name}</div>
                          <div className="tc-agents">{row.agents} agents active</div>
                        </div>
                      </div>
                      <div className="tc-stats">
                        <div className="tc-stat">
                          <span className="tc-val english">{row.english.toLocaleString()}</span>
                          <span className="tc-label">English</span>
                        </div>
                        {!noSpanish && (
                          <div className="tc-stat">
                            <span className="tc-val spanish">{row.spanish.toLocaleString()}</span>
                            <span className="tc-label">Spanish</span>
                          </div>
                        )}
                        <div className="tc-stat">
                          <span className="tc-val total">{row.total.toLocaleString()}</span>
                          <span className="tc-label">Total</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        ) : (

          <div className="fade-in">
            <h2 className="section-title">
              Asia — Agent Detail <span className="live-badge">LIVE</span>
            </h2>

            <div className="summary-grid">
              <div className="sum-card green">
                <div className="sum-val">{hitGoal.length}</div>
                <div className="sum-label">Hit Goal (≥{goal} EN)</div>
              </div>
              <div className="sum-card orange">
                <div className="sum-val">{asiaAgents.length - hitGoal.length - atZero.length}</div>
                <div className="sum-label">In Progress</div>
              </div>
              <div className="sum-card red">
                <div className="sum-val">{atZero.length}</div>
                <div className="sum-label">At Zero</div>
              </div>
              <div className="sum-card blue">
                <div className="sum-val">{totalEnglish.toLocaleString()}</div>
                <div className="sum-label">EN: {totalEnglish} · SP: {totalSpanish} · Total: {totalXfers}</div>
              </div>
            </div>

            <div className="tops-row">
              <div className="top-block">
                <h3 className="top-title">🏆 Top English</h3>
                {top3English.map((a,i) => (
                  <div key={i} className="top-item">
                    <span className="top-medal">{['🥇','🥈','🥉'][i]}</span>
                    <span className="top-name">{a.name}</span>
                    <span className="top-ext">#{a.ext}</span>
                    <span className="top-score english">{a.english}</span>
                  </div>
                ))}
              </div>
              <div className="top-block">
                <h3 className="top-title">🏆 Top Total (EN+SP)</h3>
                {top3Total.map((a,i) => (
                  <div key={i} className="top-item">
                    <span className="top-medal">{['🥇','🥈','🥉'][i]}</span>
                    <span className="top-name">{a.name}</span>
                    <span className="top-ext">#{a.ext}</span>
                    <span className="top-score total">{a.total}</span>
                  </div>
                ))}
              </div>
              <div className="top-block red-block">
                <h3 className="top-title">⚠ At Zero</h3>
                {atZero.length === 0
                  ? <p className="top-empty">Everyone has transfers! 🎉</p>
                  : atZero.slice(0,3).map((a,i) => (
                    <div key={i} className="top-item">
                      <span className="top-name">{a.name}</span>
                      <span className="top-ext">#{a.ext}</span>
                      <span className="top-score red">0</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="agent-table-wrap">
              <table className="agent-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Agent</th>
                    <th>Ext</th>
                    <th>English</th>
                    <th>Spanish</th>
                    <th>Total</th>
                    <th>Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {[...asiaAgents]
                    .sort((a,b) => b.english - a.english)
                    .map((a,i) => (
                    <tr key={i} className={a.total===0 ? 'row-zero' : a.english>=goal ? 'row-goal' : ''}>
                      <td style={getRankStyle(i)}>{getRankLabel(i)}</td>
                      <td className="agent-name">{a.name}</td>
                      <td className="agent-ext">{a.ext}</td>
                      <td className="val-english">{a.english}</td>
                      <td className="val-spanish">{a.spanish}</td>
                      <td className="val-total">{a.total}</td>
                      <td>
                        {a.english >= goal
                          ? <span className="badge-goal">✓ Goal</span>
                          : <span className="badge-pending">{goal - a.english} left</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}