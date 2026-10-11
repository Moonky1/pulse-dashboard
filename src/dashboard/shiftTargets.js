import { integer, validDate } from './dashboardModel.js'
import { confirmedTargetReference, isEnglishXfer } from './reportingPolicy.js'

export const SHIFT_TIME_ZONE = 'America/Los_Angeles'
export const COLOMBIA_TIME_ZONE = 'America/Bogota'
export const isSaturday = date => validDate(date) && new Date(date + 'T12:00:00Z').getUTCDay() === 6
// Business-calendar fallback for the confirmed Openers scopes, not a claim
// about the remote Vici server clock or a collector configuration change.
export const dashboardTimeZone = scope => scope?.source_time_zone || (isEnglishXfer(scope) ? SHIFT_TIME_ZONE : null)
const hourNames = ['First hour', 'Second hour', 'Third hour', 'Fourth hour', 'Fifth hour', 'Sixth hour', 'Seventh hour', 'Eighth hour']
export const STANDARD_SHIFT = Object.freeze([7, 8, 9, 10, 11, 13, 14, 15].map((hour, index) => Object.freeze({ start: hour * 60, end: (hour + 1) * 60, label: hourNames[index] })))
export const SATURDAY_SHIFT = Object.freeze([9, 10, 11, 12, 13].map((hour, index) => Object.freeze({ start: hour * 60, end: (hour + 1) * 60, label: hourNames[index] })))

export function displayClock(now, timeZone) {
  const value = new Date(now)
  if (!Number.isFinite(value.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' }).format(value)
}

export function pacificClock(now) {
  const value = new Date(now)
  if (!Number.isFinite(value.getTime())) return null
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: SHIFT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(value).map(part => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute), time: `${parts.hour}:${parts.minute}` }
}

export function shiftSchedule(date) {
  if (!validDate(date)) return null
  return isSaturday(date) ? SATURDAY_SHIFT : STANDARD_SHIFT
}

export function teamPace(rows, scope, date, now) {
  const clock = pacificClock(now), schedule = shiftSchedule(date)
  if (!clock || !schedule) return null
  const agents = rows.filter(row => confirmedTargetReference(scope, row))
  if (!agents.length || agents.some(row => !integer(row.xfer_count))) return null
  // Report headcount is a reference, not a scheduled roster or an attendance verdict.
  const minutes = date < clock.date ? 24 * 60 : date > clock.date ? 0 : clock.minutes
  const workedMinutes = schedule.reduce((sum, hour) => sum + Math.min(60, Math.max(0, minutes - hour.start)), 0)
  const active = schedule.find(hour => minutes >= hour.start && minutes < hour.end)
  const phase = minutes < schedule[0].start ? 'Not started' : active?.label || (!isSaturday(date) && minutes >= 12 * 60 && minutes < 13 * 60 ? 'Lunch' : !isSaturday(date) && minutes >= 16 * 60 && minutes < 17 * 60 ? 'Extra hour' : 'Shift complete')
  const english = agents.reduce((sum, row) => sum + row.xfer_count, 0)
  const hourly = agents.length * 3
  const expected = Math.floor(hourly * workedMinutes / 60)
  return { agents: agents.length, english, hourly, expected, daily: hourly * schedule.length,
    gap: english - expected, workedMinutes, phase, time: clock.time, historical: date < clock.date,
    hours: schedule.map((hour, index) => ({ ...hour, cumulative: hourly * (index + 1), active: hour === active })) }
}

export const shiftHourLabel = minutes => {
  const hour = minutes / 60
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}
