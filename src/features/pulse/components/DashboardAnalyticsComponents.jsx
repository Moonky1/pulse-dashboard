import { useMemo, useState } from 'react'

import {
  TEAM_ORDER,
} from '../config/dashboardConfig'

import {
  getTeamColor,
  getTeamLabel,
} from '../utils/dashboardHelpers'

import {
  formatDateLabel,
  getMetricColor,
  getMetricLabel,
  normalizeSearchText,
} from '../utils/dashboardViewHelpers'

import {
  agentMatchesSearch,
} from '../utils/dashboardSearchHelpers'

import {
  FlagImg,
  RankMarker,
  TeamInlineLabel,
} from './DashboardPrimitives'
export function SimpleLineChart({ data = [], series = [], height = 300 }) {
  const [hoverPoint, setHoverPoint] = useState(null)
  const width = 840
  const pad = { top: 28, right: 44, bottom: 44, left: 66 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const maxValue = Math.max(1, ...data.flatMap(row => series.map(item => Number(row[item.key] || 0))))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(n => Math.round(maxValue * n))

  const xForIndex = index => {
    if (data.length <= 1) return pad.left + innerW / 2
    return pad.left + (index / (data.length - 1)) * innerW
  }

  const yForValue = value => pad.top + innerH - (Number(value || 0) / maxValue) * innerH

  const handleMove = event => {
    if (!data.length) return

    const svgRect = event.currentTarget.getBoundingClientRect()
    const wrapperRect = event.currentTarget.closest('.pulse-chart-scroll')?.getBoundingClientRect() || svgRect
    const x = ((event.clientX - svgRect.left) / Math.max(1, svgRect.width)) * width
    const pct = Math.min(1, Math.max(0, (x - pad.left) / Math.max(1, innerW)))
    const index = Math.min(data.length - 1, Math.max(0, Math.round(pct * (data.length - 1))))

    setHoverPoint({
      index,
      x: event.clientX - wrapperRect.left,
      y: event.clientY - wrapperRect.top,
      flipX: event.clientX - wrapperRect.left > wrapperRect.width * 0.62,
      flipY: event.clientY - wrapperRect.top > wrapperRect.height * 0.62,
    })
  }

  const hoverRow = hoverPoint?.index != null ? data[hoverPoint.index] : null

  return (
    <div className="pulse-chart-scroll pulse-multiline-wrap pulse-soft-chart-wrap">
      <svg
        className="pulse-line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Performance trend"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverPoint(null)}
      >
        {yTicks.map((tick, index) => {
          const y = yForValue(tick)
          return (
            <g key={`tick-${index}`}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="pulse-chart-grid-line" />
              <text x={pad.left - 16} y={y + 4} textAnchor="end" className="pulse-chart-axis-text">{tick.toLocaleString()}</text>
            </g>
          )
        })}

        {series.map(item => {
          const points = data.map((row, index) => `${xForIndex(index)},${yForValue(row[item.key])}`).join(' ')
          const areaPoints = data.length
            ? `${pad.left},${pad.top + innerH} ${points} ${xForIndex(data.length - 1)},${pad.top + innerH}`
            : ''

          return (
            <g key={item.key}>
              {areaPoints ? <polygon points={areaPoints} fill={item.color} opacity="0.07" /> : null}
              <polyline points={points} fill="none" stroke={item.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )
        })}

        {data.map((row, index) => {
          if (data.length > 8 && index !== 0 && index !== data.length - 1 && index % Math.ceil(data.length / 4) !== 0) return null
          return (
            <text key={`x-${row.date}`} x={xForIndex(index)} y={height - 14} textAnchor="middle" className="pulse-chart-axis-text">
              {row.date?.slice(5).replace('-', '/')}
            </text>
          )
        })}

        {hoverRow ? (
          <g>
            <line x1={xForIndex(hoverPoint.index)} x2={xForIndex(hoverPoint.index)} y1={pad.top} y2={pad.top + innerH} className="pulse-chart-hover-line" />
            {series.map(item => (
              <circle
                key={`hover-${item.key}`}
                cx={xForIndex(hoverPoint.index)}
                cy={yForValue(hoverRow[item.key])}
                r="5"
                fill={item.color}
                stroke="#050607"
                strokeWidth="2"
              />
            ))}
          </g>
        ) : null}
      </svg>

      {hoverRow ? (
        <div
          className="pulse-chart-tooltip follow-cursor"
          style={{
            left: hoverPoint.x,
            top: hoverPoint.y,
            transform: `${hoverPoint.flipX ? 'translate(-104%, 14px)' : 'translate(18px, 14px)'} ${hoverPoint.flipY ? 'translateY(-112%)' : ''}`,
          }}
        >
          <strong>{formatDateLabel(hoverRow.date)}</strong>
          {series.map(item => (
            <span key={item.key} style={{ color: item.color }}>
              {item.label || getMetricLabel(item.key)}: {Number(hoverRow[item.key] || 0).toLocaleString()}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function SimpleBarChart({ data = [], metric = 'total' }) {
  const maxValue = Math.max(1, ...data.map(row => Number(row[metric] || 0)))
  const color = getMetricColor(metric)

  return (
    <div className="pulse-bar-chart">
      {data.map(row => {
        const value = Number(row[metric] || 0)
        const pct = Math.max(4, Math.round((value / maxValue) * 100))

        return (
          <div key={row.teamId} className="pulse-bar-row">
            <div className="pulse-bar-label">
              <FlagImg src={row.teamFlag} size={18} alt="" />
              <span>{row.teamLabel}</span>
            </div>
            <div className="pulse-bar-track">
              <div className="pulse-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <strong style={{ color }}>{value.toLocaleString()}</strong>
          </div>
        )
      })}

      {!data.length ? <div className="pulse-summary-subtitle">No chart data for this selection yet.</div> : null}
    </div>
  )
}

export function MultiTeamLineChart({ data = [], teamIds = TEAM_ORDER, metric = 'total', height = 330 }) {
  const [hoverPoint, setHoverPoint] = useState(null)
  const width = 900
  const pad = { top: 30, right: 48, bottom: 48, left: 70 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const activeTeamIds = (teamIds || TEAM_ORDER).filter(teamId => TEAM_ORDER.includes(teamId))
  const metricKey = teamId => metric === 'english' || metric === 'spanish' ? `${teamId}_${metric}` : teamId
  const values = data.flatMap(row => activeTeamIds.map(teamId => Number(row[metricKey(teamId)] ?? row[teamId] ?? 0)))
  const maxValue = Math.max(1, ...values)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(n => Math.round(maxValue * n))
  const xForIndex = index => data.length <= 1 ? pad.left + innerW / 2 : pad.left + (index / (data.length - 1)) * innerW
  const yForValue = value => pad.top + innerH - (Number(value || 0) / maxValue) * innerH

  const handleMove = event => {
    if (!data.length) return

    const svgRect = event.currentTarget.getBoundingClientRect()
    const wrapperRect = event.currentTarget.closest('.pulse-chart-scroll')?.getBoundingClientRect() || svgRect
    const x = ((event.clientX - svgRect.left) / Math.max(1, svgRect.width)) * width
    const pct = Math.min(1, Math.max(0, (x - pad.left) / Math.max(1, innerW)))
    const index = Math.min(data.length - 1, Math.max(0, Math.round(pct * (data.length - 1))))

    setHoverPoint({
      index,
      x: event.clientX - wrapperRect.left,
      y: event.clientY - wrapperRect.top,
      flipX: event.clientX - wrapperRect.left > wrapperRect.width * 0.62,
      flipY: event.clientY - wrapperRect.top > wrapperRect.height * 0.62,
    })
  }

  const hoverRow = hoverPoint?.index != null ? data[hoverPoint.index] : null

  return (
    <div className="pulse-chart-scroll pulse-multiline-wrap pulse-soft-chart-wrap">
      <svg
        className="pulse-line-chart pulse-multiline-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="All teams compared"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverPoint(null)}
      >
        {yTicks.map((tick, index) => {
          const y = yForValue(tick)
          return (
            <g key={`mt-y-${index}`}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="pulse-chart-grid-line" />
              <text x={pad.left - 16} y={y + 4} textAnchor="end" className="pulse-chart-axis-text">{tick.toLocaleString()}</text>
            </g>
          )
        })}

        {activeTeamIds.map(teamId => {
          const points = data.map((row, index) => `${xForIndex(index)},${yForValue(row[metricKey(teamId)] ?? row[teamId] ?? 0)}`).join(' ')
          return <polyline key={teamId} points={points} fill="none" stroke={getTeamColor(teamId)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        })}

        {data.map((row, index) => {
          if (data.length > 8 && index !== 0 && index !== data.length - 1 && index % Math.ceil(data.length / 4) !== 0) return null
          return (
            <text key={`mt-x-${row.date}`} x={xForIndex(index)} y={height - 16} textAnchor="middle" className="pulse-chart-axis-text">
              {row.date?.slice(5).replace('-', '/')}
            </text>
          )
        })}

        {hoverRow ? (
          <g>
            <line x1={xForIndex(hoverPoint.index)} x2={xForIndex(hoverPoint.index)} y1={pad.top} y2={pad.top + innerH} className="pulse-chart-hover-line" />
            {activeTeamIds.map(teamId => (
              <circle
                key={`dot-${teamId}`}
                cx={xForIndex(hoverPoint.index)}
                cy={yForValue(hoverRow[metricKey(teamId)] ?? hoverRow[teamId] ?? 0)}
                r="5"
                fill={getTeamColor(teamId)}
                stroke="#050607"
                strokeWidth="2"
              />
            ))}
          </g>
        ) : null}
      </svg>

      {hoverRow ? (
        <div
          className="pulse-chart-tooltip follow-cursor"
          style={{
            left: hoverPoint.x,
            top: hoverPoint.y,
            transform: `${hoverPoint.flipX ? 'translate(-104%, 14px)' : 'translate(18px, 14px)'} ${hoverPoint.flipY ? 'translateY(-112%)' : ''}`,
          }}
        >
          <strong>{formatDateLabel(hoverRow.date)}</strong>
          {activeTeamIds.map(teamId => (
            <span key={teamId} style={{ color: getTeamColor(teamId) }}>
              {getTeamLabel(teamId)}: {Number(hoverRow[metricKey(teamId)] ?? hoverRow[teamId] ?? 0).toLocaleString()}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function RadarChart({ axes = [], data = [], size = 320 }) {
  const [hover, setHover] = useState(null)
  const teamAxes = (axes || []).filter(teamId => TEAM_ORDER.includes(teamId))
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.31

  const angleFor = index => (Math.PI * 2 * index) / Math.max(1, teamAxes.length) - Math.PI / 2
  const pointFor = (index, value = 1) => {
    const angle = angleFor(index)
    return [cx + Math.cos(angle) * radius * value, cy + Math.sin(angle) * radius * value]
  }

  const polygonFor = item => teamAxes
    .map((teamId, index) => pointFor(index, Math.max(0, Math.min(1, Number(item.values?.[teamId] || 0)))))
    .map(point => point.join(','))
    .join(' ')

  const handleMove = event => {
    const wrapper = event.currentTarget.closest('.pulse-radar-wrap')
    const rect = wrapper?.getBoundingClientRect()
    if (!rect || !teamAxes.length) return

    const svgRect = event.currentTarget.getBoundingClientRect()
    const pointerX = ((event.clientX - svgRect.left) / Math.max(1, svgRect.width)) * size
    const pointerY = ((event.clientY - svgRect.top) / Math.max(1, svgRect.height)) * size

    let angle = Math.atan2(pointerY - cy, pointerX - cx) + Math.PI / 2
    if (angle < 0) angle += Math.PI * 2
    const index = Math.round(angle / (Math.PI * 2 / teamAxes.length)) % teamAxes.length
    const teamId = teamAxes[index]
    const [axisX, axisY] = pointFor(index, 1)

    const english = data.find(item => item.key === 'english')
    const spanish = data.find(item => item.key === 'spanish')

    setHover({
      index,
      teamId,
      axisX,
      axisY,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      flipX: event.clientX - rect.left > rect.width * 0.58,
      flipY: event.clientY - rect.top > rect.height * 0.58,
      english: Number(english?.rawValues?.[teamId] || 0),
      spanish: Number(spanish?.rawValues?.[teamId] || 0),
    })
  }

  return (
    <div className="pulse-radar-wrap pulse-radar-profile-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="pulse-radar-chart"
        role="img"
        aria-label="Team profile radar"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {[0.25, 0.5, 0.75, 1].map(level => (
          <polygon key={level} points={teamAxes.map((axis, index) => pointFor(index, level).join(',')).join(' ')} className="pulse-radar-ring" />
        ))}

        {teamAxes.map((teamId, index) => {
          const [x, y] = pointFor(index, 1.2)
          const [x2, y2] = pointFor(index, 1)
          return (
            <g key={teamId}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} className="pulse-radar-axis" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="pulse-radar-label">{getTeamLabel(teamId)}</text>
            </g>
          )
        })}

        {data.map(item => (
          <g key={item.key}>
            <polygon points={polygonFor(item)} fill={item.color} opacity={item.key === 'english' ? 0.18 : 0.22} />
            <polyline points={polygonFor(item)} fill="none" stroke={item.color} strokeWidth="3" strokeLinejoin="round" />
          </g>
        ))}

        {hover ? (
          <g>
            <line x1={cx} y1={cy} x2={hover.axisX} y2={hover.axisY} className="pulse-radar-hover-line" />
            <circle cx={hover.axisX} cy={hover.axisY} r="5" fill="#ffffff" stroke={getTeamColor(hover.teamId)} strokeWidth="2" />
          </g>
        ) : null}
      </svg>

      {hover ? (
        <div
          className="pulse-chart-tooltip follow-cursor radar-tooltip"
          style={{
            left: hover.x,
            top: hover.y,
            transform: `${hover.flipX ? 'translate(-104%, 12px)' : 'translate(18px, 12px)'} ${hover.flipY ? 'translateY(-112%)' : ''}`,
          }}
        >
          <strong>{getTeamLabel(hover.teamId)}</strong>
          <span style={{ color: '#38bdf8' }}>English: {hover.english.toLocaleString()}</span>
          <span style={{ color: '#34d399' }}>Spanish: {hover.spanish.toLocaleString()}</span>
        </div>
      ) : null}

      <div className="pulse-chart-legend compact pulse-radar-legend-two">
        <span><i style={{ background: '#38bdf8' }} />English</span>
        <span><i style={{ background: '#34d399' }} />Spanish</span>
      </div>
    </div>
  )
}

export function LanguageMixChart({ data = [] }) {
  return (
    <div className="pulse-language-mix">
      {data.map(row => (
        <div className="pulse-language-row" key={row.teamId}>
          <div className="pulse-language-label">
            <FlagImg src={row.teamFlag} size={18} alt="" />
            <span>{row.teamLabel}</span>
          </div>
          <div className="pulse-language-track">
            <span className="eng" style={{ width: `${Math.max(0, row.englishPct)}%` }} />
            <span className="spa" style={{ width: `${Math.max(0, row.spanishPct)}%` }} />
            <span className="bad" style={{ width: `${Math.max(0, row.invalidPct)}%` }} />
          </div>
          <div className="pulse-language-values">
            <span className="blue">{Number(row.english || 0).toLocaleString()}</span>
            <span className="green">{Number(row.spanish || 0).toLocaleString()}</span>
            <span className="orange">{Number(row.total || 0).toLocaleString()}</span>
          </div>
        </div>
      ))}
      {!data.length ? <div className="pulse-summary-subtitle">No language mix data yet.</div> : null}
    </div>
  )
}

export function HourlyPaceChart({ data = [], teamIds = TEAM_ORDER }) {
  const [hoverPoint, setHoverPoint] = useState(null)
  const width = 900
  const height = 280
  const pad = { top: 28, right: 44, bottom: 48, left: 64 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const activeTeamIds = (teamIds || TEAM_ORDER).filter(teamId => TEAM_ORDER.includes(teamId))
  const maxValue = Math.max(3, ...data.flatMap(row => activeTeamIds.map(teamId => Number(row[teamId] || 0))))
  const yTicks = [0, 1, 2, 3, Math.ceil(maxValue)].filter((v, i, arr) => arr.indexOf(v) === i)
  const xForIndex = index => data.length <= 1 ? pad.left + innerW / 2 : pad.left + (index / (data.length - 1)) * innerW
  const yForValue = value => pad.top + innerH - (Number(value || 0) / maxValue) * innerH

  const handleMove = event => {
    if (!data.length) return

    const svgRect = event.currentTarget.getBoundingClientRect()
    const wrapperRect = event.currentTarget.closest('.pulse-chart-scroll')?.getBoundingClientRect() || svgRect
    const x = ((event.clientX - svgRect.left) / Math.max(1, svgRect.width)) * width
    const pct = Math.min(1, Math.max(0, (x - pad.left) / Math.max(1, innerW)))
    const index = Math.min(data.length - 1, Math.max(0, Math.round(pct * (data.length - 1))))

    setHoverPoint({
      index,
      x: event.clientX - wrapperRect.left,
      y: event.clientY - wrapperRect.top,
      flipX: event.clientX - wrapperRect.left > wrapperRect.width * 0.62,
      flipY: event.clientY - wrapperRect.top > wrapperRect.height * 0.62,
    })
  }

  const hoverRow = hoverPoint?.index != null ? data[hoverPoint.index] : null

  return (
    <div className="pulse-chart-scroll pulse-multiline-wrap pulse-soft-chart-wrap">
      <svg
        className="pulse-line-chart pulse-hourly-chart"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverPoint(null)}
        role="img"
        aria-label="Hourly pace chart"
      >
        {yTicks.map(tick => {
          const y = yForValue(tick)
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="pulse-chart-grid-line" />
              <text x={pad.left - 16} y={y + 4} textAnchor="end" className="pulse-chart-axis-text">{tick}</text>
            </g>
          )
        })}
        <line x1={pad.left} x2={width - pad.right} y1={yForValue(3)} y2={yForValue(3)} className="pulse-hour-goal-line" />

        {activeTeamIds.map(teamId => {
          const points = data.map((row, index) => `${xForIndex(index)},${yForValue(row[teamId])}`).join(' ')
          return <polyline key={teamId} points={points} fill="none" stroke={getTeamColor(teamId)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        })}

        {data.map((row, index) => (
          <text key={row.hour} x={xForIndex(index)} y={height - 16} textAnchor="middle" className="pulse-chart-axis-text">{row.hour}</text>
        ))}

        {hoverRow ? (
          <g>
            <line x1={xForIndex(hoverPoint.index)} x2={xForIndex(hoverPoint.index)} y1={pad.top} y2={pad.top + innerH} className="pulse-chart-hover-line" />
            {activeTeamIds.map(teamId => (
              <circle
                key={`hour-dot-${teamId}`}
                cx={xForIndex(hoverPoint.index)}
                cy={yForValue(hoverRow[teamId])}
                r="5"
                fill={getTeamColor(teamId)}
                stroke="#050607"
                strokeWidth="2"
              />
            ))}
          </g>
        ) : null}
      </svg>

      {hoverRow ? (
        <div
          className="pulse-chart-tooltip follow-cursor"
          style={{
            left: hoverPoint.x,
            top: hoverPoint.y,
            transform: `${hoverPoint.flipX ? 'translate(-104%, 14px)' : 'translate(18px, 14px)'} ${hoverPoint.flipY ? 'translateY(-112%)' : ''}`,
          }}
        >
          <strong>{hoverRow.hour}</strong>
          {activeTeamIds.map(teamId => (
            <span key={teamId} style={{ color: getTeamColor(teamId) }}>
              {getTeamLabel(teamId)}: {Number(hoverRow[teamId] || 0).toFixed(2)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AnalyticsAgentsPanel({ rows = [], navigate }) {
  const [query, setQuery] = useState('')
  const normalized = normalizeSearchText(query)
  const filteredRows = useMemo(() => {
    const source = rows || []
    if (!normalized) return source.slice(0, 35)
    return source.filter(agent => agentMatchesSearch(agent, normalized)).slice(0, 35)
  }, [normalized, rows])

  return (
    <div className="pulse-table-wrap analytics-table-card pulse-agents-panel">
      <div className="pulse-chart-card-head">
        <div>
          <div className="pulse-table-title">🏆 Agents</div>
          <div className="pulse-summary-subtitle">Search inside this analytics selection</div>
        </div>
        <div className="pulse-dark-search mini">
          <span>⌕</span>
          <input
            value={query}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="Search agent..."
            onChange={event => setQuery(event.target.value)}
          />
          {query ? <button type="button" onClick={() => setQuery('')}>×</button> : null}
        </div>
      </div>

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Team</th>
              <th>Ext</th>
              <th>English</th>
              <th>Spanish</th>
              <th>Total</th>
              <th>Goal Days</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((agent, index) => (
              <tr key={`agent-panel-${agent.teamId}-${agent.ext}-${index}`}>
                <td>{index + 1}</td>
                <td className="linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                <td>#{agent.ext}</td>
                <td className="blue">{Number(agent.english || 0).toLocaleString()}</td>
                <td className="green">{Number(agent.spanish || 0).toLocaleString()}</td>
                <td className="orange">{Number(agent.total || 0).toLocaleString()}</td>
                <td className="yellow">{Number(agent.goalDays || 0).toLocaleString()}x</td>
              </tr>
            ))}
            {!filteredRows.length ? <tr><td colSpan="8">No agents found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}


export function AnalyticsAgentTable({ title, rows = [], metric = 'english', navigate }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-table-wrap analytics-table-card">
      <div className="pulse-table-title">{title}</div>
      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Team</th>
              <th>Ext</th>
              <th>English</th>
              <th>Spanish</th>
              <th>Total</th>
              {metric === 'goalDays' ? <th>Goal Days</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((agent, index) => (
              <tr key={`${title}-${agent.teamId}-${agent.ext}-${index}`}>
                <td><RankMarker index={index} /></td>
                <td className="linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                <td>#{agent.ext}</td>
                <td className="blue">{Number(agent.english || 0).toLocaleString()}</td>
                <td className="green">{Number(agent.spanish || 0).toLocaleString()}</td>
                <td className="orange">{Number(agent.total || 0).toLocaleString()}</td>
                {metric === 'goalDays' ? <td style={{ color, fontWeight: 900 }}>{Number(agent.goalDays || 0).toLocaleString()}</td> : null}
              </tr>
            ))}
            {!rows.length ? (
              <tr><td colSpan={metric === 'goalDays' ? 8 : 7}>No data for this selection yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}