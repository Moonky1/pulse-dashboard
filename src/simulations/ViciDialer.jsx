import { useState } from 'react'
import { CALL_DISPOSITIONS, PAUSE_CODES } from './viciModel.js'
import { playViciClick } from './viciSound.js'
import { ViciLogin } from './ViciLogin.jsx'
import { ViciPhone } from './ViciPhone.jsx'
import { ViciAdvisor } from './ViciAdvisor.jsx'

const rows = [
  [['First Name','Taylor'],['Last Name','Example']],
  [['Address','100 Training Ave'],['City','Example City'],['State','DC']],
  [['Zip','20001'],['Email','']], [['Vehicle Year',''],['Vehicle Make',''],['Vehicle Model','']],
  [['Phone','2025550147']],
  [['Odometer',''],['VIN','']], [['IP Address',''],['Vendor Lead Code','']],
  [['Loan Balance','25000'],['Loan Monthly Cost','400'],['Loan Term Length','72']],
  [['Origination Date','01/01/2025'],['APR Estimate','7.5']], [['Date of Birth','01/01/1990'],['Close Date','']],
]
export function ViciDialer({ dialer, busy, onCommand, onLocalAction = () => {} }) {
  const [phone, setPhone] = useState(''), [tab, setTab] = useState('FORM'), [pauseAfter, setPauseAfter] = useState(false)
  const [search, setSearch] = useState(true)
  const [recording,setRecording] = useState(null)
  const phase = dialer.phase, paused = dialer.is_paused ?? ['paused','callback','home','manual'].includes(phase)
  const modern = Boolean(dialer.customer), cx = dialer.customer
  const live = ['live','transfer','conference','presets','spanish','disposition'].includes(phase)
  const command = (name,value) => { if (!busy) onCommand(name,value) }
  const local = (name,action) => { if (!busy) { action(); onLocalAction(name) } }
  const pauseMenu = dialer.pause_menu || !modern && phase === 'pause_codes'
  const customerRows = cx ? [
    [['First Name',cx.first],['Last Name',cx.last]], [['Address',cx.address],['City',cx.city],['State',cx.state]],
    [['Zip',cx.zip],['Email',cx.email]], [['Vehicle Year',cx.year],['Vehicle Make',cx.make],['Vehicle Model',cx.model]],
    [['Phone',cx.phone]], [['Odometer',cx.odometer],['VIN',cx.vin]], [['IP Address',''],['Vendor Lead Code','']],
    [['Loan Balance',cx.balance],['Loan Monthly Cost',cx.payment],['Loan Term Length',cx.term]],
    [['Origination Date',cx.origination],['APR Estimate',cx.apr]], [['Date of Birth',cx.birth],['Close Date',cx.close]],
  ] : rows
  const clickSound=e=>{const button=e.target.closest?.('button');if(button&&!button.disabled)playViciClick()}
  if (['welcome','phone_login','campaign_login'].includes(phase)) return <div className="vici-scroll" onClickCapture={clickSound}><ViciLogin key={phase} phase={phase} busy={busy} command={command} local={local}/></div>
  const btn = (name,label,tone='') => <button type="button" className={'vici-button '+tone} disabled={busy} onClick={() => command(name)}>{label}</button>
  return <div className="vici-scroll" tabIndex={0} aria-label="VICIdial controls — scroll horizontally on small screens" onClickCapture={clickSound} onChangeCapture={e=>{if(e.target.matches?.('select,input[type="checkbox"]'))playViciClick()}}><section className="vici-dialer" aria-label="Vici Simulator">
    <div className="vici-session">Logged in as User: 0001 on Phone: SIP/0001 to campaign: OPENERS <span>Calls in Queue: 0</span></div>
    <header className="vici-header"><button type="button" className="vici-logo" disabled={busy} onClick={() => command('logo')} aria-label="VICIdial logo"><span>◢◢</span>VICI<b>dial</b></button>{['SCRIPT','FORM'].map(name => <button key={name} type="button" className="vici-tab" aria-pressed={tab===name} disabled={busy} onClick={() => local(name.toLowerCase(),()=>setTab(name))}>{name}</button>)}<strong className={live?'vici-live':'vici-no-call'}>{live?'LIVE CALL':'NO LIVE CALL'}</strong></header>
    <div className="vici-status"><span>STATUS: {live?'Incoming: '+(cx?.phone || '2025550147')+'':''} {!live && <button type="button" className={'vici-agent-status '+(paused?'vici-paused':'vici-active')} disabled={busy||phase==='call_disposition'||phase==='manual'} aria-expanded={Boolean(pauseMenu)} onClick={() => command('status')}>{paused?'YOU ARE PAUSED':'YOU ARE ACTIVE'}</button>}</span><span>Simulator</span></div>
    {pauseMenu ? <section className="vici-pause-panel" aria-label="Pause codes panel"><h2>SELECT A PAUSE CODE :</h2><strong>PAUSE CODE</strong><div className="vici-pause-columns">{PAUSE_CODES.map((column,index)=><div key={index}>{column.map(([name,label])=><button type="button" className="vici-link" key={name} disabled={busy} onClick={()=>command(name)}>{label}</button>)}</div>)}</div><footer>{btn('resume','RESUME DIALING')}{btn('closePause','Go Back')}</footer></section>
    : phase==='manual' ? <section className="vici-manual" aria-label="Manual Dial panel"><h2>NEW MANUAL DIAL LEAD FOR 0001 in campaign OPENERS:</h2><p>Enter information below for the new lead you wish to call.<br/>Note: a dial prefix of 7 will be added to the beginning of this number<br/>Note: all new manual dial leads will go into list 998</p><label>Dial Code:<input readOnly value="1" /><span>(This is usually a 1 in the USA-Canada)</span></label><label>Phone Number:<input aria-label="Phone Number" type="tel" inputMode="numeric" autoComplete="off" maxLength={32} value={phone} onChange={e=>setPhone(e.target.value)} disabled={busy} /><span>(digits only)</span></label><label>Search Existing Leads:<input type="checkbox" checked={search} disabled={busy} onChange={e=>local('search',()=>setSearch(e.target.checked))} /><span>Search for the phone number before inserting a new lead.</span></label><div className="vici-manual-override"><p>If you want to dial a number and have it NOT be added as a new lead, enter the exact dialstring in the Dial Override field below.</p><label>Dial Override:<input readOnly value="" /><span>(digits only please)</span></label></div><div className="vici-green-actions"><button type="button" className="vici-link" disabled={busy} onClick={()=>command('dial',phone)}>Dial Now</button>{btn('preview','Preview Call')}{btn('back','Go Back')}</div></section>
    : phase==='call_disposition' ? <section className="vici-dispositions" aria-label="Call disposition panel"><header><strong>DISPOSITION CALL : {cx?.phone || '2025550147'}</strong>{btn('hangup','Hangup Again')}<span>CALL DISPOSITION</span></header><div className="vici-disposition-columns">{CALL_DISPOSITIONS.map((column,index)=><div key={index}>{column.map(([code,label])=><button type="button" className="vici-link" key={code} aria-pressed={dialer.call_disposition===code} disabled={busy} onClick={()=>command('callDisposition',code)}>{code} - {label}{code==='CALLBK'?' *':''}</button>)}</div>)}</div><footer><label><input type="checkbox" checked={pauseAfter} onChange={e=>local('pauseAfter',()=>setPauseAfter(e.target.checked))} disabled={busy} /> PAUSE AGENT DIALING</label><button type="button" className="vici-link" disabled={busy||!dialer.call_disposition} onClick={()=>command('submit',pauseAfter?'paused':'active')}>SUBMIT</button></footer></section>
    : <><div className="vici-body"><aside className="vici-sidebar"><div className="vici-recording">RECORDING FILE:<br /><br />RECORD ID:<br /><button type="button" className="vici-button" disabled={busy} onClick={()=>local('recording',()=>setRecording(!(recording??live)))}>{(recording??live)?'STOP RECORDING':'START RECORDING'}</button></div><button className="vici-button" type="button" disabled={busy} onClick={()=>local('webForm',()=>setTab('FORM'))}>WEB FORM</button><button className="vici-button" type="button" disabled={busy} onClick={()=>local('webForm2',()=>setTab('FORM'))}>WEB FORM 2</button>{btn('park','PARK CALL','purple')}{btn(modern?'transfer':'presets','TRANSFER - CONF','purple')}{btn('hangup','HANGUP CUSTOMER','red')}{btn('blind','SEND DTMF','purple')}</aside><div className="vici-form">{tab==='FORM'?<div className="vici-fields">{customerRows.map((row,index)=><div className="vici-field-row" key={index}>{row.map(([label,value])=><label key={label}>{label}<input aria-label={label} value={value} readOnly /></label>)}</div>)}</div>:<div className="vici-script"><h3>SCRIPT</h3><p>Hello, may I speak with {cx?.first || 'Taylor'}?</p></div>}</div>
      <ViciPhone busy={busy} local={local}/>
    </div>{live&&(!modern||phase!=='live')&&<section className="vici-transfer"><div>TRANSFER CONFERENCE FUNCTIONS:</div><div className="vici-transfer-row"><select aria-label="Transfer preset" defaultValue="BlindSpanishXfer"><option value="BlindSpanishXfer">BlindSpanishXfer - Blind Spanish Xfer</option><option>English</option></select>{btn('local','LOCAL CLOSER','purple')}<span>CHANNEL:</span></div><div className="vici-transfer-row"><label>NUMBER TO CALL: <input readOnly value="2025550199" /></label>{btn('hangup','HANGUP XFER LINE','red')}{btn('both','HANGUP BOTH LINES','red')}{btn('leave','LEAVE 3-WAY CALL','red')}</div><div className="vici-transfer-row">{btn('blind','BLIND TRANSFER','purple')}{btn(modern?'connect':'dial','DIAL WITH CUSTOMER','blue')}{btn('park','PARK CUSTOMER DIAL','purple')}{btn('presets','PRESETS','purple')}</div>{phase==='conference'&&<ViciAdvisor key={dialer.server_now} startedAt={dialer.intro_started_at} serverNow={dialer.server_now}/>}</section>}
      <footer className="vici-bottom">{btn('manual','MANUAL DIAL')}{btn('fast','FAST DIAL')}{btn('log','VIEW CALL LOG')}</footer>
      {['presets','spanish','disposition'].includes(phase)&&<section className="vici-presets" aria-label="Transfer presets"><h2>PRESETS</h2><label>Language<select key={phase} aria-label="Language" disabled={busy} value={phase==='presets'?'English':'Spanish'} onChange={e=>command('language',e.target.value)}><option>English</option><option>Spanish</option></select></label>{btn('local','LOCAL CLOSER','purple')}{phase==='disposition'&&<label>Disposition<select aria-label="Disposition" value="" disabled={busy} onChange={e=>command('disposition',e.target.value)}><option value="">Select a disposition</option><option>SPANISH SPEAKER</option><option>SPXFER</option></select></label>}</section>}
    </>}
  </section></div>
}

export function ViciDispositionPanel({ selected,phone,busy,onSelect,onSubmit }) {
  const [pause,setPause]=useState(false)
  return <div className="vici-scroll" tabIndex={0} aria-label="Call dispositions" onClickCapture={e=>{const button=e.target.closest?.('button');if(button&&!button.disabled)playViciClick()}}>
    <section className="vici-dispositions vici-dispositions--random" aria-label="Call disposition panel"><header><strong>DISPOSITION CALL : {phone}</strong><span>CALL DISPOSITION</span></header>
      <div className="vici-disposition-columns">{CALL_DISPOSITIONS.map((column,index)=><div key={index}>{column.map(([code,label])=><button type="button" className="vici-link" key={code} aria-pressed={selected===code} disabled={busy} onClick={()=>onSelect(code)}>{code} - {label}{code==='CALLBK'?' *':''}</button>)}</div>)}</div>
      <footer><label><input type="checkbox" checked={pause} disabled={busy} onChange={e=>{playViciClick();setPause(e.target.checked)}}/> PAUSE AGENT DIALING</label><button type="button" className="vici-link" disabled={busy||!selected} onClick={()=>onSubmit(pause?'paused':'active')}>SUBMIT</button></footer>
    </section>
  </div>
}
