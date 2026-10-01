import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoHostedDestination } from '../training/goHostedDestination.js'
import { createGoHostedSession, listGoHostCatalog } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canHost } from './goAccess.js'
import { classicHostLevels, isPublishedClassicLevel } from './goClassicCatalog.js'
import { languagePresentation, roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GoFlag } from './GoFlag.jsx'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

const LEVEL_DESCRIPTIONS = {
  en: {
    easy: 'Basics for new agents: consent, eligibility and safe wording.',
    medium: 'Real scenarios for quality judgment and call-flow decisions.',
    advanced: 'Challenging consent, handoff, eligibility and compliance scenarios.',
  },
  es: {
    easy: 'Fundamentos: consentimiento, elegibilidad y lenguaje seguro.',
    medium: 'Escenarios para evaluar decisiones de calidad y flujo de llamadas.',
    advanced: 'Casos exigentes de consentimiento, transferencias y cumplimiento.',
  },
}

export function GoHostSelection() {
  const access = useGoAccess()
  const navigate = useNavigate()
  const destination = resolveGoHostedDestination(supabase.supabaseUrl)
  const [catalog, setCatalog] = useState({ items: [], loading: true, error: null })
  const [creating, setCreating] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')

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
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Hosting is not enabled here</h1><p>No room was created.</p><Link to="/go">Back to GO</Link></section></GoShell>

  async function createRoom(contentId) {
    setCreating(contentId)
    const { data, error } = await createGoHostedSession(supabase, contentId)
    setCreating(null)
    if (error) return setCatalog(value => ({ ...value, error }))
    navigate(roomPath(data))
  }

  const hasClassicCatalog = catalog.items.some(isPublishedClassicLevel)
  const visibleItems = hasClassicCatalog
    ? classicHostLevels(catalog.items, selectedLanguage)
    : catalog.items
  const isSpanish = selectedLanguage === 'es'

  return <GoShell>
    <section className="go-page-heading go-page-heading--with-art">
      <div><p className="go-eyebrow">Host a game</p><h1>{hasClassicCatalog ? selectedLanguage ? isSpanish ? 'Elige la dificultad' : 'Choose difficulty' : 'Choose language' : 'Pick what to play'}</h1>{(!hasClassicCatalog || !selectedLanguage) && <p>{hasClassicCatalog ? 'First, choose the language for your game.' : 'We’ll make the room code'}</p>}</div>
      <img src={GO_ART.certification} alt="" />
    </section>
    <div className="go-live-status" aria-live="polite">{catalog.loading ? 'Finding host-ready games…' : catalog.error?.message || ''}</div>
    {!catalog.loading && !catalog.error && !catalog.items.length && <section className="go-state"><h2>No games are ready to host</h2><p>Published quizzes and assessments available to you will appear here.</p></section>}
    {hasClassicCatalog && !selectedLanguage && <section className="go-language-choices" aria-label="Choose game language">
      {[{ code: 'en', name: 'English' }, { code: 'es', name: 'Español' }].map(choice => <button className="go-language-choice" type="button" key={choice.code} onClick={() => setSelectedLanguage(choice.code)}>
        <span className="go-language-choice__flag"><GoFlag language={choice.code} /></span>
        <strong>{choice.name}</strong><span className="go-language-choice__arrow" aria-hidden="true">→</span>
      </button>)}
    </section>}
    {hasClassicCatalog && selectedLanguage && <div className="go-language-return"><button type="button" onClick={() => setSelectedLanguage('')}>← {isSpanish ? 'Cambiar idioma' : 'Change language'}</button><span><GoFlag language={selectedLanguage} /> {isSpanish ? 'Español' : 'English'}</span></div>}
    {hasClassicCatalog && selectedLanguage && visibleItems.length !== 3 && <p className="go-catalog-warning" role="status">{isSpanish ? `Solo ${visibleItems.length} de 3 niveles están disponibles en este idioma.` : `Only ${visibleItems.length} of 3 levels are ready in this language.`}</p>}
    {(!hasClassicCatalog || selectedLanguage) && <section className="go-catalog" aria-busy={catalog.loading}>
      {visibleItems.map((item, index) => {
        const language = languagePresentation(item.language)
        return <article className={`go-content-card go-content-card--host${item.level ? ' go-content-card--classic-level' : ''}`} key={item.id}>
          <div className="go-card-visual"><span className="go-card-art"><img src={item.level ? GO_ART[item.level] : index % 2 ? GO_ART.classic : GO_ART.certification} alt="" />{!item.level && <i aria-hidden="true">LIVE</i>}</span>{!item.level && <span className="go-language"><GoFlag language={item.language} />{language.label}</span>}</div>
          {!item.level && <div className="go-card-meta"><span>{item.content_type}</span><span>Team game</span></div>}
          <h2>{item.levelLabel || item.title}</h2>
          <p>{item.level ? LEVEL_DESCRIPTIONS[item.language][item.level] : item.description || 'Ready for your team.'}</p>
          <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>{item.question_count}</strong> {item.language === 'es' ? 'preguntas' : 'questions'}</div>
          {!item.level && <div className="go-topic-list">{item.topics?.map(topic => <span key={topic.id}>{topic.name}</span>)}</div>}
          <Button loading={creating === item.id} disabled={creating !== null} onClick={() => void createRoom(item.id)}>{item.language === 'es' ? 'Crear sala' : 'Create room'}</Button>
        </article>
      })}
    </section>}
  </GoShell>
}
