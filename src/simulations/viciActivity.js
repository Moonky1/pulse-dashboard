import { CALL_DISPOSITIONS, PAUSE_CODES } from './viciModel.js'

const labels = {
  status: 'Open pause codes', resume: 'Resume dialing', closePause: 'Close pause codes', logo: 'VICIdial logo',
  manual: 'MANUAL DIAL', dial: 'Dial Now', preview: 'Preview Call', back: 'Go Back', fast: 'FAST DIAL', log: 'VIEW CALL LOG',
  presets: 'PRESETS / TRANSFER - CONF', local: 'LOCAL CLOSER', blind: 'BLIND TRANSFER / SEND DTMF',
  hangup: 'HANGUP CUSTOMER', leave: 'LEAVE 3-WAY CALL', both: 'HANGUP BOTH LINES', park: 'PARK CALL',
  script: 'SCRIPT', form: 'FORM', webForm: 'WEB FORM', webForm2: 'WEB FORM 2', microphone: 'Simulated microphone',
  recording: 'Simulated recording', search: 'Search Existing Leads', pauseAfter: 'Pause Agent Dialing',
  ...Object.fromEntries(PAUSE_CODES.flat()),
}

// Only display known control labels. Never retain typed phone numbers, request
// IDs, credentials or hidden step data in this session-only presentation log.
export function viciActionLabel(command, value) {
  if (command === 'language') return ['English','Spanish'].includes(value) ? `Language: ${value}` : 'Language'
  if (command === 'disposition') return ['SPANISH SPEAKER','SPXFER'].includes(value) ? `Local Closer: ${value}` : 'Local Closer disposition'
  if (command === 'callDisposition') {
    const choice = CALL_DISPOSITIONS.flat().find(([code]) => code === value)
    return choice ? `Call disposition: ${choice[0]} - ${choice[1]}` : 'Call disposition'
  }
  if (command === 'submit') return value === 'paused' ? 'SUBMIT · Pause Agent Dialing' : 'SUBMIT · Active'
  return labels[command] || 'Dialer control'
}

export function appendViciActivity(entries, command, value, result = {}) {
  const outcome = result.error ? 'unsaved' : result.correct === true ? 'correct' : result.correct === false ? 'incorrect' : 'done'
  return [...entries, { number: (entries.at(-1)?.number || 0) + 1, label: viciActionLabel(command,value), outcome }].slice(-200)
}
