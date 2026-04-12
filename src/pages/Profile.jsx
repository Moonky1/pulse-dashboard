import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './profile.css'

const HISTORY_SHEET_ID = '1u_5CLPEonZGarvaXU3Uwwx-nczElf5td3iKLRfQOVYU'
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

const HISTORY_DATES = [
  { isoDate: '2026-03-14', tab: '14032026' },
  { isoDate: '2026-03-16', tab: '16032026' },
  { isoDate: '2026-03-17', tab: '17032026' },
  { isoDate: '2026-03-18', tab: '18032026' },
  { isoDate: '2026-03-19', tab: '19032026' },
  { isoDate: '2026-03-20', tab: '20032026' },
  { isoDate: '2026-03-21', tab: '21032026' },
  { isoDate: '2026-03-23', tab: '23032026' },
]

const csvUrl = (sheetId, sheet) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') {
        inQuotes = !inQuotes
        continue
      }
      if (row[i] === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
        continue
      }
      current += row[i]
    }
    result.push(current.trim())
    return result
  })
}

async function fetchSheet(sheetId, name) {
  const res = await fetch(csvUrl(sheetId, name))
  const text = await res.text()
  return parseCSV(text)
}

const safeInt = (val) => parseInt((val || '').toString().replace(/,/g, '')) || 0
const isValidIsoDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))

const normalizeDate = (raw) => {
  if (!raw) return null
  const s = String(raw).trim()

  if (isValidIsoDate(s)) return s
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10)

  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const isSundayIso = (isoDate) => {
  if (!isValidIsoDate(isoDate)) return false
  const day = new Date(`${isoDate}T12:00:00`).getDay()
  return day === 0
}

const forceSundayZero = (record) => {
  if (!isSundayIso(record?.date)) return record
  return {
    ...record,
    english: 0,
    spanish: 0,
    total: 0,
    rank: null,
  }
}

async function loadUserPhotoFromSheets(userName) {
  try {
    const url = `${SCRIPT_URL}?action=getUserPhoto&userName=${encodeURIComponent(userName)}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.photo && data.photo.length > 10) {
      localStorage.setItem('pulse_user_photo', data.photo)
      return data.photo
    }
  } catch (e) {
    // noop
  }
  return localStorage.getItem('pulse_user_photo') || null
}

async function loadDailyTotals() {
  const CACHE_KEY = 'pulse_daily_totals_cache'
  const CACHE_DURATION = 5 * 60 * 1000

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) return data
    }

    const url = `${SCRIPT_URL}?action=getDailyTotals`
    const res = await fetch(url)
    const apiData = await res.json()
    if (!Array.isArray(apiData)) return {}

    const map = {}
    apiData.forEach(entry => {
      const date = normalizeDate(entry.date)
      if (!date || !Array.isArray(entry.teams)) return
      map[date] = {}
      entry.teams.forEach(t => {
        if (t.id) map[date][t.id] = isSundayIso(date) ? 0 : (t.english || 0)
      })
    })

    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: map, timestamp: Date.now() }))
    return map
  } catch (e) {
    return {}
  }
}

const E = {
  medal1: '/emojis/medal1.webp', medal2: '/emojis/medal2.webp', medal3: '/emojis/web3.webp',
  goal: '/emojis/goal.webp', goal1: '/emojis/goal1.webp', zero: '/emojis/zero.webp', firework: '/emojis/firework.webp',
}

const Img = ({ src, size = 20 }) => (
  <img src={src} width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain' }} />
)

const MedalImg = ({ rank }) => {
  if (rank === 1) return <Img src={E.medal1} size={22} />
  if (rank === 2) return <Img src={E.medal2} size={22} />
  if (rank === 3) return <Img src={E.medal3} size={22} />
  return <span style={{ color: '#6b7280', fontSize: 12 }}>#{rank}</span>
}

const getTeamFromExt = (ext) => {
  const e = String(ext)
  if (e.startsWith('1')) return { id: 'philippines', name: 'Philippines', flag: 'ph', hasSp: false, goal: 10, colEn: 2, colSp: -1 }
  if (e.startsWith('2')) return { id: 'colombia', name: 'Colombia', flag: 'co', hasSp: true, goal: 10, colEn: 3, colSp: 4 }
  if (e.startsWith('3')) return { id: 'asia', name: 'Asia', flag: 'cn', hasSp: true, goal: 20, colEn: 3, colSp: 2 }
  if (e.startsWith('4')) return { id: 'central', name: 'Central America', flag: 'hn', hasSp: true, goal: 10, colEn: 3, colSp: 4 }
  if (e.startsWith('5')) return { id: 'mexico', name: 'Mexico Baja', flag: 'mx', hasSp: false, goal: 10, colEn: 3, colSp: -1 }
  if (e.startsWith('6')) return { id: 'venezuela', name: 'Venezuela', flag: 've', hasSp: true, goal: 10, colEn: 3, colSp: 4 }
  return { id: 'unknown', name: 'Unknown', flag: 'un', hasSp: false, goal: 10, colEn: 2, colSp: -1 }
}

function calcRankFromRows(rows, ext, teamInfo) {
  const agents = []
  const isAsia = teamInfo.id === 'asia'
  for (const row of rows) {
    const cell0 = (row[0] || '').toString().trim()
    const cell0U = cell0.toUpperCase()
    if (cell0U.includes('AGENT') && (cell0U.includes('LOGGED') || cell0U.includes('LOG IN'))) break
    if (cell0U.includes('OT ') || cell0U.endsWith(' OT')) break

    const rawExt = (row[1] || '').toString().replace(/,/g, '').trim()
    const extNum = parseInt(rawExt)
    if (Number.isNaN(extNum) || extNum < 1000 || extNum > 9999) continue
    if (cell0.length < 2) continue

    const en = isAsia ? safeInt(row[3]) : safeInt(row[teamInfo.colEn])
    agents.push({ ext: String(extNum), english: en })
  }

  agents.sort((a, b) => b.english - a.english)
  const idx = agents.findIndex(a => a.ext === String(ext))
  return idx >= 0 ? idx + 1 : null
}

function findAgentInHistoryRows(rows, ext) {
  const agents = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cell0 = (row[0] || '').trim()
    const cell0U = cell0.toUpperCase()
    if (cell0U.includes('AGENT') && cell0U.includes('LOGGED')) break
    if (cell0U.includes('MANAGEMENT') || cell0U.includes('LEXNER') || cell0U.includes('GENERAL') || cell0.length <= 1) continue
    const extNum = safeInt(row[1])
    if (extNum < 1000 || extNum > 9999) continue
    agents.push({ ext: String(extNum), english: safeInt(row[3]) })
  }

  agents.sort((a, b) => b.english - a.english)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cell0 = (row[0] || '').trim()
    const cell0U = cell0.toUpperCase()
    if (cell0U.includes('AGENT') && cell0U.includes('LOGGED')) break
    if (safeInt(row[1]) !== parseInt(ext)) continue
    if (cell0.length <= 1) continue

    const sp = safeInt(row[2])
    const en = safeInt(row[3])
    const rankIdx = agents.findIndex(a => a.ext === String(ext))
    return { name: cell0, ext: String(ext), english: en, spanish: sp, total: sp + en, rank: rankIdx >= 0 ? rankIdx + 1 : null }
  }

  return null
}

async function loadAgentData(ext) {
  const records = []
  const teamInfo = getTeamFromExt(ext)

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith('pulse_snap_')) continue

    try {
      const date = normalizeDate(k.replace('pulse_snap_', ''))
      if (!date) continue

      const data = JSON.parse(localStorage.getItem(k))
      let sourceRows = []
      if (teamInfo.id === 'asia') sourceRows = Array.isArray(data.asiaData) ? data.asiaData : []
      else sourceRows = Array.isArray(data.teams?.[teamInfo.id]) ? data.teams[teamInfo.id] : []
      if (sourceRows.length === 0) continue

      for (const row of sourceRows) {
        const rawExt = (row[1] || '').toString().replace(/,/g, '').trim()
        if (rawExt !== String(ext)) continue

        const cell0 = (row[0] || '').trim()
        if (cell0.length <= 1) continue
        const nameU = cell0.toUpperCase()
        if (nameU.includes('AGENT') && nameU.includes('LOGGED')) break

        let en
        let sp
        if (teamInfo.id === 'asia') { sp = safeInt(row[2]); en = safeInt(row[3]) }
        else if (teamInfo.colSp >= 0) { en = safeInt(row[teamInfo.colEn]); sp = safeInt(row[teamInfo.colSp]) }
        else { en = safeInt(row[teamInfo.colEn]); sp = 0 }

        const rank = calcRankFromRows(sourceRows, ext, teamInfo)
        records.push(forceSundayZero({ date, name: cell0, english: en, spanish: sp, total: en + sp, rank, source: 'local' }))
        break
      }
    } catch (e) {
      // noop
    }
  }

  try {
    const url = `${SCRIPT_URL}?action=getAgentSnapshots&ext=${encodeURIComponent(ext)}`
    const res = await fetch(url)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(d => {
        const date = normalizeDate(d.date)
        if (!date) return
        if (records.find(r => r.date === date)) return

        records.push(forceSundayZero({
          date,
          name: d.name || `Agent #${ext}`,
          english: d.english || 0,
          spanish: d.spanish || 0,
          total: d.total || 0,
          rank: null,
          source: 'sheets',
        }))
      })
    }
  } catch (e) {
    // noop
  }

  if (teamInfo.id === 'asia') {
    for (const hd of HISTORY_DATES) {
      if (records.find(r => r.date === hd.isoDate)) continue
      try {
        const rows = await fetchSheet(HISTORY_SHEET_ID, hd.tab)
        const agent = findAgentInHistoryRows(rows, ext)
        if (agent) records.push(forceSundayZero({ date: hd.isoDate, ...agent, source: 'history' }))
      } catch (e) {
        // noop
      }
    }
  }

  return records
    .map(r => forceSundayZero({ ...r, date: normalizeDate(r.date) }))
    .filter(r => r.date && isValidIsoDate(r.date))
    .filter((r, i, arr) => arr.findIndex(x => x.date === r.date) === i)
    .sort((a, b) => a.date.localeCompare(b.date))
}

const getShareColor = (pct) => {
  if (pct >= 20) return '#f87171'
  if (pct >= 12) return '#fb923c'
  if (pct >= 6) return '#a78bfa'
  return '#6b7280'
}

const getShareLabel = (pct) => {
  if (pct >= 20) return '🔥 Franchise'
  if (pct >= 12) return '⭐ Key Player'
  if (pct >= 6) return 'Contributor'
  return 'Support'
}

const formatDate = (d) => {
  const iso = normalizeDate(d)
  if (!iso || !isValidIsoDate(iso)) return '—'

  const parts = iso.split('-')
  if (parts.length !== 3) return '—'
  const [, m, dd] = parts

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dateObj = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(dateObj.getTime())) return '—'

  const dayName = days[dateObj.getDay()]
  return `${dayName} ${dd}/${m}`
}

export default function Profile() {
  const { ext } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')
  const isOwnProfile = String(user?.agentExt) === String(ext)
  const teamInfo = getTeamFromExt(ext)

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [agentName, setAgentName] = useState(`Agent #${ext}`)
  const [userPhoto, setUserPhoto] = useState(localStorage.getItem('pulse_user_photo') || '')
  const [teamTotals, setTeamTotals] = useState({})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const particles = []

    const onMove = (e) => {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: e.clientX + (Math.random() - .5) * 20,
          y: e.clientY + (Math.random() - .5) * 20,
          size: Math.random() * 3 + 1,
          life: 1,
          vx: (Math.random() - .5) * 1.5,
          vy: (Math.random() - .5) * 1.5 - .5,
        })
      }
    }

    window.addEventListener('mousemove', onMove)
    let raf

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= .03
        p.x += p.vx
        p.y += p.vy
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249,115,22,${p.life * .5})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    draw()
    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false
    loadUserPhotoFromSheets(user.name).then(p => { if (!cancelled && p) setUserPhoto(p) })
    setLoading(true)

    Promise.allSettled([
      loadAgentData(ext),
      loadDailyTotals(),
    ]).then(([recordsResult, totalsResult]) => {
      if (cancelled) return

      const recs = recordsResult.status === 'fulfilled' && Array.isArray(recordsResult.value)
        ? recordsResult.value
        : []

      const totalsMap = totalsResult.status === 'fulfilled' && totalsResult.value
        ? totalsResult.value
        : {}

      setRecords(recs)
      const named = recs.filter(r => r.name && r.name.length > 1)
      if (named.length > 0) setAgentName(named[named.length - 1].name)

      const teamMap = {}
      Object.entries(totalsMap).forEach(([date, teams]) => {
        const normalized = normalizeDate(date)
        if (!normalized) return
        teamMap[normalized] = isSundayIso(normalized) ? 0 : (teams?.[teamInfo.id] ?? 0)
      })

      setTeamTotals(teamMap)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [ext, user, teamInfo.id])

  const cleanRecords = records.filter(r => r.date && isValidIsoDate(r.date))
  const maxEnglish = Math.max(...cleanRecords.map(r => r.english), 1)
  const timelineMinWidth = Math.max(cleanRecords.length * 84, 920)

  if (!user) return <div className="profile-root" />

  const stats = (() => {
    if (cleanRecords.length === 0) return null
    const withData = cleanRecords.filter(r => r.total > 0)
    if (withData.length === 0) return null

    const totalEn = cleanRecords.reduce((s, r) => s + r.english, 0)
    const totalSp = cleanRecords.reduce((s, r) => s + r.spanish, 0)
    const avgEn = Math.round(totalEn / cleanRecords.length)
    const bestDay = [...withData].sort((a, b) => b.english - a.english)[0]
    const worstDay = [...withData].sort((a, b) => a.english - b.english)[0]
    const top3Days = cleanRecords.filter(r => r.rank && r.rank <= 3)
    const top1Days = cleanRecords.filter(r => r.rank === 1)

    const withShare = withData.filter(r => teamTotals[r.date] > 0)
    const bestShareDay = withShare.length > 0
      ? [...withShare].sort((a, b) => (b.english / (teamTotals[b.date] || 1)) - (a.english / (teamTotals[a.date] || 1)))[0]
      : null

    const bestSharePct = bestShareDay
      ? ((bestShareDay.english / teamTotals[bestShareDay.date]) * 100).toFixed(1)
      : null

    const avgShare = withShare.length > 0
      ? (withShare.reduce((s, r) => s + (r.english / (teamTotals[r.date] || 1)), 0) / withShare.length * 100).toFixed(1)
      : null

    return {
      totalEn,
      totalSp,
      avgEn,
      bestDay,
      worstDay,
      activeDays: withData.length,
      zeroDays: cleanRecords.length - withData.length,
      daysTracked: cleanRecords.length,
      top3Days: top3Days.length,
      top1Days: top1Days.length,
      bestShareDay,
      bestSharePct,
      avgShare,
    }
  })()

  return (
    <div className="profile-root">
      <canvas ref={canvasRef} className="profile-trail-canvas" />
      <nav className="profile-nav">
        <div className="profile-nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <span>Pulse</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="profile-nav-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          {isOwnProfile && <button className="profile-nav-btn accent" onClick={() => navigate('/settings')}>✏️ Edit Profile</button>}
        </div>
      </nav>

      {loading ? (
        <div className="profile-loading"><div className="profile-spinner" /><p>Loading agent history...</p></div>
      ) : (
        <div className="profile-body">
          <div className="profile-hero">
            <div className="profile-hero-inner">
              <div className="profile-avatar-ring">
                {isOwnProfile && userPhoto
                  ? <img src={userPhoto} alt="" className="profile-avatar-photo" />
                  : <div className="profile-avatar-letter">{agentName?.[0]?.toUpperCase() || '?'}</div>}
              </div>
              <div className="profile-hero-info">
                <h1 className="profile-hero-name">{agentName || `Agent #${ext}`}</h1>
                <div className="profile-hero-meta">
                  <img src={`https://flagcdn.com/w20/${teamInfo.flag}.png`} alt="" style={{ borderRadius: 2 }} />
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{teamInfo.name}</span>
                  <span className="profile-ext-tag">#{ext}</span>
                  {isOwnProfile && <span className="profile-own-tag">✓ You</span>}
                </div>
                {cleanRecords.length === 0 && <p style={{ color: '#6b7280', marginTop: 8, fontSize: 12 }}>No data yet.</p>}
              </div>
            </div>
          </div>

          {stats && (
            <>
              <div className="profile-section">
                <h2 className="profile-section-title">📈 Performance Timeline</h2>
                <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 16, marginTop: 8 }}>
                  <div
                    className="profile-chart"
                    style={{
                      minWidth: `${timelineMinWidth}px`,
                      display: 'grid',
                      gridAutoFlow: 'column',
                      gridAutoColumns: '72px',
                      gap: '14px',
                      alignItems: 'end',
                    }}
                  >
                    {cleanRecords.map((r, i) => {
                      const teamTotal = teamTotals[r.date] || 0
                      const sharePct = teamTotal > 0 ? ((r.english / teamTotal) * 100).toFixed(1) : null
                      const tooltipText = `${formatDate(r.date)}: ${r.english} EN${r.rank ? ` · Rank #${r.rank}` : ''}${sharePct ? ` · ${sharePct}% share` : ''}`

                      return (
                        <div
                          key={i}
                          className="ptl-col"
                          title={tooltipText}
                          style={{
                            minWidth: 72,
                            padding: '6px 6px 8px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <div className="ptl-bar-outer" style={{ height: 196, padding: '0 4px' }}>
                            <div className="ptl-bar" style={{
                              height: `${(r.english / maxEnglish) * 100}%`,
                              minHeight: r.english > 0 ? 6 : 2,
                              borderRadius: 8,
                              background: r.rank === 1 ? '#fbbf24' : r.rank === 2 ? '#9ca3af' : r.rank === 3 ? '#cd7f32' :
                                r.english >= teamInfo.goal ? '#34d399' : r.english > 0 ? '#60a5fa' : '#2a2d38',
                            }} />
                          </div>
                          <div className="ptl-rank">{r.rank && r.rank <= 3 ? <MedalImg rank={r.rank} /> : null}</div>
                          <div className="ptl-val" style={{ color: r.english === stats.bestDay.english ? '#34d399' : r.english === 0 ? '#4b5563' : '#9ca3af' }}>{r.english > 0 ? r.english : '—'}</div>
                          <div className="ptl-date" style={{ minHeight: 20 }}>{formatDate(r.date)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section-title">📋 Daily Records</h2>
                <div className="profile-table-wrap">
                  <table className="profile-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>English</th>
                        {teamInfo.hasSp && <th>Spanish</th>}
                        <th>Total</th>
                        <th>Rank</th>
                        <th style={{ color: '#a78bfa' }}>Share%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...cleanRecords].reverse().map((r, i) => {
                        const teamTotal = teamTotals[r.date] || 0
                        const sharePct = teamTotal > 0 ? ((r.english / teamTotal) * 100) : null
                        return (
                          <tr key={i} className={r.rank === 1 ? 'ptr-gold' : r.rank === 2 ? 'ptr-silver' : r.rank === 3 ? 'ptr-bronze' : r.total === 0 ? 'ptr-zero' : ''}>
                            <td style={{ color: '#9ca3af' }}>{formatDate(r.date)}</td>
                            <td style={{ color: '#60a5fa', fontWeight: 600 }}>{r.english}</td>
                            {teamInfo.hasSp && <td style={{ color: '#34d399', fontWeight: 600 }}>{r.spanish}</td>}
                            <td style={{ color: '#f97316', fontWeight: 600 }}>{r.total}</td>
                            <td>{r.rank ? <MedalImg rank={r.rank} /> : <span style={{ color: '#4b5563' }}>—</span>}</td>
                            <td style={{ color: sharePct !== null ? getShareColor(sharePct) : '#4b5563', fontWeight: 600, fontSize: 13 }}>
                              {sharePct !== null ? `${sharePct.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
