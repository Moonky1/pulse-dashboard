import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdir} from 'node:fs/promises'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
const {chromium}=createRequire('C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright')
const origin='http://127.0.0.1:53967',server=await createServer({configFile:false,publicDir:false,plugins:[react()],server:{host:'127.0.0.1',port:53967,strictPort:true}});await server.listen()
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({timezoneId:'America/Bogota',viewport:{width:390,height:844}}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());await mkdir('review-evidence.local/alerts-public',{recursive:true})
try{
 await page.clock.install();await page.goto(origin+'/scripts/alerts-certification/public-review.html');await page.getByRole('link',{name:'Public tab'}).click();await page.locator('.pulse-weekly-schedule article').nth(4).waitFor();assert.equal(await page.getByRole('textbox').count(),0)
 for(const [width,height] of [[390,844],[430,932],[820,1180],[1180,820],[1440,1000]]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`review-evidence.local/alerts-public/schedule-${width}.png`})}
 await page.getByRole('button',{name:'My local time',exact:true}).click();await page.getByText(/America\/Bogota/).waitFor();await page.evaluate(()=>window.publicReview.forge());await page.clock.runFor(50);assert.equal(await page.locator('.pulse-alert-surface').count(),0)
 await page.evaluate(()=>window.publicReview.emit());await page.locator('.pulse-alert-surface').waitFor();assert.equal(await page.evaluate(()=>window.publicReview.checks.privateCalls),0);assert.equal(await page.evaluate(()=>window.publicReview.checks.played),1);await page.clock.runFor(4100);await page.locator('.pulse-alert-surface').waitFor({state:'hidden'})
 await page.getByRole('link',{name:'Admin fixture'}).click();await page.getByRole('button',{name:'Send alert'}).nth(1).click();await page.getByRole('dialog').waitFor();assert.equal(await page.evaluate(()=>window.publicReview.checks.sent.length),0);await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.evaluate(()=>window.publicReview.checks.sent.length),0)
 await page.getByRole('button',{name:'Send alert'}).nth(1).click();await page.getByRole('button',{name:'Send to Schedule'}).click();await page.getByText('Alert sent to Schedule.').waitFor();assert.equal(await page.evaluate(()=>window.publicReview.checks.sent[0].confirmed),true);assert.equal(await page.locator('.pulse-alert-surface').count(),0)
 await page.getByRole('link',{name:'Public tab'}).click();await page.locator('.pulse-alert-surface').waitFor();assert.equal(await page.evaluate(()=>window.publicReview.checks.privateCalls),0);await page.clock.runFor(350);await page.screenshot({path:'review-evidence.local/alerts-public/public-alert.png'});await page.clock.runFor(4100)
 assert.deepEqual(errors,[]);console.log('PASS public page without account/ID/PIN; five viewports; timezone; verified notice audio; no tracking; Admin audience confirmation; no unsolicited Admin sound')
}finally{await context.close();await browser.close();await server.close()}
