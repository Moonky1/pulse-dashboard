import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoPresent.css'

// ─────────────────────────────────────────────
//  TRAINING IMAGE COMPONENT
// ─────────────────────────────────────────────
function TImg({ src, alt, caption }) {
  return (
    <div className="gpr-timg-wrap">
      <img
        src={`/training/${src}`}
        alt={alt}
        className="gpr-timg"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
      <div className="gpr-timg-fallback">
        <span>📷 {alt}</span>
        <small>/training/{src}</small>
      </div>
      {caption && <div className="gpr-timg-caption">{caption}</div>}
    </div>
  )
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
        items: ['Deliver the official script word-for-word', 'Verify vehicle eligibility correctly', 'Handle objections professionally', 'Execute clean, compliant transfers', 'Use the dialer and dispositions properly'] },
      { type: 'four-box', title: 'Script Mastery — 4 Steps',
        boxes: [{ label: 'Introduction & Financing Info', color: '#f97316' }, { label: 'Vehicle Condition Verification', color: '#ea580c' }, { label: 'Setting Expectations', color: '#c2410c' }, { label: 'Professional Transfer', color: '#9a3412' }] },
      { type: 'script-en' },
      { type: 'script-es' },
      { type: 'comparison', title: 'Extended Warranty vs. Others', icon: '📦',
        cols: [
          { name: 'Factory Warranty', color: '#b45309', points: ['Comes with NEW vehicles', 'Lasts 3 years or 36,000 miles', 'Covers manufacturer defects', 'Expires — cannot be renewed'] },
          { name: 'Extended Coverage', color: '#f97316', points: ['NOT mandatory', 'Pays for mechanical repairs AFTER factory warranty', 'Optional — you choose the plan', "That's what WE offer"] },
          { name: 'Insurance', color: '#92400e', points: ['MANDATORY in the US to drive', 'Covers accidents, damage, theft', 'Does NOT cover mechanical breakdowns', 'Completely different product'] },
        ] },
      { type: 'bullets', title: 'What We CANNOT Cover', icon: '🚫', danger: true,
        items: ['Electric vehicles', 'Vehicles manufactured before 2011', 'More than 175,000 miles', 'Pre-existing issues (vehicle must run)', 'Damage from collisions or accidents', 'Bodywork, cosmetic repairs, light bulbs', 'Wear and tear items', 'Motorcycles, trailers, Lamborghinis'] },
      { type: 'donts', title: 'What NOT to Say', icon: '⛔',
        items: [{ rule: "Don't say we work for car brands", detail: 'We are Vehicle Services Group — independent.' }, { rule: "Don't say we're extending factory warranty", detail: 'We offer extended coverage — a separate product.' }, { rule: 'Never say "FREE"', detail: 'This is misleading and non-compliant.' }, { rule: "Don't say we got info from the bank", detail: 'Say: "We partner with dealerships and vehicle registries."' }] },
      { type: 'steps', title: 'Transfer Protocol', icon: '🔄',
        steps: ['Confirm vehicle qualification (is it running?)', 'Get customer approval to transfer', 'Initiate transfer — stay on the line', 'Wait for Service Advisor to pick up and speak first', 'Introduce client: "Hello SA, I have [name] on the line"', '⏱️ Stay 15 seconds after SA joins — confirm handoff before leaving'] },
      { type: 'objection', emoji: '🚫', title: 'Not Interested', goal: 'Keep them on the line & create curiosity', rebuttal: '"I completely understand. A lot of people felt the same way — until they saw how much a single repair could cost. That\'s why we don\'t charge for the quote. Fair enough?"' },
      { type: 'objection', emoji: '🛡️', title: 'I already have insurance', goal: 'Differentiate coverage type clearly', rebuttal: '"Totally get that — and that\'s actually why we\'re calling. Insurance covers accidents. What we offer is mechanical breakdown coverage — engine, transmission, and more."' },
      { type: 'objection', emoji: '💲', title: 'How much does it cost?', goal: 'Tease value & move toward transfer', rebuttal: '"Cost depends on your mileage and driving habits, but it\'s usually less than a single major repair. I\'ll get you to the Service Advisor to break it all down."' },
      { type: 'cover', title: 'Start Dialing! 📞', sub: 'Kampaign Kings · Auto Warranty Garrett', icon: '🚀' },
    ],
  },
  {
    id: 'dialer',
    icon: '🖥️',
    title: 'Dialer Guide',
    desc: 'IP validation, login, go active, how to transfer EN/ES, form reading, dispositions',
    color: '#3b82f6',
    slides: [
      { type: 'cover', title: 'Dialer Guide', sub: 'VICIdial · Auto Warranty Garrett', icon: '🖥️' },
      {
        type: 'dialer-img', title: 'Step 0 — Validate Your IP', icon: '🌐',
        note: '⚠️ Do this EVERY DAY before logging in. URL: https://alwaysbeclosing.ai:444/abc_validation.php — User: 9996 or 9995 — Password: validateme365',
        images: [{ src: 'vici-ip-validation.png', alt: 'VICIbox Agent Validation', caption: 'Submit and confirm your IP appears as validated' }],
      },
      {
        type: 'dialer-img', title: 'Steps 1-2-3 — Login', icon: '🔐',
        note: 'Follow these 3 steps in order. Use your assigned extension. Select openers2 or openers3 as your supervisor indicates.',
        layout: 'row',
        images: [
          { src: 'vici-welcome.png', alt: 'Welcome Screen', caption: 'Step 1: Click Agent Login' },
          { src: 'vici-phone-login.png', alt: 'Phone Login', caption: 'Step 2: Enter your extension' },
          { src: 'vici-campaign-login.png', alt: 'Campaign Login', caption: 'Step 3: Select your campaign' },
        ],
      },
      {
        type: 'dialer-img', title: 'Go Active — Main Screen', icon: '📡',
        note: 'You start as PAUSED. To transfer a call, find TRANSFER - CONF on the left panel.',
        images: [{ src: 'vici-go-active.png', alt: 'Dialer Main Screen - YOU ARE PAUSED', caption: 'Main dialer screen. TRANSFER - CONF button is on the left.' }],
      },
      {
        type: 'dialer-img', title: 'Pause Codes', icon: '⏸️',
        note: 'Always use the correct pause code. Break = 10min max | RR = 5min max | Lunch = 1hr | Manage = only when supervisor requests.',
        images: [{ src: 'vici-pause-codes.png', alt: 'Pause Codes Screen', caption: 'Select the correct pause code for every break' }],
      },
      {
        type: 'dialer-img', title: 'How to Transfer — English 🇺🇸', icon: '🔄',
        note: 'Wait for SA to pick up and speak FIRST before introducing the customer. Stay on the 3-way call for at least 15 seconds.',
        images: [
          { src: 'vici-live-call.png', alt: 'Live Call Screen', caption: '1. Click TRANSFER - CONF on the left panel' },
          { src: 'vici-transfer-functions.png', alt: 'Transfer Functions', caption: '2. DIAL WITH CUSTOMER → SA speaks first → 3. LEAVE 3-WAY CALL (after 15 seconds)' },
        ],
      },
      {
        type: 'dialer-img', title: 'How to Transfer — Spanish 🇪🇸', icon: '🔄',
        note: 'Select BlindSpanishXfer from the dropdown BEFORE clicking Dial with Customer.',
        images: [
          { src: 'vici-live-call.png', alt: 'Live Call - Spanish', caption: '1. Click TRANSFER - CONF' },
          { src: 'vici-transfer-functions.png', alt: 'Spanish Transfer Functions', caption: '2. Select BlindSpanishXfer → DIAL WITH CUSTOMER → wait for SA → LEAVE 3-WAY CALL' },
        ],
      },
      {
        type: 'dialer-img', title: 'How to Read the Lead Form', icon: '📋',
        note: 'Only use the highlighted fields. Never mention the address, finance company name, or terms of loan to the customer.',
        images: [{ src: 'vici-lead-form.png', alt: 'Lead Form', caption: '✓ USE: Name, Origination Date, Loan Balance — ✗ SKIP everything else' }],
      },
      {
        type: 'dialer-img', title: 'Dispositions', icon: '📊',
        note: 'Use ONLY the listed dispositions. XFER = successful transfer | NI = not interested | CALLBK = call back | SPXFER = Spanish transfer',
        images: [{ src: 'vici-dispositions.png', alt: 'Call Dispositions', caption: 'Only use these options — no others' }],
      },
      { type: 'cover', title: "You're Ready to Dial!", sub: 'Stay focused · Follow the script · Transfer clean', icon: '📞' },
    ],
  },
  {
    id: 'objections',
    icon: '🛡️',
    title: 'Objections Deep Dive',
    desc: 'All objections with multiple enhanced rebuttals',
    color: '#22c55e',
    slides: [
      { type: 'cover', title: 'Objections Deep Dive', sub: 'Enhanced Responses · Auto Warranty Garrett', icon: '🛡️' },
      { type: 'objection-multi', emoji: '🚫', title: '"I\'m not interested."', goal: 'Keep them on the line & create curiosity',
        tactic: 'Opening tactic: "Really quick, just so I understand — why wouldn\'t you be interested?" — Once you have the answer, you have something to work on!',
        rebuttals: [
          '"I completely understand. A lot of people felt the same way — until they saw how much a single repair could cost. We don\'t charge for the quote. Fair enough?"',
          '"This isn\'t a sales pitch — just a quick chance to hear your options. Nothing to lose, a lot to potentially save. I\'ll connect you now, okay?"',
          '"Imagine your vehicle breaks down next month and you could\'ve had full coverage. Wouldn\'t it be smart to hear what\'s available before saying no?"',
          '"Do you plan on keeping the vehicle a while? That\'s the perfect reason to check what you\'re eligible for — it gets more expensive the longer you wait."',
        ] },
      { type: 'objection-multi', emoji: '❓', title: '"I don\'t have any service with you."', goal: 'Clarify purpose and shift into value mode',
        rebuttals: [
          '"Exactly, and that\'s why we\'re reaching out today — this is your opportunity to activate full protection with zero money down. Let me introduce you to the coverage expert."',
          '"That makes sense, and today\'s call is to give you access to coverage options before anything happens. Would you be open to a quick explanation from a licensed advisor?"',
        ] },
      { type: 'objection-multi', emoji: '📋', title: '"Where did you get my information?"', goal: 'Normalize the contact & build trust',
        rebuttals: [
          '"We partner with dealerships and vehicle registries nationwide, and your vehicle info is part of our outreach for protection eligibility."',
          '"Your info came from your vehicle registration. When it was listed as financed, we were alerted it may qualify for extended coverage."',
          '"We\'re a licensed protection provider with access to public vehicle registration databases. We use that to help people protect their investment before big repairs hit."',
        ] },
      { type: 'objection-multi', emoji: '🚗', title: '"What kind of vehicle?"', goal: 'Build trust, show limitations, shift to SA',
        tactic: '⚠️ You MUST confirm the vehicle is in good running condition before any transfer.',
        rebuttals: [
          '"I only see the finance info here — no make or model. That\'s why I need the manager who has the full picture. Is the vehicle in good running condition?"',
          '"My system only shows your finance status. I\'m here to confirm your car\'s condition before transferring you to the person who\'ll break down coverage."',
        ] },
      { type: 'objection-multi', emoji: '📞', title: '"Who is this?"', goal: 'Clarify & validate',
        tactic: 'First rebuttal is ALWAYS: "from the Vehicle Service Department." Do NOT give the company name right away.',
        rebuttals: [
          '"You\'re speaking with the service department, we handle policies for warranties on vehicles nationwide."',
          '"We specialize in vehicle protection plans accepted at dealerships and repair shops across the country."',
          'Only if they keep insisting: "We\'re calling on behalf of the Vehicle Service Center."',
        ] },
      { type: 'objection-multi', emoji: '💲', title: '"How much does it cost?"', goal: 'Tease value & move toward transfer',
        rebuttals: [
          '"Cost depends on your mileage and driving habits, but it\'s usually less than a single major repair. I\'ll get you to the activation manager to break it all down."',
          '"I don\'t handle pricing myself — I\'m here to confirm your car\'s condition so the activation manager can customize the options for you."',
        ] },
      { type: 'objection-multi', emoji: '🛡️', title: '"I already have insurance."', goal: 'Differentiate coverage type clearly',
        rebuttals: [
          '"Totally get that — and that\'s actually why we\'re calling. Insurance covers accidents. What we offer is mechanical breakdown coverage — engine, transmission, and more."',
          '"Insurance won\'t cover when your car just stops working due to wear and tear. Our coverage kicks in when your check engine light comes on — not after a crash."',
        ] },
      { type: 'objection-multi', emoji: '🕒', title: '"I\'m busy."', goal: 'Avoid dead air, keep them engaged',
        rebuttals: [
          '"Totally respect that — this will take a few minutes. If it\'s a bad time, I can schedule a callback. Would later today or tomorrow be easier?"',
          '"Quick heads-up — we\'re offering options that are only valid for a limited time. If you\'ve got just a few minutes now, we can secure your quote."',
        ] },
      { type: 'cover', title: 'Handle Every Objection with Confidence', sub: 'Know your rebuttals · Stay on script · Transfer clean', icon: '💪' },
    ],
  },
  {
    id: 'roleplays',
    icon: '🎭',
    title: 'Roleplay Scenarios',
    desc: 'Practice: wrong person, totaled, busy, non-qualifying, stroker & more',
    color: '#a855f7',
    slides: [
      { type: 'cover', title: 'Roleplay Scenarios', sub: 'Practice Makes Perfect · Kampaign Kings', icon: '🎭' },
      { type: 'bullets', title: 'How Roleplays Work', icon: '📋',
        items: ['Trainer plays the customer — agent uses the real script', 'Start every call with the full introduction, no shortcuts', 'Handle each objection using approved rebuttals', 'After each roleplay: trainer gives feedback on tone, speed, accuracy', 'Goal: delivery becomes natural and automatic before going live'] },
      { type: 'roleplay', scenario: 'Wrong Person', emoji: '👤', difficulty: 'Easy',
        setup: 'Customer says: "I\'m not the person you\'re looking for" or "You have the wrong number."',
        guide: ['Apologize briefly and professionally', 'Ask if the person who financed the vehicle is available', 'If not: use WRGNUM disposition and end the call politely', 'Never argue or push'],
        example: '"I apologize for the confusion. Is [name from form] available? No? Okay, I\'ll update our records. Have a great day!"' },
      { type: 'roleplay', scenario: 'Totaled / Sold Vehicle', emoji: '🚫', difficulty: 'Easy',
        setup: 'Customer says: "That car was totaled" or "I already sold that vehicle."',
        guide: ['Do NOT push coverage for a vehicle they no longer have', 'Thank them and confirm the vehicle status', 'Use WRGVEH disposition', 'End professionally — they may have another vehicle'],
        example: '"I understand completely, thank you for letting me know. I\'ll update your file right away. Have a wonderful day!"' },
      { type: 'roleplay', scenario: 'Busy Customer', emoji: '🕒', difficulty: 'Medium',
        setup: 'Customer says they\'re driving, at work, or in the middle of something.',
        guide: ['Do NOT disposition as NI', 'Offer a specific callback time', 'Get a commitment before ending the call', 'Log as CALLBK with the time they gave you'],
        example: '"Totally respect that — when would be better? Later today around [time] or tomorrow morning?"' },
      { type: 'roleplay', scenario: 'Non-Qualifying Vehicle', emoji: '🚗', difficulty: 'Medium',
        setup: 'Vehicle is electric, pre-2011, over 175k miles, a motorcycle, or trailer.',
        guide: ['Do NOT transfer non-qualifying vehicles', 'Be honest but professional', 'Use WRGVEH disposition', 'Never push a transfer on a vehicle you know won\'t qualify'],
        example: '"I appreciate your time — unfortunately our program is designed for 2011 or newer standard engine vehicles. I\'ll update your file. Have a great day!"' },
      { type: 'roleplay', scenario: 'Stroker (Price Seeker)', emoji: '💬', difficulty: 'Hard',
        setup: 'Customer keeps asking for exact prices or details without agreeing to transfer.',
        guide: ['Never give exact prices — that\'s the SA\'s job', 'Use "it depends on your mileage and driving habits" every time', 'Redirect to the SA after 2 price questions max', 'If they refuse transfer after 3 attempts: disposition NI'],
        example: '"I understand you want the cost — that\'s exactly why I\'m getting you to the advisor. They have the exact numbers for YOUR specific vehicle. Give me one second..."' },
      { type: 'roleplay', scenario: 'Co-signer / Not Decision Maker', emoji: '👥', difficulty: 'Hard',
        setup: 'Person who answers is not the one who financed (spouse, family member, etc.).',
        guide: ['Ask politely if the account holder is available', 'If yes: ask them to put the account holder on', 'If no: offer to call back and get a specific time', 'If co-signer wants to hear info: you may proceed'],
        example: '"I see — is [name] available? Could I call back at a better time? When would be best to reach them?"' },
      { type: 'bullets', title: 'Roleplay Success Tips', icon: '🏆',
        items: ['Energy and tone matter more than perfect words', 'Record yourself and listen back', 'Focus on the transfer — that\'s the only goal', 'If you forget mid-call: pause, breathe, continue — don\'t improvise', 'After every roleplay: ask for specific feedback'] },
      { type: 'cover', title: 'Practice Until It\'s Natural', sub: 'Every roleplay makes you better · Kampaign Kings', icon: '🎯' },
    ],
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
                <span className="gpr-bullet-dot" />{item}
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
              { label: 'INTRO', text: "Hi, [client's name] this is [your name] with the Vehicle Services Group. We're calling about the vehicle you financed on [month, year]." },
              { label: 'PURPOSE', text: "Our records indicate you haven't activated your vehicle's extended warranty yet." },
              { label: 'VEHICLE CHECK', text: "I just need to verify — is your vehicle still in good running condition?" },
              { label: 'RESPONSE', text: 'Perfect!', type: 'bridge' },
              { label: 'TRANSFER SETUP', text: "I would just need to get you on with a Service Advisor to explain the details of your qualifications and review what it will cover — give me one second and I will introduce you. Okay?" },
              { label: '⚠️ WAIT FOR APPROVAL', text: 'Wait for customer approval before transferring.', type: 'action' },
              { label: 'SA INTRO', text: "Hello Service Advisor, I have [client's name] on the line — can you please assist?" },
              { label: '⏱️ 15-SECOND RULE', text: 'Stay on the 3-way call for at least 15 seconds — confirm SA and customer are talking before you disconnect.', type: 'action' },
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
              { label: 'INTRO', text: "Hola, [nombre del cliente], le habla [tu nombre] de Grupo de Servicios Vehiculares. Le llamamos con respecto al vehículo que usted financió en [mes, año]." },
              { label: 'PROPÓSITO', text: "Nuestros registros indican que aún no ha activado la garantía extendida de su vehículo." },
              { label: 'VERIFICACIÓN', text: "Solo necesito verificar: ¿Su vehículo se encuentra actualmente en buenas condiciones de funcionamiento?" },
              { label: 'RESPUESTA', text: '¡Perfecto!', type: 'bridge' },
              { label: 'TRANSFERENCIA', text: "Lo voy a comunicar con un Asesor de Servicio para que le explique los detalles de su calificación. Deme un segundo y se lo presento. ¿Okay?" },
              { label: '⚠️ ESPERA APROBACIÓN', text: 'Espera primero por aprobación del cliente para transferir.', type: 'action' },
              { label: 'INTRO AL ASESOR', text: "Hola, Asesor de Servicio, tengo a [nombre del cliente] en la línea. ¿Podría asistir, por favor?" },
              { label: '⏱️ REGLA 15 SEGUNDOS', text: 'Permanece en la llamada al menos 15 segundos — confirma que el traspaso fue limpio.', type: 'action' },
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
              <span className={`gpr-rp-diff diff-${slide.difficulty.toLowerCase()}`}>{slide.difficulty}</span>
            </div>
          </div>
          <div className="gpr-rp-setup">{slide.setup}</div>
          <div className="gpr-rp-guide">
            {slide.guide.map((g, i) => (
              <div key={i} className="gpr-rp-guide-item">
                <span style={{ color: '#f97316', fontWeight: 700, flexShrink: 0 }}>→</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
          {slide.example && <div className="gpr-rp-example"><span style={{ fontWeight: 700, color: '#f97316', marginRight: 6 }}>Example:</span>{slide.example}</div>}
        </div>
      )
    case 'dialer-img':
      return (
        <div className="gpr-slide-content">
          <h2 className="gpr-slide-title">{slide.icon} {slide.title}</h2>
          {slide.note && <div className="gpr-dialer-note">{slide.note}</div>}
          {slide.layout === 'row' ? (
            <div className="gpr-imgs-row">
              {slide.images.map((img, i) => <TImg key={i} {...img} />)}
            </div>
          ) : (
            <div className="gpr-imgs-col">
              {slide.images.map((img, i) => <TImg key={i} {...img} />)}
            </div>
          )}
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
  const [deckId,   setDeckId]   = useState(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [full,     setFull]     = useState(false)

  const deck   = DECKS.find(d => d.id === deckId)
  const slides = deck?.slides || []
  const slide  = slides[slideIdx]

  const prev = () => setSlideIdx(i => Math.max(0, i - 1))
  const next = () => setSlideIdx(i => Math.min(slides.length - 1, i + 1))
  const open = (id) => { setDeckId(id); setSlideIdx(0); setFull(false) }
  const back = () => { setDeckId(null); setSlideIdx(0); setFull(false) }

  // ── DECK SELECTOR ──
  if (!deckId) return (
    <div className="gpr-page">
      <nav className="gpr-nav">
        <div className="gpr-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gpr-nav-text">Pulse</span>
          <span className="gpr-nav-badge">GO</span>
        </div>
        <div />
        <button className="gpr-nav-back" onClick={() => navigate('/go')}>← Back</button>
      </nav>
      <div className="gpr-deck-hero">
        <h1 className="gpr-deck-title">📊 Choose a Presentation</h1>
        <p className="gpr-deck-sub">Select a training deck to present to your team</p>
      </div>
      <div className="gpr-deck-grid">
        {DECKS.map(d => (
          <button key={d.id} className="gpr-deck-card" style={{ '--dc': d.color }} onClick={() => open(d.id)}>
            <span className="gpr-deck-icon">{d.icon}</span>
            <span className="gpr-deck-name">{d.title}</span>
            <span className="gpr-deck-desc">{d.desc}</span>
            <span className="gpr-deck-count">{d.slides.length} slides →</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ── SLIDE VIEWER ──
  return (
    <div
      className={`gpr-page ${full ? 'fullscreen' : ''}`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'ArrowRight' || e.key === ' ') next()
        if (e.key === 'ArrowLeft') prev()
        if (e.key === 'Escape') setFull(false)
      }}
    >
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
          <button className="gpr-btn-icon" onClick={() => setFull(f => !f)} title="Fullscreen">{full ? '⊡' : '⛶'}</button>
          <button className="gpr-nav-back" onClick={back}>← Decks</button>
        </div>
      </nav>

      {!full && (
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
          <div className="gpr-progress-bar">
            <div className="gpr-progress-fill" style={{ width: `${((slideIdx + 1) / slides.length) * 100}%` }} />
          </div>
          <button className="gpr-ctrl-btn primary" onClick={next} disabled={slideIdx === slides.length - 1}>Next →</button>
        </div>
      </div>
    </div>
  )
}