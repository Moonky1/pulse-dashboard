function compareNames(left = '', right = '') {
  return left.localeCompare(right, undefined, { sensitivity: 'base' })
}

function isLeadership(person) {
  const position = String(person.positionName ?? '').toLowerCase()
  return position.includes('supervisor') || position.includes('team lead') || position.includes('team leader')
}

function personSearchText(person, departmentName, teamName) {
  return [
    person.fullName,
    person.displayName,
    person.employeeId,
    person.positionName,
    departmentName,
    teamName,
    ...(person.qaCoverage ?? []).map((coverage) => coverage.teamName),
  ].filter(Boolean).join(' ').toLocaleLowerCase()
}

function reportingForest(people, relationships) {
  const peopleById = new Map(people.map((person) => [person.id, person]))
  const parentByPerson = new Map()
  const childrenByManager = new Map()

  relationships.forEach((relationship) => {
    if (relationship.kind !== 'primary_manager') return
    if (!peopleById.has(relationship.personId) || !peopleById.has(relationship.managerId)) return
    if (relationship.personId === relationship.managerId || parentByPerson.has(relationship.personId)) return
    parentByPerson.set(relationship.personId, relationship.managerId)
    const children = childrenByManager.get(relationship.managerId) ?? []
    children.push(relationship.personId)
    childrenByManager.set(relationship.managerId, children)
  })

  const buildNode = (personId, trail = new Set()) => {
    const person = peopleById.get(personId)
    if (!person || trail.has(personId)) return null
    const nextTrail = new Set(trail).add(personId)
    const reports = (childrenByManager.get(personId) ?? [])
      .map((childId) => buildNode(childId, nextTrail))
      .filter(Boolean)
      .sort((left, right) => compareNames(left.person.fullName, right.person.fullName))
    return { person, reports }
  }

  const roots = people
    .filter((person) => !parentByPerson.has(person.id))
    .map((person) => buildNode(person.id))
    .filter(Boolean)
  const included = new Set()
  const collect = (node) => {
    included.add(node.person.id)
    node.reports.forEach(collect)
  }
  roots.forEach(collect)
  people.forEach((person) => {
    if (!included.has(person.id)) roots.push({ person, reports: [] })
  })
  roots.sort((left, right) => compareNames(left.person.fullName, right.person.fullName))

  return {
    hasReportingData: parentByPerson.size > 0,
    roots,
  }
}

function enrichPeople(people, department, team, coverageByPerson) {
  return people.map((person) => ({
    ...person,
    departmentName: department.name,
    teamName: team.name,
    qaCoverage: coverageByPerson.get(person.id) ?? [],
  }))
}

export function buildStaffTreeV2(users = [], directory = {}, relationships = {}, catalog = {}) {
  const departments = [...(directory.departments ?? [])].sort((left, right) => compareNames(left.name, right.name))
  const teams = [...(directory.teams ?? [])].sort((left, right) => compareNames(left.name, right.name))
  const sortedUsers = users.filter((user) => user.status === 'active').sort((left, right) => compareNames(left.fullName, right.fullName))
  const primaryRelationships = relationships.reporting ?? []
  const coverageByPerson = new Map()

  ;(relationships.qaCoverage ?? []).forEach((coverage) => {
    const assignments = coverageByPerson.get(coverage.personId) ?? []
    assignments.push({ teamId: coverage.teamId ?? null, teamName: coverage.teamName ?? 'Operational team' })
    coverageByPerson.set(coverage.personId, assignments)
  })

  const buildTeam = (team, department, people) => {
    const enrichedPeople = enrichPeople(people, department, team, coverageByPerson)
    const personIds = new Set(enrichedPeople.map((person) => person.id))
    const teamRelationships = primaryRelationships.filter((relationship) => (
      personIds.has(relationship.personId) && personIds.has(relationship.managerId)
    ))
    return {
      id: team.id,
      name: team.name,
      code: team.code ?? null,
      campaignId: team.campaignId ?? null,
      campaignName: team.campaignName ?? null,
      campaignCode: team.campaignCode ?? null,
      operatingUnitName: team.operatingUnitName ?? null,
      people: enrichedPeople,
      leadership: enrichedPeople.filter(isLeadership),
      staff: enrichedPeople.filter((person) => !isLeadership(person)),
      ...reportingForest(enrichedPeople, teamRelationships),
    }
  }

  const operationalTeams = (catalog.teams ?? []).filter((team) => team.campaignId)
  const operationalTeamIds = new Set(operationalTeams.map((team) => team.id))
  const operationalUserIds = new Set(sortedUsers.filter((user) => operationalTeamIds.has(user.primaryTeamId)).map((user) => user.id))
  const campaignById = new Map((catalog.campaigns ?? []).map((campaign) => [campaign.id, campaign]))
  const unitById = new Map((catalog.operatingUnits ?? []).map((unit) => [unit.id, unit]))
  const areaById = new Map((catalog.businessAreas ?? []).map((area) => [area.id, area]))

  const departmentNodes = departments.map((department) => {
    const departmentUsers = sortedUsers.filter((user) => user.departmentId === department.id && !operationalUserIds.has(user.id))
    const departmentTeams = teams
      .filter((team) => team.departmentId === department.id)
      .map((team) => buildTeam(team, department, departmentUsers.filter((user) => user.teamId === team.id)))
    const knownTeamIds = new Set(departmentTeams.map((team) => team.id))
    const unassigned = departmentUsers.filter((user) => !user.teamId || !knownTeamIds.has(user.teamId))
    if (unassigned.length) {
      departmentTeams.push(buildTeam({ id: `${department.id}-unassigned`, name: 'No team assigned' }, department, unassigned))
    }
    return {
      id: department.id,
      name: department.name,
      kind: 'department',
      peopleCount: departmentUsers.length,
      teams: departmentTeams,
    }
  })

  const operationalAreas = new Map()
  operationalTeams.forEach((team) => {
    const area = areaById.get(team.businessAreaId) ?? { id: team.businessAreaId ?? 'operations', name: 'Operations' }
    if (!operationalAreas.has(area.id)) operationalAreas.set(area.id, { ...area, teams: [] })
    operationalAreas.get(area.id).teams.push(team)
  })
  operationalAreas.forEach((area) => {
    const teamsForArea = area.teams
      .sort((left, right) => compareNames(left.name, right.name))
      .map((team) => buildTeam({
        ...team,
        campaignName: campaignById.get(team.campaignId)?.name ?? null,
        campaignCode: campaignById.get(team.campaignId)?.code ?? null,
        operatingUnitName: unitById.get(team.operatingUnitId)?.name ?? null,
      }, area, sortedUsers.filter((user) => user.primaryTeamId === team.id)))
    departmentNodes.push({
      id: `business-area:${area.id}`,
      name: area.name,
      kind: 'business_area',
      peopleCount: teamsForArea.reduce((total, team) => total + team.people.length, 0),
      teams: teamsForArea,
    })
  })

  const knownDepartmentIds = new Set(departments.map((department) => department.id))
  const unassigned = sortedUsers.filter((user) => !user.departmentId || !knownDepartmentIds.has(user.departmentId))
  if (unassigned.length) {
    const department = { id: 'unassigned', name: 'No department assigned' }
    departmentNodes.push({
      ...department,
      kind: 'unassigned',
      peopleCount: unassigned.length,
      teams: [buildTeam({ id: 'unassigned-team', name: 'No team assigned' }, department, unassigned)],
    })
  }

  return {
    id: 'kampaign-kings',
    name: relationships.companyName ?? 'Kampaign Kings',
    peopleCount: sortedUsers.length,
    departments: departmentNodes,
  }
}

function filterReportingNode(node, query, branchMatches) {
  const reports = node.reports.map((report) => filterReportingNode(report, query, branchMatches)).filter(Boolean)
  const matches = branchMatches || personSearchText(node.person, node.person.departmentName, node.person.teamName).includes(query)
  return matches || reports.length ? { ...node, reports } : null
}

export function filterStaffTreeV2(tree, { query = '', departmentId = 'all' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const departments = tree.departments.flatMap((department) => {
    if (departmentId !== 'all' && department.id !== departmentId) return []
    const departmentMatches = normalizedQuery && department.name.toLocaleLowerCase().includes(normalizedQuery)
    const teams = department.teams.flatMap((team) => {
      const branchMatches = Boolean(departmentMatches || (normalizedQuery && team.name.toLocaleLowerCase().includes(normalizedQuery)))
      const people = normalizedQuery
        ? team.people.filter((person) => branchMatches || personSearchText(person, department.name, team.name).includes(normalizedQuery))
        : team.people
      const roots = normalizedQuery
        ? team.roots.map((root) => filterReportingNode(root, normalizedQuery, branchMatches)).filter(Boolean)
        : team.roots
      if (normalizedQuery && !people.length && !roots.length) return []
      if (!normalizedQuery && !people.length) return []
      const visibleIds = new Set(people.map((person) => person.id))
      return [{
        ...team,
        people,
        leadership: (team.leadership ?? []).filter((person) => visibleIds.has(person.id)),
        staff: (team.staff ?? []).filter((person) => visibleIds.has(person.id)),
        roots,
      }]
    })
    if (!teams.length) return []
    return [{ ...department, peopleCount: teams.reduce((total, team) => total + team.people.length, 0), teams }]
  })
  return {
    ...tree,
    peopleCount: departments.reduce((total, department) => total + department.peopleCount, 0),
    departments,
  }
}

export function staffTreeBranchIds(tree) {
  return tree.departments.flatMap((department) => [
    `department:${department.id}`,
    ...department.teams.map((team) => `team:${team.id}`),
  ])
}
