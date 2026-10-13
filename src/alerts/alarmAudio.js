export const SOUNDS=[['emergency_pulse','Emergency Pulse'],['double_alert','Double Alert'],['shift_bell','Shift Bell'],['critical_alarm','Critical Alarm']]
const notes={emergency_pulse:[660,880,660,1040],double_alert:[820,820,0,0],shift_bell:[660,880,1100,0],critical_alarm:[540,810,540,1080]}
export class PulseAlarmAudio {
 constructor(makeContext=()=>new (window.AudioContext||window.webkitAudioContext)()){this.makeContext=makeContext;this.context=null;this.nodes=[]}
 async arm(){try{this.context ||= this.makeContext();await this.context.resume();return this.context.state==='running'}catch{return false}}
 stop(){for(const node of this.nodes){try{node.stop()}catch{/* Already finished. */}node.disconnect?.()}this.nodes=[]}
 play(config){
  this.stop();const ctx=this.context
  if(!ctx || ctx.state!=='running')return false
  const duration=Math.min(30,Math.max(1,Number(config.duration_seconds)||4)*Math.min(3,Math.max(1,Number(config.repeat)||1)))
  const volume=Math.max(0,Math.min(100,Number(config.volume)||0))/100
  if(volume===0)return false
  const pattern=notes[config.sound]||notes.shift_bell,step=config.sound==='shift_bell'?0.32:0.2
  try{for(let t=0,i=0;t<duration;t+=step,i++){
   const frequency=pattern[i%pattern.length];if(!frequency)continue
   const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+t,end=Math.min(start+step*.72,ctx.currentTime+duration)
   osc.type=config.sound==='shift_bell'?'sine':'triangle';osc.frequency.value=frequency
   gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*.13,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,end)
   osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start(start);osc.stop(end);this.nodes.push(osc,gain)
  }return true}catch{this.stop();return false}
 }
}
