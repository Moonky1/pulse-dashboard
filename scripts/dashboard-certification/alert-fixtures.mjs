import { defaultAlertRules } from '../../src/dashboard/alertRules.js'
import { testScope } from './ui-fixtures.mjs'
export function alertFixture(scope = testScope.id, manager = true) {
  return { scope_id: scope, schema_version: 1, revision: 0, rules: defaultAlertRules(), changed_at: null, changed_by_name: null, can_manage: manager }
}
