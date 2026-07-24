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
    "question": "A customer asks if the call will lower their monthly payments, and the agent transfers without answering. What should QA flag?",
    "options": [
      "The agent waited too long after transfer.",
      "The mileage limit was explained too early.",
      "The customer was asked too many questions.",
      "Customer question was not clarified first."
    ],
    "correct": 3,
    "explanation": "The agent must clarify the nature of the call and answer key customer questions before transferring."
  },
  {
    "id": 2,
    "topic": "script",
    "language": "en",
    "question": "The customer says, “So this is from my bank?” Which answer keeps the script safest?",
    "options": [
      "Yes, your bank asked us to call you.",
      "The finance company sent the file.",
      "We work with dealerships and vehicle registries.",
      "Your lender approved the coverage."
    ],
    "correct": 2,
    "explanation": "Agents should not say the bank or lender provided the file."
  },
  {
    "id": 3,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “There is no cost at all, you only listen.” Why is this risky?",
    "options": [
      "It can sound like a free service promise.",
      "It confirms the vehicle is running well.",
      "It gives the advisor enough context.",
      "It helps separate insurance from coverage."
    ],
    "correct": 0,
    "explanation": "Do not use wording that can be interpreted as free coverage or guaranteed no cost."
  },
  {
    "id": 4,
    "topic": "script",
    "language": "en",
    "question": "The customer says “okay” after the vehicle runs question, but never agrees to the transfer. What is missing?",
    "options": [
      "The exact make and model.",
      "The customer’s full address.",
      "Clear approval to be transferred.",
      "A final monthly payment quote."
    ],
    "correct": 2,
    "explanation": "Vehicle condition approval is not the same as transfer consent."
  },
  {
    "id": 5,
    "topic": "script",
    "language": "en",
    "question": "A customer answers in English but sounds unsure and confused by basic questions. What should the agent do?",
    "options": [
      "Ask for the preferred language.",
      "Transfer as English XFER anyway.",
      "Keep reading faster in English.",
      "Mark NI without more context."
    ],
    "correct": 0,
    "explanation": "If the customer may not understand, the agent should verify language preference before continuing."
  },
  {
    "id": 6,
    "topic": "script",
    "language": "en",
    "question": "The agent changes small connector words but keeps the required meaning. When is that acceptable?",
    "options": [
      "When the company name is skipped.",
      "When vehicle condition is ignored.",
      "When compliance points stay intact.",
      "When transfer approval is assumed."
    ],
    "correct": 2,
    "explanation": "Natural wording is acceptable only if the required script meaning is preserved."
  },
  {
    "id": 7,
    "topic": "script",
    "language": "en",
    "question": "The customer asks, “What is this about?” Which response is safest?",
    "options": [
      "Your factory warranty is being renewed.",
      "The dealer already approved your plan.",
      "This is required to keep the vehicle legal.",
      "It is a review of possible coverage options."
    ],
    "correct": 3,
    "explanation": "The purpose should be presented as a coverage review/opportunity, not a guaranteed renewal."
  },
  {
    "id": 8,
    "topic": "script",
    "language": "en",
    "question": "The customer asks, “Who are you exactly?” What should the agent avoid?",
    "options": [
      "Explaining the call purpose calmly.",
      "Pretending to be the dealership.",
      "Identifying Vehicle Services Group.",
      "Continuing only after approval."
    ],
    "correct": 1,
    "explanation": "The agent should not claim to work for the dealer, manufacturer, or bank."
  },
  {
    "id": 9,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “Your warranty has expired and this is your final notice.” What is the issue?",
    "options": [
      "It checks language preference clearly.",
      "It gives the right disposition.",
      "It creates unsupported urgency.",
      "It confirms the Service Advisor first."
    ],
    "correct": 2,
    "explanation": "Agents should not create false or unsupported urgency beyond the approved script."
  },
  {
    "id": 10,
    "topic": "script",
    "language": "en",
    "question": "The customer asks for the price before vehicle condition is verified. What should the agent do?",
    "options": [
      "Skip condition and transfer fast.",
      "Bridge pricing to the Service Advisor after qualification.",
      "Say the quote is always free.",
      "Give the cheapest monthly amount."
    ],
    "correct": 1,
    "explanation": "The agent does not quote price; they confirm condition and bridge to the Service Advisor."
  },
  {
    "id": 11,
    "topic": "script",
    "language": "en",
    "question": "The customer says, “Thanks, I’m good,” and the agent says only “yeah” before transferring. What was missed?",
    "options": [
      "Dealer location confirmation.",
      "Objection handling and consent.",
      "Mileage calculation only.",
      "A pause code correction."
    ],
    "correct": 1,
    "explanation": "A casual response does not replace a rebuttal or clear consent to transfer."
  },
  {
    "id": 12,
    "topic": "script",
    "language": "en",
    "question": "The customer says the vehicle information is wrong. Which script direction is best?",
    "options": [
      "Say the file is never wrong.",
      "Mark DNC because data is wrong.",
      "Treat it as verification for the current vehicle.",
      "Transfer before asking anything."
    ],
    "correct": 2,
    "explanation": "Wrong or outdated vehicle data should be handled as a verification opportunity."
  },
  {
    "id": 13,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “The Service Advisor will lower your payment.” What is wrong?",
    "options": [
      "It keeps the handoff too clean.",
      "It promises a result not controlled by the agent.",
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
    "question": "The agent says, “I’ll introduce you, okay?” and the customer says, “To who?” What should happen?",
    "options": [
      "Mark XFER after the question.",
      "Dial first and explain later.",
      "Ignore it as small talk.",
      "Clarify the Service Advisor role."
    ],
    "correct": 3,
    "explanation": "If the customer asks who they are being connected to, the agent should clarify before dialing."
  },
  {
    "id": 15,
    "topic": "script",
    "language": "en",
    "question": "The customer asks if they must buy anything today. What should the agent say?",
    "options": [
      "The agent can approve the purchase.",
      "The bank already selected the plan.",
      "Yes, purchase is required today.",
      "The advisor reviews options; the customer decides."
    ],
    "correct": 3,
    "explanation": "The agent should not frame the call as mandatory or force a purchase."
  },
  {
    "id": 16,
    "topic": "script",
    "language": "en",
    "question": "The customer asks, “What vehicle are you calling about?” and the agent lacks make/model. What is safest?",
    "options": [
      "Reference finance info and verify current vehicle.",
      "Invent the likely make and model.",
      "Skip the vehicle check.",
      "Say the customer should know."
    ],
    "correct": 0,
    "explanation": "The approved direction is to use available finance info and verify the current vehicle condition."
  },
  {
    "id": 17,
    "topic": "script",
    "language": "en",
    "question": "The agent says the coverage is “from the manufacturer.” What should QA flag?",
    "options": [
      "Misrepresenting the coverage source.",
      "Using the customer name clearly.",
      "Waiting for the advisor to speak.",
      "Asking if the vehicle runs."
    ],
    "correct": 0,
    "explanation": "Agents should not say they work for car brands or the manufacturer."
  },
  {
    "id": 18,
    "topic": "script",
    "language": "en",
    "question": "The customer asks a direct question during the opening. What is the best rule?",
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
      "The call became a voicemail.",
      "The customer asked for RR.",
      "The vehicle became electric.",
      "The handoff was incomplete."
    ],
    "correct": 3,
    "explanation": "The transfer requires a professional introduction, not just connecting the lines."
  },
  {
    "id": 20,
    "topic": "script",
    "language": "en",
    "question": "The customer says, “I don't understand what you mean.” What should the agent not do?",
    "options": [
      "Ask language preference if needed.",
      "Restate the purpose simply.",
      "Confirm understanding first.",
      "Push to transfer without clarifying."
    ],
    "correct": 3,
    "explanation": "If understanding is unclear, the agent must clarify before moving to transfer."
  },
  {
    "id": 21,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “Not interested,” but gives no reason. What is the best first move?",
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
    "question": "The customer says, “I’m busy,” but does not refuse the call. What should the agent avoid?",
    "options": [
      "Promising it will take under a minute.",
      "Respecting the time objection.",
      "Asking if later works better.",
      "Offering a better callback time."
    ],
    "correct": 0,
    "explanation": "Agents should not promise exact or short wait times they cannot control."
  },
  {
    "id": 23,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “This sounds like a scam.” What is the safest tone?",
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
    "question": "The customer says, “I already have insurance.” What distinction should the agent make?",
    "options": [
      "Insurance pays every repair type.",
      "Coverage replaces legal insurance.",
      "Insurance and coverage are identical.",
      "Insurance covers accidents; coverage is mechanical."
    ],
    "correct": 3,
    "explanation": "Extended coverage and insurance must be separated clearly."
  },
  {
    "id": 25,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “I already have a warranty.” What is the safest positioning?",
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
    "question": "The customer asks, “Where did you get my information?” Which answer should be avoided?",
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
    "question": "The customer asks, “What vehicle?” and seems suspicious. What helps most?",
    "options": [
      "Tell them the question is irrelevant.",
      "Invent details to sound confident.",
      "Transfer because suspicion is normal.",
      "Explain the limit of your screen and verify."
    ],
    "correct": 3,
    "explanation": "Transparency about finance-only info helps build trust."
  },
  {
    "id": 28,
    "topic": "objections",
    "language": "en",
    "question": "The customer asks, “How much?” before giving vehicle condition. Which reply is safest?",
    "options": [
      "Pricing depends, and the advisor reviews it.",
      "It is always free today.",
      "The agent can approve a discount.",
      "The bank sets the lowest payment."
    ],
    "correct": 0,
    "explanation": "The agent can bridge pricing to the advisor, but should not quote or promise."
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
    "question": "The customer says the vehicle was totaled. What should the agent do next?",
    "options": [
      "Mark XFER if they listen.",
      "Promise coverage on the loss.",
      "Transfer for the totaled vehicle.",
      "Ask about a current drivable vehicle."
    ],
    "correct": 3,
    "explanation": "A totaled vehicle should not be moved forward; redirect to the current vehicle if any."
  },
  {
    "id": 31,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “That’s not my car.” What is the best response path?",
    "options": [
      "End the call as DNC.",
      "Say the file is always accurate.",
      "Transfer without correcting.",
      "Verify the current vehicle instead."
    ],
    "correct": 3,
    "explanation": "Wrong vehicle info should become a verification path."
  },
  {
    "id": 32,
    "topic": "objections",
    "language": "en",
    "question": "The customer has multiple vehicles. What must be confirmed before transfer?",
    "options": [
      "At least one vehicle runs and may qualify.",
      "Every vehicle has the same mileage.",
      "All vehicles were bought together.",
      "The customer knows each VIN."
    ],
    "correct": 0,
    "explanation": "For multiple cars, the agent should verify at least one current qualifying vehicle."
  },
  {
    "id": 33,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “That’s too expensive,” before the advisor reviews anything. What should the agent do?",
    "options": [
      "Reframe cost vs major repairs.",
      "Tell them price is fixed.",
      "Promise the cheapest plan.",
      "Agree and end the call at once."
    ],
    "correct": 0,
    "explanation": "The agent can reframe value but should not promise exact cost."
  },
  {
    "id": 34,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “You called before and I said no.” What should the agent use?",
    "options": [
      "A claim that refusal expired.",
      "A direct transfer without consent.",
      "A threat of losing legal driving rights.",
      "Updated options as the reason."
    ],
    "correct": 3,
    "explanation": "Reopening curiosity with updated options is safer than pressure."
  },
  {
    "id": 35,
    "topic": "objections",
    "language": "en",
    "question": "The customer is rude and asks to stop calling. What is the professional path?",
    "options": [
      "Keep rebutting aggressively.",
      "Mirror the customer’s tone.",
      "Stay calm and process removal.",
      "Transfer to avoid the conflict."
    ],
    "correct": 2,
    "explanation": "Rude behavior plus a stop-calling request should be handled professionally, often as DNC."
  },
  {
    "id": 36,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “I’m not the owner, I just co-signed.” What should the agent check?",
    "options": [
      "Whether they know the advisor’s name.",
      "Whether they can make decisions.",
      "Whether the vehicle has a radio.",
      "Whether they want a free quote."
    ],
    "correct": 1,
    "explanation": "Co-signer status does not automatically mean they are the decision maker."
  },
  {
    "id": 37,
    "topic": "objections",
    "language": "en",
    "question": "The customer gives polite “sure” answers but sounds distracted. What is the risk?",
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
    "question": "The customer asks, “Can you just tell me the plan details?” What is the best bridge?",
    "options": [
      "The customer must buy before details.",
      "The agent should invent plan terms.",
      "Plan details are never explained.",
      "The Service Advisor reviews details after verification."
    ],
    "correct": 3,
    "explanation": "The agent should not over-explain or invent details; bridge to the Service Advisor."
  },
  {
    "id": 39,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “I need Spanish,” after struggling in English. What should the agent do?",
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
    "question": "The customer asks if the advisor will only take “a few seconds.” What should the agent avoid?",
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
      "2010 SUV, 80,000 miles, runs well.",
      "2022 electric car, 30,000 miles, runs well.",
      "2016 gas sedan, 110,000 miles, runs well.",
      "2019 truck, 181,000 miles, runs well."
    ],
    "correct": 2,
    "explanation": "The safest case meets year, mileage, vehicle type, and running-condition rules."
  },
  {
    "id": 42,
    "topic": "product",
    "language": "en",
    "question": "A 2020 electric vehicle has 30,000 miles and runs well. What matters most?",
    "options": [
      "Running condition overrides type.",
      "The Service Advisor must approve it.",
      "Electric vehicles are excluded.",
      "Low mileage makes it eligible."
    ],
    "correct": 2,
    "explanation": "Electric vehicle exclusion still applies even with good mileage."
  },
  {
    "id": 43,
    "topic": "product",
    "language": "en",
    "question": "A 2011 car has 176,200 miles and runs well. What should the agent understand?",
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
    "question": "A 2010 vehicle has 92,000 miles and no issues. What is the concern?",
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
    "question": "The car runs, but the customer says it is missing a tire. What is best?",
    "options": [
      "Ignore it because engine runs.",
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
    "question": "The customer says the check engine light is on today. What should the agent avoid?",
    "options": [
      "Treating it as clearly qualified.",
      "Asking what issue is happening.",
      "Clarifying if it still drives.",
      "Noting there is a warning light."
    ],
    "correct": 0,
    "explanation": "Current warning lights or issues must be clarified before transfer."
  },
  {
    "id": 47,
    "topic": "product",
    "language": "en",
    "question": "The vehicle starts but cannot shift into gear. What does that suggest?",
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
    "question": "The customer asks if accident body damage is covered. What is safest?",
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
    "question": "The customer asks if worn brake pads are covered. What should the agent know?",
    "options": [
      "Worn pads always qualify the car.",
      "The advisor must cover pads.",
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
    "question": "A vehicle has modified suspension. What is the safest statement?",
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
    "question": "A customer has a motorcycle with low mileage. What should the agent remember?",
    "options": [
      "It qualifies if the advisor agrees.",
      "Motorcycles are excluded types.",
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
    "question": "The customer has three cars. What must be true before transfer?",
    "options": [
      "At least one current vehicle should qualify.",
      "The customer must know all VINs.",
      "All three must be from the same year.",
      "The oldest vehicle decides coverage."
    ],
    "correct": 0,
    "explanation": "With multiple cars, qualify at least one current running vehicle."
  },
  {
    "id": 54,
    "topic": "product",
    "language": "en",
    "question": "The customer has a current engine problem. What should the agent avoid promising?",
    "options": [
      "That the advisor reviews options.",
      "That mechanical coverage is different.",
      "That running condition matters.",
      "That the existing issue will be fixed."
    ],
    "correct": 3,
    "explanation": "Agents must not promise coverage for pre-existing or current issues."
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
    "question": "The customer asks if the plan can add coverage after factory coverage ends. What is accurate?",
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
    "explanation": "Financing does not override an electric vehicle exclusion."
  },
  {
    "id": 59,
    "topic": "product",
    "language": "en",
    "question": "The customer does not know exact mileage but thinks it is around 170,000. What is best?",
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
      "2012 vehicle with 90,000 miles.",
      "2018 vehicle with 120,000 miles.",
      "2019 vehicle with 182,000 miles.",
      "2015 vehicle with 75,000 miles."
    ],
    "correct": 2,
    "explanation": "Over 175,000 miles is outside the stated mileage rule."
  },
  {
    "id": 61,
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
    "explanation": "This prevents a dead air transfer to the Service Advisor."
  },
  {
    "id": 62,
    "topic": "callflow",
    "language": "en",
    "question": "Why is “Leave 3-Way Call” dangerous after the customer hangs up?",
    "options": [
      "It changes the vehicle mileage.",
      "It automatically sends a Spanish route.",
      "It removes the callback option.",
      "The advisor may receive a ringing call with no customer."
    ],
    "correct": 3,
    "explanation": "Leaving the 3-way can create dead air for the Service Advisor when the customer is gone."
  },
  {
    "id": 63,
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
    "id": 64,
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
    "id": 65,
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
    "id": 66,
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
    "id": 67,
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
    "id": 68,
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
    "id": 69,
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
    "id": 70,
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
    "id": 71,
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
    "id": 72,
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
    "id": 73,
    "topic": "callflow",
    "language": "en",
    "question": "The customer says no to being transferred after qualifying. What should the agent avoid?",
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
    "id": 74,
    "topic": "callflow",
    "language": "en",
    "question": "The advisor line rings but no advisor answers. What should the agent avoid?",
    "options": [
      "Following callback handling if needed.",
      "Counting it as valid XFER.",
      "Protecting the customer experience.",
      "Avoiding dead air transfer."
    ],
    "correct": 1,
    "explanation": "A valid XFER requires a Service Advisor/customer handoff."
  },
  {
    "id": 75,
    "topic": "callflow",
    "language": "en",
    "question": "The agent introduces the customer before the advisor speaks. What is the risk?",
    "options": [
      "The mileage is reset.",
      "The call becomes a voicemail.",
      "The handoff may not be controlled.",
      "The customer becomes co-signer."
    ],
    "correct": 2,
    "explanation": "The advisor should speak first so the introduction lands cleanly."
  },
  {
    "id": 76,
    "topic": "callflow",
    "language": "en",
    "question": "The customer hangs up after agent introduction but before any advisor conversation. What should happen?",
    "options": [
      "Count it because intro happened.",
      "Use Answering Machine.",
      "Do not count it as clean XFER.",
      "Mark SPXFER automatically."
    ],
    "correct": 2,
    "explanation": "Introduction alone does not prove an active conversation between advisor and customer."
  },
  {
    "id": 77,
    "topic": "callflow",
    "language": "en",
    "question": "The customer starts speaking Spanish during an English transfer wait. What should the agent consider?",
    "options": [
      "The vehicle is automatically invalid.",
      "English transfer must be forced.",
      "DNC is required immediately.",
      "Preferred language may need confirmation."
    ],
    "correct": 3,
    "explanation": "Language changes can indicate the customer needs Spanish handling."
  },
  {
    "id": 78,
    "topic": "callflow",
    "language": "en",
    "question": "The agent stays on the line for a long time after both parties are talking. What is the coaching point?",
    "options": [
      "Stay until the full sale closes.",
      "Leave before the advisor speaks.",
      "Mute and count extra time.",
      "Stay enough, not longer than necessary."
    ],
    "correct": 3,
    "explanation": "The rule protects handoff; it does not mean staying unnecessarily long."
  },
  {
    "id": 79,
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
    "explanation": "Clear refusal means consent is not present."
  },
  {
    "id": 80,
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
    "id": 81,
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
    "id": 82,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer hears the script then hangs up. Which disposition usually fits better than DAIR?",
    "options": [
      "Manage",
      "NI",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "If there was contact and the customer drops after the pitch, DAIR is not usually the best fit."
  },
  {
    "id": 83,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer says, “Stop calling me or I’ll report this.” Which disposition fits?",
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
    "id": 84,
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
    "id": 85,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer says they are busy and still refuses after callback rebuttal. What disposition fits?",
    "options": [
      "XFER",
      "CALLBK",
      "A",
      "DAIR"
    ],
    "correct": 1,
    "explanation": "A callback request or clear later-time request should be CALLBK."
  },
  {
    "id": 86,
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
    "id": 87,
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
    "id": 88,
    "topic": "dosdonts",
    "language": "en",
    "question": "The person says this is the wrong number. Which disposition area matters?",
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
    "id": 89,
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
    "id": 90,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer asks about lower payments, and the agent never clarifies. What does this create?",
    "options": [
      "A better Answering Machine case.",
      "A stronger mileage qualification.",
      "Invalid transfer risk.",
      "An automatic Spanish transfer."
    ],
    "correct": 2,
    "explanation": "Unanswered questions about call purpose or payments can make the transfer misleading."
  },
  {
    "id": 91,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent says “free coverage” during the pitch. What should QA flag?",
    "options": [
      "Proper callback handling.",
      "Correct transfer timing.",
      "Misleading wording.",
      "Good language detection."
    ],
    "correct": 2,
    "explanation": "Free coverage language can be misleading and should be avoided."
  },
  {
    "id": 92,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent promises, “The advisor will only take two minutes.” What is the issue?",
    "options": [
      "Asking if the vehicle runs.",
      "Promising time not controlled by agent.",
      "Using Vehicle Services Group.",
      "Letting the advisor speak first."
    ],
    "correct": 1,
    "explanation": "Agents should not promise specific waiting or advisor times."
  },
  {
    "id": 93,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent says the bank provided the information. What rule is broken?",
    "options": [
      "Do not say the bank gave the file.",
      "Do not verify vehicle condition.",
      "Do not ask language preference.",
      "Do not use Service Advisor."
    ],
    "correct": 0,
    "explanation": "The approved source explanation is dealerships/registries, not the bank."
  },
  {
    "id": 94,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent transfers after a vague “I guess.” What should QA question?",
    "options": [
      "Whether consent was clear.",
      "Whether the vehicle had low mileage.",
      "Whether RR was the right pause.",
      "Whether the advisor was in Texas."
    ],
    "correct": 0,
    "explanation": "Vague approval should be clarified before transfer."
  },
  {
    "id": 95,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer asks, “What am I agreeing to?” right before transfer. What should the agent do?",
    "options": [
      "Tell them it no longer matters.",
      "Mark XFER after the question.",
      "Clarify before dialing.",
      "Dial and let advisor explain later."
    ],
    "correct": 2,
    "explanation": "Consent is not clean if the customer does not understand the transfer."
  },
  {
    "id": 96,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer is not the owner and cannot decide. What outcome should be avoided?",
    "options": [
      "Offering callback if needed.",
      "Requesting a decision maker.",
      "Counting it as a clean transfer.",
      "Documenting the situation."
    ],
    "correct": 2,
    "explanation": "Decision authority matters for a valid transfer path."
  },
  {
    "id": 97,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer hangs up before any advisor conversation, but the agent marks XFER. What is wrong?",
    "options": [
      "The vehicle became under mileage.",
      "The agent should have used SPXFER.",
      "The call became Answering Machine.",
      "XFER was used without real handoff."
    ],
    "correct": 3,
    "explanation": "A real advisor/customer conversation is needed for a clean XFER."
  },
  {
    "id": 98,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent selects Leave 3-Way Call after the customer disappears. What can happen?",
    "options": [
      "Dead air transfer to the Service Advisor.",
      "Mileage limit correction.",
      "Advisor receives full customer consent.",
      "Automatic DNC processing."
    ],
    "correct": 0,
    "explanation": "This is why Hung Up Both Lines matters when the customer hangs up."
  },
  {
    "id": 99,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer speaks English to the agent but clearly cannot follow the call. What should not happen?",
    "options": [
      "Checking language preference.",
      "Slowing down to clarify.",
      "Forcing an English XFER anyway.",
      "Using correct Spanish route if needed."
    ],
    "correct": 2,
    "explanation": "Understanding must be clear before moving a customer into an English transfer."
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
    "explanation": "Skipping purpose and transferring confusion creates invalid/QA risk."
  },
  {
    "id": 101,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta si la llamada bajará sus pagos mensuales, y el agent transfiere sin responder. ¿Qué debería marcar QA?",
    "options": [
      "Esperó demasiado después del transfer.",
      "No aclaró primero la pregunta del cliente.",
      "Hizo demasiadas preguntas al cliente.",
      "Explicó el límite de millas muy temprano."
    ],
    "correct": 1,
    "explanation": "El agent debe aclarar la naturaleza de la llamada y responder preguntas clave antes de transferir."
  },
  {
    "id": 102,
    "topic": "script",
    "language": "es",
    "question": "El cliente dice: “¿Entonces esto viene de mi banco?” ¿Qué respuesta mantiene el script más seguro?",
    "options": [
      "Sí, su banco pidió que llamáramos.",
      "Trabajamos con dealers y registros vehiculares.",
      "Su lender aprobó la cobertura.",
      "La financiera envió el archivo."
    ],
    "correct": 1,
    "explanation": "No se debe decir que el banco o lender entregó el archivo."
  },
  {
    "id": 103,
    "topic": "script",
    "language": "es",
    "question": "El agent dice: “No tiene ningún costo, solo escucha.” ¿Por qué es riesgoso?",
    "options": [
      "Diferencia seguro de cobertura.",
      "Confirma que el vehículo funciona bien.",
      "Le da contexto suficiente al Advisor.",
      "Puede sonar como promesa de servicio gratis."
    ],
    "correct": 3,
    "explanation": "No uses wording que se pueda interpretar como cobertura gratis o sin costo garantizado."
  },
  {
    "id": 104,
    "topic": "script",
    "language": "es",
    "question": "El cliente dice “okay” al confirmar que el carro funciona, pero nunca acepta el transfer. ¿Qué falta?",
    "options": [
      "Una cotización mensual final.",
      "Aprobación clara para transferir.",
      "La dirección completa del cliente.",
      "La marca y modelo exactos."
    ],
    "correct": 1,
    "explanation": "Confirmar que el vehículo funciona no es lo mismo que aceptar la transferencia."
  },
  {
    "id": 105,
    "topic": "script",
    "language": "es",
    "question": "Un cliente responde en inglés, pero parece confundido con preguntas básicas. ¿Qué debe hacer el agent?",
    "options": [
      "Preguntar idioma de preferencia.",
      "Marcar NI sin más contexto.",
      "Transferir como English XFER igual.",
      "Leer más rápido en inglés."
    ],
    "correct": 0,
    "explanation": "Si el cliente no parece entender, el agent debe verificar el idioma de preferencia antes de seguir."
  },
  {
    "id": 106,
    "topic": "script",
    "language": "es",
    "question": "El agent cambia palabras pequeñas, pero mantiene el sentido requerido. ¿Cuándo es aceptable?",
    "options": [
      "Cuando omite la compañía.",
      "Cuando mantiene los puntos de compliance.",
      "Cuando asume aprobación.",
      "Cuando ignora condición del vehículo."
    ],
    "correct": 1,
    "explanation": "Sonar natural es aceptable solo si mantiene el mínimo requerido del script."
  },
  {
    "id": 107,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta: “¿De qué se trata?” ¿Qué respuesta es más segura?",
    "options": [
      "Se está renovando la garantía de fábrica.",
      "El dealer ya aprobó su plan.",
      "Es obligatorio para manejar legalmente.",
      "Es una revisión de posibles opciones."
    ],
    "correct": 3,
    "explanation": "El propósito debe explicarse como revisión de opciones, no como renovación garantizada."
  },
  {
    "id": 108,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta: “¿Quiénes son exactamente?” ¿Qué debe evitar el agent?",
    "options": [
      "Seguir solo con aprobación.",
      "Identificarse como Vehicle Services Group.",
      "Hacerse pasar por el dealer.",
      "Explicar con calma el propósito."
    ],
    "correct": 2,
    "explanation": "El agent no debe decir que trabaja para el dealer, fabricante o banco."
  },
  {
    "id": 109,
    "topic": "script",
    "language": "es",
    "question": "El agent dice: “Su garantía expiró y es aviso final.” ¿Cuál es el problema?",
    "options": [
      "Crea urgencia no respaldada.",
      "Confirma primero al Service Advisor.",
      "Pregunta claramente el idioma.",
      "Da la disposición correcta."
    ],
    "correct": 0,
    "explanation": "No se debe crear urgencia falsa o no respaldada por el script aprobado."
  },
  {
    "id": 110,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta el precio antes de verificar condición del vehículo. ¿Qué debe hacer el agent?",
    "options": [
      "Decir que la cotización siempre es gratis.",
      "Dar el pago mensual más bajo.",
      "Saltar condición y transferir rápido.",
      "Llevar precio al Advisor tras calificar."
    ],
    "correct": 3,
    "explanation": "El agent no cotiza precio; verifica condición y conecta con el Service Advisor."
  },
  {
    "id": 111,
    "topic": "script",
    "language": "es",
    "question": "El cliente dice: “Gracias, estoy bien”, y el agent solo dice “sí” antes de transferir. ¿Qué faltó?",
    "options": [
      "Manejo de objeción y consentimiento.",
      "Confirmación de ubicación del dealer.",
      "Cálculo de millaje solamente.",
      "Corrección de pause code."
    ],
    "correct": 0,
    "explanation": "Una respuesta casual no reemplaza rebuttal ni consentimiento claro para transferir."
  },
  {
    "id": 112,
    "topic": "script",
    "language": "es",
    "question": "El cliente dice que la información del vehículo está mal. ¿Qué dirección del script es mejor?",
    "options": [
      "Marcar DNC por datos errados.",
      "Transferir antes de preguntar.",
      "Decir que el archivo nunca falla.",
      "Tratarlo como verificación del vehículo actual."
    ],
    "correct": 3,
    "explanation": "Información errada o vieja se maneja como oportunidad de verificación."
  },
  {
    "id": 113,
    "topic": "script",
    "language": "es",
    "question": "El agent dice: “El Service Advisor le bajará el pago.” ¿Qué está mal?",
    "options": [
      "Confirma elegibilidad muy lento.",
      "Mantiene el handoff muy limpio.",
      "Pide aprobación demasiado clara.",
      "Promete un resultado no controlado."
    ],
    "correct": 3,
    "explanation": "El agent no debe prometer pagos más bajos ni resultados garantizados."
  },
  {
    "id": 114,
    "topic": "script",
    "language": "es",
    "question": "El agent dice: “Se lo presento, okay?” y el cliente pregunta: “¿A quién?” ¿Qué debe pasar?",
    "options": [
      "Marcar XFER tras la pregunta.",
      "Ignorarlo como small talk.",
      "Aclarar el rol del Service Advisor.",
      "Marcar primero y explicar luego."
    ],
    "correct": 2,
    "explanation": "Si el cliente pregunta con quién lo conectan, se debe aclarar antes de marcar."
  },
  {
    "id": 115,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta si debe comprar algo hoy. ¿Qué debe decir el agent?",
    "options": [
      "El Advisor revisa opciones; el cliente decide.",
      "Sí, la compra es obligatoria hoy.",
      "El agent puede aprobar la compra.",
      "El banco ya eligió el plan."
    ],
    "correct": 0,
    "explanation": "No se debe presentar la llamada como obligatoria ni forzar compra."
  },
  {
    "id": 116,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta: “¿De qué vehículo hablan?” y el agent no tiene marca/modelo. ¿Qué es más seguro?",
    "options": [
      "Saltar verificación del vehículo.",
      "Usar info financiera y verificar vehículo actual.",
      "Decir que el cliente debería saber.",
      "Inventar marca y modelo probable."
    ],
    "correct": 1,
    "explanation": "Se usa la información financiera disponible y se verifica la condición del vehículo actual."
  },
  {
    "id": 117,
    "topic": "script",
    "language": "es",
    "question": "El agent dice que la cobertura viene “del fabricante.” ¿Qué debería marcar QA?",
    "options": [
      "Representar mal el origen de cobertura.",
      "Esperar a que hable el Advisor.",
      "Preguntar si el vehículo funciona.",
      "Usar claramente el nombre del cliente."
    ],
    "correct": 0,
    "explanation": "El agent no debe decir que trabaja para marcas o fabricantes."
  },
  {
    "id": 118,
    "topic": "script",
    "language": "es",
    "question": "El cliente hace una pregunta directa al inicio. ¿Cuál es la mejor regla?",
    "options": [
      "Transferir rápido para evitar objeciones.",
      "Responder o aclarar antes de avanzar.",
      "Ignorar preguntas hasta el Advisor.",
      "Repetir el script más fuerte."
    ],
    "correct": 1,
    "explanation": "Preguntas sin responder pueden volver el transfer confuso o inválido."
  },
  {
    "id": 119,
    "topic": "script",
    "language": "es",
    "question": "El agent obtiene aprobación pero nunca presenta al cliente por nombre al Service Advisor. ¿Cuál es el problema?",
    "options": [
      "La llamada se volvió voicemail.",
      "El handoff quedó incompleto.",
      "El cliente pidió RR.",
      "El vehículo se volvió eléctrico."
    ],
    "correct": 1,
    "explanation": "La transferencia requiere presentación profesional, no solo conectar líneas."
  },
  {
    "id": 120,
    "topic": "script",
    "language": "es",
    "question": "El cliente dice: “No entiendo qué quiere decir.” ¿Qué no debe hacer el agent?",
    "options": [
      "Repetir el propósito simple.",
      "Preguntar idioma si aplica.",
      "Forzar transfer sin aclarar.",
      "Confirmar comprensión primero."
    ],
    "correct": 2,
    "explanation": "Si no entiende, el agent debe aclarar antes de transferir."
  },
  {
    "id": 121,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “No me interesa”, sin dar razón. ¿Cuál es el mejor primer paso?",
    "options": [
      "Discutir costos de reparación.",
      "Transferir antes de que cuelgue.",
      "Preguntar una razón breve.",
      "Marcar DNC inmediatamente."
    ],
    "correct": 2,
    "explanation": "El agent necesita una razón para escoger el rebuttal correcto."
  },
  {
    "id": 122,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Estoy ocupado”, pero no rechaza totalmente. ¿Qué debe evitar el agent?",
    "options": [
      "Respetar la objeción de tiempo.",
      "Prometer que toma menos de un minuto.",
      "Ofrecer una hora mejor de callback.",
      "Preguntar si más tarde sirve."
    ],
    "correct": 1,
    "explanation": "No se deben prometer tiempos exactos o cortos que el agent no controla."
  },
  {
    "id": 123,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Esto suena a estafa.” ¿Qué tono es más seguro?",
    "options": [
      "Rápido y despectivo.",
      "Defensivo y discutidor.",
      "Calmado, transparente y controlado.",
      "Callado hasta que termine."
    ],
    "correct": 2,
    "explanation": "Una duda de scam requiere generar confianza, no presión."
  },
  {
    "id": 124,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Ya tengo seguro.” ¿Qué diferencia debe explicar el agent?",
    "options": [
      "Seguro y cobertura son iguales.",
      "Cobertura reemplaza seguro legal.",
      "Seguro paga toda reparación.",
      "Seguro cubre accidentes; cobertura es mecánica."
    ],
    "correct": 3,
    "explanation": "Se debe diferenciar claramente seguro y cobertura extendida."
  },
  {
    "id": 125,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Ya tengo garantía.” ¿Cuál es el posicionamiento más seguro?",
    "options": [
      "Decir que su plan no sirve.",
      "Revisar opciones actualizadas o adicionales.",
      "Prometer reemplazo más barato.",
      "Decirle que cancele el plan."
    ],
    "correct": 1,
    "explanation": "Si ya tiene cobertura, se maneja como revisión, no como ataque."
  },
  {
    "id": 126,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pregunta: “¿De dónde sacaron mi información?” ¿Qué respuesta se debe evitar?",
    "options": [
      "Nos asociamos con dealers.",
      "La llamada es revisión de elegibilidad.",
      "Su banco nos envió el archivo.",
      "Trabajamos con registros vehiculares."
    ],
    "correct": 2,
    "explanation": "Decir que viene del banco crea riesgo de compliance."
  },
  {
    "id": 127,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pregunta: “¿Qué vehículo?” y suena desconfiado. ¿Qué ayuda más?",
    "options": [
      "Transferir porque es normal.",
      "Decir que la pregunta no importa.",
      "Inventar detalles con seguridad.",
      "Explicar límite del sistema y verificar."
    ],
    "correct": 3,
    "explanation": "Ser transparente con la info financiera ayuda a crear confianza."
  },
  {
    "id": 128,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pregunta: “¿Cuánto cuesta?” antes de confirmar condición. ¿Qué respuesta es más segura?",
    "options": [
      "El agent aprueba descuento.",
      "Siempre es gratis hoy.",
      "El banco fija el pago bajo.",
      "Depende, y el Advisor lo revisa."
    ],
    "correct": 3,
    "explanation": "El agent puede llevar precio al Advisor, pero no cotizar ni prometer."
  },
  {
    "id": 129,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Mándeme un email primero.” ¿Qué debe evitar el agent?",
    "options": [
      "Prometer enviar documentos de póliza.",
      "Confirmar condición del vehículo.",
      "Preguntar si el vehículo funciona.",
      "Explicar que el Advisor revisa detalles."
    ],
    "correct": 0,
    "explanation": "El agent no debe prometer emails o documentos que no puede enviar."
  },
  {
    "id": 130,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice que el vehículo fue pérdida total. ¿Qué debe hacer luego el agent?",
    "options": [
      "Marcar XFER si escucha.",
      "Preguntar por vehículo actual manejable.",
      "Prometer cobertura de la pérdida.",
      "Transferir por el totalizado."
    ],
    "correct": 1,
    "explanation": "Un vehículo totalizado no se avanza; se redirige al vehículo actual si existe."
  },
  {
    "id": 131,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Ese no es mi carro.” ¿Cuál es la mejor ruta?",
    "options": [
      "Verificar el vehículo actual.",
      "Decir que el archivo siempre está correcto.",
      "Cerrar como DNC.",
      "Transferir sin corregir."
    ],
    "correct": 0,
    "explanation": "Vehículo incorrecto debe manejarse como verificación."
  },
  {
    "id": 132,
    "topic": "objections",
    "language": "es",
    "question": "El cliente tiene varios vehículos. ¿Qué debe confirmarse antes de transferir?",
    "options": [
      "Todos tienen el mismo millaje.",
      "Todos se compraron juntos.",
      "Al menos uno funciona y podría calificar.",
      "El cliente sabe cada VIN."
    ],
    "correct": 2,
    "explanation": "Con varios carros, se verifica al menos un vehículo actual que pueda calificar."
  },
  {
    "id": 133,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Eso es muy caro”, antes de que el Advisor revise. ¿Qué debe hacer el agent?",
    "options": [
      "Decir que el precio es fijo.",
      "Prometer el plan más barato.",
      "Aceptar y cerrar de inmediato.",
      "Replantear costo vs reparaciones."
    ],
    "correct": 3,
    "explanation": "El agent puede replantear valor, pero no prometer costo exacto."
  },
  {
    "id": 134,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Ya llamaron y dije que no.” ¿Qué debe usar el agent?",
    "options": [
      "Opciones actualizadas como razón.",
      "Amenazar derechos para manejar.",
      "Decir que el rechazo expiró.",
      "Transferir directo sin consentimiento."
    ],
    "correct": 0,
    "explanation": "Reabrir curiosidad con opciones actualizadas es más seguro que presionar."
  },
  {
    "id": 135,
    "topic": "objections",
    "language": "es",
    "question": "El cliente es grosero y pide que no llamen más. ¿Cuál es el camino profesional?",
    "options": [
      "Responder con el mismo tono.",
      "Seguir rebatiendo fuerte.",
      "Transferir para evitar conflicto.",
      "Mantener calma y procesar remoción."
    ],
    "correct": 3,
    "explanation": "Grosería con petición de no llamar se maneja profesionalmente, usualmente DNC."
  },
  {
    "id": 136,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “No soy dueño, solo co-signer.” ¿Qué debe revisar el agent?",
    "options": [
      "Si el vehículo tiene radio.",
      "Si quiere cotización gratis.",
      "Si puede tomar decisiones.",
      "Si conoce al Advisor."
    ],
    "correct": 2,
    "explanation": "Ser co-signer no significa automáticamente ser decision maker."
  },
  {
    "id": 137,
    "topic": "objections",
    "language": "es",
    "question": "El cliente da respuestas tipo “sure” pero suena distraído. ¿Cuál es el riesgo?",
    "options": [
      "El consentimiento puede no ser real.",
      "El Advisor no puede hablar primero.",
      "El millaje queda desconocido.",
      "El vehículo queda modificado."
    ],
    "correct": 0,
    "explanation": "El agent debe confirmar comprensión, no depender de un acuerdo débil."
  },
  {
    "id": 138,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pide: “Dígame los detalles del plan.” ¿Cuál es el mejor puente?",
    "options": [
      "El Advisor revisa detalles tras verificación.",
      "Los detalles nunca se explican.",
      "El agent debe inventar términos.",
      "Debe comprar antes de detalles."
    ],
    "correct": 0,
    "explanation": "El agent no debe inventar detalles; debe llevar al Service Advisor."
  },
  {
    "id": 139,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Necesito español”, tras batallar en inglés. ¿Qué debe hacer el agent?",
    "options": [
      "Ignorarlo hasta el Advisor.",
      "Usar el manejo correcto en español.",
      "Marcar XFER como inglés.",
      "Seguir el script en inglés."
    ],
    "correct": 1,
    "explanation": "Se debe respetar el idioma y usar la ruta correcta."
  },
  {
    "id": 140,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pregunta si el Advisor tomará “unos segundos.” ¿Qué debe evitar el agent?",
    "options": [
      "Garantizar espera corta.",
      "Decir que el Advisor revisa detalles.",
      "Hacer preguntas de espera.",
      "Mantener al cliente conectado."
    ],
    "correct": 0,
    "explanation": "El agent no controla el tiempo del Advisor y no debe prometerlo."
  },
  {
    "id": 141,
    "topic": "product",
    "language": "es",
    "question": "¿Qué caso es más seguro para continuar a transfer?",
    "options": [
      "Carro eléctrico 2022, 30,000 millas, funciona.",
      "Sedán gasolina 2016, 110,000 millas, funciona.",
      "SUV 2010, 80,000 millas, funciona.",
      "Truck 2019, 181,000 millas, funciona."
    ],
    "correct": 1,
    "explanation": "El caso seguro cumple año, millaje, tipo de vehículo y condición de funcionamiento."
  },
  {
    "id": 142,
    "topic": "product",
    "language": "es",
    "question": "Un vehículo eléctrico 2020 tiene 30,000 millas y funciona. ¿Qué pesa más?",
    "options": [
      "El Advisor debe aprobarlo.",
      "Funcionando anula el tipo.",
      "Los eléctricos están excluidos.",
      "Bajo millaje lo hace elegible."
    ],
    "correct": 2,
    "explanation": "La exclusión de eléctricos aplica aunque tenga buen millaje."
  },
  {
    "id": 143,
    "topic": "product",
    "language": "es",
    "question": "Un carro 2011 tiene 176,200 millas y funciona bien. ¿Qué debe entender el agent?",
    "options": [
      "Funcionar elimina el límite.",
      "Califica si fue financiado reciente.",
      "Está sobre el límite de millaje.",
      "El año solo lo hace seguro."
    ],
    "correct": 2,
    "explanation": "El límite básico es hasta 175,000 millas."
  },
  {
    "id": 144,
    "topic": "product",
    "language": "es",
    "question": "Un vehículo 2010 tiene 92,000 millas y no tiene problemas. ¿Cuál es la preocupación?",
    "options": [
      "No tener problemas es sospechoso.",
      "El año es anterior a 2011.",
      "El millaje es muy alto.",
      "Falta seguro."
    ],
    "correct": 1,
    "explanation": "Vehículos antes de 2011 quedan fuera de la regla básica."
  },
  {
    "id": 145,
    "topic": "product",
    "language": "es",
    "question": "El carro enciende, pero el cliente dice que le falta una llanta. ¿Qué es mejor?",
    "options": [
      "Tratarlo como buen funcionamiento.",
      "Aclarar si puede manejarse seguro ahora.",
      "Prometer cubrir la llanta.",
      "Ignorarlo porque enciende."
    ],
    "correct": 1,
    "explanation": "Faltar una llanta crea duda de condición actual y debe aclararse."
  },
  {
    "id": 146,
    "topic": "product",
    "language": "es",
    "question": "El cliente dice que tiene check engine hoy. ¿Qué debe evitar el agent?",
    "options": [
      "Tratarlo como claramente calificado.",
      "Aclarar si todavía maneja.",
      "Anotar que hay warning light.",
      "Preguntar qué problema tiene."
    ],
    "correct": 0,
    "explanation": "Luces o problemas actuales deben aclararse antes de transferir."
  },
  {
    "id": 147,
    "topic": "product",
    "language": "es",
    "question": "El vehículo prende pero no cambia de marcha. ¿Qué sugiere eso?",
    "options": [
      "No se confirmó buen funcionamiento.",
      "El vehículo califica automático.",
      "El problema es cosmético.",
      "El millaje es la única regla."
    ],
    "correct": 0,
    "explanation": "Un vehículo que no cambia de marcha puede no estar en buenas condiciones."
  },
  {
    "id": 148,
    "topic": "product",
    "language": "es",
    "question": "El cliente pregunta si cubre daño de carrocería por accidente. ¿Qué es más seguro?",
    "options": [
      "Todo choque está cubierto.",
      "Accidentes y carrocería están excluidos.",
      "Seguro y cobertura son iguales.",
      "El agent aprueba carrocería."
    ],
    "correct": 1,
    "explanation": "El producto se enfoca en fallas mecánicas, no choque ni estética."
  },
  {
    "id": 149,
    "topic": "product",
    "language": "es",
    "question": "El cliente pregunta si cubre pastillas de freno gastadas. ¿Qué debe saber el agent?",
    "options": [
      "El Advisor debe cubrirlas.",
      "Wear items reemplazan seguro.",
      "Pastillas gastadas califican el carro.",
      "Wear items no son el foco."
    ],
    "correct": 3,
    "explanation": "No se deben prometer wear items como cobertura."
  },
  {
    "id": 150,
    "topic": "product",
    "language": "es",
    "question": "Un vehículo tiene suspensión modificada. ¿Qué statement es más seguro?",
    "options": [
      "Las partes modificadas se excluyen.",
      "Todo vehículo modificado se cubre.",
      "Toda modificación mejora elegibilidad.",
      "El banco decide reparaciones."
    ],
    "correct": 0,
    "explanation": "Las partes modificadas se excluyen, aunque otras partes podrían revisarse."
  },
  {
    "id": 151,
    "topic": "product",
    "language": "es",
    "question": "¿Dónde se manejan normalmente reparaciones aprobadas?",
    "options": [
      "Solo el taller de la financiera.",
      "Talleres autorizados a nivel nacional.",
      "Solo el dealer original.",
      "Solo talleres en Texas."
    ],
    "correct": 1,
    "explanation": "Las reparaciones aprobadas no se limitan al dealer original."
  },
  {
    "id": 152,
    "topic": "product",
    "language": "es",
    "question": "Un cliente tiene motocicleta con bajo millaje. ¿Qué debe recordar el agent?",
    "options": [
      "Cobertura es automática con seguro.",
      "Bajo millaje anula el tipo.",
      "Las motocicletas están excluidas.",
      "Califica si el Advisor acepta."
    ],
    "correct": 2,
    "explanation": "Las motocicletas están entre vehículos no cubiertos."
  },
  {
    "id": 153,
    "topic": "product",
    "language": "es",
    "question": "El cliente tiene tres carros. ¿Qué debe ser cierto antes de transferir?",
    "options": [
      "Los tres deben ser del mismo año.",
      "El más viejo decide cobertura.",
      "Debe saber todos los VIN.",
      "Al menos uno actual debe calificar."
    ],
    "correct": 3,
    "explanation": "Con varios carros, se califica al menos un vehículo actual que funcione."
  },
  {
    "id": 154,
    "topic": "product",
    "language": "es",
    "question": "El cliente tiene un problema actual de motor. ¿Qué debe evitar prometer el agent?",
    "options": [
      "Que la condición importa.",
      "Que el problema actual será arreglado.",
      "Que el Advisor revisa opciones.",
      "Que cobertura mecánica es diferente."
    ],
    "correct": 1,
    "explanation": "No se debe prometer cobertura para problemas actuales o preexistentes."
  },
  {
    "id": 155,
    "topic": "product",
    "language": "es",
    "question": "¿Cómo se compara factory warranty con extended coverage?",
    "options": [
      "Factory empieza después de coverage.",
      "Son exactamente el mismo producto.",
      "Seguro renueva factory warranty.",
      "Factory warranty es limitada; extended es separada."
    ],
    "correct": 3,
    "explanation": "Factory warranty y extended coverage son conceptos diferentes."
  },
  {
    "id": 156,
    "topic": "product",
    "language": "es",
    "question": "¿Cuál es la diferencia clave con seguro?",
    "options": [
      "Coverage es obligatorio como seguro.",
      "Seguro cubre toda falla mecánica.",
      "Seguro cubre accidentes, no fallas mecánicas.",
      "Seguro y coverage son iguales."
    ],
    "correct": 2,
    "explanation": "El agent debe separar seguro de accidentes de cobertura mecánica."
  },
  {
    "id": 157,
    "topic": "product",
    "language": "es",
    "question": "El cliente pregunta si el plan añade cobertura después de factory coverage. ¿Qué es correcto?",
    "options": [
      "Puede agregar millas después de factory.",
      "Elimina necesidad de seguro.",
      "Siempre renueva factory warranty.",
      "Solo cubre responsabilidad por accidente."
    ],
    "correct": 0,
    "explanation": "Extended coverage es separada y puede añadir protección mecánica."
  },
  {
    "id": 158,
    "topic": "product",
    "language": "es",
    "question": "Un vehículo eléctrico financiado está bajo 175,000 millas. ¿Qué debe hacer el agent?",
    "options": [
      "No tratarlo como elegible.",
      "Ignorar la regla de eléctrico.",
      "Tomar financiamiento como regla principal.",
      "Transferir porque el millaje sirve."
    ],
    "correct": 0,
    "explanation": "Estar financiado no anula la exclusión de eléctricos."
  },
  {
    "id": 159,
    "topic": "product",
    "language": "es",
    "question": "El cliente no sabe millaje exacto, cree que son 170,000. ¿Qué es mejor?",
    "options": [
      "Asumir que está bajo límite.",
      "Aclarar antes de tratarlo como calificado.",
      "Decir que millaje no importa.",
      "Marcar XFER porque está cerca."
    ],
    "correct": 1,
    "explanation": "Cerca del límite, el agent no debe asumir elegibilidad."
  },
  {
    "id": 160,
    "topic": "product",
    "language": "es",
    "question": "¿Qué caso levanta mayor preocupación de elegibilidad?",
    "options": [
      "Vehículo 2019 con 182,000 millas.",
      "Vehículo 2015 con 75,000 millas.",
      "Vehículo 2012 con 90,000 millas.",
      "Vehículo 2018 con 120,000 millas."
    ],
    "correct": 0,
    "explanation": "Más de 175,000 millas queda fuera de la regla de millaje."
  },
  {
    "id": 161,
    "topic": "callflow",
    "language": "es",
    "question": "Durante el 3-way, el cliente cuelga antes de hablar con el Service Advisor. ¿Qué debe hacer el agent?",
    "options": [
      "Marcar Dead Air al Advisor.",
      "Usar Leave 3-Way Call y XFER.",
      "Dejar al Advisor timbrando solo.",
      "Usar Hung Up Both Lines y Call Back."
    ],
    "correct": 3,
    "explanation": "Eso evita un dead air transfer al Service Advisor."
  },
  {
    "id": 162,
    "topic": "callflow",
    "language": "es",
    "question": "¿Por qué es peligroso usar “Leave 3-Way Call” si el cliente cuelga?",
    "options": [
      "El Advisor puede recibir llamada sin cliente.",
      "Cambia el millaje del vehículo.",
      "Envía ruta española automática.",
      "Elimina la opción de callback."
    ],
    "correct": 0,
    "explanation": "Salir del 3-way puede crear dead air para el Service Advisor."
  },
  {
    "id": 163,
    "topic": "callflow",
    "language": "es",
    "question": "El Service Advisor entra, pero se queda callado varios segundos. ¿Qué debe hacer el agent?",
    "options": [
      "Llamar al Advisor y controlar el handoff.",
      "Quedarse callado hasta que cuelguen.",
      "Colgar y marcar XFER.",
      "Decirle al cliente que llame luego."
    ],
    "correct": 0,
    "explanation": "El agent debe evitar silencio llamando la atención del Advisor."
  },
  {
    "id": 164,
    "topic": "callflow",
    "language": "es",
    "question": "¿Quién debe hablar primero cuando entra el Service Advisor?",
    "options": [
      "El agent antes que todos.",
      "El Service Advisor.",
      "Nadie hasta pasar 15 segundos.",
      "El cliente sin introducción."
    ],
    "correct": 1,
    "explanation": "El agent debe esperar que el Service Advisor conteste antes de presentar."
  },
  {
    "id": 165,
    "topic": "callflow",
    "language": "es",
    "question": "¿Qué confirma un handoff real?",
    "options": [
      "Advisor y cliente hablan activamente.",
      "El agent presionó transfer.",
      "La línea timbró una vez.",
      "El cliente dijo hello antes."
    ],
    "correct": 0,
    "explanation": "Un handoff válido requiere comunicación activa, no solo marcar."
  },
  {
    "id": 166,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente pide callback al Service Advisor. ¿Cómo se maneja?",
    "options": [
      "SPANIS porque pidió callback.",
      "Call Back, no XFER limpio.",
      "DAIR porque cambió la llamada.",
      "XFER porque entró el Advisor."
    ],
    "correct": 1,
    "explanation": "Un callback con el Advisor no debe contar como XFER limpio."
  },
  {
    "id": 167,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente pide español apenas entra el Advisor, sin conversación en inglés. ¿Cuál es el problema?",
    "options": [
      "Debe ser Answering Machine.",
      "El vehículo pasa a wrong number.",
      "Es válido porque conectaron líneas.",
      "No hubo conversación real en inglés con SA."
    ],
    "correct": 3,
    "explanation": "Un English XFER necesita comunicación real en inglés con el Service Advisor."
  },
  {
    "id": 168,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente habla inglés con el Service Advisor por 18 segundos y luego pide español. ¿Cómo lo ve QA?",
    "options": [
      "Inválido solo por mencionar español.",
      "Dead Air porque cambió idioma.",
      "SPANIS automático sin revisar.",
      "Probablemente cumplió el handoff en inglés."
    ],
    "correct": 3,
    "explanation": "Si primero hubo conversación significativa en inglés, puede seguir siendo válido."
  },
  {
    "id": 169,
    "topic": "callflow",
    "language": "es",
    "question": "Un niño contesta y acepta “escuchar opciones” del carro familiar. ¿Qué debe hacer el agent?",
    "options": [
      "Transferir porque alguien aceptó.",
      "Pedir un adulto decision maker.",
      "Marcar XFER tras el sí.",
      "Pedir millaje al niño solamente."
    ],
    "correct": 1,
    "explanation": "Un menor no puede dar aprobación válida de decisión."
  },
  {
    "id": 170,
    "topic": "callflow",
    "language": "es",
    "question": "Un co-signer dice que no toma decisiones del vehículo. ¿Cuál es la mejor ruta?",
    "options": [
      "Presionar hasta que acepte.",
      "Pedir decision maker o callback.",
      "Transferir porque aparece en archivo.",
      "Tratarlo como XFER completo."
    ],
    "correct": 1,
    "explanation": "No se debe forzar si la persona no puede decidir."
  },
  {
    "id": 171,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente dice “sí” a todo, pero responde fuera de contexto. ¿Qué debe verificar el agent?",
    "options": [
      "Que realmente entiende la llamada.",
      "Que le gusta el color del carro.",
      "Que el archivo tiene dirección.",
      "Que el Advisor puede cerrar más rápido."
    ],
    "correct": 0,
    "explanation": "Un sí por cortesía no basta si hay duda de comprensión."
  },
  {
    "id": 172,
    "topic": "callflow",
    "language": "es",
    "question": "Mientras esperan al Advisor, hay silencio largo. ¿Qué protege la llamada?",
    "options": [
      "Pedir información de tarjeta.",
      "Hacer preguntas ligeras del vehículo.",
      "Mutear hasta que entre el Advisor.",
      "Prometer que el Advisor ya está listo."
    ],
    "correct": 1,
    "explanation": "Preguntas de espera reducen dead air y mantienen al cliente conectado."
  },
  {
    "id": 173,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente dice no al transfer después de calificar. ¿Qué debe evitar el agent?",
    "options": [
      "Marcar al Advisor de todas formas.",
      "Documentar el resultado.",
      "Usar disposición correcta.",
      "Respetar el rechazo."
    ],
    "correct": 0,
    "explanation": "Calificar no permite transferir sin consentimiento."
  },
  {
    "id": 174,
    "topic": "callflow",
    "language": "es",
    "question": "La línea del Advisor timbra, pero nadie contesta. ¿Qué debe evitar el agent?",
    "options": [
      "Proteger experiencia del cliente.",
      "Manejar callback si aplica.",
      "Evitar dead air transfer.",
      "Contarlo como XFER válido."
    ],
    "correct": 3,
    "explanation": "Un XFER válido requiere handoff entre Service Advisor y cliente."
  },
  {
    "id": 175,
    "topic": "callflow",
    "language": "es",
    "question": "El agent presenta al cliente antes de que el Advisor hable. ¿Cuál es el riesgo?",
    "options": [
      "El cliente se vuelve co-signer.",
      "El millaje se reinicia.",
      "El handoff puede quedar sin control.",
      "La llamada se vuelve voicemail."
    ],
    "correct": 2,
    "explanation": "El Advisor debe hablar primero para que la presentación sea limpia."
  },
  {
    "id": 176,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente cuelga después de la introducción pero antes de hablar con Advisor. ¿Qué debe pasar?",
    "options": [
      "Usar Answering Machine.",
      "No contarlo como XFER limpio.",
      "Marcar SPXFER automático.",
      "Contarlo porque hubo intro."
    ],
    "correct": 1,
    "explanation": "La introducción sola no prueba conversación activa entre Advisor y cliente."
  },
  {
    "id": 177,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente empieza a hablar español durante la espera de transfer en inglés. ¿Qué debe considerar el agent?",
    "options": [
      "DNC es obligatorio.",
      "El vehículo queda inválido.",
      "Debe forzar English transfer.",
      "Puede necesitar confirmar idioma."
    ],
    "correct": 3,
    "explanation": "Un cambio de idioma puede indicar necesidad de manejo en español."
  },
  {
    "id": 178,
    "topic": "callflow",
    "language": "es",
    "question": "El agent se queda mucho tiempo aunque ambos ya hablan. ¿Cuál es el coaching?",
    "options": [
      "Mutear y sumar tiempo.",
      "Quedarse hasta cerrar venta.",
      "Salir antes que hable el Advisor.",
      "Esperar suficiente, no innecesario."
    ],
    "correct": 3,
    "explanation": "La regla protege el handoff; no significa quedarse de más."
  },
  {
    "id": 179,
    "topic": "callflow",
    "language": "es",
    "question": "Antes del transfer, el cliente dice: “No quiero hablar con nadie más.” ¿Qué debe evitar el agent?",
    "options": [
      "Transferir sin nuevo consentimiento.",
      "Respetar el rechazo.",
      "Aclarar la preocupación.",
      "Ofrecer callback si aplica."
    ],
    "correct": 0,
    "explanation": "Un rechazo claro significa que no hay consentimiento."
  },
  {
    "id": 180,
    "topic": "callflow",
    "language": "es",
    "question": "El Advisor dice hello, el cliente dice hello, y ambos paran. ¿Qué debe hacer el agent antes de salir?",
    "options": [
      "Pedir datos de pago.",
      "Confirmar que hablan activamente.",
      "Marcar XFER y mutear.",
      "Salir tras dos hellos."
    ],
    "correct": 1,
    "explanation": "Dos saludos no siempre confirman handoff activo."
  },
  {
    "id": 181,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Cuándo DAIR es la mejor disposición?",
    "options": [
      "Nadie responde realmente en la línea.",
      "El cliente pide español.",
      "El cliente pide callback.",
      "El cliente dice no me interesa."
    ],
    "correct": 0,
    "explanation": "DAIR es para dead air real, no rechazo normal o callback."
  },
  {
    "id": 182,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente escucha el script y cuelga. ¿Qué disposición suele encajar mejor que DAIR?",
    "options": [
      "NI",
      "A",
      "Manage",
      "SPXFER"
    ],
    "correct": 0,
    "explanation": "Si hubo contacto y cuelga después del pitch, normalmente no es DAIR."
  },
  {
    "id": 183,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice: “Dejen de llamar o los reporto.” ¿Qué disposición encaja?",
    "options": [
      "CALLBK",
      "XFER",
      "DNC",
      "SPANIS"
    ],
    "correct": 2,
    "explanation": "Pedir que no llamen, amenazas o lenguaje similar se maneja como DNC."
  },
  {
    "id": 184,
    "topic": "dosdonts",
    "language": "es",
    "question": "La llamada cae en buzón de voz. ¿Qué disposición encaja?",
    "options": [
      "NI",
      "XFER",
      "WRNGVE",
      "A"
    ],
    "correct": 3,
    "explanation": "Answering Machine se usa para voicemail o sistema automático."
  },
  {
    "id": 185,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente está ocupado y sigue sin continuar tras rebuttal de callback. ¿Qué disposición encaja?",
    "options": [
      "XFER",
      "CALLBK",
      "A",
      "DAIR"
    ],
    "correct": 1,
    "explanation": "Una solicitud clara para llamar después corresponde a CALLBK."
  },
  {
    "id": 186,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente necesita español y el agent usa ruta ciega sin handoff con Advisor español. ¿Qué disposición encaja?",
    "options": [
      "DAIR",
      "SPXFER",
      "XFER",
      "SPANIS"
    ],
    "correct": 3,
    "explanation": "SPANIS es ruta ciega de español, no transfer directo en español."
  },
  {
    "id": 187,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agent conecta directo a un cliente español con Service Advisor en español. ¿Qué disposición encaja?",
    "options": [
      "CALLBK",
      "A",
      "SPANIS",
      "SPXFER"
    ],
    "correct": 3,
    "explanation": "SPXFER es para transferencias directas en español."
  },
  {
    "id": 188,
    "topic": "dosdonts",
    "language": "es",
    "question": "La persona dice que es número equivocado. ¿Qué área de disposición importa?",
    "options": [
      "Manejo de Wrong Number.",
      "Manejo de Answering Machine.",
      "Pause de restroom.",
      "English XFER limpio."
    ],
    "correct": 0,
    "explanation": "Wrong number no debe forzarse como transferencia."
  },
  {
    "id": 189,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Qué hace válido un XFER?",
    "options": [
      "Cliente cuelga antes del Advisor.",
      "Agent marca sin aprobación.",
      "Advisor solo recibe timbrando.",
      "Transfer inglés con handoff real."
    ],
    "correct": 3,
    "explanation": "XFER debe reflejar transferencia inglesa exitosa, no solo intento de marcar."
  },
  {
    "id": 190,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente pregunta por pagos bajos, y el agent nunca aclara. ¿Qué crea esto?",
    "options": [
      "Mejor calificación de millaje.",
      "Transfer español automático.",
      "Riesgo de transfer inválido.",
      "Mejor caso de Answering Machine."
    ],
    "correct": 2,
    "explanation": "Preguntas sin aclarar sobre propósito o pagos pueden hacer el transfer engañoso."
  },
  {
    "id": 191,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agent dice “cobertura gratis” durante el pitch. ¿Qué marca QA?",
    "options": [
      "Wording engañoso.",
      "Manejo correcto de callback.",
      "Buena detección de idioma.",
      "Timing correcto de transfer."
    ],
    "correct": 0,
    "explanation": "Decir cobertura gratis puede ser engañoso y debe evitarse."
  },
  {
    "id": 192,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agent promete: “El Advisor solo toma dos minutos.” ¿Cuál es el problema?",
    "options": [
      "Usa Vehicle Services Group.",
      "Deja hablar primero al Advisor.",
      "Promete tiempo que no controla.",
      "Pregunta si el vehículo funciona."
    ],
    "correct": 2,
    "explanation": "No se deben prometer tiempos específicos de espera o Advisor."
  },
  {
    "id": 193,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agent dice que el banco dio la información. ¿Qué regla rompe?",
    "options": [
      "No preguntar idioma.",
      "No usar Service Advisor.",
      "No verificar condición del vehículo.",
      "No decir que el banco dio el archivo."
    ],
    "correct": 3,
    "explanation": "La explicación aprobada es dealers/registros, no el banco."
  },
  {
    "id": 194,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agent transfiere tras un “supongo.” ¿Qué debe cuestionar QA?",
    "options": [
      "Si el Advisor estaba en Texas.",
      "Si el vehículo tenía bajo millaje.",
      "Si el consentimiento fue claro.",
      "Si RR era el pause correcto."
    ],
    "correct": 2,
    "explanation": "Aprobación vaga debe aclararse antes de transferir."
  },
  {
    "id": 195,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente pregunta: “¿A qué estoy aceptando?” justo antes del transfer. ¿Qué debe hacer el agent?",
    "options": [
      "Marcar XFER tras la pregunta.",
      "Decir que ya no importa.",
      "Aclarar antes de marcar.",
      "Marcar y que el Advisor explique."
    ],
    "correct": 2,
    "explanation": "El consentimiento no es limpio si el cliente no entiende el transfer."
  },
  {
    "id": 196,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente no es dueño y no puede decidir. ¿Qué resultado debe evitarse?",
    "options": [
      "Documentar la situación.",
      "Pedir decision maker.",
      "Ofrecer callback si aplica.",
      "Contarlo como transfer limpio."
    ],
    "correct": 3,
    "explanation": "La autoridad de decisión importa para una transferencia válida."
  },
  {
    "id": 197,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente cuelga antes de hablar con Advisor, pero el agent marca XFER. ¿Qué está mal?",
    "options": [
      "El vehículo bajó millaje.",
      "Debió usar SPXFER.",
      "La llamada fue Answering Machine.",
      "Usó XFER sin handoff real."
    ],
    "correct": 3,
    "explanation": "Se necesita conversación real Advisor/cliente para XFER limpio."
  },
  {
    "id": 198,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agent selecciona Leave 3-Way Call cuando el cliente desaparece. ¿Qué puede pasar?",
    "options": [
      "Proceso DNC automático.",
      "Corrección de límite de millas.",
      "Advisor recibe consentimiento completo.",
      "Dead air transfer al Service Advisor."
    ],
    "correct": 3,
    "explanation": "Por eso importa Hung Up Both Lines cuando el cliente cuelga."
  },
  {
    "id": 199,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente habla inglés con el agent pero claramente no sigue la llamada. ¿Qué no debe pasar?",
    "options": [
      "Preguntar idioma preferido.",
      "Aclarar más despacio.",
      "Usar ruta española si aplica.",
      "Forzar un English XFER igual."
    ],
    "correct": 3,
    "explanation": "Debe quedar clara la comprensión antes de un English transfer."
  },
  {
    "id": 200,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Qué caso pertenece a coaching Needs Practice?",
    "options": [
      "Agent aclara idioma preferido.",
      "Agent confirma condición y consentimiento.",
      "Agent salta propósito y transfiere cliente confundido.",
      "Agent espera mientras ambos hablan."
    ],
    "correct": 2,
    "explanation": "Saltar propósito y transferir confusión crea riesgo QA/inválido."
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
