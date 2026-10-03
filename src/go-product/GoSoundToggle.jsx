import { useState } from 'react'

import { goSoundEnabled, primeGoSound, setGoSoundEnabled } from './goSoundEffects.js'

export function GoSoundToggle({ language }) {
  const [enabled, setEnabled] = useState(goSoundEnabled)
  function toggle() {
    const next = !enabled
    setGoSoundEnabled(next)
    setEnabled(next)
    if (next) primeGoSound()
  }
  return <button className="go-sound-toggle" type="button" aria-pressed={enabled} onClick={toggle}>
    {enabled ? '♪' : '♪̸'} {language === 'es' ? `Sonidos ${enabled ? 'activados' : 'desactivados'}` : `Sounds ${enabled ? 'on' : 'off'}`}
  </button>
}
