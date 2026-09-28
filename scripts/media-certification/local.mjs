import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { createClient } from '@supabase/supabase-js'

const url = process.env.PULSE_TEST_API_URL
const anonKey = process.env.PULSE_TEST_ANON_KEY
const serviceKey = process.env.PULSE_TEST_SERVICE_KEY
const localTarget = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url || '')
if (!localTarget || !anonKey || !serviceKey) {
  throw new Error('Only the isolated local Supabase stack is allowed.')
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const contentId = randomUUID()
const samples = []
const endpoint = `${url}/functions/v1/pulse-training-media`

function check(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`)
  return result.data
}
function crc32(buffer) {
  let crc = -1
  for (const byte of buffer) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ -1) >>> 0
}
function pngChunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, crc])
}
function syntheticPng() {
  const size = 64
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4)
  header[8] = 8; header[9] = 6
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    for (let x = 0; x < size; x++) {
      const offset = 1 + x * 4
      row[offset] = 20 + x * 2
      row[offset + 1] = 65 + y * 2
      row[offset + 2] = 150 + Math.floor((x + y) / 4)
      row[offset + 3] = 255
    }
    rows.push(row)
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(Buffer.concat(rows))), pngChunk('IEND', Buffer.alloc(0))])
}
function syntheticMp3() {
  // MPEG-1 Layer III silent frames. No sampled music or third-party material.
  const frame = Buffer.alloc(417)
  frame.set([0xff, 0xfb, 0x90, 0x64])
  return Buffer.concat(Array.from({ length: 40 }, () => frame))
}
async function createStaff(label, role) {
  const email = `media-${label.toLowerCase()}-${randomUUID()}@example.test`
  const password = `${randomUUID()}Aa!`
  const created = check(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'create test Auth user')
  const staffId = randomUUID()
  check(await admin.from('users').insert({ id: staffId, auth_user_id: created.user.id,
    employee_id: `KK-${Math.floor(100000 + Math.random() * 899999)}`, email,
    full_name: `Media ${label}`, status: 'active', approved_at: new Date().toISOString() }), 'create test Staff')
  if (role) check(await admin.from('user_roles').insert({ id: randomUUID(), user_id: staffId,
    role_id: '10000000-0000-0000-0000-000000000010', scope_type: 'global',
    assigned_by_user_id: staffId }), 'grant local Studio role')
  const signed = check(await publicClient.auth.signInWithPassword({ email, password }), 'sign in test Staff')
  return { staffId, token: signed.session.access_token }
}
async function invoke(action, token, body, headers = {}) {
  const response = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(15000), headers: {
    apikey: anonKey, ...(localTarget ? { Origin: 'http://localhost:5173' } : {}), 'x-pulse-action': action,
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers,
  }, body })
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}
async function upload(token, kind, mime, bytes) {
  return invoke('upload', token, bytes, { 'content-type': mime,
    'x-pulse-content-id': contentId, 'x-pulse-kind': kind,
    'x-pulse-upload-key': randomUUID(), 'x-pulse-path': '../../forged' })
}
function browserReachableSignedUrl(value) {
  const signed = new URL(value)
  if (signed.hostname === 'kong') {
    const local = new URL(url)
    signed.protocol = local.protocol
    signed.host = local.host
  }
  return signed.toString()
}

async function run() {
const owner = await createStaff('Owner', true)
const outsider = await createStaff('Other', false)
const ownerClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${owner.token}` } },
  auth: { persistSession: false, autoRefreshToken: false } })
check(await admin.from('training_content').insert({ id: contentId, content_type: 'quiz',
  title: 'Local synthetic media certification', language: 'en', status: 'draft',
  created_by_user_id: owner.staffId }), 'create local draft')
check(await admin.from('training_content_audiences').insert({ content_id: contentId, scope_type: 'global' }), 'create local audience')

const image = syntheticPng()
const audio = syntheticMp3()
let result = await upload(null, 'game_cover', 'image/png', image)
assert.equal(result.status, 401, 'anonymous upload denied')
result = await upload(outsider.token, 'game_cover', 'image/png', image)
assert.equal(result.status, 403, `unrelated Staff upload denied: ${JSON.stringify(result.data)}`)
result = await upload(owner.token, 'game_cover', 'audio/mpeg', image)
assert.equal(result.status, 400, 'kind/MIME mismatch denied')
result = await upload(owner.token, 'game_cover', 'image/png', audio)
assert.equal(result.status, 415, 'spoofed PNG bytes denied')
result = await upload(owner.token, 'game_cover', 'image/png', Buffer.from('<html>script</html>'.padEnd(100)))
assert.equal(result.status, 415, 'script-like binary denied')
result = await upload(owner.token, 'game_cover', 'image/png', Buffer.alloc(2 * 1024 * 1024 + 1))
assert.equal(result.status, 413, 'oversized image denied')
result = await upload(owner.token, 'lobby_audio', 'audio/mpeg', Buffer.alloc(4 * 1024 * 1024 + 1))
assert.equal(result.status, 413, 'oversized audio denied')
console.log('Local media negative upload checks PASS.')

result = await upload(owner.token, 'game_cover', 'image/png', image)
assert.equal(result.status, 200, `image upload: ${JSON.stringify(result.data)}`)
const coverId = result.data.mediaId
console.log('Local synthetic cover upload PASS.')
samples.push(coverId)
let metadata = check(await admin.from('training_media').select('storage_path,status').eq('id', coverId).single(), 'read image metadata')
assert.equal(metadata.storage_path, `training/${coverId}/source.png`, 'path is server-generated')
assert.equal(metadata.status, 'ready')
let row = check(await admin.from('training_content').select('updated_at').eq('id', contentId).single(), 'read draft timestamp')
check(await ownerClient.rpc('set_training_content_media', { requested_content_id: contentId,
  requested_cover_media_id: coverId, requested_lobby_audio_media_id: null,
  expected_updated_at: row.updated_at }), 'attach image')

result = await invoke('read', null, JSON.stringify({ mediaId: coverId, contentId }), { 'content-type': 'application/json' })
assert.equal(result.status, 401, 'anonymous signed read denied')
result = await invoke('read', outsider.token, JSON.stringify({ mediaId: coverId, contentId }), { 'content-type': 'application/json' })
assert.equal(result.status, 404, 'other Staff read denied')
result = await invoke('read', owner.token, JSON.stringify({ mediaId: coverId, contentId }), { 'content-type': 'application/json' })
assert.equal(result.status, 200, `authorized image read: ${JSON.stringify(result.data)}`)
assert.equal((await fetch(browserReachableSignedUrl(result.data.url))).status, 200, 'signed image URL works')
console.log('Local signed cover read PASS.')

result = await upload(owner.token, 'lobby_audio', 'audio/mpeg', audio)
assert.equal(result.status, 200, `audio upload: ${JSON.stringify(result.data)}`)
const audioId = result.data.mediaId
console.log('Local synthetic audio upload PASS.')
samples.push(audioId)
row = check(await admin.from('training_content').select('updated_at').eq('id', contentId).single(), 'read draft timestamp')
check(await ownerClient.rpc('set_training_content_media', { requested_content_id: contentId,
  requested_cover_media_id: coverId, requested_lobby_audio_media_id: audioId,
  expected_updated_at: row.updated_at }), 'attach audio')
result = await invoke('read', owner.token, JSON.stringify({ mediaId: audioId, contentId }), { 'content-type': 'application/json' })
assert.equal(result.status, 200, `authorized audio read: ${JSON.stringify(result.data)}`)
assert.equal((await fetch(browserReachableSignedUrl(result.data.url))).status, 200, 'signed audio URL works')

result = await invoke('delete', owner.token, JSON.stringify({ mediaId: coverId }), { 'content-type': 'application/json' })
assert.equal(result.status, 404, 'attached image delete denied')
row = check(await admin.from('training_content').select('updated_at').eq('id', contentId).single(), 'read draft timestamp')
check(await ownerClient.rpc('set_training_content_media', { requested_content_id: contentId,
  requested_cover_media_id: null, requested_lobby_audio_media_id: null,
  expected_updated_at: row.updated_at }), 'detach draft media')
for (const mediaId of samples) {
  result = await invoke('delete', owner.token, JSON.stringify({ mediaId }), { 'content-type': 'application/json' })
  assert.equal(result.status, 200, `unreferenced media deleted: ${JSON.stringify(result.data)}`)
  result = await invoke('delete', owner.token, JSON.stringify({ mediaId }), { 'content-type': 'application/json' })
  assert.equal(result.status, 200, 'delete retry is idempotent')
}
console.log('Local media E2E PASS: image, audio, signed reads, draft detach/delete, and negative security cases.')
}
await run()
