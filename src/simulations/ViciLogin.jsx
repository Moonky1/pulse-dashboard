import { useState } from 'react'

// These inputs never authenticate a person or reach the server as credentials.
export function ViciLogin({ phase, busy, command, local }) {
  const [user,setUser]=useState('0001'), [password,setPassword]=useState(''), [campaign,setCampaign]=useState('')
  const submit=event=>{
    event.preventDefault()
    const valid=user==='0001' && password==='TRAINING'
    setPassword('')
    command(phase==='phone_login'?'phoneLogin':'campaignLogin', valid?(phase==='phone_login'?'training':campaign):'invalid')
  }
  return <section className="vici-login" aria-label="Dialer training login"><header><strong><span>◢◢</span>VICIdial</strong><b>{phase==='welcome'?'Welcome':phase==='phone_login'?'phone login':'Campaign Login'}</b></header>
    {phase==='welcome'?<nav>{[['agentLogin','Agent Login'],['timeclock','Timeclock'],['hci','HCI Screen'],['administration','Administration']].map(([name,label])=><button key={name} className="vici-link" disabled={busy} onClick={()=>name==='agentLogin'?command(name):local(name,()=>{})}>{label}</button>)}</nav>
    :<form key={phase} onSubmit={submit}><p>Training only · Login: 0001 · Password: TRAINING</p><label>{phase==='phone_login'?'Phone Login:':'User Login:'}<input aria-label={phase==='phone_login'?'Phone Login':'User Login'} value={user} maxLength={20} autoComplete="off" onChange={e=>setUser(e.target.value)} disabled={busy}/></label><label>{phase==='phone_login'?'Phone Password:':'User Password:'}<input aria-label={phase==='phone_login'?'Phone Password':'User Password'} type="password" value={password} autoComplete="off" maxLength={40} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>
      {phase==='campaign_login'&&<label>Campaign:<select aria-label="Campaign" value={campaign} onChange={e=>setCampaign(e.target.value)} disabled={busy}><option value="">-- PLEASE SELECT A CAMPAIGN --</option><option value="OPENERS2">openers2 - Openers 2 Campaign</option><option value="OPENERS3">openers3 - openers3</option><option value="OPENERS4">Openers4 - Openers 4 Campaign NESTING</option></select></label>}<button className="vici-button" disabled={busy} type="submit">SUBMIT</button></form>}
    <footer>VERSION: 2.14 · Simulator</footer>
  </section>
}
