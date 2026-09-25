import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('only the public hero uses the reactive Orb; ordinary product buttons stay unchanged', async () => {
  const [home, shell, go, studio] = await Promise.all([
    read('../auth/screens/PublicHomePage.jsx'),
    read('../auth/components/PublicSiteShell.jsx'),
    read('../go-product/GoHostSelection.jsx'),
    read('../studio/StudioBuilder.jsx'),
  ])
  assert.match(home, /PulseOrbInteractive size="hero"/)
  assert.doesNotMatch(shell + go + studio, /PulseSpectralButton|PulseOrbInteractive/)
})

test('review route is isolated from normal navigation and gives a real button action', async () => {
  const [app, page, shell] = await Promise.all([
    read('../auth/AuthApp.jsx'),
    read('./ReactiveComparisonPage.jsx'),
    read('../auth/components/PublicSiteShell.jsx'),
  ])
  assert.match(app, /path="\/fx-2b-review"/)
  assert.doesNotMatch(shell, /fx-2b-review/)
  assert.match(page, /PulseOrb size="xl" active/)
  assert.match(page, /PulseOrbInteractive size="hero"/)
  assert.match(page, /onClick=\{\(\) => setActivated\(true\)\}/)
  assert.match(page, /role="status"/)
})

test('FX-1B material is shared by Orb and ribbon without the later texture assist', async () => {
  const [material, renderer] = await Promise.all([
    read('../components/ui/liquidMaterial.js'),
    read('../components/ui/useSpectralMaterial.js'),
  ])
  assert.match(material, /float heightField\(/)
  assert.match(material, /float radialHeight\(/)
  assert.match(material, /vec3 refractMaterial\(/)
  assert.match(material, /environment\(rRay\)\.r,environment\(gRay\)\.g,environment\(bRay\)\.b/)
  assert.match(renderer, /shape === 'orb' \? 1 : 0/)
  assert.doesNotMatch(material + renderer, /sampler2D|texture2D|three|@react-three|drei/)
})

test('the pixel-polished Orb retains the original liquid wave deformation', async () => {
  const [material, home] = await Promise.all([
    read('../components/ui/liquidMaterial.js'),
    read('../auth/screens/PublicHomePage.jsx'),
  ])
  assert.match(material, /warp\+dent\*\(\.075\+\.026\*press\)/)
  assert.match(material, /vec3 glass=refractMaterial\(-p\*2\.3\+vec2\(-\.14,\.28\),H\*2\.7,gradient,1\.,curv\)/)
  assert.doesNotMatch(material, /float body=smoothstep\(\.545,\.585,r\)/)
  assert.match(home, /previewMotion=\{previewMotion\}/)
})

test('renderer preserves performance and accessibility guards', async () => {
  const [renderer, button, styles] = await Promise.all([
    read('../components/ui/useSpectralMaterial.js'),
    read('../components/ui/PulseSpectralButton.jsx'),
    read('../components/ui/spectral.css'),
  ])
  for (const guard of ['IntersectionObserver', 'visibilitychange', 'prefers-reduced-motion: reduce', 'pointer: fine', 'webglcontextlost', 'webglcontextrestored']) assert.match(renderer, new RegExp(guard))
  assert.match(renderer, /canvas\.clientWidth \* dpr/)
  assert.match(renderer, /mode === 'small' \? 1\.5 : 2/)
  assert.match(renderer, /reducedQuery\.matches && !previewMotion/)
  assert.match(button, /<button/)
  assert.match(button, /aria-hidden="true"/)
  assert.match(button, /disabled=\{disabled \|\| loading\}/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/)
})
