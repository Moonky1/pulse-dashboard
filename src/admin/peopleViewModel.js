export function staffInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'P'
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase()
  return `${words[0][0]}${words.at(-1)[0]}`.toLocaleUpperCase()
}

function compareNames(left, right) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' })
}

export function buildStaffTree(users = [], directory = {}) {
  const departments = [...(directory.departments ?? [])].sort((left, right) => compareNames(left.name, right.name))
  const teams = [...(directory.teams ?? [])].sort((left, right) => compareNames(left.name, right.name))
  const sortedUsers = [...users].sort((left, right) => compareNames(left.fullName, right.fullName))

  const nodes = departments.map((department) => {
    const departmentUsers = sortedUsers.filter((user) => user.departmentId === department.id)
    const teamNodes = teams
      .filter((team) => team.departmentId === department.id)
      .map((team) => ({
        id: team.id,
        name: team.name,
        people: departmentUsers.filter((user) => user.teamId === team.id),
      }))
    const unassigned = departmentUsers.filter((user) => !user.teamId || !teamNodes.some((team) => team.id === user.teamId))
    if (unassigned.length) teamNodes.push({ id: `${department.id}-unassigned`, name: 'No team assigned', people: unassigned })
    return { id: department.id, name: department.name, peopleCount: departmentUsers.length, teams: teamNodes }
  })

  const departmentIds = new Set(departments.map((department) => department.id))
  const unassigned = sortedUsers.filter((user) => !user.departmentId || !departmentIds.has(user.departmentId))
  if (unassigned.length) {
    nodes.push({
      id: 'unassigned',
      name: 'No department assigned',
      peopleCount: unassigned.length,
      teams: [{ id: 'unassigned-team', name: 'No team assigned', people: unassigned }],
    })
  }
  return nodes
}
