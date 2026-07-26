import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import {
  FlagImg,
  LovableKpi,
  Medal,
  RankMarker,
  SummaryCard,
  TeamInlineLabel,
} from '../features/pulse/components/DashboardPrimitives'
import {
  LovableHeader,
  LovableSidebar,
  TeamRevealOverlay,
} from '../features/pulse/components/DashboardShell'
import {
  DateSelectorRow,
  SortTabs,
  TeamTabs,
} from '../features/pulse/components/DashboardControls'
import {
  AgentTable,
  TeamComingSoonCard,
  TeamDetail,
  TeamOverviewCard,
  TopRow,
} from '../features/pulse/components/DashboardTeamComponents'
import {
  RankingsPage,
} from '../features/pulse/components/DashboardRankingComponents'
import {
  AnalyticsAgentTable,
  AnalyticsAgentsPanel,
  HourlyPaceChart,
  LanguageMixChart,
  MultiTeamLineChart,
  RadarChart,
  SimpleBarChart,
  SimpleLineChart,
} from '../features/pulse/components/DashboardAnalyticsComponents'
import {
  AnalyticsPage,
} from '../features/pulse/components/DashboardAnalyticsPage'

import {
  CLEAN_START_DATE,
  OFFICIAL_DATA_START,
  POLL_MS,
  SORT_OPTIONS,
  SUPABASE_PAGE_SIZE,
  TEAM_COLORS,
  TEAM_ORDER,
  TEAM_RANK_EMOJIS,
  TEAM_TARGETS,
  TEAMS,
} from './dashboardConfig'
import {
  fetchSupabaseDashboardDate,
  fetchSupabaseDates,
} from './dashboardData'
import {
  getTeamColor,
  getTeamFlag,
  getTeamGoal,
  getTeamLabel,
  sortAgentsByLowestXfers,
  sortAgentsByMetric,
} from './dashboardHelpers'
import {
  agentReachedGoal,
  dateAddKey,
  formatDateLabel,
  getBusinessHoursForDate,
  getGoalRuleLabel,
  getMetricColor,
  getMetricLabel,
  getWeekEndKey,
  getWeekStartKey,
  normalizeDate,
  normalizeSearchText,
  playPulseSound,
  todayKey,
} from '../features/pulse/utils/dashboardViewHelpers'
import {
  fetchHistoryRows,
} from '../features/pulse/utils/historyInsights'
import {
  buildAnalyticsInsights,
} from '../features/pulse/utils/analyticsInsights'
import {
  agentMatchesSearch,
  buildSearchSuggestions,
  filterParsedBySearch,
  teamMatchesSearch,
} from '../features/pulse/utils/dashboardSearchHelpers'
import './dashboard.css'
import './dashboardStyles/teamReveal.css'

function flattenAgentsForRankings(teamData) {
  const agents = []

  TEAM_ORDER.forEach(teamId => {
    const parsed = teamData?.[teamId]
    ;(parsed?.agents || []).forEach(agent => {
      if (!agent?.ext) return
      if (Number(agent.english || 0) <= 0 && Number(agent.spanish || 0) <= 0 && Number(agent.total || 0) <= 0) return

      agents.push({
        ...agent,
        teamId,
        teamLabel: getTeamLabel(teamId),
        teamFlag: getTeamFlag(teamId),
      })
    })
  })

  return agents
}

function buildCurrentTeamRankings(teamData, metric = 'total') {
  return TEAM_ORDER
    .map(teamId => {
      const parsed = teamData?.[teamId]
      if (!parsed) return null

      return {
        teamId,
        teamLabel: getTeamLabel(teamId),
        teamFlag: getTeamFlag(teamId),
        english: Number(parsed?.totals?.english || 0),
        spanish: Number(parsed?.totals?.spanish || 0),
        invalidTransfers: Number(parsed?.invalidTransfers || 0),
        total: Number(parsed?.totals?.total || 0),
        activeAgents: Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0),
        value: Number(metric === 'invalid' ? parsed?.invalidTransfers || 0 : parsed?.totals?.[metric] || 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const metricDiff = Number(b?.value || 0) - Number(a?.value || 0)
      if (metricDiff !== 0) return metricDiff
      return Number(b?.total || 0) - Number(a?.total || 0)
    })
}

function TeamDirectoryCard({ teamId, onOpenTeam }) {
  const team = TEAMS[teamId]

  return (
    <button type="button" className="pulse-team-directory-card" onClick={() => onOpenTeam?.(teamId)}>
      <div className="pulse-team-directory-flag">
        <FlagImg src={team?.flag} size={34} alt="" />
      </div>
      <div className="pulse-team-directory-name">{team?.label || getTeamLabel(teamId)}</div>
    </button>
  )
}

function TeamsInsightsPage({ historyLoading, historyError, onOpenTeam }) {
  return (
    <section className="pulse-teams-directory-grid">
      {historyLoading ? <div className="pulse-loading">Loading teams...</div> : null}
      {historyError ? <div className="pulse-error">{historyError}</div> : null}

      {!historyLoading && !historyError ? (
        TEAM_ORDER.map(teamId => (
          <TeamDirectoryCard key={teamId} teamId={teamId} onOpenTeam={onOpenTeam} />
        ))
      ) : null}
    </section>
  )
}

function DashboardResponsivePolishStyle() {
  return (
    <style>{`
      .lov-content {
        width: 100%;
        max-width: 1540px;
        margin-left: auto;
        margin-right: auto;
        box-sizing: border-box;
      }

      .lov-kpi-grid-main {
        width: min(100%, 1280px);
        margin: 0 auto 18px !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(170px, 1fr)) !important;
        gap: 16px !important;
        align-items: stretch;
        justify-content: center;
      }

      .lov-kpi-grid-main .lov-kpi-card,
      .pulse-team-summary-grid .pulse-summary-card {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
      }

      .pulse-teams-list {
        width: min(100%, 1380px);
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .pulse-team-card {
        width: 100%;
        box-sizing: border-box;
        margin: 0 !important;
        padding: 18px 20px 20px !important;
        overflow: hidden;
      }

      .pulse-team-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 14px;
        padding-left: 8px;
      }

      .pulse-team-card-header img,
      .pulse-team-card-header span:first-child {
        flex: 0 0 auto;
      }

      .pulse-team-summary-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(170px, 1fr)) !important;
        gap: 14px !important;
        margin: 0 0 14px !important;
        width: 100%;
      }

      .pulse-team-week-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(210px, 1fr)) !important;
        gap: 14px !important;
        width: 100%;
        align-items: stretch;
      }

      .pulse-team-week-grid .pulse-top-block {
        min-width: 0;
        height: 100%;
        box-sizing: border-box;
        margin: 0 !important;
      }

      .pulse-top-block-item {
        min-width: 0;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
      }

      .pulse-top-block-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 400 !important;
      }

      .pulse-top-block-title,
      .pulse-summary-title,
      .lov-kpi-title,
      .pulse-table-title {
        font-weight: 800 !important;
      }

      .pulse-table td,
      .pulse-table .linkish,
      .pulse-top-block-name,
      .pulse-top3-name {
        font-weight: 400 !important;
      }

      .pulse-table th {
        font-weight: 800 !important;
      }

      .pulse-hero-sub:empty,
      .pulse-summary-subtitle:empty {
        display: none;
      }


      .pulse-analytics-page {
        width: min(100%, 1380px);
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .pulse-analytics-hero {
        margin: 0 !important;
      }

      .pulse-analytics-controls {
        display: grid;
        grid-template-columns: minmax(280px, 1fr) minmax(230px, 320px);
        gap: 14px;
        align-items: end;
        width: 100%;
      }

      .pulse-analytics-control-block {
        background: linear-gradient(135deg, rgba(255,255,255,.035), rgba(255,138,42,.075));
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 20px;
        padding: 12px;
        min-width: 0;
      }

      .pulse-control-label {
        display: block;
        margin: 0 0 8px;
        color: #8f8178;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      .pulse-range-pills,
      .pulse-mini-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .pulse-range-pills button,
      .pulse-mini-tabs button,
      .pulse-team-filter {
        border: 1px solid rgba(255,255,255,.09);
        background: rgba(255,255,255,.035);
        color: #d8cec8;
        border-radius: 999px;
        padding: 10px 13px;
        cursor: pointer;
        font-weight: 800;
      }

      .pulse-range-pills button.active,
      .pulse-mini-tabs button.active,
      .pulse-team-filter.active {
        background: #d7b987;
        border-color: rgba(215, 185, 135, .72);
        color: #15110b;
      }

      .pulse-analytics-date-control .lov-date-row {
        width: 100%;
        margin: 0 !important;
      }

      .pulse-analytics-date-control .lov-date-btn {
        width: 100%;
        min-width: 0 !important;
      }

      .pulse-team-filter-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .pulse-team-filter {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .pulse-analytics-kpis {
        margin-bottom: 0 !important;
      }

      .lov-kpi-card.purple .lov-kpi-value {
        color: #c084fc;
      }

      .pulse-analytics-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(340px, .85fr);
        gap: 18px;
        align-items: stretch;
      }

      .pulse-chart-card {
        min-width: 0;
        margin: 0 !important;
        overflow: hidden;
      }

      .pulse-chart-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 12px;
      }

      .pulse-chart-scroll {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
      }

      .pulse-line-chart {
        display: block;
        width: 100%;
        min-width: 620px;
        height: auto;
      }

      .pulse-chart-grid-line {
        stroke: rgba(255, 255, 255, .08);
        stroke-dasharray: 5 5;
      }

      .pulse-chart-axis-text {
        fill: #a99c94;
        font-size: 12px;
        font-weight: 700;
      }

      .pulse-chart-legend {
        display: flex;
        justify-content: center;
        gap: 18px;
        flex-wrap: wrap;
        margin-top: 10px;
        color: #d8cec8;
        font-weight: 800;
      }

      .pulse-chart-legend span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .pulse-chart-legend i {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        display: inline-block;
      }

      .pulse-bar-chart {
        display: grid;
        gap: 14px;
        padding: 8px 0 2px;
      }

      .pulse-bar-row {
        display: grid;
        grid-template-columns: minmax(120px, 160px) minmax(120px, 1fr) auto;
        gap: 12px;
        align-items: center;
      }

      .pulse-bar-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #f6eee8;
        font-weight: 800;
      }

      .pulse-bar-label span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pulse-bar-track {
        height: 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.06);
        overflow: hidden;
      }

      .pulse-bar-fill {
        height: 100%;
        border-radius: inherit;
        min-width: 8px;
        box-shadow: 0 0 24px rgba(255, 138, 42, .22);
      }

      .pulse-analytics-top-grid {
        grid-template-columns: repeat(4, minmax(210px, 1fr)) !important;
      }

      .analytics-table-card {
        margin: 0 !important;
      }

      .dash-root {
        --pulse-accent: #b9976b;
        --pulse-accent-soft: rgba(185, 151, 107, .14);
      }

      .lov-hero,
      .pulse-hero-card {
        background: radial-gradient(circle at 92% 12%, rgba(185,151,107,.12), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.035), rgba(12,11,10,.72)) !important;
      }

      .lov-nav-pill button.active,
      .pulse-range-pills button.active,
      .pulse-mini-tabs button.active,
      .pulse-team-filter.active,
      .lov-date-btn.active,
      .pulse-sort-tab.active,
      .pulse-tab.active {
        background: linear-gradient(135deg, #e4c896, #b9976b) !important;
        color: #14100b !important;
      }

      .lov-search-wrap {
        z-index: 80;
      }

      .lov-search input,
      .pulse-dark-search input {
        color: #f7eee7 !important;
        -webkit-text-fill-color: #f7eee7 !important;
        caret-color: #d7b987;
      }

      .lov-search input::placeholder,
      .pulse-dark-search input::placeholder {
        color: rgba(247, 238, 231, .45) !important;
        -webkit-text-fill-color: rgba(247, 238, 231, .45) !important;
      }

      .lov-search input:-webkit-autofill,
      .pulse-dark-search input:-webkit-autofill {
        box-shadow: 0 0 0 1000px #100b08 inset !important;
        -webkit-text-fill-color: #f7eee7 !important;
        transition: background-color 9999s ease-in-out 0s;
      }

      .lov-search-suggestions {
        background: linear-gradient(180deg, rgba(17, 11, 8, .98), rgba(7, 5, 4, .99)) !important;
        border: 1px solid rgba(185, 151, 107, .28) !important;
        border-radius: 18px !important;
        box-shadow: 0 24px 70px rgba(0,0,0,.72) !important;
        overflow: hidden;
      }

      .lov-search-suggestion {
        background: transparent !important;
        color: #f7eee7 !important;
      }

      .lov-search-suggestion:hover {
        background: rgba(185, 151, 107, .14) !important;
      }

      .pulse-analytics-hero-clean {
        min-height: 120px;
      }

      .pulse-analytics-controls-polished {
        grid-template-columns: minmax(320px, 1fr) minmax(260px, 360px);
      }

      .pulse-team-filter-wrap-analytics {
        background: rgba(255,255,255,.025);
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 22px;
        padding: 10px;
      }

      .pulse-analytics-grid-main,
      .pulse-analytics-grid-secondary {
        grid-template-columns: minmax(0, 1.55fr) minmax(340px, .85fr);
      }

      .pulse-all-teams-card {
        width: 100%;
      }

      .pulse-multiline-wrap {
        position: relative;
        min-height: 290px;
      }

      .pulse-chart-hover-line {
        stroke: rgba(255,255,255,.5);
        stroke-width: 1.5;
      }

      .pulse-chart-tooltip {
        position: absolute;
        right: 18px;
        top: 58px;
        min-width: 180px;
        display: grid;
        gap: 8px;
        padding: 14px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(9, 7, 6, .92);
        box-shadow: 0 18px 50px rgba(0,0,0,.5);
        color: #f7eee7;
        pointer-events: none;
        z-index: 5;
        font-size: 13px;
        font-weight: 800;
      }

      .pulse-radar-wrap {
        display: grid;
        place-items: center;
        gap: 12px;
        min-height: 330px;
      }

      .pulse-radar-chart {
        width: min(100%, 320px);
        height: auto;
      }

      .pulse-radar-ring {
        fill: transparent;
        stroke: rgba(255,255,255,.08);
        stroke-width: 1;
      }

      .pulse-radar-axis {
        stroke: rgba(255,255,255,.06);
        stroke-width: 1;
      }

      .pulse-radar-label {
        fill: #c9bdb5;
        font-size: 12px;
        font-weight: 800;
      }

      .pulse-chart-legend.compact {
        margin-top: 0;
      }

      .pulse-language-mix {
        display: grid;
        gap: 14px;
        padding-top: 8px;
      }

      .pulse-language-row {
        display: grid;
        grid-template-columns: minmax(130px, 180px) minmax(120px, 1fr) auto;
        gap: 12px;
        align-items: center;
      }

      .pulse-language-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #f7eee7;
        font-weight: 800;
      }

      .pulse-language-label span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pulse-language-track {
        height: 14px;
        overflow: hidden;
        display: flex;
        border-radius: 999px;
        background: rgba(255,255,255,.06);
      }

      .pulse-language-track span {
        min-width: 2px;
        height: 100%;
      }

      .pulse-language-track .eng { background: #38bdf8; }
      .pulse-language-track .spa { background: #34d399; }
      .pulse-language-track .bad { background: #fb7185; }

      .pulse-language-values {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        font-weight: 900;
        white-space: nowrap;
      }

      .pulse-hour-goal-line {
        stroke: rgba(251, 191, 36, .75);
        stroke-width: 2;
        stroke-dasharray: 7 7;
      }

      .pulse-dark-search {
        min-width: 250px;
        max-width: 360px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 999px;
        padding: 10px 12px;
      }

      .pulse-dark-search.mini {
        min-width: 220px;
      }

      .pulse-dark-search input {
        width: 100%;
        min-width: 0;
        background: transparent;
        border: 0;
        outline: 0;
        font-weight: 700;
      }

      .pulse-dark-search button {
        border: 0;
        background: rgba(255,255,255,.08);
        color: #f7eee7;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        cursor: pointer;
      }

      .pulse-agents-panel .pulse-chart-card-head {
        align-items: center;
      }

      .yellow {
        color: #fbbf24;
      }

      @media (max-width: 1250px) {
        .lov-kpi-grid-main,
        .pulse-team-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .pulse-team-week-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 720px) {
        .lov-content {
          padding-left: 14px !important;
          padding-right: 14px !important;
        }

        .lov-kpi-grid-main,
        .pulse-team-summary-grid,
        .pulse-team-week-grid {
          grid-template-columns: 1fr !important;
          width: 100%;
        }

        .pulse-team-card {
          padding: 16px 14px !important;
          border-radius: 22px;
        }

        .pulse-team-card-header {
          padding-left: 4px;
        }
      }

      /* Final chart polish overrides */
      .pulse-chart-card {
        padding: 22px !important;
        overflow: visible !important;
        border-radius: 24px !important;
      }

      .pulse-chart-card .pulse-table-title {
        padding: 0 !important;
        border-bottom: 0 !important;
        font-size: 18px !important;
        line-height: 1.15 !important;
      }

      .pulse-chart-card .pulse-summary-subtitle {
        display: none !important;
      }

      .pulse-chart-card-head {
        align-items: center !important;
        gap: 16px !important;
        margin-bottom: 18px !important;
        padding: 0 !important;
      }

      .pulse-chart-scroll {
        position: relative !important;
        width: 100%;
        padding: 4px 10px 2px !important;
        overflow-x: auto !important;
        overflow-y: visible !important;
      }

      .pulse-line-chart {
        min-width: 720px !important;
        overflow: visible !important;
      }

      .pulse-chart-tooltip {
        position: absolute !important;
        right: auto !important;
        top: auto !important;
        min-width: 170px !important;
        max-width: 260px;
        z-index: 35 !important;
        background: rgba(6, 7, 8, .94) !important;
        border-color: rgba(255,255,255,.10) !important;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .pulse-bar-row {
        grid-template-columns: minmax(150px, 210px) minmax(220px, 1fr) minmax(62px, auto) !important;
        gap: 18px !important;
      }

      .pulse-language-row {
        grid-template-columns: minmax(150px, 200px) minmax(140px, 1fr) minmax(155px, auto) !important;
        gap: 14px !important;
      }

      .pulse-language-values {
        justify-content: flex-end !important;
      }

      .pulse-radar-wrap {
        position: relative !important;
        min-height: 345px !important;
        overflow: visible !important;
      }

      .pulse-radar-chart {
        width: min(100%, 330px) !important;
        overflow: visible !important;
      }

      .team-reveal-card,
      .team-reveal-line,
      .team-reveal-orb,
      .team-reveal-flag-glow {
        display: none !important;
      }

      .team-reveal-overlay {
        animation: teamRevealOutSoft 1.22s cubic-bezier(.2,.8,.2,1) forwards !important;
      }

      .team-reveal-bg {
        background: rgba(3, 4, 5, .62) !important;
        backdrop-filter: blur(13px) saturate(115%);
        -webkit-backdrop-filter: blur(13px) saturate(115%);
      }

      .team-reveal-natural {
        position: relative;
        isolation: isolate;
        display: grid;
        justify-items: center;
        gap: 12px;
        padding: 24px 28px;
        animation: teamRevealNaturalIn .62s cubic-bezier(.17,.84,.44,1) both;
      }

      .team-reveal-warm-glow {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(520px, 82vw);
        height: min(280px, 42vh);
        border-radius: 999px;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle at 50% 50%, rgba(215,185,135,.30) 0%, transparent 60%);
        opacity: .8;
        filter: blur(34px);
        z-index: -1;
      }

      .team-reveal-flag-wrap {
        width: auto !important;
        height: auto !important;
        background: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }

      .team-reveal-flag-wrap img,
      .team-reveal-flag-wrap span {
        transform: scale(1.2) !important;
        filter: drop-shadow(0 18px 34px rgba(0,0,0,.45));
      }

      .team-reveal-kicker {
        margin-top: 8px !important;
        color: rgba(244, 228, 200, .82) !important;
        font-size: 13px !important;
        letter-spacing: .10em !important;
      }

      .team-reveal-name {
        margin-top: 0 !important;
        color: #fff8ee !important;
        font-size: clamp(44px, 8vw, 96px) !important;
        text-shadow: 0 22px 60px rgba(0,0,0,.62);
      }

      @keyframes teamRevealNaturalIn {
        0% { opacity: 0; transform: translateY(18px) scale(.92); filter: blur(8px); }
        68% { opacity: 1; transform: translateY(0) scale(1.04); filter: blur(0); }
        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }

      @keyframes teamRevealOutSoft {
        0%, 70% { opacity: 1; }
        100% { opacity: 0; visibility: hidden; }
      }

      @media (max-width: 980px) {
        .pulse-analytics-grid,
        .pulse-analytics-grid-main,
        .pulse-analytics-grid-secondary {
          grid-template-columns: 1fr !important;
        }

        .pulse-bar-row,
        .pulse-language-row {
          grid-template-columns: 1fr !important;
          gap: 8px !important;
        }

        .pulse-mini-tabs {
          width: 100%;
          overflow-x: auto;
          justify-content: flex-start;
        }

        .pulse-chart-card-head {
          align-items: flex-start !important;
          flex-direction: column;
        }
      }

    `}</style>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [sortMetric, setSortMetric] = useState('english')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamData, setTeamData] = useState({})
  const [remoteDates, setRemoteDates] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 760)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [rangeMode, setRangeMode] = useState('all_time')
  const [activeView, setActiveView] = useState('overview')
  const [teamReveal, setTeamReveal] = useState(null)
  const [historyState, setHistoryState] = useState({ insights: null, loading: false, error: '' })

  const isToday = selectedDate === todayKey()
  const selectedDateRef = useRef(selectedDate)
  const teamDataRef = useRef({})
  const goalSoundSeenRef = useRef(new Set())

  const setSelectedDateSafe = useCallback(date => {
    selectedDateRef.current = date
    setSelectedDate(date)
  }, [])

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

  useEffect(() => {
    teamDataRef.current = teamData
  }, [teamData])

  const loadRemoteDates = useCallback(async () => {
    const dates = await fetchSupabaseDates()
    setRemoteDates(dates)
  }, [])

  const loadDashboardDate = useCallback(async date => {
    setError('')
    const supabaseData = await fetchSupabaseDashboardDate(date)
    setTeamData(supabaseData)
    setLastUpdate(date === todayKey() ? new Date() : null)
  }, [])

  const loadToday = useCallback(async () => {
    await loadDashboardDate(todayKey())
    loadRemoteDates().catch(() => {})
  }, [loadDashboardDate, loadRemoteDates])

  const loadHistory = useCallback(async () => {
    setHistoryState(prev => ({ ...prev, loading: true, error: '' }))

    try {
      const insights = await fetchHistoryRows()
      setHistoryState({ insights, loading: false, error: '' })
    } catch (err) {
      console.error('Failed loading history:', err)
      setHistoryState({
        insights: null,
        loading: false,
        error: String(err?.message || err || 'Failed loading history'),
      })
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const requestedDate = selectedDate

    const run = async () => {
      selectedDateRef.current = requestedDate
      setLoading(true)
      setError('')
      teamDataRef.current = {}
      setTeamData({})

      try {
        await loadDashboardDate(requestedDate)
      } catch (err) {
        if (!cancelled) setError(String(err?.message || err || 'Failed to load dashboard data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [selectedDate, loadDashboardDate])

  useEffect(() => {
    loadRemoteDates().catch(() => {})
  }, [loadRemoteDates])

  useEffect(() => {
    if (activeView !== 'rankings' && activeView !== 'teams' && activeView !== 'analytics') return
    if (historyState.loading || historyState.insights) return
    loadHistory().catch(() => {})
  }, [activeView, historyState.insights, historyState.loading, loadHistory])

  useEffect(() => {
    if (!isToday) return

    let cancelled = false
    let timer = null

    const scheduleNext = () => {
      if (cancelled) return

      timer = window.setTimeout(async () => {
        try {
          await loadToday()
        } catch (err) {
          console.warn('Live refresh failed:', err)
        } finally {
          scheduleNext()
        }
      }, POLL_MS)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [isToday, loadToday])

  useEffect(() => {
    if (!isToday || !teamData || !Object.keys(teamData).length) return

    const reachedNow = new Set()

    TEAM_ORDER.forEach(teamId => {
      const parsed = teamData[teamId]
      ;(parsed?.agents || []).forEach(agent => {
        if (!agent?.ext) return
        const candidate = {
          ...agent,
          teamId,
          team: teamId,
          date: selectedDate,
          total: Number(agent.total || agent.rawTotal || 0),
          rawTotal: Number(agent.rawTotal || agent.total || 0),
        }

        if (agentReachedGoal(candidate)) reachedNow.add(`${selectedDate}|${teamId}|${agent.ext}`)
      })
    })

    const previous = goalSoundSeenRef.current
    const hasPrevious = previous.size > 0
    const hasNewGoal = hasPrevious && [...reachedNow].some(key => !previous.has(key))

    goalSoundSeenRef.current = reachedNow

    if (hasNewGoal) playPulseSound('goal')
  }, [isToday, selectedDate, teamData])

  const dateTabs = useMemo(() => {
    const set = new Set([todayKey(), ...remoteDates])
    return [...set].filter(date => date >= CLEAN_START_DATE).sort((a, b) => b.localeCompare(a))
  }, [remoteDates])

  const allTeamCards = useMemo(() => {
    const liveCards = TEAM_ORDER
      .filter(teamId => teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: teamData[teamId] }))
      .sort((a, b) => {
        const diff = (b.parsed?.totals?.[sortMetric] || 0) - (a.parsed?.totals?.[sortMetric] || 0)
        if (diff !== 0) return diff
        return (b.parsed?.totals?.total || 0) - (a.parsed?.totals?.total || 0)
      })

    const missingCards = TEAM_ORDER
      .filter(teamId => !teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: null }))

    return [...liveCards, ...missingCards]
  }, [sortMetric, teamData])

  const selectedParsed = selectedTeam !== 'all' ? teamData[selectedTeam] : null
  const selectedTeamMeta = selectedTeam !== 'all' ? TEAMS[selectedTeam] : null

  const dashboardTotals = useMemo(() => {
    if (activeView === 'teams') {
      const weeklyTeams = historyState.insights?.weeklyTeams || []

      return weeklyTeams.reduce((acc, teamInsight) => {
        const totals = teamInsight?.thisWeek?.totals || {}
        acc.english += Number(totals.english || 0)
        acc.spanish += Number(totals.spanish || 0)
        acc.invalid += Number(totals.invalidTransfers || 0)
        acc.total += Number(totals.total || 0)
        acc.activeAgents += Number(totals.activeAgents || 0)
        return acc
      }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
    }

    if ((activeView === 'rankings' || activeView === 'analytics') && rangeMode === 'all_time') {
      const allTimeAgents = historyState.insights?.allTimeAgents || []

      return allTimeAgents.reduce((acc, agent) => {
        acc.english += Number(agent?.english || 0)
        acc.spanish += Number(agent?.spanish || 0)
        acc.invalid += Number(agent?.invalidTransfers || 0)
        acc.total += Number(agent?.total || 0)
        acc.activeAgents += 1
        return acc
      }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
    }

    const source = selectedTeam === 'all'
      ? TEAM_ORDER.map(teamId => teamData[teamId]).filter(Boolean)
      : selectedParsed
        ? [selectedParsed]
        : []

    return source.reduce((acc, parsed) => {
      acc.english += Number(parsed?.totals?.english || 0)
      acc.spanish += Number(parsed?.totals?.spanish || 0)
      acc.invalid += Number(parsed?.invalidTransfers || 0)
      acc.total += Number(parsed?.totals?.total || 0)
      acc.activeAgents += Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0)
      return acc
    }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
  }, [activeView, historyState.insights, rangeMode, selectedParsed, selectedTeam, teamData])

  const normalizedSearch = useMemo(() => normalizeSearchText(searchQuery), [searchQuery])

  const visibleAllTeamCards = useMemo(() => {
    if (!normalizedSearch) return allTeamCards

    return allTeamCards
      .map(({ team, parsed }) => {
        const teamMatch = teamMatchesSearch(team, normalizedSearch)

        if (!parsed) return teamMatch ? { team, parsed } : null

        const filteredParsed = filterParsedBySearch(parsed, normalizedSearch)
        const hasAgentMatches = (filteredParsed?.agents || []).length > 0
        if (!teamMatch && !hasAgentMatches) return null

        return { team, parsed: teamMatch ? parsed : filteredParsed }
      })
      .filter(Boolean)
  }, [allTeamCards, normalizedSearch])

  const selectedParsedForView = useMemo(() => {
    return filterParsedBySearch(selectedParsed, normalizedSearch)
  }, [selectedParsed, normalizedSearch])

  const searchSuggestions = useMemo(() => {
    return buildSearchSuggestions(teamData, searchQuery)
  }, [teamData, searchQuery])

  const activeSidebarItem = activeView === 'rankings'
    ? 'rankings'
    : activeView === 'teams'
      ? 'teams'
      : activeView === 'analytics'
        ? 'analytics'
        : selectedTeam === 'all'
          ? 'overview'
          : 'teams'

  const handleSidebarNavigate = useCallback(item => {
    playPulseSound('click')

    if (item.id === 'overview') {
      setActiveView('overview')
      setSelectedTeam('all')
      setSelectedDateSafe(todayKey())
      setSortMetric('english')
      setRangeMode('day')
      setSearchQuery('')
      setUserMenuOpen(false)
      navigate('/dashboard')
      loadToday().catch(() => {})
      return
    }

    if (item.id === 'teams') {
      setActiveView('teams')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'rankings') {
      setActiveView('rankings')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'analytics') {
      setActiveView('analytics')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'pulse-go') {
      navigate('/go')
      return
    }

    if (item.id === 'settings') {
      navigate('/settings')
      return
    }

    window.alert(`${item.label} is coming soon.`)
  }, [loadToday, navigate, setSelectedDateSafe])

  const openTeamWithReveal = useCallback(teamId => {
    if (!teamId || teamId === 'all') {
      playPulseSound('click')
      setActiveView('overview')
      setRangeMode('day')
      setSelectedTeam('all')
      return
    }

    playPulseSound('team')
    setTeamReveal({ teamId, key: `${teamId}-${Date.now()}` })
    setActiveView('overview')
    setRangeMode('day')
    setSelectedTeam(teamId)
  }, [])

  const handleTeamTabChange = useCallback(teamId => {
    openTeamWithReveal(teamId)
  }, [openTeamWithReveal])

  const handleSuggestionClick = useCallback(item => {
    if (!item) return
    playPulseSound('click')

    if (item.type === 'agent') {
      setSearchQuery('')
      setUserMenuOpen(false)
      navigate(`/profile/${item.id}`)
      return
    }

    if (item.type === 'team') {
      setSearchQuery('')
      setUserMenuOpen(false)
      openTeamWithReveal(item.id)
    }
  }, [navigate, openTeamWithReveal])

  const handleSearchSubmit = useCallback(() => {
    const first = searchSuggestions[0]
    if (first) handleSuggestionClick(first)
  }, [searchSuggestions, handleSuggestionClick])

  const handleUserAction = useCallback(action => {
    setUserMenuOpen(false)

    if (action === 'profile') {
      navigate('/profile/3134')
      return
    }

    if (action === 'settings') {
      navigate('/settings')
      return
    }

    if (action === 'logout') {
      localStorage.removeItem('pulse_user')
      navigate('/signin')
    }
  }, [navigate])

  return (
    <div className={`dash-root ${sidebarCollapsed ? 'lov-sidebar-collapsed' : ''}`}>
      {teamReveal ? (
        <TeamRevealOverlay
          reveal={teamReveal}
          onDone={() => setTeamReveal(null)}
        />
      ) : null}

      <div className="lov-shell">
        <LovableSidebar
          collapsed={sidebarCollapsed}
          activeItem={activeSidebarItem}
          onNavigate={handleSidebarNavigate}
        />

        {!sidebarCollapsed ? (
          <button
            type="button"
            className="lov-mobile-sidebar-backdrop"
            aria-label="Close sidebar"
            onClick={() => setSidebarCollapsed(true)}
          />
        ) : null}

        <div className="lov-main">
          <LovableHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => {
              playPulseSound('click')
              setSidebarCollapsed(prev => !prev)
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            suggestions={searchSuggestions}
            onSuggestionClick={handleSuggestionClick}
            userMenuOpen={userMenuOpen}
            onToggleUserMenu={() => setUserMenuOpen(prev => !prev)}
            onUserAction={handleUserAction}
            onPulseGo={() => {
              playPulseSound('click')
              navigate('/go')
            }}
            onAcademy={() => {
  playPulseSound('click')
  navigate('/academy')
}}
          />

          <main className="lov-content">
            <DashboardResponsivePolishStyle />
            {activeView !== 'rankings' && activeView !== 'analytics' ? (
              <section className="lov-hero" style={{ padding: '22px 28px' }}>
                <div className="lov-hero-left">
                  {activeView === 'teams' ? null : (
                    <div className="lov-hero-badge">
                      {selectedDate === todayKey()
                        ? '● Today — live data'
                        : `Saved snapshot · ${formatDateLabel(selectedDate)}`}
                    </div>
                  )}

                  <h1 className="lov-hero-title" style={{ fontSize: 34, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {activeView === 'teams' ? <span style={{ fontSize: 30, lineHeight: 1 }}>👥</span> : null}
                    {activeView === 'teams' ? 'Teams' : 'Overview'}
                  </h1>
                </div>
              </section>
            ) : null}

            {activeView !== 'rankings' && activeView !== 'analytics' && activeView !== 'teams' ? (
              <section className="lov-kpi-grid lov-kpi-grid-main">
                <LovableKpi title="English" value={dashboardTotals.english} tone="blue" />
                <LovableKpi title="Spanish" value={dashboardTotals.spanish} tone="green" />
                <LovableKpi title="Invalid" value={dashboardTotals.invalid} tone="red" />
                <LovableKpi title="Total Xfers" value={dashboardTotals.total} tone="orange" />
              </section>
            ) : null}

            {activeView === 'overview' ? (
              <>
                <section className="lov-control-row">
                  <TeamTabs selectedTeam={selectedTeam} onChange={handleTeamTabChange} />
                  <SortTabs sortMetric={sortMetric} onChange={setSortMetric} />
                </section>

                <DateSelectorRow
                  dates={dateTabs}
                  selectedDate={selectedDate}
                  onChange={setSelectedDateSafe}
                />
              </>
            ) : null}

            {loading ? (
              <div className="pulse-loading">Loading team data...</div>
            ) : error ? (
              <div className="pulse-error">{error}</div>
            ) : activeView === 'analytics' ? (
              <AnalyticsPage
                history={historyState.insights}
                historyLoading={historyState.loading}
                historyError={historyState.error}
                dateTabs={dateTabs}
                navigate={navigate}
              />
            ) : activeView === 'teams' ? (
              <TeamsInsightsPage
                historyLoading={historyState.loading}
                historyError={historyState.error}
                onOpenTeam={openTeamWithReveal}
              />
            ) : activeView === 'rankings' ? (
              <RankingsPage
                teamData={teamData}
                selectedDate={selectedDate}
                rangeMode={rangeMode}
                history={historyState.insights}
                historyLoading={historyState.loading}
                historyError={historyState.error}
                navigate={navigate}
              />
            ) : selectedTeam === 'all' ? (
              <div className="pulse-overview-grid">
                {visibleAllTeamCards.map(({ team, parsed }, index) => (
                  parsed
                    ? (
                      <TeamOverviewCard
                        key={team.id}
                        team={team}
                        parsed={parsed}
                        sortMetric={sortMetric}
                        onOpen={teamId => openTeamWithReveal(teamId)}
                        rankIndex={index}
                      />
                    )
                    : <TeamComingSoonCard key={team.id} team={team} />
                ))}
              </div>
            ) : selectedParsed && selectedTeamMeta ? (
              <TeamDetail
                team={selectedTeamMeta}
                parsed={selectedParsedForView}
                selectedDate={selectedDate}
                navigate={navigate}
              />
            ) : (
              <TeamComingSoonCard team={TEAMS[selectedTeam]} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
} 
