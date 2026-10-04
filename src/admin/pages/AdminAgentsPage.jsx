import { useEffect, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { listManagedTeams } from '../api/adminApi.js'
import { provisionAgent, reissueAgentActivation } from '../api/agentAdminApi.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'

export function AdminAgentsPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [reissueCode, setReissueCode] = useState('')
  const [activation, setActivation] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
    setActivation(null)
    const result = await provisionAgent(supabase, { code, displayName, teamId })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setActivation(result.data)
    setCode('')
    setDisplayName('')
    setTeamId('')
  }

  const reissue = async (event) => {
    event.preventDefault()
    if (!window.confirm('Reissue this Agent’s activation code? Their current PIN and open sessions will stop working.')) return
    setSubmitting(true)
    setError(null)
    setActivation(null)
    const result = await reissueAgentActivation(supabase, reissueCode)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setActivation(result.data)
    setReissueCode('')
  }

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><p>Pulse GO</p><h1>Agents</h1><span>Provision a company player without granting Staff access</span></div></div>
      {loading ? <AdminStatePanel kind="loading" title="Loading teams" body="Checking available teams…" />
        : loadError ? <AdminStatePanel kind="error" title="Teams unavailable" body={loadError.message} />
          : <section className="admin-agent-card" aria-label="Create Agent">
            <div><p className="admin-agent-card__eyebrow">Staff-only operation</p><h2>Create Agent</h2><p>Approve an Agent ID and team. The Agent chooses their own private PIN with a one-time activation code.</p></div>
            <form onSubmit={(event) => void submit(event)} autoComplete="off">
              <label><span>Agent ID</span><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
              <label><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} placeholder="QA Agent 3248" required /></label>
              <label><span>Team</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)} required><option value="">Choose a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
              <div className="admin-agent-card__actions"><p>The activation code expires in 24 hours and appears only once. Share it privately with the Agent.</p><Button type="submit" loading={submitting} disabled={!teams.length}>Create Agent</Button></div>
            </form>
          </section>}
      <section className="admin-agent-card" aria-label="Reissue Agent activation">
        <div><p className="admin-agent-card__eyebrow">Account recovery</p><h2>Issue a new activation code</h2><p>For an existing Agent who lost the code or PIN. This immediately revokes their current PIN and sessions.</p></div>
        <form onSubmit={(event) => void reissue(event)} autoComplete="off">
          <label><span>Agent ID</span><input value={reissueCode} onChange={(event) => setReissueCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
          <div className="admin-agent-card__actions"><p>Confirm the Agent’s identity before sharing the new code.</p><Button type="submit" loading={submitting}>Reissue code</Button></div>
        </form>
      </section>
      {error && <p className="admin-operation-error" role="alert">{error.message}</p>}
      {activation && <section className="admin-agent-card admin-agent-activation" role="status" aria-label="One-time activation code">
        <div><p className="admin-agent-card__eyebrow">Shown only now</p><h2>Activation code for Agent {activation.agent_code}</h2><p>Expires in 24 hours. Send this code privately; the Agent will set their own PIN at sign-in. Leaving this page hides the code.</p></div>
        <code>{activation.activation_code}</code>
        <Button type="button" variant="secondary" onClick={() => void navigator.clipboard?.writeText(activation.activation_code)}>Copy code</Button>
      </section>}
    </main>
  )
}
