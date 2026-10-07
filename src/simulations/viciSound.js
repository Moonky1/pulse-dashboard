// Quiet original click cue, separate from GO preferences and scoring sounds.
export const VICI_CLICK_SOUND = Object.freeze({ frequency: 620, duration: 0.045, peak: 0.018 })
let enabled = true, context = null, lastClick = -Infinity
export function viciSoundEnabled() { return enabled }
export function setViciSoundEnabled(value) { enabled = Boolean(value) }
export function playViciClick() {
  if (!enabled) return false
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext
  if (!Audio) return false
  try {
    context ||= new Audio()
    if (context.state === 'suspended') void context.resume().catch(() => {})
    const start = context.currentTime
    if (start - lastClick < 0.03) return false
    lastClick = start
    const note = context.createOscillator(), gain = context.createGain()
    note.type = 'sine'; note.frequency.setValueAtTime(VICI_CLICK_SOUND.frequency,start)
    gain.gain.setValueAtTime(0.0001,start)
    gain.gain.exponentialRampToValueAtTime(VICI_CLICK_SOUND.peak,start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001,start + VICI_CLICK_SOUND.duration)
    note.connect(gain); gain.connect(context.destination)
    note.onended = () => { note.disconnect(); gain.disconnect() }
    note.start(start); note.stop(start + VICI_CLICK_SOUND.duration + 0.005)
    return true
  } catch { return false }
}
