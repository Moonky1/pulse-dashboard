import assert from 'node:assert/strict'
import test from 'node:test'
import { encodePcmWav, validateAudioSelection } from './audioClip.js'

test('clip selection stays inside source audio and the question timer', () => {
  assert.equal(validateAudioSelection(42, 60, 120, 30), null)
  assert.match(validateAudioSelection(42, 80, 120, 30), /time limit/)
  assert.match(validateAudioSelection(110, 125, 120, 30), /time limit/)
  assert.match(validateAudioSelection(-1, 10, 120, 30), /time limit/)
  assert.match(validateAudioSelection(10, 10, 120, 30), /time limit/)
})

test('encoder produces a bounded mono 22.05 kHz PCM WAV with only the selected samples', () => {
  const bytes = encodePcmWav(new Float32Array([-1, 0, 1]))
  const view = new DataView(bytes)
  assert.equal(bytes.byteLength, 50)
  assert.equal(String.fromCharCode(...new Uint8Array(bytes, 0, 4)), 'RIFF')
  assert.equal(String.fromCharCode(...new Uint8Array(bytes, 8, 4)), 'WAVE')
  assert.equal(view.getUint32(4, true), 42)
  assert.equal(view.getUint16(20, true), 1)
  assert.equal(view.getUint16(22, true), 1)
  assert.equal(view.getUint32(24, true), 22050)
  assert.equal(view.getInt16(44, true), -32768)
  assert.equal(view.getInt16(46, true), 0)
  assert.equal(view.getInt16(48, true), 32767)
})
