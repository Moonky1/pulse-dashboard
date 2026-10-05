import assert from 'node:assert/strict'
import test from 'node:test'

import { GO_SOUND_NOTES, goSoundEnabled, playGoSound, practiceCompletionSound, setGoSoundEnabled } from './goSoundEffects.js'

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

test('Practice endings match existing result headings without changing scoring', () => {
  assert.equal(practiceCompletionSound(100), 'practice-high')
  assert.equal(practiceCompletionSound('85.00'), 'practice-high')
  assert.equal(practiceCompletionSound(84.99), 'practice-mid')
  assert.equal(practiceCompletionSound(65), 'practice-mid')
  assert.equal(practiceCompletionSound(64.99), 'practice-low')
  assert.equal(practiceCompletionSound(0), 'practice-low')
  for (const score of [null, undefined, '', NaN, 'invalid']) assert.equal(practiceCompletionSound(score), 'complete')
  for (const kind of ['practice-high', 'practice-mid', 'practice-low']) {
    assert.ok(GO_SOUND_NOTES[kind].every(([frequency, offset, duration]) => frequency > 0 && offset >= 0 && duration > 0 && offset + duration <= 1))
  }
  assert.notDeepEqual(GO_SOUND_NOTES['practice-high'], GO_SOUND_NOTES['practice-mid'])
  assert.notDeepEqual(GO_SOUND_NOTES['practice-mid'], GO_SOUND_NOTES['practice-low'])
})

test('Practice celebration is delayed after feedback, gently bounded, and respects mute', () => {
  const scheduled = []
  globalThis.AudioContext = class {
    currentTime = 10
    state = 'running'
    destination = {}
    createOscillator() {
      const note = {}; scheduled.push(note)
      return { frequency: { setValueAtTime: value => { note.frequency = value } }, connect() {}, start: value => { note.start = value }, stop: value => { note.stop = value } }
    }
    createGain() {
      const note = scheduled.at(-1)
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime: value => { note.peak = Math.max(note.peak || 0, value) } }, connect() {} }
    }
  }
  try {
    setGoSoundEnabled(true)
    assert.equal(playGoSound('practice-high', 0.55), true)
    assert.equal(scheduled.length, 6)
    assert.equal(scheduled[0].start, 10.55)
    assert.ok(scheduled.every(note => note.peak === 0.045 && note.stop - note.start < 0.5))
    assert.equal(scheduled[3].start, scheduled[4].start, 'final chord is simultaneous')
    setGoSoundEnabled(false)
    assert.equal(playGoSound('practice-low'), false)
    assert.equal(scheduled.length, 6)
  } finally { delete globalThis.AudioContext; setGoSoundEnabled(true) }
})
