import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { deflateSync } from 'node:zlib'
import { inspectPng, MAX_BYTES } from '../../supabase/functions/pulse-simulation-media/png.mjs'

function crc(bytes) { let c = 0xffffffff; for (const byte of bytes) { c ^= byte; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0) } return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) { const b = Buffer.alloc(data.length + 12); b.writeUInt32BE(data.length); b.write(type, 4); data.copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, b.length - 4)), b.length - 4); return b }
function png({ w = 2, h = 2, raw = Buffer.alloc(18) } = {}) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]) }
const array = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
test('static PNG validates actual CRC, pixels and dimensions', async () => {
  assert.deepEqual(await inspectPng(array(png())), { width: 2, height: 2 })
  const bad = png(); bad[25] ^= 1; await assert.rejects(inspectPng(array(bad)), /invalid_crc/)
  await assert.rejects(inspectPng(array(png({ w: 5000 }))), /unsupported_png/)
  await assert.rejects(inspectPng(array(png({ raw: Buffer.alloc(19) }))), /oversized_pixels/)
  await assert.rejects(inspectPng(array(png({ raw: Buffer.alloc(17) }))), /truncated_pixels/)
  await assert.rejects(inspectPng(array(Buffer.concat([png(), Buffer.from('trailing')]))), /invalid_end/)
  await assert.rejects(inspectPng(array(Buffer.from('<svg/>'))), /invalid_png/)
  await assert.rejects(inspectPng(array(Buffer.alloc(MAX_BYTES + 1))), /invalid_png/)
})
const source = stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/pulse-simulation-media/index.ts',import.meta.url),'utf8')).replace(/^import[^\r\n]*\r?\n/gm,'')
function runtime({ allowed = true, verified = true, uploadFails = false, finalizeFails = false } = {}) {
  let handler; const calls = []
  const env = { PULSE_SIMULATION_MEDIA_ALLOWED_ORIGINS:'https://sim.preview.test', SUPABASE_URL:'https://backend.test', SUPABASE_ANON_KEY:'public-test', SUPABASE_SERVICE_ROLE_KEY:'server-test' }
  new Function('Deno','createClient','inspectPng','MAX_BYTES',source)({ env: { get: name => env[name] }, serve: cb => { handler = cb } }, (_url,key) => ({
    auth: { getUser: async () => ({ data:{ user: verified ? { id:'auth-test' } : null } }) },
    rpc: async (name,args) => { calls.push([name,args,key]); return { data:allowed,error:null } },
    from: name => {
      const query = { select() { return this }, eq() { return this }, async maybeSingle() {
        calls.push(['read',name,key]); return { data: name==='users' ? { id:'staff-test' } : name==='training_content' ? { content_type:'simulation',status:'draft' } : { status:'ready',media_kind:'simulation_screen',storage_bucket:'training-media',storage_path:'private/test.png',mime_type:'image/png' } }
      }, async insert(value) { calls.push(['insert',name,value,key]); return { error:null } }, update(value) { calls.push(['update',value,key]); return { eq() { return this }, then(resolve) { resolve({ error:value.status==='ready' && finalizeFails ? {} : null }) } } } }
      return query
    },
    storage: { from: () => ({ async createSignedUrl(path,ttl) { calls.push(['sign',path,ttl,key]); return { data:{ signedUrl:'https://backend.test/storage/v1/object/sign/training-media/private/test.png?token=fixture' } } }, async upload(path,bytes,options) { calls.push(['upload',path,options,key]); return { error:uploadFails ? {} : null } }, async remove(paths) { calls.push(['remove',paths,key]); return { error:null } } }) },
  }),inspectPng,MAX_BYTES)
  return { calls, async request(body,{ origin='https://sim.preview.test',auth=true }={}) {
    const multipart = body instanceof FormData
    return handler(new Request('https://backend.test/functions/v1/pulse-simulation-media',{ method:'POST',headers:{ origin,...(auth?{ authorization:'Bearer staff-test' }:{}),...(!multipart?{ 'content-type':'application/json' }: {}) },body:multipart?body:JSON.stringify(body) }))
  } }
}
const id = '11111111-1111-4111-8111-111111111111'
const read = { action:'read',contentId:id,mediaId:id,attemptId:id }
function upload() { const f=new FormData(); f.set('action','upload'); f.set('contentId',id); f.set('file',new File([png()],'screen.png',{ type:'image/png' })); return f }
test('unconfigured origin, anonymous and invalid Auth never sign or upload', async () => {
  const r=runtime(); assert.equal((await r.request(read,{ origin:'https://other.test' })).status,403); assert.equal((await r.request(read,{ auth:false })).status,401); assert.equal(r.calls.length,0)
  const bad=runtime({ verified:false }); assert.equal((await bad.request(read)).status,401); assert.equal(bad.calls.length,0)
})
test('screen signing needs live own-step authorization; a deny never reads paths', async () => {
  const deny=runtime({ allowed:false }); assert.equal((await deny.request(read)).status,403); assert.deepEqual(deny.calls.map(c=>c[0]),['can_read_simulation_screen'])
  const yes=runtime(); assert.equal((await yes.request(read)).status,200); assert.equal(yes.calls[0][2],'public-test'); assert.deepEqual(yes.calls.at(-1),['sign','private/test.png',120,'server-test'])
})
test('upload checks writable simulation, validates bytes, registers pending then finalizes', async () => {
  const r=runtime(); const response=await r.request(upload()); assert.equal(response.status,200); assert.ok((await response.json()).mediaId)
  const row=r.calls.find(c=>c[0]==='insert')[2]; assert.equal(row.status,'pending'); assert.equal(row.media_kind,'simulation_screen'); assert.equal(row.width_px,2)
  assert.deepEqual(r.calls.find(c=>c[0]==='upload')[2],{ contentType:'image/png',upsert:false,cacheControl:'120' })
  assert.equal(r.calls.at(-1)[1].status,'ready')
})
test('failed finalization removes only the new object and marks its pending row deleted', async () => {
  const r=runtime({ finalizeFails:true }); assert.equal((await r.request(upload())).status,503); assert.equal(r.calls.filter(c=>c[0]==='remove').length,1); assert.equal(r.calls.at(-1)[1].status,'deleted')
})
