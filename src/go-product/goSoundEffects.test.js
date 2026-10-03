import assert from 'node:assert/strict'
import test from 'node:test'

import { GO_SOUND_NOTES, goSoundEnabled, playGoSound, setGoSoundEnabled } from './goSoundEffects.js'

test('GO uses short, distinct sound signatures without an external audio file', () => {
  for (const kind of ['correct', 'incorrect', 'complete']) {
    assert.ok(GO_SOUND_NOTES[kind].length >= 2)
    assert.ok(GO_SOUND_NOTES[kind].every(([, offset, duration]) => offset >= 0 && duration > 0 && duration <= 0.3))
  }
  assert.notDeepEqual(GO_SOUND_NOTES.correct, GO_SOUND_NOTES.incorrect)
  assert.notDeepEqual(GO_SOUND_NOTES.correct, GO_SOUND_NOTES.complete)
})

test('sound effects can be disabled and are harmless without Web Audio', () => {
  setGoSoundEnabled(false)
  assert.equal(goSoundEnabled(), false)
  assert.equal(playGoSound('correct'), false)
  setGoSoundEnabled(true)
  assert.equal(playGoSound('unknown'), false)
})
