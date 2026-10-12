import { csvReportDate, uploadReports } from './manualReportApi.js'

export async function prepareReportBatch(selection) {
  const entries = Object.entries(selection).flatMap(([type, files]) => files.map(file => ({ type, file })))
  if (!entries.length || entries.length > 20) throw Error('Choose 1–20 CSV files per batch.')
  const reports = await Promise.all(entries.map(async entry => {
    const { file } = entry
    if (!/\.csv$/i.test(file.name) || !file.size || file.size > 5 * 1024 * 1024) throw Error('Each file must be a CSV of up to 5 MiB.')
    const date = await csvReportDate(file)
    const header = await file.slice(0, 4096).text()
    const generated = header.match(/Agent Performance Detail\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1]
    if (!date || !generated) throw Error('Use original full-day VICIdial CSV files.')
    return { ...entry, date, generated }
  }))
  // Preserve every cut. Never sum uploads or guess which of several cuts form a pair.
  const days = [...new Set(reports.map(r => r.date))].sort()
  return days.flatMap(date => {
    const items = reports.filter(r => r.date === date).sort((a,b) => a.generated.localeCompare(b.generated) || a.type.localeCompare(b.type) || a.file.name.localeCompare(b.file.name))
    if (items.length === 2 && items[0].type !== items[1].type) return [{
      reportDate: date, files: items.map(r => r.file.name), ...Object.fromEntries(items.map(r => [r.type,r.file])),
    }]
    return items.map(r => ({ reportDate: date, files: [r.file.name], [r.type]: r.file }))
  })
}

export async function runReportBatch({ client, scopeId, jobs, start = 0, onResult, shouldContinue = () => true,
  upload = uploadReports, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  let next = start, last = null
  for (; next < jobs.length && shouldContinue(); next++) {
    if (next > start) { await wait(1100); if (!shouldContinue()) break }
    let result = await upload(client, {scopeId, ...jobs[next]})
    if (result.code === 'import_cooldown' && shouldContinue()) {
      await wait(5100)
      if (!shouldContinue()) break
      result = await upload(client, {scopeId, ...jobs[next]})
    }
    onResult(next, result)
    if (result.error) return { next, last, failed: true }
    last = result
  }
  return { next, last, failed: false }
}
