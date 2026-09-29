import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase.js'
import { useTrainingMediaUrl } from '../training/trainingMedia.js'

export function LobbyMusic({ room }) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const url = useTrainingMediaUrl(supabase, room.content.lobby_audio_media_id,
    room.content.id, room.session_id)
  useEffect(() => {
    const player = audio.current
    if (player) player.volume = 0.25
    return () => { if (player) { player.pause(); player.currentTime = 0 } }
  }, [])
  if (!room.content.lobby_audio_media_id) return null
  async function toggle() {
    if (!audio.current || !url) return
    if (playing) { audio.current.pause(); setPlaying(false); return }
    try { await audio.current.play(); setPlaying(true) } catch { setPlaying(false) }
  }
  return <div className="go-lobby-music">
    <audio ref={audio} src={url || undefined} loop preload="none" muted={muted} onPause={() => setPlaying(false)} />
    <span aria-hidden="true">♫</span><span>Lobby music</span>
    <button type="button" onClick={() => void toggle()} disabled={!url}>{playing ? 'Pause' : 'Play'}</button>
    <button type="button" onClick={() => setMuted(value => !value)} disabled={!url}>{muted ? 'Unmute' : 'Mute'}</button>
  </div>
}
