// Canonical metadata-free mono PCM clips only, bounded to 0.1–60 seconds.
export function inspectWav(buffer) {
  const bytes=new Uint8Array(buffer)
  if(bytes.length<4454||bytes.length>2646044||(bytes.length-44)%2)throw new Error('invalid_audio')
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), label=offset=>String.fromCharCode(...bytes.slice(offset,offset+4))
  if(label(0)!=='RIFF'||label(8)!=='WAVE'||label(12)!=='fmt '||label(36)!=='data'||view.getUint32(4,true)!==bytes.length-8||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==22050||view.getUint32(28,true)!==44100||view.getUint16(32,true)!==2||view.getUint16(34,true)!==16||view.getUint32(40,true)!==bytes.length-44)throw new Error('invalid_audio')
  return {duration:(bytes.length-44)/44100}
}
