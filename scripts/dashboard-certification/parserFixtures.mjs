// Small synthetic examples for adversarial unit tests. NOT the real 50-agent proof.
import {
  PERFORMANCE_DURATIONS, PERFORMANCE_DISPOSITIONS, PAUSE_DURATIONS,
} from '../../supabase/functions/_shared/viciReportParsers.mjs'

export const identityHeaders = ['USER NAME', 'ID', 'CURRENT USER GROUP', 'MOST RECENT USER GROUP']
export const performanceHeaders = [...identityHeaders, 'CALLS', ...Object.keys(PERFORMANCE_DURATIONS), ...PERFORMANCE_DISPOSITIONS]
export const pauseHeaders = [...identityHeaders, 'TOTAL', 'NONPAUSE', 'PAUSE', '', '', ...Object.keys(PAUSE_DURATIONS).slice(3).map(name => ({ BREAK: 'Break', LUNCH: 'Lunch', MANAGE: 'Manage', TECH: 'Tech' }[name] || name))]
export const options = { ingestedAt: '2026-10-09T21:00:00.000Z' }
export const csvLine = cells => cells.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')

export function fixture(type, { headers, transform, totals = true } = {}) {
  headers ||= type === 'performance' ? performanceHeaders : pauseHeaders
  const agents = ['0001', '0099'].map((id, i) => {
    let blank = 0
    return headers.map(header => {
      const name = header.toUpperCase()
      if (name === 'USER NAME') return i ? 'Fixture, "Two" ' : ' Fixture   One '
      if (name === 'ID') return id
      if (['CURRENT USER GROUP', 'MOST RECENT USER GROUP'].includes(name)) return 'FixtureGroup'
      if (name === 'CALLS') return i ? '17' : '11'
      if (name === 'SPANIS') return '4'
      if (type === 'performance' && PERFORMANCE_DISPOSITIONS.includes(name)) return '1'
      if (Object.hasOwn(type === 'performance' ? PERFORMANCE_DURATIONS : PAUSE_DURATIONS, name)) return '0:00:01'
      if (!name) return blank++ ? '0:00:03' : ''
      return type === 'performance' ? '1' : '0:00:02'
    })
  })
  let blank = 0
  const summary = headers.map(header => {
    const name = header.toUpperCase()
    if (['USER NAME', 'ID'].includes(name)) return ''
    if (name === 'CURRENT USER GROUP') return 'TOTALS'
    if (name === 'MOST RECENT USER GROUP') return 'AGENTS:2'
    if (name === 'CALLS') return '28'
    if (name === 'SPANIS') return '8'
    if (type === 'performance' && PERFORMANCE_DISPOSITIONS.includes(name)) return '2'
    if (Object.hasOwn(type === 'performance' ? PERFORMANCE_DURATIONS : PAUSE_DURATIONS, name)) return name.endsWith('AVG') ? '0:00:01' : '0:00:02'
    if (!name) return blank++ ? '0:00:06' : ''
    return type === 'performance' ? '2' : '0:00:04'
  })
  transform?.({ headers, agents, summary })
  return [
    csvLine(['Agent Performance Detail                        2026-10-09 19:45:14']),
    csvLine(['Time range: 2026-10-09 00:00:00 to 2026-10-09 23:59:59']),
    '', csvLine([type === 'pause' ? 'PAUSE CODE BREAKDOWN:' : '---------- AGENTS Details -------------']),
    csvLine(headers), ...agents.map(csvLine), ...(totals ? [csvLine(summary)] : []), '',
  ].join('\r\n')
}
