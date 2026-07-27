import {
  TEAM_ORDER,
  TEAMS,
} from '../config/dashboardConfig'

import {
  getTeamLabel,
} from '../utils/dashboardHelpers'

import {
  FlagImg,
} from './DashboardPrimitives'

function TeamDirectoryCard({
  teamId,
  onOpenTeam,
}) {
  const team = TEAMS[teamId]

  return (
    <button
      type="button"
      className="pulse-team-directory-card"
      onClick={() => onOpenTeam?.(teamId)}
    >
      <div className="pulse-team-directory-flag">
        <FlagImg
          src={team?.flag}
          size={34}
          alt=""
        />
      </div>

      <div className="pulse-team-directory-name">
        {team?.label || getTeamLabel(teamId)}
      </div>
    </button>
  )
}

export function TeamsInsightsPage({
  historyLoading,
  historyError,
  onOpenTeam,
}) {
  return (
    <section className="pulse-teams-directory-grid">
      {historyLoading ? (
        <div className="pulse-loading">
          Loading teams...
        </div>
      ) : null}

      {historyError ? (
        <div className="pulse-error">
          {historyError}
        </div>
      ) : null}

      {!historyLoading && !historyError
        ? TEAM_ORDER.map(teamId => (
            <TeamDirectoryCard
              key={teamId}
              teamId={teamId}
              onOpenTeam={onOpenTeam}
            />
          ))
        : null}
    </section>
  )
}