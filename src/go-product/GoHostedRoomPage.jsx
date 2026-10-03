import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import lobbyMusic from '../../public/audio/wii-party-main-menu.mp3'
import { Button } from '../components/ui/Button.jsx'
import { advanceGoHostedSession, cancelGoHostedSession, getGoHostedResults, getGoQuestionBankGroups, startGoHostedSession, submitGoHostedAnswer } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { hostedAnswerReady, languagePresentation, resultMedal } from './goHostedModel.js'
import { GoShell } from './GoShell.jsx'
import { GoFlag } from './GoFlag.jsx'
import { GO_ART, resolveGoArt } from './goVisualAssets.js'
import { HostedAnswerControl } from './HostedAnswerControl.jsx'
import { modeForContent } from './goModeCatalog.js'
import { GoModeAnswers, GoModePrompt } from './GoModeQuestion.jsx'
import { orderedModeOptions } from './goOptionOrder.js'
import { goModeResultLine, goResultHeading } from './goModeCopy.js'
import { GoQuestionCountdown } from './GoQuestionCountdown.jsx'
import { GoSoundToggle } from './GoSoundToggle.jsx'
import { playGoSound, primeGoSound } from './goSoundEffects.js'
import { useHostedRoom } from './useHostedRoom.js'
import { useQuestionCountdown } from './useQuestionCountdown.js'

function RoomHeader({ room }) {
  const language = languagePresentation(room.content.language)
  const es = room.content.language === 'es'
  return <header className="go-room-heading">
    <div><p className="go-eyebrow">{room.viewer_role === 'host' ? es ? 'SALA EN VIVO' : 'HOSTING LIVE' : es ? 'JUEGO EN VIVO' : 'LIVE GAME'}</p><h1>{room.content.title}</h1><p><GoFlag language={room.content.language} /> {language.label} · {room.question_count} {es ? 'preguntas' : 'questions'}</p></div>
    <div className="go-room-header-tools"><GoSoundToggle language={room.content.language} /><div className="go-room-code"><img src={GO_ART.classic} alt="" /><div><span>{es ? 'Código de acceso' : 'Join with'}</span><strong>{room.room_code}</strong></div></div></div>
  </header>
}

function Lobby({ room, action, busy, error }) {
  const isHost = room.viewer_role === 'host'
  const es = room.content.language === 'es'
  const music = useRef(null)
  const [musicOn, setMusicOn] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  useEffect(() => () => { music.current?.pause() }, [])

  async function copyInvite() {
    try {
      await globalThis.navigator.clipboard.writeText(`${globalThis.location.origin}/go?code=${encodeURIComponent(room.room_code)}`)
      setInviteCopied(true)
    } catch {
      setInviteCopied(false)
    }
  }

  async function toggleMusic() {
    if (!music.current) return
    if (musicOn) {
      music.current.pause()
      setMusicOn(false)
      return
    }
    try {
      music.current.loop = true
      await music.current.play()
      setMusicOn(true)
    } catch {
      setMusicOn(false)
    }
  }
  return <>
    <div className="go-lobby-banner"><div className="go-lobby-invite"><span>{es ? 'Código de sala' : 'Room code'}</span><strong>{room.room_code}</strong><button type="button" onClick={() => void copyInvite()}>{inviteCopied ? es ? 'Enlace copiado ✓' : 'Link copied ✓' : es ? 'Copiar invitación' : 'Copy invite link'}</button></div><span><GoFlag language={room.content.language} /> {languagePresentation(room.content.language).label} · {room.content.title}</span></div>
    <section className="go-lobby-stage">
      <h1><span aria-hidden="true">⌛</span> {es ? 'Esperando jugadores…' : 'Waiting for players...'}</h1>
      <p>{room.participant_count ? es ? 'Listos para comenzar cuando todos hayan entrado.' : 'Ready to begin when everyone has joined.' : es ? 'Aún no hay jugadores. Comparte el código.' : 'No players yet — share the code!'}</p>
      <strong className="go-lobby-count">{room.participant_count} {es ? room.participant_count === 1 ? 'jugador listo' : 'jugadores listos' : room.participant_count === 1 ? 'player ready' : 'players ready'}</strong>
      {!!room.participants.length && <div className="go-player-roster" aria-live="polite">{room.participants.map(player => <div key={player.seat}><span className={`go-player-marker go-player-marker--${(Number(player.seat) || 0) % 4}`}>{player.name.slice(0, 1).toUpperCase()}</span><strong>{player.name}</strong><small>{es ? 'Listo' : 'Ready'} ✓</small></div>)}</div>}
      {isHost && <><audio ref={music} src={lobbyMusic} preload="none" /><button type="button" className="go-lobby-music" aria-pressed={musicOn} onClick={() => void toggleMusic()}>♫ {es ? 'Música de sala' : 'Lobby Music'} {musicOn ? es ? 'Activada' : 'On' : es ? 'Desactivada' : 'Off'}</button></>}
      {!isHost && <p>{es ? 'El anfitrión iniciará la primera pregunta.' : 'The host will start the first question.'}</p>}
      {error && <p className="go-inline-error" role="alert">{error}</p>}
      {isHost && <div className="go-room-actions"><Button loading={busy === 'start'} disabled={!room.participant_count || !!busy} onClick={() => action('start')}>{es ? 'Iniciar juego' : 'Start game'}</Button><Button variant="ghost" loading={busy === 'cancel'} disabled={!!busy} onClick={() => action('cancel')}>{es ? 'Cancelar sala' : 'Cancel room'}</Button></div>}
    </section>
  </>
}

function HostQuestion({ room, mode, timing, action, busy, error }) {
  const question = room.current_question
  const es = room.content.language === 'es'
  const { remainingMs, secondsLeft, expired } = useQuestionCountdown(timing)
  const allAnswered = room.participant_count > 0 && room.answered_count === room.participant_count
  return <>
    <RoomHeader room={room} />
    <section className="go-live-question go-live-question--host">
      <div className="go-question-counter"><span>{es ? 'Pregunta' : 'Question'} {question.position} {es ? 'de' : 'of'} {room.question_count}</span><strong>{room.answered_count}/{room.participant_count} {es ? 'respondieron' : 'answered'}</strong></div>
      <GoQuestionCountdown timing={timing} remainingMs={remainingMs} secondsLeft={secondsLeft} language={room.content.language} />
      <article className={`go-live-question__card go-live-question__card--${mode}`} key={question.id}><GoModePrompt mode={mode} question={question} language={room.content.language} heading="h2" />{question.question_type !== 'text' && <div className={`go-host-options go-host-options--${mode}`}>{question.answer_options.length ? orderedModeOptions(question, mode, room.session_id).map(({ option, originalIndex }, displayIndex) => <span key={originalIndex}>{mode === 'classic' ? `${String.fromCharCode(65 + displayIndex)}. ` : ''}{(mode === 'valid-invalid' || mode === 'eligible') && <b aria-hidden="true">{originalIndex === 0 ? '✓ ' : '× '}</b>}{option}</span>) : <><span>{es ? 'Verdadero' : 'True'}</span><span>{es ? 'Falso' : 'False'}</span></>}</div>}</article>
      <div className="go-answer-meter" aria-label={`${room.answered_count} of ${room.participant_count} answered`}><span style={{ width: `${room.participant_count ? room.answered_count / room.participant_count * 100 : 0}%` }} /></div>
      {error && <p className="go-inline-error" role="alert">{error}</p>}
      <div className="go-room-actions"><Button loading={busy === 'advance'} disabled={!!busy || (!expired && !allAnswered)} onClick={() => action('advance')}>{question.position === room.question_count ? es ? 'Terminar juego' : 'Finish game' : es ? 'Siguiente pregunta' : 'Next question'}</Button><Button variant="ghost" loading={busy === 'cancel'} disabled={!!busy} onClick={() => action('cancel')}>{es ? 'Cancelar juego' : 'Cancel game'}</Button></div>
    </section>
  </>
}

function PlayerQuestion({ room, mode, timing, submit, busy, error }) {
  const [answer, setAnswer] = useState(undefined)
  const question = room.current_question
  const es = room.content.language === 'es'
  const { remainingMs, secondsLeft, expired } = useQuestionCountdown(timing)
  return <>
    <RoomHeader room={room} />
    <section className="go-live-question">
      <div className="go-question-counter"><span>{es ? 'Pregunta' : 'Question'} {question.position} {es ? 'de' : 'of'} {room.question_count}</span><strong>{room.my_answered ? es ? 'Respuesta enviada ✓' : 'Answer locked ✓' : expired ? es ? 'Tiempo agotado' : 'Time is up' : es ? 'Elige tu respuesta' : 'Choose your answer'}</strong></div>
      <GoQuestionCountdown timing={timing} remainingMs={remainingMs} secondsLeft={secondsLeft} language={room.content.language} />
      <article className={`go-live-question__card go-live-question__card--${mode}`}><GoModePrompt mode={mode} question={question} language={room.content.language} heading="h2" />
        {mode === 'classic' ? <HostedAnswerControl question={question} answer={answer} onChange={setAnswer} disabled={room.my_answered || busy || expired || !timing} language={room.content.language} />
          : <GoModeAnswers mode={mode} question={question} answer={answer} onChange={setAnswer} disabled={room.my_answered || busy || expired || !timing} language={room.content.language} optionSeed={room.session_id} />}</article>
      {error && <p className="go-inline-error" role="alert">{error}</p>}
      <footer><span>{room.my_answered ? es ? 'Esperando al anfitrión…' : 'Waiting for the host…' : expired ? es ? 'Tiempo agotado. Esperando al anfitrión…' : 'Time is up. Waiting for the host…' : es ? 'Tu respuesta será definitiva al enviarla' : 'Your answer is final once sent'}</span><Button loading={busy} disabled={room.my_answered || busy || expired || !timing || !hostedAnswerReady(question, answer)} onClick={() => void submit(answer)}>{es ? 'Enviar respuesta' : 'Submit answer'}</Button></footer>
    </section>
  </>
}

function Results({ room, mode }) {
  const es = room.content.language === 'es'
  const [ranking, setRanking] = useState({ items: [], loading: room.viewer_role === 'host', error: null })
  useEffect(() => {
    if (room.viewer_role !== 'host') return
    let current = true
    void getGoHostedResults(supabase, room.session_id).then(({ data, error }) => {
      if (current) setRanking({ items: Array.isArray(data) ? data : [], loading: false, error })
    })
    return () => { current = false }
  }, [room.session_id, room.viewer_role])
  const personal = room.my_result
  const score = personal?.score_percent ?? room.host_summary?.average_score ?? 0
  const medal = resultMedal(score)
  const leaders = ranking.items.slice(0, 10)
  const needsReview = ranking.items.filter(player => Number(player.score_percent) < 80 || Number(player.total_questions) - Number(player.correct_answers) >= 3).slice(0, 10)
  const winner = ranking.items[0]
  return <section className="go-hosted-result" role="status">
    <div className="go-result-art" aria-hidden="true"><img src={room.viewer_role === 'host' ? GO_ART.goal1 : resolveGoArt(medal.image)} alt="" /></div>
    <p className="go-eyebrow">{es ? 'JUEGO TERMINADO' : 'GAME COMPLETE'}</p><h1>{room.viewer_role === 'host' ? es ? 'Resultados finales' : 'Final Results' : goResultHeading(score, room.content.language)}</h1>
    <p>{room.room_code} · {room.question_count} {es ? 'preguntas' : 'questions'}</p>
    {personal ? <><strong className="go-result-score">{Math.round(Number(personal.score_percent))}%</strong><p>{goModeResultLine(mode, personal.correct_answers, personal.total_questions, room.content.language)}</p>{!!personal.topic_breakdown?.length && <div className="go-result-topics">{personal.topic_breakdown.map(topic => <div key={topic.topic_id}><strong>{topic.topic_name}</strong><span>{topic.correct_answers}/{topic.total_questions}</span></div>)}</div>}</> : <div className="go-host-summary"><div><strong>{room.host_summary.players}</strong><span>{es ? 'Jugadores' : 'Players'}</span></div><div><strong>{Math.round(Number(room.host_summary.average_score))}%</strong><span>{es ? 'Promedio' : 'Average'}</span></div><div><strong>{room.host_summary.completed_results}</strong><span>{es ? 'Resultados guardados' : 'Results saved'}</span></div></div>}
    {ranking.loading && <p>{es ? 'Cargando posiciones finales…' : 'Loading final standings…'}</p>}
    {ranking.error && <p className="go-inline-error" role="alert">{es ? 'Las posiciones finales no están disponibles ahora' : 'Final standings are unavailable right now'}</p>}
    {winner && <div className="go-results-podium"><img src={GO_ART.goal1} alt="" /><span>{es ? '1.er lugar' : '1st place'}</span><strong>{winner.name}</strong><img src={GO_ART.medal1} alt="" /><b>{winner.correct_answers}/{winner.total_questions} · {Math.round(Number(winner.score_percent))}%</b></div>}
    {!!leaders.length && <div className="go-results-section"><header><div><span>{es ? 'CLASIFICACIÓN' : 'LEADERBOARD'}</span><h2>{es ? 'Mejores resultados' : 'Top Performers'}</h2></div><strong>Top {leaders.length}</strong></header><ol>{leaders.map((player, index) => <li key={player.seat}><span>{index < 3 ? <img src={GO_ART[`medal${index + 1}`]} alt="" /> : `#${index + 1}`}</span><strong>{player.name}<small>{player.correct_answers}/{player.total_questions} {es ? 'correctas' : 'correct'}</small></strong><b>{Math.round(Number(player.score_percent))}%</b></li>)}</ol></div>}
    {!!needsReview.length && <div className="go-results-section go-results-section--review"><header><div><span>{es ? 'REVISIÓN DE DESEMPEÑO' : 'PERFORMANCE REVIEW'}</span><h2>{es ? 'Para reforzar' : 'Low Performers'}</h2></div><strong>{needsReview.length} {es ? 'por revisar' : 'flagged'}</strong></header><ol>{needsReview.map(player => <li key={player.seat}><span><img src={GO_ART.zero2} alt="" /></span><strong>{player.name}<small>{player.correct_answers}/{player.total_questions} {es ? 'correctas' : 'correct'} · {Number(player.total_questions) - Number(player.correct_answers)} {es ? 'sin acertar' : 'missed'}</small></strong><b>{Math.round(Number(player.score_percent))}%</b></li>)}</ol></div>}
    {!!ranking.items.length && <div className="go-results-section"><header><div><span>{es ? 'TODOS LOS RESULTADOS' : 'FULL RESULTS'}</span><h2>{es ? 'Participantes' : 'Participants'}</h2></div><strong>{ranking.items.length} {es ? 'jugadores' : 'players'}</strong></header><ol>{ranking.items.map((player, index) => <li key={player.seat}><span>#{index + 1}</span><strong>{player.name}<small>{player.correct_answers}/{player.total_questions} {es ? 'correctas' : 'correct'}</small></strong><b>{Math.round(Number(player.score_percent))}%</b></li>)}</ol></div>}
    <Link className="go-primary" to="/go">{es ? 'Volver a GO' : 'Back to GO'}</Link>
  </section>
}

export function GoHostedRoomPage({ expectedViewer }) {
  const { sessionId } = useParams()
  const state = useHostedRoom(sessionId)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const room = state.room
  const [modeState, setModeState] = useState({ contentId: null, mode: null })
  const previousStatus = useRef(null)

  useEffect(() => {
    if (previousStatus.current === 'active' && room?.status === 'completed') playGoSound('complete')
    if (room?.status) previousStatus.current = room.status
  }, [room?.status])

  useEffect(() => {
    if (!room?.content?.id) return
    let current = true
    void getGoQuestionBankGroups(supabase, [room.content.id]).then(({ data }) => {
      if (current) setModeState({ contentId: room.content.id, mode: modeForContent(data, room.content.id) })
    })
    return () => { current = false }
  }, [room?.content?.id])

  async function hostAction(kind) {
    if (kind === 'advance') primeGoSound()
    setBusy(kind); setError(null)
    const call = kind === 'start' ? startGoHostedSession : kind === 'advance' ? advanceGoHostedSession : cancelGoHostedSession
    const response = await call(supabase, sessionId, room.version)
    setBusy(null)
    if (response.error) setError(response.error.message)
    else await state.refresh({ quiet: true })
  }
  async function submit(answer) {
    primeGoSound()
    setBusy('submit'); setError(null)
    const response = await submitGoHostedAnswer(supabase, sessionId, room.current_question.id, answer, room.current_question.position)
    setBusy(null)
    if (response.error) setError(response.error.message)
    else await state.refresh({ quiet: true })
  }

  if (state.loading && !room) return <GoShell><section className="go-state"><h1>Opening the game…</h1></section></GoShell>
  if (state.error || !room) return <GoShell><section className="go-state" role="alert"><h1>This game isn’t available</h1><p>{state.error?.message}</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (room.viewer_role !== expectedViewer) return <GoShell><section className="go-state"><h1>Use your game link</h1><Link to={room.viewer_role === 'host' ? `/go/host/${room.session_id}` : `/go/room/${room.session_id}`}>Open room</Link></section></GoShell>
  if (modeState.contentId !== room.content.id) return <GoShell><section className="go-state" role="status"><h1>Opening the game…</h1></section></GoShell>
  const mode = modeState.mode
  if (room.status === 'completed') return <GoShell><Results room={room} mode={mode} /></GoShell>
  if (['cancelled', 'expired'].includes(room.status)) return <GoShell><section className="go-state"><img className="go-state-art" src={GO_ART.zero2} alt="" /><h1>{room.status === 'expired' ? 'This room expired' : 'This game was cancelled'}</h1><p>No result was recorded.</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (room.status === 'lobby') return <GoShell><Lobby room={room} action={hostAction} busy={busy} error={error} /></GoShell>
  return <GoShell>{room.viewer_role === 'host' ? <HostQuestion key={room.current_question.id} room={room} mode={mode} timing={state.timing} action={hostAction} busy={busy} error={error} /> : <PlayerQuestion key={room.current_question.id} room={room} mode={mode} timing={state.timing} submit={submit} busy={busy === 'submit'} error={error} />}</GoShell>
}
