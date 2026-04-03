import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoPresent.css'

// ─────────────────────────────────────────────
//  DIALER UI MOCK COMPONENTS
// ─────────────────────────────────────────────
function ViciHeader({ title }) {
  return (
    <div className="vici-header">
      <span className="vici-logo">VICIdial</span>
      <span className="vici-title">{title}</span>
    </div>
  )
}

function DialerMock({ type }) {
  switch (type) {
    case 'ip-validation':
      return (
        <div className="vici-wrap">
          <div className="vici-alert-banner">⚠️ Do this EVERY DAY before logging in to the dialer</div>
          <div className="vici-card">
            <div className="vici-card-title">🌐 VICIbox — Agent Validation</div>
            <div className="vici-field-row"><span className="vici-field-label">URL</span><span className="vici-field-val link">https://alwaysbeclosing.ai:444/abc_validation.php</span></div>
            <div className="vici-field-row"><span className="vici-field-label">User ID</span><span className="vici-field-val">9996 or 9995</span></div>
            <div className="vici-field-row"><span className="vici-field-label">Password</span><span className="vici-field-val">validateme365</span></div>
            <div className="vici-success">✓ Login Validated — Submit and confirm your IP is shown</div>
          </div>
        </div>
      )
    case 'login':
      return (
        <div className="vici-wrap">
          <div className="vici-steps-row">
            <div className="vici-step-block">
              <div className="vici-step-num">1</div>
              <ViciHeader title="Welcome" />
              <div className="vici-link-list">
                <div className="vici-link active">Agent Login</div>
                <div className="vici-link">Timeclock</div>
                <div className="vici-link">HCI Screen</div>
                <div className="vici-link">Administration</div>
              </div>
            </div>
            <div className="vici-step-block">
              <div className="vici-step-num">2</div>
              <ViciHeader title="phone login" />
              <div className="vici-form">
                <div className="vici-form-row"><label>Phone Login:</label><input readOnly defaultValue="2288"/></div>
                <div className="vici-form-row"><label>Phone Password:</label><input type="password" readOnly defaultValue="••••••••"/></div>
                <button className="vici-submit">SUBMIT</button>
              </div>
            </div>
            <div className="vici-step-block">
              <div className="vici-step-num">3</div>
              <ViciHeader title="Campaign Login" />
              <div className="vici-form">
                <div className="vici-form-row"><label>User Login:</label><input readOnly defaultValue="2288"/></div>
                <div className="vici-form-row"><label>User Password:</label><input type="password" readOnly defaultValue="••••••••"/></div>
                <div className="vici-form-row"><label>Campaign:</label>
                  <select className="vici-select">
                    <option>openers2 - Openers 2 Campaign</option>
                    <option>openers3 - openers3</option>
                  </select>
                </div>
                <button className="vici-submit">SUBMIT</button>
              </div>
            </div>
          </div>
        </div>
      )
    case 'go-active':
      return (
        <div className="vici-wrap">
          <div className="vici-dialer-screen">
            <div className="vici-top-bar">
              <ViciHeader title="SCRIPT   FORM" />
              <span className="vici-live">LIVE CALL</span>
            </div>
            <div className="vici-status-paused">
              <span className="vici-arrow">→</span>
              <span className="vici-paused-text">YOU ARE PAUSED<br/><small>RECORDING FILE</small></span>
            </div>
            <div className="vici-action-buttons">
              <div className="vici-action-btn">RECORD ID</div>
              <div className="vici-action-btn">START RECORDING</div>
              <div className="vici-action-btn">WEB FORM</div>
              <div className="vici-action-btn">WEB FORM 2</div>
              <div className="vici-action-btn highlight">PARK CALL</div>
              <div className="vici-action-btn highlight">TRANSFER - CONF</div>
              <div className="vici-action-btn danger">HANGUP CUSTOMER</div>
              <div className="vici-action-btn">SEND DTMF</div>
            </div>
            <div className="vici-tip">Click <strong>TRANSFER - CONF</strong> to start the 3-way call transfer process</div>
          </div>
        </div>
      )
    case 'transfer-en':
      return (
        <div className="vici-wrap">
          <div className="vici-transfer-screen">
            <div className="vici-transfer-steps">
              <div className="vici-transfer-step">
                <span className="vici-t-num">1</span>
                <span>Click <strong>TRANSFER - CONF</strong> on the left panel</span>
              </div>
              <div className="vici-transfer-conf-panel">
                <div className="vici-tconf-header">TRANSFER CONFERENCE FUNCTIONS:</div>
                <div className="vici-tconf-row">
                  <select className="vici-select sm">
                    <option>BlindSpanishXfer - Blind Spanish Xfer</option>
                  </select>
                  <button className="vici-btn-green">LOCAL CLOSER</button>
                  <button className="vici-btn-red">HANGUP XFER LINE</button>
                </div>
                <div className="vici-tconf-row">
                  <span>SECONDS: 63</span>
                  <span>CHANNEL:</span>
                  <button className="vici-btn-red">HANGUP BOTH LINES</button>
                </div>
                <div className="vici-tconf-row">
                  <span>NUMBER TO CALL: 9995554444</span>
                  <button className="vici-btn-highlight">⬇ 2. DIAL WITH CUSTOMER</button>
                  <button className="vici-btn-highlight">→ 3. LEAVE 3-WAY CALL</button>
                </div>
              </div>
              <div className="vici-transfer-step">
                <span className="vici-t-num">2</span>
                <span>Wait for the specialist to do the introduction first</span>
              </div>
              <div className="vici-transfer-step">
                <span className="vici-t-num">3</span>
                <span>Click <strong>LEAVE 3-WAY CALL</strong> — but wait 15 seconds first!</span>
              </div>
            </div>
          </div>
        </div>
      )
    case 'transfer-es':
      return (
        <div className="vici-wrap">
          <div className="vici-transfer-screen">
            <div className="vici-transfer-steps">
              <div className="vici-transfer-step">
                <span className="vici-t-num">1</span>
                <span>Click <strong>TRANSFER - CONF</strong> on the left panel</span>
              </div>
              <div className="vici-transfer-conf-panel">
                <div className="vici-tconf-header">TRANSFER CONFERENCE FUNCTIONS:</div>
                <div className="vici-tconf-row">
                  <select className="vici-select sm">
                    <option selected>BlindSpanishXfer - Blind Spanish Xfer ← 2. Select Spanish</option>
                    <option>LOCAL CLOSER</option>
                  </select>
                  <button className="vici-btn-green">LOCAL CLOSER</button>
                </div>
                <div className="vici-tconf-row">
                  <span>NUMBER TO CALL: 9995554444</span>
                  <button className="vici-btn-highlight">3. DIAL WITH CUSTOMER</button>
                  <button className="vici-btn-highlight">→ 4. LEAVE 3-WAY CALL</button>
                </div>
              </div>
              <div className="vici-transfer-step">
                <span className="vici-t-num">3</span>
                <span>Wait for the specialist to do the introduction</span>
              </div>
              <div className="vici-transfer-step">
                <span className="vici-t-num">4</span>
                <span>Click <strong>LEAVE 3-WAY CALL</strong> — stay 15 seconds after SA joins!</span>
              </div>
            </div>
          </div>
        </div>
      )
    case 'form-reading':
      return (
        <div className="vici-wrap">
          <div className="vici-form-screen">
            <div className="vici-form-mock">
              <div className="vici-form-row-mock highlight-row"><span>First Name:</span><strong>ROBERT</strong><span>Last Name:</span><strong>SOUSA</strong></div>
              <div className="vici-form-row-mock"><span>Address:</span><span>3627 BUSH RD</span><span>City:</span><span>GRACEVILLE</span><span>State:</span><span>FL</span></div>
              <div className="vici-form-row-mock"><span>Zip:</span><span>32440</span></div>
              <div className="vici-form-row-mock"><span>Vehicle Year:</span><span></span><span>Vehicle Make:</span><span></span><span>Vehicle Model:</span><span></span></div>
              <div className="vici-form-row-mock highlight-row"><span>Loan Balance:</span><strong>25927</strong><span>Loan Monthly Cost:</span><strong>508</strong><span>Loan Term Length:</span><strong>73</strong></div>
              <div className="vici-form-row-mock highlight-row"><span>Origination Date:</span><strong>12/18/2023</strong></div>
            </div>
            <div className="vici-form-legend">
              <div className="vici-legend-item use">✓ USE: First/Last Name, Monthly Cost, Origination Date, Loan Balance</div>
              <div className="vici-legend-item skip">✗ SKIP: Address, Finance Company, Terms of Loan, Plan Cost</div>
            </div>
          </div>
        </div>
      )
    case 'dispositions':
      return (
        <div className="vici-wrap">
          <div className="vici-disp-screen">
            <div className="vici-disp-header">CALL DISPOSITION — ⭐ = Allowed options</div>
            <div className="vici-disp-grid">
              {[
                ['A - Answering Machine','⭐'],['BLANK - Blank File','⭐'],['CALLBK - Call Back','⭐'],
                ['DAIR - Dead Air','⭐'],['DC - Disconnected Number',''],['DNC - Do Not Call','⭐'],
                ['NI - Not Interested','⭐'],['SPXFER - Spanish Xfer','⭐'],['WRGNUM - Wrong Number','⭐'],
                ['WRGVEH - Wrong Vehicle Info','⭐'],['XFER - Call Transferred','⭐'],['LANG - Language Barrier',''],
              ].map(([label, star]) => (
                <div key={label} className={`vici-disp-item ${star ? 'allowed' : ''}`}>
                  {star && <span className="vici-star">⭐</span>}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

// ─────────────────────────────────────────────
//  DECK DEFINITIONS
// ─────────────────────────────────────────────
const DECKS = [
  {
    id: 'general',
    icon: '🎧',
    title: 'General Training',
    desc: 'Scripts, product knowledge, objections, transfer protocol',
    color: '#f97316',
    slides: [
      { type: 'cover', title: 'Opener Training Session', sub: 'Auto Warranty · Kampaign Kings', icon: '🎧' },
      { type: 'bullets', title: 'Training Objective', icon: '🎯',
        items: ['Deliver the official script word-for-word','Verify vehicle eligibility correctly','Handle objections professionally','Execute clean, compliant transfers','Use the dialer and dispositions properly'] },
      { type: 'four-box', title: 'Script Mastery — 4 Steps',
        boxes: [{ label:'Introduction & Financing Info', color:'#f97316' },{ label:'Vehicle Condition Verification', color:'#ea580c' },{ label:'Setting Expectations', color:'#c2410c' },{ label:'Professional Transfer', color:'#9a3412' }] },
      { type: 'script-en' },
      { type: 'script-es' },
      { type: 'comparison', title: 'Extended Warranty vs. Others', icon: '📦',
        cols: [
          { name: 'Factory Warranty', color: '#b45309', points: ['Comes with NEW vehicles','Lasts 3 years or 36,000 miles','Covers manufacturer defects','Expires — cannot be renewed'] },
          { name: 'Extended Coverage', color: '#f97316', points: ['NOT mandatory','Pays for mechanical repairs AFTER factory warranty ends','Optional — you choose the plan',"That's what WE offer"] },
          { name: 'Insurance', color: '#92400e', points: ['MANDATORY in the US to drive','Covers accidents, damage, theft','Does NOT cover mechanical breakdowns','Completely different product'] },
        ] },
      { type: 'bullets', title: 'What We CANNOT Cover', icon: '🚫', danger: true,
        items: ['Electric vehicles','Vehicles manufactured before 2011','Vehicles with more than 175,000 miles','Pre-existing mechanical issues (vehicle must run)','Damage from collisions or accidents','Bodywork, cosmetic repairs, light bulbs','Wear and tear items','Motorcycles, trailers, and Lamborghinis'] },
      { type: 'donts', title: 'What NOT to Say', icon: '⛔',
        items: [{ rule:"Don't say we work for car brands", detail:'We are Vehicle Services Group — independent.' },{ rule:"Don't say we're extending factory warranty", detail:'We offer extended coverage — a separate product.' },{ rule:'Never say "FREE"', detail:'This is misleading and non-compliant.' },{ rule:"Don't say we got info from the bank", detail:'Say: "We partner with dealerships and vehicle registries."' }] },
      { type: 'steps', title: 'Transfer Protocol', icon: '🔄',
        steps: ['Confirm vehicle qualification (is it running?)', 'Get customer approval to transfer', 'Initiate transfer — stay on the line', 'Wait for Service Advisor to pick up and speak first', 'Introduce client: "Hello SA, I have [name] on the line"', '⏱️ Stay 15 seconds after SA joins — confirm handoff before leaving'] },
      { type: 'objection', emoji:'🚫', title:'Not Interested', goal:'Keep them on the line & create curiosity',
        rebuttal:'"I completely understand. A lot of people felt the same way at first — until they saw how much a single repair could cost without coverage. That\'s exactly why we do not charge for the quote. Fair enough?"' },
      { type: 'objection', emoji:'🛡️', title:'I already have insurance', goal:'Differentiate coverage type clearly',
        rebuttal:'"Totally get that — and that\'s actually why we\'re calling. Insurance covers accidents. What we offer is mechanical breakdown coverage — engine, transmission, and more."' },
      { type: 'objection', emoji:'💲', title:'How much does it cost?', goal:'Tease value & move toward transfer',
        rebuttal:'"That\'s the great part — cost depends on your mileage and driving habits, but it\'s usually less than the cost of a single major repair. I\'ll get you to the Service Advisor to break it all down."' },
      { type: 'cover', title: 'Start Dialing! 📞', sub: 'Kampaign Kings · Auto Warranty Garrett', icon: '🚀' },
    ]
  },
  {
    id: 'dialer',
    icon: '🖥️',
    title: 'Dialer Guide',
    desc: 'IP validation, login, go active, how to transfer EN/ES, dispositions',
    color: '#3b82f6',
    slides: [
      { type: 'cover', title: 'Dialer Guide', sub: 'VICIdial · Auto Warranty Garrett', icon: '🖥️' },
      { type: 'dialer-info', title: 'Step 1 — Validate Your IP', icon: '🌐', dialerType: 'ip-validation',
        note: 'You must do this EVERY DAY before logging in. Without it, calls will not connect.' },
      { type: 'dialer-info', title: 'Step 2 — Login to the Dialer', icon: '🔐', dialerType: 'login',
        note: 'Use your assigned extension. Campaign: select openers2 or openers3 as instructed by your supervisor.' },
      { type: 'dialer-info', title: 'Step 3 — Go Active', icon: '📡', dialerType: 'go-active',
        note: 'Once logged in you will see YOU ARE PAUSED. Click "Go Active" to start receiving calls. Use TRANSFER-CONF when ready to transfer.' },
      { type: 'bullets', title: 'Before Every Call — Checklist', icon: '✅',
        items: ['IP validated for today','Headset connected and working','Lead form open (WEB FORM or WEB FORM 2)','Script visible and ready','Quiet environment — no background noise','Status set to Active (not paused)'] },
      { type: 'dialer-info', title: 'How to Transfer — English', icon: '🇺🇸', dialerType: 'transfer-en',
        note: 'Always wait for the SA to speak first before introducing the customer. Stay on the 3-way call for at least 15 seconds.' },
      { type: 'dialer-info', title: 'How to Transfer — Spanish', icon: '🇪🇸', dialerType: 'transfer-es',
        note: 'Select BlindSpanishXfer from the dropdown BEFORE clicking Dial with Customer. Everything else is the same as English transfer.' },
      { type: 'dialer-info', title: 'How to Read the Lead Form', icon: '📋', dialerType: 'form-reading',
        note: 'Only use the highlighted fields in the script. Never mention the address, finance company, or terms of loan to the customer.' },
      { type: 'dialer-info', title: 'Allowed Dispositions', icon: '📊', dialerType: 'dispositions',
        note: 'Only use the starred (⭐) dispositions. Using incorrect dispositions affects reporting and can flag your account.' },
      { type: 'steps', title: 'Pause Codes', icon: '⏸️',
        steps: ['Break — only when taking your scheduled 10-min break', 'CB (Callbacks) — when making a callback to a potential customer', 'Lunch — only when taking your 1-hour lunch', 'Manage — only when supervisors request you call them', 'RR (Restroom) — max 5 minutes', 'Tech — only when system is not working properly'] },
      { type: 'cover', title: 'You\'re Ready to Dial!', sub: 'Stay focused · Follow the script · Transfer clean', icon: '📞' },
    ]
  },
  {
    id: 'objections',
    icon: '🛡️',
    title: 'Objections Deep Dive',
    desc: 'All objections with multiple enhanced rebuttals from training',
    color: '#22c55e',
    slides: [
      { type: 'cover', title: 'Objections Deep Dive', sub: 'Enhanced Responses · Auto Warranty Garrett', icon: '🛡️' },
      { type: 'objection-multi', emoji: '🚫', title: '"I\'m not interested."', goal: 'Keep them on the line & create curiosity',
        tactic: 'Opening tactic: "Really quick, just so I understand — why wouldn\'t you be interested?" — After you have an answer, YOU HAVE SOMETHING TO WORK ON!',
        rebuttals: [
          '"I completely understand. A lot of people felt the same way at first — until they saw how much a single repair could cost without coverage. That\'s exactly why we do not charge for the quote. Fair enough?"',
          '"This isn\'t a sales pitch — just a quick chance to hear your options. You\'ve got absolutely nothing to lose. I\'ll connect you now so you don\'t miss out, okay?"',
          '"Imagine this — your vehicle breaks down next month, and you could\'ve had full coverage. Wouldn\'t it be smart to hear what\'s available before saying no?"',
          '"Do you plan on keeping the vehicle for a while? That\'s the perfect reason to at least check what you\'re eligible for — it gets more expensive the longer you wait."',
        ] },
      { type: 'objection-multi', emoji: '❓', title: '"I don\'t have any service with you."', goal: 'Clarify purpose and shift into value mode',
        rebuttals: [
          '"Exactly, and that\'s why we\'re reaching out today — this is your opportunity to activate full protection with zero money down. If you give me one second, I\'ll introduce you to the coverage expert."',
          '"That makes sense, and today\'s call is to give you access to coverage options before anything happens. Would you be open to a quick explanation from a licensed advisor?"',
        ] },
      { type: 'objection-multi', emoji: '📋', title: '"Where did you get my information?"', goal: 'Normalize the contact & build trust',
        rebuttals: [
          '"We partner with dealerships and vehicle registries nationwide, and your vehicle info is part of our outreach for protection eligibility."',
          '"Your info came from your vehicle registration. When it was listed as financed, we were alerted that it may qualify for extended coverage."',
          '"We\'re a licensed protection provider with access to public vehicle registration databases. We use that to help people protect their investment before big repairs hit."',
        ] },
      { type: 'objection-multi', emoji: '🚗', title: '"What kind of vehicle?"', goal: 'Build trust, show limitations, shift to SA',
        tactic: '⚠️ Before transferring any call, you MUST confirm the vehicle is in good running condition.',
        rebuttals: [
          '"I only see the finance info here — no specific make or model. That\'s why I need to get you over to the manager who has the full picture. Let me verify — is the vehicle in good running condition?"',
          '"My system only shows your monthly payment and finance status — I don\'t have the vehicle details. (proceed to validate the finance information)"',
          '"Think of me as the receptionist — I\'m just confirming everything\'s up to date before you speak with the person who\'ll break down the coverage for you."',
        ] },
      { type: 'objection-multi', emoji: '📞', title: '"Who is this?"', goal: 'Clarify & validate',
        tactic: 'First rebuttal is ALWAYS: "from the Vehicle Service Department" — Do NOT give the company name right away.',
        rebuttals: [
          '"You\'re speaking with the service department, we handle policies for warranties on vehicles nationwide."',
          '"We specialize in vehicle protection plans accepted by dealerships and repair shops across the country. I\'m just here to help introduce you to your activation manager."',
          'Only if they keep insisting: "We\'re calling on behalf of the Vehicle Service Center."',
        ] },
      { type: 'objection-multi', emoji: '🌎', title: '"Where are you located?"', goal: 'Build credibility',
        rebuttals: [
          '"Our headquarters are based in Dallas, Texas — but our protection plans are accepted at any licensed repair facility across the U.S."',
          '"We\'re based in Texas but work nationwide. Wherever you are, your vehicle is covered coast to coast."',
        ] },
      { type: 'objection-multi', emoji: '💲', title: '"How much does it cost?"', goal: 'Tease value & move toward transfer',
        rebuttals: [
          '"That\'s the great part — cost depends on your mileage and driving habits, but it\'s usually less than the cost of a single major repair. I\'ll get you to the activation manager to break it all down."',
          '"That\'s why I\'m connecting you — costs vary by car, but our plans are low cost. Let\'s find out exactly what you qualify for..."',
          '"I don\'t handle pricing myself — I\'m here to confirm your car is still in good condition so the activation manager can customize the options for you."',
        ] },
      { type: 'objection-multi', emoji: '🛡️', title: '"I already have insurance."', goal: 'Differentiate coverage type clearly',
        rebuttals: [
          '"Totally get that — and that\'s actually why we\'re calling. Insurance covers accidents. What we offer is mechanical breakdown coverage — engine, transmission, and more."',
          '"Insurance won\'t cover when your car just stops working due to wear and tear. Our coverage kicks in when your check engine light comes on — not after a crash."',
          '"Insurance is for accidents, but most car issues aren\'t caused by accidents — they\'re mechanical. This plan fills that gap so you\'re not stuck paying out-of-pocket."',
        ] },
      { type: 'objection-multi', emoji: '🕒', title: '"I\'m busy."', goal: 'Avoid dead air, keep them engaged',
        rebuttals: [
          '"Totally respect that — this will take a few minutes. If it\'s a bad time, I can schedule a callback. Would later today or tomorrow be easier?"',
          '"Quick heads-up — we\'re offering options that are only valid for a limited time. If you\'ve got just a few minutes now, we can secure your quote."',
        ] },
      { type: 'objection-multi', emoji: '📣', title: 'Purpose of the Call', goal: 'Clarify purpose and move toward transfer',
        rebuttals: [
          '"This call is simply an opportunity to extend the warranty on your vehicle before any issues come up. Think of it as an extra layer of protection against unexpected breakdowns. Sounds good? Just stay on the line."',
          '"My role is to confirm your vehicle still qualifies for extended warranty coverage — no warning lights, no current issues — and then get you over to the activation manager. It only takes a few minutes."',
          '"We\'re reaching out to give you the chance to extend your vehicle\'s warranty while it still qualifies. Major repairs can be expensive, and this coverage helps you avoid those surprise costs."',
        ] },
      { type: 'cover', title: 'Handle Every Objection with Confidence', sub: 'Know your rebuttals · Stay on script · Transfer clean', icon: '💪' },
    ]
  },
  {
    id: 'roleplays',
    icon: '🎭',
    title: 'Roleplay Scenarios',
    desc: 'Practice scenarios: wrong person, totaled, busy, non-qualifying, and more',
    color: '#a855f7',
    slides: [
      { type: 'cover', title: 'Roleplay Scenarios', sub: 'Practice Makes Perfect · Kampaign Kings', icon: '🎭' },
      { type: 'bullets', title: 'How Roleplays Work', icon: '📋',
        items: ['Trainer plays the customer — agent uses the real script','Start every call with the full introduction, no shortcuts','Handle each objection using the approved rebuttals','After each roleplay: trainer gives feedback on tone, speed, and accuracy','Goal: delivery becomes natural and automatic before going live'] },
      { type: 'roleplay', scenario: 'Wrong Person', emoji: '👤', difficulty: 'Easy',
        setup: 'Customer says: "I\'m not the person you\'re looking for" or "You have the wrong number."',
        guide: ['Apologize briefly and professionally', 'Ask if the person who financed the vehicle is available', 'If not: use WRGNUM disposition and end the call politely', 'Never argue or push — just confirm and move on'],
        example: '"I apologize for the confusion. Is [name from form] available? No? Okay, I\'ll update our records. Thank you for your time, have a great day!"' },
      { type: 'roleplay', scenario: 'Totaled / Sold Vehicle', emoji: '🚫', difficulty: 'Easy',
        setup: 'Customer says: "That car was totaled in an accident" or "I already sold that vehicle."',
        guide: ['Do NOT push coverage for a vehicle they no longer have', 'Thank them, confirm the vehicle status', 'Use WRGVEH disposition', 'End professionally — they may have another vehicle to discuss'],
        example: '"I understand completely, thank you for letting me know. I\'ll update your file right away. Have a wonderful day!"' },
      { type: 'roleplay', scenario: 'Busy Customer', emoji: '🕒', difficulty: 'Medium',
        setup: 'Customer says they\'re driving, at work, or in the middle of something.',
        guide: ['Do NOT just hang up or disposition as NI', 'Offer a specific callback time', 'Get a commitment before ending the call', 'Log as CALLBK with the time they gave you'],
        example: '"Totally respect that — this will only take a couple minutes. If now truly isn\'t good, when would be better — later today around [time] or tomorrow morning?"' },
      { type: 'roleplay', scenario: 'Non-Qualifying Vehicle', emoji: '🚗', difficulty: 'Medium',
        setup: 'Customer\'s vehicle is: electric, pre-2011, over 175k miles, a motorcycle, or a trailer.',
        guide: ['Do NOT transfer non-qualifying vehicles', 'Be honest but professional — "Our current program doesn\'t cover that vehicle type"', 'Use WRGVEH disposition', 'Never try to push a transfer on a vehicle you know won\'t qualify'],
        example: '"I appreciate your time — unfortunately, our current program is designed specifically for vehicles from 2011 or newer with standard engines. I\'ll update your file. Have a great day!"' },
      { type: 'roleplay', scenario: 'Language Barrier', emoji: '🌐', difficulty: 'Medium',
        setup: 'Customer clearly does not speak English, or you cannot communicate with them.',
        guide: ['If they speak Spanish: use Spanish script immediately', 'If it\'s a different language: use LANG disposition', 'Never guess or assume — if you cannot communicate clearly, disposition correctly', 'For Spanish speakers: use SPXFER to route to Spanish-speaking SA'],
        example: 'Spanish: "Hola, buenos días, ¿habla español? Perfecto, le llamo de Grupo de Servicios Vehiculares..." — then continue with Spanish script.' },
      { type: 'roleplay', scenario: 'Stroker (Price Seeker)', emoji: '💬', difficulty: 'Hard',
        setup: 'Customer keeps asking for exact prices, details, or trying to get information without agreeing to transfer.',
        guide: ['Never give exact prices — that\'s the SA\'s job', 'Use "it depends on your mileage and driving habits" every time', 'Redirect to the SA after 2 price questions max', 'If they refuse transfer after 3 attempts: disposition NI'],
        example: '"I completely understand you want to know the cost — and that\'s exactly why I\'m getting you over to the advisor. They\'ll have the exact numbers for YOUR specific vehicle and situation. Give me one second..."' },
      { type: 'roleplay', scenario: 'Co-signer / Not Decision Maker', emoji: '👥', difficulty: 'Hard',
        setup: 'The person who answers is not the one who financed the vehicle (spouse, family member, etc.).',
        guide: ['Ask politely if the account holder is available', 'If they are: ask them to put the account holder on', 'If not: offer to call back and get a specific time', 'If the co-signer wants to hear the info: you may proceed — they can relay to the account holder'],
        example: '"I see — is [name] available to speak? No? Could I call back at a better time? When would be best to reach them?"' },
      { type: 'bullets', title: 'Roleplay Success Tips', icon: '🏆',
        items: ['Energy and tone matter more than perfect words — practice both','Record yourself doing roleplays and listen back','Focus on the transfer: that\'s the only goal of the call','If you forget the script mid-call: pause briefly, breathe, continue — don\'t improvise','After every training roleplay: ask for specific feedback, not just "good job"'] },
      { type: 'cover', title: 'Practice Until It\'s Natural', sub: 'Every roleplay makes you better · Kampaign Kings', icon: '🎯' },
    ]
  },
]

// ─────────────────────────────────────────────
//  SLIDE RENDERER
// ─────────────────────────────────────────────
function renderSlide(slide) {
  switch (slide.type) {
    case 'cover':
      return (
        <div className="gpr-slide-cover">
          <div className="gpr-cover-icon">{slide.icon}</div>
          <h1 className="gpr-cover-title">{slide.title}</h1>
          <p className="gpr-cover-sub">{slide.sub}</p>
        </div>
      )
    case 'bullets':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.icon} {slide.title}</h2>
          <ul className="gpr-bullets">
            {slide.items.map((item, i) => (
              <li key={i} className={`gpr-bullet ${slide.danger ? 'danger' : ''}`}>
                <span className="gpr-bullet-dot" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )
    case 'four-box':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.title}</h2>
          <div className="gpr-four-box">
            {slide.boxes.map((b, i) => (
              <div key={i} className="gpr-box" style={{ background: b.color }}>
                <span className="gpr-box-num">{i + 1}</span>
                <span className="gpr-box-label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'script-en':
      return (
        <div className="gpr-slide-content gpr-script">
          <h2 className="gpr-slide-title">🇺🇸 English Script</h2>
          <div className="gpr-script-steps">
            {[
              { label: 'INTRO', text: "Hi, [client's name] this is [your name] with the Vehicle Services Group. We're calling about the vehicle you financed on [month, year] with a monthly payment of [payment amount]." },
              { label: 'PURPOSE', text: "Our records indicate you haven't activated your vehicle's extended warranty yet." },
              { label: 'VEHICLE CHECK', text: "I just need to verify — is your vehicle still in good running condition?" },
              { label: 'RESPONSE', text: "Perfect!", type: 'bridge' },
              { label: 'TRANSFER SETUP', text: "I would just need to get you on with a Service Advisor to explain the details of your qualifications and review what it will cover — give me one second and I will introduce you. Okay?" },
              { label: '⚠️ WAIT FOR APPROVAL', text: "Wait for customer approval before transferring.", type: 'action' },
              { label: 'SA INTRO', text: "Hello Service Advisor, I have [client's name] on the line — can you please assist?" },
              { label: '⏱️ 15-SECOND RULE', text: "Stay on the 3-way call for at least 15 seconds — confirm SA and customer are talking before you disconnect.", type: 'action' },
            ].map((s, i) => (
              <div key={i} className={`gpr-script-line type-${s.type || 'line'}`}>
                <span className="gpr-script-label">{s.label}</span>
                <span className="gpr-script-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'script-es':
      return (
        <div className="gpr-slide-content gpr-script">
          <h2 className="gpr-slide-title">🇪🇸 Script en Español</h2>
          <div className="gpr-script-steps">
            {[
              { label: 'INTRO', text: "Hola, [nombre del cliente], le habla [tu nombre] de Grupo de Servicios Vehiculares. Le llamamos con respecto al vehículo que usted financió en [mes, año], con un pago mensual de [monto del pago]." },
              { label: 'PROPÓSITO', text: "Nuestros registros indican que aún no ha activado la garantía extendida de su vehículo." },
              { label: 'VERIFICACIÓN', text: "Solo necesito verificar: ¿Su vehículo se encuentra actualmente en buenas condiciones de funcionamiento?" },
              { label: 'RESPUESTA', text: "¡Perfecto!", type: 'bridge' },
              { label: 'TRANSFERENCIA', text: "Lo voy a comunicar con un Asesor de Servicio para que le explique los detalles de su calificación. Deme un segundo y se lo presento. ¿Okay?" },
              { label: '⚠️ ESPERA APROBACIÓN', text: "Espera primero por aprobación del cliente para transferir.", type: 'action' },
              { label: 'INTRO AL ASESOR', text: "Hola, Asesor de Servicio, tengo a [nombre del cliente] en la línea. ¿Podría asistir, por favor?" },
              { label: '⏱️ REGLA 15 SEGUNDOS', text: "Quédate en la llamada al menos 15 segundos después de que el SA se une — confirma que el traspaso fue limpio.", type: 'action' },
            ].map((s, i) => (
              <div key={i} className={`gpr-script-line type-${s.type || 'line'}`}>
                <span className="gpr-script-label">{s.label}</span>
                <span className="gpr-script-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'comparison':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.icon} {slide.title}</h2>
          <div className="gpr-comparison">
            {slide.cols.map((col, i) => (
              <div key={i} className="gpr-comp-col">
                <div className="gpr-comp-title" style={{ color: col.color, borderColor: col.color }}>{col.name}</div>
                <ul>{col.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )
    case 'donts':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.icon} {slide.title}</h2>
          <div className="gpr-donts">
            {slide.items.map((item, i) => (
              <div key={i} className="gpr-dont">
                <span className="gpr-dont-num">{i + 1}</span>
                <div><div className="gpr-dont-rule">{item.rule}</div><div className="gpr-dont-detail">{item.detail}</div></div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'steps':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.icon} {slide.title}</h2>
          <div className="gpr-steps">
            {slide.steps.map((step, i) => (
              <div key={i} className="gpr-step">
                <span className="gpr-step-num">{i + 1}</span>
                <span className="gpr-step-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'objection':
      return (
        <div className="gpr-slide-content gpr-obj">
          <div className="gpr-obj-emoji">{slide.emoji}</div>
          <h2 className="gpr-obj-title">"{slide.title}"</h2>
          <div className="gpr-obj-goal">Goal: {slide.goal}</div>
          <div className="gpr-obj-rebuttal">{slide.rebuttal}</div>
        </div>
      )
    case 'objection-multi':
      return (
        <div className="gpr-slide-content">
          <div className="gpr-obj-header-row">
            <span className="gpr-obj-emoji-sm">{slide.emoji}</span>
            <h2 className="gpr-obj-title-sm">{slide.title}</h2>
            <span className="gpr-obj-goal-sm">{slide.goal}</span>
          </div>
          {slide.tactic && <div className="gpr-obj-tactic">💡 {slide.tactic}</div>}
          <div className="gpr-rebuttals">
            {slide.rebuttals.map((r, i) => (
              <div key={i} className="gpr-rebuttal-item">
                <span className="gpr-rebuttal-num">{i + 1}</span>
                <span className="gpr-rebuttal-text">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'roleplay':
      return (
        <div className="gpr-slide-content">
          <div className="gpr-rp-header">
            <span className="gpr-rp-emoji">{slide.emoji}</span>
            <div>
              <h2 className="gpr-rp-title">{slide.scenario}</h2>
              <span className={`gpr-rp-difficulty diff-${slide.difficulty.toLowerCase()}`}>{slide.difficulty}</span>
            </div>
          </div>
          <div className="gpr-rp-setup">{slide.setup}</div>
          <div className="gpr-rp-guide">
            {slide.guide.map((g, i) => (
              <div key={i} className="gpr-rp-guide-item">
                <span className="gpr-rp-bullet">→</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
          {slide.example && <div className="gpr-rp-example"><span className="gpr-rp-ex-label">Example:</span> {slide.example}</div>}
        </div>
      )
    case 'dialer-info':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.icon} {slide.title}</h2>
          <DialerMock type={slide.dialerType} />
          {slide.note && <div className="gpr-dialer-note">📌 {slide.note}</div>}
        </div>
      )
    default:
      return null
  }
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function GoPresent() {
  const navigate = useNavigate()
  const [deckId, setDeckId] = useState(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const deck = DECKS.find(d => d.id === deckId)
  const slides = deck?.slides || []
  const slide = slides[slideIdx]

  const prev = () => setSlideIdx(i => Math.max(0, i - 1))
  const next = () => setSlideIdx(i => Math.min(slides.length - 1, i + 1))

  const openDeck = (id) => { setDeckId(id); setSlideIdx(0); setFullscreen(false) }
  const closeDeck = () => { setDeckId(null); setSlideIdx(0); setFullscreen(false) }

  // ── DECK SELECTOR ──
  if (!deckId) return (
    <div className="gpr-page">
      <nav className="gpr-nav">
        <div className="gpr-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gpr-nav-text">Pulse</span>
          <span className="gpr-nav-badge">GO</span>
        </div>
        <div className="gpr-nav-meta" />
        <button className="gpr-nav-back" onClick={() => navigate('/go')}>← Back</button>
      </nav>

      <div className="gpr-deck-hero">
        <h1 className="gpr-deck-title">📊 Choose a Presentation</h1>
        <p className="gpr-deck-sub">Select a training deck to present to your team</p>
      </div>

      <div className="gpr-deck-grid">
        {DECKS.map(d => (
          <button
            key={d.id}
            className="gpr-deck-card"
            style={{ '--deck-color': d.color }}
            onClick={() => openDeck(d.id)}
          >
            <span className="gpr-deck-icon">{d.icon}</span>
            <span className="gpr-deck-name">{d.title}</span>
            <span className="gpr-deck-desc">{d.desc}</span>
            <span className="gpr-deck-count">{DECKS.find(x => x.id === d.id)?.slides.length} slides →</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── SLIDE VIEWER ──
  return (
    <div className={`gpr-page ${fullscreen ? 'fullscreen' : ''}`} onKeyDown={e => { if(e.key==='ArrowRight'||e.key===' ')next(); if(e.key==='ArrowLeft')prev(); if(e.key==='Escape')setFullscreen(false) }} tabIndex={0}>
      <nav className="gpr-nav">
        <div className="gpr-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gpr-nav-text">Pulse</span>
          <span className="gpr-nav-badge">GO</span>
        </div>
        <div className="gpr-nav-meta">
          <span className="gpr-nav-deck-name">{deck.icon} {deck.title}</span>
          <span className="gpr-nav-counter">{slideIdx + 1} / {slides.length}</span>
        </div>
        <div className="gpr-nav-actions">
          <button className="gpr-btn-icon" onClick={() => setFullscreen(f => !f)} title="Fullscreen">{fullscreen ? '⊡' : '⛶'}</button>
          <button className="gpr-nav-back" onClick={closeDeck}>← Decks</button>
        </div>
      </nav>

      {!fullscreen && (
        <div className="gpr-sidebar">
          {slides.map((s, i) => (
            <div key={i} className={`gpr-thumb ${i === slideIdx ? 'active' : ''}`} onClick={() => setSlideIdx(i)}>
              <span className="gpr-thumb-num">{i + 1}</span>
              <span className="gpr-thumb-title">{(s.title || s.scenario || s.type)?.slice(0, 22)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="gpr-main">
        <div className="gpr-slide">{renderSlide(slide)}</div>
        <div className="gpr-controls">
          <button className="gpr-ctrl-btn" onClick={prev} disabled={slideIdx === 0}>← Prev</button>
          <div className="gpr-progress-bar"><div className="gpr-progress-fill" style={{ width: `${((slideIdx + 1) / slides.length) * 100}%` }} /></div>
          <button className="gpr-ctrl-btn primary" onClick={next} disabled={slideIdx === slides.length - 1}>Next →</button>
        </div>
      </div>
    </div>
  )
}