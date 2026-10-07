import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const map = JSON.parse(readFileSync(new URL('../../docs/training/sim-1-source-map.json', import.meta.url), 'utf8'))

test('all 63 source pages are indexed exactly once in their own deck', () => {
  assert.equal(map.sources.reduce((sum, source) => sum + source.pages, 0), 63)
  for (const source of map.sources) {
    const pages = source.page_index.flatMap(entry => entry.pages).sort((a, b) => a - b)
    assert.deepEqual(pages, Array.from({ length: source.pages }, (_, i) => i + 1))
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
  }
})

test('five captures and the separately supplied login screen are recorded', () => {
  assert.equal(map.attached_screenshots.length, 5)
  assert.match(map.attached_screenshots.at(-1).source, /Separate supplied login capture/)
})

test('manual Callback is six source-grounded steps across two screens', () => {
  const callback = map.workflows.find(flow => flow.id === 'callback_manual_dial')
  assert.equal(callback.priority, 1)
  assert.deepEqual(callback.steps.map(step => step.order), [1, 2, 3, 4, 5, 6])
  assert.deepEqual([...new Set(callback.steps.map(step => step.screen_page))], [30, 31])
  assert.match(callback.steps.at(-1).success, /no real dialing/)
  assert.match(callback.steps[4].validation, /no inferred company length policy/)
})

test('direct team clarification overrides universal Spanish routing', () => {
  const clarification = map.direct_user_clarification
  assert.deepEqual(clarification.spanish_handling_teams, ['Venezuela', 'Central America', 'Colombia'])
  assert.deepEqual(clarification.immediate_spanish_routing_teams, ['Asia', 'Philippines', 'Mexico'])
  const routing = map.workflows.find(flow => flow.id === 'spanish_immediate_local_closer')
  assert.ok(routing.actions.includes('LOCAL CLOSER immediately'))
  assert.ok(routing.not_authorized_actions.includes('Spanish Speaker disposition'))
  assert.match(clarification.implementation_note, /canonical campaign\/team IDs/)
})

test('unresolved policies cannot silently become completed simulations', () => {
  for (const id of ['timing', 'local_terminal', 'spanish_destination', 'spanish_hangup', 'pause_scope', 'clean_media']) {
    assert.ok(map.unresolved.some(item => item.id === id), id)
  }
  assert.equal(map.delivery.preview_url, null)
  assert.match(map.delivery.production_review, /^NO-GO/)
  assert.equal(map.backend_gap.proposed_next_checkpoint.not_implemented, true)
})

test('private-media and separate learner security gaps are explicit', () => {
  const gaps = map.backend_gap.missing.join(' ')
  assert.match(gaps, /screenshot upload\/read/)
  assert.match(gaps, /trusted session identity/)
  assert.match(gaps, /server-evaluated/)
  assert.match(map.backend_gap.proposed_next_checkpoint.authorization, /no new roles or broad table grants/)
})

test('source-map stores no raw source credentials or customer records', () => {
  const serialized = JSON.stringify(map)
  assert.doesNotMatch(serialized, /https?:\/\/|[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}|"password"\s*:\s*"|"phone_number"\s*:\s*"/i)
  assert.match(map.sources[1].page_index.find(item => item.pages.includes(6)).topic, /credentials, excluded/)
})

test('published historical identity and Production boundary remain explicit', () => {
  assert.equal(map.base_sha, '9fc0521d50698e48228745752502da1ec9af4250')
  assert.match(map.release_scope, /no main merge or Production deployment/)
  assert.match(map.backend_gap.missing.join(' '), /version-pinned attempts/)
})
