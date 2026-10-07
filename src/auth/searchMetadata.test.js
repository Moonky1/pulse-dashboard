import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { searchMetadata } from './searchMetadata.js'

test('only the three public pages are indexable, canonically on www without query tokens', () => {
  for (const path of ['/', '/privacy', '/terms']) {
    assert.deepEqual(searchMetadata('pulse-kk.com',path), { robots: 'index, follow', canonical: 'https://www.pulse-kk.com'+path })
    assert.equal(searchMetadata('www.pulse-kk.com',path).robots,'index, follow')
  }
  for (const path of ['/dashboard','/profile/3420','/admin/users','/auth/invitation','/go','/academy/simulations']) {
    assert.deepEqual(searchMetadata('www.pulse-kk.com',path), { robots:'noindex, nofollow', canonical:null })
  }
})
test('Preview and localhost never receive production indexing permission', () => {
  for (const host of ['preview.vercel.app','127.0.0.1','localhost']) {
    assert.equal(searchMetadata(host,'/').robots,'noindex, nofollow')
    assert.equal(searchMetadata(host,'/privacy').canonical,null)
  }
})
test('public sitemap excludes every account, invitation and private product page', () => {
  const sitemap=readFileSync(new URL('../../public/sitemap.xml',import.meta.url),'utf8')
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]),['https://www.pulse-kk.com/','https://www.pulse-kk.com/privacy','https://www.pulse-kk.com/terms'])
  const config=JSON.parse(readFileSync(new URL('../../vercel.json',import.meta.url),'utf8'))
  const rule=config.headers.find(rule=>rule.headers.some(h=>h.key==='X-Robots-Tag'))
  assert.ok(rule)
})
