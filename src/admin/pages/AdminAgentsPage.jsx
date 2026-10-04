import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { loadBusinessCatalog } from '../api/adminApi.js'
import { provisionAgent, reissueAgentActivation } from '../api/agentAdminApi.js'
import { openerTeamGroups } from '../agentTeamOptions.js'
import { validAgentCode } from '../../profile/agentProfileService.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'

export function AdminAgentsPage() {
  const [teamGroups, setTeamGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [code, setCode] = useState('')
  const [teamId, setTeamId] = useState('')
  const [reissueCode, setReissueCode] = useState('')
  const [profileCode, setProfileCode] = useState('')
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
    setCopyStatus('')
    const result = await reissueAgentActivation(supabase, reissueCode)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    setActivation(result.data)
    setReissueCode('')
  }

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><p>Pulse GO</p><h1>Agents</h1><span>Provision a company player without granting Staff access</span></div></div>
      {error && <p className="admin-operation-error" role="alert">{error.message}</p>}
      {activation && <section ref={activationPanel} className="admin-agent-card admin-agent-activation" tabIndex={-1} role="region" aria-labelledby="agent-activation-heading">
        <div><p className="admin-agent-card__eyebrow">Agent access is ready</p><h2 id="agent-activation-heading">Activation code for Agent {activation.agent_code}</h2><p>Copy this code before leaving. It is shown only now and expires in 24 hours.</p></div>
        <code>{activation.activation_code}</code>
        <Button type="button" variant="secondary" onClick={() => void copyActivationCode()}>{copyStatus === 'copied' ? 'Code copied ✓' : 'Copy code'}</Button>
        {copyStatus === 'failed' && <p role="alert">Couldn’t copy automatically. Select the code above and copy it manually.</p>}
        <p>Share it privately with the Agent. At <strong>/agent/signin</strong>, they choose <strong>First time here? Create your PIN</strong> and enter their Agent ID, this code and their own private PIN.</p>
        <p className="admin-agent-activation__tip">Testing it yourself? Save the code, then open Agent sign-in in a private browser window so your Staff session stays open.</p>
        <Link to={`/profile/${activation.agent_code}`}>View Agent profile →</Link>
      </section>}
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
      <section className="admin-agent-card" aria-label="Find Agent profile">
        <div><p className="admin-agent-card__eyebrow">Staff access</p><h2>Agent profile</h2><p>Open an Agent’s team and completed GO results by Agent ID.</p></div>
        <div className="admin-agent-card__profile-search"><label><span>Agent ID</span><input value={profileCode} onChange={(event) => setProfileCode(event.target.value)} inputMode="numeric" pattern="[0-9]{4,12}" maxLength={12} placeholder="3248" /></label>{validAgentCode(profileCode) && <Link to={`/profile/${profileCode}`}>View profile →</Link>}</div>
      </section>
    </main>
  )
}
