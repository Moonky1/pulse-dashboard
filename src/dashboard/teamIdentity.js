import { teamBadgeStyle } from '../admin/visualIdentity.js'
import { isEnglishXfer } from './reportingPolicy.js'
// Display-only aliases reuse Admin's palette; never grant team membership.
const codes = { OpenersAsia:'asia_team_a', OpenersAsia1:'asia_team_b', OpenersCA:'central_america', OpenersCO:'colombia', OpenersMXBJ:'mexico_team_group_a', OpenersMXBJ1:'mexico_team_group_b', OpenersNIC:'nicaragua', OpenersPH:'philippines', OpenersVZ:'venezuela' }
export const reportTeamStyle = (scope, group) => isEnglishXfer(scope) && codes[group] ? teamBadgeStyle({campaignCode:'auto_warranty_garrett',code:codes[group]}) : undefined
