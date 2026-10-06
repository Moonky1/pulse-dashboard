import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { listAdminAgents } from '../api/admin2Api.js'
import { GoTeamBadge } from '../../go-product/GoTeamBadge.jsx'
import { StaffAvatar } from './StaffAvatar.jsx'

const statuses = [['', 'All statuses'], ['pending_activation', 'Pending activation'], ['active', 'Active'], ['inactive', 'Inactive'], ['blocked', 'Blocked']]
export function AgentsDirectory({ teamGroups, refreshSignal }) {
  const [query, setQuery] = useState('')
  const [teamId, setTeamId] = useState('')
  const [status, setStatus] = useState('')
  const [state, setState] = useState({ agents: [], loading: true, error: null, has_more: false, next_cursor: null })
  const generation = useRef(0)
  useEffect(() => {
    const current = ++generation.current
    let active = true
    async function load() {
      const result = await listAdminAgents(supabase, { query, teamId, status })
      if (active && generation.current === current) setState({ ...result.data, error: result.error, loading: false })
    }
    const start = setTimeout(() => { void load() }, 180)
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void load() }, 30000)
    const focus = () => { void load() }
    window.addEventListener('focus', focus)
    return () => { active = false; clearTimeout(start); clearInterval(interval); window.removeEventListener('focus', focus) }
  }, [query, teamId, status, refreshSignal])
  async function more() {
    if (state.loading || !state.has_more) return
    const current = generation.current
    setState(value => ({ ...value, loading: true }))
    const result = await listAdminAgents(supabase, { query, teamId, status, cursor: state.next_cursor })
    if (generation.current !== current) return
    setState(value => ({ ...result.data, agents: result.error ? value.agents : [...value.agents, ...result.data.agents], error: result.error, loading: false }))
  }
  return <section className="admin-agents-directory" aria-label="Agent directory">
    <div className="admin-filter-bar">
      <label className="admin-search"><span>Search Agents</span><input maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or Agent ID" /></label>
      <label className="admin-filter"><span>Team</span><select aria-label="Team" value={teamId} onChange={event => setTeamId(event.target.value)}><option value="">All teams</option>{teamGroups.map(group => <optgroup key={group.id} label={group.name}>{group.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</optgroup>)}</select></label>
      <label className="admin-filter"><span>Status</span><select aria-label="Status" value={status} onChange={event => setStatus(event.target.value)}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {state.loading && <p role="status">Loading Agents…</p>}
    {state.error && <p role="alert">{state.error.message}</p>}
    {!state.loading && !state.error && !state.agents.length && <p>No Agents match this view. Registered Agents appear here automatically.</p>}
    <div>{state.agents.map(agent => <Link className="admin-user-row" key={agent.agent_code} to={`/profile/${agent.agent_code}`}>
      <div className="admin-user-identity admin-user-identity--avatar"><StaffAvatar name={agent.display_name} /><span><strong>{agent.display_name}</strong><small>ID: {agent.agent_code}</small></span></div>
      <GoTeamBadge player={agent} />
      <span className={`admin-agent-status admin-agent-status--${agent.status}`}>{statuses.find(([value]) => value === agent.status)?.[1] || 'Unavailable'}</span>
      <span className="admin-row-arrow" aria-hidden="true">→</span>
    </Link>)}</div>
    {state.has_more && <Button type="button" variant="secondary" loading={state.loading} onClick={() => void more()}>Load more Agents</Button>}
  </section>
}
