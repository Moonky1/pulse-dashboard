// Server-only report parsing. No network, credentials, persistence or browser imports.
export const PERFORMANCE_DURATIONS = Object.freeze({
  TIME: 'time_seconds', PAUSE: 'pause_seconds', PAUSAVG: 'pause_avg_seconds',
  WAIT: 'wait_seconds', WAITAVG: 'wait_avg_seconds', TALK: 'talk_seconds',
  TALKAVG: 'talk_avg_seconds', DISPO: 'dispo_seconds', DISPAVG: 'dispo_avg_seconds',
  DEAD: 'dead_seconds', DEADAVG: 'dead_avg_seconds', CUSTOMER: 'customer_seconds',
  CUSTAVG: 'customer_avg_seconds',
})
export const PERFORMANCE_DISPOSITIONS = Object.freeze([
  'A', 'BLANK', 'CALLBK', 'DAIR', 'DC', 'DCMX', 'DISMX', 'DNC', 'LANG',
  'NI', 'SPANIS', 'WRGNUM', 'WRGVEH', 'XFER',
])
export const PAUSE_DURATIONS = Object.freeze({
  TOTAL: 'total_seconds', NONPAUSE: 'nonpause_seconds', PAUSE: 'pause_seconds',
  BREAK: 'break_seconds', CB: 'cb_seconds', DCMX: 'dcmx_seconds', DISMX: 'dismx_seconds',
  LAGGED: 'lagged_seconds', LOGIN: 'login_seconds', LUNCH: 'lunch_seconds',
  MANAGE: 'manage_seconds', RR: 'rr_seconds', TECH: 'tech_seconds',
})
const IDENTITY = Object.freeze(['USER NAME', 'ID', 'CURRENT USER GROUP', 'MOST RECENT USER GROUP'])
const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 20_000

export class ViciReportError extends Error {
  constructor(category, { line = null, column = null } = {}) {
    // Deliberately do not include CSV values, HTML, agent identity or source URLs.
    super(category)
    this.name = 'ViciReportError'
    this.category = category
    this.line = line
    this.column = column
    this.requires_ip_validation = category === 'requires_ip_validation'
  }
}

const fail = (category, context) => { throw new ViciReportError(category, context) }
const clean = value => String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')
const headerName = value => clean(value).toUpperCase()

// This is classification only. It never submits an IP-validation form.
export function classifyReportResponse(body) {
  if (typeof body !== 'string') return 'invalid_response'
  const leading = body.replace(/^\uFEFF/, '').trimStart()
  if (!leading.startsWith('<')) return null
  if (/<title\b[^>]*>\s*User Validation\s*<\/title>|abc_validation\.php/i.test(leading)) return 'requires_ip_validation'
  return 'unexpected_html_response'
}

// RFC 4180-style tokenizer also accepts VICIdial's unquoted empty spacer cells.
// Positions are retained so unnamed pause values cannot shift the named codes.
export function tokenizeViciCsv(text) {
  const category = classifyReportResponse(text)
  if (category) fail(category)
  if (!text.trim()) fail('empty_report')
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) fail('report_too_large')
  const source = text.replace(/^\uFEFF/, '')
  const records = []
  let cells = [], value = '', quoted = false, closed = false, line = 1, startLine = 1
  function cell() { cells.push(value); value = ''; closed = false }
  function row() {
    cell()
    records.push({ line: startLine, cells })
    if (records.length > MAX_ROWS) fail('too_many_rows')
    cells = []
    startLine = line + 1
  }
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') { value += '"'; index += 1 }
        else { quoted = false; closed = true }
      } else { value += character; if (character === '\n') line += 1 }
      continue
    }
    if (character === ',') { cell(); continue }
    if (character === '\r' || character === '\n') {
      row()
      if (character === '\r' && source[index + 1] === '\n') index += 1
      line += 1
      continue
    }
    if (closed) {
      if (/\s/.test(character)) continue
      fail('malformed_csv', { line })
    }
    if (character === '"') {
      if (value.trim()) fail('malformed_csv', { line })
      value = ''
      quoted = true
    } else value += character
  }
  if (quoted) fail('malformed_csv', { line: startLine })
  if (value || cells.length || closed) row()
  return records
}

export function parseViciDuration(value, context = {}) {
  const normalized = clean(value)
  // CSV report exports use H:MM:SS, including aggregates over 24 hours.
  if (!/^\d{1,7}:[0-5]\d:[0-5]\d$/.test(normalized)) fail('invalid_duration', context)
  const [hours, minutes, seconds] = normalized.split(':').map(Number)
  const total = hours * 3600 + minutes * 60 + seconds
  if (!Number.isSafeInteger(total)) fail('invalid_duration', context)
  return total
}

function count(value, context) {
  const normalized = clean(value)
  if (!/^\d+$/.test(normalized)) fail('invalid_count', context)
  const number = Number(normalized)
  if (!Number.isSafeInteger(number)) fail('invalid_count', context)
  return number
}

function sourceTime(value) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) fail('invalid_source_timestamp')
  const parsed = new Date(`${value.replace(' ', 'T')}Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 19).replace('T', ' ') !== value) fail('invalid_source_timestamp')
  // Do NOT assign UTC semantics to a source-local wall clock without source timezone config.
  return value
}

function metadata(records, headerIndex, ingestedAt) {
  const preamble = records.slice(0, headerIndex).flatMap(record => record.cells).map(clean)
  const title = preamble.find(value => /^Agent Performance Detail\s+\d{4}-\d{2}-\d{2} /i.test(value))
  const range = preamble.map(value => value.match(/^Time range:\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+to\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})$/i)).find(Boolean)
  if (!title || !range) fail('missing_report_metadata')
  const from = sourceTime(range[1]), to = sourceTime(range[2])
  if (from > to) fail('invalid_source_range')
  if (typeof ingestedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(ingestedAt) || Number.isNaN(Date.parse(ingestedAt))) fail('invalid_ingestion_timestamp')
  return {
    source_generated_at: sourceTime(title.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)?.[0] ?? ''),
    source_time_zone: null,
    source_range: { from, to },
    ingested_at: new Date(ingestedAt).toISOString(),
  }
}

function parseReport(text, type, { ingestedAt = new Date().toISOString() } = {}) {
  const records = tokenizeViciCsv(text)
  const headerIndex = records.findIndex(record => {
    const names = record.cells.map(headerName)
    return names.includes('USER NAME') && names.includes('ID')
  })
  if (headerIndex < 0) fail('missing_header')
  const header = records[headerIndex].cells.map(headerName)
  const index = new Map()
  header.forEach((name, position) => {
    if (!name) return
    if (index.has(name)) fail('duplicate_header', { line: records[headerIndex].line, column: position + 1 })
    index.set(name, position)
  })
  const durations = type === 'performance' ? PERFORMANCE_DURATIONS : PAUSE_DURATIONS
  const required = [...IDENTITY, ...Object.keys(durations), ...(type === 'performance' ? ['CALLS', ...PERFORMANCE_DISPOSITIONS] : [])]
  for (const name of required) if (!index.has(name)) fail('missing_required_column', { line: records[headerIndex].line, column: name })
  const extras = header.filter(name => name && !required.includes(name))
  const unnamed = header.map((name, position) => name ? null : position).filter(position => position !== null)
  const result = {
    report_type: type,
    ...metadata(records, headerIndex, ingestedAt),
    columns: header,
    rows: [], totals: null, comparisons: [], warnings: [],
  }
  if (extras.length) result.warnings.push({ category: type === 'performance' ? 'extra_disposition_columns' : 'extra_pause_columns', columns: extras })
  if (unnamed.length) result.warnings.push({ category: 'unnamed_columns', columns: unnamed.map(position => position + 1) })
  const ids = new Set()
  for (const record of records.slice(headerIndex + 1)) {
    if (record.cells.every(value => !clean(value))) continue
    if (record.cells.length !== header.length) fail('row_width_mismatch', { line: record.line })
    const get = name => record.cells[index.get(name)]
    const context = name => ({ line: record.line, column: index.get(name) + 1 })
    const isTotals = !clean(get('USER NAME')) && !clean(get('ID'))
      && IDENTITY.some(name => headerName(get(name)) === 'TOTALS')
    const row = {}
    if (!isTotals) {
      const agentCode = clean(get('ID'))
      if (!/^\d{1,32}$/.test(agentCode)) fail('invalid_agent_code', context('ID'))
      if (ids.has(agentCode)) fail('duplicate_agent_code', context('ID'))
      ids.add(agentCode)
      row.agent_code = agentCode
      row.vici_user_name = clean(get('USER NAME'))
      if (!row.vici_user_name) fail('missing_user_name', context('USER NAME'))
      row.current_user_group = clean(get('CURRENT USER GROUP')) || null
      row.most_recent_user_group = clean(get('MOST RECENT USER GROUP')) || null
    } else {
      if (result.totals) fail('duplicate_totals', { line: record.line })
      const declared = IDENTITY.map(name => clean(get(name)).match(/^AGENTS:\s*(\d+)$/i)).find(Boolean)
      if (!declared) fail('invalid_totals_agent_count', { line: record.line })
      row.agent_count = count(declared[1], { line: record.line, column: 'AGENTS' })
    }
    for (const [name, field] of Object.entries(durations)) row[field] = parseViciDuration(get(name), context(name))
    if (type === 'performance') {
      row.calls = count(get('CALLS'), context('CALLS'))
      row.dispositions = Object.fromEntries([...PERFORMANCE_DISPOSITIONS, ...extras].map(name => [name, count(get(name), context(name))]))
      row.xfer_count = row.dispositions.XFER
    } else {
      row.other_pause_seconds = Object.fromEntries(extras.map(name => [name, parseViciDuration(get(name), context(name))]))
    }
    row.unmapped_columns = {}
    for (const position of unnamed) {
      const value = clean(record.cells[position])
      if (!value) continue
      if (type !== 'pause') fail('unidentified_column_value', { line: record.line, column: position + 1 })
      row.unmapped_columns[`column_${position + 1}`] = parseViciDuration(value, { line: record.line, column: position + 1 })
    }
    if (isTotals) result.totals = row
    else result.rows.push(row)
  }
  if (!result.rows.length) fail('empty_agent_report')
  if (!result.totals) result.warnings.push({ category: 'missing_totals' })
  else {
    const compare = (column, reported, computed) => {
      if (!Number.isSafeInteger(computed)) fail('aggregate_overflow', { column })
      result.comparisons.push({ column, reported, computed, matches: reported === computed })
      if (reported !== computed) result.warnings.push({ category: 'totals_mismatch', column, reported, computed })
    }
    compare('AGENTS', result.totals.agent_count, result.rows.length)
    // Averages are excluded: the fixture does not establish their denominators.
    for (const field of Object.values(durations).filter(field => !field.endsWith('_avg_seconds'))) {
      compare(field, result.totals[field], result.rows.reduce((sum, row) => sum + row[field], 0))
    }
    for (const name of type === 'performance' ? ['CALLS', ...PERFORMANCE_DISPOSITIONS, ...extras] : extras) {
      const value = row => name === 'CALLS' ? row.calls : type === 'performance' ? row.dispositions[name] : row.other_pause_seconds[name]
      compare(name, value(result.totals), result.rows.reduce((sum, row) => sum + value(row), 0))
    }
    for (const position of unnamed) {
      const column = `column_${position + 1}`
      // An empty spacer is absent, not an asserted zero. Compare only present numeric cells.
      if (result.totals.unmapped_columns[column] === undefined) continue
      if (result.rows.every(row => row.unmapped_columns[column] !== undefined)) {
        compare(column, result.totals.unmapped_columns[column], result.rows.reduce((sum, row) => sum + row.unmapped_columns[column], 0))
      } else result.warnings.push({ category: 'unmapped_totals_not_comparable', column })
    }
  }
  return result
}

export const parseAgentPerformance = (text, options) => parseReport(text, 'performance', options)
export const parsePauseBreakdown = (text, options) => parseReport(text, 'pause', options)
