import { fragmentSource, vertexSource } from './material.js'
import opticalMapUrl from './optical-energy.png?url'
import { createOpticalTexture } from './opticalTexture.js'

export function createMaterial(canvas, config, { shape = 0, hybrid = false, onStatus = () => {} } = {}) {
  let opticalTexture, opticalReady = false, hybridEnabled = hybrid
  let gl, program, buffer, raf = 0, timer = 0, disposed = false, visible = false
  let frozen = false, motionStudy = false, time = 2.6, previous = 0, state = 'live', error = ''
  let pointer = [.5,.5], target = [.5,.5], strength = 0, desired = 0, press = 0, pressed = 0
  let lastInput = 0, draws = 0
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const coarse = matchMedia('(pointer: coarse)')
  const names = ['resolution','pointer','time','interaction','press','shape','dispersion','bend','thickness','fresnel','specular','caustic','noiseScale','speed','pointerForce','absorption','balance','exposure','opticalMap','hybridStrength']
  let uniforms = {}
  const clear = () => { cancelAnimationFrame(raf); clearTimeout(timer); raf=timer=0 }
  function initialize() {
    try {
      gl=canvas.getContext('webgl',{alpha:false,depth:false,antialias:false,powerPreference:'low-power'})
      if(!gl) throw new Error('WebGL unavailable')
      const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(msg)}return s}
      const v=compile(gl.VERTEX_SHADER,vertexSource),f=compile(gl.FRAGMENT_SHADER,fragmentSource)
      program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f)
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program))
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW)
      gl.useProgram(program);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0)
      uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]))
      opticalTexture?.dispose(); opticalReady=false
      opticalTexture=createOpticalTexture(gl,{enabled:hybrid&&shape===0,url:opticalMapUrl,
        onReady:()=>{opticalReady=true;schedule(true)},
        onError:e=>{error=e.message;canvas.dataset.renderer='fallback';clear();onStatus(`CSS fallback: ${error}`)},
      })
      canvas.dataset.renderer='webgl'; error='';onStatus('WebGL ready')
    } catch(e) {error=e.message;canvas.dataset.renderer='fallback';onStatus(`CSS fallback: ${error}`);clear()}
  }
  function draw(now) {
    raf=0
    if(disposed||!visible||document.hidden||error)return
    const dt=Math.min((now-previous)/1000,.25);previous=now
    if((!reduced.matches||motionStudy)&&!frozen)time+=dt
    const smooth=reduced.matches||frozen?1:1-Math.exp(-dt*10)
    pointer=pointer.map((v,i)=>v+(target[i]-v)*smooth)
    strength+=(desired-strength)*smooth;press+=(pressed-press)*smooth
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,coarse.matches?1.25:1.75)
    const w=Math.max(2,Math.round(rect.width*dpr)),h=Math.max(2,Math.round(rect.height*dpr))
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
    gl.useProgram(program);gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.pointer,...pointer)
    opticalTexture.bind();gl.uniform1i(uniforms.opticalMap,0)
    gl.uniform1f(uniforms.hybridStrength,hybridEnabled&&opticalReady?1:0)
    for(const [key,value] of Object.entries({...config,time:reduced.matches&&!motionStudy&&!frozen?2.6:time,interaction:strength,press,shape,pointerForce:config.pointer}))if(typeof value==='number'&&uniforms[key])gl.uniform1f(uniforms[key],value)
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);draws++
    if(!frozen&&(!reduced.matches||motionStudy)) schedule()
  }
  function schedule(force=false){
    if(disposed||!visible||document.hidden||error)return
    clear()
    if(force||(!coarse.matches&&performance.now()-lastInput<1000))raf=requestAnimationFrame(draw)
    else if(!frozen&&(!reduced.matches||motionStudy))timer=setTimeout(()=>{raf=requestAnimationFrame(draw)},coarse.matches?160:65)
  }
  const move=e=>{if(state!=='live'||coarse.matches)return;const r=canvas.getBoundingClientRect();target=[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];const dx=Math.max(r.left-e.clientX,0,e.clientX-r.right),dy=Math.max(r.top-e.clientY,0,e.clientY-r.bottom);desired=Math.max(0,1-Math.hypot(dx,dy)/90);if(desired){lastInput=performance.now();schedule(true)}else if(strength>.01)schedule(true)}
  const down=e=>{if(state!=='live')return;const r=canvas.getBoundingClientRect();target=[Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];pressed=1;desired=1;lastInput=performance.now();schedule(true)}
  const up=()=>{if(state!=='live')return;pressed=0;if(coarse.matches)desired=0;lastInput=performance.now();schedule(true)}
  const visibility=()=>{clear();previous=performance.now();if(!document.hidden)schedule(true)}
  const lost=e=>{e.preventDefault();opticalTexture?.dispose();opticalReady=false;error='Context lost';canvas.dataset.renderer='fallback';clear();onStatus('Context lost — CSS fallback')}
  const restored=()=>{initialize();schedule(true)}
  // Rapid lab anchor jumps can queue both exit and entry in one delivery.
  // The latest entry, not the first, is the current visibility state.
  const observer=new IntersectionObserver(entries=>{const entry=entries[entries.length-1];visible=entry.isIntersecting;clear();if(visible){if(!gl)initialize();previous=performance.now();schedule(true)}},{rootMargin:'40px'})
  observer.observe(canvas)
  const resize=new ResizeObserver(()=>schedule(true));resize.observe(canvas)
  window.addEventListener('pointermove',move,{passive:true});canvas.addEventListener('pointerdown',down);window.addEventListener('pointerup',up)
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility)
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored)
  return {
    setConfig(value){config={...value};schedule(true)},
    setHybrid(value){hybridEnabled=hybrid&&value;schedule(true)},
    testContextLoss(){const extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();setTimeout(()=>{if(!disposed)extension.restoreContext()},1200);return true},
    setState(value){state=value;const x={left:.15,center:.5,right:.85,press:.5};target=[x[value]??.5,.55];desired=value==='idle'?0:value==='live'?0:1;pressed=value==='press'?1:0;lastInput=performance.now();schedule(true)},
    setFrame(value){frozen=value!==null;if(frozen)time=value;previous=performance.now();schedule(true)},
    setMotionStudy(value){motionStudy=value;clear();schedule(true)},
    stats(){return {draws,time,width:canvas.width,height:canvas.height,visible,reduced:reduced.matches,coarse:coarse.matches,error,opticalReady,hybrid:hybridEnabled&&opticalReady}},
    destroy(){disposed=true;clear();opticalTexture?.dispose();observer.disconnect();resize.disconnect();window.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program)}}
  }
}
