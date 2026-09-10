import assert from 'node:assert/strict'
import test from 'node:test'

import { hostedAnswerReady, languagePresentation, normalizeHostedRoom, normalizeRoomCode, resultMedal, roomPath } from './goHostedModel.js'

test('room codes normalize only to the canonical visible format', () => {
  assert.equal(normalizeRoomCode('kk-1234'), 'KK 1234')
  assert.equal(normalizeRoomCode(' KK 9876 '), 'KK 9876')
  assert.equal(normalizeRoomCode('not-a-code'), 'NOTACO')
})

test('hosted room normalization rejects unsafe or malformed snapshots', () => {
  const room = { status: 'lobby', viewer_role: 'host', version: 1, session_id: 'one' }
  assert.deepEqual(normalizeHostedRoom(room), room)
  assert.equal(normalizeHostedRoom({ ...room, status: 'invented' }), null)
  assert.equal(normalizeHostedRoom({ ...room, current_question: { correct_answer: 2 } }), null)
  assert.equal(normalizeHostedRoom({ ...room, current_question: { explanation: 'secret' } }), null)
})

test('host and participant receive separate canonical routes', () => {
  assert.equal(roomPath({ viewer_role: 'host', session_id: 'abc' }), '/go/host/abc')
  assert.equal(roomPath({ viewer_role: 'participant', session_id: 'abc' }), '/go/room/abc')
})

test('answer readiness supports the three certified question types', () => {
  assert.equal(hostedAnswerReady({ question_type: 'multiple_choice' }, 0), true)
  assert.equal(hostedAnswerReady({ question_type: 'true_false' }, false), true)
  assert.equal(hostedAnswerReady({ question_type: 'text' }, ' Alpha '), true)
  assert.equal(hostedAnswerReady({ question_type: 'text' }, '  '), false)
})

test('language and results reuse restrained legacy visual vocabulary', () => {
  assert.deepEqual(languagePresentation('es'), { flag: '🇲🇽', label: 'Español' })
  assert.equal(languagePresentation('en').label, 'English')
  assert.equal(resultMedal(90).image, '/emojis/medal1.webp')
  assert.equal(resultMedal(70).image, '/emojis/medal2.webp')
  assert.equal(resultMedal(20).image, '/emojis/medal3.webp')
})
