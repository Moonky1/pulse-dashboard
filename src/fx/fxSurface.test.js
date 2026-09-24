import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8')

test('FX lab stays isolated from the production application entry', async () => {
  const [lab, productionEntry, authApp] = await Promise.all([
    read('../../fx-lab.html'),
    read('../../index.html'),
    read('../auth/AuthApp.jsx'),
  ])

  assert.match(lab, /src\/fx\/main\.jsx/)
  assert.match(lab, /noindex,nofollow/)
  assert.doesNotMatch(productionEntry, /fx-lab|src\/fx/)
  assert.doesNotMatch(authApp, /fx-lab|FxLabPage|PulseSpectralButton|PulseOrbInteractive/)
})

test('spectral button preserves native semantics and decorative canvas isolation', async () => {
  const source = await read('../components/ui/PulseSpectralButton.jsx')
  assert.match(source, /<button/)
  assert.match(source, /type=\{type\}/)
  assert.match(source, /disabled=\{disabled \|\| loading\}/)
  assert.match(source, /<canvas/)
  assert.match(source, /aria-hidden="true"/)
  assert.match(source, /tabIndex=\{-1\}/)
})

test('one material system powers all three intensity variants and both shapes', async () => {
  const [material, button, orb, lab] = await Promise.all([
    read('../components/ui/useSpectralMaterial.js'),
    read('../components/ui/PulseSpectralButton.jsx'),
    read('../components/ui/PulseOrbInteractive.jsx'),
    read('./FxLabPage.jsx'),
  ])

  for (const variant of ['subtle', 'pulse', 'spectral']) {
    assert.match(material, new RegExp(`${variant}:`))
    assert.match(lab, new RegExp(`id: '${variant}'`))
  }
  assert.match(button, /shape: 'pill'/)
  assert.match(orb, /shape: 'orb'/)
  assert.match(orb, /size === 'small'/)
  assert.match(orb, /disabled: simplified/)
})

test('shader uses channel-separated refraction rather than a painted rainbow', async () => {
  const source = await read('../components/ui/useSpectralMaterial.js')
  assert.match(source, /vec3 refracted = vec3\(/)
  assert.match(source, /opticalRibbon\(p \+ vec2\(split/)
  assert.match(source, /opticalRibbon\(p - vec2\(split/)
  assert.match(source, /uDispersion/)
  assert.doesNotMatch(source, /three|@react-three|drei/i)
})

test('renderer protects performance, motion preference and WebGL failure paths', async () => {
  const [source, styles] = await Promise.all([
    read('../components/ui/useSpectralMaterial.js'),
    read('../components/ui/spectral.css'),
  ])

  assert.match(source, /IntersectionObserver/)
  assert.match(source, /visibilitychange/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /pointer: fine/)
  assert.match(source, /setTimeout/)
  assert.match(source, /webglcontextlost/)
  assert.match(source, /webglcontextrestored/)
  assert.match(source, /powerPreference: 'low-power'/)
  assert.match(source, /mode === 'hero' \? 1\.75/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/)
  assert.match(styles, /\.is-fallback/)
})

test('button press and responsive contracts remain restrained', async () => {
  const [styles, labStyles] = await Promise.all([
    read('../components/ui/spectral.css'),
    read('./fx.css'),
  ])
  assert.match(styles, /scale\(\.985\)/)
  assert.match(styles, /transition-duration:140ms/)
  assert.match(labStyles, /max-width: 900px/)
  assert.match(labStyles, /max-width: 560px/)
  assert.match(styles, /width:min\(100%,19rem\)/)
})
