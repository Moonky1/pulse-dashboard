import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { loadBusinessCatalog } from '../api/adminApi.js'
import { provisionAgent, reissueAgentActivation } from '../api/agentAdminApi.js'
import { openerTeamGroups } from '../agentTeamOptions.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { AgentsDirectory } from '../components/AgentsDirectory.jsx'

export function AdminAgentsPage() {
  const [teamGroups, setTeamGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [reissueCode, setReissueCode] = useState('')
  const [activation, setActivation] = useState(null)
  const activationPanel = useRef(null)
  const [copyStatus, setCopyStatus] = useState('')
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

  useEffect(() => {
    if (!activation) return
    activationPanel.current?.focus({ preventScroll: true })
    activationPanel.current?.scrollIntoView({ block: 'start' })
  }, [activation])

  async function copyActivationCode() {
    try {
      await navigator.clipboard.writeText(activation.activation_code)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setActivation(null)
    setCopyStatus('')
    const result = await provisionAgent(supabase, { code, name, teamId })
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setActivation({ ...result.data, name: name.trim() })
    setCode('')
    setName('')
    setTeamId('')
  }

  const reissue = async (event) => {
    event.preventDefault()
    if (!window.confirm('Reissue this Agent’s activation code? Their current PIN and open sessions will stop working.')) return
    setSubmitting(true)
    setError(null)
    setActivation(null)
    setCopyStatus('')
    const result = await reissueAgentActivation(supabase, reissueCode)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setActivation(result.data)
    setReissueCode('')
  }

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><p>People</p><h1>Agents</h1><span>Your company players, teams and activation status</span></div></div>
      {!loading && !loadError && <AgentsDirectory teamGroups={teamGroups} refreshSignal={activation} />}
      {error && <p className="admin-operation-error" role="alert">{error.message}</p>}
      {activation && <section ref={activationPanel} className="admin-agent-card admin-agent-activation" tabIndex={-1} role="region" aria-labelledby="agent-activation-heading">
        <div><p className="admin-agent-card__eyebrow">Agent access is ready</p><h2 id="agent-activation-heading">Activation code for {activation.name || `Agent ${activation.agent_code}`}</h2><p>Agent ID {activation.agent_code} · Copy this code before leaving. It is shown only now and expires in 24 hours.</p></div>
        <code>{activation.activation_code}</code>
        <Button type="button" variant="secondary" onClick={() => void copyActivationCode()}>{copyStatus === 'copied' ? 'Code copied ✓' : 'Copy code'}</Button>
        {copyStatus === 'failed' && <p role="alert">Couldn’t copy automatically. Select the code above and copy it manually.</p>}
        <p>Share it privately with the Agent. At <strong>/agent/signin</strong>, they choose <strong>First time here? Create your PIN</strong> and enter their Agent ID, this code and their own private PIN.</p>
        <p className="admin-agent-activation__tip">Testing it yourself? Save the code, then open Agent sign-in in a private browser window so your Staff session stays open.</p>
        <Link to={`/profile/${activation.agent_code}`}>View Agent profile →</Link>
      </section>}
      {loading ? <AdminStatePanel kind="loading" title="Loading teams" body="Checking available teams…" />
        : loadError ? <AdminStatePanel kind="error" title="Teams unavailable" body={loadError.message} />
          : <details className="admin-agent-provisioning"><summary>Create Agent</summary><section className="admin-agent-card" aria-label="Create Agent">
            <div><p className="admin-agent-card__eyebrow">Staff-only operation</p><h2>Create Agent</h2><p>Register their name, Agent ID and team. Share the one-time activation code privately; the Agent only needs to create their own PIN.</p></div>
            <form onSubmit={(event) => void submit(event)} autoComplete="off">
              <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} placeholder="María López" required /></label>
              <label><span>Agent ID</span><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
              <label className="admin-agent-card__team"><span>Team</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)} required><option value="">Select team</option>{teamGroups.map((group) => <optgroup key={group.id} label={group.name}>{group.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</optgroup>)}</select></label>
              <div className="admin-agent-card__actions"><p>{teamGroups.length ? 'Their name appears on their profile. They sign in with Agent ID + PIN, not their name. The activation code expires in 24 hours and appears only once.' : 'No active teams are available.'}</p><Button type="submit" loading={submitting} disabled={!teamGroups.length}>Create Agent</Button></div>
            </form>
          </section></details>}
      <details className="admin-agent-provisioning"><summary>Recover Agent access</summary><section className="admin-agent-card" aria-label="Recover Agent access">
        <div><p className="admin-agent-card__eyebrow">Existing Agents only</p><h2>Recover Agent access</h2><p>If an Agent forgot their PIN or lost their activation code, generate a new one. Their old PIN and open sessions stop working immediately.</p></div>
        <form onSubmit={(event) => void reissue(event)} autoComplete="off">
          <label><span>Agent ID</span><input value={reissueCode} onChange={(event) => setReissueCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" required /></label>
          <div className="admin-agent-card__actions"><p>Confirm the Agent’s identity before sharing the new code.</p><Button type="submit" loading={submitting}>Generate recovery code</Button></div>
        </form>
      </section></details>
    </main>
  )
}
