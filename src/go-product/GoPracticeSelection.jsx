import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { resolveGoPracticeDestination } from '../training/goPracticeDestination.js'
import { getGoQuestionBankGroups, listGoPracticeCatalog } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canPractice } from './goAccess.js'
import { classicPracticeLevels } from './goClassicCatalog.js'
import { classifyGoCatalog } from './goModeCatalog.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GoCatalogSection, GoClassicLevelCard, GoCreator, GoLanguageChoices, GoPulseModeChoices, GoSelectionBack, GoSelectionHeading } from './GoSelectionCards.jsx'
import { normalizeCatalog } from './goPracticeModel.js'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

export function GoPracticeSelection() {
  const navigate = useNavigate()
  const access = useGoAccess()
  const destination = resolveGoPracticeDestination(supabase.supabaseUrl)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [catalog, setCatalog] = useState({ items: [], groups: [], loading: false, error: null })

  useEffect(() => {
    if (access.state !== 'allowed' || !canPractice(access.capabilities) || !destination.allowed || !selectedLanguage) return
    let current = true
    const timer = setTimeout(() => {
      setCatalog({ items: [], groups: [], loading: true, error: null })
      void (async () => {
        const listed = await listGoPracticeCatalog(supabase, { language: selectedLanguage })
        const items = normalizeCatalog(listed.data || [])
        const groups = listed.error ? { data: [], error: null }
          : await getGoQuestionBankGroups(supabase, items.map(item => item.id))
        if (current) setCatalog({ items, groups: groups.data || [], loading: false, error: listed.error || groups.error })
      })()
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [access.capabilities, access.state, destination.allowed, selectedLanguage])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canPractice(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state" role="status"><h1>Practice isn’t available here</h1><p>Try again from an enabled Pulse environment.</p><Link to="/go">Back to GO</Link></section></GoShell>

  const isSpanish = selectedLanguage === 'es'
  const classicLevels = classicPracticeLevels(catalog.items, selectedLanguage)
  const { modeItems, otherGames } = classifyGoCatalog(catalog.items, catalog.groups, selectedLanguage)
  const title = !selectedLanguage ? 'Choose language' : selectedMode === 'classic'
    ? isSpanish ? 'Elige la dificultad' : 'Choose difficulty'
    : isSpanish ? 'Elige un juego' : 'Choose a game'

  return <GoShell>
    <GoSelectionHeading eyebrow="Practice" title={title} description={!selectedLanguage ? 'First, choose the language for your game.' : null} art={GO_ART.goal1} />
    {!selectedLanguage && <GoLanguageChoices onSelect={setSelectedLanguage} />}
    {selectedLanguage && !selectedMode && <GoSelectionBack onClick={() => { setSelectedLanguage(''); setSelectedMode('') }}>{isSpanish ? 'Cambiar idioma' : 'Change language'}</GoSelectionBack>}
    {selectedLanguage && <div className="go-live-status" aria-live="polite">{catalog.loading ? isSpanish ? 'Buscando juegos…' : 'Finding challenges…' : catalog.error?.message || ''}</div>}
    {selectedLanguage && !catalog.loading && !catalog.error && !selectedMode && <>
      <GoCatalogSection title={isSpanish ? 'Modos de Pulse' : 'Pulse games'}><GoPulseModeChoices language={selectedLanguage} classicReady={classicLevels.length === 3} modeItems={modeItems} onClassic={() => setSelectedMode('classic')} onMode={(_, item) => navigate(`/go/practice/${item.id}`)} /></GoCatalogSection>
      {!!otherGames.length && <GoCatalogSection creators title={isSpanish ? 'De nuestros creadores' : 'From our creators'} description={isSpanish ? 'Juegos creados y publicados por personas del equipo.' : 'Games created and published by people on the team.'}>{otherGames.map(item => <article className="go-content-card go-content-card--centered" key={item.id}>
        <div className="go-card-visual"><span className="go-card-art"><img src={GO_ART.classic} alt="" /></span></div>
        <h2>{item.title}</h2><p>{item.description || 'A quick way to sharpen what you know.'}</p>
        <GoCreator item={item} />
        {Number(item.question_count) >= 10
          ? <Link to={`/go/practice/${item.id}`}>{isSpanish ? 'Jugar' : 'Play'}</Link>
          : <span className="go-creator-pending" role="status">{isSpanish ? 'Próximamente' : 'Coming soon'}</span>}
      </article>)}</GoCatalogSection>}
    </>}
    {selectedMode === 'classic' && !catalog.loading && !catalog.error && <>
      <GoSelectionBack onClick={() => setSelectedMode('')}>{isSpanish ? 'Cambiar juego' : 'Change game'}</GoSelectionBack>
      {classicLevels.length !== 3 && <p className="go-catalog-warning" role="status">{isSpanish ? `Solo ${classicLevels.length} de 3 niveles están disponibles en este idioma.` : `Only ${classicLevels.length} of 3 levels are ready in this language.`}</p>}
      <section className="go-catalog" aria-label="Classic Quiz levels">{classicLevels.map(item => <GoClassicLevelCard item={item} key={item.id} />)}</section>
    </>}
  </GoShell>
}
