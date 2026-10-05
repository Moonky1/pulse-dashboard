import asia from '../../public/flags/asia.png'
import colombia from '../../public/flags/colombia.png'
import mexico from '../../public/flags/mexico.png'
import philippines from '../../public/flags/philippines.png'
import venezuela from '../../public/flags/venezuela.png'
import central from '../../public/flags/team-central-america.svg'
import team from '../../public/flags/pulse-team.svg'
import { TeamBadge } from '../admin/components/TeamBadge.jsx'
import '../admin/styles/admin.css'
import { goTeamIdentity } from './goPlayerIdentity.js'
import './goTeamIdentity.css'

const flags = { asia, colombia, mexico, philippines, venezuela, central, team }

export function GoTeamBadge({ player, includeCampaign = true }) {
  const identity = goTeamIdentity(player, includeCampaign)
  return <TeamBadge linked={false} code={identity.code} campaignCode={identity.campaignCode}
    className="go-team-badge" name={<><img src={flags[identity.flag]} alt={`${identity.label} team flag${['central', 'team'].includes(identity.flag) ? ' (Pulse design)' : ''}`} /><span>Team: {identity.label}</span></>} />
}
