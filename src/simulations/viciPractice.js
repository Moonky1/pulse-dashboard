// Staff-only reference engine. Official attempts use the versioned server contract.
export const VICI_PRACTICES = {
  login: { title: 'Login', commands: ['agentLogin','phoneLogin','campaignLogin','status','resume'], phases: ['welcome','phone_login','campaign_login','home','pause_codes','active'], values: { phoneLogin: 'training', campaignLogin: 'OPENERS2' }, situation: 'Log in with the training credentials, choose OPENERS2 and go active.' },
  callback: { title: 'Callback', commands: ['status','callbacks','logo','manual','dial','hangup','callDisposition','submit'], phases: ['home','pause_codes','home','home','manual','live','call_disposition','call_disposition','active'], values: { dial: 'customer-phone', callDisposition: 'NI' }, situation: 'Call this customer back. Once connected, the customer says: “Thank you for calling back, but I am not interested.”' },
  english: { title: 'English Transfer · XFER', commands: ['transfer','connect','leave','callDisposition','submit'], phases: ['live','transfer','conference','call_disposition','call_disposition','active'], values: { callDisposition: 'XFER' }, situation: 'The English-speaking customer agrees to speak with a Service Advisor.' },
  spxfer: { title: 'Spanish Transfer · SPXFER', commands: ['transfer','presets','language','connect','leave','callDisposition','submit'], phases: ['live','transfer','presets','transfer','conference','call_disposition','call_disposition','active'], values: { language: 'Spanish', callDisposition: 'SPXFER' }, situation: 'The Spanish-speaking customer agrees to speak with a Spanish Service Advisor.' },
  asia: { title: 'Local Spanish Transfer · SPANIS', commands: ['transfer','presets','language','local','disposition','callDisposition','submit'], phases: ['live','transfer','presets','spanish','disposition','call_disposition','call_disposition','active'], values: { language: 'Spanish', disposition: 'SPANISH SPEAKER', callDisposition: 'SPANIS' }, situation: 'This line cannot handle Spanish. Advise the customer that you will connect them with a Spanish-speaking representative.' },
  dead_air: { title: 'Dead Air', commands: ['hangup','callDisposition','submit'], phases: ['live','call_disposition','call_disposition','active'], values: { callDisposition: 'DAIR' }, situation: 'The call connects, but there is silence and no customer response.' },
  answering: { title: 'Answering Machine', commands: ['hangup','callDisposition','submit'], phases: ['live','call_disposition','call_disposition','active'], values: { callDisposition: 'A' }, situation: 'An automated greeting says: “Please leave your message after the tone.”' },
  mailbox_full: { title: 'Voicemail Full', commands: ['hangup','callDisposition','submit'], phases: ['live','call_disposition','call_disposition','active'], values: { callDisposition: 'A' }, situation: 'An automated message says: “The mailbox is full and cannot accept any messages.”' },
  mock: { title: 'Mock Call · Customer Information', commands: ['hangup','callDisposition','submit'], phases: ['live','call_disposition','call_disposition','active'], values: { callDisposition: 'NI' }, situation: 'Practice your opening and ask about any missing loan information. At the end the customer says: “I am not interested.”' },
}
export const VICI_CUSTOMER_NAMES = ['Taylor Example','Jordan Sample','Morgan Demo','Casey Practice','Riley Example','Avery Sample','Cameron Demo','Jamie Practice','Drew Example','Alex Sample','Quinn Demo','Robin Practice','Skyler Example','Reese Sample','Parker Demo','Rowan Practice','Blake Example','Finley Sample','Emerson Demo','Sage Practice']
export function viciCustomer(index = 0) {
  const n = ((index % 20) + 20) % 20, [first,last] = VICI_CUSTOMER_NAMES[n].split(' ')
  return { index:n, first, last, address:`${100+n} Training Ave`, city:'Example City', state:'DC', zip:'20001', email:'', year:'', make:'', model:'', phone:String(2025550147+n), odometer:'', vin:'', balance:String(25000+n*350), payment:[4,9,14,19].includes(n)?'':String(400+n*7), term:'72', origination:[2,7,12,17].includes(n)?'':`01/${String(1+n).padStart(2,'0')}/2025`, apr:'7.5', birth:'01/01/1990', close:'' }
}
// Audio identification belongs to Random, never a named/spoiler menu item.
export const VICI_MENU = { random: { title:'Random Dispositions' }, ...Object.fromEntries(['english','spxfer','asia','callback','login','mock'].map(key=>[key,VICI_PRACTICES[key]])) }
export function newViciPractice(scenario, customerIndex = 0) {
  const item = VICI_PRACTICES[scenario]
  if (!item) throw new Error('Practice unavailable')
  return { challenge:{scenario,workflow_version:3}, dialer:{phase:item.phases[0],is_paused:['login','callback'].includes(scenario),pause_menu:false,call_disposition:null,customer:viciCustomer(customerIndex),intro_started_at:null}, position:0,state_version:1,mistakes:0,status:'started',situation:item.situation }
}
export function practiceViciCommand(snapshot, command, value, now = Date.now()) {
  const item=VICI_PRACTICES[snapshot.challenge.scenario], d={...snapshot.dialer}, next={...snapshot,dialer:d,state_version:snapshot.state_version+1,correct:null,feedback:null}
  const expected=item.commands[snapshot.position]
  if (command==='newCustomer' && snapshot.position===0) { d.customer=viciCustomer(d.customer.index+1); return next }
  if (command==='closePause' && d.pause_menu) { d.pause_menu=false; return next }
  if (command==='status' && ['home','active','pause_codes'].includes(d.phase) && expected!=='status') { d.pause_menu=true;return next }
  if (['break','lunch','manage','restroom','tech','callbacks','resume'].includes(command) && d.pause_menu && command!==expected) { d.is_paused=command!=='resume';d.pause_menu=false;return next }
  if (command==='logo' && ['home','active'].includes(d.phase) && expected!=='logo') return next
  if (snapshot.status!=='started') return next
  const wanted=item.values[command]
  const correct=command===expected && (!wanted || value===(wanted==='customer-phone'?d.customer.phone:wanted)) && (command!=='submit'||['active','paused'].includes(value)) && (!['callbacks','resume'].includes(command)||d.pause_menu) && (!['manual','dial'].includes(command)||d.is_paused&&!d.pause_menu) && (command!=='leave'||d.intro_started_at!==null && now-Date.parse(d.intro_started_at)>=15000)
  if (!correct) return {...next,correct:false,mistakes:snapshot.mistakes+1,feedback:'Action not completed.'}
  if(command==='status')d.pause_menu=true
  if(command==='callbacks'){d.is_paused=true;d.pause_menu=false}
  if(command==='resume'){d.is_paused=false;d.pause_menu=false}
  if(command==='connect')d.intro_started_at=new Date(now).toISOString()
  if(command==='language')d.language=value
  if(command==='callDisposition')d.call_disposition=value
  if(command==='submit')d.is_paused=value==='paused'
  const position=snapshot.position+1,complete=position===item.commands.length
  d.phase=item.phases[position]
  return {...next,position,correct:true,status:complete?'completed':'started',feedback:complete?'Practice complete.':null}
}
