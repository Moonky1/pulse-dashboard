import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { listOwnStaffRemovalTasks, removeStaffIdentity } from '../api/admin2Api.js'

export function PendingStaffCleanup() {
  const [state, setState] = useState({ tasks: [], error: null })
  const [busy, setBusy] = useState(null)
  useEffect(() => {
    let active = true
    void listOwnStaffRemovalTasks(supabase).then(result => { if (active) setState({ tasks: result.data, error: result.error }) })
    return () => { active = false }
  }, [])
  async function retry(task) {
    if (busy) return
    setBusy(task.request_key)
    const result = await removeStaffIdentity(supabase, task.user_id, { version: task.version }, 'REMOVE', task.request_key)
    setBusy(null)
    if (result.error || result.data.cleanupPending) {
      setState(value => ({ ...value, error: result.error || { message: 'Auth or photo cleanup is still unavailable. Access remains revoked; retry later.' } }))
      return
    }
    const refreshed = await listOwnStaffRemovalTasks(supabase)
    setState({ tasks: refreshed.data, error: refreshed.error })
  }
  if (!state.tasks.length && !state.error) return null
  return <section className="admin-removal-action" aria-label="Pending removal cleanup"><div><h2>Removal cleanup</h2><p>These people are already hidden and their Pulse access is revoked. Finish the recorded Auth or photo cleanup.</p>{state.error && <p className="admin-operation-error" role="alert">{state.error.message}</p>}</div>
    {state.tasks.map((task, index) => <Button key={task.request_key} type="button" variant="secondary" loading={busy === task.request_key} disabled={Boolean(busy)} onClick={() => void retry(task)}>Retry cleanup{state.tasks.length > 1 ? ` ${index + 1}` : ''}</Button>)}
  </section>
}
