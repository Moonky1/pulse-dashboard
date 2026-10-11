import { teamLabel } from './reportingPolicy.js'
import { reportTeamStyle } from './teamIdentity.js'
export function ReportTeamBadge({scope,row}) {
  return <span className="dash-team-badge" style={reportTeamStyle(scope,row?.current_user_group)}>{teamLabel(scope,row)}</span>
}
export function AgentIdentity({row,scope,onOpen}) {
  return <div className="dash-compact-identity"><button type="button" onClick={()=>onOpen(row.agent_code)}>{row.vici_user_name}</button><div><span className="dash-agent-id">#{row.agent_code}</span><ReportTeamBadge scope={scope} row={row}/></div></div>
}
