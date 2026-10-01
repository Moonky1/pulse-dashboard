import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { resolveGoPracticeDestination } from '../training/goPracticeDestination.js'
import { listGoPracticeCatalog } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canPractice } from './goAccess.js'
import { classicPracticeLevels } from './goClassicCatalog.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GoCatalogSection, GoClassicLevelCard, GoCreator, GoLanguageChoices, GoPulseModeChoices, GoSelectionBack, GoSelectionHeading } from './GoSelectionCards.jsx'
import { normalizeCatalog } from './goPracticeModel.js'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

export function GoPracticeSelection() {
  const access = useGoAccess()
  const destination = resolveGoPracticeDestination(supabase.supabaseUrl)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [catalog, setCatalog] = useState({ items: [], loading: false, error: null })

  useEffect(() => {
    if (access.state !== 'allowed' || !canPractice(access.capabilities) || !destination.allowed || !selectedLanguage) return
    let current = true
    const timer = setTimeout(() => {
      setCatalog({ items: [], loading: true, error: null })
      void listGoPracticeCatalog(supabase, { language: selectedLanguage }).then(({ data, error }) => {
        if (current) setCatalog({ items: normalizeCatalog(data || []), loading: false, error })
      })
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [access.capabilities, access.state, destination.allowed, selectedLanguage])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canPractice(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state" role="status"><h1>Practice isn’t available here</h1><p>Try again from an enabled Pulse environment.</p><Link to="/go">Back to GO</Link></section></GoShell>

  const isSpanish = selectedLanguage === 'es'
  const classicLevels = classicPracticeLevels(catalog.items, selectedLanguage)
  const classicIds = new Set(classicLevels.map(item => item.id))
  const otherGames = catalog.items.filter(item => !classicIds.has(item.id))
  const title = !selectedLanguage ? 'Choose language' : selectedMode === 'classic'
    ? isSpanish ? 'Elige la dificultad' : 'Choose difficulty'
    : isSpanish ? 'Elige un juego' : 'Choose a game'

  return <GoShell>
    <GoSelectionHeading eyebrow="Practice" title={title} description={!selectedLanguage ? 'First, choose the language for your game.' : null} art={GO_ART.goal1} />
    {!selectedLanguage && <GoLanguageChoices onSelect={setSelectedLanguage} />}
    {selectedLanguage && !selectedMode && <GoSelectionBack onClick={() => { setSelectedLanguage(''); setSelectedMode('') }}>{isSpanish ? 'Cambiar idioma' : 'Change language'}</GoSelectionBack>}
    {selectedLanguage && <div className="go-live-status" aria-live="polite">{catalog.loading ? 'Finding challenges…' : catalog.error?.message || ''}</div>}
    {selectedLanguage && !catalog.loading && !catalog.error && !selectedMode && <>
      <GoCatalogSection title={isSpanish ? 'Modos de Pulse' : 'Pulse games'} description={isSpanish ? 'Los juegos originales, organizados por modo.' : 'Original games, organized by mode.'}><GoPulseModeChoices language={selectedLanguage} classicReady={classicLevels.length === 3} onClassic={() => setSelectedMode('classic')} /></GoCatalogSection>
      <GoCatalogSection title={isSpanish ? 'De nuestros creadores' : 'From our creators'} description={isSpanish ? 'Juegos creados y publicados por personas del equipo.' : 'Games created and published by people on the team.'}>{otherGames.map(item => <article className="go-content-card go-content-card--centered" key={item.id}>
        <div className="go-card-visual"><span className="go-card-art"><img src={GO_ART.classic} alt="" /></span></div>
        <h2>{item.title}</h2><p>{item.description || 'A quick way to sharpen what you know.'}</p>
        <GoCreator item={item} />
        <Link to={`/go/practice/${item.id}`}>{isSpanish ? 'Jugar' : 'Play'}</Link>
      </article>)}{!otherGames.length && <p className="go-catalog-warning" role="status">{isSpanish ? 'Los juegos publicados por el equipo aparecerán aquí cuando tengan al menos 10 preguntas.' : 'Published team games will appear here once they have at least 10 questions.'}</p>}</GoCatalogSection>
    </>}
    {selectedMode === 'classic' && !catalog.loading && !catalog.error && <>
      <GoSelectionBack onClick={() => setSelectedMode('')}>{isSpanish ? 'Cambiar juego' : 'Change game'}</GoSelectionBack>
      {classicLevels.length !== 3 && <p className="go-catalog-warning" role="status">{isSpanish ? `Solo ${classicLevels.length} de 3 niveles están disponibles en este idioma.` : `Only ${classicLevels.length} of 3 levels are ready in this language.`}</p>}
      <section className="go-catalog" aria-label="Classic Quiz levels">{classicLevels.map(item => <GoClassicLevelCard item={item} key={item.id} />)}</section>
    </>}
  </GoShell>
}
