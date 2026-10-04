import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase.js'
import { getTrainingQuestionAudioUrl } from './trainingMediaApi.js'

export function QuestionAudioPlayer({ contentId, question, sessionId = null, language = 'en' }) {
  const [state, setState] = useState({ mediaId: null, url: null, error: null })
  const [playing, setPlaying] = useState(false)
  const audio = useRef(null)
  useEffect(() => {
    if (!question?.media_id || question.audio_end_ms == null) return
    let current = true
    getTrainingQuestionAudioUrl(supabase, contentId, question.media_id, sessionId)
      .then(url => { if (current) setState({ mediaId: question.media_id, url, error: null }) })
      .catch(() => { if (current) setState({ mediaId: question.media_id, url: null, error: true }) })
    return () => { current = false }
  }, [contentId, question?.media_id, question?.audio_end_ms, sessionId])
  if (!question?.media_id || question.audio_end_ms == null) return null
  const es = language === 'es'
  const active = state.mediaId === question.media_id ? state : { url: null, error: null }
  const start = (question.audio_start_ms || 0) / 1000
  const end = question.audio_end_ms / 1000
  async function toggle() {
    if (!audio.current) return
    if (playing) { audio.current.pause(); setPlaying(false); return }
    try {
      audio.current.currentTime = start
      await audio.current.play()
      setPlaying(true)
    } catch { setState(previous => ({ ...previous, error: true })) }
  }
  return <div className="training-question-audio">
    {active.url && <audio ref={audio} src={active.url} preload="metadata" onEnded={() => setPlaying(false)} onTimeUpdate={event => {
      if (event.currentTarget.currentTime >= end) { event.currentTarget.pause(); setPlaying(false) }
    }} />}
    <button type="button" disabled={!active.url || !!active.error} onClick={() => void toggle()}>
      {playing ? es ? 'Pausar audio' : 'Pause audio' : es ? 'Escuchar audio' : 'Listen to audio'}
    </button>
    {active.error && <small role="alert">{es ? 'Audio no disponible' : 'Audio unavailable'}</small>}
  </div>
}
