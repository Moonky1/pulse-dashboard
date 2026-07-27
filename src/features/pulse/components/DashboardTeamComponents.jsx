import { useMemo, useState } from 'react'

import {
  SORT_OPTIONS,
  TEAM_RANK_EMOJIS,
} from '../config/dashboardConfig'

import {
  sortAgentsByMetric,
} from '../utils/dashboardHelpers'

import {
  agentReachedGoal,
  formatDateLabel,
  getGoalRuleLabel,
  normalizeSearchText,
} from '../utils/dashboardViewHelpers'

import {
  agentMatchesSearch,
} from '../utils/dashboardSearchHelpers'

import {
  FlagImg,
  Medal,
  SummaryCard,
} from './DashboardPrimitives'

export function TeamOverviewCard({
  team,
  parsed,
  sortMetric,
  onOpen,
  rankIndex = 0,
}) {
  const topThree = sortAgentsByMetric(
    parsed.agents,
    sortMetric
  ).slice(0, 3)

  const teamRankIcon = TEAM_RANK_EMOJIS[rankIndex] || null

  return (
    <div
      className="pulse-team-card"
      onClick={() => onOpen(team.id)}
    >
      <div className="pulse-team-card-top">
        <div className="pulse-team-rank-badge">
          {teamRankIcon ? (
            <img
              src={teamRankIcon}
              alt={`#${rankIndex + 1}`}
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span className="pulse-team-rank-text">
              #{rankIndex + 1}
            </span>
          )}
        </div>

        <div className="pulse-team-title-wrap">
          <FlagImg src={team.flag} size={24} alt="" />

          <div>
            <div className="pulse-team-name">
              {team.label}
            </div>

            <div className="pulse-team-sub">
              {parsed.totals.activeAgents} active agents
              {' • '}
              {parsed.isFinal ? 'Official' : 'Live'}
            </div>
          </div>
        </div>

        <div className="pulse-team-metric">
          <div className="pulse-team-metric-label">
            {SORT_OPTIONS.find(
              option => option.id === sortMetric
            )?.label}
          </div>

          <div className="pulse-team-metric-value">
            {Number(
              parsed.totals[sortMetric] || 0
            ).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="pulse-team-stats-grid">
        <div>
          <span className="stat-k blue">English</span>
          <span className="stat-v blue">
            {parsed.totals.english.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="stat-k green">Spanish</span>
          <span className="stat-v green">
            {parsed.totals.spanish.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="stat-k red">Invalid</span>
          <span className="stat-v red">
            {Number(
              parsed.invalidTransfers || 0
            ).toLocaleString()}
          </span>
        </div>

        <div>
          <span className="stat-k orange">Total</span>
          <span className="stat-v orange">
            {parsed.totals.total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="pulse-top3-list">
        {topThree.map((agent, index) => (
          <div
            key={`${team.id}-${agent.ext}`}
            className="pulse-top3-item"
          >
            <Medal index={index} size={17} />

            <span className="pulse-top3-name">
              {agent.name}
            </span>

            <span className="pulse-top3-val">
              {agent[sortMetric]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TeamComingSoonCard({ team }) {
  return (
    <div className="pulse-team-card pulse-coming-soon">
      <div className="pulse-team-title-wrap">
        <FlagImg src={team?.flag} size={24} alt="" />

        <div>
          <div className="pulse-team-name">
            {team?.label || 'Team'}
          </div>

          <div className="pulse-team-sub">
            No data loaded yet for this team.
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentTable({
  team,
  agents,
  navigate,
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalizeSearchText(query)

  const displayAgents = useMemo(() => {
    const sorted = sortAgentsByMetric(
      agents || [],
      'english'
    )

    if (!normalizedQuery) return sorted

    return sorted.filter(agent => {
      return agentMatchesSearch(
        agent,
        normalizedQuery
      )
    })
  }, [agents, normalizedQuery])

  return (
    <div className="pulse-table-wrap pulse-agent-table-card">
      <div className="pulse-table-head-row">
        <div className="pulse-table-title">
          {team.label} agents
        </div>

        <div className="pulse-dark-search mini pulse-agent-local-search">
          <span>⌕</span>

          <input
            value={query}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="Search agent..."
            onChange={event => {
              setQuery(event.target.value)
            }}
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Ext</th>
              <th className="th-spanish">Spanish</th>
              <th className="th-english">English</th>
              <th className="th-invalid">Invalid xfers</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {displayAgents.map((agent, index) => (
              <tr key={agent.ext}>
                <td>{index + 1}</td>

                <td
                  className="linkish"
                  onClick={() => {
                    navigate(`/profile/${agent.ext}`)
                  }}
                >
                  {agent.name}
                </td>

                <td>#{agent.ext}</td>
                <td className="green">{agent.spanish}</td>
                <td className="blue">{agent.english}</td>

                <td className="red">
                  {agent.invalidTransfers || 0}
                </td>

                <td className="orange">
                  {agent.total}
                </td>
              </tr>
            ))}

            {!displayAgents.length ? (
              <tr>
                <td colSpan="7">No agents found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TopRow({
  title,
  metric,
  agents,
}) {
  const top = sortAgentsByMetric(
    agents,
    metric
  ).slice(0, 3)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">
        {title}
      </div>

      {top.map((agent, index) => (
        <div
          key={`${metric}-${agent.ext}`}
          className="pulse-top-block-item"
        >
          <Medal index={index} size={19} />

          <span className="pulse-top-block-name">
            {agent.name}
          </span>

          <span className="pulse-top-block-ext">
            #{agent.ext}
          </span>

          <span className="pulse-top-block-value">
            {agent[metric]}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TeamDetail({
  team,
  parsed,
  selectedDate,
  navigate,
}) {
  const reachedTarget = (parsed.agents || []).filter(agent => {
    return agentReachedGoal({
      ...agent,
      teamId: team.id,
      date: selectedDate,
    })
  }).length

  const invalidTransfers = Number(
    parsed.invalidTransfers || 0
  )

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">
            {formatDateLabel(selectedDate)}
            {' • '}
            {parsed.isFinal
              ? 'Official snapshot'
              : 'Live snapshot'}
          </div>

          <div className="pulse-hero-title-row">
            <FlagImg
              src={team.flag}
              size={28}
              alt=""
            />

            <div className="pulse-hero-title">
              {team.label}
            </div>
          </div>

          <div className="pulse-hero-sub">
            {parsed.totals.activeAgents} active agents
            {' • '}
            {getGoalRuleLabel(
              team.id,
              selectedDate
            )}
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard
          title="English"
          value={parsed.totals.english}
          color="#60a5fa"
          titleColor="#60a5fa"
        />

        <SummaryCard
          title="Spanish"
          value={parsed.totals.spanish}
          color="#34d399"
          titleColor="#34d399"
        />

        <SummaryCard
          title="Invalid xfers"
          value={invalidTransfers}
          color="#f87171"
          titleColor="#f87171"
        />

        <SummaryCard
          title="Total"
          value={parsed.totals.total}
          color="#f59e0b"
          titleColor="#f59e0b"
          subtitle={`Raw: ${
            parsed.totals.rawTotal
            || parsed.totals.total
          }`}
        />

        <SummaryCard
          title="Reached target"
          value={reachedTarget}
          color="#22c55e"
          titleColor="#22c55e"
          subtitle={getGoalRuleLabel(
            team.id,
            selectedDate
          )}
        />

        <SummaryCard
          title="Active agents"
          value={parsed.totals.activeAgents}
          color="#c084fc"
          titleColor="#c084fc"
        />
      </div>

      <div className="pulse-top-blocks-grid">
        <TopRow
          title="Top English"
          metric="english"
          agents={parsed.agents}
        />

        <TopRow
          title="Top Spanish"
          metric="spanish"
          agents={parsed.agents}
        />

        <TopRow
          title="Top Total"
          metric="total"
          agents={parsed.agents}
        />
      </div>

      <AgentTable
        team={team}
        agents={parsed.agents}
        navigate={navigate}
      />
    </>
  )
}