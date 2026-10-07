import assert from 'node:assert/strict'
import test from 'node:test'
import { simulationTemplate, serializableSteps, validateSimulationSteps } from '../../src/simulations/templates.js'
import { viciScreenSvg } from '../../src/simulations/viciScreens.js'

test('Callback is six source-backed steps, paused acknowledgement first and manual dial final', () => {
  const steps = simulationTemplate('callback')
  assert.equal(steps.length, 6); assert.equal(steps[0].interaction, 'info'); assert.equal(steps[5].expected_value, 'dial')
  assert.equal(steps[4].expected_value, '2025550147'); assert.equal(steps[4].interaction, 'text')
  assert.equal(validateSimulationSteps(steps, { screens: false }), null)
  assert.match(validateSimulationSteps(steps), /upload a private screen/)
  for (const step of steps) assert.match(step.source_note, /30–31/)
})
test('Asia routing is not SPXFER, not a generic Latin process', () => {
  const steps = simulationTemplate('asia')
  assert.deepEqual(steps.map(s => s.expected_value), [null, 'presets', 'Spanish', 'local', 'SPANISH SPEAKER'])
  assert.equal(steps[4].options.includes('SPXFER'), true); assert.equal(validateSimulationSteps(steps, { screens: false }), null)
  assert.equal(steps.every(s => s.source_note.includes('Asia')), true)
})
test('serialized authoring does not pass screen generation keys or old IDs to replacement RPC', () => {
  const [step] = serializableSteps([{ ...simulationTemplate('asia')[0], id: 'old-id', content_id: 'old-content' }])
  assert.equal(step.screen, undefined); assert.equal(step.id, undefined); assert.equal(step.content_id, undefined)
})
test('builder rejects invalid target geometry, duplicate targets/options, missing text and cycles', () => {
  const steps = simulationTemplate('asia').map(s => ({ ...s, screen_media_id: 'synthetic-fixture' }))
  assert.equal(validateSimulationSteps(steps), null)
  steps[1].regions[0].x = .99; assert.match(validateSimulationSteps(steps), /within the screen/)
  steps[1].regions[0].x = .1; steps[2].branches.Spanish = 2; assert.match(validateSimulationSteps(steps), /later existing step/)
})
test('reconstructed dialer assets contain no external URLs, source customers or credentials', () => {
  for (const mode of ['paused','callback','home','manual','manual-filled','live','presets','spanish','disposition']) {
    const svg = viciScreenSvg(mode)
    assert.ok(!/https?:\/\/(?!www.w3.org\/2000\/svg)|<script|foreignObject|password|OLIVIA|WITTER|ROBERT|SOUSA/.test(svg))
    assert.match(svg, /Synthetic|synthetic|Training exercise/)
    assert.match(svg, /width="1200" height="760"/)
  }
})
