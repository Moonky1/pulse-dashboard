import { useEffect, useRef, useState } from 'react'

export const SPECTRAL_VARIANTS = Object.freeze({
  subtle: Object.freeze({ intensity: 0.38, dispersion: 0.002, bend: 0.25, highlight: 0.44, fresnel: 0.52, thickness: 0.4, speed: 0.18, pointer: 0.32, glow: 0.18 }),
  pulse: Object.freeze({ intensity: 0.68, dispersion: 0.005, bend: 0.52, highlight: 0.78, fresnel: 0.76, thickness: 0.6, speed: 0.27, pointer: 0.72, glow: 0.42 }),
  spectral: Object.freeze({ intensity: 0.96, dispersion: 0.012, bend: 0.84, highlight: 1, fresnel: 0.94, thickness: 0.86, speed: 0.36, pointer: 1, glow: 0.72 }),
})

export const SPECTRAL_VERTEX_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

export const SPECTRAL_FRAGMENT_SOURCE = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uShape;
uniform float uIntensity;
uniform float uDispersion;
uniform float uBend;
uniform float uHighlight;
uniform float uFresnel;
uniform float uThickness;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uGlow;
uniform float uInteraction;
uniform float uPress;

const float PI = 3.14159265359;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float angularDistance(float a, float b) {
  return abs(atan(sin(a - b), cos(a - b)));
}

float arcLight(float angle, float center, float width) {
  float d = angularDistance(angle, center) / max(width, 0.001);
  return exp(-d * d * 2.4);
}

float opticalRibbon(vec2 p, float channelOffset, float time) {
  float pointerBend = (uPointer.x - 0.5) * 0.22 * uPointerInfluence * uInteraction;
  float crest = p.y + 0.66 - uInteraction * 0.52 + pointerBend;
  crest += sin(p.x * 2.15 + time * 0.63 + channelOffset * 14.0) * (0.11 + 0.07 * uBend);
  crest += sin(p.x * 5.35 - time * 0.31) * 0.052 * uBend;
  crest += sin(p.x * 9.1 + time * 0.17) * 0.018 * uBend;
  float unevenWidth = 17.0 - uThickness * 4.0 + sin(p.x * 3.1 - time * 0.2) * 1.8;
  float mainBand = exp(-abs(crest + channelOffset) * unevenWidth);
  float liquidBody = smoothstep(0.04, -0.5, crest + channelOffset);
  float caustic = 0.5 + 0.5 * sin(p.x * 4.3 + p.y * 2.1 - time * 0.38 + channelOffset * 12.0);
  float lowerBand = exp(-abs(crest * 1.72 + 0.31 - channelOffset * 0.5) * 29.0);
  float streak = exp(-abs(sin((p.x + p.y * 0.32) * 8.0 - time * 0.34 + channelOffset * 18.0)) * 15.0);
  return mainBand + liquidBody * (0.08 + caustic * 0.08) + lowerBand * 0.4 + streak * mainBand * 0.16;
}

vec3 pillMaterial(vec2 p, float time, float shapeDistance) {
  float split = uDispersion * (1.0 + uInteraction * 2.8);
  vec3 refracted = vec3(
    opticalRibbon(p + vec2(split, 0.0), split, time),
    opticalRibbon(p, 0.0, time),
    opticalRibbon(p - vec2(split, 0.0), -split, time)
  );
  float inside = smoothstep(0.025, -0.018, shapeDistance);
  float edge = exp(-abs(shapeDistance) * (38.0 - uThickness * 11.0));
  vec2 pointerPoint = vec2((uPointer.x - 0.5) * 2.0, (0.5 - uPointer.y) * 2.0);
  float pointerHot = exp(-dot(p - pointerPoint, p - pointerPoint) * 5.2) * uInteraction;
  float whiteCore = max(max(refracted.r, refracted.g), refracted.b);
  vec3 graphite = vec3(0.018, 0.022, 0.031) + vec3(0.018, 0.022, 0.03) * (1.0 - p.y);
  float liveLight = 0.11 + uInteraction * 0.89;
  vec3 dispersed = refracted * vec3(1.0, 0.9, 1.14) * liveLight;
  dispersed += whiteCore * vec3(0.66, 0.73, 0.8) * 0.34;
  vec3 warm = vec3(1.0, 0.58, 0.2) * (pointerHot + refracted.r * 0.28);
  vec3 ice = vec3(0.1, 0.77, 1.0) * (refracted.b * 0.42 + edge * 0.12);
  vec3 color = graphite + (dispersed * 0.7 + warm * 0.42 + ice) * uIntensity;
  color += vec3(0.92, 0.97, 1.0) * edge * uFresnel * (0.14 + 0.28 * uInteraction);
  color += vec3(1.0, 0.9, 0.69) * pointerHot * uHighlight * 0.45;
  color *= 0.93 + uPress * 0.12;
  float outerGlow = exp(-max(shapeDistance, 0.0) * 23.0) * uGlow * (0.07 + uInteraction * 0.15);
  return vec3(color * inside + (warm + ice) * outerGlow);
}

vec3 orbMaterial(vec2 p, float time, float radius) {
  float angle = atan(p.y, p.x);
  float pointerAngle = atan(0.5 - uPointer.y, uPointer.x - 0.5);
  float autonomous = time * 0.22 + sin(time * 0.11) * 0.22;
  float center = mix(autonomous, pointerAngle, uInteraction * uPointerInfluence * 0.58);
  float split = uDispersion * 18.0 * (1.0 + uInteraction * 1.45);
  vec3 arc = vec3(
    arcLight(angle, center + split, 0.1 + uThickness * 0.035),
    arcLight(angle, center, 0.09 + uThickness * 0.03),
    arcLight(angle, center - split, 0.11 + uThickness * 0.04)
  );
  vec3 counterArc = vec3(
    arcLight(angle, center + PI - split * 0.5, 0.15),
    arcLight(angle, center + PI, 0.14),
    arcLight(angle, center + PI + split * 0.5, 0.16)
  );
  float ringDistance = abs(radius - 0.68) - (0.135 + uThickness * 0.018);
  float ring = smoothstep(0.025, -0.02, ringDistance);
  float rim = exp(-abs(ringDistance) * 38.0);
  float core = smoothstep(0.55, 0.49, radius);
  float coreGlint = exp(-dot(p - vec2(-0.23, 0.3), p - vec2(-0.23, 0.3)) * 34.0);
  vec3 graphiteRing = vec3(0.045, 0.052, 0.063) + rim * vec3(0.16, 0.18, 0.2);
  vec3 chroma = arc * vec3(1.08, 0.92, 1.12) + counterArc * vec3(0.76, 0.96, 1.18) * 0.48;
  float whiteHot = max(max(arc.r, arc.g), arc.b);
  vec3 ringColor = graphiteRing + mix(chroma, vec3(whiteHot), 0.48) * uIntensity * 0.52;
  ringColor += whiteHot * vec3(1.0, 0.97, 0.88) * uHighlight * 0.92;
  ringColor += rim * vec3(0.78, 0.87, 1.0) * uFresnel * 0.18;
  vec3 coreColor = vec3(0.01, 0.014, 0.021) + vec3(0.13, 0.16, 0.22) * coreGlint * 0.72;
  coreColor += vec3(0.48, 0.56, 0.7) * max(0.0, 0.52 - radius) * 0.08;
  vec3 color = ringColor * ring + coreColor * core;
  float silhouette = max(ring, core);
  float aura = exp(-max(radius - 0.84, 0.0) * 19.0) * smoothstep(1.08, 0.72, radius);
  color += chroma * aura * uGlow * (0.05 + uInteraction * 0.16);
  return color * (0.94 + uPress * 0.1) * max(silhouette, aura * 0.35);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  p.x *= aspect;
  float time = uTime * uSpeed;
  float halfWidth = max(0.3, aspect - 0.035);
  float shapeDistance = roundedBox(p, vec2(halfWidth, 0.94), 0.9);
  float radius = length(p);
  vec3 color = mix(pillMaterial(p, time, shapeDistance), orbMaterial(p, time, radius), step(0.5, uShape));
  float pillAlpha = smoothstep(0.12, -0.015, shapeDistance) + exp(-max(shapeDistance, 0.0) * 18.0) * uGlow * 0.18;
  float orbRingDistance = abs(radius - 0.68) - (0.135 + uThickness * 0.018);
  float orbRing = smoothstep(0.03, -0.02, orbRingDistance);
  float orbCore = smoothstep(0.55, 0.49, radius);
  float orbAura = exp(-max(radius - 0.84, 0.0) * 19.0) * smoothstep(1.08, 0.72, radius);
  float orbAlpha = max(orbRing, orbCore) + orbAura * uGlow * 0.14;
  float alpha = clamp(mix(pillAlpha, orbAlpha, step(0.5, uShape)), 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}`

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    throw new Error('Pulse spectral shader could not compile')
  }
  return shader
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, SPECTRAL_VERTEX_SOURCE)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, SPECTRAL_FRAGMENT_SOURCE)
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    throw new Error('Pulse spectral program could not link')
  }
  return program
}

function uniformMap(gl, program) {
  return Object.fromEntries([
    'uResolution', 'uPointer', 'uTime', 'uShape', 'uIntensity', 'uDispersion',
    'uBend', 'uHighlight', 'uFresnel', 'uThickness', 'uSpeed',
    'uPointerInfluence', 'uGlow', 'uInteraction', 'uPress',
  ].map((name) => [name, gl.getUniformLocation(program, name)]))
}

function capDpr(mode) {
  const cap = mode === 'hero' ? 1.75 : mode === 'medium' ? 1.5 : 1.2
  return Math.min(window.devicePixelRatio || 1, cap)
}

export function useSpectralMaterial({ shape = 'pill', variant = 'pulse', tuning = {}, sizeMode = 'medium', disabled = false } = {}) {
  const canvasRef = useRef(null)
  const hostRef = useRef(null)
  const wakeRef = useRef(null)
  const [fallback, setFallback] = useState(false)
  const [contextEpoch, setContextEpoch] = useState(0)
  const preset = SPECTRAL_VARIANTS[variant] ?? SPECTRAL_VARIANTS.pulse
  const configRef = useRef({ ...preset, ...tuning })
  configRef.current = { ...preset, ...tuning }

  useEffect(() => {
    wakeRef.current?.(true)
  }, [variant, tuning])

  useEffect(() => {
    if (disabled) return undefined
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return undefined

    let gl
    let program
    let buffer
    let resizeObserver
    let intersectionObserver
    let frameId = 0
    let idleTimer = 0
    let disposed = false
    let visible = true
    let pageVisible = !document.hidden
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    let reducedMotion = reducedQuery.matches
    let finePointer = finePointerQuery.matches
    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, interaction: finePointer ? 0 : 0.08, targetInteraction: finePointer ? 0 : 0.08, press: 0, targetPress: 0, focus: 0, lastMove: 0 }

    const clearSchedule = () => {
      if (frameId) cancelAnimationFrame(frameId)
      if (idleTimer) window.clearTimeout(idleTimer)
      frameId = 0
      idleTimer = 0
    }

    const failGracefully = () => {
      clearSchedule()
      setFallback(true)
    }

    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        depth: false,
        powerPreference: 'low-power',
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
      })
      if (!gl) throw new Error('WebGL unavailable')
      program = createProgram(gl)
      buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      gl.useProgram(program)
      const position = gl.getAttribLocation(program, 'aPosition')
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      setFallback(false)
    } catch {
      failGracefully()
      return undefined
    }

    const uniforms = uniformMap(gl, program)

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = capDpr(sizeMode)
      const width = Math.max(2, Math.round(rect.width * dpr))
      const height = Math.max(2, Math.round(rect.height * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
    }

    const draw = (timestamp) => {
      if (disposed || !visible || !pageVisible) return
      resize()
      const config = configRef.current
      const smoothing = reducedMotion ? 1 : 0.12
      pointer.x += (pointer.targetX - pointer.x) * smoothing
      pointer.y += (pointer.targetY - pointer.y) * smoothing
      pointer.interaction += (Math.max(pointer.targetInteraction, pointer.focus) - pointer.interaction) * smoothing
      pointer.press += (pointer.targetPress - pointer.press) * (reducedMotion ? 1 : 0.2)
      gl.useProgram(program)
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
      gl.uniform2f(uniforms.uPointer, pointer.x, pointer.y)
      gl.uniform1f(uniforms.uTime, reducedMotion ? 5.4 : timestamp * 0.001)
      gl.uniform1f(uniforms.uShape, shape === 'orb' ? 1 : 0)
      gl.uniform1f(uniforms.uIntensity, config.intensity)
      gl.uniform1f(uniforms.uDispersion, config.dispersion)
      gl.uniform1f(uniforms.uBend, config.bend)
      gl.uniform1f(uniforms.uHighlight, config.highlight)
      gl.uniform1f(uniforms.uFresnel, config.fresnel)
      gl.uniform1f(uniforms.uThickness, config.thickness)
      gl.uniform1f(uniforms.uSpeed, config.speed)
      gl.uniform1f(uniforms.uPointerInfluence, config.pointer)
      gl.uniform1f(uniforms.uGlow, config.glow)
      gl.uniform1f(uniforms.uInteraction, pointer.interaction)
      gl.uniform1f(uniforms.uPress, pointer.press)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    const schedule = (interactive = false) => {
      if (disposed || !visible || !pageVisible) return
      if (interactive && idleTimer) {
        window.clearTimeout(idleTimer)
        idleTimer = 0
      }
      if (frameId || idleTimer) return
      if (reducedMotion) {
        frameId = requestAnimationFrame((time) => { frameId = 0; draw(time) })
        return
      }
      const active = interactive || pointer.press > 0.01 || pointer.interaction > 0.035 || pointer.focus > 0
      if (active && finePointer) {
        frameId = requestAnimationFrame((time) => {
          frameId = 0
          draw(time)
          schedule(performance.now() - pointer.lastMove < 700 || pointer.targetPress > 0 || pointer.focus > 0)
        })
        return
      }
      idleTimer = window.setTimeout(() => {
        idleTimer = 0
        frameId = requestAnimationFrame((time) => {
          frameId = 0
          draw(time)
          schedule(false)
        })
      }, finePointer ? 190 : 460)
    }

    wakeRef.current = schedule

    const onPointerMove = (event) => {
      if (!finePointer || !visible) return
      const rect = host.getBoundingClientRect()
      const closestX = Math.max(rect.left, Math.min(event.clientX, rect.right))
      const closestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom))
      const distance = Math.hypot(event.clientX - closestX, event.clientY - closestY)
      const reach = Math.max(42, Math.min(rect.width, rect.height) * 0.72)
      const proximity = Math.max(0, 1 - distance / reach)
      pointer.targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)))
      pointer.targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1)))
      pointer.targetInteraction = proximity
      pointer.lastMove = performance.now()
      if (reducedMotion) {
        pointer.x = pointer.targetX
        pointer.y = pointer.targetY
        pointer.interaction = proximity
      }
      schedule(proximity > 0.01)
    }

    const onPointerDown = () => { pointer.targetPress = 1; pointer.lastMove = performance.now(); schedule(true) }
    const onPointerUp = () => { pointer.targetPress = 0; pointer.lastMove = performance.now(); schedule(true) }
    const onFocus = () => { pointer.focus = 0.72; schedule(true) }
    const onBlur = () => { pointer.focus = 0; schedule(true) }
    const onVisibility = () => { pageVisible = !document.hidden; clearSchedule(); if (pageVisible) schedule(false) }
    const onMotionChange = () => { reducedMotion = reducedQuery.matches; clearSchedule(); schedule(false) }
    const onPointerModeChange = () => { finePointer = finePointerQuery.matches; pointer.targetInteraction = finePointer ? 0 : 0.08; clearSchedule(); schedule(false) }
    const onContextLost = (event) => { event.preventDefault(); failGracefully() }
    const onContextRestored = () => setContextEpoch((value) => value + 1)

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    host.addEventListener('pointerdown', onPointerDown, { passive: true })
    host.addEventListener('focusin', onFocus)
    host.addEventListener('focusout', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    reducedQuery.addEventListener('change', onMotionChange)
    finePointerQuery.addEventListener('change', onPointerModeChange)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => { resize(); schedule(true) })
      resizeObserver.observe(host)
    } else {
      window.addEventListener('resize', resize)
    }
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        clearSchedule()
        if (visible) schedule(false)
      }, { rootMargin: '80px' })
      intersectionObserver.observe(host)
    }

    resize()
    draw(performance.now())
    schedule(false)

    return () => {
      disposed = true
      clearSchedule()
      wakeRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('focusin', onFocus)
      host.removeEventListener('focusout', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      reducedQuery.removeEventListener('change', onMotionChange)
      finePointerQuery.removeEventListener('change', onPointerModeChange)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      if (!resizeObserver) window.removeEventListener('resize', resize)
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
    }
  }, [contextEpoch, disabled, shape, sizeMode])

  return { canvasRef, hostRef, fallback }
}
