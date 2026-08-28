import assert from 'node:assert/strict'
import test from 'node:test'

import { filterOrganizationItems, normalizeOrganizationForm, organizationMutationMessage, organizationStatusConsequence, shouldCancelOrganizationDialogOnKey, validateOrganizationForm } from './organizationActions.js'

test('organization forms normalize codes and reject unsafe values', () => {
  assert.deepEqual(normalizeOrganizationForm({ code: ' Ops_Team ', name: ' Operations ', description: ' Core ' }), { code: 'ops_team', name: 'Operations', description: 'Core' })
  assert.equal(validateOrganizationForm({ code: 'ops', name: 'Operations' }).error, null)
  assert.match(validateOrganizationForm({ code: 'Bad Code', name: 'Operations' }).error, /lowercase/)
  assert.match(validateOrganizationForm({ code: 'ok', name: 'x' }).error, /between 2 and 120/)
  assert.match(validateOrganizationForm({ code: 'ok', name: 'Valid', description: 'x'.repeat(501) }).error, /500/)
})

test('organization filtering supports identity and exact team department', () => {
  const items = [
    { name: 'North', code: 'north', description: 'Calls', departmentId: 'd1', departmentName: 'Sales' },
    { name: 'Support', code: 'support', description: '', departmentId: 'd2', departmentName: 'Operations' },
  ]
  assert.equal(filterOrganizationItems(items, 'calls').length, 1)
  assert.equal(filterOrganizationItems(items, 'sales', 'd1').length, 1)
  assert.equal(filterOrganizationItems(items, '', 'd2')[0].name, 'Support')
})

test('status UX describes dependency protection and reactivation', () => {
  assert.match(organizationStatusConsequence('department', false), /active teams/)
  assert.match(organizationStatusConsequence('team', false), /active users/)
  assert.match(organizationStatusConsequence('team', true), /parent department/)
  assert.match(organizationMutationMessage('create', 'department', { created: true }), /created/)
  assert.match(organizationMutationMessage('update', 'team', { changed: false }), /No change/)
})

test('Escape cancels organization confirmation unless submitting', () => {
  assert.equal(shouldCancelOrganizationDialogOnKey('Escape'), true)
  assert.equal(shouldCancelOrganizationDialogOnKey('Escape', true), false)
  assert.equal(shouldCancelOrganizationDialogOnKey('Enter'), false)
})
