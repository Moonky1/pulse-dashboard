import {SOUND_FILES} from './soundFiles.js'
export const SOUNDS=[['iphone_radar','iPhone Radar'],['reveille','Reveille'],['alarm_effect','Alarm'],['emergency_pulse','Emergency Pulse'],['double_alert','Double Alert'],['shift_bell','Shift Bell'],['critical_alarm','Loud siren']]
const notes={emergency_pulse:[660,880,660,1040],double_alert:[820,820,0,0],shift_bell:[660,880,1100,0],critical_alarm:[540,810,540,1080]}
export class PulseAlarmAudio {
 constructor(makeContext=()=>new (window.AudioContext||window.webkitAudioContext)(),fetchAudio=(...args)=>globalThis.fetch(...args)){this.makeContext=makeContext;this.fetchAudio=fetchAudio;this.context=null;this.nodes=[];this.buffers=new Map();this.loading=new Map();this.generation=0}
 async arm(){try{this.context ||= this.makeContext();await this.context.resume();return this.context.state==='running'}catch{return false}}
 stop(){this.generation++;for(const node of this.nodes){try{node.stop()}catch{/* Already finished. */}node.disconnect?.()}this.nodes=[]}
 async prepare(sounds){await Promise.all([...new Set(sounds)].filter(sound=>SOUND_FILES[sound]).map(async sound=>{
  if(this.buffers.has(sound))return
  if(!this.loading.has(sound))this.loading.set(sound,(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{this.context ||= this.makeContext();const response=await this.fetchAudio(SOUND_FILES[sound],{signal:controller.signal});if(!response.ok)throw Error('Audio unavailable');const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.buffers.set(sound,buffer)}catch{/* Use original siren if a supplied file is temporarily unavailable. */}finally{clearTimeout(timer);this.loading.delete(sound)}})())
  await this.loading.get(sound)
 }))}
 async playAsync(config){this.stop();const generation=this.generation;await this.prepare([config.sound]);if(this.generation!==generation)return false;return this.play(SOUND_FILES[config.sound]&&!this.buffers.has(config.sound)?{...config,sound:'critical_alarm'}:config)}
 play(config){
  this.stop();const ctx=this.context
  if(!ctx || ctx.state!=='running')return false
  const duration=Math.min(30,Math.max(1,Number(config.duration_seconds)||4)*Math.min(3,Math.max(1,Number(config.repeat)||1)))
  const volume=Math.max(0,Math.min(100,Number(config.volume)||0))/100
  if(volume===0)return false
  const pattern=notes[config.sound]||notes.shift_bell,step=config.sound==='shift_bell'?0.32:0.2
  try{
   if(SOUND_FILES[config.sound]){
    const buffer=this.buffers.get(config.sound);if(!buffer)return false
    const source=ctx.createBufferSource(),gain=ctx.createGain(),start=ctx.currentTime,end=start+duration
    source.buffer=buffer;source.loop=true;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.025);gain.gain.setValueAtTime(volume,Math.max(start+.025,end-.06));gain.gain.linearRampToValueAtTime(0,end)
    source.connect(gain);gain.connect(ctx.destination);source.onended=()=>{source.disconnect();gain.disconnect()};source.start(start);source.stop(end);this.nodes.push(source,gain);return true
   }
   if(config.sound==='critical_alarm'){
    const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime,end=start+duration
    osc.type='square';osc.frequency.setValueAtTime(700,start)
    for(let t=.4,i=0;t<duration;t+=.4,i++)osc.frequency.linearRampToValueAtTime(i%2?700:1200,start+t)
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*.22,start+.08);gain.gain.setValueAtTime(volume*.22,end-.1);gain.gain.linearRampToValueAtTime(0,end)
    osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(start);osc.stop(end);this.nodes.push(osc,gain);return true
   }
   for(let t=0,i=0;t<duration;t+=step,i++){
   const frequency=pattern[i%pattern.length];if(!frequency)continue
   const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+t,end=Math.min(start+step*.72,ctx.currentTime+duration)
   osc.type=config.sound==='shift_bell'?'sine':'triangle';osc.frequency.value=frequency
   gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*.13,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,end)
   osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(start);osc.stop(end);this.nodes.push(osc,gain)
  }return true}catch{this.stop();return false}
 }
}
