import assert from 'node:assert/strict'
import test from 'node:test'

import { STAFF_TREE_PROTOTYPE } from './staffTreePrototypeFixture.js'
import { buildStaffTreeV2, filterStaffTreeV2, staffTreeBranchIds } from './staffTreeViewModel.js'

test('Staff Tree V2 builds company, department, campaign and team branches', () => {
  const tree = buildStaffTreeV2(STAFF_TREE_PROTOTYPE.users, STAFF_TREE_PROTOTYPE.directory, STAFF_TREE_PROTOTYPE.relationships)
  assert.equal(tree.name, 'Kampaign Kings')
  assert.equal(tree.peopleCount, 6)
  assert.equal(tree.departments.length, 2)
  assert.equal(tree.departments[0].name, 'Operations')
  assert.equal(tree.departments[0].teams[1].campaignName, 'Auto Warranty Garrett')
  assert.deepEqual(staffTreeBranchIds(tree), [
    'department:department-operations',
    'team:team-nicaragua',
    'team:team-philippines',
    'department:department-quality',
    'team:team-quality',
  ])
})

test('reporting lines are built only from explicit primary-manager relationships', () => {
  const tree = buildStaffTreeV2(STAFF_TREE_PROTOTYPE.users, STAFF_TREE_PROTOTYPE.directory, STAFF_TREE_PROTOTYPE.relationships)
  const philippines = tree.departments[0].teams.find((team) => team.id === 'team-philippines')
  assert.equal(philippines.hasReportingData, true)
  assert.equal(philippines.roots[0].person.fullName, 'Alex Rivera')
  assert.equal(philippines.roots[0].reports[0].person.fullName, 'Jordan Lee')
  assert.equal(philippines.roots[0].reports[0].reports[0].person.fullName, 'Taylor Morgan')

  const withoutContracts = buildStaffTreeV2(STAFF_TREE_PROTOTYPE.users, STAFF_TREE_PROTOTYPE.directory)
  const flatPhilippines = withoutContracts.departments[0].teams.find((team) => team.id === 'team-philippines')
  assert.equal(flatPhilippines.hasReportingData, false)
  assert.equal(flatPhilippines.roots.length, 3)
  assert.ok(flatPhilippines.roots.every((node) => node.reports.length === 0))
})

test('QA coverage remains secondary context and never changes reporting placement', () => {
  const tree = buildStaffTreeV2(STAFF_TREE_PROTOTYPE.users, STAFF_TREE_PROTOTYPE.directory, STAFF_TREE_PROTOTYPE.relationships)
  const quality = tree.departments.find((department) => department.id === 'department-quality').teams[0]
  const qaLead = quality.roots[0]
  assert.equal(qaLead.person.departmentName, 'Quality')
  assert.equal(qaLead.person.teamName, 'Quality Assurance')
  assert.deepEqual(qaLead.person.qaCoverage.map((coverage) => coverage.teamName), ['Philippines'])
  assert.equal(qaLead.reports[0].person.teamName, 'Quality Assurance')
})

test('search keeps reporting ancestors and department filter narrows the view', () => {
  const tree = buildStaffTreeV2(STAFF_TREE_PROTOTYPE.users, STAFF_TREE_PROTOTYPE.directory, STAFF_TREE_PROTOTYPE.relationships)
  const search = filterStaffTreeV2(tree, { query: 'Taylor Morgan' })
  const philippines = search.departments[0].teams[0]
  assert.equal(search.peopleCount, 1)
  assert.equal(philippines.roots[0].person.fullName, 'Alex Rivera')
  assert.equal(philippines.roots[0].reports[0].person.fullName, 'Jordan Lee')
  assert.equal(philippines.roots[0].reports[0].reports[0].person.fullName, 'Taylor Morgan')

  const qualityOnly = filterStaffTreeV2(tree, { departmentId: 'department-quality' })
  assert.deepEqual(qualityOnly.departments.map((department) => department.name), ['Quality'])
  assert.equal(qualityOnly.peopleCount, 2)
})

test('users outside the current catalog remain visible in unassigned branches', () => {
  const users = [...STAFF_TREE_PROTOTYPE.users, { id: 'person-unassigned', fullName: 'Morgan Gray', status: 'pending_approval' }]
  const tree = buildStaffTreeV2(users, STAFF_TREE_PROTOTYPE.directory, STAFF_TREE_PROTOTYPE.relationships)
  const unassigned = tree.departments.at(-1)
  assert.equal(unassigned.name, 'No department assigned')
  assert.equal(unassigned.teams[0].people[0].fullName, 'Morgan Gray')
})

test('malformed cyclic reporting input never hides a person', () => {
  const relationships = {
    reporting: [
      { kind: 'primary_manager', personId: 'person-alex', managerId: 'person-jordan' },
      { kind: 'primary_manager', personId: 'person-jordan', managerId: 'person-alex' },
    ],
  }
  const tree = buildStaffTreeV2(STAFF_TREE_PROTOTYPE.users, STAFF_TREE_PROTOTYPE.directory, relationships)
  const philippines = tree.departments[0].teams.find((team) => team.id === 'team-philippines')
  assert.deepEqual(philippines.roots.map((node) => node.person.fullName), ['Alex Rivera', 'Jordan Lee', 'Taylor Morgan'])
  assert.ok(philippines.roots.every((node) => node.reports.length === 0))
})
