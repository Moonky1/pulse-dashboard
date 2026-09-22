function compareNames(left = '', right = '') {
  return left.localeCompare(right, undefined, { sensitivity: 'base' })
}

export function buildBusinessAreaBranches(catalog = {}) {
  const departments = catalog.departments ?? []
  const teams = catalog.teams ?? []
  return [...(catalog.businessAreas ?? [])]
    .sort((left, right) => compareNames(left.name, right.name))
    .map((area) => ({
      ...area,
      departments: departments
        .filter((department) => department.businessAreaId === area.id)
        .sort((left, right) => compareNames(left.name, right.name))
        .map((department) => ({
          ...department,
          teams: teams
            .filter((team) => team.departmentId === department.id)
            .sort((left, right) => compareNames(left.name, right.name)),
        })),
      directTeams: teams
        .filter((team) => team.businessAreaId === area.id && !team.departmentId && !team.campaignId)
        .sort((left, right) => compareNames(left.name, right.name)),
    }))
}

export function buildCampaignBranches(catalog = {}) {
  const units = catalog.operatingUnits ?? []
  const teams = catalog.teams ?? []
  return [...(catalog.campaigns ?? [])]
    .sort((left, right) => compareNames(left.name, right.name))
    .map((campaign) => ({
      ...campaign,
      units: units
        .filter((unit) => unit.campaignId === campaign.id && !unit.parentUnitId)
        .sort((left, right) => compareNames(left.name, right.name))
        .map((unit) => ({
          ...unit,
          teams: teams
            .filter((team) => team.operatingUnitId === unit.id)
            .sort((left, right) => compareNames(left.name, right.name)),
        })),
      directTeams: teams
        .filter((team) => team.campaignId === campaign.id && !team.operatingUnitId)
        .sort((left, right) => compareNames(left.name, right.name)),
    }))
}
