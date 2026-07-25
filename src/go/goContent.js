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
        tip: 'Say this with confidence. It creates urgency.',
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
        text: 'I would just need to get you on with a Service Advisor to explain the details of your qualifications and review what it will cover — give me one second and I will introduce you. Okay?',
        tip: 'Ask for approval clearly before transferring.',
      },
      {
        id: 6,
        type: 'action',
        label: '⚠️ Wait for Approval',
        text: 'Wait for customer approval before transferring.',
        tip: 'Never transfer without a clear okay or sure from the customer.',
      },
      {
        id: 7,
        type: 'action',
        label: '⚠️ On Transfer',
        text: 'When transferring, wait for Service Advisor to pick up the call and speak first.',
        tip: 'Do not jump in before the Service Advisor.',
      },
      {
        id: 8,
        type: 'line',
        label: 'SA Introduction',
        text: 'Hello Service Advisor, I have [client name] on the line — can you please assist?',
        tip: 'Stay on the line until the SA confirms they have the customer.',
      },
      {
        id: 9,
        type: 'action',
        label: '⏱️ 15-Second Rule',
        text: 'After the SA joins, stay on the call for at least 15 seconds before disconnecting. Make sure the SA and customer are actively talking before you leave.',
        tip: 'Never hang up the moment the SA joins.',
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
        tip: 'Di el nombre del cliente claramente. Menciona mes y año del formulario.',
      },
      {
        id: 2,
        type: 'line',
        label: 'Propósito',
        text: 'Nuestros registros indican que aún no ha activado la garantía extendida de su vehículo.',
        tip: 'Di esto con confianza. Crea urgencia.',
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
        tip: 'Pide aprobación con claridad antes de transferir.',
      },
      {
        id: 6,
        type: 'action',
        label: '⚠️ Espera aprobación',
        text: 'Espera primero por aprobación del cliente para transferir.',
        tip: 'Nunca transfieras sin un sí o okay claro.',
      },
      {
        id: 7,
        type: 'action',
        label: '⚠️ Al transferir',
        text: 'Al transferir, espera a que el Asesor de Servicio conteste y hable primero.',
        tip: 'No te adelantes al SA.',
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
        tip: 'Nunca cuelgues apenas entra el SA.',
      },
    ],
  },
}

export const objections = [
  {
    id: 'not-interested',
    emoji: '🚫',
    title: 'Not Interested',
    titleEs: 'No me interesa',
    goal: 'Keep them on the line and create curiosity',
    rebuttalEn:
      'I completely understand. A lot of people felt the same way at first until they saw how much a single repair could cost without coverage. That is exactly why we do not charge for the quote with the Service Advisor. Fair enough?',
    rebuttalEs:
      'Entiendo perfectamente. Mucha gente pensaba lo mismo al principio hasta que vio cuánto puede costar una sola reparación sin cobertura. Por eso no cobramos nada por la consulta con el Asesor de Servicio. ¿Le parece bien?',
  },
  {
    id: 'no-service',
    emoji: '❓',
    title: "I don't have any service with you",
    titleEs: 'No tengo ningún servicio con ustedes',
    goal: 'Clarify purpose and shift into value mode',
    rebuttalEn:
      'Exactly, and that is why we are reaching out today. This is your opportunity to activate a protection plan for your vehicle.',
    rebuttalEs:
      'Exactamente, y por eso le estamos llamando hoy. Esta es su oportunidad de activar un plan de protección para su vehículo.',
  },
  {
    id: 'where-info',
    emoji: '📋',
    title: 'Where did you get my information?',
    titleEs: '¿Cómo obtuvieron mi información?',
    goal: 'Normalize the contact and build trust',
    rebuttalEn:
      'We partner with dealerships and vehicle registries nationwide, and your vehicle information is part of our outreach for protection eligibility.',
    rebuttalEs:
      'Trabajamos con concesionarios y registros vehiculares a nivel nacional, y la información de su vehículo forma parte de nuestro alcance para elegibilidad de protección.',
  },
  {
    id: 'what-vehicle',
    emoji: '🚗',
    title: 'What kind of vehicle?',
    titleEs: '¿Qué tipo de vehículo?',
    goal: 'Show limitations and move toward the Service Advisor',
    rebuttalEn:
      'I only see the finance information here, not the exact make or model. That is why I need to get you over to the Service Advisor.',
    rebuttalEs:
      'Solo tengo la información financiera aquí, no la marca o modelo exacto. Por eso necesito comunicarle con el Asesor de Servicio.',
  },
  {
    id: 'where-located',
    emoji: '🌎',
    title: 'Where are you located?',
    titleEs: '¿Dónde están ubicados?',
    goal: 'Build credibility',
    rebuttalEn:
      'Our headquarters are based in Dallas, Texas, but our protection plans are accepted at authorized repair facilities across the U.S.',
    rebuttalEs:
      'Nuestra sede está en Dallas, Texas, pero nuestros planes de protección son aceptados en talleres autorizados en todo EE.UU.',
  },
  {
    id: 'who-is-this',
    emoji: '📞',
    title: 'Who is this?',
    titleEs: '¿Quién habla?',
    goal: 'Clarify and validate',
    rebuttalEn:
      'This is [your name] from the Vehicle Services Group.',
    rebuttalEs:
      'Le habla [tu nombre] del Grupo de Servicios Vehiculares.',
  },
  {
    id: 'how-much',
    emoji: '💲',
    title: 'How much does it cost?',
    titleEs: '¿Cuánto cuesta?',
    goal: 'Tease the value and move toward transfer',
    rebuttalEn:
      'That is the great part. Cost depends on mileage and driving habits, and the Service Advisor can break that down for you.',
    rebuttalEs:
      'Esa es la mejor parte. El costo depende del millaje y hábitos de manejo, y el Asesor de Servicio puede explicárselo.',
  },
  {
    id: 'already-insurance',
    emoji: '🛡️',
    title: 'I already have insurance',
    titleEs: 'Ya tengo seguro',
    goal: 'Differentiate coverage clearly',
    rebuttalEn:
      'Totally understand. Insurance covers accidents. What we offer is mechanical breakdown coverage.',
    rebuttalEs:
      'Totalmente entendido. El seguro cubre accidentes. Lo que ofrecemos es cobertura por fallas mecánicas.',
  },
  {
    id: 'busy',
    emoji: '🕒',
    title: "I'm busy",
    titleEs: 'Estoy ocupado/a',
    goal: 'Keep control and offer a callback',
    rebuttalEn:
      'Totally respect that. If this is not a good time, I can schedule a callback that works better for you.',
    rebuttalEs:
      'Lo respeto totalmente. Si este no es un buen momento, puedo agendar una llamada de regreso.',
  },
  {
    id: 'already-activated',
    emoji: '✅',
    title: 'I already activated it',
    titleEs: 'Ya la activé',
    goal: 'Differentiate factory warranty and extended coverage',
    rebuttalEn:
      'If that was activated when you first purchased the vehicle, it is likely just the Factory Warranty. We are looking at Extended Warranty coverage, which is wider.',
    rebuttalEs:
      'Si eso se activó cuando compró el vehículo, probablemente sea solo la Garantía de Fábrica. Nosotros hablamos de Garantía Extendida, que es más amplia.',
  },
  {
    id: 'another-company',
    emoji: '🏢',
    title: 'I have it with another company',
    titleEs: 'La tengo con otra compañía',
    goal: 'Highlight comparison opportunity',
    rebuttalEn:
      'That is great because it gives you a baseline. Many clients switch after a quick side by side comparison.',
    rebuttalEs:
      'Eso es excelente porque le da un punto de comparación. Muchos clientes cambian después de una comparación rápida.',
  },
  {
    id: 'purpose-of-call',
    emoji: '📣',
    title: 'Purpose of the call?',
    titleEs: '¿Cuál es el propósito de la llamada?',
    goal: 'Clarify purpose and move toward transfer',
    rebuttalEn:
      'This call is simply an opportunity to extend protection on your vehicle before any issues come up.',
    rebuttalEs:
      'Esta llamada es simplemente una oportunidad para extender la protección de su vehículo antes de que surja algún problema.',
  },
]

export const productKnowledge = {
  comparison: {
    title: 'Know the Difference',
    items: [
      {
        name: 'Factory Warranty',
        color: '#b45309',
        points: [
          'Comes with new vehicles',
          'Lasts about 3 years or 36,000 miles',
          'Covers manufacturer defects',
          'Expires and cannot be renewed as factory coverage',
        ],
      },
      {
        name: 'Extended Coverage',
        color: '#f97316',
        points: [
          'Not mandatory',
          'Covers mechanical repairs after factory coverage ends',
          'Optional product',
          'That is what we offer',
        ],
      },
      {
        name: 'Insurance',
        color: '#92400e',
        points: [
          'Mandatory in the U.S. to drive legally',
          'Covers accidents, theft, damage, liability',
          'Does not cover mechanical breakdowns',
          'Completely different product',
        ],
      },
    ],
  },

  canCover: {
    title: 'What We Cover',
    items: [
      'Engine and transmission',
      'Vehicles manufactured 2011 or later',
      'Vehicles with up to 175,000 miles',
      'Vehicles that still run',
      'Coverage up to 100,000 or more additional miles',
      'Repairs at any authorized repair shop nationwide',
      'Unmodified parts on vehicles with modifications',
    ],
  },

  cannotCover: {
    title: 'What We Cannot Cover',
    items: [
      'Electric vehicles',
      'Vehicles before 2011',
      'Vehicles with over 175,000 miles',
      'Bodywork or cosmetic repairs',
      'Collision or accident damage',
      'Light bulbs and normal wear items',
      'Modified parts themselves',
      'Motorcycles, trailers, exotic exceptions',
    ],
  },

  duration: {
    title: 'Duration and Service Process',
    points: [
      'Kicks in after factory coverage ends',
      'Can cover up to 100,000 or more additional miles',
      'Service can be done at authorized repair facilities across the U.S.',
    ],
  },
}

export const callFlow = {
  steps: [
    {
      id: 1,
      title: 'Introduction and Financing Info',
      icon: '👋',
      description: 'Greet the client by name, identify yourself and the company, and mention the financing month and year.',
      keyPoints: ['Use the client name', 'Use month and year from form', 'Sound confident'],
    },
    {
      id: 2,
      title: 'Vehicle Condition Verification',
      icon: '🚗',
      description: 'Ask whether the vehicle is still in good running condition. This confirms eligibility.',
      keyPoints: ['Wait for the answer', 'Vehicle must be running', 'Do not skip this step'],
    },
    {
      id: 3,
      title: 'Transfer Setup',
      icon: '📋',
      description: 'Explain that you need to connect the customer with a Service Advisor and get approval first.',
      keyPoints: ['Get clear approval', 'Never transfer without consent', 'Be direct and smooth'],
    },
    {
      id: 4,
      title: 'Professional Transfer',
      icon: '🔄',
      description: 'Wait for the Service Advisor to pick up first, then introduce the client by name and stay on the line.',
      keyPoints: ['SA speaks first', 'Introduce client properly', 'Confirm handoff before leaving'],
    },
  ],

  transferProtocol: [
    'Confirm vehicle qualification first',
    'Get customer approval to transfer',
    'Initiate the transfer and stay on the line',
    'Wait for the Service Advisor to pick up and speak first',
    'Introduce the client by name',
    'Stay at least 15 seconds and confirm both are talking',
  ],

  waitingQuestions: [
    'Has your vehicle received maintenance recently?',
    'Have you noticed any unusual noises from the engine or transmission?',
    'Have you had any breakdowns or repairs recently?',
    'Does the vehicle start without problems?',
    'Have you seen any warning lights on the dashboard?',
    'Do the brakes respond properly?',
    'Are you satisfied with your vehicle performance so far?',
    'Has the vehicle had any modifications or upgrades?',
  ],
}

export const dosAndDonts = {
  donts: [
    {
      rule: "Don't say we work for car brands",
      detail: 'We are Vehicle Services Group, independent.',
    },
    {
      rule: "Don't say we are extending factory warranty",
      detail: 'We offer extended coverage, which is a separate product.',
    },
    {
      rule: 'Never say FREE',
      detail: 'This is misleading and non-compliant.',
    },
    {
      rule: "Don't say the bank gave us the information",
      detail: 'Say we partner with dealerships and vehicle registries.',
    },
  ],

  formFields: {
    use: [
      'Customer first and last name',
      'Origination date or date of loan',
      'Loan balance or total amount of loan',
    ],
    ignore: [
      'Address',
      'Maintenance dates',
      'Finance company',
      'Terms of loan',
      'Plan cost',
    ],
  },

  deliveryStandards: [
    'State financing info with confidence',
    'Confirm the vehicle runs before continuing',
    'Use proper SA introduction',
    'Do not shorten the script',
    'Do not improvise the wording',
  ],

  practiceStructure: [
    {
      title: 'Line by Line Repetition',
      desc: 'Repeat the script exactly as written until delivery becomes natural.',
    },
    {
      title: 'Tone and Pronunciation',
      desc: 'Focus on clear pronunciation, controlled energy, and confident inflection.',
    },
    {
      title: 'Authority',
      desc: 'Speak with control, clarity, and purpose.',
    },
    {
      title: 'Speed Control',
      desc: 'Do not rush. Do not drag. Keep a balanced pace.',
    },
  ],
}

export const dialer = {
  dispositions: [
    { code: 'A', label: 'Answering Machine', description: 'Voicemail or automated system' },
    { code: 'BLANK', label: 'Blank File', description: 'No usable customer information on the file' },
    { code: 'CALLBK', label: 'Call Back', description: 'Customer requested a callback' },
    { code: 'DAIR', label: 'Dead Air', description: 'Call connected but nobody responded' },
    { code: 'DNC', label: 'Do Not Call', description: 'Customer asked to be removed or not called again' },
    { code: 'NI', label: 'Not Interested', description: 'Customer declined or refused to continue' },
    { code: 'SPANIS', label: 'Spanish Speaker', description: 'Blind Spanish speaker route / Spanish routing without a direct closer handoff' },
    { code: 'SPXFER', label: 'Spanish Xfer', description: 'Direct Spanish transfer to a Spanish Service Advisor / closer' },
    { code: 'WN', label: 'Wrong Number', description: 'Number does not belong to the intended customer/file' },
    { code: 'WRNGVE', label: 'Wrong Vehicle', description: 'Vehicle information on file is incorrect or does not match' },
    { code: 'XFER', label: 'Call Transferred', description: 'Successful transfer to a Service Advisor' },
  ],

  pauseCodes: [
    { code: 'Break - Break', label: 'BREAK', time: '10 minutes max', desc: 'Scheduled break only' },
    { code: 'CB - Callbacks', label: 'CALLBACKS', time: 'As needed', desc: 'For callbacks' },
    { code: 'Lunch - Lunch', label: 'LUNCH', time: '1 hour', desc: 'Lunch only' },
    { code: 'Manage', label: 'MANAGE', time: 'As needed', desc: 'When supervisor asks you to call them' },
    { code: 'RR - Restroom', label: 'RESTROOM', time: '5 minutes max', desc: 'Restroom only' },
    { code: 'Tech - Tech or System Issues', label: 'TECH ISSUES', time: 'As needed', desc: 'System problems' },
  ],
}

export const quizQuestions = [
  {
    "id": 1,
    "topic": "script",
    "language": "en",
    "question": "During a QA script review, the customer asks whether the call will lower their monthly payments and the agent transfers without answering. What should QA flag?",
    "options": [
      "Payment concern was never clarified.",
      "Mileage was reviewed too late.",
      "Transfer wait was slightly long.",
      "Dealer location was not confirmed."
    ],
    "correct": 0,
    "explanation": "The agent must answer or clarify important customer questions before moving to transfer."
  },
  {
    "id": 2,
    "topic": "script",
    "language": "en",
    "question": "In the opening, someone asks, “So this is from my bank?” Which reply keeps the call safest?",
    "options": [
      "Your bank asked us to call.",
      "Your lender approved coverage.",
      "We work with dealerships and vehicle registries.",
      "The finance company sent the file."
    ],
    "correct": 2,
    "explanation": "Agents should not say the bank or lender provided the file."
  },
  {
    "id": 3,
    "topic": "script",
    "language": "en",
    "question": "Before transfer setup, the agent says, “There is no cost at all; you only listen.” Why is this risky?",
    "options": [
      "It may sound like a free-service promise.",
      "It confirms vehicle condition too clearly.",
      "It gives the advisor too much context.",
      "It explains insurance too early."
    ],
    "correct": 0,
    "explanation": "Avoid wording that can be understood as free coverage or guaranteed no cost."
  },
  {
    "id": 4,
    "topic": "script",
    "language": "en",
    "question": "After the vehicle-runs question, the customer says “okay,” but never agrees to speak with the Service Advisor. What is missing?",
    "options": [
      "Exact make and model.",
      "Customer street address.",
      "Clear transfer approval.",
      "Final monthly payment quote."
    ],
    "correct": 2,
    "explanation": "Vehicle condition confirmation is not the same as consent to transfer."
  },
  {
    "id": 5,
    "topic": "script",
    "language": "en",
    "question": "A caller answers in English but sounds unsure and confused by basic questions. What should the agent do before pushing forward?",
    "options": [
      "Ask for the preferred language.",
      "Force an English XFER.",
      "Read the script faster.",
      "Mark NI immediately."
    ],
    "correct": 0,
    "explanation": "If understanding is unclear, language preference should be checked."
  },
  {
    "id": 6,
    "topic": "script",
    "language": "en",
    "question": "The agent changes small connector words while keeping the required meaning. When is that acceptable?",
    "options": [
      "The company name is skipped.",
      "Vehicle condition is ignored.",
      "Compliance points stay intact.",
      "Transfer approval is assumed."
    ],
    "correct": 2,
    "explanation": "Natural wording is fine only when required meaning and compliance points remain intact."
  },
  {
    "id": 7,
    "topic": "script",
    "language": "en",
    "question": "Before dialing, the customer asks, “What is this about?” Which response is safest?",
    "options": [
      "Your factory warranty is being renewed.",
      "The dealer already approved a plan.",
      "This keeps your vehicle legal.",
      "It is a review of possible coverage options."
    ],
    "correct": 3,
    "explanation": "The call should be framed as a coverage review, not a required or guaranteed renewal."
  },
  {
    "id": 8,
    "topic": "script",
    "language": "en",
    "question": "In a compliance check, the customer asks, “Who are you exactly?” What should the agent avoid?",
    "options": [
      "Explaining the call purpose calmly.",
      "Pretending to be the dealership.",
      "Identifying Vehicle Services Group.",
      "Continuing only after approval."
    ],
    "correct": 1,
    "explanation": "The agent must not claim to be the dealer, bank, manufacturer, or car brand."
  },
  {
    "id": 9,
    "topic": "script",
    "language": "en",
    "question": "During the intro, the agent says, “Your warranty expired and this is your final notice.” What is the issue?",
    "options": [
      "It checks language preference.",
      "It gives the right disposition.",
      "It creates unsupported urgency.",
      "It confirms the advisor first."
    ],
    "correct": 2,
    "explanation": "Unsupported urgency can create compliance and QA risk."
  },
  {
    "id": 10,
    "topic": "script",
    "language": "en",
    "question": "Before eligibility is verified, the customer asks for the price. What should the agent do?",
    "options": [
      "Skip condition and transfer fast.",
      "Bridge pricing to the Service Advisor after qualification.",
      "Say the quote is always free.",
      "Give the cheapest monthly amount."
    ],
    "correct": 1,
    "explanation": "The agent should not quote price; they should qualify and bridge to the Service Advisor."
  },
  {
    "id": 11,
    "topic": "script",
    "language": "en",
    "question": "A customer says, “Thanks, I’m good,” and the agent only says “yeah” before transferring. What was missed?",
    "options": [
      "Dealer location confirmation.",
      "Objection handling and consent.",
      "Mileage calculation only.",
      "A pause-code correction."
    ],
    "correct": 1,
    "explanation": "A casual acknowledgment is not a rebuttal and does not prove consent."
  },
  {
    "id": 12,
    "topic": "script",
    "language": "en",
    "question": "The vehicle information on file seems wrong. Which script direction is best?",
    "options": [
      "Say the file is never wrong.",
      "Mark DNC because data is wrong.",
      "Treat it as verification for the current vehicle.",
      "Transfer before asking anything."
    ],
    "correct": 2,
    "explanation": "Wrong or outdated data should be handled as a verification opportunity."
  },
  {
    "id": 13,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “The Service Advisor will lower your payment.” What is wrong?",
    "options": [
      "It makes the handoff too clean.",
      "It promises a result the agent cannot control.",
      "It asks too clearly for approval.",
      "It confirms eligibility too slowly."
    ],
    "correct": 1,
    "explanation": "Agents must not promise lower payments or guaranteed outcomes."
  },
  {
    "id": 14,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “I’ll introduce you, okay?” and the customer asks, “To who?” What should happen?",
    "options": [
      "Mark XFER after the question.",
      "Dial first and explain later.",
      "Ignore it as small talk.",
      "Clarify the Service Advisor role."
    ],
    "correct": 3,
    "explanation": "If the customer does not understand the transfer, the agent should clarify before dialing."
  },
  {
    "id": 15,
    "topic": "script",
    "language": "en",
    "question": "The caller asks if they must buy something today. Which answer stays safest?",
    "options": [
      "The agent can approve the purchase.",
      "The bank already selected the plan.",
      "Yes, purchase is required today.",
      "The advisor reviews options; the customer decides."
    ],
    "correct": 3,
    "explanation": "The agent should not present the call as mandatory or force a purchase."
  },
  {
    "id": 16,
    "topic": "script",
    "language": "en",
    "question": "The customer asks what vehicle the call is about, but the agent only has finance information. What is safest?",
    "options": [
      "Reference finance info and verify the current vehicle.",
      "Invent the most likely make and model.",
      "Skip the vehicle check.",
      "Say the customer should know."
    ],
    "correct": 0,
    "explanation": "Be transparent about available information and verify the current vehicle."
  },
  {
    "id": 17,
    "topic": "script",
    "language": "en",
    "question": "Before the agent dials, the agent says the coverage is “from the manufacturer.” What should QA flag?",
    "options": [
      "Misrepresenting the coverage source.",
      "Using the customer name clearly.",
      "Waiting for the advisor to speak.",
      "Asking whether the vehicle runs."
    ],
    "correct": 0,
    "explanation": "Agents should not say they represent the manufacturer or car brand."
  },
  {
    "id": 18,
    "topic": "script",
    "language": "en",
    "question": "A direct customer question comes up during the opening. What is the best rule?",
    "options": [
      "Answer or clarify before pushing forward.",
      "Ignore questions until the advisor joins.",
      "Transfer faster to avoid objections.",
      "Repeat the script louder."
    ],
    "correct": 0,
    "explanation": "Unanswered questions can make the transfer misleading or invalid."
  },
  {
    "id": 19,
    "topic": "script",
    "language": "en",
    "question": "The agent gets approval but never introduces the customer by name to the Service Advisor. What is the issue?",
    "options": [
      "The call became voicemail.",
      "The customer asked for RR.",
      "The vehicle became electric.",
      "The handoff was incomplete."
    ],
    "correct": 3,
    "explanation": "The handoff should include a clean introduction, not just a connected line."
  },
  {
    "id": 20,
    "topic": "script",
    "language": "en",
    "question": "Right before transfer, the customer says, “I don’t understand what you mean.” What should the agent not do?",
    "options": [
      "Ask language preference if needed.",
      "Restate the purpose simply.",
      "Confirm understanding first.",
      "Push to transfer without clarifying."
    ],
    "correct": 3,
    "explanation": "Confusion must be clarified before transfer consent can be considered clean."
  },
  {
    "id": 21,
    "topic": "objections",
    "language": "en",
    "question": "During objection handling, the caller says “not interested” but gives no reason. What is the best first move?",
    "options": [
      "Transfer before they hang up.",
      "Ask a short reason to work with.",
      "Argue about repair costs.",
      "Mark DNC immediately."
    ],
    "correct": 1,
    "explanation": "The agent needs a reason before choosing the best rebuttal."
  },
  {
    "id": 22,
    "topic": "objections",
    "language": "en",
    "question": "A time objection comes up: “I’m busy.” The customer does not fully refuse. What should the agent avoid?",
    "options": [
      "Promising it will take under a minute.",
      "Respecting the time objection.",
      "Asking if later works better.",
      "Offering a better callback time."
    ],
    "correct": 0,
    "explanation": "The agent should not promise a specific or short wait time."
  },
  {
    "id": 23,
    "topic": "objections",
    "language": "en",
    "question": "A scam concern appears before the agent moves forward. What tone is safest?",
    "options": [
      "Calm, transparent, and controlled.",
      "Defensive and argumentative.",
      "Fast and dismissive.",
      "Silent until they stop talking."
    ],
    "correct": 0,
    "explanation": "Scam concerns require trust-building, not pressure."
  },
  {
    "id": 24,
    "topic": "objections",
    "language": "en",
    "question": "In an objection drill, the caller says they already have insurance. What distinction matters?",
    "options": [
      "Insurance pays every repair type.",
      "Coverage replaces legal insurance.",
      "Insurance and coverage are identical.",
      "Insurance covers accidents; coverage is mechanical."
    ],
    "correct": 3,
    "explanation": "Insurance and mechanical breakdown coverage must be separated clearly."
  },
  {
    "id": 25,
    "topic": "objections",
    "language": "en",
    "question": "A customer says, “I already have a warranty.” What is the safest positioning?",
    "options": [
      "Promise a cheaper replacement.",
      "Tell them to cancel the plan.",
      "Review updated or additional options.",
      "Say their current plan is useless."
    ],
    "correct": 2,
    "explanation": "Existing coverage should be handled as a review, not attacked."
  },
  {
    "id": 26,
    "topic": "objections",
    "language": "en",
    "question": "When asked, “Where did you get my information?” which answer should be avoided?",
    "options": [
      "The call is for eligibility review.",
      "We partner with dealerships.",
      "We work with vehicle registries.",
      "Your bank sent us your loan file."
    ],
    "correct": 3,
    "explanation": "Bank-source statements create compliance risk."
  },
  {
    "id": 27,
    "topic": "objections",
    "language": "en",
    "question": "Someone asks, “What vehicle?” and sounds suspicious. What helps most?",
    "options": [
      "Tell them the question is irrelevant.",
      "Invent details to sound confident.",
      "Transfer because suspicion is normal.",
      "Explain screen limits and verify the vehicle."
    ],
    "correct": 3,
    "explanation": "Transparency about limited finance information helps build trust."
  },
  {
    "id": 28,
    "topic": "objections",
    "language": "en",
    "question": "Before any transfer attempt, the caller asks, “How much?” before confirming vehicle condition. Which reply is safest?",
    "options": [
      "Pricing depends, and the advisor reviews it.",
      "It is always free today.",
      "The agent can approve a discount.",
      "The bank sets the lowest payment."
    ],
    "correct": 0,
    "explanation": "The agent can bridge pricing to the advisor but should not quote or promise."
  },
  {
    "id": 29,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “Send me an email first.” What should the agent avoid?",
    "options": [
      "Explaining the advisor can review details.",
      "Promising to send policy documents.",
      "Asking if the vehicle still runs.",
      "Confirming vehicle condition first."
    ],
    "correct": 1,
    "explanation": "The agent should not promise emails or documents they cannot provide."
  },
  {
    "id": 30,
    "topic": "objections",
    "language": "en",
    "question": "A totaled vehicle objection comes up. What should the agent do next?",
    "options": [
      "Mark XFER if they listen.",
      "Promise coverage on the loss.",
      "Transfer for the totaled vehicle.",
      "Ask about a current drivable vehicle."
    ],
    "correct": 3,
    "explanation": "A totaled vehicle should not move forward; verify a current vehicle if there is one."
  },
  {
    "id": 31,
    "topic": "objections",
    "language": "en",
    "question": "The caller says, “That’s not my car.” What is the best response path?",
    "options": [
      "End the call as DNC.",
      "Say the file is always accurate.",
      "Transfer without correcting.",
      "Verify the current vehicle instead."
    ],
    "correct": 3,
    "explanation": "Wrong vehicle information should lead to verification, not a forced transfer."
  },
  {
    "id": 32,
    "topic": "objections",
    "language": "en",
    "question": "A caller has multiple vehicles. What must be confirmed before transfer?",
    "options": [
      "At least one current vehicle runs and may qualify.",
      "Every vehicle has the same mileage.",
      "All vehicles were bought together.",
      "The customer knows each VIN."
    ],
    "correct": 0,
    "explanation": "At least one current vehicle must fit the basic qualification path."
  },
  {
    "id": 33,
    "topic": "objections",
    "language": "en",
    "question": "Before the advisor reviews anything, the caller says, “That’s too expensive.” What should the agent do?",
    "options": [
      "Reframe cost versus major repairs.",
      "Tell them price is fixed.",
      "Promise the cheapest plan.",
      "Agree and end the call at once."
    ],
    "correct": 0,
    "explanation": "The agent can reframe value without promising a specific price."
  },
  {
    "id": 34,
    "topic": "objections",
    "language": "en",
    "question": "A repeat-contact objection comes up: “You called before and I said no.” What is the safer angle?",
    "options": [
      "A claim that refusal expired.",
      "A direct transfer without consent.",
      "A threat of losing legal driving rights.",
      "Updated options as the reason."
    ],
    "correct": 3,
    "explanation": "Updated options create curiosity without pressure or false claims."
  },
  {
    "id": 35,
    "topic": "objections",
    "language": "en",
    "question": "The caller is rude and asks to stop being called. What is the professional path?",
    "options": [
      "Keep rebutting aggressively.",
      "Mirror the customer’s tone.",
      "Stay calm and process removal.",
      "Transfer to avoid conflict."
    ],
    "correct": 2,
    "explanation": "Stop-calling language should be handled professionally, often as DNC."
  },
  {
    "id": 36,
    "topic": "objections",
    "language": "en",
    "question": "A co-signer says they are not the owner. What should the agent check?",
    "options": [
      "Whether they know the advisor’s name.",
      "Whether they can make decisions.",
      "Whether the vehicle has a radio.",
      "Whether they want a free quote."
    ],
    "correct": 1,
    "explanation": "Co-signer status does not automatically mean decision-maker authority."
  },
  {
    "id": 37,
    "topic": "objections",
    "language": "en",
    "question": "The caller gives polite “sure” answers but sounds distracted and disconnected. What is the risk?",
    "options": [
      "The advisor cannot speak first.",
      "The vehicle becomes modified.",
      "The mileage becomes unknown.",
      "Consent may not be meaningful."
    ],
    "correct": 3,
    "explanation": "The agent should confirm understanding instead of relying on weak agreement."
  },
  {
    "id": 38,
    "topic": "objections",
    "language": "en",
    "question": "Before transfer, the customer asks, “Can you just tell me the plan details?” What is the best bridge?",
    "options": [
      "The customer must buy before details.",
      "The agent should invent plan terms.",
      "Plan details are never explained.",
      "The Service Advisor reviews details after verification."
    ],
    "correct": 3,
    "explanation": "The agent should not invent details; they should bridge to the Service Advisor."
  },
  {
    "id": 39,
    "topic": "objections",
    "language": "en",
    "question": "After struggling through the English script, the customer says, “I need Spanish.” What should the agent do?",
    "options": [
      "Ignore it until the advisor joins.",
      "Mark XFER as English transfer.",
      "Use the proper Spanish handling path.",
      "Continue the English script anyway."
    ],
    "correct": 2,
    "explanation": "Language preference should be respected and routed correctly."
  },
  {
    "id": 40,
    "topic": "objections",
    "language": "en",
    "question": "The caller asks if the Service Advisor will take “just a few seconds.” What should the agent avoid?",
    "options": [
      "Saying the advisor reviews details.",
      "Asking vehicle waiting questions.",
      "Guaranteeing a short wait time.",
      "Keeping the customer engaged."
    ],
    "correct": 2,
    "explanation": "The agent does not control advisor timing and should not promise it."
  },
  {
    "id": 41,
    "topic": "product",
    "language": "en",
    "question": "Which case is safest to continue toward transfer?",
    "options": [
      "2010 Toyota RAV4, 80,000 miles, runs well.",
      "2022 Tesla Model 3, 30,000 miles, runs well.",
      "2016 Honda Accord, 110,000 miles, runs well.",
      "2019 Ford F-150, 181,000 miles, runs well."
    ],
    "correct": 2,
    "explanation": "The 2016 gas sedan fits year, mileage, vehicle type, and running-condition rules."
  },
  {
    "id": 42,
    "topic": "product",
    "language": "en",
    "question": "A 2020 Tesla Model Y has 30,000 miles and runs well. What matters most?",
    "options": [
      "Running condition overrides type.",
      "The Service Advisor must approve it.",
      "Electric vehicles are excluded.",
      "Low mileage makes it eligible."
    ],
    "correct": 2,
    "explanation": "Electric vehicles are excluded even with low mileage."
  },
  {
    "id": 43,
    "topic": "product",
    "language": "en",
    "question": "A 2011 Chevrolet Malibu has 176,200 miles and runs well. What should the agent understand?",
    "options": [
      "It is over the mileage limit.",
      "It qualifies if financed recently.",
      "The year alone makes it safe.",
      "Running well removes the limit."
    ],
    "correct": 0,
    "explanation": "The basic mileage limit is up to 175,000 miles."
  },
  {
    "id": 44,
    "topic": "product",
    "language": "en",
    "question": "A 2010 Nissan Altima has 92,000 miles and no issues. What is the concern?",
    "options": [
      "Model year is before 2011.",
      "No issues makes it suspicious.",
      "Insurance is missing.",
      "Mileage is too high."
    ],
    "correct": 0,
    "explanation": "Vehicles before 2011 are outside the basic eligibility rule."
  },
  {
    "id": 45,
    "topic": "product",
    "language": "en",
    "question": "A 2018 Toyota Camry runs, but the customer says it is missing a tire. What is best?",
    "options": [
      "Ignore it because the engine runs.",
      "Treat it as good running condition.",
      "Promise tire replacement coverage.",
      "Clarify if it is safely drivable now."
    ],
    "correct": 3,
    "explanation": "A missing tire creates a current condition concern that must be clarified."
  },
  {
    "id": 46,
    "topic": "product",
    "language": "en",
    "question": "A 2017 Ford Escape has 125,000 miles, but the check engine light is on today. What should the agent avoid?",
    "options": [
      "Treating it as clearly qualified.",
      "Asking what issue is happening.",
      "Clarifying whether it still drives.",
      "Noting there is a warning light."
    ],
    "correct": 0,
    "explanation": "Current warning lights or issues must be clarified before transfer."
  },
  {
    "id": 47,
    "topic": "product",
    "language": "en",
    "question": "A 2016 Kia Optima starts but cannot shift into gear. What does that suggest?",
    "options": [
      "The issue is cosmetic only.",
      "The vehicle is automatically eligible.",
      "Mileage becomes the only rule.",
      "Good running condition is not confirmed."
    ],
    "correct": 3,
    "explanation": "A vehicle that cannot shift may not be in good running condition."
  },
  {
    "id": 48,
    "topic": "product",
    "language": "en",
    "question": "A 2019 Dodge Charger has accident body damage. What is safest to say?",
    "options": [
      "The agent can approve bodywork.",
      "Accident and bodywork damage are excluded.",
      "All collision repairs are covered.",
      "Insurance and coverage are the same."
    ],
    "correct": 1,
    "explanation": "The product focuses on mechanical breakdown, not collision or cosmetic repair."
  },
  {
    "id": 49,
    "topic": "product",
    "language": "en",
    "question": "A 2015 Hyundai Sonata runs well but needs worn brake pads. What should the agent know?",
    "options": [
      "Worn pads always qualify the car.",
      "The advisor must cover brake pads.",
      "Wear items are not the coverage focus.",
      "Wear items replace insurance."
    ],
    "correct": 2,
    "explanation": "Normal wear items should not be promised as covered."
  },
  {
    "id": 50,
    "topic": "product",
    "language": "en",
    "question": "A 2014 Jeep Wrangler has modified suspension. Which statement is safest?",
    "options": [
      "Modified parts themselves are excluded.",
      "All modified vehicles are fully covered.",
      "The bank decides modified repairs.",
      "All modifications improve eligibility."
    ],
    "correct": 0,
    "explanation": "Modified parts are excluded, though other parts may still be reviewed."
  },
  {
    "id": 51,
    "topic": "product",
    "language": "en",
    "question": "Where can approved repairs generally be handled?",
    "options": [
      "Only the original dealership.",
      "Only the finance company garage.",
      "Only repair shops in Texas.",
      "Authorized repair facilities nationwide."
    ],
    "correct": 3,
    "explanation": "Approved repairs are not limited to the original dealership."
  },
  {
    "id": 52,
    "topic": "product",
    "language": "en",
    "question": "A customer has a 2019 motorcycle with 12,000 miles. What should the agent remember?",
    "options": [
      "It qualifies if the advisor agrees.",
      "Motorcycles are excluded vehicle types.",
      "Coverage is automatic with insurance.",
      "Low mileage overrides vehicle type."
    ],
    "correct": 1,
    "explanation": "Motorcycles are listed among vehicles not covered."
  },
  {
    "id": 53,
    "topic": "product",
    "language": "en",
    "question": "The caller has a 2009 SUV, a 2018 sedan, and a 2022 EV. What should be checked before transfer?",
    "options": [
      "Whether the current qualifying vehicle is the 2018 sedan.",
      "Whether every vehicle has the same VIN.",
      "Whether the 2022 EV has low mileage only.",
      "Whether the oldest vehicle decides the file."
    ],
    "correct": 0,
    "explanation": "The agent should focus on a current vehicle that can meet year, type, mileage, and running rules."
  },
  {
    "id": 54,
    "topic": "product",
    "language": "en",
    "question": "A 2016 Ford Fusion has a current engine problem. What should the agent avoid promising?",
    "options": [
      "That the advisor reviews options.",
      "That mechanical coverage is different.",
      "That running condition matters.",
      "That the existing issue will be fixed."
    ],
    "correct": 3,
    "explanation": "Agents must not promise coverage for existing or current issues."
  },
  {
    "id": 55,
    "topic": "product",
    "language": "en",
    "question": "How should factory warranty be compared with extended coverage?",
    "options": [
      "Factory warranty starts after coverage.",
      "They are the exact same product.",
      "Insurance renews factory warranty.",
      "Factory warranty is limited; extended coverage is separate."
    ],
    "correct": 3,
    "explanation": "Factory warranty and extended coverage are different concepts."
  },
  {
    "id": 56,
    "topic": "product",
    "language": "en",
    "question": "What is the key insurance distinction?",
    "options": [
      "Coverage is required like insurance.",
      "Insurance covers every mechanical issue.",
      "Insurance and coverage are identical.",
      "Insurance covers accidents, not breakdown focus."
    ],
    "correct": 3,
    "explanation": "Agents must separate accident insurance from mechanical breakdown coverage."
  },
  {
    "id": 57,
    "topic": "product",
    "language": "en",
    "question": "A customer asks if the plan can add coverage after factory coverage ends. What is accurate?",
    "options": [
      "It may provide additional miles after factory coverage.",
      "It only covers accident liability.",
      "It removes the need for insurance.",
      "It always renews the factory warranty."
    ],
    "correct": 0,
    "explanation": "Extended coverage is separate and can add mechanical protection after factory coverage."
  },
  {
    "id": 58,
    "topic": "product",
    "language": "en",
    "question": "A financed electric vehicle is under 175,000 miles. What should the agent do?",
    "options": [
      "Treat financing as the main rule.",
      "Do not treat it as eligible.",
      "Transfer because mileage is fine.",
      "Ignore the electric vehicle rule."
    ],
    "correct": 1,
    "explanation": "Financing does not override an electric-vehicle exclusion."
  },
  {
    "id": 59,
    "topic": "product",
    "language": "en",
    "question": "The caller does not know exact mileage but thinks it is around 170,000. What is best?",
    "options": [
      "Assume it is under the limit.",
      "Mark XFER because it is close.",
      "Say mileage does not matter.",
      "Clarify carefully before treating it as qualified."
    ],
    "correct": 3,
    "explanation": "When near the limit, the agent should not assume eligibility."
  },
  {
    "id": 60,
    "topic": "product",
    "language": "en",
    "question": "Which case should raise the strongest eligibility concern?",
    "options": [
      "2012 Mazda 3 with 90,000 miles.",
      "2018 Toyota Corolla with 120,000 miles.",
      "2019 Chevrolet Traverse with 182,000 miles.",
      "2015 Honda Civic with 75,000 miles."
    ],
    "correct": 2,
    "explanation": "Over 175,000 miles is outside the stated mileage rule."
  },
  {
    "id": 61,
    "topic": "product",
    "language": "en",
    "question": "A 2011 Subaru Outback has exactly 175,000 miles and runs normally. What is the best reading of the rule?",
    "options": [
      "It may still be within the mileage limit.",
      "It is automatically excluded by mileage.",
      "The year makes it impossible.",
      "It only qualifies if electric."
    ],
    "correct": 0,
    "explanation": "The rule says up to 175,000 miles; over that limit is the concern."
  },
  {
    "id": 62,
    "topic": "product",
    "language": "en",
    "question": "A 2012 Toyota Corolla has 175,001 miles and runs well. What should the agent do?",
    "options": [
      "Treat it as under the limit.",
      "Do not treat it as eligible by mileage.",
      "Ignore the extra mile.",
      "Transfer because it is a Toyota."
    ],
    "correct": 1,
    "explanation": "Even one mile over the limit is outside the basic guideline."
  },
  {
    "id": 63,
    "topic": "product",
    "language": "en",
    "question": "A 2023 Rivian truck has 20,000 miles and no issues. Which rule matters most?",
    "options": [
      "The low mileage clears the file.",
      "Electric vehicle status blocks eligibility.",
      "The truck body style is enough.",
      "Newer vehicles always qualify."
    ],
    "correct": 1,
    "explanation": "Electric vehicles remain excluded regardless of mileage."
  },
  {
    "id": 64,
    "topic": "product",
    "language": "en",
    "question": "A 2018 Lamborghini has 22,000 miles and runs well. What should the agent remember?",
    "options": [
      "Exotic exceptions can be excluded.",
      "Low mileage overrides all rules.",
      "The bank decides the vehicle type.",
      "It qualifies because it is newer than 2011."
    ],
    "correct": 0,
    "explanation": "The training material lists exotic exceptions such as Lamborghinis as not covered."
  },
  {
    "id": 65,
    "topic": "product",
    "language": "en",
    "question": "A 2017 cargo trailer is attached to the customer’s truck. What should be treated carefully?",
    "options": [
      "Trailers are excluded vehicle types.",
      "Trailers qualify if the truck runs.",
      "Trailers qualify with low mileage.",
      "The advisor must cover trailers."
    ],
    "correct": 0,
    "explanation": "Trailers are listed as excluded vehicle types."
  },
  {
    "id": 66,
    "topic": "product",
    "language": "en",
    "question": "A 2016 Honda CR-V has 140,000 miles but is currently in the shop and not drivable. What is the issue?",
    "options": [
      "Mileage is the only factor.",
      "Good running condition is not confirmed.",
      "The model is before 2011.",
      "SUVs are always excluded."
    ],
    "correct": 1,
    "explanation": "The vehicle must still run; current non-drivable status is a concern."
  },
  {
    "id": 67,
    "topic": "product",
    "language": "en",
    "question": "A 2015 Nissan Sentra has 135,000 miles and only needs an oil change. What is the safest view?",
    "options": [
      "Routine maintenance is not the coverage focus.",
      "Oil changes make it ineligible.",
      "The advisor covers all maintenance.",
      "The vehicle is electric by default."
    ],
    "correct": 0,
    "explanation": "Normal maintenance should not be promised as covered."
  },
  {
    "id": 68,
    "topic": "product",
    "language": "en",
    "question": "A 2020 Chevy Bolt has 60,000 miles. What is the main qualification problem?",
    "options": [
      "It is an electric vehicle.",
      "It is above the mileage limit.",
      "It is older than 2011.",
      "It has no finance history."
    ],
    "correct": 0,
    "explanation": "Electric vehicles are excluded."
  },
  {
    "id": 69,
    "topic": "product",
    "language": "en",
    "question": "A 2013 Ford Focus has 172,000 miles and a transmission slipping today. What should happen before transfer?",
    "options": [
      "Clarify the current mechanical issue.",
      "Treat mileage as enough.",
      "Promise transmission repair.",
      "Skip because it is after 2011."
    ],
    "correct": 0,
    "explanation": "Current mechanical issues must be clarified and not promised as covered."
  },
  {
    "id": 70,
    "topic": "product",
    "language": "en",
    "question": "A 2021 Toyota Corolla has 40,000 miles, runs well, and is not electric. What is the safest conclusion?",
    "options": [
      "It appears basically eligible to continue.",
      "It is excluded because it is too new.",
      "It is excluded because mileage is low.",
      "It must be marked wrong vehicle."
    ],
    "correct": 0,
    "explanation": "This case meets the basic year, mileage, type, and running-condition rules."
  },
  {
    "id": 71,
    "topic": "callflow",
    "language": "en",
    "question": "During the 3-way process, the customer hangs up before speaking to the Service Advisor. What should the agent do?",
    "options": [
      "Mark Dead Air for the advisor.",
      "Use Hung Up Both Lines and Call Back.",
      "Use Leave 3-Way Call and XFER.",
      "Keep the advisor ringing alone."
    ],
    "correct": 1,
    "explanation": "This prevents a dead-air transfer to the Service Advisor."
  },
  {
    "id": 72,
    "topic": "callflow",
    "language": "en",
    "question": "Why is “Leave 3-Way Call” dangerous after the customer hangs up?",
    "options": [
      "It changes vehicle mileage.",
      "It sends an automatic Spanish route.",
      "It removes the callback option.",
      "The advisor may receive a ringing call with no customer."
    ],
    "correct": 3,
    "explanation": "Leaving the 3-way can create a dead-air call for the Service Advisor."
  },
  {
    "id": 73,
    "topic": "callflow",
    "language": "en",
    "question": "The Service Advisor joins but stays silent for several seconds. What should the agent do?",
    "options": [
      "Stay silent until someone hangs up.",
      "Tell the customer to call back.",
      "Prompt the advisor and control the handoff.",
      "Disconnect and mark XFER."
    ],
    "correct": 2,
    "explanation": "The agent should prevent silence by getting the advisor’s attention."
  },
  {
    "id": 74,
    "topic": "callflow",
    "language": "en",
    "question": "Who should speak first when the Service Advisor joins?",
    "options": [
      "No one until 15 seconds pass.",
      "The Service Advisor.",
      "The customer without introduction.",
      "The agent before anyone else."
    ],
    "correct": 1,
    "explanation": "The agent should wait for the Service Advisor to answer before introducing the customer."
  },
  {
    "id": 75,
    "topic": "callflow",
    "language": "en",
    "question": "What confirms a real handoff?",
    "options": [
      "The advisor line only rang once.",
      "The customer said hello before transfer.",
      "The agent pressed transfer.",
      "Advisor and customer are actively talking."
    ],
    "correct": 3,
    "explanation": "A valid handoff requires active communication, not just dialing."
  },
  {
    "id": 76,
    "topic": "callflow",
    "language": "en",
    "question": "The customer asks the Service Advisor for a callback. How should it be handled?",
    "options": [
      "Call Back, not clean XFER.",
      "XFER because the advisor joined.",
      "DAIR because the call changed.",
      "SPANIS because callback was requested."
    ],
    "correct": 0,
    "explanation": "A callback request with the advisor should not count as a clean XFER."
  },
  {
    "id": 77,
    "topic": "callflow",
    "language": "en",
    "question": "The customer immediately asks the advisor for Spanish before any English conversation. What is the issue?",
    "options": [
      "The vehicle becomes wrong number.",
      "It should be Answering Machine.",
      "The transfer is valid because lines connected.",
      "No meaningful English SA conversation occurred."
    ],
    "correct": 3,
    "explanation": "An English XFER needs meaningful English communication with the Service Advisor."
  },
  {
    "id": 78,
    "topic": "callflow",
    "language": "en",
    "question": "The customer speaks English with the Service Advisor for 18 seconds, then asks for Spanish. How should QA view it?",
    "options": [
      "Automatic SPANIS with no review.",
      "The English handoff requirement was likely met.",
      "Invalid only because Spanish was mentioned.",
      "Dead Air because language changed."
    ],
    "correct": 1,
    "explanation": "If meaningful English conversation happened long enough first, the handoff can still be valid."
  },
  {
    "id": 79,
    "topic": "callflow",
    "language": "en",
    "question": "A child answers and agrees to “hear options” for the household vehicle. What should the agent do?",
    "options": [
      "Transfer because someone agreed.",
      "Ask for an adult decision maker.",
      "Mark XFER after the yes.",
      "Ask the child for mileage only."
    ],
    "correct": 1,
    "explanation": "A child cannot provide valid decision-making approval."
  },
  {
    "id": 80,
    "topic": "callflow",
    "language": "en",
    "question": "A co-signer says they do not make vehicle decisions. What is the best path?",
    "options": [
      "Transfer because they are on file.",
      "Ask for the decision maker or callback.",
      "Treat it as completed XFER.",
      "Push until they agree."
    ],
    "correct": 1,
    "explanation": "The call should not be forced if the person cannot decide."
  },
  {
    "id": 81,
    "topic": "callflow",
    "language": "en",
    "question": "The customer answers “yes” to everything but gives unrelated replies. What should the agent verify?",
    "options": [
      "That the customer likes the vehicle color.",
      "That the file has the street address.",
      "That the advisor can close faster.",
      "That they truly understand the call."
    ],
    "correct": 3,
    "explanation": "Polite agreement is not enough if comprehension is doubtful."
  },
  {
    "id": 82,
    "topic": "callflow",
    "language": "en",
    "question": "While waiting for the advisor, silence lasts too long. What helps protect the call?",
    "options": [
      "Ask for card information.",
      "Ask light vehicle-related questions.",
      "Promise the advisor is ready now.",
      "Mute until the advisor joins."
    ],
    "correct": 1,
    "explanation": "Waiting questions reduce dead air and keep the customer engaged."
  },
  {
    "id": 83,
    "topic": "callflow",
    "language": "en",
    "question": "After qualifying, the customer says no to being transferred. What should the agent avoid?",
    "options": [
      "Respecting the refusal.",
      "Dialing the advisor anyway.",
      "Using the correct disposition.",
      "Documenting the outcome."
    ],
    "correct": 1,
    "explanation": "Qualification alone does not allow transfer without consent."
  },
  {
    "id": 84,
    "topic": "callflow",
    "language": "en",
    "question": "The advisor line rings but no advisor answers. What should the agent avoid?",
    "options": [
      "Following callback handling if needed.",
      "Counting it as valid XFER.",
      "Protecting the customer experience.",
      "Avoiding dead-air transfer."
    ],
    "correct": 1,
    "explanation": "A valid XFER requires a Service Advisor and customer handoff."
  },
  {
    "id": 85,
    "topic": "callflow",
    "language": "en",
    "question": "On a live transfer audit, the agent introduces the customer before the advisor speaks. What is the risk?",
    "options": [
      "Mileage is reset.",
      "The call becomes voicemail.",
      "The handoff may not be controlled.",
      "The customer becomes co-signer."
    ],
    "correct": 2,
    "explanation": "The advisor should speak first so the introduction lands cleanly."
  },
  {
    "id": 86,
    "topic": "callflow",
    "language": "en",
    "question": "The customer hangs up after the agent introduction but before any advisor conversation. What should happen?",
    "options": [
      "Count it because intro happened.",
      "Use Answering Machine.",
      "Do not count it as clean XFER.",
      "Mark SPXFER automatically."
    ],
    "correct": 2,
    "explanation": "Introduction alone does not prove an active advisor/customer conversation."
  },
  {
    "id": 87,
    "topic": "callflow",
    "language": "en",
    "question": "During an English transfer wait, the customer starts speaking Spanish. What should the agent consider?",
    "options": [
      "The vehicle is automatically invalid.",
      "English transfer must be forced.",
      "DNC is required immediately.",
      "Preferred language may need confirmation."
    ],
    "correct": 3,
    "explanation": "A language switch can indicate the customer needs Spanish handling."
  },
  {
    "id": 88,
    "topic": "callflow",
    "language": "en",
    "question": "The agent stays on the line for a long time after both parties are already talking. What is the coaching point?",
    "options": [
      "Stay until the full sale closes.",
      "Leave before the advisor speaks.",
      "Mute and count extra time.",
      "Stay enough, not longer than necessary."
    ],
    "correct": 3,
    "explanation": "The 15-second rule protects the handoff; it is not a reason to stay unnecessarily."
  },
  {
    "id": 89,
    "topic": "callflow",
    "language": "en",
    "question": "Before transfer, the customer says, “I don’t want to talk to anyone else.” What should the agent avoid?",
    "options": [
      "Clarifying the concern.",
      "Offering callback if needed.",
      "Transferring without renewed consent.",
      "Respecting the refusal."
    ],
    "correct": 2,
    "explanation": "A clear refusal means consent is not present."
  },
  {
    "id": 90,
    "topic": "callflow",
    "language": "en",
    "question": "The advisor says hello, the customer says hello, then both stop. What should the agent do before leaving?",
    "options": [
      "Confirm they are actively talking.",
      "Leave immediately after two hellos.",
      "Mark XFER and mute forever.",
      "Ask for payment details."
    ],
    "correct": 0,
    "explanation": "Two greetings may not be enough to confirm an active handoff."
  },
  {
    "id": 91,
    "topic": "dosdonts",
    "language": "en",
    "question": "When is DAIR the best disposition?",
    "options": [
      "The customer asks for callback.",
      "No real person ever responds on the line.",
      "The customer says not interested.",
      "The customer requests Spanish."
    ],
    "correct": 1,
    "explanation": "DAIR is for complete dead air, not a normal refusal or callback."
  },
  {
    "id": 92,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer hears the script and hangs up. Which disposition usually fits better than DAIR?",
    "options": [
      "Manage",
      "NI",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "If there was contact and the customer drops after the pitch, NI usually fits better than DAIR."
  },
  {
    "id": 93,
    "topic": "dosdonts",
    "language": "en",
    "question": "The caller says, “Stop calling me or I’ll report this.” Which disposition fits?",
    "options": [
      "DNC",
      "XFER",
      "SPANIS",
      "CALLBK"
    ],
    "correct": 0,
    "explanation": "Removal requests, threats, or stop-calling language should be handled as DNC."
  },
  {
    "id": 94,
    "topic": "dosdonts",
    "language": "en",
    "question": "The call reaches a voicemail greeting. Which disposition fits?",
    "options": [
      "WRNGVE",
      "NI",
      "XFER",
      "A"
    ],
    "correct": 3,
    "explanation": "Answering Machine is used for voicemail or automated answering systems."
  },
  {
    "id": 95,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer is busy and still refuses after the callback rebuttal. What disposition fits?",
    "options": [
      "XFER",
      "CALLBK",
      "A",
      "DAIR"
    ],
    "correct": 1,
    "explanation": "A clear later-time request or callback outcome should be CALLBK."
  },
  {
    "id": 96,
    "topic": "dosdonts",
    "language": "en",
    "question": "A customer needs Spanish, and the agent routes blindly without a Spanish Service Advisor handoff. Which disposition fits?",
    "options": [
      "SPANIS",
      "XFER",
      "SPXFER",
      "DAIR"
    ],
    "correct": 0,
    "explanation": "SPANIS is for blind Spanish routing, not a direct Spanish transfer."
  },
  {
    "id": 97,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent directly connects a Spanish-speaking customer to a Spanish Service Advisor. Which disposition fits?",
    "options": [
      "CALLBK",
      "A",
      "SPXFER",
      "SPANIS"
    ],
    "correct": 2,
    "explanation": "SPXFER is for direct Spanish transfers."
  },
  {
    "id": 98,
    "topic": "dosdonts",
    "language": "en",
    "question": "A person says this is the wrong number. Which disposition area matters?",
    "options": [
      "Wrong Number handling.",
      "Clean English XFER.",
      "Answering Machine handling.",
      "Restroom pause handling."
    ],
    "correct": 0,
    "explanation": "Wrong number should not be forced into a transfer outcome."
  },
  {
    "id": 99,
    "topic": "dosdonts",
    "language": "en",
    "question": "What makes XFER valid?",
    "options": [
      "English transfer with real advisor/customer handoff.",
      "Agent dials without customer approval.",
      "Advisor only receives a ringing call.",
      "Customer hangs up before advisor speaks."
    ],
    "correct": 0,
    "explanation": "XFER should reflect a successful English transfer, not just a dial attempt."
  },
  {
    "id": 100,
    "topic": "dosdonts",
    "language": "en",
    "question": "Which case belongs in Needs Practice coaching?",
    "options": [
      "Agent confirms condition and gets consent.",
      "Agent clarifies language preference.",
      "Agent waits while both parties talk.",
      "Agent skips purpose and transfers confused customer."
    ],
    "correct": 3,
    "explanation": "Skipping the purpose and transferring a confused customer creates invalid/QA risk."
  },
  {
    "id": 101,
    "topic": "script",
    "language": "es",
    "question": "Durante una revisión de script, el cliente pregunta si la llamada bajará sus pagos mensuales y el agente transfiere sin responder. ¿Qué debería marcar QA?",
    "options": [
      "No se aclaró la duda sobre pagos.",
      "El millaje se revisó demasiado tarde.",
      "La espera del transfer fue algo larga.",
      "No se confirmó la ubicación del dealer."
    ],
    "correct": 0,
    "explanation": "El agente debe responder o aclarar preguntas importantes del cliente antes de transferir."
  },
  {
    "id": 102,
    "topic": "script",
    "language": "es",
    "question": "En la apertura, alguien pregunta: “¿Entonces esto viene de mi banco?” ¿Qué respuesta mantiene la llamada más segura?",
    "options": [
      "Su banco pidió que llamáramos.",
      "Su lender aprobó la cobertura.",
      "Trabajamos con dealers y registros vehiculares.",
      "La financiera envió el archivo."
    ],
    "correct": 2,
    "explanation": "El agente no debe decir que el banco o lender entregó el archivo."
  },
  {
    "id": 103,
    "topic": "script",
    "language": "es",
    "question": "Antes de preparar el transfer, el agente dice: “No tiene ningún costo; solo escuche.” ¿Por qué es riesgoso?",
    "options": [
      "Puede sonar como promesa de servicio gratis.",
      "Confirma la condición del vehículo con claridad.",
      "Le da demasiado contexto al Service Advisor.",
      "Explica el seguro demasiado temprano."
    ],
    "correct": 0,
    "explanation": "Evita frases que puedan entenderse como cobertura gratis o costo garantizado en cero."
  },
  {
    "id": 104,
    "topic": "script",
    "language": "es",
    "question": "Después de preguntar si el vehículo funciona, el cliente dice “okay”, pero nunca acepta hablar con el Service Advisor. ¿Qué falta?",
    "options": [
      "Marca y modelo exactos.",
      "Dirección completa del cliente.",
      "Aprobación clara para transferir.",
      "Cotización mensual final."
    ],
    "correct": 2,
    "explanation": "Confirmar que el vehículo funciona no es lo mismo que aceptar la transferencia."
  },
  {
    "id": 105,
    "topic": "script",
    "language": "es",
    "question": "Un cliente responde en inglés, pero parece inseguro y confundido con preguntas básicas. ¿Qué debe hacer el agente antes de avanzar?",
    "options": [
      "Preguntar el idioma de preferencia.",
      "Forzar un English XFER.",
      "Leer el script más rápido.",
      "Marcar NI inmediatamente."
    ],
    "correct": 0,
    "explanation": "Si no está claro que entiende, debe verificarse el idioma de preferencia."
  },
  {
    "id": 106,
    "topic": "script",
    "language": "es",
    "question": "El agente cambia palabras pequeñas de conexión, pero mantiene el sentido requerido. ¿Cuándo es aceptable?",
    "options": [
      "Cuando omite el nombre de la compañía.",
      "Cuando ignora la condición del vehículo.",
      "Cuando mantiene los puntos de compliance.",
      "Cuando asume aprobación para transferir."
    ],
    "correct": 2,
    "explanation": "Puede sonar natural solo si conserva el significado requerido y los puntos de compliance."
  },
  {
    "id": 107,
    "topic": "script",
    "language": "es",
    "question": "Antes de marcar, el cliente pregunta: “¿De qué se trata?” ¿Qué respuesta es más segura?",
    "options": [
      "Se está renovando su garantía de fábrica.",
      "El dealer ya aprobó un plan.",
      "Esto mantiene legal su vehículo.",
      "Es una revisión de posibles opciones de cobertura."
    ],
    "correct": 3,
    "explanation": "La llamada debe presentarse como revisión de cobertura, no como renovación obligatoria o garantizada."
  },
  {
    "id": 108,
    "topic": "script",
    "language": "es",
    "question": "En una revisión de compliance, el cliente pregunta: “¿Quiénes son exactamente?” ¿Qué debe evitar el agente?",
    "options": [
      "Explicar con calma el propósito.",
      "Hacerse pasar por el dealer.",
      "Identificarse como Vehicle Services Group.",
      "Continuar solo después de aprobación."
    ],
    "correct": 1,
    "explanation": "El agente no debe decir que es del dealer, banco, fabricante o marca del vehículo."
  },
  {
    "id": 109,
    "topic": "script",
    "language": "es",
    "question": "Durante la introducción, el agente dice: “Su garantía expiró y este es su aviso final.” ¿Cuál es el problema?",
    "options": [
      "Verifica el idioma de preferencia.",
      "Da la disposición correcta.",
      "Crea urgencia no respaldada.",
      "Confirma primero al Service Advisor."
    ],
    "correct": 2,
    "explanation": "Crear urgencia no respaldada puede generar riesgo de compliance y QA."
  },
  {
    "id": 110,
    "topic": "script",
    "language": "es",
    "question": "Antes de verificar elegibilidad, el cliente pregunta el precio. ¿Qué debe hacer el agente?",
    "options": [
      "Saltar condición y transferir rápido.",
      "Llevar el tema de precio al Service Advisor después de calificar.",
      "Decir que la cotización siempre es gratis.",
      "Dar el pago mensual más barato."
    ],
    "correct": 1,
    "explanation": "El agente no cotiza precio; debe calificar y hacer puente al Service Advisor."
  },
  {
    "id": 111,
    "topic": "script",
    "language": "es",
    "question": "Un cliente dice: “Gracias, estoy bien”, y el agente solo responde “sí” antes de transferir. ¿Qué faltó?",
    "options": [
      "Confirmar ubicación del dealer.",
      "Manejo de objeción y consentimiento.",
      "Solo cálculo de millaje.",
      "Corrección de pause code."
    ],
    "correct": 1,
    "explanation": "Una respuesta casual no reemplaza un rebuttal ni prueba consentimiento."
  },
  {
    "id": 112,
    "topic": "script",
    "language": "es",
    "question": "La información del vehículo en el archivo parece incorrecta. ¿Qué dirección del script es mejor?",
    "options": [
      "Decir que el archivo nunca falla.",
      "Marcar DNC porque el dato está mal.",
      "Tratarlo como verificación del vehículo actual.",
      "Transferir antes de preguntar."
    ],
    "correct": 2,
    "explanation": "La información incorrecta o desactualizada debe usarse para verificar el vehículo actual."
  },
  {
    "id": 113,
    "topic": "script",
    "language": "es",
    "question": "El agente dice: “El Service Advisor le va a bajar el pago.” ¿Qué está mal?",
    "options": [
      "Hace el handoff demasiado limpio.",
      "Promete un resultado que el agente no controla.",
      "Pide aprobación demasiado clara.",
      "Confirma elegibilidad muy lento."
    ],
    "correct": 1,
    "explanation": "El agente no debe prometer pagos más bajos ni resultados garantizados."
  },
  {
    "id": 114,
    "topic": "script",
    "language": "es",
    "question": "El agente dice: “Se lo presento, okay?” y el cliente pregunta: “¿A quién?” ¿Qué debe pasar?",
    "options": [
      "Marcar XFER después de la pregunta.",
      "Marcar primero y explicar después.",
      "Ignorarlo como comentario pequeño.",
      "Aclarar el rol del Service Advisor."
    ],
    "correct": 3,
    "explanation": "Si el cliente no entiende la transferencia, el agente debe aclarar antes de marcar."
  },
  {
    "id": 115,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta si debe comprar algo hoy. ¿Qué respuesta es más segura?",
    "options": [
      "El agente puede aprobar la compra.",
      "El banco ya eligió el plan.",
      "Sí, la compra es obligatoria hoy.",
      "El Service Advisor revisa opciones; el cliente decide."
    ],
    "correct": 3,
    "explanation": "El agente no debe presentar la llamada como obligatoria ni forzar una compra."
  },
  {
    "id": 116,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta de qué vehículo hablan, pero el agente solo tiene información financiera. ¿Qué es más seguro?",
    "options": [
      "Usar la info financiera y verificar el vehículo actual.",
      "Inventar la marca y modelo más probable.",
      "Saltar la verificación del vehículo.",
      "Decir que el cliente debería saber."
    ],
    "correct": 0,
    "explanation": "Sé transparente sobre la información disponible y verifica el vehículo actual."
  },
  {
    "id": 117,
    "topic": "script",
    "language": "es",
    "question": "Antes de marcar, el agente dice que la cobertura viene “del fabricante.” ¿Qué debería marcar QA?",
    "options": [
      "Representar mal el origen de la cobertura.",
      "Usar claramente el nombre del cliente.",
      "Esperar a que hable el Service Advisor.",
      "Preguntar si el vehículo funciona."
    ],
    "correct": 0,
    "explanation": "El agente no debe decir que representa al fabricante o marca del vehículo."
  },
  {
    "id": 118,
    "topic": "script",
    "language": "es",
    "question": "El cliente hace una pregunta directa durante la apertura. ¿Cuál es la mejor regla?",
    "options": [
      "Responder o aclarar antes de avanzar.",
      "Ignorar preguntas hasta que entre el Service Advisor.",
      "Transferir más rápido para evitar objeciones.",
      "Repetir el script más fuerte."
    ],
    "correct": 0,
    "explanation": "Preguntas sin responder pueden hacer que la transferencia sea confusa o inválida."
  },
  {
    "id": 119,
    "topic": "script",
    "language": "es",
    "question": "El agente obtiene aprobación, pero nunca presenta al cliente por nombre al Service Advisor. ¿Cuál es el problema?",
    "options": [
      "La llamada se volvió voicemail.",
      "El cliente pidió RR.",
      "El vehículo se volvió eléctrico.",
      "El handoff quedó incompleto."
    ],
    "correct": 3,
    "explanation": "El handoff debe incluir una presentación clara, no solo conectar líneas."
  },
  {
    "id": 120,
    "topic": "script",
    "language": "es",
    "question": "Justo antes del transfer, el cliente dice: “No entiendo qué quiere decir.” ¿Qué no debe hacer el agente?",
    "options": [
      "Preguntar idioma de preferencia si aplica.",
      "Repetir el propósito de forma simple.",
      "Confirmar comprensión primero.",
      "Forzar el transfer sin aclarar."
    ],
    "correct": 3,
    "explanation": "La confusión debe aclararse antes de considerar limpio el consentimiento para transferir."
  },
  {
    "id": 121,
    "topic": "objections",
    "language": "es",
    "question": "Durante manejo de objeciones, el cliente dice “no me interesa” pero no da razón. ¿Cuál es el mejor primer paso?",
    "options": [
      "Transferir antes de que cuelgue.",
      "Preguntar una razón breve para trabajarla.",
      "Discutir sobre costos de reparación.",
      "Marcar DNC inmediatamente."
    ],
    "correct": 1,
    "explanation": "El agente necesita entender la razón antes de elegir el mejor rebuttal."
  },
  {
    "id": 122,
    "topic": "objections",
    "language": "es",
    "question": "Aparece una objeción de tiempo: “Estoy ocupado.” El cliente no rechaza totalmente. ¿Qué debe evitar el agente?",
    "options": [
      "Prometer que tomará menos de un minuto.",
      "Respetar la objeción de tiempo.",
      "Preguntar si más tarde funciona.",
      "Ofrecer una mejor hora de callback."
    ],
    "correct": 0,
    "explanation": "El agente no debe prometer un tiempo exacto o corto que no controla."
  },
  {
    "id": 123,
    "topic": "objections",
    "language": "es",
    "question": "Surge una duda de scam antes de avanzar. ¿Qué tono es más seguro?",
    "options": [
      "Calmado, transparente y controlado.",
      "Defensivo y discutidor.",
      "Rápido y despectivo.",
      "Callado hasta que deje de hablar."
    ],
    "correct": 0,
    "explanation": "Las dudas de scam se manejan con confianza y transparencia, no presión."
  },
  {
    "id": 124,
    "topic": "objections",
    "language": "es",
    "question": "En práctica de objeciones, el cliente dice que ya tiene seguro. ¿Qué diferencia importa?",
    "options": [
      "El seguro paga todo tipo de reparación.",
      "La cobertura reemplaza el seguro legal.",
      "Seguro y cobertura son iguales.",
      "El seguro cubre accidentes; la cobertura es mecánica."
    ],
    "correct": 3,
    "explanation": "Seguro y cobertura por fallas mecánicas deben separarse con claridad."
  },
  {
    "id": 125,
    "topic": "objections",
    "language": "es",
    "question": "Un cliente dice: “Ya tengo garantía.” ¿Cuál es el posicionamiento más seguro?",
    "options": [
      "Prometer un reemplazo más barato.",
      "Decirle que cancele el plan.",
      "Revisar opciones actualizadas o adicionales.",
      "Decir que su plan actual no sirve."
    ],
    "correct": 2,
    "explanation": "La cobertura existente se maneja como revisión, no como ataque."
  },
  {
    "id": 126,
    "topic": "objections",
    "language": "es",
    "question": "Cuando preguntan “¿De dónde sacaron mi información?”, ¿qué respuesta debe evitarse?",
    "options": [
      "La llamada es revisión de elegibilidad.",
      "Trabajamos con dealers.",
      "Trabajamos con registros vehiculares.",
      "Su banco nos envió el archivo del préstamo."
    ],
    "correct": 3,
    "explanation": "Decir que el banco dio el archivo crea riesgo de compliance."
  },
  {
    "id": 127,
    "topic": "objections",
    "language": "es",
    "question": "Alguien pregunta: “¿Qué vehículo?” y suena desconfiado. ¿Qué ayuda más?",
    "options": [
      "Decir que la pregunta no importa.",
      "Inventar detalles para sonar seguro.",
      "Transferir porque la sospecha es normal.",
      "Explicar el límite de pantalla y verificar el vehículo."
    ],
    "correct": 3,
    "explanation": "La transparencia sobre la información disponible ayuda a crear confianza."
  },
  {
    "id": 128,
    "topic": "objections",
    "language": "es",
    "question": "Antes de cualquier intento de transfer, el cliente pregunta: “¿Cuánto cuesta?” antes de confirmar condición. ¿Qué respuesta es más segura?",
    "options": [
      "El precio depende y el Service Advisor lo revisa.",
      "Siempre es gratis hoy.",
      "El agente puede aprobar un descuento.",
      "El banco fija el pago más bajo."
    ],
    "correct": 0,
    "explanation": "El agente puede llevar el precio al Service Advisor, pero no debe cotizar ni prometer."
  },
  {
    "id": 129,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Mándeme un email primero.” ¿Qué debe evitar el agente?",
    "options": [
      "Explicar que el Service Advisor revisa detalles.",
      "Prometer enviar documentos de póliza.",
      "Preguntar si el vehículo funciona.",
      "Confirmar primero la condición del vehículo."
    ],
    "correct": 1,
    "explanation": "El agente no debe prometer emails o documentos que no puede enviar."
  },
  {
    "id": 130,
    "topic": "objections",
    "language": "es",
    "question": "Aparece la objeción de vehículo totalizado. ¿Qué debe hacer después el agente?",
    "options": [
      "Marcar XFER si escucha.",
      "Prometer cobertura sobre la pérdida.",
      "Transferir por el vehículo totalizado.",
      "Preguntar por un vehículo actual manejable."
    ],
    "correct": 3,
    "explanation": "Un vehículo totalizado no debe avanzar; verifica si existe un vehículo actual."
  },
  {
    "id": 131,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Ese no es mi carro.” ¿Cuál es la mejor ruta?",
    "options": [
      "Cerrar la llamada como DNC.",
      "Decir que el archivo siempre está correcto.",
      "Transferir sin corregir.",
      "Verificar el vehículo actual."
    ],
    "correct": 3,
    "explanation": "La información de vehículo incorrecta debe llevar a verificación, no a transfer forzado."
  },
  {
    "id": 132,
    "topic": "objections",
    "language": "es",
    "question": "El cliente tiene varios vehículos. ¿Qué debe confirmarse antes de transferir?",
    "options": [
      "Al menos un vehículo actual funciona y podría calificar.",
      "Todos tienen el mismo millaje.",
      "Todos fueron comprados juntos.",
      "El cliente sabe cada VIN."
    ],
    "correct": 0,
    "explanation": "Al menos un vehículo actual debe cumplir con la ruta básica de calificación."
  },
  {
    "id": 133,
    "topic": "objections",
    "language": "es",
    "question": "Antes de que el Service Advisor revise algo, el cliente dice: “Eso es muy caro.” ¿Qué debe hacer el agente?",
    "options": [
      "Replantear costo frente a reparaciones grandes.",
      "Decir que el precio es fijo.",
      "Prometer el plan más barato.",
      "Aceptar y cerrar de inmediato."
    ],
    "correct": 0,
    "explanation": "El agente puede replantear valor, pero no prometer un precio específico."
  },
  {
    "id": 134,
    "topic": "objections",
    "language": "es",
    "question": "Aparece objeción de contacto repetido: “Ya llamaron y dije que no.” ¿Cuál es el ángulo más seguro?",
    "options": [
      "Decir que el rechazo expiró.",
      "Transferir directo sin consentimiento.",
      "Amenazar con perder derechos para manejar.",
      "Mencionar opciones actualizadas."
    ],
    "correct": 3,
    "explanation": "Las opciones actualizadas crean curiosidad sin presión ni afirmaciones falsas."
  },
  {
    "id": 135,
    "topic": "objections",
    "language": "es",
    "question": "El cliente es grosero y pide que no lo llamen más. ¿Cuál es el camino profesional?",
    "options": [
      "Seguir rebatiendo agresivamente.",
      "Responder con el mismo tono.",
      "Mantener la calma y procesar remoción.",
      "Transferir para evitar conflicto."
    ],
    "correct": 2,
    "explanation": "Pedir que no llamen más debe manejarse profesionalmente, normalmente como DNC."
  },
  {
    "id": 136,
    "topic": "objections",
    "language": "es",
    "question": "Un co-signer dice que no es el dueño. ¿Qué debe verificar el agente?",
    "options": [
      "Si conoce el nombre del Service Advisor.",
      "Si puede tomar decisiones.",
      "Si el vehículo tiene radio.",
      "Si quiere una cotización gratis."
    ],
    "correct": 1,
    "explanation": "Ser co-signer no significa automáticamente tener autoridad de decisión."
  },
  {
    "id": 137,
    "topic": "objections",
    "language": "es",
    "question": "El cliente responde “sure” con educación, pero suena distraído y desconectado. ¿Cuál es el riesgo?",
    "options": [
      "El Service Advisor no puede hablar primero.",
      "El vehículo queda modificado.",
      "El millaje queda desconocido.",
      "El consentimiento puede no ser significativo."
    ],
    "correct": 3,
    "explanation": "El agente debe confirmar comprensión en vez de confiar en una aceptación débil."
  },
  {
    "id": 138,
    "topic": "objections",
    "language": "es",
    "question": "Antes del transfer, el cliente pregunta: “¿Puede decirme los detalles del plan?” ¿Cuál es el mejor puente?",
    "options": [
      "El cliente debe comprar antes de conocer detalles.",
      "El agente debe inventar términos del plan.",
      "Los detalles nunca se explican.",
      "El Service Advisor revisa detalles después de verificar."
    ],
    "correct": 3,
    "explanation": "El agente no debe inventar detalles; debe hacer puente al Service Advisor."
  },
  {
    "id": 139,
    "topic": "objections",
    "language": "es",
    "question": "Después de batallar con el script en inglés, el cliente dice: “Necesito español.” ¿Qué debe hacer el agente?",
    "options": [
      "Ignorarlo hasta que entre el Service Advisor.",
      "Marcar XFER como transferencia en inglés.",
      "Usar el manejo correcto en español.",
      "Continuar el script en inglés."
    ],
    "correct": 2,
    "explanation": "El idioma de preferencia debe respetarse y rutearse correctamente."
  },
  {
    "id": 140,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pregunta si el Service Advisor tomará “solo unos segundos.” ¿Qué debe evitar el agente?",
    "options": [
      "Decir que el Service Advisor revisa detalles.",
      "Hacer preguntas de espera sobre el vehículo.",
      "Garantizar una espera corta.",
      "Mantener al cliente conectado."
    ],
    "correct": 2,
    "explanation": "El agente no controla el tiempo del Service Advisor y no debe prometerlo."
  },
  {
    "id": 141,
    "topic": "product",
    "language": "es",
    "question": "¿Qué caso es más seguro para continuar hacia transfer?",
    "options": [
      "Toyota RAV4 2010, 80,000 millas, funciona bien.",
      "Tesla Model 3 2022, 30,000 millas, funciona bien.",
      "Honda Accord 2016, 110,000 millas, funciona bien.",
      "Ford F-150 2019, 181,000 millas, funciona bien."
    ],
    "correct": 2,
    "explanation": "El sedán de gasolina 2016 cumple mejor con año, millaje, tipo de vehículo y condición."
  },
  {
    "id": 142,
    "topic": "product",
    "language": "es",
    "question": "Un Tesla Model Y 2020 tiene 30,000 millas y funciona bien. ¿Qué pesa más?",
    "options": [
      "Que funciona bien anula el tipo.",
      "El Service Advisor debe aprobarlo.",
      "Los vehículos eléctricos están excluidos.",
      "El bajo millaje lo hace elegible."
    ],
    "correct": 2,
    "explanation": "Los vehículos eléctricos están excluidos aunque tengan bajo millaje."
  },
  {
    "id": 143,
    "topic": "product",
    "language": "es",
    "question": "Un Chevrolet Malibu 2011 tiene 176,200 millas y funciona bien. ¿Qué debe entender el agente?",
    "options": [
      "Está sobre el límite de millaje.",
      "Califica si fue financiado recientemente.",
      "El año por sí solo lo hace seguro.",
      "Funcionar bien elimina el límite."
    ],
    "correct": 0,
    "explanation": "El límite básico es hasta 175,000 millas."
  },
  {
    "id": 144,
    "topic": "product",
    "language": "es",
    "question": "Un Nissan Altima 2010 tiene 92,000 millas y no tiene problemas. ¿Cuál es la preocupación?",
    "options": [
      "El modelo es anterior a 2011.",
      "No tener problemas es sospechoso.",
      "Falta seguro.",
      "El millaje es demasiado alto."
    ],
    "correct": 0,
    "explanation": "Los vehículos anteriores a 2011 quedan fuera de la regla básica de elegibilidad."
  },
  {
    "id": 145,
    "topic": "product",
    "language": "es",
    "question": "Un Toyota Camry 2018 enciende, pero el cliente dice que le falta una llanta. ¿Qué es mejor?",
    "options": [
      "Ignorarlo porque el motor prende.",
      "Tratarlo como buen funcionamiento.",
      "Prometer reemplazo de llanta.",
      "Aclarar si se puede manejar seguro ahora."
    ],
    "correct": 3,
    "explanation": "Una llanta faltante crea duda de condición actual y debe aclararse."
  },
  {
    "id": 146,
    "topic": "product",
    "language": "es",
    "question": "Un Ford Escape 2017 tiene 125,000 millas, pero tiene check engine hoy. ¿Qué debe evitar el agente?",
    "options": [
      "Tratarlo como claramente calificado.",
      "Preguntar qué problema tiene.",
      "Aclarar si todavía se maneja.",
      "Anotar que hay una luz de advertencia."
    ],
    "correct": 0,
    "explanation": "Las luces o problemas actuales deben aclararse antes del transfer."
  },
  {
    "id": 147,
    "topic": "product",
    "language": "es",
    "question": "Un Kia Optima 2016 prende, pero no cambia de marcha. ¿Qué sugiere eso?",
    "options": [
      "El problema es solo cosmético.",
      "El vehículo califica automáticamente.",
      "El millaje es la única regla.",
      "No se confirmó buen funcionamiento."
    ],
    "correct": 3,
    "explanation": "Un vehículo que no cambia de marcha puede no estar en buenas condiciones de funcionamiento."
  },
  {
    "id": 148,
    "topic": "product",
    "language": "es",
    "question": "Un Dodge Charger 2019 tiene daño de carrocería por accidente. ¿Qué es más seguro decir?",
    "options": [
      "El agente puede aprobar carrocería.",
      "Daños de accidente y carrocería están excluidos.",
      "Todo choque está cubierto.",
      "Seguro y cobertura son iguales."
    ],
    "correct": 1,
    "explanation": "La cobertura se enfoca en fallas mecánicas, no en choques o reparaciones cosméticas."
  },
  {
    "id": 149,
    "topic": "product",
    "language": "es",
    "question": "Un Hyundai Sonata 2015 funciona bien, pero necesita pastillas de freno gastadas. ¿Qué debe saber el agente?",
    "options": [
      "Las pastillas gastadas siempre califican el carro.",
      "El Service Advisor debe cubrir las pastillas.",
      "Wear items no son el foco de cobertura.",
      "Wear items reemplazan el seguro."
    ],
    "correct": 2,
    "explanation": "No se debe prometer cobertura sobre desgaste normal."
  },
  {
    "id": 150,
    "topic": "product",
    "language": "es",
    "question": "Un Jeep Wrangler 2014 tiene suspensión modificada. ¿Qué frase es más segura?",
    "options": [
      "Las partes modificadas están excluidas.",
      "Todo vehículo modificado está totalmente cubierto.",
      "El banco decide reparaciones modificadas.",
      "Toda modificación mejora elegibilidad."
    ],
    "correct": 0,
    "explanation": "Las partes modificadas están excluidas, aunque otras partes podrían revisarse."
  },
  {
    "id": 151,
    "topic": "product",
    "language": "es",
    "question": "¿Dónde se manejan normalmente las reparaciones aprobadas?",
    "options": [
      "Solo en el dealer original.",
      "Solo en el taller de la financiera.",
      "Solo en talleres de Texas.",
      "Talleres autorizados a nivel nacional."
    ],
    "correct": 3,
    "explanation": "Las reparaciones aprobadas no se limitan al dealer original."
  },
  {
    "id": 152,
    "topic": "product",
    "language": "es",
    "question": "Un cliente tiene una motocicleta 2019 con 12,000 millas. ¿Qué debe recordar el agente?",
    "options": [
      "Califica si el Service Advisor acepta.",
      "Las motocicletas están excluidas.",
      "La cobertura es automática con seguro.",
      "El bajo millaje anula el tipo de vehículo."
    ],
    "correct": 1,
    "explanation": "Las motocicletas están entre los tipos de vehículo no cubiertos."
  },
  {
    "id": 153,
    "topic": "product",
    "language": "es",
    "question": "El cliente tiene una SUV 2009, un sedán 2018 y un EV 2022. ¿Qué debe revisar el agente antes de transferir?",
    "options": [
      "Si el vehículo actual que podría calificar es el sedán 2018.",
      "Si todos tienen el mismo VIN.",
      "Si el EV 2022 solo tiene bajo millaje.",
      "Si el vehículo más viejo decide el archivo."
    ],
    "correct": 0,
    "explanation": "El agente debe enfocarse en un vehículo actual que cumpla año, tipo, millaje y condición."
  },
  {
    "id": 154,
    "topic": "product",
    "language": "es",
    "question": "Un Ford Fusion 2016 tiene un problema actual de motor. ¿Qué debe evitar prometer el agente?",
    "options": [
      "Que el Service Advisor revisa opciones.",
      "Que cobertura mecánica es diferente.",
      "Que la condición del vehículo importa.",
      "Que el problema existente será arreglado."
    ],
    "correct": 3,
    "explanation": "El agente no debe prometer cobertura para problemas existentes o actuales."
  },
  {
    "id": 155,
    "topic": "product",
    "language": "es",
    "question": "¿Cómo se debe comparar factory warranty con extended coverage?",
    "options": [
      "Factory warranty empieza después de coverage.",
      "Son exactamente el mismo producto.",
      "El seguro renueva factory warranty.",
      "Factory warranty es limitada; extended coverage es separada."
    ],
    "correct": 3,
    "explanation": "Factory warranty y extended coverage son conceptos diferentes."
  },
  {
    "id": 156,
    "topic": "product",
    "language": "es",
    "question": "¿Cuál es la diferencia clave con el seguro?",
    "options": [
      "Coverage es obligatorio como seguro.",
      "El seguro cubre toda falla mecánica.",
      "Seguro y coverage son idénticos.",
      "El seguro cubre accidentes, no fallas mecánicas."
    ],
    "correct": 3,
    "explanation": "El agente debe separar seguro de accidentes y cobertura de fallas mecánicas."
  },
  {
    "id": 157,
    "topic": "product",
    "language": "es",
    "question": "El cliente pregunta si el plan puede agregar cobertura después de factory coverage. ¿Qué es correcto?",
    "options": [
      "Puede agregar millas después de factory coverage.",
      "Solo cubre responsabilidad por accidente.",
      "Elimina la necesidad de seguro.",
      "Siempre renueva factory warranty."
    ],
    "correct": 0,
    "explanation": "Extended coverage es separada y puede agregar protección mecánica después de factory coverage."
  },
  {
    "id": 158,
    "topic": "product",
    "language": "es",
    "question": "Un vehículo eléctrico financiado está bajo 175,000 millas. ¿Qué debe hacer el agente?",
    "options": [
      "Tomar el financiamiento como regla principal.",
      "No tratarlo como elegible.",
      "Transferir porque el millaje sirve.",
      "Ignorar la regla de vehículo eléctrico."
    ],
    "correct": 1,
    "explanation": "El financiamiento no elimina la exclusión de vehículos eléctricos."
  },
  {
    "id": 159,
    "topic": "product",
    "language": "es",
    "question": "El cliente no sabe el millaje exacto, pero cree que está cerca de 170,000. ¿Qué es mejor?",
    "options": [
      "Asumir que está bajo el límite.",
      "Marcar XFER porque está cerca.",
      "Decir que el millaje no importa.",
      "Aclarar bien antes de tratarlo como calificado."
    ],
    "correct": 3,
    "explanation": "Cuando está cerca del límite, el agente no debe asumir elegibilidad."
  },
  {
    "id": 160,
    "topic": "product",
    "language": "es",
    "question": "¿Qué caso levanta la mayor preocupación de elegibilidad?",
    "options": [
      "Mazda 3 2012 con 90,000 millas.",
      "Toyota Corolla 2018 con 120,000 millas.",
      "Chevrolet Traverse 2019 con 182,000 millas.",
      "Honda Civic 2015 con 75,000 millas."
    ],
    "correct": 2,
    "explanation": "Más de 175,000 millas está fuera de la regla indicada."
  },
  {
    "id": 161,
    "topic": "product",
    "language": "es",
    "question": "Un Subaru Outback 2011 tiene exactamente 175,000 millas y funciona normal. ¿Cuál es la mejor lectura de la regla?",
    "options": [
      "Todavía podría estar dentro del límite.",
      "Queda excluido automáticamente por millaje.",
      "El año lo hace imposible.",
      "Solo califica si es eléctrico."
    ],
    "correct": 0,
    "explanation": "La regla dice hasta 175,000 millas; el problema es estar por encima."
  },
  {
    "id": 162,
    "topic": "product",
    "language": "es",
    "question": "Un Toyota Corolla 2012 tiene 175,001 millas y funciona bien. ¿Qué debe hacer el agente?",
    "options": [
      "Tratarlo como bajo el límite.",
      "No tratarlo como elegible por millaje.",
      "Ignorar esa milla extra.",
      "Transferir porque es Toyota."
    ],
    "correct": 1,
    "explanation": "Incluso una milla por encima queda fuera de la guía básica."
  },
  {
    "id": 163,
    "topic": "product",
    "language": "es",
    "question": "Una Rivian truck 2023 tiene 20,000 millas y no presenta fallas. ¿Qué regla pesa más?",
    "options": [
      "El bajo millaje limpia el archivo.",
      "Ser vehículo eléctrico bloquea elegibilidad.",
      "Ser truck es suficiente.",
      "Los vehículos nuevos siempre califican."
    ],
    "correct": 1,
    "explanation": "Los vehículos eléctricos siguen excluidos sin importar millaje."
  },
  {
    "id": 164,
    "topic": "product",
    "language": "es",
    "question": "Un Lamborghini 2018 tiene 22,000 millas y funciona bien. ¿Qué debe recordar el agente?",
    "options": [
      "Las excepciones exóticas pueden excluirse.",
      "El bajo millaje anula todo.",
      "El banco decide el tipo de vehículo.",
      "Califica por ser más nuevo que 2011."
    ],
    "correct": 0,
    "explanation": "El material de entrenamiento menciona excepciones exóticas como Lamborghinis."
  },
  {
    "id": 165,
    "topic": "product",
    "language": "es",
    "question": "Un trailer de carga 2017 está conectado al truck del cliente. ¿Qué debe tratarse con cuidado?",
    "options": [
      "Los trailers son tipos excluidos.",
      "Los trailers califican si el truck funciona.",
      "Los trailers califican con bajo millaje.",
      "El Service Advisor debe cubrir trailers."
    ],
    "correct": 0,
    "explanation": "Los trailers aparecen como tipos de vehículo excluidos."
  },
  {
    "id": 166,
    "topic": "product",
    "language": "es",
    "question": "Un Honda CR-V 2016 tiene 140,000 millas, pero está en el taller y no se puede manejar. ¿Cuál es el problema?",
    "options": [
      "El millaje es el único factor.",
      "No se confirmó buen funcionamiento.",
      "El modelo es anterior a 2011.",
      "Las SUV siempre están excluidas."
    ],
    "correct": 1,
    "explanation": "El vehículo debe funcionar; estar no manejable actualmente crea duda."
  },
  {
    "id": 167,
    "topic": "product",
    "language": "es",
    "question": "Un Nissan Sentra 2015 tiene 135,000 millas y solo necesita cambio de aceite. ¿Cuál es la vista más segura?",
    "options": [
      "Mantenimiento rutinario no es el foco de cobertura.",
      "El cambio de aceite lo hace inelegible.",
      "El Service Advisor cubre todo mantenimiento.",
      "El vehículo es eléctrico por defecto."
    ],
    "correct": 0,
    "explanation": "No se debe prometer cobertura sobre mantenimiento normal."
  },
  {
    "id": 168,
    "topic": "product",
    "language": "es",
    "question": "Un Chevy Bolt 2020 tiene 60,000 millas. ¿Cuál es el principal problema de calificación?",
    "options": [
      "Es un vehículo eléctrico.",
      "Está sobre el límite de millaje.",
      "Es anterior a 2011.",
      "No tiene historial financiero."
    ],
    "correct": 0,
    "explanation": "Los vehículos eléctricos están excluidos."
  },
  {
    "id": 169,
    "topic": "product",
    "language": "es",
    "question": "Un Ford Focus 2013 tiene 172,000 millas y la transmisión patina hoy. ¿Qué debe pasar antes del transfer?",
    "options": [
      "Aclarar el problema mecánico actual.",
      "Tomar el millaje como suficiente.",
      "Prometer reparación de transmisión.",
      "Saltar porque es después de 2011."
    ],
    "correct": 0,
    "explanation": "Los problemas mecánicos actuales deben aclararse y no prometerse como cubiertos."
  },
  {
    "id": 170,
    "topic": "product",
    "language": "es",
    "question": "Un Toyota Corolla 2021 tiene 40,000 millas, funciona bien y no es eléctrico. ¿Cuál es la conclusión más segura?",
    "options": [
      "Parece básicamente elegible para continuar.",
      "Está excluido por ser muy nuevo.",
      "Está excluido porque el millaje es bajo.",
      "Debe marcarse como wrong vehicle."
    ],
    "correct": 0,
    "explanation": "Este caso cumple año, millaje, tipo y condición básica."
  },
  {
    "id": 171,
    "topic": "callflow",
    "language": "es",
    "question": "Durante el proceso de 3-way, el cliente cuelga antes de hablar con el Service Advisor. ¿Qué debe hacer el agente?",
    "options": [
      "Marcar Dead Air para el Advisor.",
      "Usar Hung Up Both Lines y Call Back.",
      "Usar Leave 3-Way Call y XFER.",
      "Dejar al Advisor timbrando solo."
    ],
    "correct": 1,
    "explanation": "Esto evita un dead-air transfer hacia el Service Advisor."
  },
  {
    "id": 172,
    "topic": "callflow",
    "language": "es",
    "question": "¿Por qué es peligroso usar “Leave 3-Way Call” después de que el cliente cuelga?",
    "options": [
      "Cambia el millaje del vehículo.",
      "Envía una ruta española automática.",
      "Elimina la opción de callback.",
      "El Advisor puede recibir una llamada timbrando sin cliente."
    ],
    "correct": 3,
    "explanation": "Salir del 3-way puede crear una llamada sin cliente para el Service Advisor."
  },
  {
    "id": 173,
    "topic": "callflow",
    "language": "es",
    "question": "El Service Advisor entra, pero se queda callado varios segundos. ¿Qué debe hacer el agente?",
    "options": [
      "Quedarse callado hasta que alguien cuelgue.",
      "Decirle al cliente que llame después.",
      "Llamar la atención del Advisor y controlar el handoff.",
      "Colgar y marcar XFER."
    ],
    "correct": 2,
    "explanation": "El agente debe evitar silencio llamando la atención del Advisor."
  },
  {
    "id": 174,
    "topic": "callflow",
    "language": "es",
    "question": "¿Quién debe hablar primero cuando entra el Service Advisor?",
    "options": [
      "Nadie hasta que pasen 15 segundos.",
      "El Service Advisor.",
      "El cliente sin introducción.",
      "El agente antes que todos."
    ],
    "correct": 1,
    "explanation": "El agente debe esperar a que el Service Advisor conteste antes de presentar al cliente."
  },
  {
    "id": 175,
    "topic": "callflow",
    "language": "es",
    "question": "¿Qué confirma un handoff real?",
    "options": [
      "La línea del Advisor timbró una vez.",
      "El cliente dijo hello antes del transfer.",
      "El agente presionó transfer.",
      "Advisor y cliente hablan activamente."
    ],
    "correct": 3,
    "explanation": "Un handoff válido requiere comunicación activa, no solo marcar."
  },
  {
    "id": 176,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente le pide callback al Service Advisor. ¿Cómo debe manejarse?",
    "options": [
      "Call Back, no XFER limpio.",
      "XFER porque entró el Advisor.",
      "DAIR porque cambió la llamada.",
      "SPANIS porque pidió callback."
    ],
    "correct": 0,
    "explanation": "Una solicitud de callback con el Advisor no debe contarse como XFER limpio."
  },
  {
    "id": 177,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente le pide español al Advisor de inmediato, antes de cualquier conversación en inglés. ¿Cuál es el problema?",
    "options": [
      "El vehículo se vuelve wrong number.",
      "Debe ser Answering Machine.",
      "El transfer es válido porque conectaron líneas.",
      "No hubo conversación significativa en inglés con SA."
    ],
    "correct": 3,
    "explanation": "Un English XFER necesita comunicación significativa en inglés con el Service Advisor."
  },
  {
    "id": 178,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente habla en inglés con el Service Advisor por 18 segundos y luego pide español. ¿Cómo debería verlo QA?",
    "options": [
      "SPANIS automático sin revisar.",
      "Probablemente se cumplió el handoff en inglés.",
      "Inválido solo por mencionar español.",
      "Dead Air porque cambió idioma."
    ],
    "correct": 1,
    "explanation": "Si hubo conversación significativa en inglés el tiempo suficiente, el handoff puede seguir siendo válido."
  },
  {
    "id": 179,
    "topic": "callflow",
    "language": "es",
    "question": "Un niño contesta y acepta “escuchar opciones” para el vehículo de la casa. ¿Qué debe hacer el agente?",
    "options": [
      "Transferir porque alguien aceptó.",
      "Pedir un adulto que tome decisiones.",
      "Marcar XFER después del sí.",
      "Preguntar millaje solo al niño."
    ],
    "correct": 1,
    "explanation": "Un niño no puede dar aprobación válida para una decisión del vehículo."
  },
  {
    "id": 180,
    "topic": "callflow",
    "language": "es",
    "question": "Un co-signer dice que no toma decisiones del vehículo. ¿Cuál es el mejor camino?",
    "options": [
      "Transferir porque aparece en el archivo.",
      "Pedir al decision maker o agendar callback.",
      "Tratarlo como XFER completo.",
      "Presionar hasta que acepte."
    ],
    "correct": 1,
    "explanation": "La llamada no debe forzarse si la persona no puede decidir."
  },
  {
    "id": 181,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente responde “sí” a todo, pero contesta cosas fuera de contexto. ¿Qué debe verificar el agente?",
    "options": [
      "Que le gusta el color del vehículo.",
      "Que el archivo tiene dirección.",
      "Que el Advisor puede cerrar más rápido.",
      "Que realmente entiende la llamada."
    ],
    "correct": 3,
    "explanation": "Aceptar por educación no basta si la comprensión es dudosa."
  },
  {
    "id": 182,
    "topic": "callflow",
    "language": "es",
    "question": "Mientras espera al Advisor, hay demasiado silencio. ¿Qué ayuda a proteger la llamada?",
    "options": [
      "Pedir información de tarjeta.",
      "Hacer preguntas ligeras sobre el vehículo.",
      "Prometer que el Advisor ya está listo.",
      "Mutear hasta que entre el Advisor."
    ],
    "correct": 1,
    "explanation": "Las preguntas de espera reducen dead air y mantienen al cliente conectado."
  },
  {
    "id": 183,
    "topic": "callflow",
    "language": "es",
    "question": "Después de calificar, el cliente dice que no quiere ser transferido. ¿Qué debe evitar el agente?",
    "options": [
      "Respetar el rechazo.",
      "Marcar al Advisor de todas formas.",
      "Usar la disposición correcta.",
      "Documentar el resultado."
    ],
    "correct": 1,
    "explanation": "Calificar no autoriza transferir sin consentimiento."
  },
  {
    "id": 184,
    "topic": "callflow",
    "language": "es",
    "question": "La línea del Advisor timbra, pero nadie contesta. ¿Qué debe evitar el agente?",
    "options": [
      "Manejar callback si aplica.",
      "Contarlo como XFER válido.",
      "Proteger la experiencia del cliente.",
      "Evitar dead-air transfer."
    ],
    "correct": 1,
    "explanation": "Un XFER válido requiere handoff entre Service Advisor y cliente."
  },
  {
    "id": 185,
    "topic": "callflow",
    "language": "es",
    "question": "En una auditoría de transfer, el agente presenta al cliente antes de que hable el Advisor. ¿Cuál es el riesgo?",
    "options": [
      "El millaje se reinicia.",
      "La llamada se vuelve voicemail.",
      "El handoff puede quedar sin control.",
      "El cliente se vuelve co-signer."
    ],
    "correct": 2,
    "explanation": "El Advisor debe hablar primero para que la presentación sea limpia."
  },
  {
    "id": 186,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente cuelga después de la presentación del agente, pero antes de cualquier conversación con el Advisor. ¿Qué debe pasar?",
    "options": [
      "Contarlo porque hubo introducción.",
      "Usar Answering Machine.",
      "No contarlo como XFER limpio.",
      "Marcar SPXFER automático."
    ],
    "correct": 2,
    "explanation": "La introducción sola no prueba conversación activa entre Advisor y cliente."
  },
  {
    "id": 187,
    "topic": "callflow",
    "language": "es",
    "question": "Durante la espera de un transfer en inglés, el cliente empieza a hablar español. ¿Qué debe considerar el agente?",
    "options": [
      "El vehículo queda inválido automáticamente.",
      "Debe forzarse el English transfer.",
      "DNC es obligatorio inmediatamente.",
      "Puede necesitar confirmar idioma de preferencia."
    ],
    "correct": 3,
    "explanation": "Cambiar de idioma puede indicar que el cliente necesita manejo en español."
  },
  {
    "id": 188,
    "topic": "callflow",
    "language": "es",
    "question": "El agente se queda mucho tiempo en línea después de que ambas partes ya están hablando. ¿Cuál es el coaching?",
    "options": [
      "Quedarse hasta que cierre la venta.",
      "Salir antes de que hable el Advisor.",
      "Mutear y contar tiempo extra.",
      "Esperar suficiente, no más de lo necesario."
    ],
    "correct": 3,
    "explanation": "La regla de 15 segundos protege el handoff, pero no exige quedarse innecesariamente."
  },
  {
    "id": 189,
    "topic": "callflow",
    "language": "es",
    "question": "Antes del transfer, el cliente dice: “No quiero hablar con nadie más.” ¿Qué debe evitar el agente?",
    "options": [
      "Aclarar la preocupación.",
      "Ofrecer callback si aplica.",
      "Transferir sin consentimiento renovado.",
      "Respetar el rechazo."
    ],
    "correct": 2,
    "explanation": "Un rechazo claro significa que no hay consentimiento."
  },
  {
    "id": 190,
    "topic": "callflow",
    "language": "es",
    "question": "El Advisor dice hello, el cliente dice hello y luego ambos se quedan callados. ¿Qué debe hacer el agente antes de salir?",
    "options": [
      "Confirmar que hablan activamente.",
      "Salir justo después de los dos hellos.",
      "Marcar XFER y mutear para siempre.",
      "Pedir datos de pago."
    ],
    "correct": 0,
    "explanation": "Dos saludos pueden no ser suficiente para confirmar un handoff activo."
  },
  {
    "id": 191,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Cuándo DAIR es la mejor disposición?",
    "options": [
      "El cliente pide callback.",
      "Ninguna persona real responde en la línea.",
      "El cliente dice no me interesa.",
      "El cliente pide español."
    ],
    "correct": 1,
    "explanation": "DAIR es para dead air completo, no para un rechazo o callback normal."
  },
  {
    "id": 192,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente escucha el script y cuelga. ¿Qué disposición suele encajar mejor que DAIR?",
    "options": [
      "Manage",
      "NI",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "Si hubo contacto y el cliente cuelga después del pitch, NI suele encajar mejor que DAIR."
  },
  {
    "id": 193,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice: “Dejen de llamarme o los reporto.” ¿Qué disposición encaja?",
    "options": [
      "DNC",
      "XFER",
      "SPANIS",
      "CALLBK"
    ],
    "correct": 0,
    "explanation": "Peticiones de remoción, amenazas o lenguaje de no llamar deben manejarse como DNC."
  },
  {
    "id": 194,
    "topic": "dosdonts",
    "language": "es",
    "question": "La llamada cae en buzón de voz. ¿Qué disposición encaja?",
    "options": [
      "WRNGVE",
      "NI",
      "XFER",
      "A"
    ],
    "correct": 3,
    "explanation": "Answering Machine se usa para voicemail o sistemas automáticos."
  },
  {
    "id": 195,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente está ocupado y sigue sin continuar después del rebuttal de callback. ¿Qué disposición encaja?",
    "options": [
      "XFER",
      "CALLBK",
      "A",
      "DAIR"
    ],
    "correct": 1,
    "explanation": "Una solicitud clara de otro horario o callback debe manejarse como CALLBK."
  },
  {
    "id": 196,
    "topic": "dosdonts",
    "language": "es",
    "question": "Un cliente necesita español y el agente usa ruta ciega sin handoff con un Service Advisor en español. ¿Qué disposición encaja?",
    "options": [
      "SPANIS",
      "XFER",
      "SPXFER",
      "DAIR"
    ],
    "correct": 0,
    "explanation": "SPANIS es para ruta ciega en español, no para transferencia directa en español."
  },
  {
    "id": 197,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agente conecta directamente a un cliente que habla español con un Service Advisor en español. ¿Qué disposición encaja?",
    "options": [
      "CALLBK",
      "A",
      "SPXFER",
      "SPANIS"
    ],
    "correct": 2,
    "explanation": "SPXFER es para transferencias directas en español."
  },
  {
    "id": 198,
    "topic": "dosdonts",
    "language": "es",
    "question": "Una persona dice que es número equivocado. ¿Qué área de disposición importa?",
    "options": [
      "Manejo de Wrong Number.",
      "English XFER limpio.",
      "Answering Machine.",
      "Pause de restroom."
    ],
    "correct": 0,
    "explanation": "Wrong number no debe forzarse a resultado de transfer."
  },
  {
    "id": 199,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Qué hace válido un XFER?",
    "options": [
      "Transferencia en inglés con handoff real entre Advisor y cliente.",
      "El agente marca sin aprobación.",
      "El Advisor solo recibe una llamada timbrando.",
      "El cliente cuelga antes de hablar con el Advisor."
    ],
    "correct": 0,
    "explanation": "XFER debe reflejar una transferencia exitosa, no solo un intento de marcar."
  },
  {
    "id": 200,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Qué caso pertenece a coaching de Needs Practice?",
    "options": [
      "Agente confirma condición y obtiene consentimiento.",
      "Agente aclara idioma de preferencia.",
      "Agente espera mientras ambas partes hablan.",
      "Agente salta el propósito y transfiere a un cliente confundido."
    ],
    "correct": 3,
    "explanation": "Saltar el propósito y transferir a un cliente confundido crea riesgo de invalid/QA."
  }
]


export const learnCategories = [
  {
    id: 'script-en',
    icon: '📋',
    title: 'Script (English)',
    description: 'Official word for word script with transfer protocol',
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
    title: 'Objections and Rebuttals',
    description: 'Approved English rebuttals for common objections',
    color: '#ea580c',
    type: 'objections',
    ref: 'en',
  },
  {
    id: 'objections-es',
    icon: '🛡️',
    title: 'Objeciones y Rebuttals',
    description: 'Objeciones comunes con respuestas aprobadas',
    color: '#c2410c',
    type: 'objections',
    ref: 'es',
  },
  {
    id: 'call-flow',
    icon: '📞',
    title: 'Call Flow',
    description: 'Call process plus transfer protocol',
    color: '#9a3412',
    type: 'callflow',
    ref: null,
  },
  {
    id: 'product-knowledge',
    icon: '📦',
    title: 'Product Knowledge',
    description: 'Coverage, exclusions, and how the product works',
    color: '#7c2d12',
    type: 'product',
    ref: null,
  },
  {
    id: 'dos-donts',
    icon: '⚠️',
    title: "Do's and Don'ts",
    description: 'Compliance rules, delivery standards, and dialer basics',
    color: '#431407',
    type: 'dialer',
    ref: null,
  },
  {
    id: 'dialer-guide',
    icon: '🖥️',
    title: 'Dialer Guide',
    description: 'Dispositions, pause codes, and dialer handling',
    color: '#1e40af',
    type: 'dialer',
    ref: null,
  },
]


// ─────────────────────────────────────────────
// PULSE GO GAME MODES
// Extra solo training games used by GoQuizPlay.jsx
// ─────────────────────────────────────────────

export const gameModes = [
  {
    id: 'classic',
    label: 'Classic Quiz',
    icon: '🧠',
    color: '#f97316',
    desc: 'Kahoot-style quiz by topic',
  },
  {
    id: 'objection-battle',
    label: 'Objection Battle',
    icon: '🛡️',
    color: '#3b82f6',
    desc: 'Pick the best rebuttal under pressure',
  },
  {
    id: 'script-fill',
    label: 'Script Fill-in',
    icon: '📝',
    color: '#22c55e',
    desc: 'Complete official script lines',
  },
  {
    id: 'transfer-protocol',
    label: 'Transfer Protocol',
    icon: '🔄',
    color: '#a855f7',
    desc: 'Put the transfer process in order',
  },
  {
    id: 'disposition-trainer',
    label: 'Dispose It',
    icon: '🖥️',
    color: '#38bdf8',
    desc: 'Pick the right disposition fast',
  },
  {
    id: 'valid-invalid',
    label: 'Valid or Invalid XFER',
    icon: '⚖️',
    color: '#fb7185',
    desc: 'Judge if the transfer should count',
  },
  {
    id: 'speed-round',
    label: 'Speed Round',
    icon: '⚡',
    color: '#f59e0b',
    desc: 'Fast reflex questions, 15 seconds each',
  },
  {
    id: 'certification',
    label: 'Certification Mode',
    icon: '🏅',
    color: '#eab308',
    desc: '25-question exam, 80% to pass',
  },
  {
    id: 'roleplay',
    label: 'Roleplay Simulator',
    icon: '🎭',
    color: '#ec4899',
    desc: 'Customer scenarios with coaching feedback',
  },
]

export const objectionBattleQuestions = [
  {
    "id": "ob-001",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “I am not interested.” What is the strongest response?",
    "options": [
      "I understand. Many people felt that way before seeing repair costs.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Acknowledge first, then create curiosity around repair-cost value."
  },
  {
    "id": "ob-002",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer asks: “Where did you get my information?” Choose the approved direction.",
    "options": [
      "We partner with dealerships and vehicle registries nationwide.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Use the approved source language; do not say the bank gave the file."
  },
  {
    "id": "ob-003",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “I already have insurance.” What should you clarify?",
    "options": [
      "Insurance covers accidents; this is for mechanical breakdowns.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Separate insurance from mechanical breakdown coverage."
  },
  {
    "id": "ob-004",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer asks: “How much does it cost?” What is the cleanest bridge?",
    "options": [
      "Cost depends on mileage and driving habits; the advisor can review it.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Do not quote exact pricing. Bridge to the Service Advisor."
  },
  {
    "id": "ob-005",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer asks: “What kind of vehicle?” What should the opener say?",
    "options": [
      "I only see finance info here; the Service Advisor can review full details.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Be transparent about what the opener can see."
  },
  {
    "id": "ob-006",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “I am busy.” What should you do?",
    "options": [
      "Respect it and offer a callback window that works better.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Do not force the transfer when the customer is clearly busy."
  },
  {
    "id": "ob-007",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “I already have coverage.” What is the safest position?",
    "options": [
      "We can review whether updated or additional benefits are available.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Do not attack current coverage; position it as a review."
  },
  {
    "id": "ob-008",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “That is not my vehicle.” What should happen next?",
    "options": [
      "Acknowledge outdated info and verify their current vehicle condition.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Vehicle info can be outdated; redirect carefully."
  },
  {
    "id": "ob-009",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “This sounds like a scam.” What is the best response?",
    "options": [
      "Stay calm, identify the company, and explain the purpose clearly.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Scam concerns require calm trust building."
  },
  {
    "id": "ob-010",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “Send me something first.” What is the best bridge?",
    "options": [
      "The Service Advisor can review the details with you live first.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Do not promise documents you cannot send."
  },
  {
    "id": "ob-011",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “I do not have that car anymore.” What should you ask?",
    "options": [
      "Ask if they currently drive another eligible vehicle.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Redirect to current vehicle eligibility when appropriate."
  },
  {
    "id": "ob-012",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “Is this mandatory?” What is the correct tone?",
    "options": [
      "No, this is an opportunity to review protection options.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Do not make it sound legally required."
  },
  {
    "id": "ob-013",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer asks: “Are you from my bank?” What should you avoid?",
    "options": [
      "Do not say you work for the bank.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Never claim to represent the bank."
  },
  {
    "id": "ob-014",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer asks: “Why are you calling me?” What should you do?",
    "options": [
      "Clarify the extended warranty review purpose briefly.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Purpose clarity keeps the call controlled."
  },
  {
    "id": "ob-015",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "en",
    "question": "Customer says: “I am not paying anything today.” What is safest?",
    "options": [
      "The advisor can review options; I am not taking payment.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Openers should not push payment or pricing."
  },
  {
    "id": "ob-016",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “No me interesa.” ¿Cuál respuesta es más fuerte?",
    "options": [
      "Entiendo. Muchos pensaban igual hasta ver cuánto puede costar una reparación.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Reconoce la objeción y crea curiosidad sin presión."
  },
  {
    "id": "ob-017",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente pregunta: “¿De dónde sacaron mi información?”",
    "options": [
      "Trabajamos con concesionarios y registros vehiculares.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "No digas que el banco entregó la información."
  },
  {
    "id": "ob-018",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Ya tengo seguro.” ¿Qué aclaras?",
    "options": [
      "El seguro cubre accidentes; esto es para fallas mecánicas.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Seguro y cobertura extendida son productos distintos."
  },
  {
    "id": "ob-019",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente pregunta: “¿Cuánto cuesta?”",
    "options": [
      "Depende del millaje y hábitos de manejo; el asesor puede explicarlo.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "No des precio exacto como opener."
  },
  {
    "id": "ob-020",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente pregunta: “¿Qué vehículo?”",
    "options": [
      "Solo veo información financiera; el asesor revisa los detalles completos.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Sé transparente sobre la información visible."
  },
  {
    "id": "ob-021",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Estoy ocupado.”",
    "options": [
      "Lo respeto. Podemos agendar una llamada en un mejor momento.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Ofrece callback sin presionar."
  },
  {
    "id": "ob-022",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Ya tengo cobertura.”",
    "options": [
      "Podemos revisar si hay beneficios actualizados o adicionales.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "No ataques la cobertura actual."
  },
  {
    "id": "ob-023",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Ese no es mi carro.”",
    "options": [
      "Entiendo, puede estar desactualizado. ¿Qué vehículo maneja actualmente?",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Redirige a verificación actual."
  },
  {
    "id": "ob-024",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Esto suena a estafa.”",
    "options": [
      "Entiendo la preocupación. Le explico claramente quiénes somos y el propósito.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Construye confianza con calma."
  },
  {
    "id": "ob-025",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Mándeme información primero.”",
    "options": [
      "El Asesor de Servicio puede revisar los detalles con usted en vivo.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Puentea hacia el asesor sin prometer documentos."
  },
  {
    "id": "ob-026",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “Ya vendí ese carro.”",
    "options": [
      "¿Actualmente maneja otro vehículo que esté en buenas condiciones?",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Pregunta por vehículo actual si aplica."
  },
  {
    "id": "ob-027",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente pregunta: “¿Esto es obligatorio?”",
    "options": [
      "No, es una oportunidad para revisar opciones de protección.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "No lo presentes como obligación legal."
  },
  {
    "id": "ob-028",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente pregunta: “¿Son del banco?”",
    "options": [
      "No somos el banco; somos Grupo de Servicios Vehiculares.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Aclara sin afirmar relación falsa con banco."
  },
  {
    "id": "ob-029",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente pregunta: “¿Cuál es el propósito?”",
    "options": [
      "Revisar una oportunidad de protección extendida para su vehículo.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "Una respuesta breve mantiene control."
  },
  {
    "id": "ob-030",
    "mode": "objection-battle",
    "topic": "objections",
    "language": "es",
    "question": "Cliente dice: “No voy a pagar nada hoy.”",
    "options": [
      "El asesor puede revisar opciones; yo no estoy tomando pagos.",
      "Transfer immediately before they object again.",
      "Tell the customer they are wrong.",
      "End the call without clarifying."
    ],
    "correct": 0,
    "explanation": "No presiones pagos ni precios."
  }
]

export const scriptFillChallenges = [
  {
    "id": "sf-001",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Complete the opening: “Hi, [client name], this is [your name] with the ____.”",
    "options": [
      "Vehicle Services Group",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "The approved company name is Vehicle Services Group."
  },
  {
    "id": "sf-002",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Complete: “We are calling about the vehicle you financed on ____.”",
    "options": [
      "month and year",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Use the financing month and year from the form."
  },
  {
    "id": "sf-003",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Complete the check: “Is your vehicle still in ____?”",
    "options": [
      "good running condition",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Vehicle condition confirms eligibility."
  },
  {
    "id": "sf-004",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Complete: “I need to get you on with a ____.”",
    "options": [
      "Service Advisor",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "The correct role is Service Advisor."
  },
  {
    "id": "sf-005",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Before transferring, wait for a clear ____ from the customer.",
    "options": [
      "approval",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Never transfer without clear customer approval."
  },
  {
    "id": "sf-006",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "When the SA joins, the opener should wait for the advisor to ____ first.",
    "options": [
      "speak",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "The SA should speak first before the opener introduces the customer."
  },
  {
    "id": "sf-007",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Complete the handoff: “Hello Service Advisor, I have ____ on the line.”",
    "options": [
      "the customer",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "The handoff introduces the customer clearly."
  },
  {
    "id": "sf-008",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "After the SA joins, stay for at least ____ seconds.",
    "options": [
      "15",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "The 15-second rule protects the handoff."
  },
  {
    "id": "sf-009",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "Do not say the review will take ____.",
    "options": [
      "less than a minute",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Avoid promising time or oversimplifying the transfer."
  },
  {
    "id": "sf-010",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "The opener should not quote the exact ____.",
    "options": [
      "price",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Pricing belongs with the Service Advisor."
  },
  {
    "id": "sf-011",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "The purpose line says the extended warranty has not been ____ yet.",
    "options": [
      "activated",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "This is the approved purpose concept."
  },
  {
    "id": "sf-012",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "If the customer asks for cost, bridge to the ____.",
    "options": [
      "Service Advisor",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "The advisor reviews cost details."
  },
  {
    "id": "sf-013",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "The opener must avoid changing or ____ the script.",
    "options": [
      "shortening",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Script compliance requires consistent wording."
  },
  {
    "id": "sf-014",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "The opener should mention finance info with ____.",
    "options": [
      "confidence",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Confidence helps the line sound credible."
  },
  {
    "id": "sf-015",
    "mode": "script-fill",
    "topic": "script",
    "language": "en",
    "question": "The opener should introduce the customer by ____.",
    "options": [
      "name",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "A clean handoff uses the customer name."
  },
  {
    "id": "sf-016",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Completa: “Le habla [tu nombre] de ____.”",
    "options": [
      "Grupo de Servicios Vehiculares",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Ese es el nombre aprobado en español."
  },
  {
    "id": "sf-017",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Completa: “Le llamamos con respecto al vehículo que usted financió en ____.”",
    "options": [
      "mes y año",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Se usa mes y año del financiamiento."
  },
  {
    "id": "sf-018",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Completa: “¿Su vehículo se encuentra actualmente en buenas condiciones de ____?”",
    "options": [
      "funcionamiento",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "La condición del vehículo confirma elegibilidad."
  },
  {
    "id": "sf-019",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Completa: “Lo voy a comunicar con un ____.”",
    "options": [
      "Asesor de Servicio",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Ese es el rol correcto en español."
  },
  {
    "id": "sf-020",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Antes de transferir, espera aprobación ____ del cliente.",
    "options": [
      "clara",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "No se debe transferir sin aprobación clara."
  },
  {
    "id": "sf-021",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Al transferir, espera que el asesor ____ primero.",
    "options": [
      "hable",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "No te adelantes al asesor."
  },
  {
    "id": "sf-022",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Completa: “Tengo a [nombre del cliente] en ____.”",
    "options": [
      "la línea",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "La introducción debe ser clara."
  },
  {
    "id": "sf-023",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Después de que entra el asesor, espera al menos ____ segundos.",
    "options": [
      "15",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "La regla de 15 segundos protege el handoff."
  },
  {
    "id": "sf-024",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "No prometas que será ____.",
    "options": [
      "gratis",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Decir free/gratis puede ser misleading."
  },
  {
    "id": "sf-025",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "No digas que el ____ dio la información.",
    "options": [
      "banco",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "No se debe atribuir el lead al banco."
  },
  {
    "id": "sf-026",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "Si preguntan por precio, dirige la explicación al ____.",
    "options": [
      "Asesor de Servicio",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "El asesor revisa precios y detalles."
  },
  {
    "id": "sf-027",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "El opener debe evitar ____ partes del script.",
    "options": [
      "improvisar",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "No improvisar mantiene compliance."
  },
  {
    "id": "sf-028",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "El opener debe confirmar que el vehículo ____.",
    "options": [
      "funciona",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "El vehículo debe estar en buenas condiciones de funcionamiento."
  },
  {
    "id": "sf-029",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "La transferencia debe hacerse después de un “sí” u “____” claro.",
    "options": [
      "okay",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Debe haber consentimiento claro."
  },
  {
    "id": "sf-030",
    "mode": "script-fill",
    "topic": "script",
    "language": "es",
    "question": "El handoff termina cuando asesor y cliente están ____.",
    "options": [
      "hablando",
      "dealer warranty desk",
      "bank department",
      "final price"
    ],
    "correct": 0,
    "explanation": "Debe confirmarse conversación activa."
  }
]

export const dispositionTrainerQuestions = [
  {
    "id": "di-001",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "Call goes to voicemail or an answering machine. Which disposition fits best?",
    "options": [
      "A",
      "CALLBK",
      "DAIR",
      "NI"
    ],
    "correct": 0,
    "explanation": "A is for voicemail or answering machine."
  },
  {
    "id": "di-002",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The file has no usable customer information to validate the call. Which disposition fits best?",
    "options": [
      "WN",
      "NI",
      "BLANK",
      "DAIR"
    ],
    "correct": 2,
    "explanation": "BLANK is for a blank file or no usable customer information."
  },
  {
    "id": "di-003",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "Customer says, “Call me back later today.” Which disposition fits best?",
    "options": [
      "NI",
      "CALLBK",
      "XFER",
      "DNC"
    ],
    "correct": 1,
    "explanation": "CALLBK is used when the customer requests a callback."
  },
  {
    "id": "di-004",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The call connects, but there is silence after several greetings. Which disposition fits best?",
    "options": [
      "A",
      "NI",
      "CALLBK",
      "DAIR"
    ],
    "correct": 3,
    "explanation": "DAIR is for dead air: connected call, no response."
  },
  {
    "id": "di-005",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "Customer says, “Take me off your list and do not call again.” Which disposition fits best?",
    "options": [
      "DNC",
      "NI",
      "CALLBK",
      "BLANK"
    ],
    "correct": 0,
    "explanation": "DNC is required when the customer asks not to be called again."
  },
  {
    "id": "di-006",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "Customer clearly refuses to continue and says they are not interested. Which disposition fits best?",
    "options": [
      "DNC",
      "CALLBK",
      "NI",
      "XFER"
    ],
    "correct": 2,
    "explanation": "NI is for a customer who declines and does not continue."
  },
  {
    "id": "di-007",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "Customer only speaks Spanish, and it is a blind Spanish route without a direct closer handoff. Which disposition fits best?",
    "options": [
      "SPXFER",
      "SPANIS",
      "XFER",
      "NI"
    ],
    "correct": 1,
    "explanation": "SPANIS is for blind Spanish speaker routing."
  },
  {
    "id": "di-008",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "You directly transfer a Spanish-speaking customer to a Spanish Service Advisor, and the handoff is completed. Which disposition fits best?",
    "options": [
      "SPANIS",
      "XFER",
      "CALLBK",
      "SPXFER"
    ],
    "correct": 3,
    "explanation": "SPXFER is only for a direct Spanish transfer to a Spanish Service Advisor / closer."
  },
  {
    "id": "di-009",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The person who answers says this is the wrong number and no one by that name is there. Which disposition fits best?",
    "options": [
      "WN",
      "WRNGVE",
      "NI",
      "BLANK"
    ],
    "correct": 0,
    "explanation": "WN is for wrong number."
  },
  {
    "id": "di-010",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer says the vehicle on file is not their vehicle. Which disposition fits best?",
    "options": [
      "WN",
      "NI",
      "WRNGVE",
      "BLANK"
    ],
    "correct": 2,
    "explanation": "WRNGVE is for wrong vehicle information."
  },
  {
    "id": "di-011",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer gave approval, the SA joined, both parties started talking, and the handoff was clean. Which disposition fits best?",
    "options": [
      "CALLBK",
      "XFER",
      "NI",
      "SPXFER"
    ],
    "correct": 1,
    "explanation": "XFER is for a successful call transferred to a Service Advisor."
  },
  {
    "id": "di-012",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer reaches the Service Advisor but asks the advisor to call them back later. Which disposition fits best?",
    "options": [
      "XFER",
      "NI",
      "SPXFER",
      "CALLBK"
    ],
    "correct": 3,
    "explanation": "If the customer requests a callback, do not count it as XFER."
  },
  {
    "id": "di-013",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer says, “I do not want this,” but does not ask to be removed from the list. Which disposition fits best?",
    "options": [
      "NI",
      "DNC",
      "CALLBK",
      "BLANK"
    ],
    "correct": 0,
    "explanation": "Use NI for refusal without a do-not-call request."
  },
  {
    "id": "di-014",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "A Spanish-speaking customer is routed as blind Spanish, but there was no direct Spanish closer transfer. Which disposition fits best?",
    "options": [
      "SPXFER",
      "XFER",
      "SPANIS",
      "WN"
    ],
    "correct": 2,
    "explanation": "SPANIS is the correct blind Spanish speaker disposition."
  },
  {
    "id": "di-015",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer is directly connected to a Spanish closer, but you accidentally consider using SPANIS. What is the correct disposition?",
    "options": [
      "SPANIS",
      "SPXFER",
      "CALLBK",
      "NI"
    ],
    "correct": 1,
    "explanation": "A direct Spanish closer handoff is SPXFER, not SPANIS."
  },
  {
    "id": "di-016",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "La llamada entra a buzón de voz o contestadora. ¿Qué disposition corresponde?",
    "options": [
      "CALLBK",
      "DAIR",
      "NI",
      "A"
    ],
    "correct": 3,
    "explanation": "A se usa para buzón de voz o contestadora."
  },
  {
    "id": "di-017",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El file no tiene información útil del cliente para validar la llamada. ¿Qué disposition corresponde?",
    "options": [
      "BLANK",
      "WN",
      "NI",
      "DAIR"
    ],
    "correct": 0,
    "explanation": "BLANK se usa cuando el file no tiene información útil."
  },
  {
    "id": "di-018",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice: “Llámeme más tarde hoy.” ¿Qué disposition corresponde?",
    "options": [
      "NI",
      "XFER",
      "CALLBK",
      "DNC"
    ],
    "correct": 2,
    "explanation": "CALLBK se usa cuando el cliente pide callback."
  },
  {
    "id": "di-019",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "La llamada conecta, saludas varias veces, pero nadie responde. ¿Qué disposition corresponde?",
    "options": [
      "A",
      "DAIR",
      "NI",
      "CALLBK"
    ],
    "correct": 1,
    "explanation": "DAIR es dead air: llamada conectada sin respuesta."
  },
  {
    "id": "di-020",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice: “Quítenme de la lista y no vuelvan a llamar.” ¿Qué disposition corresponde?",
    "options": [
      "NI",
      "CALLBK",
      "BLANK",
      "DNC"
    ],
    "correct": 3,
    "explanation": "DNC es obligatorio cuando el cliente pide no ser llamado otra vez."
  },
  {
    "id": "di-021",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente rechaza la llamada y dice que no está interesado, pero no pide ser removido. ¿Qué disposition corresponde?",
    "options": [
      "NI",
      "DNC",
      "CALLBK",
      "XFER"
    ],
    "correct": 0,
    "explanation": "NI se usa cuando el cliente no está interesado y no continúa."
  },
  {
    "id": "di-022",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente solo habla español y se hace blind Spanish routing sin transferir directamente con un closer. ¿Qué disposition corresponde?",
    "options": [
      "SPXFER",
      "XFER",
      "SPANIS",
      "NI"
    ],
    "correct": 2,
    "explanation": "SPANIS se usa para blind Spanish speaker routing."
  },
  {
    "id": "di-023",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "Transfieres directamente a un cliente hispanohablante con un Spanish Service Advisor y el handoff se completa. ¿Qué disposition corresponde?",
    "options": [
      "SPANIS",
      "SPXFER",
      "XFER",
      "CALLBK"
    ],
    "correct": 1,
    "explanation": "SPXFER es solo para transferencia directa en español al Service Advisor / closer."
  },
  {
    "id": "di-024",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "La persona que contesta dice que es número equivocado y que ese cliente no vive ahí. ¿Qué disposition corresponde?",
    "options": [
      "WRNGVE",
      "NI",
      "BLANK",
      "WN"
    ],
    "correct": 3,
    "explanation": "WN se usa para wrong number."
  },
  {
    "id": "di-025",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice que el vehículo del file no es su vehículo. ¿Qué disposition corresponde?",
    "options": [
      "WRNGVE",
      "WN",
      "NI",
      "BLANK"
    ],
    "correct": 0,
    "explanation": "WRNGVE se usa para wrong vehicle information."
  },
  {
    "id": "di-026",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente aprobó, el SA entró, ambas partes hablaron y el handoff fue correcto. ¿Qué disposition corresponde?",
    "options": [
      "CALLBK",
      "NI",
      "XFER",
      "SPXFER"
    ],
    "correct": 2,
    "explanation": "XFER se usa para una transferencia exitosa al Service Advisor."
  },
  {
    "id": "di-027",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente llega con el Service Advisor, pero le pide al advisor que lo llame después. ¿Qué disposition corresponde?",
    "options": [
      "XFER",
      "CALLBK",
      "NI",
      "SPXFER"
    ],
    "correct": 1,
    "explanation": "Si el cliente pide callback, no debe contarse como XFER."
  },
  {
    "id": "di-028",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice: “No quiero esto,” pero no pide ser removido de la lista. ¿Qué disposition corresponde?",
    "options": [
      "DNC",
      "CALLBK",
      "BLANK",
      "NI"
    ],
    "correct": 3,
    "explanation": "NI aplica para rechazo sin solicitud de do-not-call."
  },
  {
    "id": "di-029",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "Cliente hispanohablante fue enviado como blind Spanish, sin handoff directo con Spanish closer. ¿Qué disposition corresponde?",
    "options": [
      "SPANIS",
      "SPXFER",
      "XFER",
      "WN"
    ],
    "correct": 0,
    "explanation": "SPANIS es la disposition correcta para blind Spanish speaker route."
  },
  {
    "id": "di-030",
    "mode": "disposition-trainer",
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente fue conectado directamente con un Spanish closer. ¿Cuál es la disposition correcta?",
    "options": [
      "SPANIS",
      "CALLBK",
      "SPXFER",
      "NI"
    ],
    "correct": 2,
    "explanation": "La transferencia directa con Spanish closer es SPXFER, no SPANIS."
  }
]

export const validInvalidScenarios = [
  {
    "id": "vi-001",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener verified the vehicle runs, got approval, introduced the customer, and waited 15 seconds while both parties spoke.",
    "options": [
      "Valid XFER",
      "Invalid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "This follows the clean transfer process."
  },
  {
    "id": "vi-002",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener transferred before the customer clearly agreed to speak with the Service Advisor.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Customer approval is required before transfer."
  },
  {
    "id": "vi-003",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The SA joined, and the customer asked the SA for a callback instead of continuing.",
    "options": [
      "Call Back",
      "Valid XFER",
      "Invalid XFER",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "If the customer requests callback with the SA, do not count it as XFER."
  },
  {
    "id": "vi-004",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The customer hung up before the SA and customer had a real conversation.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "A real handoff did not happen."
  },
  {
    "id": "vi-005",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener skipped the running-condition question and transferred after an okay.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Vehicle condition must be verified first."
  },
  {
    "id": "vi-006",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The SA stayed silent, and the opener said “Hello Service Advisor” to prevent dead air.",
    "options": [
      "Correct process",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Prompting the SA protects the call."
  },
  {
    "id": "vi-007",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener promised it would take less than a minute before the SA joined.",
    "options": [
      "Invalid risk",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Do not promise time."
  },
  {
    "id": "vi-008",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "A blind Spanish speaker was marked SPXFER without direct closer transfer.",
    "options": [
      "Incorrect disposition",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Blind Spanish routes use SPANIS."
  },
  {
    "id": "vi-009",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The customer says the vehicle has current major mechanical issues before transfer.",
    "options": [
      "Do not transfer",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Current condition concerns can affect eligibility."
  },
  {
    "id": "vi-010",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener left immediately after introducing the customer, before confirming conversation.",
    "options": [
      "Invalid risk",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Stay long enough to confirm both parties are talking."
  },
  {
    "id": "vi-011",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The customer clearly approved, the SA spoke first, and the opener introduced the customer by name.",
    "options": [
      "Valid XFER",
      "Invalid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "This is a proper handoff."
  },
  {
    "id": "vi-012",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener told the SA, “This person wants prices,” and left.",
    "options": [
      "Invalid risk",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Handoff wording should be professional and clear."
  },
  {
    "id": "vi-013",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The customer said “maybe later,” but the opener dialed anyway.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Maybe later is not clear approval."
  },
  {
    "id": "vi-014",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener used waiting questions while the advisor connected.",
    "options": [
      "Correct process",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Waiting questions reduce dead air."
  },
  {
    "id": "vi-015",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "en",
    "question": "The opener tagged XFER after only one ring to the advisor.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Dialing alone is not a completed transfer."
  },
  {
    "id": "vi-016",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El cliente aprobó, el asesor habló primero y ambos conversaron al menos 15 segundos.",
    "options": [
      "Valid XFER",
      "Invalid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Cumple el proceso limpio."
  },
  {
    "id": "vi-017",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener transfirió sin aprobación clara del cliente.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Se requiere aprobación antes de transferir."
  },
  {
    "id": "vi-018",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El cliente pidió callback cuando el asesor entró.",
    "options": [
      "Call Back",
      "Valid XFER",
      "Invalid XFER",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Si pide callback, no se cuenta como XFER limpio."
  },
  {
    "id": "vi-019",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El cliente colgó antes de una conversación real con el asesor.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "No hubo handoff real."
  },
  {
    "id": "vi-020",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener no verificó si el vehículo funciona antes de transferir.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "La condición del vehículo es obligatoria."
  },
  {
    "id": "vi-021",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El asesor quedó en silencio y el opener dijo “Hello Service Advisor”.",
    "options": [
      "Correct process",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Es correcto para evitar dead air."
  },
  {
    "id": "vi-022",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener prometió que sería menos de un minuto.",
    "options": [
      "Invalid risk",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "No se debe prometer tiempo."
  },
  {
    "id": "vi-023",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "Se usó SPXFER para un blind Spanish route.",
    "options": [
      "Incorrect disposition",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Debe usarse SPANIS."
  },
  {
    "id": "vi-024",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El cliente dijo que el carro no funciona actualmente.",
    "options": [
      "Do not transfer",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Vehículo con problemas actuales puede no calificar."
  },
  {
    "id": "vi-025",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener colgó apenas entró el asesor.",
    "options": [
      "Invalid risk",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Debe esperar y confirmar conversación."
  },
  {
    "id": "vi-026",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener presentó al cliente con nombre y esperó confirmación.",
    "options": [
      "Valid XFER",
      "Invalid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Ese es un handoff limpio."
  },
  {
    "id": "vi-027",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener dijo al asesor: “quiere precio” y salió.",
    "options": [
      "Invalid risk",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "La presentación debe ser profesional."
  },
  {
    "id": "vi-028",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El cliente dijo “tal vez” y aun así se transfirió.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Tal vez no es aprobación clara."
  },
  {
    "id": "vi-029",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "El opener mantuvo al cliente hablando con preguntas ligeras mientras conectaba.",
    "options": [
      "Correct process",
      "Valid XFER",
      "Invalid XFER",
      "Call Back"
    ],
    "correct": 0,
    "explanation": "Evita silencio y cuelgues."
  },
  {
    "id": "vi-030",
    "mode": "valid-invalid",
    "topic": "callflow",
    "language": "es",
    "question": "Se marcó XFER solo porque la llamada al asesor timbró.",
    "options": [
      "Invalid XFER",
      "Valid XFER",
      "Call Back",
      "Correct process"
    ],
    "correct": 0,
    "explanation": "Timbrar no equivale a transferencia completada."
  }
]

export const transferOrderChallenges = [
  {
    "id": "tp-001",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Build the clean transfer order.",
    "steps": [
      "Confirm vehicle qualification",
      "Get customer approval to transfer",
      "Start the transfer and stay on the line",
      "Wait for the Service Advisor to speak first",
      "Introduce the customer by name",
      "Stay at least 15 seconds and confirm both are talking"
    ],
    "explanation": "A valid handoff requires qualification, approval, SA connection, introduction, and wait time."
  },
  {
    "id": "tp-002",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the first four core script actions.",
    "steps": [
      "Greet the customer and identify yourself",
      "Mention the financed vehicle month and year",
      "State the extended warranty purpose line",
      "Ask if the vehicle is in good running condition"
    ],
    "explanation": "The script moves from intro to finance reference to purpose to eligibility."
  },
  {
    "id": "tp-003",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the SA handoff actions.",
    "steps": [
      "Customer gives approval",
      "Dial the Service Advisor",
      "Wait for the advisor to speak first",
      "Introduce the customer clearly",
      "Stay and confirm the conversation started"
    ],
    "explanation": "Do not introduce before the advisor speaks, and do not leave too early."
  },
  {
    "id": "tp-004",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the process when the SA is silent after connecting.",
    "steps": [
      "Stay on the 3-way call",
      "Wait briefly for the SA to respond",
      "Say “Hello Service Advisor” if there is no response",
      "Complete the introduction once the SA responds",
      "Add a note if the SA took longer than expected"
    ],
    "explanation": "Prompting the advisor after silence protects the call."
  },
  {
    "id": "tp-005",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order a clean callback handling flow.",
    "steps": [
      "Customer says they are busy",
      "Acknowledge their time",
      "Offer a specific callback window",
      "Confirm the callback time",
      "Use CALLBK"
    ],
    "explanation": "Callback handling should be respectful and properly tagged."
  },
  {
    "id": "tp-006",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the wrong number handling flow.",
    "steps": [
      "Person says the customer is not there",
      "Confirm it is the wrong number politely",
      "Avoid pitching the offer",
      "Use WN",
      "Move to the next call"
    ],
    "explanation": "Wrong numbers should not be forced into the pitch."
  },
  {
    "id": "tp-007",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the DNC handling flow.",
    "steps": [
      "Customer asks not to be called again",
      "Acknowledge the request",
      "Do not rebuttal further",
      "Use DNC",
      "End politely"
    ],
    "explanation": "DNC requests must be respected."
  },
  {
    "id": "tp-008",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the price objection bridge.",
    "steps": [
      "Customer asks for exact cost",
      "Acknowledge the question",
      "Explain cost depends on vehicle factors",
      "Bridge to the Service Advisor",
      "Ask for approval to introduce them"
    ],
    "explanation": "Openers should not quote exact prices."
  },
  {
    "id": "tp-009",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the insurance objection flow.",
    "steps": [
      "Customer says they have insurance",
      "Acknowledge it",
      "Explain insurance covers accidents",
      "Explain this is mechanical breakdown coverage",
      "Move back toward advisor review"
    ],
    "explanation": "Clear product distinction helps overcome confusion."
  },
  {
    "id": "tp-010",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the no-interest flow.",
    "steps": [
      "Customer says they are not interested",
      "Acknowledge calmly",
      "Ask a brief curiosity question",
      "Connect the risk to repair costs",
      "Move toward advisor review if they engage"
    ],
    "explanation": "Do not argue; create curiosity."
  },
  {
    "id": "tp-011",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the current vehicle verification flow.",
    "steps": [
      "Customer says the listed vehicle is wrong",
      "Acknowledge outdated info",
      "Ask what vehicle they currently drive",
      "Confirm it is running well",
      "Continue only if it may qualify"
    ],
    "explanation": "Wrong info can become a verification opportunity."
  },
  {
    "id": "tp-012",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the Spanish blind route logic.",
    "steps": [
      "Customer only speaks Spanish",
      "Do not continue in English if communication is not possible",
      "Route as Spanish speaker",
      "Use SPANIS",
      "Do not use SPXFER unless direct transfer happens"
    ],
    "explanation": "Blind Spanish route uses SPANIS."
  },
  {
    "id": "tp-013",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order a clean XFER disposition decision.",
    "steps": [
      "Vehicle is verified",
      "Approval is received",
      "SA speaks first",
      "Customer and SA talk",
      "Tag XFER"
    ],
    "explanation": "XFER requires a completed handoff."
  },
  {
    "id": "tp-014",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the invalid-transfer prevention checklist.",
    "steps": [
      "Verify the vehicle runs",
      "Get explicit approval",
      "Wait for SA to answer",
      "Introduce correctly",
      "Stay long enough to confirm conversation"
    ],
    "explanation": "These steps prevent invalid transfers."
  },
  {
    "id": "tp-015",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "en",
    "question": "Order the voicemail disposition flow.",
    "steps": [
      "Call reaches voicemail",
      "Do not pitch to voicemail as customer",
      "End according to process",
      "Use A",
      "Move to the next lead"
    ],
    "explanation": "Voicemail/answering machine is A."
  },
  {
    "id": "tp-016",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el flujo limpio de transferencia.",
    "steps": [
      "Confirmar que el vehículo funciona",
      "Pedir aprobación para transferir",
      "Marcar al Asesor de Servicio",
      "Esperar que el asesor hable primero",
      "Presentar al cliente",
      "Esperar 15 segundos y confirmar conversación"
    ],
    "explanation": "La transferencia limpia requiere todos estos pasos."
  },
  {
    "id": "tp-017",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el inicio del script en español.",
    "steps": [
      "Saludar al cliente por nombre",
      "Identificarte como Grupo de Servicios Vehiculares",
      "Mencionar mes y año del financiamiento",
      "Decir la línea de garantía extendida",
      "Verificar condición del vehículo"
    ],
    "explanation": "El script debe seguir orden lógico y aprobado."
  },
  {
    "id": "tp-018",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el manejo de “no me interesa”.",
    "steps": [
      "Reconocer la objeción",
      "No discutir",
      "Hacer una pregunta breve",
      "Crear curiosidad sobre costos de reparación",
      "Volver a la revisión con el asesor"
    ],
    "explanation": "La objeción se maneja con calma y curiosidad."
  },
  {
    "id": "tp-019",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el manejo de “ya tengo seguro”.",
    "steps": [
      "Reconocer el seguro",
      "Explicar que seguro cubre accidentes",
      "Aclarar que esto cubre fallas mecánicas",
      "Mantenerlo breve",
      "Volver al asesor"
    ],
    "explanation": "La diferencia de producto debe quedar clara."
  },
  {
    "id": "tp-020",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el flujo de callback.",
    "steps": [
      "Cliente dice que está ocupado",
      "Respetar su tiempo",
      "Ofrecer horario de callback",
      "Confirmar el horario",
      "Usar CALLBK"
    ],
    "explanation": "CALLBK aplica si el cliente pide llamada posterior."
  },
  {
    "id": "tp-021",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el flujo DNC.",
    "steps": [
      "Cliente pide no volver a llamar",
      "Reconocer la solicitud",
      "No seguir rebuttals",
      "Marcar DNC",
      "Cerrar con respeto"
    ],
    "explanation": "DNC debe respetarse de inmediato."
  },
  {
    "id": "tp-022",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena la ruta Spanish blind.",
    "steps": [
      "Cliente solo habla español",
      "No hay transferencia directa a closer",
      "Enrutar como Spanish speaker",
      "Usar SPANIS",
      "No usar SPXFER"
    ],
    "explanation": "SPANIS es para blind Spanish route."
  },
  {
    "id": "tp-023",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena la transferencia directa en español.",
    "steps": [
      "Cliente habla español",
      "Se conecta con closer/asesor en español",
      "Se presenta al cliente",
      "Ambos conversan",
      "Usar SPXFER"
    ],
    "explanation": "SPXFER es para transferencia directa en español."
  },
  {
    "id": "tp-024",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el manejo de wrong number.",
    "steps": [
      "Persona dice número equivocado",
      "Confirmar con respeto",
      "No hacer pitch",
      "Usar WN",
      "Continuar con siguiente llamada"
    ],
    "explanation": "WN aplica cuando el número no corresponde."
  },
  {
    "id": "tp-025",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el manejo de wrong vehicle.",
    "steps": [
      "Cliente dice que ese no es su vehículo",
      "Reconocer posible información vieja",
      "Preguntar por vehículo actual",
      "Verificar si funciona",
      "Usar WRNGVE si la info no coincide"
    ],
    "explanation": "WRNGVE aplica a información incorrecta del vehículo."
  },
  {
    "id": "tp-026",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el manejo de precio.",
    "steps": [
      "Cliente pregunta precio",
      "Reconocer la pregunta",
      "Explicar que depende de factores",
      "No dar precio exacto",
      "Puente al Asesor de Servicio"
    ],
    "explanation": "El opener no debe cotizar precio exacto."
  },
  {
    "id": "tp-027",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el handoff al asesor.",
    "steps": [
      "Cliente aprueba",
      "Se marca al asesor",
      "El asesor habla primero",
      "El opener presenta al cliente",
      "El opener confirma conversación"
    ],
    "explanation": "Ese orden protege la transferencia."
  },
  {
    "id": "tp-028",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el proceso si el asesor queda callado.",
    "steps": [
      "Permanecer en la línea",
      "Esperar brevemente",
      "Decir Hello Service Advisor",
      "Presentar al cliente cuando responda",
      "Documentar si hubo demora"
    ],
    "explanation": "Esto reduce dead air."
  },
  {
    "id": "tp-029",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena la decisión de XFER limpio.",
    "steps": [
      "Verificar vehículo",
      "Obtener aprobación",
      "Conectar con asesor",
      "Confirmar conversación",
      "Marcar XFER"
    ],
    "explanation": "XFER solo si hubo handoff real."
  },
  {
    "id": "tp-030",
    "mode": "transfer-protocol",
    "topic": "callflow",
    "language": "es",
    "question": "Ordena el checklist anti-invalid.",
    "steps": [
      "No saltar verificación",
      "No prometer tiempo",
      "No transferir sin aprobación",
      "No colgar inmediatamente",
      "Confirmar que ambos hablan"
    ],
    "explanation": "Este checklist reduce invalids."
  }
]

export const roleplayScenarios = [
  {
    "id": "rp-001",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "I am not interested.",
    "question": "Choose the best next move.",
    "options": [
      "Acknowledge and ask a short curiosity question.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Curiosity keeps the door open without pressure."
  },
  {
    "id": "rp-002",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "Where did you get my information?",
    "question": "Choose the safest answer.",
    "options": [
      "Say you partner with dealerships and vehicle registries.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Do not say the bank gave the information."
  },
  {
    "id": "rp-003",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "I already have insurance.",
    "question": "Choose the best product explanation.",
    "options": [
      "Insurance covers accidents; this is for mechanical breakdowns.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. This separates the products clearly."
  },
  {
    "id": "rp-004",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "How much is it?",
    "question": "Choose the cleanest bridge.",
    "options": [
      "Cost depends on factors; the Service Advisor can review it.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Do not quote prices as the opener."
  },
  {
    "id": "rp-005",
    "mode": "roleplay",
    "topic": "callflow",
    "language": "en",
    "customer": "I am busy right now.",
    "question": "Choose the best handling.",
    "options": [
      "Offer a callback time that works better.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Respect the customer’s time."
  },
  {
    "id": "rp-006",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "Take me off your list.",
    "question": "Choose the correct handling.",
    "options": [
      "Confirm removal politely and use DNC.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Removal requests should be respected."
  },
  {
    "id": "rp-007",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "That is not my vehicle.",
    "question": "Choose the next question.",
    "options": [
      "Ask what vehicle they currently drive and whether it runs well.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Redirect to current vehicle verification."
  },
  {
    "id": "rp-008",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "This sounds like a scam.",
    "question": "Choose the best tone.",
    "options": [
      "Stay calm, identify the company, and explain the purpose.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Trust concerns need clarity."
  },
  {
    "id": "rp-009",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "The advisor joined but is silent.",
    "question": "Choose the opener action.",
    "options": [
      "Say “Hello Service Advisor” and complete the handoff.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Avoid dead air."
  },
  {
    "id": "rp-010",
    "mode": "roleplay",
    "topic": "callflow",
    "language": "en",
    "customer": "I want information mailed first.",
    "question": "Choose the best bridge.",
    "options": [
      "The Service Advisor can review the details with you live.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Bridge without promising mail."
  },
  {
    "id": "rp-011",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "I sold that car.",
    "question": "Choose the best move.",
    "options": [
      "Ask whether they currently drive another vehicle.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Current vehicle may still matter."
  },
  {
    "id": "rp-012",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "Is this required?",
    "question": "Choose the safest answer.",
    "options": [
      "No, this is an opportunity to review options.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Do not make it sound mandatory."
  },
  {
    "id": "rp-013",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "I have coverage with another company.",
    "question": "Choose the best angle.",
    "options": [
      "Use it as a comparison opportunity.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Do not attack the current plan."
  },
  {
    "id": "rp-014",
    "mode": "roleplay",
    "topic": "objections",
    "language": "en",
    "customer": "Who is this?",
    "question": "Choose the correct identification.",
    "options": [
      "This is [name] with Vehicle Services Group.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Identify clearly."
  },
  {
    "id": "rp-015",
    "mode": "roleplay",
    "topic": "callflow",
    "language": "en",
    "customer": "The car has engine problems right now.",
    "question": "Choose the safest action.",
    "options": [
      "Do not treat it like a clean qualified transfer.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Good. Current mechanical issues are a risk."
  },
  {
    "id": "rp-016",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "No me interesa.",
    "question": "Elige el mejor siguiente paso.",
    "options": [
      "Reconocer y hacer una pregunta breve de curiosidad.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. No presiones, crea curiosidad."
  },
  {
    "id": "rp-017",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "¿De dónde sacaron mi información?",
    "question": "Elige la respuesta segura.",
    "options": [
      "Trabajamos con concesionarios y registros vehiculares.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. No digas que fue el banco."
  },
  {
    "id": "rp-018",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "Ya tengo seguro.",
    "question": "Elige la mejor explicación.",
    "options": [
      "El seguro cubre accidentes; esto cubre fallas mecánicas.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Aclara la diferencia."
  },
  {
    "id": "rp-019",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "¿Cuánto cuesta?",
    "question": "Elige el puente correcto.",
    "options": [
      "Depende de factores; el Asesor de Servicio puede revisarlo.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. El opener no cotiza."
  },
  {
    "id": "rp-020",
    "mode": "roleplay",
    "topic": "callflow",
    "language": "es",
    "customer": "Estoy ocupado.",
    "question": "Elige el manejo correcto.",
    "options": [
      "Ofrecer callback en un mejor momento.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Respeta el tiempo del cliente."
  },
  {
    "id": "rp-021",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "No me vuelvan a llamar.",
    "question": "Elige el manejo correcto.",
    "options": [
      "Confirmar con respeto y usar DNC.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. DNC se respeta."
  },
  {
    "id": "rp-022",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "Ese no es mi vehículo.",
    "question": "Elige la siguiente pregunta.",
    "options": [
      "Preguntar qué vehículo maneja actualmente y si funciona bien.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Verifica vehículo actual."
  },
  {
    "id": "rp-023",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "Esto suena a estafa.",
    "question": "Elige el tono correcto.",
    "options": [
      "Mantener calma, identificar la empresa y explicar el propósito.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Construye confianza."
  },
  {
    "id": "rp-024",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "El asesor entró pero no habla.",
    "question": "Elige la acción del opener.",
    "options": [
      "Decir “Hello Service Advisor” y completar el handoff.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Evita dead air."
  },
  {
    "id": "rp-025",
    "mode": "roleplay",
    "topic": "callflow",
    "language": "es",
    "customer": "Mándeme información primero.",
    "question": "Elige el mejor puente.",
    "options": [
      "El asesor puede revisar los detalles con usted en vivo.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. No prometas documentos."
  },
  {
    "id": "rp-026",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "Vendí ese carro.",
    "question": "Elige el mejor movimiento.",
    "options": [
      "Preguntar si maneja otro vehículo actualmente.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Puede haber vehículo actual."
  },
  {
    "id": "rp-027",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "¿Esto es obligatorio?",
    "question": "Elige la respuesta segura.",
    "options": [
      "No, es una oportunidad para revisar opciones.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. No lo hagas sonar obligatorio."
  },
  {
    "id": "rp-028",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "Tengo cobertura con otra compañía.",
    "question": "Elige el mejor ángulo.",
    "options": [
      "Usarlo como oportunidad de comparación.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. No ataques la cobertura actual."
  },
  {
    "id": "rp-029",
    "mode": "roleplay",
    "topic": "objections",
    "language": "es",
    "customer": "¿Quién habla?",
    "question": "Elige la identificación correcta.",
    "options": [
      "Le habla [nombre] de Grupo de Servicios Vehiculares.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Identifica claramente."
  },
  {
    "id": "rp-030",
    "mode": "roleplay",
    "topic": "callflow",
    "language": "es",
    "customer": "El carro tiene problemas de motor ahora.",
    "question": "Elige la acción segura.",
    "options": [
      "No tratarlo como transferencia limpia calificada.",
      "Transfer immediately.",
      "End the call without notes.",
      "Promise a specific price."
    ],
    "correct": 0,
    "outcome": "Bien. Es un riesgo de elegibilidad."
  }
]

export const gameChallengeBank = {
  'objection-battle': objectionBattleQuestions,
  'script-fill': scriptFillChallenges,
  'dispose-it': dispositionTrainerQuestions,
  'disposition-trainer': dispositionTrainerQuestions,
  'valid-invalid': validInvalidScenarios,
  'transfer-protocol': transferOrderChallenges,
  roleplay: roleplayScenarios,
  'speed-round': quizQuestions,
  certification: quizQuestions,
}
