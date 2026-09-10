import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoHostedDestination } from '../training/goHostedDestination.js'
import { createGoHostedSession, listGoHostCatalog } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canHost } from './goAccess.js'
import { languagePresentation, roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { useGoAccess } from './useGoAccess.js'

export function GoHostSelection() {
  const access = useGoAccess()
  const navigate = useNavigate()
  const destination = resolveGoHostedDestination(supabase.supabaseUrl)
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })
  const [creating, setCreating] = useState(null)

  useEffect(() => {
    if (access.state !== 'allowed' || !canHost(access.capabilities) || !destination.allowed) return
    let current = true
    void listGoHostCatalog(supabase).then(({ data, error }) => {
      if (current) setCatalog({ items: data || [], loading: false, error })
    })
    return () => { current = false }
  }, [access.capabilities, access.state, destination.allowed])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canHost(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Hosting is not enabled here.</h1><p>No room was created.</p><Link to="/go">Back to GO</Link></section></GoShell>

  async function createRoom(contentId) {
    setCreating(contentId)
    const { data, error } = await createGoHostedSession(supabase, contentId)
    setCreating(null)
    if (error) return setCatalog(value => ({ ...value, error }))
    navigate(roomPath(data))
  }

  return <GoShell>
    <section className="go-page-heading go-page-heading--with-art">
      <div><p className="go-eyebrow">Host a live game</p><h1>Choose the challenge</h1><p>Your players join with one short code.</p></div>
      <img src="/emojis/certification.webp" alt="" />
    </section>
    <div className="go-live-status" aria-live="polite">{catalog.loading ? 'Finding host-ready games…' : catalog.error?.message || ''}</div>
    {!catalog.loading && !catalog.error && !catalog.items.length && <section className="go-state"><h2>No games are ready to host.</h2><p>Published quizzes and assessments in your scope will appear here.</p></section>}
    <section className="go-catalog" aria-busy={catalog.loading}>
      {catalog.items.map(item => {
        const language = languagePresentation(item.language)
        return <article className="go-content-card go-content-card--host" key={item.id}>
          <div className="go-card-meta"><span>{item.content_type}</span><span className="go-language"><b aria-hidden="true">{language.flag}</b>{language.label}</span></div>
          <h2>{item.title}</h2>
          <p>{item.description || 'A live challenge for your team.'}</p>
          <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>{item.question_count}</strong> questions</div>
          <div className="go-topic-list">{item.topics?.map(topic => <span key={topic.id}>{topic.name}</span>)}</div>
          <Button loading={creating === item.id} disabled={creating !== null} onClick={() => void createRoom(item.id)}>Create room</Button>
        </article>
      })}
    </section>
  </GoShell>
}
