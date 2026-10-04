import assert from 'node:assert/strict'
import test from 'node:test'

import { openerTeamGroups } from './agentTeamOptions.js'

test('Agent creation offers only active campaign opener teams', () => {
  const catalog = {
    campaigns: [{ id: 'garrett', name: 'Garrett', isActive: true }, { id: 'inactive', name: 'Inactive', isActive: false }],
    operatingUnits: [
      { id: 'openers', campaignId: 'garrett', code: 'openers', isActive: true },
      { id: 'closers', campaignId: 'garrett', code: 'closers', isActive: true },
      { id: 'inactive-openers', campaignId: 'inactive', code: 'openers', isActive: true },
    ],
    teams: [
      { id: 'collections', name: 'Collections', campaignId: null, operatingUnitId: null, isActive: true },
      { id: 'venezuela', name: 'Venezuela', campaignId: 'garrett', operatingUnitId: 'openers', isActive: true },
      { id: 'asia-a', name: 'Asia Team A', campaignId: 'garrett', operatingUnitId: 'openers', isActive: true },
      { id: 'closer', name: 'Junior Closers', campaignId: 'garrett', operatingUnitId: 'closers', isActive: true },
      { id: 'inactive-team', name: 'Inactive', campaignId: 'garrett', operatingUnitId: 'openers', isActive: false },
      { id: 'other-campaign', name: 'Other', campaignId: 'inactive', operatingUnitId: 'inactive-openers', isActive: true },
    ],
  }

  assert.deepEqual(openerTeamGroups(catalog), [{
    id: 'garrett',
    name: 'Garrett',
    teams: [catalog.teams[2], catalog.teams[1]],
  }])
})
