import { Link } from 'react-router-dom'

import { teamTone } from '../visualIdentity.js'

export function TeamBadge({ teamId, name, code, campaignCode, linked = true, className = '' }) {
  if (!name) return null
  const tone = teamTone({ code, campaignCode })
  const classes = `admin-team-badge admin-team-badge--${tone} ${className}`.trim()
  if (linked && teamId) return <Link className={classes} to={`/admin/teams/${teamId}`}>{name}</Link>
  return <span className={classes}>{name}</span>
}
