import './lab.css'
import { PRESETS } from './material.js'
import { createMaterial } from './renderer.js'

document.querySelector('#lab').innerHTML = `
<header><span>PULSE / FX-1C</span><span>LOCAL CAUSTIC CALIBRATION · A FIRST</span></header>
<h1>Light through matter.</h1><p>Reference analysis · optical volume before product integration.</p>
<nav class="lab-nav"><a href="#comparison">Compare material</a><a href="#analysis">Reference sequence</a></nav>
<div class="toolbar" aria-label="Reproducible interaction states">${['live','idle','left','center','right','press'].map(s=>`<button data-state="${s}" aria-pressed="${s==='center'}">${s}</button>`).join('')}<label><input type="checkbox" id="freeze" checked> Freeze frame</label><button id="advance">+1.0s</button><label><input type="checkbox" id="fallback"> CSS fallback</label><output id="frame">Frame 2.6s</output><label><input type="checkbox" id="motion-study"> Motion study (lab override of OS reduced motion)</label></div>
<div class="toolbar" aria-label="Reference comparison timestamps">${[[.46,'center','Early'],[2.13,'idle','Idle'],[3.79,'right','Late'],[4.63,'left','End']].map(([t,s,label])=>`<button data-comparison-time="${t}" data-comparison-state="${s}">${label} ${t}s</button>`).join('')}<span>Matched clock; interaction is a labeled approximation, not recovered reference input.</span></div>
<section id="comparison" class="comparison">
  <article class="sample reference-sample"><div class="sample-title"><b>REFERENCE</b><span>03 · supplied video</span></div><div class="stage"><canvas id="reference-frame" width="960" height="340"></canvas></div><p id="reference-caption">Loading reference…</p></article>
  ${Object.entries(PRESETS).map(([id,p])=>`<article class="sample"><div class="sample-title"><b>${id}</b><span>${p.label}</span></div><div class="stage"><div class="material"><canvas id="material-${id}" aria-hidden="true"></canvas><span class="sample-label"><i>+</i> Add new</span></div></div><p id="status-${id}">Waiting for viewport</p></article>`).join('')}
</section>
<section class="orb-section"><div><h2>Radial translation · candidate B</h2><p>Same environment, refracted through a curved lens. Stationary graphite core; no rotating color map.</p></div><div class="orb-stage"><canvas id="orb" aria-label="Optical orb prototype"></canvas></div><p id="orb-status"></p></section>
<section class="tuning"><h2>Material calibration · A only</h2><p>B/C retain legacy parameter sets, are not newly calibrated or approved. Orb is deferred.</p><div id="controls"></div><button id="reset">Reset A</button></section>
<section id="analysis" class="references"><article><h2>Reference 03 · ribbon</h2><video id="ref3" src="/__reference/3.mp4" controls muted playsinline></video><div class="filmstrip" id="strip3"></div></article><article><h2>Reference 05 · optical ring</h2><video id="ref5" src="/__reference/5.mp4" controls muted playsinline></video><div class="filmstrip" id="strip5"></div></article></section>
<footer>FX-1C · local only · no product routes or backend connections</footer>`

const renderers = Object.fromEntries(Object.entries(PRESETS).map(([id,p])=>[id,createMaterial(document.querySelector(`#material-${id}`),p,{onStatus:status=>{document.querySelector(`#status-${id}`).textContent=status}})]))
renderers.orb=createMaterial(document.querySelector('#orb'),PRESETS.B,{shape:1,onStatus:status=>{document.querySelector('#orb-status').textContent=status}})
let frozenTime=2.6
Object.values(renderers).forEach(r=>{r.setState('center');r.setFrame(frozenTime)})
document.querySelectorAll('[data-state]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))
  Object.values(renderers).forEach(r=>r.setState(button.dataset.state))
}))
document.querySelector('#freeze').addEventListener('change',e=>Object.values(renderers).forEach(r=>r.setFrame(e.target.checked?frozenTime:null)))
document.querySelector('#motion-study').addEventListener('change',e=>Object.values(renderers).forEach(r=>r.setMotionStudy(e.target.checked)))
document.querySelector('#advance').addEventListener('click',()=>{frozenTime+=1;document.querySelector('#freeze').checked=true;Object.values(renderers).forEach(r=>r.setFrame(frozenTime));document.querySelector('#frame').textContent=`Frame ${frozenTime.toFixed(1)}s`})
document.querySelector('#fallback').addEventListener('change',e=>document.body.classList.toggle('force-fallback',e.target.checked))
let tuning={...PRESETS.A}
const controls=[['dispersion',0,.3,.005],['bend',.1,1.5,.02],['thickness',.2,1.4,.02],['fresnel',0,1.5,.02],['specular',0,2,.02],['caustic',0,2,.02],['noiseScale',.3,4,.05],['speed',0,.7,.01],['pointer',0,1.5,.02],['absorption',0,1.5,.02],['balance',0,1,.02]]
function buildControls(){document.querySelector('#controls').innerHTML=controls.map(([key,min,max,step])=>`<label>${key}<output id="value-${key}">${tuning[key].toFixed(2)}</output><input aria-label="${key}" data-control="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${tuning[key]}"></label>`).join('');document.querySelectorAll('[data-control]').forEach(input=>input.addEventListener('input',()=>{tuning[input.dataset.control]=Number(input.value);document.querySelector(`#value-${input.dataset.control}`).textContent=Number(input.value).toFixed(2);renderers.A.setConfig(tuning)}))}
buildControls()
document.querySelector('#reset').addEventListener('click',()=>{tuning={...PRESETS.A};renderers.A.setConfig(tuning);buildControls()})
document.querySelectorAll('[data-comparison-time]').forEach(button=>button.addEventListener('click',()=>{
  const player=document.querySelector('#ref3')
  player.pause()
  player.currentTime=Number(button.dataset.comparisonTime)
  frozenTime=player.currentTime
  document.querySelector('#freeze').checked=true
  document.querySelector('#frame').textContent=`Frame ${frozenTime.toFixed(2)}s`
  document.querySelector(`[data-state="${button.dataset.comparisonState}"]`).click()
  Object.values(renderers).forEach(r=>r.setFrame(frozenTime))
}))
const statsTimer=setInterval(()=>{for(const [id,r] of Object.entries(renderers)){const s=r.stats();document.querySelector(id==='orb'?'#orb-status':`#status-${id}`).textContent=s.error?`Fallback: ${s.error}`:`${s.width}×${s.height} · ${s.draws} draws · ${s.visible?'visible':'paused offscreen'}${s.reduced?' · OS reduced motion':''}`}},800)
window.addEventListener('pagehide',()=>{clearInterval(statsTimer);Object.values(renderers).forEach(r=>r.destroy())},{once:true})

async function filmstrip(id) {
  const player = document.querySelector(`#ref${id}`)
  if(id===3){
    const updateFrame=()=>{if(player.readyState<2)return;const canvas=document.querySelector('#reference-frame');canvas.getContext('2d').drawImage(player,0,350,1080,382,0,0,960,340);document.querySelector('#reference-caption').textContent=`Reference frame ${player.currentTime.toFixed(2)}s / ${player.duration.toFixed(2)}s`}
    player.addEventListener('seeked',updateFrame)
    player.addEventListener('timeupdate',updateFrame)
    player.addEventListener('loadeddata',()=>{player.currentTime=.46},{once:true})
    // Decode-driven updates avoid the coarse timeupdate cadence during playback.
    if(player.requestVideoFrameCallback){
      const decodedFrame=()=>{updateFrame();player.requestVideoFrameCallback(decodedFrame)}
      player.requestVideoFrameCallback(decodedFrame)
    }
  }
  const stepping=document.createElement('div')
  stepping.className='frame-stepping'
  for(const [label,amount] of [['−1/30s',-1/30],['+1/30s',1/30]]){
    const step=document.createElement('button')
    step.textContent=`Ref ${id}: ${label}`
    step.addEventListener('click',()=>{player.pause();player.currentTime=Math.min(player.duration,Math.max(0,player.currentTime+amount))})
    stepping.append(step)
  }
  player.after(stepping)
  const decoder = document.createElement('video')
  decoder.muted = true
  decoder.src = `/__reference/${id}.mp4`
  await new Promise((resolve,reject) => { decoder.onloadedmetadata = resolve; decoder.onerror=()=>reject(new Error('Local video unavailable')) })
  const strip = document.querySelector(`#strip${id}`)
  for (let i = 0; i < 12; i++) {
    const time = (i + 0.1) / 12 * decoder.duration
    await new Promise(resolve => { decoder.onseeked = resolve; decoder.currentTime = time })
    const button = document.createElement('button')
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 320
    canvas.getContext('2d').drawImage(decoder, 0, 0, 320, 320)
    button.append(canvas, `${time.toFixed(2)}s`)
    button.addEventListener('click', () => { player.pause(); player.currentTime = time })
    strip.append(button)
  }
  player.currentTime = id===3?.46:1.29
  decoder.removeAttribute('src')
  decoder.load()
}
for(const id of [3,5])filmstrip(id).catch(()=>{document.querySelector(`#strip${id}`).textContent=`Place reference ${id} in Downloads and reload. The shader does not require it.`})
