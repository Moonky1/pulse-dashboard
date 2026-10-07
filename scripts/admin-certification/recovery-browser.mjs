import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { createAgentHandler } from '../../api/agent.js'

const operator = 'b2530000-0000-4000-8000-000000000001'
const department = 'd2530000-0000-4000-8000-000000000001'
const playerRole = '10000000-0000-0000-0000-000000000001'

async function localContext(browser, admin, app, api) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' })
  const agent = createAgentHandler(() => admin)
  await context.routeWebSocket('**/*', socket => socket.close())
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (![app, api].includes(url.origin)) return route.abort('blockedbyclient')
    if (url.origin === api) return route.fulfill({ response: await route.fetch({ url: 'http://127.0.0.1:54362' + url.pathname + url.search, maxRedirects: 0 }) })
    if (url.pathname === '/api/agent') {
      const headers = await request.allHeaders()
      let status, responseHeaders, body
      await agent({ method: request.method(), headers: { ...headers, host: new URL(app).host, 'x-forwarded-proto': 'http' }, body: request.postDataJSON() || undefined }, {
        writeHead(code, values) { status = code; responseHeaders = values }, end(value) { body = value },
      })
      return route.fulfill({ status, headers: responseHeaders, body })
    }
    return route.continue()
  })
  return context
}

export async function invitationRecoveryBrowser({ browser, admin, app, api, sql, page, operatorAuth, pass }) {
  const email = 'admin2.recovery.invited@example.test'
  const created = await admin.auth.admin.createUser({ email, email_confirm: true })
  assert.equal(created.error, null)
  const authId = created.data.user.id
  sql(`select set_config('request.jwt.claim.sub','${operatorAuth}',false);
    select public.claim_staff_invitation_send_v2('${email}','Invited Opener','${department}',null,null,null,null,'${playerRole}','global',null,null,null,'e2530000-0000-4000-8000-000000000007',null);
    select public.complete_staff_invitation_delivery((select id from public.staff_invitations where request_key='e2530000-0000-4000-8000-000000000007'),(select delivery_claim_id from public.staff_invitations where request_key='e2530000-0000-4000-8000-000000000007'),true,'${authId}',null);`)
  const generated = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: app + '/auth/callback?flow=invitation' } })
  assert.equal(generated.error, null)
  const link = new URL(generated.data.properties.action_link)
  // Only the disposable local GoTrue service is used; no email or external OAuth.
  const context = await localContext(browser, admin, app, api)
  const invited = await context.newPage()
  invited.setDefaultTimeout(15000)
  await invited.goto(api + '/auth/v1' + link.pathname.replace(/^\/auth\/v1/, '') + link.search)
  try { await invited.waitForURL('**/auth/invitation') } catch {
    throw new Error('Invitation setup did not open: ' + new URL(invited.url()).pathname + ' ' + (await invited.locator('body').innerText()).slice(0, 900))
  }
  await invited.getByRole('button', { name: 'Continue with Google', exact: true }).waitFor()
  assert.equal(sql(`select count(*) from public.users where auth_user_id='${authId}'`), '0')
  assert.equal(sql('select count(*) from public.user_roles'), '5')
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    await invited.setViewportSize({ width, height })
    await invited.screenshot({ path: `review-evidence.local/admin2/invitation-choice-${width}.png`, fullPage: true })
    assert.ok(await invited.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  }
  pass('verified invitation opens Google/password choice with no Staff profile or access yet')
  await invited.getByLabel('Create password', { exact: true }).fill('short')
  await invited.getByLabel('Confirm password', { exact: true }).fill('different')
  await invited.getByRole('button', { name: 'Create password and accept invitation' }).click()
  await invited.getByText('Passwords do not match.', { exact: true }).waitFor()
  assert.equal(sql(`select count(*) from public.users where auth_user_id='${authId}'`), '0')
  const password = randomBytes(24).toString('hex')
  await invited.getByLabel('Create password', { exact: true }).fill(password)
  await invited.getByLabel('Confirm password', { exact: true }).fill(password)
  await invited.getByRole('button', { name: 'Create password and accept invitation' }).click()
  await invited.waitForURL('**/workspace')
  const staffId = sql(`select id from public.users where auth_user_id='${authId}'`)
  assert.match(staffId, /^[a-f0-9-]{36}$/)
  assert.equal(sql(`select count(*) from public.audit_events where actor_user_id='${staffId}' and action='staff_invitation.accepted'`), '1')
  pass('chosen password creates a real Auth credential and explicitly accepts the trusted invitation')
  await context.close()
  await page.goto(app + '/admin/users/' + staffId)
  await page.getByRole('button', { name: 'Remove from Pulse', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByText('permanently deleted.', { exact: false }).waitFor()
  await dialog.getByLabel('Type REMOVE to confirm').fill('REMOVE')
  assert.equal(await dialog.getByRole('button', { name: 'Remove from Pulse', exact: true }).isEnabled(), true)
  await dialog.getByRole('button', { name: 'Remove from Pulse', exact: true }).click()
  await page.waitForURL('**/admin/users')
  assert.equal(sql(`select count(*) from auth.users where id='${authId}'`), '0')
  assert.equal(sql(`select count(*) from public.staff_invitations where email_normalized='${email}'`), '0')
  assert.equal(sql(`select count(*) from public.audit_events where actor_user_id='${staffId}' or target_id='${staffId}'`), '0')
  sql(`select set_config('request.jwt.claim.sub','${operatorAuth}',false);
    select public.claim_staff_invitation_send_v2('${email}','Invited Again','${department}',null,null,null,null,'${playerRole}','global',null,null,null,'e2530000-0000-4000-8000-000000000008',null);`)
  assert.equal(sql(`select count(*) from public.staff_invitations where email_normalized='${email}' and status='pending_send'`), '1')
  pass('real invitation → password → REMOVE physically cleans Auth and invitation history → same email reinvites')
}

export async function joinRecoveryBrowser({ browser, admin, app, api, sql, operatorAuth, pass }) {
  const password = randomBytes(24).toString('hex')
  const email = 'admin2.recovery.player@example.test'
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  assert.equal(created.error, null)
  sql(`insert into public.users(id,auth_user_id,email,full_name,employee_id,status,approved_at)
    values('b2530000-0000-4000-8000-000000000008','${created.data.user.id}','${email}','Local Join Player','KK-925308','active',now());
    insert into public.user_roles(user_id,role_id,scope_type,team_id)
      values('b2530000-0000-4000-8000-000000000008','10000000-0000-0000-0000-000000000003','team','34000000-0000-4000-8000-000000000011');
    select set_config('request.jwt.claim.sub','${operatorAuth}',false);
    insert into public.training_topics(id,code,name) values('22530000-0000-4000-8000-000000000008','recovery_join','Join recovery');
    create temporary table recovery_game(id uuid);
    insert into recovery_game select id from public.create_training_content_draft('quiz','Local Join Recovery','Synthetic game only','en',array['22530000-0000-4000-8000-000000000008'::uuid],'global',null,null,'{}'::uuid[]);
    select public.replace_training_questions_v2((select id from recovery_game),(select jsonb_agg(jsonb_build_object('position',n,'question_type','true_false','prompt','Local Join question '||n,'answer_options','[]'::jsonb,'correct_answer',true,'topic_ids',jsonb_build_array('22530000-0000-4000-8000-000000000008'),'time_limit_seconds',30) order by n) from generate_series(1,10) n),(select updated_at from public.training_content where id=(select id from recovery_game)));
    select public.publish_training_content((select id from recovery_game),(select updated_at from public.training_content where id=(select id from recovery_game)));
    select public.create_go_hosted_session((select id from recovery_game));`)
  const roomCode = sql(`select room.room_code from public.go_sessions room join public.go_session_memberships member on member.session_id=room.id where member.staff_user_id='${operator}' and member.member_kind='host' and room.status='lobby'`)
  assert.match(roomCode, /^KK \d{4}$/)
  const staffContext = await localContext(browser, admin, app, api)
  const staff = await staffContext.newPage()
  const failures = []
  staff.on('pageerror', error => failures.push(error.message))
  staff.on('response', response => { if (response.status() >= 400) failures.push(new URL(response.url()).pathname + ':' + response.status()) })
  await staff.goto(app + '/signin')
  await staff.getByLabel('Email address').fill(email)
  await staff.getByLabel('Password', { exact: true }).fill(password)
  await staff.getByRole('button', { name: 'Sign in', exact: true }).click()
  try { await staff.waitForURL('**/workspace', { timeout: 15000 }) } catch {
    throw new Error('Local Staff sign-in failed: ' + new URL(staff.url()).pathname + ' ' + (await staff.locator('body').innerText()).slice(0, 900) + ' ' + failures.join('; '))
  }
  await staff.goto(app + '/go')
  const input = staff.getByLabel('Game code', { exact: false })
  try { await input.waitFor({ timeout: 15000 }) } catch {
    throw new Error('Staff Join form unavailable: ' + new URL(staff.url()).pathname + ' ' + (await staff.locator('body').innerText()).slice(0, 900))
  }
  await input.fill('KK12345')
  assert.equal(await staff.getByRole('button', { name: 'Join', exact: true }).isEnabled(), false)
  await input.fill(roomCode.slice(-4))
  assert.equal(await input.inputValue(), roomCode)
  await staff.screenshot({ path: 'review-evidence.local/admin2/join-staff-enabled.png', fullPage: true })
  await staff.getByRole('button', { name: 'Join', exact: true }).click()
  try { await staff.waitForURL('**/go/room/*', { timeout: 15000 }) } catch {
    throw new Error('Staff Join failed: ' + new URL(staff.url()).pathname + ' ' + (await staff.locator('body').innerText()).slice(-900) + ' ' + failures.join('; '))
  }
  assert.equal(sql("select count(*) from public.go_session_memberships where staff_user_id='b2530000-0000-4000-8000-000000000008' and member_kind='participant'"), '1')
  await staffContext.close()
  pass('Staff enters four digits, Join enables and the real server creates one participant membership')
  const agentContext = await localContext(browser, admin, app, api)
  const agent = await agentContext.newPage()
  await agent.setViewportSize({ width: 390, height: 844 })
  await agent.goto(app + '/agent/signin')
  await agent.getByLabel('Agent ID', { exact: true }).fill('992301')
  await agent.getByLabel('PIN', { exact: true }).fill('731482')
  await agent.getByRole('button', { name: 'Continue', exact: true }).click()
  try { await agent.waitForURL('**/go', { timeout: 15000 }) } catch {
    throw new Error('Local Agent sign-in failed: ' + new URL(agent.url()).pathname + ' ' + (await agent.locator('body').innerText()).slice(0, 900))
  }
  await agent.getByLabel('Game code', { exact: false }).fill(roomCode.slice(-4))
  assert.equal(await agent.getByRole('button', { name: 'Join', exact: true }).isEnabled(), true)
  await agent.screenshot({ path: 'review-evidence.local/admin2/join-agent-enabled.png', fullPage: true })
  await agent.getByRole('button', { name: 'Join', exact: true }).click()
  await agent.waitForURL('**/go/room/*')
  assert.equal(sql("select count(*) from public.go_session_memberships where agent_id=(select id from public.agents where agent_code='992301') and member_kind='participant'"), '1')
  await agentContext.close()
  pass('Agent enters four digits, Join enables and cookie-authenticated server creates an Agent-only membership')
}
