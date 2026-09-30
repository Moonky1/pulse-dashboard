import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoHostedDestination } from '../training/goHostedDestination.js'
import { createGoHostedSession, enrichGameItems, listGoHostCatalog } from '../training/trainingApi.js'
import { TrainingCover } from '../training/TrainingCover.jsx'
import { supabase } from '../utils/supabase.js'
import { canHost } from './goAccess.js'
import { languagePresentation, roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'
import { hostedQuestionCount, questionBankModeOptions, questionBankTitle } from './goQuestionBankPresentation.js'

export function GoHostSelection() {
  const access = useGoAccess()
  const navigate = useNavigate()
  const destination = resolveGoHostedDestination(supabase.supabaseUrl)
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })
  const [creating, setCreating] = useState(null)
  const [mode, setMode] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [difficulty, setDifficulty] = useState('')

  useEffect(() => {
    if (access.state !== 'allowed' || !canHost(access.capabilities) || !destination.allowed) return
    let current = true
    void listGoHostCatalog(supabase).then(async ({ data, error }) => {
      const items = error ? [] : await enrichGameItems(supabase, data || [])
      if (current) setCatalog({ items, loading: false, error })
    })
    return () => { current = false }
  }, [access.capabilities, access.state, destination.allowed])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canHost(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Hosting is not enabled here</h1><p>No room was created.</p><Link to="/go">Back to GO</Link></section></GoShell>

  async function createRoom(contentId) {
    setCreating(contentId)
    const { data, error } = await createGoHostedSession(supabase, contentId)
    setCreating(null)
    if (error) return setCatalog(value => ({ ...value, error }))
    navigate(roomPath(data))
  }

  return <GoShell>
    <section className="go-page-heading go-page-heading--with-art">
      <div><p className="go-eyebrow">Host a game</p><h1>Pick what to play</h1><p>We’ll make the room code</p></div>
      <img src={GO_ART.certification} alt="" />
    </section>
    <div className="go-live-status" aria-live="polite">{catalog.loading ? 'Finding host-ready games…' : catalog.error?.message || ''}</div>
    {!!catalog.items.some(item => item.question_bank) && <section className="go-filterbar" aria-label="Choose your GO game">
      <label>Game mode<select value={mode} onChange={event => { setMode(event.target.value); setDifficulty('') }}><option value="">All modes</option>{questionBankModeOptions(catalog.items).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label>Language<select value={languageFilter} onChange={event => setLanguageFilter(event.target.value)}><option value="">Both languages</option><option value="en">English</option><option value="es">Español</option></select></label>
      <label>Difficulty<select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="">All levels</option>{['easy','medium','advanced'].map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
    </section>}
    {!catalog.loading && !catalog.error && !catalog.items.length && <section className="go-state"><h2>No games are ready to host</h2><p>Published quizzes and assessments available to you will appear here.</p></section>}
    <section className="go-catalog" aria-busy={catalog.loading}>
      {catalog.items.filter(item => (!mode || item.question_bank?.game_mode === mode) && (!languageFilter || item.language === languageFilter) && (!difficulty || item.question_bank?.difficulty === difficulty)).map((item, index) => {
        const language = languagePresentation(item.language)
        return <article className="go-content-card go-content-card--host" key={item.id}>
          <div className="go-card-visual"><span className="go-card-art"><TrainingCover contentId={item.id} mediaId={item.cover_media_id} fallback={index % 2 ? GO_ART.classic : GO_ART.certification} /><i aria-hidden="true">LIVE</i></span><span className="go-language"><b aria-hidden="true">{language.flag}</b>{language.label}</span></div>
          <div className="go-card-meta"><span>{item.content_type}</span><span>{item.question_bank ? 'Preview beta' : 'Team game'}</span></div>
          <h2>{questionBankTitle(item.question_bank) || item.title}</h2>
          <p>{item.question_bank ? 'Bring your team together for a Pulse GO challenge.' : item.description || 'Ready for your team.'}</p>
          {item.creator_label && <p className="go-creator">{item.creator_label}</p>}
          <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>{hostedQuestionCount(item)}</strong> questions</div>
          <div className="go-topic-list">{item.topics?.map(topic => <span key={topic.id}>{topic.name}</span>)}</div>
          <Button loading={creating === item.id} disabled={creating !== null} onClick={() => void createRoom(item.id)}>Create room</Button>
        </article>
      })}
    </section>
  </GoShell>
}
