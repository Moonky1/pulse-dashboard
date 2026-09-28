import assert from 'node:assert/strict'
import test from 'node:test'

import { getTrainingMediaUrl, removeTrainingMedia, uploadTrainingMedia, validateTrainingMedia } from './trainingMedia.js'

const CONTENT = '11111111-1111-4111-8111-111111111111'
const MEDIA = '22222222-2222-4222-8222-222222222222'
const KEY = '33333333-3333-4333-8333-333333333333'

function client() {
  const calls = []
  return {
    calls,
    supabaseUrl: 'http://127.0.0.1:54321',
    functions: { invoke: async (name, options) => {
      calls.push({ name, options })
      return { data: options.headers['x-pulse-action'] === 'upload' ? { mediaId: MEDIA } :
        options.headers['x-pulse-action'] === 'delete' ? { removed: true } :
          { url: 'https://example.test/signed', expiresIn: 300 }, error: null }
    } },
  }
}

test('Training media validates image/audio purpose, type, and bounded size before sending', () => {
  assert.equal(validateTrainingMedia({ type: 'image/png', size: 512 }, 'game_cover'), null)
  assert.equal(validateTrainingMedia({ type: 'audio/mpeg', size: 512 }, 'lobby_audio'), null)
  assert.match(validateTrainingMedia({ type: 'image/svg+xml', size: 512 }, 'game_cover'), /supported/)
  assert.match(validateTrainingMedia({ type: 'text/html', size: 512 }, 'question_image'), /supported/)
  assert.match(validateTrainingMedia({ type: 'audio/mpeg', size: 5 * 1024 * 1024 }, 'lobby_audio'), /4 MB/)
  assert.match(validateTrainingMedia({ type: 'image/png', size: 3 * 1024 * 1024 }, 'game_cover'), /2 MB/)
})

test('upload delegates binary to a single protected Edge boundary without choosing Storage paths', async () => {
  const connection = client()
  const file = { type: 'image/png', size: 512 }
  assert.equal(await uploadTrainingMedia(connection, CONTENT, 'game_cover', file, KEY), MEDIA)
  assert.deepEqual(connection.calls, [{ name: 'pulse-training-media', options: {
    body: file, headers: { 'x-pulse-action': 'upload', 'x-pulse-content-id': CONTENT,
      'x-pulse-kind': 'game_cover', 'x-pulse-upload-key': KEY, 'Content-Type': 'image/png' },
  } }])
})

test('signed reads and deletion use the same protected media boundary', async () => {
  const connection = client()
  assert.equal(await getTrainingMediaUrl(connection, MEDIA, CONTENT), 'https://example.test/signed')
  await removeTrainingMedia(connection, MEDIA)
  assert.deepEqual(connection.calls.map(call => call.options.headers['x-pulse-action']), ['read', 'delete'])
  assert.equal(await getTrainingMediaUrl(connection, 'bad', CONTENT), null)
})
