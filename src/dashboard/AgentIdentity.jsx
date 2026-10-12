import { teamLabel } from './reportingPolicy.js'
import { reportTeamStyle } from './teamIdentity.js'
import { agentDisplayName } from './agentPresentation.js'
export function ReportTeamBadge({scope,row}) {
  return <span className="dash-team-badge" style={reportTeamStyle(scope,row?.current_user_group)}>{teamLabel(scope,row)}</span>
}
export function AgentLabel({row,scope}) {
  return <span className="dash-agent-label"><span className="dash-agent-line"><strong>{agentDisplayName(row)}</strong><span className="dash-agent-id">#{row.agent_code}</span></span><ReportTeamBadge scope={scope} row={row}/></span>
}
export function AgentIdentity({row,scope,onOpen,className}) {
  return <div className="dash-compact-identity"><button type="button" className={className} onClick={()=>onOpen(row.agent_code)}><AgentLabel row={row} scope={scope}/></button></div>
}
