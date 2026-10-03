import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { resolveGoHostedDestination } from '../training/goHostedDestination.js'
import { cancelGoHostedSession, createGoHostedSession, getGoGameIdentity, getGoQuestionBankGroups, getMyGoHostedSession, listGoHostCatalog } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canHost } from './goAccess.js'
import { classicHostLevels } from './goClassicCatalog.js'
import { classifyGoCatalog } from './goModeCatalog.js'
import { roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GoCatalogSection, GoClassicLevelCard, GoCreator, GoLanguageChoices, GoPulseModeChoices, GoSelectionBack, GoSelectionHeading } from './GoSelectionCards.jsx'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

export function GoHostSelection() {
  const access = useGoAccess()
  const navigate = useNavigate()
  const destination = resolveGoHostedDestination(supabase.supabaseUrl)
  const [catalog, setCatalog] = useState({ items: [], groups: [], loading: true, error: null })
  const [creating, setCreating] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedMode, setSelectedMode] = useState('')
  const [existingRoom, setExistingRoom] = useState(null)
  const [recoveryError, setRecoveryError] = useState(null)

  useEffect(() => {
    if (access.state !== 'allowed' || !canHost(access.capabilities) || !destination.allowed) return
    let current = true
    void (async () => {
      const listed = await listGoHostCatalog(supabase)
      const items = listed.data || []
      const [groups, identity] = listed.error ? [{ data: [], error: null }, { data: [], error: null }]
        : await Promise.all([
          getGoQuestionBankGroups(supabase, items.map(item => item.id)),
          getGoGameIdentity(supabase, items.map(item => item.id)),
        ])
      const byId = new Map((identity.data || []).map(item => [item.id, item]))
      if (current) setCatalog({ items: items.map(item => ({ ...item, ...byId.get(item.id) })), groups: groups.data || [], loading: false, error: listed.error || groups.error || identity.error })
    })()
    return () => { current = false }
  }, [access.capabilities, access.state, destination.allowed])

  if (access.state !== 'allowed') return <GoAccessState access={access} />
  if (!canHost(access.capabilities)) return <GoAccessState access={{ state: 'denied' }} />
  if (!destination.allowed) return <GoShell><section className="go-state"><h1>Hosting is not enabled here</h1><p>No room was created.</p><Link to="/go">Back to GO</Link></section></GoShell>

  async function createRoom(contentId) {
    setCreating(contentId)
    const { data, error } = await createGoHostedSession(supabase, contentId)
    setCreating(null)
    if (error) {
      const current = await getMyGoHostedSession(supabase)
      if (current.data && !current.error) {
        setExistingRoom({ room: current.data, requestedContentId: contentId })
        setRecoveryError(null)
        return
      }
      return setCatalog(value => ({ ...value, error }))
    }
    navigate(roomPath(data))
  }

  async function closeCurrentAndHost() {
    if (!existingRoom || creating) return
    setCreating(existingRoom.requestedContentId)
    setRecoveryError(null)
    const { error } = await cancelGoHostedSession(supabase, existingRoom.room.session_id, existingRoom.room.version)
    setCreating(null)
    if (error) {
      setRecoveryError(error.message)
      const current = await getMyGoHostedSession(supabase)
      if (current.data) setExistingRoom(value => ({ ...value, room: current.data }))
      return
    }
    const nextContentId = existingRoom.requestedContentId
    setExistingRoom(null)
    await createRoom(nextContentId)
  }

  const classicLevels = classicHostLevels(catalog.items, selectedLanguage)
  const { modeItems, otherGames: creatorGames } = classifyGoCatalog(
    catalog.items.filter(item => item.language === selectedLanguage), catalog.groups, selectedLanguage)
  const otherGames = creatorGames
  const isSpanish = selectedLanguage === 'es'
  const title = !selectedLanguage ? 'Choose language' : selectedMode === 'classic'
    ? isSpanish ? 'Elige la dificultad' : 'Choose difficulty'
    : isSpanish ? 'Elige un juego' : 'Choose a game'

  return <GoShell>
    <GoSelectionHeading eyebrow={isSpanish ? 'Organiza una partida' : 'Host a game'} title={title} description={!selectedLanguage ? 'First, choose the language for your game.' : null} art={GO_ART.certification} />
    <div className="go-live-status" aria-live="polite">{catalog.loading ? isSpanish ? 'Buscando juegos para organizar…' : 'Finding host-ready games…' : catalog.error?.message || ''}</div>
    {existingRoom && <section className="go-host-recovery" role="region" aria-label={isSpanish ? 'Sala activa' : 'Active room'}>
      <h2>{isSpanish ? 'Ya tienes una sala abierta' : 'You already have a room open'}</h2>
      <p>{existingRoom.room.status === 'lobby' ? isSpanish ? 'Cierra la sala en espera para crear otra, o vuelve a la sala actual.' : 'Close the waiting room to host another game, or return to your current room.' : isSpanish ? 'Tu juego en vivo sigue activo. Vuelve a él para continuarlo.' : 'Your live game is still active. Return to it to continue.'}</p>
      {recoveryError && <p className="go-inline-error" role="alert">{recoveryError}</p>}
      <div className="go-host-recovery__actions"><Button variant="secondary" onClick={() => navigate(roomPath(existingRoom.room))}>{isSpanish ? 'Volver a la sala' : 'Return to room'}</Button>{existingRoom.room.status === 'lobby' && <Button loading={!!creating} disabled={!!creating} onClick={() => void closeCurrentAndHost()}>{isSpanish ? 'Cerrar y crear otra' : 'Close current room and host another'}</Button>}<Button variant="ghost" onClick={() => setExistingRoom(null)}>{isSpanish ? 'Seguir aquí' : 'Stay here'}</Button></div>
    </section>}
    {!catalog.loading && !catalog.error && !selectedLanguage && <GoLanguageChoices onSelect={setSelectedLanguage} />}
    {selectedLanguage && !selectedMode && <GoSelectionBack onClick={() => { setSelectedLanguage(''); setSelectedMode('') }}>{isSpanish ? 'Cambiar idioma' : 'Change language'}</GoSelectionBack>}
    {selectedLanguage && !catalog.loading && !catalog.error && !selectedMode && <>
      <GoCatalogSection title={isSpanish ? 'Modos de Pulse' : 'Pulse games'}><GoPulseModeChoices language={selectedLanguage} classicReady={classicLevels.length === 3} modeItems={modeItems} onClassic={() => setSelectedMode('classic')} onMode={(_, item) => void createRoom(item.id)} host creating={creating} /></GoCatalogSection>
      {!!otherGames.length && <GoCatalogSection creators title={isSpanish ? 'De nuestros creadores' : 'From our creators'} description={isSpanish ? 'Juegos creados y publicados por personas del equipo.' : 'Games created and published by people on the team.'}>{otherGames.map(item => <article className="go-content-card go-content-card--centered" key={item.id}>
        <div className="go-card-visual"><span className="go-card-art"><img src={GO_ART.classic} alt="" /></span></div>
        <h2>{item.title}</h2><p>{item.description || 'Ready for your team.'}</p>
        <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>10</strong> {isSpanish ? 'por ronda' : 'per round'}</div>
        <GoCreator item={item} />
        <Button loading={creating === item.id} disabled={creating !== null} onClick={() => void createRoom(item.id)}>{isSpanish ? 'Crear sala' : 'Create room'}</Button>
      </article>)}</GoCatalogSection>}
    </>}
    {selectedMode === 'classic' && <>
      <GoSelectionBack onClick={() => setSelectedMode('')}>{isSpanish ? 'Cambiar juego' : 'Change game'}</GoSelectionBack>
      {classicLevels.length !== 3 && <p className="go-catalog-warning" role="status">{isSpanish ? `Solo ${classicLevels.length} de 3 niveles están disponibles en este idioma.` : `Only ${classicLevels.length} of 3 levels are ready in this language.`}</p>}
      <section className="go-catalog" aria-label="Classic Quiz levels">{classicLevels.map(item => <GoClassicLevelCard item={item} key={item.id} onCreate={createRoom} creating={creating} />)}</section>
    </>}
  </GoShell>
}
