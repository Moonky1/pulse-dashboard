import assert from 'node:assert/strict'
import test from 'node:test'

import { buildBusinessAreaBranches, buildCampaignBranches } from './businessCatalog.js'

const AREA = '30000000-0000-4000-8000-000000000001'
const DEPARTMENT = '31000000-0000-4000-8000-000000000001'
const CAMPAIGN = '32000000-0000-4000-8000-000000000001'
const UNIT = '33000000-0000-4000-8000-000000000001'

const catalog = {
  businessAreas: [{ id: AREA, name: 'Operations' }],
  departments: [{ id: DEPARTMENT, businessAreaId: AREA, name: 'Quality Assurance' }],
  campaigns: [{ id: CAMPAIGN, businessAreaId: AREA, name: 'Auto Warranty Garrett' }],
  operatingUnits: [{ id: UNIT, businessAreaId: AREA, campaignId: CAMPAIGN, parentUnitId: null, name: 'Openers' }],
  teams: [
    { id: 'department-team', businessAreaId: AREA, departmentId: DEPARTMENT, campaignId: null, operatingUnitId: null, name: 'QA Closers' },
    { id: 'unit-team', businessAreaId: AREA, departmentId: null, campaignId: CAMPAIGN, operatingUnitId: UNIT, name: 'Asia Team A' },
    { id: 'direct-campaign-team', businessAreaId: AREA, departmentId: null, campaignId: CAMPAIGN, operatingUnitId: null, name: 'LATAM' },
    { id: 'direct-area-team', businessAreaId: AREA, departmentId: null, campaignId: null, operatingUnitId: null, name: 'Dialer Management' },
  ],
}

test('business areas keep Departments and direct functions distinct', () => {
  const [area] = buildBusinessAreaBranches(catalog)
  assert.deepEqual(area.departments[0].teams.map((team) => team.name), ['QA Closers'])
  assert.deepEqual(area.directTeams.map((team) => team.name), ['Dialer Management'])
})

test('Campaign hierarchy keeps operating-unit Teams separate from direct Teams', () => {
  const [campaign] = buildCampaignBranches(catalog)
  assert.deepEqual(campaign.units[0].teams.map((team) => team.name), ['Asia Team A'])
  assert.deepEqual(campaign.directTeams.map((team) => team.name), ['LATAM'])
})
