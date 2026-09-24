import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8')

test('Homepage promotes only its hero Orb to the interactive material', async () => {
  const [home, shell, authShell] = await Promise.all([
    read('../auth/screens/PublicHomePage.jsx'),
    read('../auth/components/PublicSiteShell.jsx'),
    read('../auth/components/AuthShell.jsx'),
  ])

  assert.match(home, /PulseOrbInteractive/)
  assert.match(home, /size="hero"/)
  assert.doesNotMatch(home, /interactive(?:=|\s)/)
  assert.match(shell, /PulseOrb size="sm"/)
  assert.match(authShell, /PulseOrb size=\{compact \? 'sm' : 'md'\}/)
  assert.doesNotMatch(shell, /PulseOrbInteractive/)
})

test('GO Create room preserves loading, disabled and action semantics', async () => {
  const source = await read('../go-product/GoHostSelection.jsx')
  assert.match(source, /PulseSpectralButton variant="pulse"/)
  assert.match(source, /loading=\{creating === item\.id\}/)
  assert.match(source, /disabled=\{creating !== null\}/)
  assert.match(source, /onClick=\{\(\) => void createRoom\(item\.id\)\}/)
  assert.match(source, />Create room<\/PulseSpectralButton>/)
})

test('Studio uses one signature shader action only for Publish', async () => {
  const source = await read('../studio/StudioBuilder.jsx')
  assert.equal((source.match(/<PulseSpectralButton/g) || []).length, 1)
  assert.match(source, /<PulseSpectralButton[\s\S]*?>Publish<\/PulseSpectralButton>/)
  assert.match(source, /setConfirmation\('publish'\)/)
  assert.match(source, /<Button onClick=\{onConfirm\}>\{action === 'publish' \? 'Confirm publish'/)
})

test('Workspace uses CSS-only spectral language with no canvas component', async () => {
  const [workspace, styles] = await Promise.all([
    read('../auth/screens/WorkspacePage.jsx'),
    read('../auth/styles/auth.css'),
  ])
  assert.doesNotMatch(workspace, /PulseSpectralButton|PulseOrbInteractive|canvas/)
  assert.match(styles, /auth-workspace-destination::before/)
  assert.match(styles, /auth-workspace-destination:hover::before/)
})

test('shared button remains native and loading never instantiates WebGL', async () => {
  const source = await read('../components/ui/PulseSpectralButton.jsx')
  assert.match(source, /<button/)
  assert.match(source, /disabled=\{disabled \|\| loading\}/)
  assert.match(source, /aria-busy=\{loading \|\| undefined\}/)
  assert.match(source, /!disabled && !loading/)
  assert.match(source, /pulse-spectral-button__spinner/)
})

test('renderer delays WebGL until near viewport and retains reduced-motion fallback', async () => {
  const [source, styles] = await Promise.all([
    read('../components/ui/useSpectralMaterial.js'),
    read('../components/ui/spectral.css'),
  ])
  assert.match(source, /if \(disabled \|\| !nearViewport\) return undefined/)
  assert.match(source, /rootMargin: '80px'/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(styles, /\.pulse-spectral-button\.is-fallback/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/)
})
