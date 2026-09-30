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
import { classicHostLevels, hostedQuestionCount, questionBankDifficulty } from './goQuestionBankPresentation.js'

export function GoHostSelection() {
  const access = useGoAccess()
  const navigate = useNavigate()
  const destination = resolveGoHostedDestination(supabase.supabaseUrl)
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })
  const [creating, setCreating] = useState(null)
  const [language, setLanguage] = useState('')

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

  const hasClassicBank = catalog.items.some(item => item.question_bank?.game_mode === 'classic')
  const visibleItems = hasClassicBank ? classicHostLevels(catalog.items, language) : catalog.items

  return <GoShell>
    <section className="go-page-heading go-page-heading--with-art">
      <div><p className="go-eyebrow">Host a game</p><h1>{hasClassicBank ? language ? language === 'es' ? 'Elige la dificultad' : 'Choose difficulty' : 'Choose language' : 'Pick what to play'}</h1><p>{hasClassicBank ? language ? language === 'es' ? 'Tres niveles de Classic Quiz · 40 preguntas cada uno' : 'Three Classic Quiz levels · 40 questions each' : 'First, choose the language for your game.' : 'We’ll make the room code'}</p></div>
      <img src={GO_ART.certification} alt="" />
    </section>
    <div className="go-live-status" aria-live="polite">{catalog.loading ? 'Finding host-ready games…' : catalog.error?.message || ''}</div>
    {!catalog.loading && !catalog.error && !catalog.items.length && <section className="go-state"><h2>No games are ready to host</h2><p>Published quizzes and assessments available to you will appear here.</p></section>}
    {hasClassicBank && !language && <section className="go-language-choices" aria-label="Choose game language">
      {[{ code: 'en', name: 'English', note: 'Easy, Medium and Advanced' }, { code: 'es', name: 'Español', note: 'Fácil, Medio y Avanzado' }].map(choice => <button className="go-language-choice" type="button" key={choice.code} onClick={() => setLanguage(choice.code)}>
        <span className="go-language-choice__flag" aria-hidden="true">{languagePresentation(choice.code).flag}</span>
        <strong>{choice.name}</strong><span>{choice.note}</span><span className="go-language-choice__arrow" aria-hidden="true">→</span>
      </button>)}
    </section>}
    {hasClassicBank && language && <div className="go-language-return"><button type="button" onClick={() => setLanguage('')}>← {language === 'es' ? 'Cambiar idioma' : 'Change language'}</button><span>{languagePresentation(language).flag} {language === 'es' ? 'Español' : 'English'}</span></div>}
    {hasClassicBank && language && visibleItems.length !== 3 && <p className="go-catalog-warning" role="status">Only {visibleItems.length} of 3 levels are ready in this language.</p>}
    {(!hasClassicBank || language) && <section className="go-catalog" aria-busy={catalog.loading}>
      {visibleItems.map((item, index) => {
        const language = languagePresentation(item.language)
        return <article className="go-content-card go-content-card--host" key={item.id}>
          <div className="go-card-visual"><span className="go-card-art"><TrainingCover contentId={item.id} mediaId={item.cover_media_id} fallback={index % 2 ? GO_ART.classic : GO_ART.certification} /><i aria-hidden="true">LIVE</i></span><span className="go-language"><b aria-hidden="true">{language.flag}</b>{language.label}</span></div>
          <div className="go-card-meta"><span>{item.question_bank ? 'Classic Quiz' : item.content_type}</span><span>Team game</span></div>
          <h2>{questionBankDifficulty(item.question_bank, item.language) || item.title}</h2>
          <p>{item.question_bank ? item.language === 'es' ? 'Reúne a tu equipo para un reto de Pulse GO.' : 'Bring your team together for a Pulse GO challenge.' : item.description || 'Ready for your team.'}</p>
          {item.creator_label && <p className="go-creator">{item.creator_label}</p>}
          <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>{hostedQuestionCount(item)}</strong> {item.language === 'es' ? 'preguntas' : 'questions'}</div>
          <div className="go-topic-list">{item.topics?.map(topic => <span key={topic.id}>{topic.name}</span>)}</div>
          <Button loading={creating === item.id} disabled={creating !== null} onClick={() => void createRoom(item.id)}>{item.language === 'es' ? 'Crear sala' : 'Create room'}</Button>
        </article>
      })}
    </section>}
  </GoShell>
}
