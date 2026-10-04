import { useEffect, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { loadBusinessCatalog } from '../api/adminApi.js'
import { provisionAgent, reissueAgentActivation } from '../api/agentAdminApi.js'
import { openerTeamGroups } from '../agentTeamOptions.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'

export function AdminAgentsPage() {
  const [teamGroups, setTeamGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [code, setCode] = useState('')
  const [teamId, setTeamId] = useState('')
  const [reissueCode, setReissueCode] = useState('')
  const [activation, setActivation] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let current = true
    void loadBusinessCatalog(supabase).then((result) => {
      if (!current) return
      setTeamGroups(openerTeamGroups(result.data ?? {}))
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
    const result = await provisionAgent(supabase, { code, teamId })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setActivation(result.data)
    setCode('')
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
            <div><p className="admin-agent-card__eyebrow">Staff-only operation</p><h2>Create Agent</h2><p>Enter the Agent ID and select their team. The player sets their own private PIN with a one-time activation code.</p></div>
            <form onSubmit={(event) => void submit(event)} autoComplete="off">
              <label><span>Agent ID</span><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
              <label><span>Team</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)} required><option value="">Select team</option>{teamGroups.map((group) => <optgroup key={group.id} label={group.name}>{group.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</optgroup>)}</select></label>
              <div className="admin-agent-card__actions"><p>{teamGroups.length ? `The player will appear as Agent ${code || '3248'}. The activation code expires in 24 hours and appears only once.` : 'No active teams are available.'}</p><Button type="submit" loading={submitting} disabled={!teamGroups.length}>Create Agent</Button></div>
            </form>
          </section>}
      <section className="admin-agent-card" aria-label="Recover Agent access">
        <div><p className="admin-agent-card__eyebrow">Existing Agents only</p><h2>Recover Agent access</h2><p>If an Agent forgot their PIN or lost their activation code, generate a new one. Their old PIN and open sessions stop working immediately.</p></div>
        <form onSubmit={(event) => void reissue(event)} autoComplete="off">
          <label><span>Agent ID</span><input value={reissueCode} onChange={(event) => setReissueCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
          <div className="admin-agent-card__actions"><p>Confirm the Agent’s identity before sharing the new code.</p><Button type="submit" loading={submitting}>Generate recovery code</Button></div>
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
