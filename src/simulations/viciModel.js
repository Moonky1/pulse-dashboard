// Reference preview only. Official learner grading always runs in the database.
export const VICI_CASES = {
  callback: { title: 'Make a callback', region: 'Mexico Openers', goal: 'Make a callback to Taylor Example at 2025550147. The dialer is paused.',
    phases: ['paused', 'callback', 'home', 'manual'], commands: ['callbacks', 'logo', 'manual', 'dial'],
    hints: ['Choose CB - Callbacks in the pause-code menu.', 'Use the VICIdial logo to return to the main screen.', 'Open MANUAL DIAL.', 'Enter 2025550147 in Phone Number and press Dial Now.'] },
  asia: { title: 'Route a Spanish-speaking customer', region: 'Asia Openers', goal: 'A Spanish-speaking customer reaches your Asia line. Advise them of the transfer and route them to a Spanish-speaking representative.',
    phases: ['live', 'presets', 'spanish', 'disposition'], commands: ['presets', 'language', 'local', 'disposition'],
    hints: ['Open PRESETS.', 'Change English to Spanish.', 'Choose LOCAL CLOSER.', 'Select SPANISH SPEAKER, never SPXFER.'] },
}
export function newViciPreview(scenario) {
  const item = VICI_CASES[scenario]
  if (!item) throw new Error('Unknown reference workflow')
  return { challenge: { scenario, goal: item.goal }, dialer: { phase: item.phases[0] }, position: 0, state_version: 1, mistakes: 0, hints: 0, hint_positions: [], status: 'started', hint: null }
}
export function previewViciCommand(snapshot, command, value) {
  if (snapshot.status !== 'started') return snapshot
  const { scenario } = snapshot.challenge, item = VICI_CASES[scenario], position = snapshot.position
  if (command === 'hint') return { ...snapshot, state_version: snapshot.state_version + 1, hint: item.hints[position],
    hints: snapshot.hints + (snapshot.hint_positions.includes(position) ? 0 : 1), hint_positions: [...new Set([...snapshot.hint_positions, position])] }
  const correct = command === item.commands[position] && (command !== 'dial' || value === '2025550147')
    && (command !== 'language' || value === 'Spanish') && (command !== 'disposition' || value === 'SPANISH SPEAKER')
  const next = position + (correct ? 1 : 0), complete = next === item.commands.length
  return { ...snapshot, correct, state_version: snapshot.state_version + 1, mistakes: snapshot.mistakes + (correct ? 0 : 1), position: next,
    dialer: { phase: item.phases[Math.min(next, item.phases.length - 1)] }, status: complete ? 'completed' : 'started', hint: correct ? null : snapshot.hint,
    feedback: correct ? 'Dialer updated.' : 'That action does not complete the required workflow. Try again or request a hint.' }
}
