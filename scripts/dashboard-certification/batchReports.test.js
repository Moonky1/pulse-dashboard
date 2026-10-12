import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareReportBatch, runReportBatch } from '../../src/dashboard/batchReports.js'
import { fixture } from './parserFixtures.mjs'
const file=(type,date='2026-10-09',time='19:45:14')=>new File([fixture(type).replaceAll('2026-10-09',date).replace('19:45:14',time)],type+'-'+date+'-'+time.replaceAll(':','')+'.csv')
test('batch pairs one optional report of each type per date and orders dates',async()=>{
  const jobs=await prepareReportBatch({performance:[file('performance'),file('performance','2026-10-08')],pause:[file('pause')]})
  assert.equal(jobs.length,2);assert.equal(jobs[0].reportDate,'2026-10-08')
  assert.equal(jobs[0].pause,undefined);assert.ok(jobs[1].performance && jobs[1].pause)
})
test('multiple same-day cuts preserve chronological individual uploads without guessing pairs',async()=>{
  const jobs=await prepareReportBatch({performance:[file('performance',undefined,'20:00:00'),file('performance',undefined,'10:00:00')],pause:[file('pause',undefined,'11:00:00')]})
  assert.equal(jobs.length,3);assert.match(jobs[0].performance.name,/100000/);assert.ok(jobs[1].pause)
})
test('invalid headers, oversized files and oversized batches fail before writes',async()=>{
  await assert.rejects(prepareReportBatch({performance:[new File(['bad'],'bad.csv')]}),/original full-day/)
  await assert.rejects(prepareReportBatch({performance:Array(21).fill(file('performance'))}),/1–20/)
  await assert.rejects(prepareReportBatch({pause:[new File([new Uint8Array(5*1024*1024+1)],'big.csv')]}),/5 MiB/)
})
test('sequential batch preserves scope, records duplicates, stops and resumes at failed job',async()=>{
  const jobs=await prepareReportBatch({performance:[file('performance','2026-10-07'),file('performance','2026-10-08'),file('performance')]})
  const calls=[],results=[],waits=[]
  const outcome=await runReportBatch({scopeId:'scope-A',jobs,wait:async ms=>waits.push(ms),onResult:(i,r)=>results.push([i,r]),upload:async(c,args)=>{calls.push(args);return calls.length===2?{error:'Denied',code:'import_denied'}:{status:'duplicate'}}})
  assert.equal(outcome.next,1);assert.equal(calls.length,2);assert.ok(calls.every(c=>c.scopeId==='scope-A'));assert.equal(results[0][1].status,'duplicate')
  const resume=await runReportBatch({scopeId:'scope-A',jobs,start:outcome.next,onResult:()=>{},wait:async()=>{},upload:async(c,a)=>({status:'success',report_date:a.reportDate})})
  assert.equal(resume.next,3);assert.equal(resume.last.report_date,'2026-10-09')
})
test('cooldown retries are bounded; cancellation does not start further imports',async()=>{
  let calls=0,run=true;const jobs=[{},{}],waits=[]
  const result=await runReportBatch({jobs,onResult:()=>{run=false},shouldContinue:()=>run,wait:async ms=>waits.push(ms),upload:async()=>++calls===1?{error:'Wait',code:'import_cooldown'}:{status:'success'}})
  assert.equal(calls,2);assert.equal(result.next,1);assert.deepEqual(waits,[5100])
})
