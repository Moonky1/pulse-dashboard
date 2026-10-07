// Unrecorded Staff practice only. Agent state and grading remain server-owned.
export const CALL_DISPOSITIONS = [
  [['A','Answering Machine'],['BLANK','No Info on File'],['CALLBK','Call Back'],['DAIR','Dead Air'],['DC','Disconnected Number']],
  [['DNC','DO NOT CALL'],['LANG','Language Barrier'],['NI','Not Interested'],['SPXFER','Spanish Xfer']],
  [['WRGNUM','Wrong Number'],['WRGVEH','Wrong Vehicle Info'],['XFER','Call Transferred']],
]
export const DISPOSITION_CODES = CALL_DISPOSITIONS.flat().map(([code]) => code)
export const VICI_CASES = {
  callback: { title: 'Manual call', commands: ['manual','dial','hangup','callDisposition','submit'], phases: ['home','manual','live','call_disposition','call_disposition','active'] },
  asia: { title: 'Spanish transfer · Asia', commands: ['presets','language','local','disposition','callDisposition','submit'], phases: ['live','presets','spanish','disposition','call_disposition','call_disposition','active'] },
}
export function newViciPreview(scenario) {
  if (!VICI_CASES[scenario]) throw new Error('Practice unavailable')
  return { challenge: { scenario }, dialer: { phase: VICI_CASES[scenario].phases[0], is_paused: scenario === 'callback', pause_menu: false, call_disposition: null }, position: 0, state_version: 1, mistakes: 0, status: 'started' }
}
export function previewViciCommand(snapshot, command, value) {
  const { scenario } = snapshot.challenge, item = VICI_CASES[scenario]
  const dialer = { ...snapshot.dialer }, nextState = { ...snapshot, dialer, state_version: snapshot.state_version + 1, feedback: null }
  if (command === 'status' && ['home','active'].includes(dialer.phase)) {
    if (dialer.is_paused) dialer.is_paused = false
    else dialer.pause_menu = true
    return nextState
  }
  if (['break','lunch','callbacks'].includes(command) && dialer.pause_menu) {
    dialer.pause_menu = false; dialer.is_paused = true
    return nextState
  }
  if (command === 'back' && dialer.phase === 'manual') { dialer.phase = 'home'; return nextState }
  if (command === 'manual' && snapshot.position === 1 && dialer.phase === 'home' && dialer.is_paused) { dialer.phase = 'manual'; return nextState }
  if (command === 'logo' && ['home','active'].includes(dialer.phase)) return nextState
  if (snapshot.status !== 'started') return nextState
  const correct = command === item.commands[snapshot.position]
    && (command !== 'manual' || dialer.is_paused && !dialer.pause_menu)
    && (command !== 'dial' || value === '2025550147' && dialer.phase === 'manual' && dialer.is_paused && !dialer.pause_menu)
    && (command !== 'language' || value === 'Spanish')
    && (command !== 'disposition' || value === 'SPANISH SPEAKER')
    && (command !== 'callDisposition' || DISPOSITION_CODES.includes(value) && (scenario !== 'asia' || value === 'XFER'))
    && (command !== 'submit' || ['paused','active'].includes(value) && dialer.call_disposition)
  if (!correct) return { ...nextState, correct: false, mistakes: snapshot.mistakes + 1, feedback: 'Action not completed.' }
  const position = snapshot.position + 1, complete = position === item.commands.length
  if (command === 'callDisposition') dialer.call_disposition = value
  if (command === 'submit') dialer.is_paused = value === 'paused'
  dialer.phase = item.phases[position]
  return { ...nextState, correct: true, position, status: complete ? 'completed' : 'started', feedback: complete ? 'Practice complete.' : null }
}
