import { useState } from 'react'
import { playViciClick, setViciSoundEnabled, viciSoundEnabled } from './viciSound.js'

export function ViciSoundToggle() {
  const [enabled,setEnabled] = useState(viciSoundEnabled)
  function toggle() {
    const next = !enabled
    setViciSoundEnabled(next); setEnabled(next)
    if (next) playViciClick()
  }
  return <button type="button" className="vici-sound-toggle" aria-pressed={enabled} onClick={toggle}>♪ Sounds {enabled ? 'on' : 'off'}</button>
}
