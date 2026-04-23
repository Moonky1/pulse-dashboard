import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './dashboard.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const CLEAN_START_DATE = '2026-04-23'
const POLL_MS = 45000
const LIVE_CACHE_KEY = 'pulse_live_cache_v4'

const E = {
  goal1: '/emojis/goal1.webp',
  goal3: '/emojis/goal3.webp',
  goal4: '/emojis/goal4.webp',
  medal1: '/emojis/medal1.webp',
  medal2: '/emojis/medal2.webp',
  medal3: '/emojis/medal3.webp',
}

const TEAM_RANK_EMOJIS = [E.goal1, E.goal3, E.goal4]
const MEDALS = [E.medal1, E.medal2, E.medal3]

const TEAMS = {
  asia: {
    id: 'asia',
    label: 'Asia',
    short: 'Asia',
    flag: '/flags/asia.png',
    sheetName: 'AW GARRET ASIA LEXNER',
    prefix: '3',
    hasSpanish: true,
    live: true,
  },
  philippines: {
    id: 'philippines',
    label: 'Philippines',
    short: 'Philippines',
    flag: '/flags/philippines.png',
    sheetName: 'AW GARRET PHILIPPINES ',
    prefix: '1',
    hasSpanish: false,
    live: true,
  },
  colombia: {
    id: 'colombia',
    label: 'Colombia',
    short: 'Colombia',
    flag: '/flags/colombia.png',
    sheetName: 'AW GARRET COLOMBIA JUAN GARCIA',
    prefix: '2',
    hasSpanish: true,
    live: true,
  },
  mexico: {
    id: 'mexico',
    label: 'Mexico Baja',
    short: 'Mexico',
    flag: '/flags/mexico.png',
    sheetName: 'AW GARRET BAJA MX KEVIN',
    prefix: '5',
    hasSpanish: false,
    live: true,
  },
  central: {
    id: 'central',
    label: 'Central America',
    short: 'Central',
    flag: null,
    prefix: '4',
    hasSpanish: true,
    live: false,
  },
  venezuela: {
    id: 'venezuela',
    label: 'Venezuela',
    short: 'Venezuela',
    flag: '/flags/venezuela.png',
    prefix: '6',
    hasSpanish: true,
    live: false,
  },
}

const TEAM_ORDER = ['asia', 'philippines', 'colombia', 'mexico', 'central', 'venezuela']
const SORT_OPTIONS = [
  { id: 'english', label: 'English Xfers' },
  { id: 'spanish', label: 'Spanish Xfers' },
  { id: 'total', label: 'Total Xfers' },
]

const safeInt = (value) => parseInt(String(value ?? '').replace(/,/g, '').trim(), 10) || 0
const cellUpper = (value) => String(value ?? '').trim().toUpperCase()
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

function isAgentRow(nameCell, extCell, prefix, banned = []) {
  const name = cellUpper(nameCell)
  const ext = String(extCell ?? '').replace(/,/g, '').trim()
  if (!new RegExp(`^${prefix}\\d{3}$`).test(ext)) return false
  if (!name) return false
  return !banned.some(word => name.includes(word))
}

function buildAgent(name, ext, english, spanish = 0) {
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

function sortAgentsByMetric(agents, metric = 'total') {
  return [...(agents || [])].sort((a, b) => {
    if ((b?.[metric] || 0) !== (a?.[metric] || 0)) return (b?.[metric] || 0) - (a?.[metric] || 0)
    if ((b?.total || 0) !== (a?.total || 0)) return (b?.total || 0) - (a?.total || 0)
    if ((b?.english || 0) !== (a?.english || 0)) return (b?.english || 0) - (a?.english || 0)
    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
}

function createEmptyParsed(hasSpanish = true) {
  return {
    agents: [],
    totals: { english: 0, spanish: 0, total: 0, activeAgents: 0 },
    mainTotals: { english: 0, spanish: 0, total: 0 },
    otTotals: { english: 0, spanish: 0, total: 0 },
    includesOT: false,
    hasSpanish,
  }
}

function parseAsiaRows(rows, withOT) {
  const banned = [
    'ASIA', 'OT TAKERS', 'MANAGEMENT', 'USER', 'TRANSFERS', 'SPANISH', 'ENGLISH', 'TOTAL',
    'LEXNER', 'GENERAL MANAGER', 'PACIFIC STANDARD TIME', 'BREAK', 'LUNCH', 'DAILY TARGET',
    'XFER PER HOUR', 'THIS HOUR GOAL', 'GOAL+', 'AGENT LOGGED IN', 'AGENTS LOGGED IN',
  ]

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
        total: safeInt(row[4]) || (safeInt(row[2]) + safeInt(row[3])),
      }
      if (!inOT) mainFooter = footer
      else otFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '3', banned)) continue
    const agent = buildAgent(name, ext, row[3], row[2])

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
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((s, a) => s + a.spanish, 0)
  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((s, a) => s + a.english, 0)
  const otSpanish = withOT ? (otFooter ? otFooter.spanish : otList.reduce((s, a) => s + a.spanish, 0)) : 0
  const otEnglish = withOT ? (otFooter ? otFooter.english : otList.reduce((s, a) => s + a.english, 0)) : 0

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
    hasSpanish: true,
  }
}

function parsePhilippinesRows(rows, withOT) {
  const banned = [
    'PHILIPPINES', 'PHILIPPINES OT', 'USERS', 'USER', 'EXTENSION', 'TRANSFER', 'PER AGENT', 'ENGLISH',
    'PACIFIC STANDARD TIME', 'BREAK', 'SUPERVISOR', 'THIS HOUR GOAL', 'AGENT LOGGED IN', 'AGENTS LOGGED IN',
    'AW PHIL', 'OPENERS', 'OPENERS2', 'OPENER3'
  ]

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
      inOT = true
      sawOTSection = true
      continue
    }

    if (!inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN'))) {
      mainFooter = Math.max(mainFooter, safeInt(row[2]), safeInt(row[3]))
      continue
    }

    if (inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS'))) {
      otFooter = Math.max(otFooter, safeInt(row[2]), safeInt(row[3]))
      continue
    }

    if (!isAgentRow(name, ext, '1', banned)) continue
    const agent = buildAgent(name, ext, row[2], 0)

    if (!inOT) {
      const prev = mainAgents.get(agent.ext)
      if (!prev || agent.total > prev.total || agent.english > prev.english) mainAgents.set(agent.ext, agent)
    } else {
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
  const mainEnglish = Math.max(mainFooter, mainList.reduce((s, a) => s + a.english, 0))
  const otEnglish = withOT ? Math.max(otFooter, otList.reduce((s, a) => s + a.english, 0)) : 0

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
    hasSpanish: false,
  }
}

function parseColombiaRows(rows, withOT) {
  const banned = [
    'COLOMBIA', 'COLOMBIA OT', 'JUAN GARCIA', 'SUPERVISOR', 'EXTENSION', 'OPENERS', 'ENGLISH', 'SPANISH', 'TOTAL',
    'TRANSFERS', 'THIS HOUR GOAL', 'AGENT LOGGED IN', 'AGENTS LOGGED IN'
  ]

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
      inOT = true
      sawOTSection = true
      continue
    }

    if (!inOT && (txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS'))) {
      const footer = {
        english: safeInt(row[3]),
        spanish: safeInt(row[4]),
        total: safeInt(row[5]) || (safeInt(row[3]) + safeInt(row[4])),
      }
      if (footer.english > 0 || footer.spanish > 0 || footer.total > 0) mainFooter = footer
      continue
    }

    if (!isAgentRow(name, ext, '2', banned)) continue
    const agent = buildAgent(name, ext, row[3], row[4])

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
  const mainEnglish = mainFooter ? mainFooter.english : mainList.reduce((s, a) => s + a.english, 0)
  const mainSpanish = mainFooter ? mainFooter.spanish : mainList.reduce((s, a) => s + a.spanish, 0)
  const otEnglish = withOT ? otList.reduce((s, a) => s + a.english, 0) : 0
  const otSpanish = withOT ? otList.reduce((s, a) => s + a.spanish, 0) : 0

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
    hasSpanish: true,
  }
}

function parseMexicoRows(rows, withOT) {
  const banned = [
    'MEXICO TEAM', 'AUTO WARRANTY', 'SUP --', 'AGENTS', 'USER', 'CAMPAIGN', 'TOTAL XFERS', 'DAILY EARNED', 'WEEKLY EA',
    'MEXICO OT', 'TOTAL TRANSFERS', 'AGENTS LOG IN', 'AGENT LOGGED IN', 'AGENTS LOGGED IN', 'HOURLY GOAL', 'THIS HOUR GOAL',
  ]

  const mainAgents = new Map()
  const otAgents = new Map()
  let inOT = false
  let sawOTSection = false
  let mainFooter = 0
  let otFooter = 0

  const keepBestAgent = (map, agent) => {
    if (!agent?.ext) return
    const prev = map.get(agent.ext)
    if (!prev || agent.total > prev.total || agent.english > prev.english) {
      map.set(agent.ext, agent)
    }
  }

  const addOtAgent = (map, agent) => {
    if (!agent?.ext || agent.total <= 0) return
    const prev = map.get(agent.ext)
    if (!prev) {
      map.set(agent.ext, agent)
      return
    }
    map.set(agent.ext, {
      ...prev,
      english: prev.english + agent.english,
      total: prev.total + agent.total,
    })
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || []
    const txt = rowText(row)
    const name = String(row[0] || '').trim()
    const ext = String(row[1] || '').replace(/,/g, '').trim()

    if (txt.includes('MEXICO OT')) {
      inOT = true
      sawOTSection = true
      continue
    }

    if (!inOT && (txt.includes('AGENTS LOG IN') || txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS'))) {
      mainFooter = Math.max(mainFooter, safeInt(row[3]), safeInt(row[2]), safeInt(row[1]))
      continue
    }

    if (inOT && (txt.includes('AGENTS LOG IN') || txt.includes('AGENT LOGGED IN') || txt.includes('AGENTS LOGGED IN') || txt.includes('TOTAL TRANSFERS'))) {
      otFooter = Math.max(otFooter, safeInt(row[3]), safeInt(row[2]), safeInt(row[1]))
      continue
    }

    if (!isAgentRow(name, ext, '5', banned)) continue

    // Mexico main layout: A name, B ext, C campaign, D total xfers.
    // Some blank/template duplicate rows can appear later, so we keep the strongest row per extension.
    const english = safeInt(row[3])
    const agent = buildAgent(name, ext, english, 0)

    if (!inOT) keepBestAgent(mainAgents, agent)
    else addOtAgent(otAgents, agent)
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
  const mainEnglish = Math.max(mainFooter, mainList.reduce((s, a) => s + a.english, 0))
  const otEnglish = withOT ? Math.max(otFooter, otList.reduce((s, a) => s + a.english, 0)) : 0

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
    hasSpanish: false,
  }
}

function parseLiveSheet(teamId, rows) {
  if (teamId === 'asia') return parseAsiaRows(rows, includeOT())
  if (teamId === 'philippines') return parsePhilippinesRows(rows, includeOT())
  if (teamId === 'colombia') return parseColombiaRows(rows, includeOT())
  if (teamId === 'mexico') return parseMexicoRows(rows, includeOT())
  return createEmptyParsed(TEAMS[teamId]?.hasSpanish)
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
  const d = new Date(`${date}T12:00:00`)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${day} ${dd}/${mm}`
}

function FlagImg({ src, size = 18, alt = '' }) {
  if (!src) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>🌎</span>
  return <img src={src} alt={alt} width={size} height={Math.round(size * 0.72)} style={{ borderRadius: 3, objectFit: 'cover', display: 'inline-block' }} />
}

function RankBadge({ rank }) {
  if (rank < 0 || rank > 2) return <span style={{ fontWeight: 900, color: '#94a3b8' }}>#{rank + 1}</span>
  return <img src={TEAM_RANK_EMOJIS[rank]} alt={`#${rank + 1}`} width={28} height={28} style={{ objectFit: 'contain' }} />
}

function Medal({ index, size = 18 }) {
  return <img src={MEDALS[index]} alt="" width={size} height={size} style={{ objectFit: 'contain' }} />
}

function TeamTabs({ selectedTeam, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      padding: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 26,
    }}>
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
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
      {SORT_OPTIONS.map(option => {
        const active = sortMetric === option.id
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            style={{
              border: active ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
              background: active ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? '#fff' : '#cbd5e1',
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function TeamOverviewCard({ team, rank, metric, onSelect }) {
  const metricLabel = metric === 'english' ? 'English Xfers' : metric === 'spanish' ? 'Spanish Xfers' : 'Total Xfers'
  const metricValue = team.data?.totals?.[metric] || 0
  return (
    <button
      onClick={() => onSelect(team.id)}
      style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.10), rgba(37,99,235,0.08))',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24,
        padding: 22,
        textAlign: 'left',
        color: '#fff',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RankBadge rank={rank} />
          <FlagImg src={team.flag} size={32} alt={team.label} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{team.label}</div>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>{team.data.totals.activeAgents} active agents</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{metricLabel}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: metric === 'spanish' ? '#34d399' : metric === 'english' ? '#60a5fa' : '#f59e0b' }}>
            {Number(metricValue || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
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
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{Number(value || 0).toLocaleString()}</div>
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

function TopThreeCard({ title, metric, agents }) {
  const top = sortAgentsByMetric(agents, metric).slice(0, 3)
  const color = metric === 'english' ? '#60a5fa' : metric === 'spanish' ? '#34d399' : '#f59e0b'
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18,
      padding: '18px 20px'
    }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 14 }}>{title}</div>
      {top.map((agent, index) => (
        <div key={`${metric}-${agent.ext}`} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <Medal index={index} size={18} />
          <div style={{ fontWeight: 800, color: '#f8fafc', minWidth: 0 }}>{agent.name}</div>
          <div style={{ color: '#94a3b8' }}>#{agent.ext}</div>
          <div style={{ color, fontWeight: 900 }}>{agent[metric]}</div>
        </div>
      ))}
    </div>
  )
}

function AgentTable({ teamLabel, agents, navigate, hasSpanish }) {
  return (
    <div style={{
      marginTop: 18,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 800, color: '#e5e7eb' }}>
        {teamLabel} agents
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Agent</th>
              <th style={thStyle}>Ext</th>
              {hasSpanish ? <th style={thStyle}>Spanish</th> : null}
              <th style={thStyle}>English</th>
              <th style={thStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, index) => (
              <tr key={agent.ext} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#f8fafc', cursor: 'pointer' }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>#{agent.ext}</td>
                {hasSpanish ? <td style={{ ...tdStyle, color: '#34d399', fontWeight: 700 }}>{agent.spanish}</td> : null}
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

function ComingSoonCard({ team }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: '24px 22px',
      color: '#94a3b8'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <FlagImg src={team.flag} size={18} alt={team.label} />
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{team.label}</div>
      </div>
      <div style={{ fontSize: 14 }}>Live reading is not enabled yet for this team.</div>
    </div>
  )
}

function DatesPanel({ dateTabs, selectedDate, onSelect }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 18,
      minWidth: 240,
      alignSelf: 'start'
    }}>
      <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, marginBottom: 14 }}>DATES</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {dateTabs.map(date => {
          const active = date === selectedDate
          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              style={{
                border: active ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)',
                color: '#fff',
                borderRadius: 14,
                padding: '12px 14px',
                fontWeight: 800,
                textAlign: 'left',
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

function readLiveCache() {
  try {
    const raw = localStorage.getItem(LIVE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.data) return null
    return parsed
  } catch (error) {
    return null
  }
}

function writeLiveCache(data) {
  try {
    localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({
      updatedAt: new Date().toISOString(),
      data,
    }))
  } catch (error) {}
}

export default function Dashboard() {
  const navigate = useNavigate()
  const cachedLive = useMemo(() => readLiveCache(), [])
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [sortMetric, setSortMetric] = useState('english')
  const [loading, setLoading] = useState(!cachedLive?.data)
  const [error, setError] = useState('')
  const [liveData, setLiveData] = useState(() => cachedLive?.data || { asia: null, philippines: null, colombia: null, mexico: null })
  const [historicalData, setHistoricalData] = useState({ asia: null, philippines: null, colombia: null, mexico: null })
  const [remoteDates, setRemoteDates] = useState([])
  const [lastUpdate, setLastUpdate] = useState(() => cachedLive?.updatedAt ? new Date(cachedLive.updatedAt) : null)

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

    const updatedAt = new Date()
    setLiveData(prev => {
      const merged = { ...prev, ...next }
      writeLiveCache(merged)
      return merged
    })
    setLastUpdate(updatedAt)
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
        hasSpanish: TEAMS[teamId].hasSpanish,
      }
    })

    setHistoricalData(next)
  }, [liveTeamIds])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        if (isToday) await loadLiveTeams()
        else await loadHistoricalTeams(selectedDate)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [isToday, selectedDate, loadLiveTeams, loadHistoricalTeams])

  useEffect(() => {
    loadRemoteDates()
  }, [loadRemoteDates])

  useEffect(() => {
    if (!isToday) return undefined
    const interval = setInterval(() => {
      loadLiveTeams().catch(() => {})
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [isToday, loadLiveTeams])

  const dateTabs = useMemo(() => {
    const base = [todayKey(), ...remoteDates.filter(date => date !== todayKey())]
    return [...new Set(base)]
  }, [remoteDates])

  const activeData = isToday ? liveData : historicalData

  const teamCards = useMemo(() => {
    return TEAM_ORDER.map(teamId => ({
      ...TEAMS[teamId],
      data: activeData[teamId] || createEmptyParsed(TEAMS[teamId].hasSpanish),
    }))
  }, [activeData])

  const sortedTeamCards = useMemo(() => {
    return [...teamCards].sort((a, b) => {
      if ((b.data?.totals?.[sortMetric] || 0) !== (a.data?.totals?.[sortMetric] || 0)) {
        return (b.data?.totals?.[sortMetric] || 0) - (a.data?.totals?.[sortMetric] || 0)
      }
      return (b.data?.totals?.total || 0) - (a.data?.totals?.total || 0)
    })
  }, [teamCards, sortMetric])

  const selectedTeamData = selectedTeam === 'all' ? null : activeData[selectedTeam]

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '24px 20px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 48, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span>Pulse</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, color: '#94a3b8' }}>
              Live now: Asia, Philippines, Colombia and Mexico. Other teams stay visible while we add them slowly and safely.
            </div>
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', paddingTop: 8 }}>
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Waiting for first sync...'}
          </div>
        </div>

        {error ? (
          <div style={{
            marginBottom: 18,
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#fecaca',
            borderRadius: 16,
            padding: '14px 16px'
          }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 18, alignItems: 'start' }}>
          <div>
            <TeamTabs selectedTeam={selectedTeam} onChange={setSelectedTeam} />

            {loading ? (
              <div style={{
                marginTop: 18,
                minHeight: 220,
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontWeight: 700
              }}>
                Loading Pulse...
              </div>
            ) : (
              <>
                {selectedTeam === 'all' ? (
                  <div style={{ marginTop: 18 }}>
                    <SortTabs sortMetric={sortMetric} onChange={setSortMetric} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      {sortedTeamCards.map((team, index) => (
                        team.live
                          ? <TeamOverviewCard key={team.id} team={team} rank={index} metric={sortMetric} onSelect={setSelectedTeam} />
                          : <ComingSoonCard key={team.id} team={team} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedTeamData ? (
                      <>
                        <div style={{
                          marginTop: 18,
                          background: 'linear-gradient(135deg, rgba(249,115,22,0.10), rgba(37,99,235,0.08))',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 24,
                          padding: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 18,
                          flexWrap: 'wrap'
                        }}>
                          <div>
                            <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 8 }}>{formatDateLabel(selectedDate)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 44, fontWeight: 900, flexWrap: 'wrap' }}>
                              <FlagImg src={TEAMS[selectedTeam].flag} size={32} alt={TEAMS[selectedTeam].label} />
                              {TEAMS[selectedTeam].label}
                            </div>
                            <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 14 }}>
                              {selectedTeamData.totals.activeAgents} active agents
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 18 }}>
                          <SummaryCard title="English" value={selectedTeamData.totals.english} color="#60a5fa" subtitle={selectedTeamData.mainTotals ? `Main: ${selectedTeamData.mainTotals.english}` : ''} />
                          {TEAMS[selectedTeam].hasSpanish ? <SummaryCard title="Spanish" value={selectedTeamData.totals.spanish} color="#34d399" subtitle={selectedTeamData.mainTotals ? `Main: ${selectedTeamData.mainTotals.spanish}` : ''} /> : null}
                          <SummaryCard title="Total" value={selectedTeamData.totals.total} color="#f59e0b" subtitle={selectedTeamData.otTotals && selectedTeamData.includesOT ? `OT: ${selectedTeamData.otTotals.total}` : ''} />
                          <SummaryCard title="Active agents" value={selectedTeamData.totals.activeAgents} color="#c084fc" subtitle={selectedDate === todayKey() ? 'Live snapshot' : 'Saved snapshot'} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`, gap: 14, marginTop: 18 }}>
                          <TopThreeCard title="Top English" metric="english" agents={selectedTeamData.agents} />
                          {TEAMS[selectedTeam].hasSpanish ? <TopThreeCard title="Top Spanish" metric="spanish" agents={selectedTeamData.agents} /> : null}
                          <TopThreeCard title="Top Total" metric="total" agents={selectedTeamData.agents} />
                        </div>

                        <AgentTable teamLabel={TEAMS[selectedTeam].label} agents={selectedTeamData.agents} navigate={navigate} hasSpanish={TEAMS[selectedTeam].hasSpanish} />
                      </>
                    ) : (
                      <ComingSoonCard team={TEAMS[selectedTeam]} />
                    )}
                  </>
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
