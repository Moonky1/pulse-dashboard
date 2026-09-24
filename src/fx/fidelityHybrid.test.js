import assert from 'node:assert/strict'
import test from 'node:test'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'
import { createOpticalPixels, encodeOpticalPng, rayLanding, WIDTH, HEIGHT } from '../../scripts/fx/generate-optical-map.mjs'
import { createOpticalTexture } from './fidelity/opticalTexture.js'

test('first-party optical asset is reproducible, scalar and small', async () => {
  const pixels=createOpticalPixels(), png=encodeOpticalPng(pixels)
  assert.deepEqual(png,await readFile(new URL('./fidelity/optical-energy.png',import.meta.url)))
  assert.equal(WIDTH,256);assert.equal(HEIGHT,128)
  assert.ok(png.length<12000)
  assert.equal(png[25],0) // grayscale PNG, not baked chromatic data
  const decoded=[]
  for(let p=8;p<png.length;){const size=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')decoded.push(png.subarray(p+8,p+8+size));p+=size+12}
  const rows=inflateSync(Buffer.concat(decoded))
  const restored=new Uint8Array(WIDTH*HEIGHT)
  for(let y=0;y<HEIGHT;y++){
    assert.equal(rows[y*(WIDTH+1)],1)
    for(let x=0;x<WIDTH;x++)restored[y*WIDTH+x]=(rows[y*(WIDTH+1)+x+1]+(x?restored[y*WIDTH+x-1]:0))%256
  }
  assert.deepEqual(restored,pixels)
})

test('ray field tiles continuously and has sparse concentrated energy',()=>{
  for(const [u,v] of [[.02,.07],[.4,.3],[.91,.87]]){
    const p=rayLanding(u,v),px=rayLanding(u+1,v),py=rayLanding(u,v+1)
    assert.ok(Math.abs(px[0]-p[0]-1)<1e-12&&Math.abs(px[1]-p[1])<1e-12)
    assert.ok(Math.abs(py[0]-p[0])<1e-12&&Math.abs(py[1]-p[1]-1)<1e-12)
  }
  const pixels=createOpticalPixels(),bright=pixels.filter(v=>v>180).length/pixels.length
  assert.ok(bright>.002&&bright<.15,`bright fraction ${bright}`)
  assert.ok(pixels.filter(v=>v<50).length/pixels.length>.5)
})

function fixture(enabled=true){
  const calls=[],image={naturalWidth:256,naturalHeight:128},events=[]
  const gl=Object.fromEntries(['TEXTURE0','TEXTURE_2D','RGBA','UNSIGNED_BYTE','LINEAR','REPEAT','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','TEXTURE_WRAP_S','TEXTURE_WRAP_T','UNPACK_COLORSPACE_CONVERSION_WEBGL','NONE'].map(x=>[x,x]))
  for(const method of ['activeTexture','bindTexture','texImage2D','texParameteri','pixelStorei','deleteTexture'])gl[method]=(...args)=>calls.push([method,...args])
  gl.createTexture=()=>({texture:true})
  const loader=createOpticalTexture(gl,{enabled,url:'local-map.png',makeImage:()=>image,onReady:()=>events.push('ready'),onError:e=>events.push(e.message)})
  return {calls,image,events,loader}
}

test('optical upload is linear data with no mipmaps and only A loads the asset',()=>{
  const baseline=fixture(false)
  assert.equal(baseline.image.src,undefined)
  assert.equal(baseline.calls.filter(c=>c[0]==='texImage2D').length,1)
  const f=fixture();f.image.onload()
  assert.deepEqual(f.events,['ready'])
  assert.ok(f.calls.some(c=>c[0]==='pixelStorei'&&c[1]==='UNPACK_COLORSPACE_CONVERSION_WEBGL'&&c[2]==='NONE'))
  assert.equal(f.calls.filter(c=>c[0]==='texImage2D').length,2)
})

test('missing or invalid texture reports failure rather than claiming hybrid readiness',()=>{
  const missing=fixture();missing.image.onerror()
  assert.deepEqual(missing.events,['Optical map unavailable'])
  const invalid=fixture();invalid.image.naturalWidth=255;invalid.image.onload()
  assert.deepEqual(invalid.events,['Unexpected optical map dimensions'])
})

test('disposed/lost-context texture ignores stale image callbacks and restoration can reload',()=>{
  const f=fixture(),lateLoad=f.image.onload,lateError=f.image.onerror
  f.loader.dispose();lateLoad();lateError()
  assert.deepEqual(f.events,[])
  assert.equal(f.calls.filter(c=>c[0]==='deleteTexture').length,1)
  const restored=fixture();restored.image.onload()
  assert.deepEqual(restored.events,['ready'])
})

test('hybrid shader and loader remain confined to standalone fidelity lab',async()=>{
  const read=path=>readFile(new URL(path,import.meta.url),'utf8')
  const [lab,shader,entry,auth]=await Promise.all([read('./fidelity/lab.js'),read('./fidelity/material.js'),read('../../index.html'),read('../auth/AuthApp.jsx')])
  assert.match(lab,/hybrid:id==='A'/)
  assert.equal((shader.match(/texture2D\(opticalMap/g)||[]).length,2)
  assert.doesNotMatch(entry+auth,/fidelity|optical-energy/)
})
