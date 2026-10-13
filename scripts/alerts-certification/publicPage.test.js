import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {claimPublicNotice} from '../../src/alerts/publicNoticeClaim.js'
test('Schedule route and page contain no Agent login gate or account menu',async()=>{
 const app=await readFile('src/auth/AuthApp.jsx','utf8'),page=await readFile('src/alerts/SchedulePage.jsx','utf8')
 assert.match(app,/<Route path="\/schedule" element=\{<SchedulePage \/>\} \/>/)
 assert.doesNotMatch(page,/useGoIdentity|AgentGoHeader|ProductHeader\s*\/|signIn|Agent ID|PIN/)
})
test('anonymous display dedup stores only expiring notice IDs, never identities',async()=>{
 let value='{}';const storage={getItem:()=>value,setItem:(key,v)=>{assert.equal(key,'pulse_public_notices_v1');value=v}},expiry=new Date(Date.now()+90000).toISOString()
 assert.equal(await claimPublicNotice('notice-only',expiry,storage),true);assert.equal(await claimPublicNotice('notice-only',expiry,storage),false);assert.deepEqual(Object.keys(JSON.parse(value)),['notice-only'])
 value=JSON.stringify({'notice-only':Date.now()-1});assert.equal(await claimPublicNotice('notice-only',expiry,storage),true)
 assert.equal(await claimPublicNotice('id',expiry,{getItem(){throw Error('denied')}}),true)
})
