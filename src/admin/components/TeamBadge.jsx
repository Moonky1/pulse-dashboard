import { Link } from 'react-router-dom'

import { teamBadgeStyle, teamTone } from '../visualIdentity.js'

export function TeamBadge({ teamId, name, code, campaignCode, linked = true, className = '' }) {
  if (!name) return null
  const tone = teamTone({ code, campaignCode })
  const style = teamBadgeStyle({ code, campaignCode })
  const classes = `admin-team-badge admin-team-badge--${tone} ${className}`.trim()
  if (linked && teamId) return <Link className={classes} style={style} to={`/admin/teams/${teamId}`}>{name}</Link>
  return <span className={classes} style={style}>{name}</span>
}
