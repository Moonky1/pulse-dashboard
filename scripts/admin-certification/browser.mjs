import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHmac, randomBytes } from 'node:crypto'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createClient } from '@supabase/supabase-js'

const dbContainer = 'supabase_db_auth-google-selector'
const database = process.argv.find(value => value.startsWith('--database='))?.slice(11) || 'pulse_admin2_review_20261005'
if (!/^pulse_admin2_(review|checks|browser)_review_20261005(_[0-9]{1,2})?$/.test(database) && database !== 'pulse_admin2_review_20261005') throw new Error('Only task-owned local review database names are accepted')
const api = 'http://127.0.0.1:54362', app = 'http://127.0.0.1:53663'
const resume = process.argv.includes('--resume-owned-fixtures')
const owned = [], passes = [], errors = [], apiErrors = []
const pass = label => { passes.push(label); console.log('PASS ' + label) }
const run = (args, input) => {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024, windowsHide: true })
  if (result.status !== 0) throw new Error('Isolated Docker operation failed: ' + (result.stderr || '').slice(-1800))
  return result.stdout.trim()
}
const sql = (statement, role = 'postgres') => run(['exec', '-i', dbContainer, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', role, '-d', database], statement)
const inspect = name => JSON.parse(run(['inspect', name]))[0]
const authConfig = inspect('supabase_auth_auth-google-selector')
const restConfig = inspect('supabase_rest_auth-google-selector')
const environment = config => Object.fromEntries(config.Config.Env.map(entry => { const index = entry.indexOf('='); return [entry.slice(0,index),entry.slice(index+1)] }))
const authEnv = environment(authConfig), restEnv = environment(restConfig)
const jwtSecret = authEnv.GOTRUE_JWT_SECRET
if (!jwtSecret) throw new Error('Local Auth JWT configuration unavailable')
const key = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const body = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ role, iss: 'supabase', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+7200 })
  return body + '.' + createHmac('sha256',jwtSecret).update(body).digest('base64url')
}
const anon = key('anon'), service = key('service_role')
let browser, preview, proxy, page
try {
  if (resume) {
    assert.equal(sql("select count(*) from auth.users where email ~ '^admin2\\.browser\\.[1-6]@example\\.test$'"), '6')
    assert.equal(sql('select count(*) from auth.users'), '6', 'Resume accepts only the six task-owned fictitious identities')
    assert.equal(sql("select count(*) from public.users where id::text ~ '^b2530000-0000-4000-8000-00000000000[1-6]$'"), '6')
    assert.equal(sql('select count(*) from public.users'), '6')
  } else assert.equal(sql('select count(*) from auth.users'), '0', 'Only the empty task-owned schema copy can host these fixtures')
  sql('grant usage,create on schema auth to supabase_auth_admin; grant all on all tables in schema auth to supabase_auth_admin; grant all on all sequences in schema auth to supabase_auth_admin;', 'supabase_admin')
  sql(`do $$ declare item record; begin
    for item in select relation.relname,relation.relkind from pg_class relation join pg_namespace namespace on namespace.oid=relation.relnamespace where namespace.nspname='auth' and relation.relkind in ('r','p','S','v') loop
      execute format('alter %s auth.%I owner to supabase_auth_admin',case when item.relkind='S' then 'sequence' when item.relkind='v' then 'view' else 'table' end,item.relname);
    end loop;
    for item in select oid::regprocedure as signature from pg_proc where pronamespace='auth'::regnamespace loop execute 'alter function '||item.signature||' owner to supabase_auth_admin'; end loop;
  end $$; alter schema auth owner to supabase_auth_admin;`, 'supabase_admin')
  if (sql('select count(*) from auth.schema_migrations')==='0') sql(run(['exec',dbContainer,'pg_dump','-U','supabase_admin','-d','postgres','--data-only','--no-owner','--no-acl','-t','auth.schema_migrations']), 'supabase_admin')
  const network = Object.keys(inspect(dbContainer).NetworkSettings.Networks)[0]
  for (const [name, config, env, port, changes] of [
    ['pulse_admin2_auth_review',authConfig,authEnv,'54364:9999', { GOTRUE_DB_DATABASE_URL: authEnv.GOTRUE_DB_DATABASE_URL.replace(/\/postgres(\?|$)/,`/${database}$1`), GOTRUE_SITE_URL: app, GOTRUE_URI_ALLOW_LIST: app+'/**', GOTRUE_EXTERNAL_GOOGLE_ENABLED: 'false', GOTRUE_MAILER_AUTOCONFIRM: 'true' }],
    ['pulse_admin2_rest_review',restConfig,restEnv,'54365:3000', { PGRST_DB_URI: restEnv.PGRST_DB_URI.replace(/\/postgres(\?|$)/,`/${database}$1`), PGRST_DB_SCHEMAS:'public' }],
  ]) {
    const args = ['run','-d','--name',name,'--network',network,'-p','127.0.0.1:'+port]
    for (const [field,value] of Object.entries({ ...env,...changes })) args.push('-e',`${field}=${value}`)
    args.push(config.Config.Image)
    run(args); owned.push(name)
  }
  const allowHeaders = { 'access-control-allow-origin': app, 'access-control-allow-headers': 'authorization,apikey,x-client-info,content-type,x-supabase-api-version,prefer,range,range-unit', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': 'content-range', vary: 'Origin' }
  let removal
  const edge = stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/pulse-staff-removal/index.ts',import.meta.url),'utf8')).replace(/^import .*\n/,'')
  const edgeEnv = { PULSE_STAFF_REMOVAL_ALLOWED_ORIGINS: app, SUPABASE_URL: api, SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: service }
  new Function('Deno','createClient',edge)({ env: { get: name => edgeEnv[name] }, serve: handler => { removal = handler } },createClient)
  proxy = createServer(async (request,response) => {
    try {
      if (request.method==='OPTIONS') { response.writeHead(204,allowHeaders); return response.end() }
      const chunks = []; for await (const chunk of request) chunks.push(chunk)
      const body = Buffer.concat(chunks)
      if (request.url==='/functions/v1/pulse-staff-removal') {
        const result = await removal(new Request(api+request.url,{ method: request.method, headers: request.headers, body }))
        response.writeHead(result.status,{ ...allowHeaders,...Object.fromEntries(result.headers) }); return response.end(await result.text())
      }
      const isAuth = request.url.startsWith('/auth/v1/')
      const path = request.url.replace(isAuth ? '/auth/v1' : '/rest/v1','')
      const headers = { ...request.headers }; delete headers.host
      const result = await fetch('http://127.0.0.1:'+(isAuth?'54364':'54365')+path,{ method: request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:body })
      const responseHeaders=Object.fromEntries(result.headers)
      delete responseHeaders['content-encoding']; delete responseHeaders['content-length']
      response.writeHead(result.status,{ ...responseHeaders,...allowHeaders }); response.end(Buffer.from(await result.arrayBuffer()))
    } catch { response.writeHead(503,allowHeaders); response.end('{"error":"local_service_unavailable"}') }
  })
  await new Promise(resolve => proxy.listen(54362,'127.0.0.1',resolve))
  for (let attempt=0; attempt<100; attempt++) {
    try { if ((await fetch(api+'/auth/v1/health')).ok && (await fetch(api+'/rest/v1/',{ headers:{ Authorization:'Bearer '+anon } })).ok) break } catch { /* startup */ }
    if (attempt===99) {
      const statuses=owned.map(name=>{ try { return name+': '+inspect(name).State.Status } catch { return name+': stopped' } })
      const diagnostics=spawnSync('docker',['logs','pulse_admin2_auth_review'],{ encoding:'utf8',windowsHide:true })
      const safe=(diagnostics.stdout+'\n'+diagnostics.stderr).replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[local-database]').split(/\r?\n/).filter(line=>/error|fatal|failed/i.test(line)).slice(-3).join('\n')
      throw new Error('Isolated Auth/REST services did not start: '+statuses.join('; ')+'\n'+safe)
    }
    await new Promise(resolve => setTimeout(resolve,200))
  }
  // Retain the canonical claim readers from the current local Supabase schema,
  // rather than GoTrue's compatibility bootstrap definitions.
  const claimReaders=run(['exec',dbContainer,'psql','-X','-qAt','-U','supabase_admin','-d','postgres','-c',"select pg_get_functiondef(oid)||';' from pg_proc where pronamespace='auth'::regnamespace and proname in ('uid','role','jwt','email');"])
  sql(claimReaders,'supabase_admin')
  const admin = createClient(api,service,{ auth:{ persistSession:false,autoRefreshToken:false } })
  const password = randomBytes(24).toString('hex')
  const identities = []
  if (resume) {
    identities.push(...sql("select auth_user_id from public.users order by id").split(/\r?\n/))
    const { error } = await admin.auth.admin.updateUserById(identities[0], { password })
    if (error) throw new Error('Local synthetic operator reset failed')
  } else {
  for (const number of [1,2,3,4,5,6]) {
    const { data,error } = await admin.auth.admin.createUser({ email:`admin2.browser.${number}@example.test`,password,email_confirm:true })
    if (error) throw new Error('Local fixture Auth creation failed: '+error.status)
    identities.push(data.user.id)
  }
  sql(`insert into public.departments(id,code,name) values('d2530000-0000-4000-8000-000000000001','admin2_browser','ADMIN-2 Browser');`)
  for (let index=0; index<6; index++) {
    const number=index+1, status=number===4?'blocked':number===5?'inactive':number===6?'pending_approval':'active'
    sql(`insert into public.users(id,auth_user_id,email,full_name,employee_id,status,department_id,approved_at)
      values('b2530000-0000-4000-8000-00000000000${number}','${identities[index]}','admin2.browser.${number}@example.test','${number===1?'ADMIN-2 Operator':number===2?'Disposable Person':number===3?'Historical Person':'Status Fixture '+number}',${number===6?'null':"'KK-92530"+number+"'"},'${status}',${number===6?'null':"'d2530000-0000-4000-8000-000000000001'"},${number===6?'null':'now()'});
      ${number===6?'':`insert into public.user_roles(user_id,role_id,scope_type) values('b2530000-0000-4000-8000-00000000000${number}','10000000-0000-0000-0000-0000000000${number===1?'10':'01'}','global');`}`)
  }
  sql(`select set_config('request.jwt.claim.sub','${identities[0]}',false); select public.apply_org3a_business_catalog();
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source) values('b2530000-0000-4000-8000-000000000001','user','b2530000-0000-4000-8000-000000000003','account.approved','server');
    insert into public.agents(agent_code,display_name,team_id) select '992301','María Browser',team.id from public.teams team join public.campaigns campaign on campaign.id=team.campaign_id where team.code='asia_team_a' and campaign.code='auto_warranty_garrett';
    insert into public.agent_credentials(agent_id,pin_hash) select id,null from public.agents where agent_code='992301';`)
  }
  // Extra fixtures remain inside the local copy: no email delivery or real people.
  sql(`update public.users set profile_bio='A fictional Opener used only for ADMIN-2 review.',profile_presence='available',profile_visible_to_staff=true where id='b2530000-0000-4000-8000-000000000003';
    insert into public.user_operational_assignments(user_id,campaign_id,team_id,position_id,is_primary)
    select 'b2530000-0000-4000-8000-000000000003',team.campaign_id,team.id,position.id,true
    from public.teams team cross join public.positions position where team.code='asia_team_a' and team.id='34000000-0000-4000-8000-000000000011' and position.code='opener'
      and not exists(select 1 from public.user_operational_assignments where user_id='b2530000-0000-4000-8000-000000000003');
    insert into public.staff_invitations(id,email_normalized,full_name,status,expires_at,created_by_user_id,department_id,role_id,scope_type,request_key,sent_at,revoked_at,accepted_at)
    select ('12530000-0000-4000-8000-'||lpad(number::text,12,'0'))::uuid,'admin2.browser.invite.'||number||'@example.test','ADMIN-2 Invitation '||number,
      case when number=2 then 'sent' when number=3 then 'accepted' else 'revoked' end,now()+interval '24 hours',
      'b2530000-0000-4000-8000-000000000001','d2530000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000001','global',gen_random_uuid(),now(),
      case when number in (1,4) then now() end,case when number=3 then now() end from generate_series(1,4) number on conflict(id) do nothing;
    insert into public.audit_events(actor_user_id,target_type,target_id,action,source)
    select 'b2530000-0000-4000-8000-000000000001','staff_invitation','12530000-0000-4000-8000-000000000004','staff_invitation.created','server'
    where not exists(select 1 from public.audit_events where target_id='12530000-0000-4000-8000-000000000004');`)
  const build = spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{ encoding:'utf8',windowsHide:true,env:{ ...process.env,VITE_SUPABASE_URL:api,VITE_SUPABASE_ANON_KEY:anon } })
  if (build.status!==0) throw new Error('Local browser build failed')
  preview = spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','53663','--strictPort'],{ windowsHide:true,stdio:'ignore' })
  for (let attempt=0;attempt<100;attempt++) { try { if ((await fetch(app)).ok) break } catch { /* startup */ } await new Promise(resolve=>setTimeout(resolve,100)) }
  const root = process.env.PULSE_PLAYWRIGHT_ROOT || 'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
  const { chromium } = createRequire(root+'/package.json')('playwright')
  browser = await chromium.launch({ channel:'chrome',headless:true })
  const context = await browser.newContext({ viewport:{ width:1440,height:1000 },serviceWorkers:'block' })
  await context.route('**/*',route => {
    const url=new URL(route.request().url())
    if (![app,api].includes(url.origin)) { errors.push('Unexpected network destination '+url.origin); return route.abort() }
    return route.continue()
  })
  page=await context.newPage(); page.setDefaultTimeout(12000)
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{ if (message.type()==='error') errors.push(message.text()) })
  page.on('response',async response=>{
    if (response.url().startsWith(api) && response.status()>=400) {
      let body; try { body=await response.json() } catch { body={} }
      apiErrors.push({ path:new URL(response.url()).pathname,status:response.status(),code:body.code,message:body.message||body.error_description })
    }
  })
  const peopleCount = async count => page.waitForFunction(expected => document.querySelectorAll('.admin-user-row').length === expected,count)
  const responsive = async label => {
    for (const [width,height] of [[1440,1000],[820,1180],[1180,820],[390,844]]) {
      await page.setViewportSize({ width,height })
      await page.evaluate(()=>window.scrollTo(0,0))
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
      await page.screenshot({ path:`review-evidence.local/admin2/${label}-${width}x${height}.png`,fullPage:true })
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow '+width)
      if (await page.getByRole('dialog').count()) {
        const box=await page.getByRole('dialog').boundingBox()
        assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=width+1 && box.y+box.height<=height+1,label+' dialog outside viewport '+width)
      }
    }
    await page.setViewportSize({ width:1440,height:1000 })
    pass(label+' responsive review at all four requested sizes')
  }
  await page.goto(app+'/signin')
  await page.getByLabel('Email address').fill('admin2.browser.1@example.test')
  await page.getByLabel('Password',{ exact:true }).fill(password)
  await page.getByRole('button',{ name:'Sign in',exact:true }).click()
  await page.waitForURL('**/workspace'); pass('real isolated Supabase Staff sign-in')
  await page.goto(app+'/admin/users'); await page.getByRole('heading',{ name:'People',exact:true }).waitFor()
  await page.locator('.admin-user-row').filter({ hasText:'Disposable Person' }).waitFor()
  await peopleCount(4)
  await page.getByLabel('Status',{ exact:true }).selectOption('blocked')
  await peopleCount(1)
  await page.getByLabel('Status',{ exact:true }).selectOption('inactive')
  await peopleCount(1)
  await page.getByLabel('Status',{ exact:true }).selectOption('current'); await peopleCount(4); pass('People default and explicit Blocked/Inactive filters')
  await mkdir('review-evidence.local/admin2',{ recursive:true })
  await responsive('people')
  await page.setViewportSize({ width:1440,height:1000 })
  await page.goto(app+'/admin/users/b2530000-0000-4000-8000-000000000003')
  await page.getByRole('heading',{ name:'Historical Person',exact:true }).waitFor()
  await page.getByText('A fictional Opener used only for ADMIN-2 review.',{ exact:true }).waitFor()
  await responsive('staff-profile')
  await page.locator('.admin-permissions-disclosure>summary').click()
  await page.getByText('Explore Pulse roles',{ exact:true }).waitFor()
  await page.locator('.admin-access-editor>summary').click()
  await page.locator('.admin-access-editor').getByRole('button',{ name:'Change',exact:true }).click()
  await page.getByRole('heading',{ name:'Change Pulse access',exact:true }).waitFor()
  await responsive('access-editor')
  await page.getByRole('dialog').getByRole('button',{ name:'Cancel',exact:true }).click()
  assert.equal(sql("select count(*) from public.audit_events where target_id='b2530000-0000-4000-8000-000000000003'"),'1')
  pass('real role catalog, server-granted scope choices and no audit on opening access editor')
  assert.equal(await page.locator('.admin-activity-disclosure').getAttribute('open'),null)
  await page.locator('.admin-activity-disclosure summary').click()
  await page.getByText('approved Historical Person’s account.',{ exact:false }).waitFor()
  await responsive('activity-log'); pass('collapsed activity expands into live human-readable audit history')
  await page.goto(app+'/admin/teams/34000000-0000-4000-8000-000000000011')
  await page.getByRole('heading',{ name:'Asia Team A',exact:true }).waitFor()
  assert.equal(await page.getByText('Operating unit',{ exact:true }).count(),0)
  await responsive('team-profile')
  await page.goto(app+'/admin/users/b2530000-0000-4000-8000-000000000002')
  await page.getByRole('button',{ name:'Remove from Pulse',exact:true }).click()
  const dialog=page.getByRole('dialog')
  await dialog.getByText('permanently deleted.',{ exact:false }).waitFor()
  assert.equal(await dialog.getByRole('button',{ name:'Remove from Pulse',exact:true }).isEnabled(),false)
  await dialog.getByLabel('Type REMOVE to confirm').fill('REMOVE')
  await responsive('removal-modal')
  await dialog.getByRole('button',{ name:'Remove from Pulse',exact:true }).click()
  await page.waitForURL('**/admin/users'); await page.getByText('Removed from Pulse. Required history, if any, remains protected internally.',{ exact:true }).waitFor()
  assert.equal(sql(`select count(*) from auth.users where id='${identities[1]}'`),'0'); pass('end-to-end dependency-free removal physically deletes Auth and Staff')
  await page.goto(app+'/admin/users/b2530000-0000-4000-8000-000000000003')
  await page.getByRole('button',{ name:'Remove from Pulse',exact:true }).click()
  await page.getByRole('dialog').getByText('Required history will be preserved internally.',{ exact:false }).waitFor()
  await page.getByRole('dialog').getByLabel('Type REMOVE to confirm').fill('REMOVE')
  await page.getByRole('dialog').getByRole('button',{ name:'Remove from Pulse',exact:true }).click()
  await page.waitForURL('**/admin/users')
  assert.equal(sql(`select (banned_until>now())::text from auth.users where id='${identities[2]}'`),'true')
  assert.equal(sql("select count(*) from public.audit_events where target_id='b2530000-0000-4000-8000-000000000003'"),'2'); pass('end-to-end historical removal bans Auth while preserving audit')
  await page.goto(app+'/admin/invitations')
  await page.getByRole('heading',{ name:'ADMIN-2 Invitation 2',exact:true }).waitFor()
  assert.equal(await page.locator('.admin-invitation-card').count(),1)
  await page.locator('.admin-invitation-menu>summary').click()
  assert.equal(await page.getByRole('button',{ name:'Remove invitation',exact:true }).count(),0)
  await responsive('active-invitation')
  await page.getByLabel('Status',{ exact:true }).selectOption('accepted')
  await page.getByRole('heading',{ name:'ADMIN-2 Invitation 3',exact:true }).waitFor()
  assert.equal(await page.getByRole('button',{ name:'Remove invitation',exact:true }).count(),0)
  await page.getByLabel('Status',{ exact:true }).selectOption('revoked')
  const invite=page.locator('.admin-invitation-card').filter({ has:page.getByRole('heading',{ name:'ADMIN-2 Invitation 1',exact:true }) })
  await invite.locator('summary').click(); await invite.getByRole('button',{ name:'Remove invitation',exact:true }).click()
  await page.getByRole('dialog').getByLabel('Type REMOVE to confirm').fill('REMOVE')
  await responsive('invitation-removal')
  await page.getByRole('dialog').getByRole('button',{ name:'Remove invitation',exact:true }).click()
  await page.getByText('Invitation removed from the list. Required history remains protected.',{ exact:true }).waitFor()
  assert.equal(sql("select count(*) from public.staff_invitations where id='12530000-0000-4000-8000-000000000001'"),'0')
  const historyInvite=page.locator('.admin-invitation-card').filter({ has:page.getByRole('heading',{ name:'ADMIN-2 Invitation 4',exact:true }) })
  await historyInvite.locator('summary').click(); await historyInvite.getByRole('button',{ name:'Remove invitation',exact:true }).click()
  await page.getByRole('dialog').getByLabel('Type REMOVE to confirm').fill('REMOVE')
  await page.getByRole('dialog').getByRole('button',{ name:'Remove invitation',exact:true }).click()
  await page.getByRole('heading',{ name:'No invitations',exact:true }).waitFor()
  assert.equal(sql("select (removed_at is not null)::text from public.staff_invitations where id='12530000-0000-4000-8000-000000000004'"),'true')
  pass('obsolete invitation purge and history preservation; active and accepted invitations protected')
  await page.goto(app+'/admin/agents'); await page.getByText('María Browser',{ exact:true }).waitFor()
  await page.getByText('Pending activation',{ exact:true }).last().waitFor()
  sql("update public.agent_credentials set pin_hash=extensions.crypt('731482',extensions.gen_salt('bf',4)) where agent_id=(select id from public.agents where agent_code='992301');")
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
  await page.locator('.admin-agent-status').getByText('Active',{ exact:true }).waitFor()
  assert.equal(await page.locator('a[href="/profile/992301"]').count(),1)
  await responsive('agents-directory'); pass('live Agent activation status and canonical profile link')
  assert.deepEqual(errors,[])
  const report={ passes,errors,apiErrors,evidence:'review-evidence.local/admin2',productionOperations:0 }
  await writeFile('review-evidence.local/admin2/browser-result.json',JSON.stringify(report,null,2))
  console.log(JSON.stringify(report))
} catch (error) {
  console.log('FAIL '+error.message)
  if (page) {
    await mkdir('review-evidence.local/admin2',{ recursive:true })
    await page.screenshot({ path:'review-evidence.local/admin2/failure.png',fullPage:true })
    const report={ failure:error.message,passes,browserUrl:page.url(),visibleText:(await page.locator('body').innerText()).slice(0,1600),errors,apiErrors }
    await writeFile('review-evidence.local/admin2/browser-result.json',JSON.stringify(report,null,2))
    console.log(JSON.stringify(report))
  }
  throw error
} finally {
  await browser?.close(); preview?.kill(); await new Promise(resolve=>proxy?proxy.close(resolve):resolve())
  for (const name of owned.reverse()) run(['rm','-f',name])
}
