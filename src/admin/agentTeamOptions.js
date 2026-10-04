export function openerTeamGroups(catalog = {}) {
  const campaigns = catalog.campaigns ?? []
  const operatingUnits = catalog.operatingUnits ?? []
  const teams = catalog.teams ?? []

  return campaigns
    .filter((campaign) => campaign.isActive)
    .map((campaign) => {
      const openerUnitIds = new Set(operatingUnits
        .filter((unit) => unit.isActive && unit.campaignId === campaign.id && unit.code === 'openers')
        .map((unit) => unit.id))

      return {
        id: campaign.id,
        name: campaign.name,
        teams: teams
          .filter((team) => team.isActive && team.campaignId === campaign.id && openerUnitIds.has(team.operatingUnitId))
          .sort((left, right) => left.name.localeCompare(right.name)),
      }
    })
    .filter((campaign) => campaign.teams.length > 0)
    .sort((left, right) => left.name.localeCompare(right.name))
}
