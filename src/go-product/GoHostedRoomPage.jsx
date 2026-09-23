import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { advanceGoHostedSession, cancelGoHostedSession, startGoHostedSession, submitGoHostedAnswer } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { hostedAnswerReady, languagePresentation, resultMedal } from './goHostedModel.js'
import { GoShell } from './GoShell.jsx'
import { GO_ART, resolveGoArt } from './goVisualAssets.js'
import { HostedAnswerControl } from './HostedAnswerControl.jsx'
import { useHostedRoom } from './useHostedRoom.js'

function RoomHeader({ room }) {
  const language = languagePresentation(room.content.language)
  return <header className="go-room-heading">
    <div><p className="go-eyebrow">{room.viewer_role === 'host' ? 'Hosting live' : 'Live game'}</p><h1>{room.content.title}</h1><p><span aria-hidden="true">{language.flag}</span> {language.label} · {room.question_count} questions</p></div>
    <div className="go-room-code"><img src={GO_ART.classic} alt="" /><div><span>Join with</span><strong>{room.room_code}</strong></div></div>
  </header>
}

function Lobby({ room, action, busy, error }) {
  const isHost = room.viewer_role === 'host'
  return <>
    <RoomHeader room={room} />
    <section className="go-lobby-grid">
      <article className="go-room-panel">
        <div className="go-panel-title"><span className="go-pixel-symbol" aria-hidden="true">🛡️</span><div><p className="go-eyebrow">Lobby</p><h2>{room.participant_count} {room.participant_count === 1 ? 'player' : 'players'} ready</h2></div></div>
        <div className="go-player-roster" aria-live="polite">{room.participants.map(player => <div key={player.seat}><span className={`go-player-marker go-player-marker--${(Number(player.seat) || 0) % 4}`}>{player.name.slice(0, 1).toUpperCase()}</span><strong>{player.name}</strong><small>Ready ✓</small></div>)}</div>
        {!room.participant_count && <p className="go-room-empty">Share the game code. Players will appear here automatically.</p>}
      </article>
      <aside className="go-room-panel go-room-panel--action">
        <img src={GO_ART.classic} alt="" />
        <h2>{isHost ? 'Ready when they are' : 'You’re in'}</h2>
        <p>{isHost ? 'Start after everyone has joined.' : 'The host will start the first question.'}</p>
        {error && <p className="go-inline-error" role="alert">{error}</p>}
        {isHost && <div className="go-room-actions"><Button loading={busy === 'start'} disabled={!room.participant_count || !!busy} onClick={() => action('start')}>Start game</Button><Button variant="ghost" loading={busy === 'cancel'} disabled={!!busy} onClick={() => action('cancel')}>Cancel room</Button></div>}
      </aside>
    </section>
  </>
}

function HostQuestion({ room, action, busy, error }) {
  const question = room.current_question
  return <>
    <RoomHeader room={room} />
    <section className="go-live-question go-live-question--host">
      <div className="go-question-counter"><span>Question {question.position} of {room.question_count}</span><strong>{room.answered_count}/{room.participant_count} answered</strong></div>
      <article><p className="go-question-type">{question.question_type.replaceAll('_', ' ')}</p><h2>{question.prompt}</h2>{question.question_type !== 'text' && <div className="go-host-options">{question.answer_options.length ? question.answer_options.map((option, index) => <span key={index}>{String.fromCharCode(65 + index)}. {option}</span>) : <><span>True</span><span>False</span></>}</div>}</article>
      <div className="go-answer-meter" aria-label={`${room.answered_count} of ${room.participant_count} answered`}><span style={{ width: `${room.participant_count ? room.answered_count / room.participant_count * 100 : 0}%` }} /></div>
      {error && <p className="go-inline-error" role="alert">{error}</p>}
      <div className="go-room-actions"><Button loading={busy === 'advance'} disabled={!!busy} onClick={() => action('advance')}>{question.position === room.question_count ? 'Finish game' : 'Next question'}</Button><Button variant="ghost" loading={busy === 'cancel'} disabled={!!busy} onClick={() => action('cancel')}>Cancel game</Button></div>
    </section>
  </>
}

function PlayerQuestion({ room, submit, busy, error }) {
  const [answer, setAnswer] = useState(undefined)
  const question = room.current_question
  return <>
    <RoomHeader room={room} />
    <section className="go-live-question">
      <div className="go-question-counter"><span>Question {question.position} of {room.question_count}</span><strong>{room.my_answered ? 'Answer locked ✓' : 'Choose your answer'}</strong></div>
      <article><h2>{question.prompt}</h2><HostedAnswerControl question={question} answer={answer} onChange={setAnswer} disabled={room.my_answered || busy} /></article>
      {error && <p className="go-inline-error" role="alert">{error}</p>}
      <footer><span>{room.my_answered ? 'Waiting for the host…' : 'Your answer is final once sent.'}</span><Button loading={busy} disabled={room.my_answered || busy || !hostedAnswerReady(question, answer)} onClick={() => void submit(answer)}>Submit answer</Button></footer>
    </section>
  </>
}

function Results({ room }) {
  const personal = room.my_result
  const score = personal?.score_percent ?? room.host_summary?.average_score ?? 0
  const medal = resultMedal(score)
  return <section className="go-hosted-result" role="status">
    <div className="go-result-art" aria-hidden="true"><img src={resolveGoArt(medal.image)} alt="" /><img src={GO_ART.points} alt="" /><img src={GO_ART.valid} alt="" /></div>
    <p className="go-eyebrow">Game complete</p><h1>{room.viewer_role === 'host' ? 'That’s a wrap!' : medal.label}</h1>
    {personal ? <><strong className="go-result-score">{Math.round(Number(personal.score_percent))}%</strong><p>{personal.correct_answers} of {personal.total_questions} correct</p>{!!personal.topic_breakdown?.length && <div className="go-result-topics">{personal.topic_breakdown.map(topic => <div key={topic.topic_id}><strong>{topic.topic_name}</strong><span>{topic.correct_answers}/{topic.total_questions}</span></div>)}</div>}</> : <div className="go-host-summary"><div><strong>{room.host_summary.players}</strong><span>Players</span></div><div><strong>{Math.round(Number(room.host_summary.average_score))}%</strong><span>Average</span></div><div><strong>{room.host_summary.completed_results}</strong><span>Results saved</span></div></div>}
    <Link className="go-primary" to="/go">Back to GO</Link>
  </section>
}

export function GoHostedRoomPage({ expectedViewer }) {
  const { sessionId } = useParams()
  const state = useHostedRoom(sessionId)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const room = state.room

  async function hostAction(kind) {
    setBusy(kind); setError(null)
    const call = kind === 'start' ? startGoHostedSession : kind === 'advance' ? advanceGoHostedSession : cancelGoHostedSession
    const response = await call(supabase, sessionId, room.version)
    setBusy(null)
    if (response.error) setError(response.error.message)
    else await state.refresh({ quiet: true })
  }
  async function submit(answer) {
    setBusy('submit'); setError(null)
    const response = await submitGoHostedAnswer(supabase, sessionId, room.current_question.id, answer, room.current_question.position)
    setBusy(null)
    if (response.error) setError(response.error.message)
    else await state.refresh({ quiet: true })
  }

  if (state.loading && !room) return <GoShell><section className="go-state"><h1>Opening the game…</h1></section></GoShell>
  if (state.error || !room) return <GoShell><section className="go-state" role="alert"><h1>This game isn’t available</h1><p>{state.error?.message}</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (room.viewer_role !== expectedViewer) return <GoShell><section className="go-state"><h1>Use your game link</h1><Link to={room.viewer_role === 'host' ? `/go/host/${room.session_id}` : `/go/room/${room.session_id}`}>Open room</Link></section></GoShell>
  if (room.status === 'completed') return <GoShell><Results room={room} /></GoShell>
  if (['cancelled', 'expired'].includes(room.status)) return <GoShell><section className="go-state"><img className="go-state-art" src={GO_ART.zero2} alt="" /><h1>{room.status === 'expired' ? 'This room expired' : 'This game was cancelled'}</h1><p>No result was recorded.</p><Link to="/go">Back to GO</Link></section></GoShell>
  if (room.status === 'lobby') return <GoShell><Lobby room={room} action={hostAction} busy={busy} error={error} /></GoShell>
  return <GoShell>{room.viewer_role === 'host' ? <HostQuestion room={room} action={hostAction} busy={busy} error={error} /> : <PlayerQuestion key={room.current_question.id} room={room} submit={submit} busy={busy === 'submit'} error={error} />}</GoShell>
}
