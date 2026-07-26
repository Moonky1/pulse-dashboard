import { BUSINESS_HOURS } from '../config/dashboardConfig'
import { getTeamGoal } from './dashboardHelpers'

export const normalizeSearchText = value => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const colombiaDate = () => new Date(Date.now() - 5 * 60 * 60 * 1000)

export const todayKey = () => {
  const d = colombiaDate()

  // Business-day protection: 00:00 - 03:59 still belongs to previous work day.
  if (d.getUTCHours() < 4) d.setUTCDate(d.getUTCDate() - 1)

  return d.toISOString().slice(0, 10)
}

export function normalizeDate(raw) {
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

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function dateAddKey(dateKey, days) {
  const d = new Date(`${dateKey}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + Number(days || 0))

  return d.toISOString().slice(0, 10)
}

export function getWeekStartKey(dateKey) {
  const date = normalizeDate(dateKey)
  if (!date) return null

  const d = new Date(`${date}T12:00:00Z`)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day

  d.setUTCDate(d.getUTCDate() + diff)

  return d.toISOString().slice(0, 10)
}

export function getWeekEndKey(weekStartKey) {
  return weekStartKey ? dateAddKey(weekStartKey, 5) : null
}

export function formatDateLabel(date) {
  if (!date) return 'N/A'
  if (date === todayKey()) return 'Today — LIVE'

  const [year, month, day] = String(date).split('-')
  if (!year || !month || !day) return date

  return `${day}/${month}/${year}`
}

export function getMetricLabel(metric) {
  if (metric === 'english') return 'English'
  if (metric === 'spanish') return 'Spanish'
  if (metric === 'invalid') return 'Invalid'
  if (metric === 'goalDays') return 'Goal Days'
  if (metric === 'total') return 'Total'

  return metric
}

export function getMetricColor(metric) {
  if (metric === 'english') return '#38bdf8'
  if (metric === 'spanish') return '#34d399'
  if (metric === 'invalid') return '#fb7185'
  if (metric === 'goalDays') return '#fbbf24'
  if (metric === 'lowestXfers') return '#fbbf24'

  return '#d7b987'
}

export function isSaturdayDateKey(dateKey) {
  const date = normalizeDate(dateKey)
  if (!date) return false

  const d = new Date(`${date}T12:00:00Z`)

  return d.getUTCDay() === 6
}

export function getBusinessHoursForDate(dateKey) {
  return isSaturdayDateKey(dateKey)
    ? BUSINESS_HOURS.saturday
    : BUSINESS_HOURS.weekday
}

export function getGoalTargetForDate(teamId, dateKey) {
  return isSaturdayDateKey(dateKey) ? 10 : getTeamGoal(teamId)
}

export function getGoalMetricForDate(dateKey) {
  return isSaturdayDateKey(dateKey) ? 'total' : 'english'
}

export function agentReachedGoal(agent) {
  const goal = getGoalTargetForDate(
    agent?.teamId || agent?.team,
    agent?.date
  )

  const metric = getGoalMetricForDate(agent?.date)

  if (metric === 'total') {
    return Number(agent?.total || agent?.rawTotal || 0) >= goal
  }

  return Number(agent?.english || 0) >= goal
}

export function getGoalRuleLabel(teamId, dateKey = null) {
  if (dateKey && isSaturdayDateKey(dateKey)) {
    return 'Saturday goal: 10 Total'
  }

  if (teamId === 'asia') {
    return 'Mon-Fri goal: 20 English • Saturday: 10 Total'
  }

  return 'Mon-Fri goal: 10 English • Saturday: 10 Total'
}

export function playPulseSound(type = 'click') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const tones = type === 'goal'
      ? [
          { f: 660, t: 0, d: 0.09, g: 0.055 },
          { f: 880, t: 0.09, d: 0.11, g: 0.05 },
          { f: 1175, t: 0.2, d: 0.16, g: 0.045 },
        ]
      : type === 'team'
        ? [
            { f: 196, t: 0, d: 0.14, g: 0.038 },
            { f: 392, t: 0.05, d: 0.18, g: 0.034 },
            { f: 587, t: 0.14, d: 0.18, g: 0.03 },
            { f: 784, t: 0.28, d: 0.2, g: 0.026 },
          ]
        : [
            { f: 440, t: 0, d: 0.05, g: 0.026 },
            { f: 620, t: 0.045, d: 0.06, g: 0.022 },
          ]

    tones.forEach(tone => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(tone.f, now + tone.t)

      gain.gain.setValueAtTime(0.0001, now + tone.t)
      gain.gain.exponentialRampToValueAtTime(
        tone.g,
        now + tone.t + 0.01
      )
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + tone.t + tone.d
      )

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + tone.t)
      osc.stop(now + tone.t + tone.d + 0.02)
    })

    window.setTimeout(() => ctx.close?.(), 700)
  } catch {
    // Sounds are optional and must never break the dashboard.
  }
}