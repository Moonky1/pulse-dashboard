import { useEffect, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { listManagedTeams } from '../api/adminApi.js'
import { provisionAgent } from '../api/agentAdminApi.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'

export function AdminAgentsPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let current = true
    void listManagedTeams(supabase).then((result) => {
      if (!current) return
      setTeams(result.data.filter((team) => team.isActive))
      setLoadError(result.error)
      setLoading(false)
    })
    return () => { current = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setNotice('')
    const result = await provisionAgent(supabase, { code, displayName, teamId, pin })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setNotice(`Agent ${code.trim()} created. Share the PIN privately; it will not be shown again.`)
    setCode('')
    setDisplayName('')
    setTeamId('')
    setPin('')
  }

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><p>Pulse GO</p><h1>Agents</h1><span>Provision a company player without granting Staff access</span></div></div>
      {loading ? <AdminStatePanel kind="loading" title="Loading teams" body="Checking available teams…" />
        : loadError ? <AdminStatePanel kind="error" title="Teams unavailable" body={loadError.message} />
          : <section className="admin-agent-card" aria-label="Create Agent">
            <div><p className="admin-agent-card__eyebrow">Staff-only operation</p><h2>Create Agent</h2><p>Set an Agent ID, private PIN and existing team. The Agent can sign in to GO, but cannot enter Studio or Administration.</p></div>
            <form onSubmit={(event) => void submit(event)} autoComplete="off">
              <label><span>Agent ID</span><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
              <label><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} placeholder="QA Agent 3248" required /></label>
              <label><span>Team</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)} required><option value="">Choose a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
              <label><span>Private PIN</span><input value={pin} onChange={(event) => setPin(event.target.value)} type="password" inputMode="numeric" pattern="[0-9]{6,12}" minLength={6} maxLength={12} autoComplete="new-password" placeholder="6–12 digits" required /></label>
              <div className="admin-agent-card__actions"><p>Only you and the Agent should know this PIN. A Pulse administrator can reset it later.</p><Button type="submit" loading={submitting} disabled={!teams.length}>Create Agent</Button></div>
            </form>
          </section>}
      {error && <p className="admin-operation-error" role="alert">{error.message}</p>}
      {notice && <p className="admin-operation-notice" role="status">{notice}</p>}
    </main>
  )
}
