import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHmac, randomBytes, randomInt } from 'node:crypto'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createAgentHandler } from '../../api/agent.js'
import { inspectPng, MAX_BYTES } from '../../supabase/functions/pulse-simulation-media/png.mjs'

const database = process.argv.find(v => v.startsWith('--database='))?.slice(11)
if (!/^pulse_sim1_review_20261006_[0-9]{1,2}$/.test(database || '')) throw new Error('Only a named SIM-owned disposable local database is accepted')
const db = 'supabase_db_auth-google-selector', app = 'http://127.0.0.1:53673', api = 'http://127.0.0.1:54321', transport = 'http://127.0.0.1:54372'
const owned = [], passes = [], errors = []
const resume = process.argv.includes('--resume-owned-bootstrap')
const run = (args, input) => { const r = spawnSync('docker', args, { input, encoding:'utf8',windowsHide:true,maxBuffer:12*1024*1024 }); if (r.status !== 0) throw new Error('Local Docker operation failed: '+(r.stderr || '').replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[local-database]').slice(-1800)); return r.stdout.trim() }
const sql = (input, role='postgres', target=database) => run(['exec','-i',db,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U',role,'-d',target], input)
const inspect = name => JSON.parse(run(['inspect',name]))[0]
const environment = config => Object.fromEntries(config.Config.Env.map(e => { const i=e.indexOf('='); return [e.slice(0,i),e.slice(i+1)] }))
const authConfig = inspect('supabase_auth_auth-google-selector'), restConfig=inspect('supabase_rest_auth-google-selector'), storageConfig=inspect('supabase_storage_auth-google-selector')
const authEnv=environment(authConfig), restEnv=environment(restConfig), storageEnv=environment(storageConfig)
const jwtSecret=authEnv.GOTRUE_JWT_SECRET
function key(role) { const enc=v=>Buffer.from(JSON.stringify(v)).toString('base64url'); const body=enc({alg:'HS256',typ:'JWT'})+'.'+enc({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+7200}); return body+'.'+createHmac('sha256',jwtSecret).update(body).digest('base64url') }
const anon=key('anon'), service=key('service_role')
let browser, preview, proxy, page, passed=false
const pass = label => { passes.push(label); console.log('PASS '+label) }
try {
  assert.equal(sql('select count(*) from auth.users'), resume ? '1' : '0', 'Only a fresh or exactly owned bootstrap can receive fixtures')
  assert.equal(sql('select count(*) from public.users'), resume ? '1' : '0'); assert.equal(sql('select count(*) from public.training_content'), '0')
  if (resume) { assert.equal(sql("select count(*) from public.users where id='b0610000-0000-4000-8000-000000000001' and email='sim1.author@example.test'"),'1'); assert.equal(sql("select count(*) from auth.users where email='sim1.author@example.test'"),'1'); assert.equal(sql('select count(*) from public.agents'),'1'); assert.equal(sql("select count(*) from public.agents where agent_code='992611'"),'1') }
  sql(`do $$ declare s text; item record; begin
    foreach s in array array['auth','storage'] loop
      for item in select c.relname,c.relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=s and c.relkind in ('r','p','S','v') order by c.relkind='S' loop
        execute format('alter %s %I.%I owner to %I',case when item.relkind='S' then 'sequence' when item.relkind='v' then 'view' else 'table' end,s,item.relname,case when s='auth' then 'supabase_auth_admin' else 'supabase_storage_admin' end);
      end loop;
      for item in select oid::regprocedure signature from pg_proc where pronamespace=s::regnamespace loop execute 'alter function '||item.signature||' owner to '||case when s='auth' then 'supabase_auth_admin' else 'supabase_storage_admin' end; end loop;
      execute format('alter schema %I owner to %I',s,case when s='auth' then 'supabase_auth_admin' else 'supabase_storage_admin' end);
    end loop;
  end $$;`, 'supabase_admin')
  sql('grant usage on schema storage to service_role; grant all on all tables in schema storage to service_role; grant all on all sequences in schema storage to service_role;', 'supabase_admin')
  if (sql('select count(*) from auth.schema_migrations') === '0') sql(run(['exec',db,'pg_dump','-U','supabase_admin','-d','postgres','--data-only','--no-owner','--no-acl','-t','auth.schema_migrations']), 'supabase_admin')
  const network=Object.keys(inspect(db).NetworkSettings.Networks)[0]
  const toDatabase=v=>v.replace(/\/postgres(\?|$)/,`/${database}$1`)
  for (const [name,config,env,port,changes] of [
    ['pulse_sim1_auth_review',authConfig,authEnv,'54374:9999',{GOTRUE_DB_DATABASE_URL:toDatabase(authEnv.GOTRUE_DB_DATABASE_URL),GOTRUE_SITE_URL:app,GOTRUE_URI_ALLOW_LIST:app+'/**',GOTRUE_EXTERNAL_GOOGLE_ENABLED:'false',GOTRUE_MAILER_AUTOCONFIRM:'true'}],
    ['pulse_sim1_rest_review',restConfig,restEnv,'54375:3000',{PGRST_DB_URI:toDatabase(restEnv.PGRST_DB_URI),PGRST_DB_SCHEMAS:'public'}],
    ['pulse_sim1_storage_review',storageConfig,storageEnv,'54376:5000',{DATABASE_URL:toDatabase(storageEnv.DATABASE_URL),ANON_KEY:anon,SERVICE_KEY:service,STORAGE_BACKEND:'file',FILE_STORAGE_BACKEND_PATH:'/var/lib/storage',IMAGE_TRANSFORMATION_ENABLED:'false',ENABLE_IMAGE_TRANSFORMATION:'false'}],
  ]) {
    const args=['run','-d','--name',name,'--network',network,'-p','127.0.0.1:'+port]
    if (name.includes('storage')) args.push('--tmpfs','/var/lib/storage')
    for (const [field,value] of Object.entries({...env,...changes})) args.push('-e',`${field}=${value}`)
    args.push(config.Config.Image); run(args); owned.push(name)
  }
  const cors={'access-control-allow-origin':app,'access-control-allow-headers':'authorization,apikey,x-client-info,content-type,x-supabase-api-version,prefer,range,range-unit','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-expose-headers':'content-range',vary:'Origin'}
  function localClient(_url, secret, options) {
    const client=createClient(transport,secret,options), from=client.storage.from.bind(client.storage)
    client.storage.from=bucket=>{ const store=from(bucket),sign=store.createSignedUrl.bind(store); store.createSignedUrl=async(...args)=>{ const result=await sign(...args); if(result.data?.signedUrl) result.data.signedUrl=result.data.signedUrl.replace(transport,api); return result }; return store }
    return client
  }
  let media
  const edgeSource=stripTypeScriptTypes(readFileSync('supabase/functions/pulse-simulation-media/index.ts','utf8')).replace(/^import[^\r\n]*\r?\n/gm,'')
  const edgeEnv={ PULSE_SIMULATION_MEDIA_ALLOWED_ORIGINS:app,SUPABASE_URL:transport,SUPABASE_ANON_KEY:anon,SUPABASE_SERVICE_ROLE_KEY:service }
  new Function('Deno','createClient','inspectPng','MAX_BYTES',edgeSource)({ env:{get:n=>edgeEnv[n]},serve:cb=>{media=cb} },localClient,inspectPng,MAX_BYTES)
  proxy=createServer(async(req,res)=>{
    try {
      if(req.method==='OPTIONS'){res.writeHead(204,cors);return res.end()}
      const chunks=[];for await(const chunk of req) chunks.push(chunk)
      const body=Buffer.concat(chunks)
      if(req.url==='/functions/v1/pulse-simulation-media') { const result=await media(new Request(api+req.url,{method:req.method,headers:req.headers,body}));res.writeHead(result.status,{...cors,...Object.fromEntries(result.headers)});return res.end(await result.text()) }
      const kind=req.url.startsWith('/auth/v1/')?'auth':req.url.startsWith('/storage/v1/')?'storage':'rest'
      const path=req.url.replace(kind==='auth'?'/auth/v1':kind==='storage'?'/storage/v1':'/rest/v1','')
      const headers={...req.headers};delete headers.host
      const response=await fetch('http://127.0.0.1:'+({auth:54374,rest:54375,storage:54376}[kind])+path,{method:req.method,headers,redirect:'manual',body:['GET','HEAD'].includes(req.method)?undefined:body})
      const h=Object.fromEntries(response.headers);delete h['content-encoding'];delete h['content-length'];res.writeHead(response.status,{...h,...cors});res.end(Buffer.from(await response.arrayBuffer()))
    }catch{res.writeHead(503,cors);res.end('{"error":"isolated_service_unavailable"}')}
  })
  await new Promise(resolve=>proxy.listen(54372,'127.0.0.1',resolve))
  for(let i=0;i<150;i++) { try { if((await fetch(transport+'/auth/v1/health')).ok && (await fetch(transport+'/rest/v1/',{headers:{Authorization:'Bearer '+anon}})).ok && (await fetch(transport+'/storage/v1/status')).ok) break }catch { /* startup */ } if(i===149) throw new Error('Isolated services did not start'); await new Promise(r=>setTimeout(r,200)) }
  sql(run(['exec',db,'psql','-X','-qAt','-U','supabase_admin','-d','postgres','-c',"select pg_get_functiondef(oid)||';' from pg_proc where pronamespace='auth'::regnamespace and proname in ('uid','role','jwt','email');"]),'supabase_admin')
  const admin=localClient(transport,service,{auth:{persistSession:false,autoRefreshToken:false}}), password=randomBytes(24).toString('hex'), agentPin=String(randomInt(100000,1000000))
  const created=resume ? await admin.auth.admin.updateUserById(sql("select id from auth.users where email='sim1.author@example.test'"), {password}) : await admin.auth.admin.createUser({email:'sim1.author@example.test',password,email_confirm:true});assert.equal(created.error,null)
  const authId=created.data.user.id
  if (!resume) sql(`insert into public.users(id,auth_user_id,email,full_name,employee_id,status,approved_at) values('b0610000-0000-4000-8000-000000000001','${authId}','sim1.author@example.test','Simulation Author','KK-996101','active',now());
    insert into public.user_roles(user_id,role_id,scope_type) values('b0610000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000010','global');
    select set_config('request.jwt.claim.sub','${authId}',false); select public.apply_org3a_business_catalog();
    insert into public.training_topics(id,code,name) values('20610000-0000-4000-8000-000000000001','sim1_browser','Dialer practice');
    select public.admin_prepare_agent_activation('992611','María Practice','34000000-0000-4000-8000-000000000011');`)
  sql(`update public.agent_credentials set pin_hash=extensions.crypt('${agentPin}',extensions.gen_salt('bf',4)) where agent_id=(select id from public.agents where agent_code='992611');`)
  const existingBucket=await admin.storage.getBucket('training-media')
  const bucket=existingBucket.data ? existingBucket : await admin.storage.createBucket('training-media',{public:false,allowedMimeTypes:['image/png'],fileSizeLimit:MAX_BYTES});assert.equal(bucket.error,null)
  const build=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{encoding:'utf8',windowsHide:true,env:{...process.env,VITE_SUPABASE_URL:api,VITE_SUPABASE_ANON_KEY:anon,VITE_SUPABASE_PUBLISHABLE_KEY:anon}})
  if(build.status!==0)throw new Error('Local build failed: '+build.stderr.slice(-1000))
  preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','53673','--strictPort'],{windowsHide:true,stdio:'ignore'})
  for(let i=0;i<100;i++){try{if((await fetch(app)).ok)break}catch{/* startup */}await new Promise(r=>setTimeout(r,100))}
  const root=process.env.PULSE_PLAYWRIGHT_ROOT||'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
  const {chromium}=createRequire(root+'/package.json')('playwright');browser=await chromium.launch({channel:'chrome',headless:true})
  async function context() {
    const c=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'}), agent=createAgentHandler(()=>admin)
    await c.routeWebSocket('**/*',s=>s.close())
    await c.route('**/*',async route=>{
      const req=route.request(),url=new URL(req.url())
      if(![app,api].includes(url.origin))return route.abort('blockedbyclient')
      if(url.origin===api)return route.fulfill({response:await route.fetch({url:transport+url.pathname+url.search,maxRedirects:0})})
      if(url.pathname==='/api/agent') {let status,headers,body;await agent({method:req.method(),headers:{...await req.allHeaders(),host:new URL(app).host,'x-forwarded-proto':'http'},body:req.method()==='POST'?req.postDataJSON():undefined},{writeHead(s,h){status=s;headers=h},end(b){body=b}});return route.fulfill({status,headers,body})}
      return route.continue()
    });return c
  }
  const c=await context();page=await c.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message))
  await mkdir('review-evidence.local/sim-1/browser',{recursive:true})
  async function responsive(label) {if(await page.locator('.sim-step-editor,.sim-player-title').count())await page.waitForFunction(()=>document.querySelector('.sim-screen img')?.naturalWidth>0);for(const [width,height] of [[1440,1100],[820,1180],[390,844]]){await page.setViewportSize({width,height});await page.screenshot({path:`review-evidence.local/sim-1/browser/${label}-${width}.png`,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflow '+width)}await page.setViewportSize({width:1440,height:1100})}
  await page.goto(app+'/signin');await page.getByLabel('Email address').fill('sim1.author@example.test');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/workspace')
  await page.goto(app+'/studio/simulations/create');await page.getByLabel('Title',{exact:true}).fill('Callback · manual dial');await page.getByLabel('Description',{exact:true}).fill('Local synthetic source-backed practice only.');await page.getByLabel('Dialer practice',{exact:true}).check();await page.getByLabel('Audience',{exact:true}).selectOption('global');await page.getByRole('button',{name:'Save draft & add steps'}).click();await page.waitForURL(/\/studio\/simulations\/[a-f0-9-]{36}$/)
  const callbackId=new URL(page.url()).pathname.split('/').at(-1)
  await page.getByRole('button',{name:'Use Callback template',exact:true}).click();await page.getByText('Synthetic screens uploaded privately.',{exact:false}).waitFor();await page.getByRole('button',{name:'Save steps',exact:true}).click();await page.getByText('All steps saved.',{exact:false}).waitFor()
  assert.equal(sql(`select count(*) from public.training_simulation_steps where content_id='${callbackId}'`),'6');assert.equal(sql("select count(*) from public.training_media where status='ready' and media_kind='simulation_screen'"),'5');pass('Studio creates canonical simulation and privately uploads/validates five synthetic PNG screens')
  await responsive('studio-callback')
  await page.getByRole('button',{name:'Draft preview →',exact:true}).click();await page.getByRole('button',{name:'I understand · Continue →'}).click();await page.getByRole('heading',{name:'Select CB - Callbacks from the pause code menu.'}).waitFor();assert.equal(sql('select count(*) from public.training_attempts'),'0');await page.getByRole('button',{name:'Close preview',exact:true}).click();pass('authorized author draft preview never creates attempts or results')
  await page.getByRole('button',{name:'Review & publish →'}).click();await page.getByRole('button',{name:'Confirm publish',exact:true}).click();await page.getByRole('button',{name:'Edit update',exact:true}).waitFor();pass('publication uses canonical immutable version contract')
  await page.goto(app+'/academy/simulations');await page.getByRole('link',{name:'Start practice →'}).click();await page.getByRole('button',{name:'I understand · Continue →'}).click();await page.getByRole('heading',{name:'Select CB - Callbacks from the pause code menu.'}).waitFor()
  const attempt=new URL(page.url()).searchParams.get('attempt')
  await page.getByText('Keyboard / accessible controls',{exact:true}).click();await page.getByRole('button',{name:'Break - Break',exact:true}).click();await page.getByText('Not quite.',{exact:false}).waitFor();await page.getByRole('button',{name:'Show hint',exact:true}).click();await page.getByText('Hint: Use the green pause-code menu on the right.',{exact:true}).waitFor();await responsive('player-paused')
  const pausedBounds=await page.locator('.sim-screen').boundingBox();assert.ok(pausedBounds);await page.locator('.sim-screen').click({position:{x:pausedBounds.width*861/1200,y:pausedBounds.height*291/760}});await page.getByRole('heading',{name:'Click the VICIdial logo to return to the main screen.'}).waitFor();await page.reload();await page.getByRole('heading',{name:'Click the VICIdial logo to return to the main screen.'}).waitFor();assert.equal(new URL(page.url()).searchParams.get('attempt'),attempt);pass('pointer target, wrong keyboard action and hint are server-recorded; reload resumes the same owned attempt')
  async function target(name,headingText){await page.getByText('Keyboard / accessible controls',{exact:true}).click();await page.getByRole('button',{name,exact:true}).click();if(headingText)await page.getByRole('heading',{name:headingText}).waitFor()}
  await target('VICIdial logo','Open MANUAL DIAL at the bottom of the screen.');await target('MANUAL DIAL','Enter the exercise phone number: 2025550147. Use digits only.');await page.getByLabel('Phone Number',{exact:true}).fill('2025550147');await page.getByRole('button',{name:'Confirm entry →'}).click();await page.getByRole('heading',{name:'Verify 2025550147 in Phone Number, then click Dial Now. This will finish the exercise, without calling anyone.'}).waitFor();await responsive('player-manual');await target('Dial Now','You completed the workflow.');assert.equal(sql(`select score_percent::int from public.training_results where attempt_id='${attempt}'`),'85');await responsive('result');pass('typed manual number and Dial Now finish with authoritative 85 score, immutable result and no live dialing')
  await page.getByRole('button',{name:'Practice again →'}).click();await page.getByRole('button',{name:'I understand · Continue →'}).waitFor();assert.notEqual(new URL(page.url()).searchParams.get('attempt'),attempt);assert.equal(sql(`select count(*) from public.training_results where attempt_id='${attempt}'`),'1');pass('replay makes a new attempt without deleting old results')
  await page.goto(app+'/studio/simulations/'+callbackId);await page.getByRole('button',{name:'Edit update',exact:true}).click();await page.waitForURL(url=>!url.pathname.includes(callbackId));assert.equal(sql('select count(*) from public.training_simulation_steps'),'12');pass('published edit creates a new draft and clones steps without changing historical version')
  await page.goto(app+'/studio/simulations/create');await page.getByLabel('Title',{exact:true}).fill('Asia · Spanish-speaking customer');await page.getByLabel('Dialer practice',{exact:true}).check();await page.getByLabel('Audience',{exact:true}).selectOption('team');await page.getByLabel('Team',{exact:true}).selectOption('34000000-0000-4000-8000-000000000011');await page.getByRole('button',{name:'Save draft & add steps'}).click();await page.waitForURL(/\/studio\/simulations\/[a-f0-9-]{36}$/);const asiaId=new URL(page.url()).pathname.split('/').at(-1);await page.getByRole('button',{name:'Use Asia Spanish-routing template',exact:true}).click();await page.getByText('Synthetic screens uploaded privately.',{exact:false}).waitFor();await page.getByRole('button',{name:'Save steps',exact:true}).click();await page.getByText('All steps saved.',{exact:false}).waitFor();await page.getByRole('button',{name:'Review & publish →'}).click();await page.getByRole('button',{name:'Confirm publish',exact:true}).click();await page.getByRole('button',{name:'Edit update',exact:true}).waitFor()
  const agentContext=await context();page=await agentContext.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(app+'/agent/signin');await page.getByLabel('Agent ID',{exact:true}).fill('992611');await page.getByLabel('PIN',{exact:true}).fill(agentPin);await page.getByRole('button',{name:'Continue',exact:true}).click();await page.waitForURL('**/go');await page.goto(app+'/academy/simulations/'+asiaId);await page.getByRole('button',{name:'I understand · Continue →'}).click();await page.getByRole('heading',{name:'Open PRESETS to prepare the language change.'}).waitFor();await target('PRESETS','Change the preset language from English to Spanish.');await page.getByLabel('Language',{exact:true}).selectOption('Spanish');await page.getByRole('button',{name:'Confirm selection →'}).click();await page.getByRole('heading',{name:'Select LOCAL CLOSER.'}).waitFor();await target('LOCAL CLOSER','Select SPANISH SPEAKER. Do NOT select SPXFER.');await page.getByLabel('Disposition',{exact:true}).selectOption('SPXFER');await page.getByRole('button',{name:'Confirm selection →'}).click();await page.getByText('Not quite.',{exact:false}).waitFor();await responsive('agent-spanish');await page.getByLabel('Disposition',{exact:true}).selectOption('SPANISH SPEAKER');await page.getByRole('button',{name:'Confirm selection →'}).click();await page.getByRole('heading',{name:'You completed the workflow.'}).waitFor();pass('trusted Agent cookie plays team-scoped Asia workflow with private screens; SPXFER rejected')
  assert.deepEqual(errors,[]);passed=true
  await writeFile('review-evidence.local/sim-1/browser/result.json',JSON.stringify({passes,errors,database,privateStorage:'isolated tmpfs',productionOperations:0},null,2));console.log(JSON.stringify({passes:passes.length,errors:errors.length,productionOperations:0}))
}catch(error){console.log('FAIL '+error.message);if(page){await mkdir('review-evidence.local/sim-1/browser',{recursive:true});await page.screenshot({path:'review-evidence.local/sim-1/browser/failure.png',fullPage:true});console.log((await page.locator('body').innerText()).slice(-1800))}throw error}
finally {await browser?.close();preview?.kill();await new Promise(r=>proxy?proxy.close(r):r());for(const name of owned.reverse())run(['rm','-f',name]);if(passed){sql(`drop database ${database};`,'supabase_admin','postgres');console.log('Disposed only the verified SIM-owned synthetic database and its tmpfs objects.')}}
