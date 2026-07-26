import { useEffect, useMemo, useState } from 'react'

import {
  SORT_OPTIONS,
  TEAM_ORDER,
} from '../config/dashboardConfig'

import {
  getTeamColor,
  getTeamFlag,
  getTeamLabel,
} from '../utils/dashboardHelpers'

import {
  getMetricColor,
  getMetricLabel,
  playPulseSound,
  todayKey,
} from '../utils/dashboardViewHelpers'

import {
  buildAnalyticsInsights,
} from '../utils/analyticsInsights'

import {
  DateSelectorRow,
} from './DashboardControls'

import {
  FlagImg,
  LovableKpi,
  RankMarker,
  SummaryCard,
} from './DashboardPrimitives'

import {
  HourlyPaceChart,
  MultiTeamLineChart,
  RadarChart,
  SimpleBarChart,
  SimpleLineChart,
} from './DashboardAnalyticsComponents'

export function AnalyticsPage({ history, historyLoading, historyError, dateTabs = [], navigate }) {
  const [analyticsDate, setAnalyticsDate] = useState(todayKey())
  const [analyticsRange, setAnalyticsRange] = useState('week')
  const [analyticsTeams, setAnalyticsTeams] = useState(['all'])
  const [comparisonMetric, setComparisonMetric] = useState('total')

  const availableDates = useMemo(() => {
    const source = history?.dates?.length ? history.dates : dateTabs
    return [...new Set([todayKey(), ...(source || [])])]
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))
  }, [dateTabs, history?.dates])

  const latestSavedDate = useMemo(() => {
    const dates = (history?.dates || []).filter(Boolean).sort((a, b) => b.localeCompare(a))
    return dates[0] || todayKey()
  }, [history?.dates])

  useEffect(() => {
    if (historyLoading || !latestSavedDate) return
    const hasTodayData = (history?.dates || []).includes(todayKey())
    if (!hasTodayData) {
      setAnalyticsDate(prev => ((history?.dates || []).includes(prev) ? prev : latestSavedDate))
    }
  }, [historyLoading, latestSavedDate, history?.dates])

  const analytics = useMemo(() => {
    return buildAnalyticsInsights(history, analyticsTeams, analyticsRange, analyticsDate)
  }, [analyticsDate, analyticsRange, analyticsTeams, history])

  const toggleTeam = teamId => {
    playPulseSound('click')

    if (teamId === 'all') {
      setAnalyticsTeams(['all'])
      return
    }

    setAnalyticsTeams(prev => {
      const base = prev.includes('all') ? [] : [...prev]
      const exists = base.includes(teamId)
      const next = exists ? base.filter(item => item !== teamId) : [...base, teamId]
      return next.length ? next : ['all']
    })
  }

  const setRangeWithSound = range => {
    playPulseSound('click')
    setAnalyticsRange(range)
  }

  const setDateWithSound = date => {
    playPulseSound('click')
    setAnalyticsDate(date)
  }

  const isAllSelected = analyticsTeams.includes('all')
  const selectedTeamIds = analytics.selectedTeamIds?.length ? analytics.selectedTeamIds : TEAM_ORDER
  const selectedTeamsLabel = isAllSelected ? 'All teams' : selectedTeamIds.map(getTeamLabel).join(' + ')
  const weeklyTeamsForAnalytics = (history?.weeklyTeams || []).filter(team => selectedTeamIds.includes(team.teamId))

  return (
    <section className="pulse-analytics-page">
      <div className="pulse-hero-card pulse-analytics-hero pulse-analytics-hero-clean">
        <div>
          <div className="pulse-hero-title-row">
            <span style={{ fontSize: 30, lineHeight: 1 }}>📊</span>
            <div className="pulse-hero-title">Analytics</div>
          </div>
          <div className="pulse-hero-sub">{selectedTeamsLabel} · {analytics.range.label}</div>
        </div>
      </div>

      {historyLoading ? <div className="pulse-loading">Loading analytics...</div> : null}
      {historyError ? <div className="pulse-error">{historyError}</div> : null}

      {!historyLoading && !historyError ? (
        <>
          <div className="pulse-analytics-controls pulse-analytics-controls-polished">
            <div className="pulse-analytics-control-block">
              <span className="pulse-control-label">Range</span>
              <div className="pulse-range-pills">
                {[
                  ['day', 'Day'],
                  ['week', 'Week'],
                  ['month', 'Month'],
                  ['all_time', 'All Time'],
                ].map(([id, label]) => (
                  <button key={id} type="button" className={analyticsRange === id ? 'active' : ''} onClick={() => setRangeWithSound(id)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="pulse-analytics-control-block pulse-analytics-date-control">
              <span className="pulse-control-label">Day</span>
              <DateSelectorRow dates={availableDates} selectedDate={analyticsDate} onChange={setDateWithSound} />
            </div>
          </div>

          <div className="pulse-team-filter-wrap pulse-team-filter-wrap-analytics">
            <button type="button" className={`pulse-team-filter ${isAllSelected ? 'active' : ''}`} onClick={() => toggleTeam('all')}>All Teams</button>
            {TEAM_ORDER.map(teamId => (
              <button
                key={teamId}
                type="button"
                className={`pulse-team-filter ${!isAllSelected && analyticsTeams.includes(teamId) ? 'active' : ''}`}
                onClick={() => toggleTeam(teamId)}
              >
                <FlagImg src={getTeamFlag(teamId)} size={17} alt="" />
                {getTeamLabel(teamId)}
              </button>
            ))}
          </div>

          <section className="lov-kpi-grid lov-kpi-grid-main pulse-analytics-kpis">
            <LovableKpi title="English" value={analytics.summary.english} tone="blue" />
            <LovableKpi title="Spanish" value={analytics.summary.spanish} tone="green" />
            <LovableKpi title="Total Xfers" value={analytics.summary.total} tone="orange" />
            <LovableKpi title="Active Agents" value={analytics.summary.activeAgents} tone="purple" />
          </section>

          <div className="pulse-analytics-grid pulse-analytics-grid-main">
            <div className="pulse-table-wrap pulse-chart-card pulse-chart-card-wide">
              <div className="pulse-chart-card-head">
                <div>
                  <div className="pulse-table-title">Performance · {analyticsRange === 'day' ? 'day' : analyticsRange.replace('_', ' ')}</div>
                </div>
              </div>
              <SimpleLineChart
                data={analytics.trend}
                series={[
                  { key: 'total', label: 'Total', color: '#d7b987' },
                  { key: 'english', label: 'English', color: '#38bdf8' },
                  { key: 'spanish', label: 'Spanish', color: '#34d399' },
                ]}
              />
              <div className="pulse-chart-legend">
                <span><i style={{ background: '#d7b987' }} />Total</span>
                <span><i style={{ background: '#38bdf8' }} />English</span>
                <span><i style={{ background: '#34d399' }} />Spanish</span>
              </div>
            </div>

            <div className="pulse-table-wrap pulse-chart-card">
              <div className="pulse-chart-card-head">
                <div>
                  <div className="pulse-table-title">Team profile</div>
                </div>
              </div>
              <RadarChart axes={analytics.radarAxes} data={analytics.radarData} />
            </div>
          </div>

          <div className="pulse-table-wrap pulse-chart-card pulse-all-teams-card">
            <div className="pulse-chart-card-head">
              <div>
                <div className="pulse-table-title">All teams · compared</div>
              </div>
              <div className="pulse-mini-tabs">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={comparisonMetric === option.id ? 'active' : ''}
                    onClick={() => {
                      playPulseSound('click')
                      setComparisonMetric(option.id)
                    }}
                  >
                    {getMetricLabel(option.id)}
                  </button>
                ))}
              </div>
            </div>
            <MultiTeamLineChart data={analytics.allTeamsTrend} teamIds={selectedTeamIds} metric={comparisonMetric} />
            <div className="pulse-chart-legend">
              {selectedTeamIds.map(teamId => (
                <span key={teamId}><i style={{ background: getTeamColor(teamId) }} />{getTeamLabel(teamId)}</span>
              ))}
            </div>
          </div>

          <div className="pulse-analytics-grid pulse-analytics-grid-secondary pulse-analytics-grid-single">
            <div className="pulse-table-wrap pulse-chart-card pulse-chart-card-wide">
              <div className="pulse-chart-card-head">
                <div>
                  <div className="pulse-table-title">Hourly · all teams compared</div>
                </div>
              </div>
              <HourlyPaceChart data={analytics.hourlyCompared} teamIds={selectedTeamIds} />
              <div className="pulse-chart-legend">
                {selectedTeamIds.map(teamId => (
                  <span key={teamId}><i style={{ background: getTeamColor(teamId) }} />{getTeamLabel(teamId)}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pulse-table-wrap pulse-chart-card">
            <div className="pulse-chart-card-head">
              <div>
                <div className="pulse-table-title">Team comparison</div>
              </div>
              <div className="pulse-mini-tabs">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={comparisonMetric === option.id ? 'active' : ''}
                    onClick={() => {
                      playPulseSound('click')
                      setComparisonMetric(option.id)
                    }}
                  >
                    {getMetricLabel(option.id)}
                  </button>
                ))}
              </div>
            </div>
            <SimpleBarChart data={analytics.teamComparison} metric={comparisonMetric} />
          </div>

          <section className="pulse-analytics-weekly-section">
            <div className="pulse-section-title-row">
              <span>👥</span>
              <h2>Weekly Team Breakdown</h2>
            </div>
            <div className="pulse-analytics-weekly-list">
              {weeklyTeamsForAnalytics.map(teamInsight => (
                <TeamWeeklyCard key={`analytics-week-${teamInsight.teamId}`} teamInsight={teamInsight} navigate={navigate} compact />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}
function MiniAgentList({ title, rows = [], metric = 'english', navigate }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">{title}</div>

      {rows.slice(0, 5).map((agent, index) => (
        <div key={`${title}-${agent.ext}-${index}`} className="pulse-top-block-item">
          <RankMarker index={index} />
          <span className="pulse-top-block-name linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value" style={{ color }}>
            {metric === 'goalDays'
              ? `${Number(agent.goalDays || 0)}x`
              : metric === 'lowestXfers'
                ? Number(agent.lowestXfers ?? agent.weekXfers ?? agent.total ?? 0).toLocaleString()
                : Number(agent?.[metric] || 0).toLocaleString()}
          </span>
        </div>
      ))}

      {!rows.length ? <div className="pulse-summary-subtitle">No data for this week yet.</div> : null}
    </div>
  )
}

function TeamWeeklyCard({ teamInsight, navigate }) {
  const week = teamInsight.thisWeek
  const previous = teamInsight.lastWeek
  const englishDiff = Number(week?.totals?.english || 0) - Number(previous?.totals?.english || 0)
  const totalDiff = Number(week?.totals?.total || 0) - Number(previous?.totals?.total || 0)

  return (
    <div className="pulse-table-wrap pulse-team-card">
      <div className="pulse-team-card-header">
        <FlagImg src={teamInsight.teamFlag} size={24} alt="" />
        <div className="pulse-team-name">{teamInsight.teamLabel}</div>
      </div>

      <div className="pulse-summary-grid pulse-team-summary-grid">
        <SummaryCard title="Week English" value={week.totals.english} color="#38bdf8" titleColor="#38bdf8" subtitle={`${englishDiff >= 0 ? '+' : ''}${englishDiff.toLocaleString()} vs last week`} />
        <SummaryCard title="Week Spanish" value={week.totals.spanish} color="#34d399" titleColor="#34d399" subtitle={`${week.totals.daysTracked || 0} days tracked`} />
        <SummaryCard title="Week Total" value={week.totals.total} color="#ff8a2a" titleColor="#ff8a2a" subtitle={`${totalDiff >= 0 ? '+' : ''}${totalDiff.toLocaleString()} vs last week`} />
        <SummaryCard title="Active Agents" value={week.totals.activeAgents} color="#c084fc" titleColor="#c084fc" subtitle="Max active count this week" />
      </div>

      <div className="pulse-team-week-grid">
        <MiniAgentList title="Top English" rows={week.topEnglish} metric="english" navigate={navigate} />
        <MiniAgentList title="Top Total" rows={week.topTotal} metric="total" navigate={navigate} />
        <MiniAgentList title="Goal Days" rows={week.goalLeaders} metric="goalDays" navigate={navigate} />
        <MiniAgentList title="Lowest Xfers" rows={week.lowestActive} metric="lowestXfers" navigate={navigate} />
      </div>
    </div>
  )
}
