import { region } from './viciScreens.js'
import { DISPOSITION_CODES } from './viciModel.js'
import { VICI_PRACTICES } from './viciPractice.js'

export const OPENER_TEAMS = ['asia_team_a','asia_team_b','philippines','mexico_team_group_a','mexico_team_group_b','colombia','central_america','venezuela']
export function practiceTemplate(name) {
  const practice=VICI_PRACTICES[name]
  if (!practice) throw new Error('Unknown practice')
  return [base('info',practice.situation,practice.phases[0],null,[],[],'Use the dialer manually.'),...practice.commands.map((command,i)=>{
    const selected=['language','disposition','callDisposition','campaignLogin'].includes(command)
    const action=['agentLogin','phoneLogin'].includes(command)
    const expected=selected||command==='dial'?practice.values[command]:command
    const options=command==='callDisposition'?DISPOSITION_CODES:command==='language'?['English','Spanish']:command==='disposition'?['SPANISH SPEAKER','SPXFER']:command==='campaignLogin'?['OPENERS2','OPENERS3','OPENERS4']:action?[command]:[]
    return base(command==='dial'?'text':selected?'select':action?'action':'click',command==='dial'?'Enter the current customer phone number and click Dial Now.':command==='leave'?'Leave after 15 seconds of advisor introduction.':`Use ${command}.`,practice.phases[i],expected,[region(action?'login':command.toLowerCase(),command,30,130,500,50)],options,'Use the dialer manually.')
  })].map(step=>({...step,source_note:'User screenshots and confirmed Opener training policy.'}))
}

const base = (interaction, prompt, screen, expected, regions = [], options = [], hint = '') => ({
  interaction, prompt, screen, screen_media_id: null, expected_value: expected, regions, options, hint,
  success_feedback: 'Dialer updated.', retry_feedback: 'Not quite. Try another dialer action or request a hint.', branches: {}, source_note: '',
})
export const TEMPLATE_INFO = {
  callback: { title: 'Manual call', description: 'Practice manual dialing, ending the call, choosing a disposition and submitting it.', source: 'User correction + VICIdial tutorial eS428vg7gxA · 0:49–3:08', scope: 'Mexico source · confirm the intended team before publishing' },
  asia: { title: 'Asia · Spanish-speaking customer', description: 'Practice routing a Spanish-speaking customer: Presets, Spanish, Local Closer, Spanish Speaker. Never SPXFER.', source: 'Asia Guide.docx + the user’s clarified sequence', scope: 'Asia only · select the corresponding team, not Everyone' },
}
export function simulationTemplate(name) {
  const steps = name === 'callback' ? [
    base('info', 'Manual call to 2025550147.', 'home', null, [], [], 'The dialer starts paused.'),
    base('click', 'Open MANUAL DIAL.', 'home', 'manual', [region('manual','MANUAL DIAL',360,664,154,31)], [], 'Use the manual dial control.'),
    base('text', 'Enter 2025550147 in Phone Number.', 'manual', '2025550147', [region('phone','Phone Number',325,260,250,26)], [], 'Use the exercise number.'),
    base('click', 'Click Dial Now.', 'manual-filled', 'dial', [region('dial','Dial Now',334,626,116,32)], [], 'Start the simulated call.'),
    base('click', 'Hang up the customer call.', 'live', 'hangup', [region('hangup','HANGUP CUSTOMER',10,459,185,25)], [], 'End the call.'),
    base('select', 'Select the call disposition.', 'call_disposition', 'NI', [region('call_disposition','Call disposition',30,130,1100,400)], DISPOSITION_CODES, 'Choose a supported result.'),
    base('click', 'Submit the disposition.', 'call_disposition', 'submit', [region('submit','SUBMIT',550,670,110,30)], [], 'Submit the selected result.'),
  ] : [
    base('info', 'Tell the Spanish-speaking customer that you will transfer them to a Spanish-speaking representative.', 'live', null, [], [], 'Do not hang up. This is the Asia routing process, not the Latin team’s Spanish-call process.'),
    base('click', 'Open PRESETS to prepare the language change.', 'live', 'presets', [region('presets', 'PRESETS', 805, 696, 120, 25), region('blind', 'BLIND TRANSFER', 215, 696, 166, 25), region('dial', 'DIAL WITH CUSTOMER', 391, 696, 196, 25)], [], 'PRESETS is in the transfer conference controls.'),
    base('select', 'Change the preset language from English to Spanish.', 'presets', 'Spanish', [region('language', 'Language', 825, 352, 306, 34)], ['English', 'Spanish'], 'Select Spanish in the language field.'),
    base('click', 'Select LOCAL CLOSER.', 'spanish', 'local', [region('local', 'LOCAL CLOSER', 825, 409, 200, 25), region('blind', 'BLIND TRANSFER', 215, 696, 166, 25)], [], 'Use LOCAL CLOSER. Do not use a blind transfer.'),
    base('select', 'Select SPANISH SPEAKER. Do NOT select SPXFER.', 'disposition', 'SPANISH SPEAKER', [region('disposition', 'Disposition', 825, 470, 306, 34)], ['SPANISH SPEAKER', 'SPXFER'], 'SPANISH SPEAKER is the required choice for this Asia process.'),
    base('select', 'Disposition the transferred call.', 'call_disposition', 'XFER', [region('call_disposition','Call disposition',30,130,1100,400)], DISPOSITION_CODES, 'The call was transferred.'),
    base('click', 'Submit the disposition.', 'call_disposition', 'submit', [region('submit','SUBMIT',550,670,110,30)], [], 'Submit the result.'),
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
    if (step.regions.some(r => !/^[a-z][a-z0-9_-]{0,39}$/.test(r.id || '') || !r.label || [r.x, r.y, r.w, r.h].some(n => !Number.isFinite(n)) || r.x < 0 || r.y < 0 || r.w <= 0 || r.h <= 0 || r.x + r.w > 1.000001 || r.y + r.h > 1.000001)) return prefix + 'keep every target within the screen.'
    if (new Set(step.regions.map(r => r.id)).size !== step.regions.length) return prefix + 'target IDs must be unique.'
    if (new Set(step.options).size !== step.options.length || step.options.some(v => !v.trim())) return prefix + 'options must be nonempty and unique.'
    if (Object.entries(step.branches || {}).some(([key, to]) => !['choice', 'select'].includes(step.interaction) || !step.options.includes(key) || !Number.isInteger(to) || to <= i + 1 || to > steps.length)) return prefix + 'branches must use an option and point to a later existing step.'
  }
  return null
}
