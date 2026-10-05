import { teamTone } from '../admin/visualIdentity.js'

// Presentation only. IDs and membership always remain server-owned.
export function goPlayerName(player = {}) {
  const id = String(player.agent_code || '')
  const placeholder = value => id && String(value || '').trim().toLowerCase() === `agent ${id}`
  return [player.display_name, player.full_name].find(value => typeof value === 'string' && value.trim() && !placeholder(value))?.trim() || 'Player'
}

export function goTeamIdentity(player = {}, includeCampaign = true) {
  const code = player.team_code || ''
  const team = player.team_name || player.team || 'Unassigned'
  const shortTeam = /^Asia Team ([AB])$/i.test(team) ? team.replace(/ Team /i, ' ') : team
  const campaign = player.campaign_code === 'auto_warranty_garrett' ? 'Garrett'
    : player.campaign_code === 'auto_warranty_joe' ? 'Joe' : player.campaign_name || ''
  const label = `${shortTeam}${includeCampaign && campaign ? ` · ${campaign}` : ''}`
  const flagByTeam = { asia_team_a: 'asia', asia_team_b: 'asia', central_america: 'central',
    philippines: 'philippines', venezuela: 'venezuela', colombia: 'colombia',
    mexico_team_group_a: 'mexico', mexico_team_group_b: 'mexico', mexico: 'mexico' }
  const flag = Object.hasOwn(flagByTeam, code) ? flagByTeam[code] : 'team'
  return { code, label, flag, campaignCode: player.campaign_code,
    tone: teamTone({ code, campaignCode: player.campaign_code }) }
}
