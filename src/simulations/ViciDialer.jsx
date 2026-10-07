import { useState } from 'react'

const rows = [
  [['First Name','Taylor'],['Last Name','Example']],
  [['Address','100 Training Ave'],['City','Example City'],['State','DC']],
  [['Zip','20001'],['Email','']],
  [['Vehicle Year',''],['Vehicle Make',''],['Vehicle Model','']],
  [['Odometer',''],['VIN','']], [['IP Address',''],['Vendor Lead Code','TRAINING']],
  [['Loan Balance','25000'],['Loan Monthly Cost','400'],['Loan Term Length','72']],
  [['Origination Date','01/01/2025'],['APR Estimate','7.5']], [['Date of Birth','01/01/1990'],['Close Date','']],
]

export function ViciDialer({ dialer, busy, onCommand }) {
  const [phone, setPhone] = useState(''), [tab, setTab] = useState('FORM')
  const phase = dialer.phase, paused = ['paused','callback','home','manual'].includes(phase)
  const command = (name, value) => { if (!busy) onCommand(name, value) }
  const btn = (name, label, tone = '') => <button type="button" className={'vici-button ' + tone} disabled={busy} onClick={() => command(name)}>{label}</button>
  return <div className="vici-scroll" tabIndex={0} aria-label="VICIdial training controls — scroll horizontally on small screens">
    <section className="vici-dialer" aria-label="VICIdial simulator">
      <div className="vici-session">Logged in as User: TRAINING on Phone: SIP/TRAINING to campaign: OPENERS <span>Training session · Calls in Queue: 0</span></div>
      <header className="vici-header"><button type="button" className="vici-logo" disabled={busy} onClick={() => command('logo')} aria-label="VICIdial logo"><span>◢◢</span>VICI<b>dial</b></button>{['SCRIPT','FORM'].map(name => <button key={name} type="button" className="vici-tab" aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}<strong className={paused ? 'vici-paused' : 'vici-live'}>{paused ? 'YOU ARE PAUSED' : 'LIVE CALL'}</strong></header>
      <div className="vici-status">STATUS: {paused ? 'PAUSED' : 'Incoming: (202)555-0199'} <span>Synthetic customer · No telephony connection</span></div>
      <div className="vici-body"><aside className="vici-sidebar"><div className="vici-recording">RECORDING FILE:<br />TRAINING-EXAMPLE<br />RECORD ID: TRAINING<br /><span>Recording simulated only</span></div>
        <button className="vici-button" type="button" onClick={() => setTab('FORM')}>WEB FORM</button><button className="vici-button" type="button" onClick={() => setTab('FORM')}>WEB FORM 2</button>
        {btn('park','PARK CALL','purple')}{btn('presets','TRANSFER - CONF','purple')}{btn('hangup','HANGUP CUSTOMER','red')}{btn('blind','SEND DTMF','purple')}
      </aside><div className="vici-form">{tab === 'FORM' ? <div className="vici-fields">{rows.map((row,index) => <div className="vici-field-row" key={index}>{row.map(([label,value]) => <label key={label}>{label}<input aria-label={label} value={value} readOnly /></label>)}</div>)}</div> : <div className="vici-script"><h3>Training call script</h3><p>This is a synthetic customer. No live calls or recordings.</p><p>Complete the challenge using the dialer controls. Use “Show hint” only if you need help.</p></div>}</div>
      {phase === 'paused' && <aside className="vici-pause-menu"><strong>SELECT A PAUSE CODE</strong>{btn('break','Break - Break')}{btn('lunch','Lunch - Lunch')}{btn('callbacks','CB - Callbacks')}</aside>}
      {phase === 'callback' && <aside className="vici-pause-menu"><strong>PAUSE CODE: CB</strong><p>Callbacks</p><p>No live dialing in training</p></aside>}
      </div>
      {!paused && <section className="vici-transfer"><div>TRANSFER CONFERENCE FUNCTIONS:</div><div className="vici-transfer-row"><select aria-label="Transfer preset" defaultValue="BlindSpanishXfer"><option>BlindSpanishXfer</option><option>English</option></select>{btn('local','LOCAL CLOSER','purple')}<span>SECONDS: 0 · CHANNEL: TRAINING</span></div><div className="vici-transfer-row"><label>NUMBER TO CALL: <input readOnly value="2025550199" /></label>{btn('hangup','HANGUP XFER LINE','red')}{btn('both','HANGUP BOTH LINES','red')}{btn('leave','LEAVE 3-WAY CALL','red')}</div><div className="vici-transfer-row">{btn('blind','BLIND TRANSFER','purple')}{btn('dial','DIAL WITH CUSTOMER','blue')}{btn('park','PARK CUSTOMER DIAL','purple')}{btn('presets','PRESETS','purple')}</div>
      </section>}
      <footer className="vici-bottom">{btn('manual','MANUAL DIAL')}{btn('fast','FAST DIAL')}{btn('log','VIEW CALL LOG')}<small>VICIdial-style reconstruction · TRAINING ONLY</small></footer>
      {phase === 'manual' && <section className="vici-manual" aria-label="Manual Dial panel"><h2>MANUAL DIAL</h2><p>Enter a synthetic Phone Number. This panel cannot make a real call.</p><label>Dial Code<input readOnly value="1" /></label><label>Phone Number<input type="tel" inputMode="numeric" autoComplete="off" maxLength={32} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} /></label><label>Search Existing Leads<input readOnly value="" /></label><label>Dial Override<input readOnly value="" /></label><div>{<button type="button" className="vici-button" disabled={busy} onClick={() => command('dial', phone)}>Dial Now</button>}{btn('preview','Preview Call')}{btn('back','Go Back')}</div></section>}
      {['presets','spanish','disposition'].includes(phase) && <section className="vici-presets" aria-label="Transfer presets"><h2>PRESETS</h2><label>Language<select key={phase} aria-label="Language" disabled={busy} value={phase === 'presets' ? 'English' : 'Spanish'} onChange={e => command('language', e.target.value)}><option>English</option><option>Spanish</option></select></label>{btn('local','LOCAL CLOSER','purple')}{phase === 'disposition' && <label>Disposition<select aria-label="Disposition" value="" disabled={busy} onChange={e => command('disposition',e.target.value)}><option value="">Select a disposition</option><option>SPANISH SPEAKER</option><option>SPXFER</option></select></label>}</section>}
    </section>
  </div>
}
