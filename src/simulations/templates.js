import { region } from './viciScreens.js'

const base = (interaction, prompt, screen, expected, regions = [], options = [], hint = '') => ({
  interaction, prompt, screen, screen_media_id: null, expected_value: expected, regions, options, hint,
  success_feedback: 'That is the correct next step.', retry_feedback: 'Not quite. Read the instruction and try again.', branches: {}, source_note: '',
})
export const TEMPLATE_INFO = {
  callback: { title: 'Callback · manual dial', description: 'Practice the Callback sequence, from the paused screen to Dial Now. Synthetic number only; no live call.', source: 'Copia de Diseño sin título.pdf · pages 30–31', scope: 'Mexico source · confirm the intended team before publishing' },
  asia: { title: 'Asia · Spanish-speaking customer', description: 'Practice routing a Spanish-speaking customer: Presets, Spanish, Local Closer, Spanish Speaker. Never SPXFER.', source: 'Asia Guide.docx + the user’s clarified sequence', scope: 'Asia only · select the corresponding team, not Everyone' },
}
export function simulationTemplate(name) {
  const steps = name === 'callback' ? [
    base('info', 'Verify that the dialer says YOU ARE PAUSED.', 'paused', null, [], [], 'Look for the yellow paused status. This screen is already paused.'),
    base('click', 'Select CB - Callbacks from the pause code menu.', 'paused', 'callbacks', [region('callbacks', 'CB - Callbacks', 764, 276, 195, 31), region('break', 'Break - Break', 764, 230, 180, 31), region('lunch', 'Lunch - Lunch', 985, 230, 174, 31)], [], 'Use the green pause-code menu on the right.'),
    base('click', 'Click the VICIdial logo to return to the main screen.', 'callback', 'logo', [region('logo', 'VICIdial logo', 10, 30, 164, 40), region('script', 'SCRIPT', 185, 34, 95, 25), region('form', 'FORM', 288, 34, 85, 25)], [], 'The VICIdial logo is in the top-left corner.'),
    base('click', 'Open MANUAL DIAL at the bottom of the screen.', 'home', 'manual', [region('manual', 'MANUAL DIAL', 360, 664, 154, 31), region('fast', 'FAST DIAL', 564, 664, 130, 31), region('log', 'VIEW CALL LOG', 725, 664, 190, 31)], [], 'Use MANUAL DIAL, not FAST DIAL.'),
    base('text', 'Enter the exercise phone number: 2025550147. Use digits only.', 'manual', '2025550147', [region('phone', 'Phone Number', 325, 260, 250, 26)], [], 'Type the provided fictitious number in Phone Number, not Dial Override.'),
    base('click', 'Verify 2025550147 in Phone Number, then click Dial Now. This will finish the exercise, without calling anyone.', 'manual-filled', 'dial', [region('dial', 'Dial Now', 334, 626, 116, 32), region('preview', 'Preview Call', 559, 626, 158, 32), region('back', 'Go Back', 819, 626, 112, 32)], [], 'Check the number before selecting Dial Now.'),
  ] : [
    base('info', 'Tell the Spanish-speaking customer that you will transfer them to a Spanish-speaking representative.', 'live', null, [], [], 'Do not hang up. This is the Asia routing process, not the Latin team’s Spanish-call process.'),
    base('click', 'Open PRESETS to prepare the language change.', 'live', 'presets', [region('presets', 'PRESETS', 805, 696, 120, 25), region('blind', 'BLIND TRANSFER', 215, 696, 166, 25), region('dial', 'DIAL WITH CUSTOMER', 391, 696, 196, 25)], [], 'PRESETS is in the transfer conference controls.'),
    base('select', 'Change the preset language from English to Spanish.', 'presets', 'Spanish', [region('language', 'Language', 825, 352, 306, 34)], ['English', 'Spanish'], 'Select Spanish in the language field.'),
    base('click', 'Select LOCAL CLOSER.', 'spanish', 'local', [region('local', 'LOCAL CLOSER', 825, 409, 200, 25), region('blind', 'BLIND TRANSFER', 215, 696, 166, 25)], [], 'Use LOCAL CLOSER. Do not use a blind transfer.'),
    base('select', 'Select SPANISH SPEAKER. Do NOT select SPXFER.', 'disposition', 'SPANISH SPEAKER', [region('disposition', 'Disposition', 825, 470, 306, 34)], ['SPANISH SPEAKER', 'SPXFER'], 'SPANISH SPEAKER is the required choice for this Asia process.'),
  ]
  return steps.map(step => ({ ...step, source_note: TEMPLATE_INFO[name]?.source || '' }))
}
export const serializableSteps = steps => steps.map(({ interaction, prompt, hint, success_feedback, retry_feedback, screen_media_id, regions, options, expected_value, branches, source_note }) =>
  ({ interaction, prompt, hint, success_feedback, retry_feedback, screen_media_id, regions, options, expected_value, branches, source_note }))
export function validateSimulationSteps(steps, { screens = true } = {}) {
  if (!steps.length || steps.length > 100) return 'Add between 1 and 100 steps.'
  for (const [i, step] of steps.entries()) {
    const prefix = `Step ${i + 1}: `
    if (!step.prompt?.trim() || step.prompt.length > 2000) return prefix + 'add an instruction (maximum 2,000 characters).'
    if (screens && step.interaction !== 'info' && !step.screen_media_id) return prefix + 'upload a private screen.'
    if (step.interaction === 'click' && !step.regions.some(r => r.id === step.expected_value)) return prefix + 'select the expected target.'
    if (['choice', 'select', 'action'].includes(step.interaction) && !step.options.includes(step.expected_value)) return prefix + 'choose an expected option.'
    if (step.interaction === 'text' && !step.expected_value?.trim()) return prefix + 'add the expected text.'
    if (['text', 'select'].includes(step.interaction) && !step.regions.length) return prefix + 'place the input on the screen.'
    if (step.regions.some(r => !r.id || !r.label || [r.x, r.y, r.w, r.h].some(n => !Number.isFinite(n)) || r.x < 0 || r.y < 0 || r.w <= 0 || r.h <= 0 || r.x + r.w > 1.000001 || r.y + r.h > 1.000001)) return prefix + 'keep every target within the screen.'
    if (new Set(step.regions.map(r => r.id)).size !== step.regions.length) return prefix + 'target IDs must be unique.'
    if (new Set(step.options).size !== step.options.length || step.options.some(v => !v.trim())) return prefix + 'options must be nonempty and unique.'
    if (Object.entries(step.branches || {}).some(([key, to]) => !['choice', 'select'].includes(step.interaction) || !step.options.includes(key) || !Number.isInteger(to) || to <= i + 1 || to > steps.length)) return prefix + 'branches must use an option and point to a later existing step.'
  }
  return null
}
