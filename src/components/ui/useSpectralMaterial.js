import { useEffect, useRef, useState } from 'react'
import { vertexSource as SPECTRAL_VERTEX_SOURCE, fragmentSource as SPECTRAL_FRAGMENT_SOURCE } from './liquidMaterial.js'

export const SPECTRAL_VARIANTS = Object.freeze({
  subtle: Object.freeze({ dispersion: 0.10, bend: 0.72, thickness: 0.70, fresnel: 0.20, specular: 0.21, caustic: 0.54, noiseScale: 1.7, speed: 0.13, pointer: 0.55, absorption: 0.34, balance: 0.43, exposure: 0.65 }),
  pulse: Object.freeze({ dispersion: 0.075, bend: 0.98, thickness: 0.83, fresnel: 0.23, specular: 0.24, caustic: 0.87, noiseScale: 1.8, speed: 0.20, pointer: 1.1, absorption: 0.26, balance: 0.44, exposure: 0.91 }),
  spectral: Object.freeze({ dispersion: 0.10, bend: 1.02, thickness: 0.88, fresnel: 0.26, specular: 0.27, caustic: 0.94, noiseScale: 1.8, speed: 0.23, pointer: 1.15, absorption: 0.24, balance: 0.44, exposure: 0.99 }),
})

export { vertexSource as SPECTRAL_VERTEX_SOURCE, fragmentSource as SPECTRAL_FRAGMENT_SOURCE } from './liquidMaterial.js'

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
    'resolution', 'pointer', 'time', 'shape', 'interaction', 'press',
    'dispersion', 'bend', 'thickness', 'fresnel', 'specular', 'caustic',
    'noiseScale', 'speed', 'pointerForce', 'absorption', 'balance', 'exposure', 'palette',
  ].map((name) => [name, gl.getUniformLocation(program, name)]))
}

function capDpr(mode) {
  const finePointer = window.matchMedia('(pointer: fine)').matches
  const cap = finePointer ? (mode === 'small' ? 1.5 : 2) : 1.5
  const deviceDpr = window.devicePixelRatio || 1
  return finePointer ? Math.max(1.5, Math.min(deviceDpr, cap)) : Math.min(deviceDpr, cap)
}

export function useSpectralMaterial({ shape = 'pill', variant = 'pulse', colorway = 'soft', tuning = {}, sizeMode = 'medium', disabled = false, pressable = true, previewMotion = false } = {}) {
  const canvasRef = useRef(null)
  const hostRef = useRef(null)
  const wakeRef = useRef(null)
  const [fallback, setFallback] = useState(false)
  const [contextEpoch, setContextEpoch] = useState(0)
  const [nearViewport, setNearViewport] = useState(() => !('IntersectionObserver' in window))
  const preset = SPECTRAL_VARIANTS[variant] ?? SPECTRAL_VARIANTS.pulse
  const configRef = useRef({ ...preset, ...tuning })
  configRef.current = { ...preset, ...tuning, palette: colorway === 'ice' ? 1 : 0 }

  useEffect(() => {
    wakeRef.current?.(true)
  }, [variant, colorway, tuning])

  useEffect(() => {
    if (disabled || nearViewport || !('IntersectionObserver' in window)) return undefined
    const host = hostRef.current
    if (!host) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNearViewport(true)
    }, { rootMargin: '80px' })
    observer.observe(host)
    return () => observer.disconnect()
  }, [disabled, nearViewport])

  useEffect(() => {
    if (disabled || !nearViewport) return undefined
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return undefined

    let gl
    let program
    let buffer
    let resizeObserver
    let frameId = 0
    let idleTimer = 0
    let disposed = false
    let visible = true
    let pageVisible = !document.hidden
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    let reducedMotion = reducedQuery.matches && !previewMotion
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
      const position = gl.getAttribLocation(program, 'position')
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
      const dpr = capDpr(sizeMode)
      // The material extends beyond its host; size the framebuffer to the
      // displayed canvas, not the smaller Orb/button box beneath it.
      const width = Math.max(2, Math.round(canvas.clientWidth * dpr))
      const height = Math.max(2, Math.round(canvas.clientHeight * dpr))
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
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y)
      gl.uniform1f(uniforms.time, reducedMotion ? 5.4 : timestamp * 0.001)
      gl.uniform1f(uniforms.shape, shape === 'orb' ? 1 : 0)
      gl.uniform1f(uniforms.interaction, pointer.interaction)
      gl.uniform1f(uniforms.press, pointer.press)
      gl.uniform1f(uniforms.dispersion, config.dispersion)
      gl.uniform1f(uniforms.bend, config.bend)
      gl.uniform1f(uniforms.thickness, config.thickness)
      gl.uniform1f(uniforms.fresnel, config.fresnel)
      gl.uniform1f(uniforms.specular, config.specular)
      gl.uniform1f(uniforms.caustic, config.caustic)
      gl.uniform1f(uniforms.noiseScale, config.noiseScale)
      gl.uniform1f(uniforms.speed, config.speed)
      gl.uniform1f(uniforms.pointerForce, config.pointer)
      gl.uniform1f(uniforms.absorption, config.absorption)
      gl.uniform1f(uniforms.balance, config.balance)
      gl.uniform1f(uniforms.exposure, config.exposure)
      gl.uniform1f(uniforms.palette, config.palette)
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

    const onPointerDown = () => { if (!pressable) return; pointer.targetPress = 1; pointer.lastMove = performance.now(); schedule(true) }
    const onPointerUp = () => { pointer.targetPress = 0; pointer.lastMove = performance.now(); schedule(true) }
    const onFocus = () => { pointer.focus = 0.72; schedule(true) }
    const onBlur = () => { pointer.focus = 0; schedule(true) }
    const onVisibility = () => { pageVisible = !document.hidden; clearSchedule(); if (pageVisible) schedule(false) }
    const onMotionChange = () => { reducedMotion = reducedQuery.matches && !previewMotion; clearSchedule(); schedule(false) }
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
    let intersectionObserver
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
  }, [contextEpoch, disabled, nearViewport, pressable, previewMotion, shape, sizeMode])

  return { canvasRef, hostRef, fallback: fallback || !nearViewport }
}
