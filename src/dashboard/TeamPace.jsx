import { useEffect, useState } from 'react'
import { number } from './dashboardModel.js'
import { teamPace, shiftHourLabel } from './shiftTargets.js'
import { englishPerHour, hourlyLabel } from './agentPresentation.js'

export function TeamPace({ rows, scope, date, generatedAt }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer) }, [])
  const pace = teamPace(rows, scope, date, now)
  if (!pace) return null
  return <section className="dash-team-pace" aria-label="Team English pace">
    <header><h3>Team pace · English</h3><span>{pace.phase} · {pace.historical ? date : pace.time + ' PT'}</span></header>
    <div className="dash-pace-values"><div><span>ENG XFER</span><strong>{number(pace.english)}</strong></div><div><span>{pace.expected === pace.daily ? 'Day target' : 'Expected now'}</span><strong>{number(pace.expected)}</strong></div><div className={pace.gap < 0 ? 'dash-day-goal--below' : 'dash-day-goal--met'}><span>{pace.gap < 0 ? 'Behind target' : 'Ahead of target'}</span><strong>{number(Math.abs(pace.gap))}</strong></div><div title="Total English transfers divided by total recorded agent hours (Time), including pauses."><span>Avg ENG / agent-hour</span><strong>{hourlyLabel(englishPerHour(rows))}</strong></div></div>
    <details><summary>Hourly targets · {pace.agents} agents</summary>
      <table className="dash-pace-table"><thead><tr><th>Shift</th><th>Los Angeles</th><th>Team goal</th></tr></thead><tbody>{pace.hours.map((hour, index) => <FragmentRow key={hour.start} hour={hour} lunch={index === 4 && pace.hours[index + 1]?.start === 13 * 60} />)}</tbody></table>
    </details>
    {generatedAt && <small>CSV generated · {generatedAt.replace('T', ' ')}</small>}
  </section>
}

function FragmentRow({ hour, lunch }) {
  return <><tr className={hour.active ? 'dash-pace-active' : undefined}><td>{hour.label}</td><td>{shiftHourLabel(hour.start)}–{shiftHourLabel(hour.end)}</td><td>{number(hour.cumulative)}</td></tr>{lunch && <tr><td>Lunch</td><td>12 PM–1 PM</td><td>—</td></tr>}</>
}
