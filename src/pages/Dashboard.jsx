import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './dashboard.css'

const SHEET_ID = '1QnqtYTYSsHDCDma14kWu38AkUa23TTKNlQzOPUJrrHI'
const csvUrl = (sheet) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

function parseCSV(text) {
  return text.trim().split('\n').map(row =>
    row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) ?? []
  )
}

async function fetchSheet(name) {
  const res = await fetch(csvUrl(name))
  const text = await res.text()
  return parseCSV(text)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')
  const team = APP_CONFIG.teams.find(t => t.id === user?.team)

  const [generalData, setGeneralData]   = useState([])
  const [asiaData, setAsiaData]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [lastUpdate, setLastUpdate]     = useState(null)
  const [activeTab, setActiveTab]       = useState('general')

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
      console.error('Error loading sheets:', e)
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

  // Parse WELL'S REPORT — find rows with team names
  const teamRows = generalData.filter(row =>
    ['PHILIPPINES','VENEZUELA','COLOMBIA','MEXICO','CENTRAL AMERICA','ASIA'].some(t =>
      row[0]?.toUpperCase().includes(t)
    )
  )

  // Parse Asia agents — skip header rows, get agents with extension numbers
  const asiaAgents = asiaData.filter(row => {
    const ext = parseInt(row[1])
    return !isNaN(ext) && ext > 1000 && row[0]?.length > 1
  }).map(row => ({
    name:    row[0] || '',
    ext:     row[1] || '',
    english: parseInt(row[3]) || 0,
    spanish: parseInt(row[4]) || 0,
    total:   parseInt(row[5]) || 0,
  }))

  const goal = APP_CONFIG.dailyGoal
  const hitGoal    = asiaAgents.filter(a => a.english >= goal)
  const atZero     = asiaAgents.filter(a => a.total === 0)
  const top3English = [...asiaAgents].sort((a,b) => b.english - a.english).slice(0,3)
  const top3Total   = [...asiaAgents].sort((a,b) => b.total - a.total).slice(0,3)

  const medals = ['🥇','🥈','🥉']

  return (
    <div className="dash-root">

      {/* TOP NAV */}
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <img src="/kk-logo.png" alt="KK" className="nav-logo" />
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
              Updated {lastUpdate.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
            </span>
          )}
          <button className="nav-logout" onClick={logout}>Log out</button>
        </div>
      </nav>

      {/* TABS */}
      <div className="dash-tabs">
        <button
          className={`dash-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          All Teams
        </button>
        <button
          className={`dash-tab ${activeTab === 'asia' ? 'active' : ''}`}
          onClick={() => setActiveTab('asia')}
        >
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

          /* ── GENERAL VIEW ── */
          <div className="fade-in">
            <h2 className="section-title">Teams Overview <span className="live-badge">LIVE</span></h2>
            <div className="teams-grid">
              {teamRows.map((row, i) => {
                const english = parseInt(row[2]) || 0
                const spanish = parseInt(row[3]) || 0
                const total   = parseInt(row[4]) || 0
                const agents  = parseInt(row[1]) || 0
                const teamCfg = APP_CONFIG.teams.find(t =>
                  row[0]?.toUpperCase().includes(t.name.toUpperCase().split(' ')[0])
                )
                return (
                  <div key={i} className={`team-card-dash ${teamCfg?.id === 'asia' ? 'highlight' : ''}`}>
                    <div className="tc-header">
                      <img src={`https://flagcdn.com/w40/${teamCfg?.code || 'un'}.png`} alt="" className="tc-flag" />
                      <div>
                        <div className="tc-name">{row[0]}</div>
                        <div className="tc-agents">{agents} agents active</div>
                      </div>
                    </div>
                    <div className="tc-stats">
                      <div className="tc-stat">
                        <span className="tc-val english">{english.toLocaleString()}</span>
                        <span className="tc-label">English</span>
                      </div>
                      <div className="tc-stat">
                        <span className="tc-val spanish">{spanish.toLocaleString()}</span>
                        <span className="tc-label">Spanish</span>
                      </div>
                      <div className="tc-stat">
                        <span className="tc-val total">{total.toLocaleString()}</span>
                        <span className="tc-label">Total</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        ) : (

          /* ── ASIA DETAIL VIEW ── */
          <div className="fade-in">
            <h2 className="section-title">Asia — Agent Detail <span className="live-badge">LIVE</span></h2>

            {/* SUMMARY CARDS */}
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
                <div className="sum-val">{asiaAgents.reduce((s,a) => s + a.english, 0).toLocaleString()}</div>
                <div className="sum-label">Total English</div>
              </div>
            </div>

            {/* TOP 3 */}
            <div className="tops-row">
              <div className="top-block">
                <h3 className="top-title">🏆 Top English</h3>
                {top3English.map((a, i) => (
                  <div key={i} className="top-item">
                    <span className="top-medal">{medals[i]}</span>
                    <span className="top-name">{a.name}</span>
                    <span className="top-score english">{a.english}</span>
                  </div>
                ))}
              </div>
              <div className="top-block">
                <h3 className="top-title">🏆 Top Total</h3>
                {top3Total.map((a, i) => (
                  <div key={i} className="top-item">
                    <span className="top-medal">{medals[i]}</span>
                    <span className="top-name">{a.name}</span>
                    <span className="top-score total">{a.total}</span>
                  </div>
                ))}
              </div>
              <div className="top-block red-block">
                <h3 className="top-title">⚠ At Zero</h3>
                {atZero.length === 0
                  ? <p className="top-empty">Everyone has transfers! 🎉</p>
                  : atZero.slice(0,5).map((a, i) => (
                    <div key={i} className="top-item">
                      <span className="top-name">{a.name}</span>
                      <span className="top-score red">0</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* AGENT TABLE */}
            <div className="agent-table-wrap">
              <table className="agent-table">
                <thead>
                  <tr>
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
                    .map((a, i) => (
                    <tr key={i} className={a.total === 0 ? 'row-zero' : a.english >= goal ? 'row-goal' : ''}>
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