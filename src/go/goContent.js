// ─────────────────────────────────────────────
//  PULSE GO — Content Library
//  Edit this file to update any training content
// ─────────────────────────────────────────────

// ── SCRIPTS ──────────────────────────────────
export const scripts = {
  en: {
    id: 'script-en',
    title: 'English Script',
    flag: '🇺🇸',
    steps: [
      {
        id: 1,
        type: 'line',
        label: 'Introduction',
        text: "Hi, [client's name] this is [your name] with the Vehicle Services Group. We're calling about the vehicle you financed on [month, year].",
        tip: 'Say the client name clearly. State month and year from the form.',
      },
      {
        id: 2,
        type: 'line',
        label: 'Purpose',
        text: "Our records indicate you haven't activated your vehicle's extended warranty yet.",
        tip: 'Say this with confidence — it creates urgency.',
      },
      {
        id: 3,
        type: 'line',
        label: 'Vehicle Check',
        text: 'I just need to verify — is your vehicle still in good running condition?',
        tip: 'Wait for the answer. This confirms eligibility.',
      },
      {
        id: 4,
        type: 'bridge',
        label: 'Positive Response',
        text: 'Perfect!',
        tip: 'Respond positively and move immediately into the transfer line.',
      },
      {
        id: 5,
        type: 'line',
        label: 'Transfer Setup',
        text: "I would just need to get you on with a Service Advisor to explain the details of your qualifications and review what it will cover — give me one second and I will introduce you. Okay?",
        tip: null,
      },
      {
        id: 6,
        type: 'action',
        label: '⚠️ Wait for Approval',
        text: 'Wait for customer approval before transferring.',
        tip: 'Never transfer without a clear "okay" or "sure" from the customer.',
      },
      {
        id: 7,
        type: 'action',
        label: '⚠️ On Transfer',
        text: 'When transferring, wait for Service Advisor to pick up the call and speak first.',
        tip: null,
      },
      {
        id: 8,
        type: 'line',
        label: 'SA Introduction',
        text: "Hello Service Advisor, I have [client's name] on the line — can you please assist?",
        tip: 'Stay on the line until the SA confirms they have the customer.',
      },
      {
        id: 9,
        type: 'action',
        label: '⏱️ 15-Second Rule',
        text: 'After the SA joins, stay on the call for at least 15 seconds before disconnecting. Make sure the SA and customer are actively talking before you leave.',
        tip: 'Never hang up the moment the SA joins — confirm the handoff is clean.',
      },
    ],
  },
  es: {
    id: 'script-es',
    title: 'Script en Español',
    flag: '🇪🇸',
    steps: [
      {
        id: 1,
        type: 'line',
        label: 'Introducción',
        text: 'Hola, [nombre del cliente], le habla [tu nombre] de Grupo de Servicios Vehiculares. Le llamamos con respecto al vehículo que usted financió en [mes, año].',
        tip: 'Di el nombre del cliente claramente. Menciona el mes y año del formulario.',
      },
      {
        id: 2,
        type: 'line',
        label: 'Propósito',
        text: 'Nuestros registros indican que aún no ha activado la garantía extendida de su vehículo.',
        tip: 'Di esto con confianza — crea urgencia.',
      },
      {
        id: 3,
        type: 'line',
        label: 'Verificación del vehículo',
        text: 'Solo necesito verificar: ¿Su vehículo se encuentra actualmente en buenas condiciones de funcionamiento?',
        tip: 'Espera la respuesta. Esto confirma elegibilidad.',
      },
      {
        id: 4,
        type: 'bridge',
        label: 'Respuesta positiva',
        text: '¡Perfecto!',
        tip: 'Responde positivamente y pasa inmediatamente a la transferencia.',
      },
      {
        id: 5,
        type: 'line',
        label: 'Preparación de transferencia',
        text: 'Lo voy a comunicar con un Asesor de Servicio para que le explique los detalles de su calificación y revise qué es lo que cubriría. Deme un segundo y se lo presento. ¿Okay?',
        tip: null,
      },
      {
        id: 6,
        type: 'action',
        label: '⚠️ Espera aprobación',
        text: 'Espera primero por aprobación del cliente para transferir.',
        tip: 'Nunca transfieras sin un claro "sí" o "okay" del cliente.',
      },
      {
        id: 7,
        type: 'action',
        label: '⚠️ Al transferir',
        text: 'Al transferir, espera a que el Asesor de Servicio conteste y hable primero.',
        tip: null,
      },
      {
        id: 8,
        type: 'line',
        label: 'Introducción al Asesor',
        text: 'Hola, Asesor de Servicio, tengo a [nombre del cliente] en la línea. ¿Podría asistir, por favor?',
        tip: 'Quédate en la línea hasta que el SA confirme que tiene al cliente.',
      },
      {
        id: 9,
        type: 'action',
        label: '⏱️ Regla de 15 segundos',
        text: 'Después de que el Asesor se une, permanece en la llamada al menos 15 segundos antes de desconectarte. Asegúrate de que el SA y el cliente estén hablando activamente antes de salir.',
        tip: 'Nunca cuelgues en el momento en que el SA se une — confirma que el traspaso fue limpio.',
      },
    ],
  },
};

// ── OBJECTIONS ────────────────────────────────
export const objections = [
  {
    id: 'not-interested',
    emoji: '🚫',
    title: 'Not Interested',
    titleEs: 'No me interesa',
    goal: 'Keep them on the line & create curiosity',
    rebuttalEn:
      "I completely understand. A lot of people felt the same way at first — until they saw how much a single repair could cost without coverage. That's exactly why we do not charge for the quote with the Service Advisor — just to help you make an informed decision. Fair enough?",
    rebuttalEs:
      'Entiendo perfectamente. Mucha gente pensaba lo mismo al principio — hasta que vio cuánto puede costar una sola reparación sin cobertura. Por eso no cobramos nada por la consulta con el Asesor de Servicio. ¿Le parece bien?',
  },
  {
    id: 'no-service',
    emoji: '❓',
    title: "I don't have any service with you",
    titleEs: 'No tengo ningún servicio con ustedes',
    goal: 'Clarify purpose and shift into value mode',
    rebuttalEn:
      "Exactly, and that's why we're reaching out today — this is your opportunity to activate a full protection plan for your vehicle. If you give me one second, I'll introduce you to the Service Advisor who can go over the details.",
    rebuttalEs:
      'Exactamente, y por eso le estamos llamando hoy — esta es su oportunidad de activar un plan de protección completo para su vehículo. Deme un segundo y le presento al Asesor de Servicio.',
  },
  {
    id: 'where-info',
    emoji: '📋',
    title: 'Where did you get my information?',
    titleEs: '¿Cómo obtuvieron mi información?',
    goal: 'Normalize the contact & build trust',
    rebuttalEn:
      'We partner with dealerships and vehicle registries nationwide, and your vehicle info is part of our outreach for protection eligibility.',
    rebuttalEs:
      'Trabajamos con concesionarios y registros vehiculares a nivel nacional, y la información de su vehículo forma parte de nuestro alcance para elegibilidad de protección.',
  },
  {
    id: 'what-vehicle',
    emoji: '🚗',
    title: 'What kind of vehicle?',
    titleEs: '¿Qué tipo de vehículo?',
    goal: 'Build trust, show limitations, and shift to the Service Advisor',
    rebuttalEn:
      "I only see the finance info here — no specific make or model. That's why I need to get you over to the Service Advisor who has the full picture about the extended warranty and can go over every detail with you. Let me just verify — is the vehicle in good running condition?",
    rebuttalEs:
      'Solo tengo la información financiera aquí — sin marca ni modelo específico. Por eso necesito comunicarle con el Asesor de Servicio que tiene el panorama completo. Permítame verificar — ¿el vehículo está en buenas condiciones de funcionamiento?',
  },
  {
    id: 'where-located',
    emoji: '🌎',
    title: 'Where are you located?',
    titleEs: '¿Dónde están ubicados?',
    goal: 'Build credibility',
    rebuttalEn:
      'Our headquarters are based in Dallas, Texas — but our protection plans are accepted at any licensed repair facility across the U.S.',
    rebuttalEs:
      'Nuestra sede está en Dallas, Texas — pero nuestros planes de protección son aceptados en cualquier taller de reparación con licencia en los EE.UU.',
  },
  {
    id: 'who-is-this',
    emoji: '📞',
    title: 'Who is this?',
    titleEs: '¿Quién habla?',
    goal: 'Clarify & validate',
    rebuttalEn:
      'The first rebuttal is always: "This is [your name] from the Vehicle Services Group." Then continue with the script.',
    rebuttalEs:
      'Siempre responde primero: "Le habla [tu nombre] del Grupo de Servicios Vehiculares." Luego continúa con el script.',
  },
  {
    id: 'how-much',
    emoji: '💲',
    title: 'How much does it cost?',
    titleEs: '¿Cuánto cuesta?',
    goal: 'Tease the value & move toward transfer',
    rebuttalEn:
      "That's the great part — cost depends on your mileage and driving habits, but it's usually less than the cost of a single major repair. I'll get you to the Service Advisor to break it all down.",
    rebuttalEs:
      'Esa es la mejor parte — el costo depende del millaje y sus hábitos de manejo, pero generalmente es menos que una sola reparación mayor. Le comunico con el Asesor de Servicio para que le explique todo.',
  },
  {
    id: 'already-insurance',
    emoji: '🛡️',
    title: 'I already have insurance',
    titleEs: 'Ya tengo seguro',
    goal: 'Differentiate coverage type clearly',
    rebuttalEn:
      "Totally get that — and that's actually why we're calling. Insurance covers accidents. What we offer is mechanical breakdown coverage — engine, transmission, and more.",
    rebuttalEs:
      'Totalmente entendido — y justamente por eso llamamos. El seguro cubre accidentes. Lo que ofrecemos es cobertura por fallas mecánicas — motor, transmisión y más.',
  },
  {
    id: 'multiple-cars',
    emoji: '🚘',
    title: 'I have multiple cars',
    titleEs: 'Tengo varios vehículos',
    goal: 'Verify all the cars',
    rebuttalEn:
      "Perfect — many of our customers do! We can check coverage for each one, but let's start with your main vehicle. Is it newer than 2011? Great, let's go from there.",
    rebuttalEs:
      '¡Perfecto — muchos de nuestros clientes también! Podemos verificar cobertura para cada uno, pero comencemos con su vehículo principal. ¿Es más reciente que 2011?',
  },
  {
    id: 'busy',
    emoji: '🕒',
    title: "I'm busy",
    titleEs: 'Estoy ocupado/a',
    goal: 'Avoid dead air',
    rebuttalEn:
      "Totally respect that — this will take a few minutes. If it's a bad time, I can schedule a callback that works better for you. Would later today or tomorrow be easier?",
    rebuttalEs:
      'Lo respeto totalmente — esto tomará solo unos minutos. Si no es buen momento, puedo agendar una llamada de regreso. ¿Le quedaría mejor más tarde hoy o mañana?',
  },
  {
    id: 'already-activated',
    emoji: '✅',
    title: 'I already activated it',
    titleEs: 'Ya la activé',
    goal: 'Differentiate coverage type clearly',
    rebuttalEn:
      "I see! Did you activate that when you first purchased the vehicle? If so, it's likely just the Factory Warranty for the engine and transmission. We're looking at the Extended Warranty which is much wider. Let me get a Service Advisor on to verify that for you, okay?",
    rebuttalEs:
      '¡Entiendo! ¿La activó cuando compró el vehículo? Si fue así, probablemente sea solo la Garantía de Fábrica para motor y transmisión. La Garantía Extendida que manejamos es mucho más amplia. Le comunico con un Asesor de Servicio para verificarlo, ¿de acuerdo?',
  },
  {
    id: 'another-company',
    emoji: '🏢',
    title: 'I have it with another company',
    titleEs: 'La tengo con otra compañía',
    goal: 'Highlight comparison opportunity',
    rebuttalEn:
      "That's great, it gives you a baseline! Many clients switch after a quick side-by-side comparison because we offer better rates for the same protection. One second while I bring in a Service Advisor to show you the difference, alright?",
    rebuttalEs:
      '¡Qué bien, eso le da un punto de referencia! Muchos clientes cambian después de una comparación rápida porque ofrecemos mejores tarifas para la misma protección. Un segundo mientras le conecto con un Asesor de Servicio para mostrarle la diferencia.',
  },
  {
    id: 'purpose-of-call',
    emoji: '📣',
    title: 'Purpose of the call?',
    titleEs: '¿Cuál es el propósito de la llamada?',
    goal: 'Clarify purpose and move toward transfer',
    rebuttalEn:
      "This call is simply an opportunity to extend the warranty on your vehicle before any issues come up. Think of it as an extra layer of protection against unexpected breakdowns. If your vehicle is still running well, I'll go ahead and connect you to the Service Advisor who'll walk you through everything. Sounds good?",
    rebuttalEs:
      'Esta llamada es simplemente una oportunidad para extender la garantía de su vehículo antes de que surja cualquier problema. Piénselo como una capa extra de protección. Si su vehículo funciona bien, le comunico con el Asesor de Servicio ahora.',
  },
  {
    id: 'totaled-sold',
    emoji: '🚫',
    title: 'Vehicle was totaled / sold',
    titleEs: 'El vehículo fue destruido / vendido',
    goal: 'Disposition correctly',
    rebuttalEn:
      "I understand, thank you for letting me know. In that case, I'll update your file accordingly. Have a great day!",
    rebuttalEs:
      'Entiendo, gracias por informarme. En ese caso, actualizaré su archivo. ¡Que tenga un excelente día!',
    note: 'Use WRGVEH disposition',
  },
  {
    id: 'too-expensive',
    emoji: '💲',
    title: "That's too expensive",
    titleEs: 'Es muy caro',
    goal: 'Tease value & move to SA',
    rebuttalEn:
      "I completely understand — and that's exactly why we have a Service Advisor who can walk you through the options and find a plan that fits your budget. It's worth hearing the numbers first. Can I connect you real quick?",
    rebuttalEs:
      'Entiendo completamente — y por eso tenemos un Asesor de Servicio que puede mostrarle las opciones y encontrar un plan que se ajuste a su presupuesto. Vale la pena escuchar los números primero. ¿Le conecto rápido?',
  },
  {
    id: 'not-my-vehicle',
    emoji: '🚗',
    title: "That's not my vehicle",
    titleEs: 'Ese no es mi vehículo',
    goal: 'Clarify and verify',
    rebuttalEn:
      "I understand — the file shows a vehicle financed under your name. It's possible it may be registered differently. The Service Advisor would be able to look into that further. Can I connect you?",
    rebuttalEs:
      'Entiendo — el archivo muestra un vehículo financiado a su nombre. Es posible que esté registrado de manera diferente. El Asesor de Servicio podría investigar eso. ¿Le conecto?',
  },
];

// ── PRODUCT KNOWLEDGE ─────────────────────────
export const productKnowledge = {
  comparison: {
    title: 'Know the Difference',
    items: [
      {
        name: 'Factory Warranty',
        color: '#b45309',
        points: [
          'Comes with NEW vehicles',
          'Lasts 3 years or 36,000 miles',
          'Covers manufacturer defects',
          'Expires — cannot be renewed',
        ],
      },
      {
        name: 'Extended Coverage',
        color: '#f97316',
        points: [
          'NOT mandatory',
          'Pays for mechanical repairs AFTER factory warranty ends',
          'Optional — you choose the plan',
          "That's what WE offer",
        ],
      },
      {
        name: 'Insurance',
        color: '#92400e',
        points: [
          'MANDATORY in the US to drive',
          'Covers accidents, damage, theft, liability',
          'Does NOT cover mechanical breakdowns',
          'Completely different product',
        ],
      },
    ],
  },
  canCover: {
    title: 'What We Cover',
    items: [
      'Engine and transmission (core systems)',
      'Vehicles manufactured 2011 or later',
      'Vehicles with up to 175,000 miles',
      'Vehicles with mechanical issues — as long as they run',
      'Vehicles with modified parts (we cover the unmodified parts)',
      'Coverage up to 100k+ additional miles',
      'Repairs at any authorized repair shop nationwide',
    ],
  },
  cannotCover: {
    title: 'What We Cannot Cover',
    items: [
      'Electric vehicles',
      'Vehicles manufactured before 2011',
      'Vehicles with more than 175,000 miles',
      'Pre-existing mechanical issues (but can cover the vehicle if it runs)',
      'Damage from collisions or accidents',
      'Bodywork or cosmetic repairs, light bulbs',
      'Wear and tear items',
      'Parts that have been altered or modified',
      'Motorcycles, trailers, and Lamborghinis',
    ],
  },
  duration: {
    title: 'Duration & Service Process',
    points: [
      'Kicks in post-factory warranty',
      'Covers up to 100,000+ additional miles',
      'Service at any authorized repair shop in the US',
    ],
  },
};

// ── CALL FLOW ─────────────────────────────────
export const callFlow = {
  steps: [
    {
      id: 1,
      title: 'Introduction & Financing Info',
      icon: '👋',
      description: 'Greet the client by name, identify yourself and the company, mention the vehicle they financed and the date.',
      keyPoints: ['Use client name', 'State financing date from form', 'Sound confident'],
    },
    {
      id: 2,
      title: 'Vehicle Condition Verification',
      icon: '🚗',
      description: 'Ask if the vehicle is in good running condition. This confirms eligibility. Always wait for the answer.',
      keyPoints: ['Must confirm before proceeding', 'Vehicle must be running', 'No warning lights issue'],
    },
    {
      id: 3,
      title: 'Setting Expectations',
      icon: '📋',
      description: 'Tell the customer you need to connect them with a Service Advisor. Get their approval before transferring.',
      keyPoints: ['Wait for "okay" or approval', 'Never transfer without consent', 'Be brief and clear'],
    },
    {
      id: 4,
      title: 'Professional Transfer',
      icon: '🔄',
      description: 'Wait for the SA to pick up first, then introduce the client by name and ask for assistance.',
      keyPoints: ['SA speaks first', 'Introduce client by name', 'Stay on line until confirmed'],
    },
  ],
  transferProtocol: [
    'Confirm vehicle qualification (is it running?)',
    'Get customer approval to transfer',
    'Initiate transfer — stay on the line',
    'Wait for Service Advisor to pick up and speak first',
    'Introduce client: "Hello SA, I have [name] on the line — can you please assist?"',
    '⏱️ Stay on the 3-way call for at least 15 seconds — confirm SA and customer are talking before you disconnect',
  ],
  waitingQuestions: [
    'Has your vehicle received maintenance recently?',
    'Have you noticed any unusual noises from the engine or transmission?',
    'Have you had any breakdowns or accidents that required repairs?',
    'Does the vehicle start without problems?',
    'Have you seen any fluid leaks in your vehicle?',
    'Do the brakes respond properly?',
    'Did you notice any problems when you received your vehicle?',
    'Are you satisfied with your vehicle\'s performance so far?',
    'Is the dashboard showing any warning lights?',
    'Has your vehicle received any modifications or upgrades?',
  ],
};

// ── DO'S & DON'TS ─────────────────────────────
export const dosAndDonts = {
  donts: [
    { rule: "Don't say we work for car brands", detail: 'We are Vehicle Services Group — independent.' },
    { rule: "Don't say we're extending factory warranty", detail: 'We offer extended coverage — a separate product.' },
    { rule: 'Never say "FREE"', detail: 'This is misleading and non-compliant.' },
    { rule: "Don't say we got info from the bank", detail: 'Say: "We partner with dealerships and vehicle registries."' },
  ],
  formFields: {
    use: [
      'First and Last Name',
      'Origination Date / Date of Loan (Month/Day/Year)',
      'Loan Balance / Total Amount of the Loan',
    ],
    ignore: [
      'Address',
      'Maintenance dates',
      'Finance company',
      'Terms of loan',
      'Plan Cost',
      'Origination date',
      'Loan Balance (secondary form)',
    ],
  },
  deliveryStandards: [
    'State financing info with confidence',
    'Confirm vehicle runs before continuing',
    'Proper introduction to Service Advisor',
    'No shortening the script',
    'No improvising — follow the script word for word',
  ],
  practiceStructure: [
    { title: 'Line-by-Line Repetition', desc: 'Repeat the script exactly as written until delivery becomes natural and automatic.' },
    { title: 'Tone & Pronunciation', desc: 'Your tone builds trust before your words do. Focus on clear pronunciation, controlled energy, and confident inflection.' },
    { title: 'Authority', desc: 'Customers respond to certainty. Authority delivery means speaking with control, clarity, and purpose.' },
    { title: 'Speed Control', desc: 'Speaking too fast creates confusion and objections. Speaking too slow reduces energy. Find the right pace.' },
  ],
};

// ── DISPOSITIONS & DIALER ─────────────────────
export const dialer = {
  dispositions: [
    { code: 'A', label: 'Answering Machine', description: 'Call went to voicemail or automated system' },
    { code: 'BLANK', label: 'No Info on File', description: 'File has no usable customer info', flag: 'warning' },
    { code: 'CALLBK', label: 'Call Back', description: 'Customer requested a callback at a specific time' },
    { code: 'DAIR', label: 'Dead Air', description: 'Call connected but no one responded' },
    { code: 'DC', label: 'Disconnected Number', description: 'Number is no longer in service', flag: 'danger' },
    { code: 'DNC', label: 'Do Not Call', description: 'Customer requested to be removed from list', flag: 'warning' },
    { code: 'LANG', label: 'Language Barrier', description: 'Could not communicate due to language' },
    { code: 'NI', label: 'Not Interested', description: 'Customer declined and is not interested' },
    { code: 'SPANIS', label: 'Spanish Speaker', description: 'Transfer to Spanish-speaking team', flag: 'warning' },
    { code: 'SPXFER', label: 'Spanish Xfer', description: 'Transferred to Spanish Service Advisor' },
    { code: 'WRGNUM', label: 'Wrong Number', description: "Called number doesn't match the file" },
    { code: 'WRGVEH', label: 'Wrong Vehicle Info', description: 'Vehicle info on file is incorrect' },
    { code: 'XFER', label: 'Call Transferred ✓', description: 'Successful transfer to Service Advisor' },
  ],
  pauseCodes: [
    { code: 'Break - Break', label: 'BREAK', time: '10 minutes max', desc: 'Only when taking your scheduled break' },
    { code: 'CB - Callbacks', label: 'CALLBACKS', time: 'As needed', desc: 'When making a callback to a potential customer' },
    { code: 'Lunch - Lunch', label: 'LUNCH', time: '1 hour', desc: 'Only when taking your lunch hour' },
    { code: 'Manage', label: 'MANAGE', time: 'As needed', desc: 'Only when supervisors request you to call them' },
    { code: 'RR - Restroom', label: 'RESTROOM', time: '5 min max', desc: 'When you need to go to the restroom' },
    { code: 'Tech - Tech or System Issues', label: 'TECH ISSUES', time: 'As needed', desc: 'Only when your system is not working properly' },
  ],
};

// ── QUIZ QUESTIONS ────────────────────────────
export const quizQuestions = [
  {
    id: 1,
    question: 'What company name do you use when greeting a customer?',
    options: [
      'Vehicle Services Group',
      'Auto Warranty Garrett',
      'Kampaign Kings',
      'Vehicle Protection Services',
    ],
    correct: 0,
    explanation: 'Always say "Vehicle Services Group" — never mention Kampaign Kings or Auto Warranty to the customer.',
  },
  {
    id: 2,
    question: 'When can you transfer the customer to the Service Advisor?',
    options: [
      'Immediately after the introduction',
      'After verifying their vehicle condition AND getting their approval',
      'Anytime during the call',
      'Only after they give their phone number',
    ],
    correct: 1,
    explanation: 'Always verify the vehicle runs, then wait for the customer to say "okay" or give clear approval before transferring.',
  },
  {
    id: 3,
    question: 'Which vehicle qualifies for coverage?',
    options: [
      '2009 Honda Civic with 80,000 miles',
      '2016 Tesla Model 3',
      '2018 Toyota Camry with 150,000 miles',
      '2019 Harley Davidson motorcycle',
    ],
    correct: 2,
    explanation: 'Must be 2011 or newer, non-electric, under 175k miles, and not a motorcycle or trailer.',
  },
  {
    id: 4,
    question: 'What disposition do you use for a successful transfer?',
    options: [
      'SPXFER - Spanish Xfer',
      'CALLBK - Call Back',
      'XFER - Call Transferred',
      'A - Answering Machine',
    ],
    correct: 2,
    explanation: 'XFER means the call was successfully transferred to a Service Advisor.',
  },
  {
    id: 5,
    question: "Customer says: 'Where did you get my information?' — Best response?",
    options: [
      '"We got it from the bank you financed with."',
      '"We partner with dealerships and vehicle registries nationwide."',
      '"Our system automatically generates leads."',
      '"I\'m not sure, it was in the file."',
    ],
    correct: 1,
    explanation: 'Never mention the bank. The approved response is that we partner with dealerships and vehicle registries.',
  },
  {
    id: 6,
    question: 'What is the maximum mileage for a vehicle to qualify?',
    options: [
      '100,000 miles',
      '150,000 miles',
      '175,000 miles',
      '200,000 miles',
    ],
    correct: 2,
    explanation: 'Vehicles with MORE than 175,000 miles cannot be covered.',
  },
  {
    id: 7,
    question: 'Which word is NEVER allowed during a call?',
    options: [
      '"Service Advisor"',
      '"Extended Warranty"',
      '"FREE"',
      '"Vehicle Services Group"',
    ],
    correct: 2,
    explanation: 'Never say "FREE" — it is misleading and non-compliant.',
  },
  {
    id: 8,
    question: 'What pause code do you use when going to the restroom?',
    options: [
      'Break - Break',
      'RR - Restroom',
      'Lunch - Lunch',
      'DAIR - Dead Air',
    ],
    correct: 1,
    explanation: 'RR - Restroom is the correct pause code. Maximum 5 minutes.',
  },
  {
    id: 9,
    question: 'Customer says: "I already have insurance." — What do you say?',
    options: [
      '"That\'s okay, you don\'t need our coverage then."',
      '"Insurance and extended warranty are the same thing."',
      '"Insurance covers accidents. What we offer is mechanical breakdown coverage — engine, transmission, and more."',
      '"Our product replaces your insurance."',
    ],
    correct: 2,
    explanation: 'Insurance ≠ Extended Warranty. Insurance covers accidents; we cover mechanical breakdowns.',
  },
  {
    id: 10,
    question: 'What is Step 1 of the Transfer Protocol?',
    options: [
      'Introduce the Service Advisor',
      'Stay on the line',
      'Confirm vehicle qualification',
      'Wait for advisor confirmation',
    ],
    correct: 2,
    explanation: '5-step protocol: Confirm qualification → Proper SA intro → Stay on line → Wait for SA confirmation → Never hang up early.',
  },
  {
    id: 11,
    question: 'Which vehicles are excluded from coverage? (Select the most complete answer)',
    options: [
      'Only motorcycles',
      'Electric vehicles, pre-2011 models, and motorcycles',
      'Only vehicles over 200k miles',
      'Vehicles with any modifications',
    ],
    correct: 1,
    explanation: 'EV, pre-2011, and motorcycles (plus trailers and Lamborghinis) are all excluded.',
  },
  {
    id: 12,
    question: 'When waiting for the Service Advisor to pick up, you should:',
    options: [
      'Hang up and try again',
      'Stay silent',
      'Ask the customer questions about their vehicle condition',
      'Put the customer on hold',
    ],
    correct: 2,
    explanation: 'Use the "Waiting for an Advisor" questions to keep the customer engaged and gather useful info.',
  },
  {
    id: 13,
    question: 'From the lead form, which field should you use in the script?',
    options: [
      'Finance Company',
      'Address',
      'Origination Date (Date of Loan)',
      'Terms of Loan',
    ],
    correct: 2,
    explanation: 'You use: Name, Origination Date, and Loan Balance. Never use address or finance company name.',
  },
  {
    id: 14,
    question: 'Extended coverage is different from factory warranty because:',
    options: [
      'They are the same thing',
      'Factory warranty never expires',
      'Extended coverage kicks in AFTER the factory warranty ends and covers more',
      'Factory warranty covers more systems',
    ],
    correct: 2,
    explanation: 'Factory warranty: 3 years / 36k miles on new vehicles. Extended coverage: optional, post-factory, covers mechanical breakdowns.',
  },
  {
    id: 15,
    question: 'Which of these is a correct statement to make on a call?',
    options: [
      '"We are calling on behalf of your car manufacturer."',
      '"We are extending your factory warranty."',
      '"Our records indicate you haven\'t activated your vehicle\'s extended warranty yet."',
      '"The bank asked us to call you."',
    ],
    correct: 2,
    explanation: 'This is the exact script line. Never claim to be from the manufacturer, the bank, or say you\'re extending the factory warranty.',
  },
];

// ── LEARN CATEGORIES ──────────────────────────
export const learnCategories = [
  {
    id: 'script-en',
    icon: '📋',
    title: 'Script (English)',
    description: 'Official word-for-word script with transfer protocol',
    color: '#f97316',
    type: 'script',
    ref: 'en',
  },
  {
    id: 'script-es',
    icon: '📋',
    title: 'Script (Español)',
    description: 'Script oficial en español con protocolo de transferencia',
    color: '#fb923c',
    type: 'script',
    ref: 'es',
  },
  {
    id: 'objections-en',
    icon: '🛡️',
    title: 'Objections & Rebuttals',
    description: '16 objections with approved English responses',
    color: '#ea580c',
    type: 'objections',
    ref: 'en',
  },
  {
    id: 'objections-es',
    icon: '🛡️',
    title: 'Objeciones y Rebuttals',
    description: '16 objeciones con respuestas aprobadas en español',
    color: '#c2410c',
    type: 'objections',
    ref: 'es',
  },
  {
    id: 'call-flow',
    icon: '📞',
    title: 'Call Flow',
    description: '4-step call process + transfer protocol',
    color: '#9a3412',
    type: 'callflow',
    ref: null,
  },
  {
    id: 'product-knowledge',
    icon: '📦',
    title: 'Product Knowledge',
    description: 'Coverage, exclusions, and how extended warranty works',
    color: '#7c2d12',
    type: 'product',
    ref: null,
  },
  {
    id: 'dos-donts',
    icon: '⚠️',
    title: "Do's & Don'ts",
    description: 'What to say, what to avoid, and form reading guide',
    color: '#431407',
    type: 'dosdонts',
    ref: null,
  },
  {
    id: 'dialer-guide',
    icon: '🖥️',
    title: 'Dialer Guide',
    description: 'IP validation, login, transfers EN/ES, dispositions — real screenshots',
    color: '#1e40af',
    type: 'dialer',
    ref: null,
  },
];