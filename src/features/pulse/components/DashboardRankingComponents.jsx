import { useMemo } from 'react'

import {
  sortAgentsByMetric,
} from '../utils/dashboardHelpers'

import {
  formatDateLabel,
  getMetricColor,
  getMetricLabel,
} from '../utils/dashboardViewHelpers'

import {
  RankMarker,
  TeamInlineLabel,
} from './DashboardPrimitives'

function RankingTopBlock({
  title,
  metric,
  rows = [],
  navigate,
}) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">
        {title}
      </div>

      {rows.slice(0, 5).map((agent, index) => (
        <div
          key={`${title}-${agent.ext}-${index}`}
          className="pulse-top-block-item"
        >
          <RankMarker index={index} />

          <span
            className="pulse-top-block-name linkish"
            style={{ fontWeight: 400 }}
            onClick={() => {
              navigate(`/profile/${agent.ext}`)
            }}
          >
            {agent.name}
          </span>

          <span className="pulse-top-block-ext">
            #{agent.ext}
          </span>

          <span
            className="pulse-top-block-value"
            style={{ color }}
          >
            {Number(
              agent?.[metric] || 0
            ).toLocaleString()}
          </span>
        </div>
      ))}

      {!rows.length ? (
        <div className="pulse-summary-subtitle">
          No ranking data available yet.
        </div>
      ) : null}
    </div>
  )
}

function AgentRankingTable({
  title,
  subtitle,
  rows = [],
  metric = 'english',
  navigate,
}) {
  const highlightColor = getMetricColor(metric)

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">
        {title}
      </div>

      {subtitle ? (
        <div
          className="pulse-summary-subtitle"
          style={{ margin: '0 0 12px' }}
        >
          {subtitle}
        </div>
      ) : null}

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Team</th>
              <th>Ext</th>
              <th className="th-english">English</th>
              <th className="th-spanish">Spanish</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((agent, index) => (
              <tr key={`${title}-${agent.ext}-${index}`}>
                <td>
                  <RankMarker index={index} />
                </td>

                <td
                  className="linkish"
                  style={{ fontWeight: 400 }}
                  onClick={() => {
                    navigate(`/profile/${agent.ext}`)
                  }}
                >
                  {agent.name}
                </td>

                <td>
                  <TeamInlineLabel
                    teamId={agent.teamId}
                    teamFlag={agent.teamFlag}
                    teamLabel={agent.teamLabel}
                  />
                </td>

                <td>#{agent.ext}</td>

                <td
                  className="blue"
                  style={{
                    fontWeight:
                      metric === 'english' ? 950 : 700,
                    color:
                      metric === 'english'
                        ? highlightColor
                        : undefined,
                  }}
                >
                  {Number(
                    agent.english || 0
                  ).toLocaleString()}
                </td>

                <td
                  className="green"
                  style={{
                    fontWeight:
                      metric === 'spanish' ? 950 : 700,
                    color:
                      metric === 'spanish'
                        ? highlightColor
                        : undefined,
                  }}
                >
                  {Number(
                    agent.spanish || 0
                  ).toLocaleString()}
                </td>

                <td
                  className="orange"
                  style={{
                    fontWeight:
                      metric === 'total' ? 950 : 700,
                  }}
                >
                  {Number(
                    agent.total || 0
                  ).toLocaleString()}
                </td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan="7">
                  No ranking data available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EnglishPlacementTable({
  title,
  subtitle,
  rows = [],
  loading,
  error,
  navigate,
  mode = 'first',
}) {
  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">
        {title}
      </div>

      {subtitle ? (
        <div
          className="pulse-summary-subtitle"
          style={{ margin: '0 0 12px' }}
        >
          {subtitle}
        </div>
      ) : null}

      {loading ? (
        <div className="pulse-loading">
          Loading ranking history...
        </div>
      ) : null}

      {error ? (
        <div className="pulse-error">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="pulse-table-scroll">
          <table className="pulse-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Team</th>
                <th>Ext</th>
                <th>#1 Days</th>
                <th>Top 3 Days</th>
                <th>Best English</th>
                <th>Best Day</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((agent, index) => (
                <tr key={`${mode}-${agent.ext}-${index}`}>
                  <td>
                    <RankMarker index={index} />
                  </td>

                  <td
                    className="linkish"
                    onClick={() => {
                      navigate(`/profile/${agent.ext}`)
                    }}
                  >
                    {agent.name}
                  </td>

                  <td>
                    <TeamInlineLabel
                      teamId={agent.teamId}
                      teamFlag={agent.teamFlag}
                      teamLabel={agent.teamLabel}
                    />
                  </td>

                  <td>#{agent.ext}</td>

                  <td className="orange">
                    {Number(
                      agent.firstPlaces || 0
                    ).toLocaleString()}
                  </td>

                  <td className="green">
                    {Number(
                      agent.top3Days || 0
                    ).toLocaleString()}
                  </td>

                  <td className="blue">
                    {Number(
                      agent.bestEnglish || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {agent.bestDate
                      ? formatDateLabel(agent.bestDate)
                      : 'N/A'}
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan="8">
                    No English placement history available yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function GoalAchievementTable({
  title,
  rows = [],
  loading,
  error,
  navigate,
}) {
  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">
        {title}
      </div>

      <div
        className="pulse-summary-subtitle"
        style={{ margin: '0 0 12px' }}
      >
        Goal days: Monday-Friday uses English target
        (Asia 20, all other teams 10). Saturday uses
        10 Total transfers for everyone.
      </div>

      {loading ? (
        <div className="pulse-loading">
          Loading goal history...
        </div>
      ) : null}

      {error ? (
        <div className="pulse-error">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="pulse-table-scroll">
          <table className="pulse-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Team</th>
                <th>Ext</th>
                <th>Goal Days</th>
                <th>Total ENG</th>
                <th>Best ENG</th>
                <th>Best Day</th>
              </tr>
            </thead>

            <tbody>
              {rows.slice(0, 10).map((agent, index) => (
                <tr key={`goal-${agent.ext}-${index}`}>
                  <td>
                    <RankMarker index={index} />
                  </td>

                  <td
                    className="linkish"
                    style={{ fontWeight: 400 }}
                    onClick={() => {
                      navigate(`/profile/${agent.ext}`)
                    }}
                  >
                    {agent.name}
                  </td>

                  <td>
                    <TeamInlineLabel
                      teamId={agent.teamId}
                      teamFlag={agent.teamFlag}
                      teamLabel={agent.teamLabel}
                    />
                  </td>

                  <td>#{agent.ext}</td>

                  <td
                    className="orange"
                    style={{ fontWeight: 950 }}
                  >
                    {Number(
                      agent.goalDays || 0
                    ).toLocaleString()}
                  </td>

                  <td className="blue">
                    {Number(
                      agent.english || 0
                    ).toLocaleString()}
                  </td>

                  <td className="blue">
                    {Number(
                      agent.bestEnglish || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {agent.bestDate
                      ? formatDateLabel(agent.bestDate)
                      : 'N/A'}
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan="8">
                    No goal data available yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function TeamWinnerTable({
  title,
  rows = [],
  metric,
}) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">
        {title}
      </div>

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>#1 Days</th>
              <th>
                Best {getMetricLabel(metric)}
              </th>
              <th>Best Total</th>
              <th>Best Day</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((team, index) => (
              <tr
                key={`${title}-${team.teamId}-${index}`}
              >
                <td>
                  <RankMarker index={index} />
                </td>

                <td>
                  <TeamInlineLabel
                    teamId={team.teamId}
                    teamFlag={team.teamFlag}
                    teamLabel={team.teamLabel}
                  />
                </td>

                <td className="orange">
                  {Number(
                    team.wins || 0
                  ).toLocaleString()}
                </td>

                <td
                  style={{
                    color,
                    fontWeight: 950,
                  }}
                >
                  {Number(
                    team.bestValue || 0
                  ).toLocaleString()}
                </td>

                <td className="orange">
                  {Number(
                    team.bestTotal || 0
                  ).toLocaleString()}
                </td>

                <td>
                  {team.bestDate
                    ? formatDateLabel(team.bestDate)
                    : 'N/A'}
                </td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan="6">
                  No team ranking history available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function RankingsPage({
  history,
  historyLoading,
  historyError,
  navigate,
}) {
 const rankingAgents = useMemo(() => {
  return history?.allTimeAgents || []
}, [history?.allTimeAgents])

  const topEnglish = useMemo(() => {
    return sortAgentsByMetric(
      rankingAgents,
      'english'
    ).slice(0, 10)
  }, [rankingAgents])

  const topSpanish = useMemo(() => {
    return sortAgentsByMetric(
      rankingAgents,
      'spanish'
    ).slice(0, 10)
  }, [rankingAgents])

  const goalAgents =
    history?.topGoalAchievementAgents || []

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">
            All Time
          </div>

          <div className="pulse-hero-title-row">
            <span
              style={{
                fontSize: 30,
                lineHeight: 1,
              }}
            >
              🏆
            </span>

            <div className="pulse-hero-title">
              Rankings
            </div>
          </div>

          <div className="pulse-hero-sub">
            Goal days are sorted by the highest number
            of days on target. Asia uses 20 ENG
            Monday-Friday; all other teams use 10 ENG
            Monday-Friday; Saturday uses 10 Total for
            everyone.
          </div>
        </div>
      </div>

      <div className="pulse-top-blocks-grid">
        <RankingTopBlock
          title="Top English"
          metric="english"
          rows={topEnglish}
          navigate={navigate}
        />

        <RankingTopBlock
          title="Top Spanish"
          metric="spanish"
          rows={topSpanish}
          navigate={navigate}
        />

        <RankingTopBlock
          title="Most Goal Days"
          metric="goalDays"
          rows={goalAgents}
          navigate={navigate}
        />
      </div>

      {historyLoading ? (
        <div className="pulse-loading">
          Loading rankings...
        </div>
      ) : null}

      {historyError ? (
        <div className="pulse-error">
          {historyError}
        </div>
      ) : null}

      {!historyLoading && !historyError ? (
        <>
          <AgentRankingTable
            title="🔵 Top 10 English Xfers"
            subtitle=""
            rows={topEnglish}
            metric="english"
            navigate={navigate}
          />

          <AgentRankingTable
            title="🟢 Top 10 Spanish Xfers"
            subtitle=""
            rows={topSpanish}
            metric="spanish"
            navigate={navigate}
          />

          <GoalAchievementTable
            title="🎯 Top 10 Most Goal Days"
            rows={goalAgents}
            loading={false}
            error=""
            navigate={navigate}
          />
        </>
      ) : null}
    </>
  )
}