import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { supabase } from '../utils/supabase.js'
import { MAX_SOURCE_BYTES, MAX_SOURCE_SECONDS, trimAudioToWav, validateAudioSelection } from '../training/audioClip.js'
import { QuestionAudioPlayer } from '../training/QuestionAudioPlayer.jsx'
import { deleteTrainingQuestionAudio, uploadTrainingQuestionAudio } from '../training/trainingMediaApi.js'

const seconds = value => Math.round(value * 10) / 10

export function QuestionAudioEditor({ contentId, question, onChange, disabled }) {
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [working, setWorking] = useState(false)
  const [freshMediaId, setFreshMediaId] = useState(null)
  const [error, setError] = useState('')
  const audio = useRef(null)
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  function discard() {
    audio.current?.pause()
    setFile(null); setUrl(null); setDuration(0); setError('')
    onChange({ audio_pending: false })
  }
  function choose(next) {
    if (!next) return
    if (next.size > MAX_SOURCE_BYTES) { setError('Choose a recording under 25 MB.'); return }
    audio.current?.pause()
    setFile(next); setUrl(URL.createObjectURL(next)); setDuration(0); setStart(0); setEnd(0); setError('')
    onChange({ audio_pending: true })
  }
  async function preview() {
    if (!audio.current) return
    try { audio.current.currentTime = start; await audio.current.play() }
    catch { setError('This recording could not be played.') }
  }
  async function keepSelection() {
    const invalid = validateAudioSelection(start, end, duration, question.time_limit_seconds ?? 30)
    if (invalid) { setError(invalid); return }
    setWorking(true); setError('')
    try {
      const clip = await trimAudioToWav(file, start, end, question.time_limit_seconds ?? 30)
      const mediaId = await uploadTrainingQuestionAudio(supabase, contentId, clip)
      if (freshMediaId && freshMediaId !== mediaId) void deleteTrainingQuestionAudio(supabase, freshMediaId).catch(() => {})
      setFreshMediaId(mediaId)
      onChange({ media_id: mediaId, audio_start_ms: 0, audio_end_ms: Math.round((end - start) * 1000), audio_pending: false })
      audio.current?.pause()
      setFile(null); setUrl(null); setDuration(0)
    } catch (cause) { setError(cause.message || 'Could not prepare this audio.') }
    finally { setWorking(false) }
  }
  async function remove() {
    const mediaId = question.media_id
    onChange({ media_id: null, audio_start_ms: null, audio_end_ms: null, audio_pending: false })
    if (mediaId === freshMediaId) {
      setWorking(true)
      try { await deleteTrainingQuestionAudio(supabase, mediaId); setFreshMediaId(null) }
      catch { setError('Save the question before this audio can be cleaned up.') }
      finally { setWorking(false) }
    }
  }
  const maxEnd = Math.min(duration, start + (question.time_limit_seconds ?? 30))
  return <div className="studio-audio-editor">
    <div><strong>Question audio</strong><small>Choose the part of a call learners should hear. Only that part is uploaded.</small></div>
    {question.media_id && question.audio_end_ms != null && !file && <div className="studio-audio-existing"><QuestionAudioPlayer contentId={contentId} question={question} />
      <Button variant="ghost" disabled={disabled || working} onClick={() => void remove()}>Remove audio</Button></div>}
    <label>Choose a recording<input type="file" accept="audio/*" disabled={disabled || working} onChange={event => {
      choose(event.target.files?.[0]); event.target.value = ''
    }} /></label>
    {file && <div className="studio-audio-trim">
      <p>{file.name} · {duration ? `${seconds(duration)}s total` : 'Reading audio…'}</p>
      {url && <audio ref={audio} src={url} preload="metadata" onError={() => setError('This recording could not be opened. Try MP3, M4A or WAV.')} onLoadedMetadata={event => {
        const length = event.currentTarget.duration
        if (!Number.isFinite(length) || length < 0.1 || length > MAX_SOURCE_SECONDS) { setError('Choose a recording between 0.1 seconds and 10 minutes.'); return }
        setDuration(length); setEnd(seconds(Math.min(length, question.time_limit_seconds ?? 30)))
      }} onTimeUpdate={event => { if (event.currentTarget.currentTime >= end) event.currentTarget.pause() }} />}
      {duration > 0 && <><div className="studio-audio-range"><label>Start (seconds)<input type="number" min="0" max={Math.max(0, end - 0.1)} step="0.1" value={start} onChange={event => {
        const next = Math.max(0, Number(event.target.value)); setStart(next)
        if (end - next > (question.time_limit_seconds ?? 30)) setEnd(seconds(Math.min(duration, next + (question.time_limit_seconds ?? 30))))
      }} /></label><label>End (seconds)<input type="number" min={start + 0.1} max={maxEnd} step="0.1" value={end} onChange={event => setEnd(Number(event.target.value))} /></label></div>
        <input aria-label="Audio clip start" type="range" min="0" max={Math.max(0, duration - 0.1)} step="0.1" value={start} onChange={event => {
          const next = Number(event.target.value); setStart(next)
          setEnd(seconds(Math.min(duration, next + (question.time_limit_seconds ?? 30))))
        }} />
        <small>{seconds(end - start)} seconds selected · maximum {question.time_limit_seconds ?? 30} seconds for this question</small>
        <div className="studio-inline-actions"><Button variant="secondary" disabled={working} onClick={() => void preview()}>Preview selection</Button><Button disabled={working || !!validateAudioSelection(start, end, duration, question.time_limit_seconds ?? 30)} onClick={() => void keepSelection()}>{working ? 'Preparing audio…' : 'Use this clip'}</Button><Button variant="ghost" disabled={working} onClick={discard}>Cancel</Button></div></>}
    </div>}
    {error && <small role="alert" className="studio-audio-error">{error}</small>}
  </div>
}
