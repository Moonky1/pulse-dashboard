import assert from 'node:assert/strict'
import test from 'node:test'

import { buildStaffTree, staffInitials } from './peopleViewModel.js'

test('staff initials stay useful for short, long, and missing names', () => {
  assert.equal(staffInitials('Simón Zapata Franco'), 'SF')
  assert.equal(staffInitials('Pulse'), 'PU')
  assert.equal(staffInitials(''), 'P')
})

test('Staff Tree groups departments, teams and unassigned people without inventing hierarchy', () => {
  const directory = {
    departments: [{ id: 'd1', name: 'Corporate' }],
    teams: [{ id: 't1', departmentId: 'd1', name: 'People Operations' }],
  }
  const users = [
    { id: 'u1', fullName: 'Alex Rivera', departmentId: 'd1', teamId: 't1' },
    { id: 'u2', fullName: 'Jordan Lee', departmentId: 'd1', teamId: null },
    { id: 'u3', fullName: 'Morgan Chen', departmentId: null, teamId: null },
  ]
  const tree = buildStaffTree(users, directory)
  assert.equal(tree[0].name, 'Corporate')
  assert.equal(tree[0].teams[0].people[0].fullName, 'Alex Rivera')
  assert.equal(tree[0].teams[1].name, 'No team assigned')
  assert.equal(tree[1].name, 'No department assigned')
})
