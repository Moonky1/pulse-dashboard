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
    id: 1,
    topic: "script",
    language: "en",
    question: "Which company name should the opener use in the English introduction?",
    options: [
      "Vehicle Services Group",
      "Vehicle Service Center",
      "Auto Warranty Department",
      "Coverage Review Team",
    ],
    correct: 0,
    explanation: "The English opening identifies the caller as being with the Vehicle Services Group.",
  },
  {
    id: 2,
    topic: "script",
    language: "en",
    question: "What financing detail belongs in the opening line?",
    options: [
      "The dealership street address",
      "The month and year financed",
      "The APR percentage shown",
      "The customer ZIP code",
    ],
    correct: 1,
    explanation: "The opener should mention the vehicle financed on the month and year shown on the form.",
  },
  {
    id: 3,
    topic: "script",
    language: "en",
    question: "What must be verified before moving toward a transfer?",
    options: [
      "That the customer knows the VIN",
      "That the address is fully updated",
      "That the vehicle is running well",
      "That the customer has repair receipts",
    ],
    correct: 2,
    explanation: "The opener must confirm the vehicle is still in good running condition before transferring.",
  },
  {
    id: 4,
    topic: "script",
    language: "en",
    question: "Which line best matches the approved purpose statement?",
    options: [
      "Your bank asked us to renew the factory warranty today",
      "The dealership wants us to sell a new policy now",
      "We are calling to confirm your insurance coverage",
      "Our records show the extended warranty has not been activated yet",
    ],
    correct: 3,
    explanation: "The purpose line is about the vehicle’s extended warranty not being activated yet.",
  },
  {
    id: 5,
    topic: "script",
    language: "en",
    question: "What should the opener do before starting the transfer?",
    options: [
      "Ask for the full VIN number",
      "Get clear approval from the customer",
      "Quote the exact monthly price",
      "Read the dealership address",
    ],
    correct: 1,
    explanation: "The customer must clearly approve the transfer before the opener connects the call.",
  },
  {
    id: 6,
    topic: "script",
    language: "en",
    question: "Which handoff line is the most professional?",
    options: [
      "I have someone here. Please take this call now.",
      "This person wants prices. Go ahead and explain.",
      "Hello Service Advisor, I have the customer on the line. Can you please assist?",
      "The customer is ready, so I am leaving the call.",
    ],
    correct: 2,
    explanation: "The handoff must introduce the customer to the Service Advisor in a clean and professional way.",
  },
  {
    id: 7,
    topic: "script",
    language: "es",
    question: "En el script en español, ¿qué nombre de compañía se debe usar?",
    options: [
      "Centro Nacional de Bancos",
      "Departamento de Seguros del Concesionario",
      "Garantía Directa del Fabricante",
      "Grupo de Servicios Vehiculares",
    ],
    correct: 3,
    explanation: "El script en español identifica al agente como parte del Grupo de Servicios Vehiculares.",
  },
  {
    id: 8,
    topic: "script",
    language: "es",
    question: "¿Qué debe verificar el agente en español antes de transferir?",
    options: [
      "Que el vehículo esté en buenas condiciones de funcionamiento",
      "Que el cliente tenga seguro completo",
      "Que el préstamo ya esté pagado",
      "Que la dirección coincida con el archivo",
    ],
    correct: 0,
    explanation: "El script en español también requiere verificar que el vehículo funcione correctamente antes de transferir.",
  },
  {
    id: 9,
    topic: "script",
    language: "es",
    question: "¿Cuál preparación de transferencia en español es la aprobada?",
    options: [
      "Enviar al cliente directamente al concesionario por precios",
      "Pasar la llamada a facturación antes de revisar elegibilidad",
      "Conectar al cliente con un Asesor de Servicio para revisar la calificación",
      "Pedirle al cliente que llame luego de revisar el vehículo",
    ],
    correct: 2,
    explanation: "La línea de transferencia en español conecta al cliente con un Asesor de Servicio para revisar los detalles de calificación.",
  },
  {
    id: 10,
    topic: "script",
    language: "es",
    question: "En el script en español, ¿cuándo debe transferir el agente?",
    options: [
      "Apenas el cliente contesta",
      "Después de que el cliente da aprobación",
      "Antes de confirmar que el vehículo funciona",
      "Solo después de cotizar el costo del plan",
    ],
    correct: 1,
    explanation: "La aprobación del cliente es obligatoria antes de transferir, tanto en inglés como en español.",
  },
  {
    id: 11,
    topic: "script",
    language: "es",
    question: "¿Cuál introducción en español se acerca más a la línea aprobada?",
    options: [
      "Hola, ventas, este cliente quiere saber el precio final.",
      "Buenas, le dejo a esta persona porque está interesada.",
      "Asesor, tome esta llamada mientras yo cuelgo.",
      "Hola, Asesor de Servicio, tengo al cliente en la línea. ¿Podría asistir?",
    ],
    correct: 3,
    explanation: "La introducción debe presentar al cliente claramente ante el Asesor de Servicio.",
  },
  {
    id: 12,
    topic: "script",
    language: "es",
    question: "¿Qué debe evitar el agente al decir el script?",
    options: [
      "Acortar o improvisar las palabras",
      "Hablar con ritmo controlado",
      "Usar claramente el nombre del cliente",
      "Sonar seguro con la información financiera",
    ],
    correct: 0,
    explanation: "El estándar de entrega exige no acortar el script y no improvisar.",
  },
  {
    id: 13,
    topic: "objections",
    language: "en",
    question: "A customer says, “I’m not interested.” What is the strongest first move?",
    options: [
      "Ask why and create curiosity",
      "End the call immediately",
      "Argue that they need coverage",
      "Skip directly to the transfer",
    ],
    correct: 0,
    explanation: "The opener should ask a question, understand the reason, and create curiosity.",
  },
  {
    id: 14,
    topic: "objections",
    language: "en",
    question: "A customer asks, “Where did you get my information?” What should you say?",
    options: [
      "Your bank sent us your loan profile today",
      "We partner with dealerships and vehicle registries nationwide",
      "We bought the file from another company",
      "The system does not show that information",
    ],
    correct: 1,
    explanation: "The approved answer references dealerships and vehicle registries, not the bank.",
  },
  {
    id: 15,
    topic: "objections",
    language: "en",
    question: "A customer asks, “What kind of vehicle?” What is the best response?",
    options: [
      "I can see the exact make and model but cannot say it",
      "You should already know which vehicle we mean",
      "I only see finance info, and the Service Advisor can review the full details",
      "That question does not matter for this call",
    ],
    correct: 2,
    explanation: "Be transparent about seeing finance information and bridge to the Service Advisor.",
  },
  {
    id: 16,
    topic: "objections",
    language: "en",
    question: "A customer asks, “How much does it cost?” What should the opener avoid?",
    options: [
      "Mentioning mileage can affect cost",
      "Moving toward the Service Advisor",
      "Explaining that pricing varies",
      "Giving an exact price",
    ],
    correct: 3,
    explanation: "The opener should not quote exact pricing; the Service Advisor reviews cost.",
  },
  {
    id: 17,
    topic: "objections",
    language: "en",
    question: "A customer says, “I already have insurance.” What distinction matters most?",
    options: [
      "Insurance and extended coverage are the same service",
      "Insurance covers accidents; this covers mechanical breakdowns",
      "Insurance replaces the need for any repair coverage",
      "Extended coverage is required by law like insurance",
    ],
    correct: 1,
    explanation: "Insurance and extended coverage are different products.",
  },
  {
    id: 18,
    topic: "objections",
    language: "en",
    question: "A customer says, “I’m busy.” What is the best control move?",
    options: [
      "Push faster through the full script",
      "Tell them it will only take seconds",
      "Offer a callback time that works better",
      "Continue talking until they answer",
    ],
    correct: 2,
    explanation: "Respect the customer’s time and offer a callback option.",
  },
  {
    id: 19,
    topic: "objections",
    language: "es",
    question: "En una llamada en español, el cliente dice que no le interesa. ¿Qué debe hacer primero el agente?",
    options: [
      "Transferir sin explicar más",
      "Marcar SPXFER inmediatamente",
      "Decirle que está cometiendo un error",
      "Hacer una pregunta breve para entender por qué",
    ],
    correct: 3,
    explanation: "La lógica de manejo de objeciones se mantiene: preguntar por qué y trabajar con la respuesta.",
  },
  {
    id: 20,
    topic: "objections",
    language: "es",
    question: "En una llamada en español, el cliente pregunta dónde está ubicada la compañía. ¿Cuál respuesta es aprobada?",
    options: [
      "La sede principal está en Dallas, Texas",
      "La oficina está dentro del concesionario",
      "La oficina del banco maneja la póliza",
      "La ubicación cambia según el estado del cliente",
    ],
    correct: 0,
    explanation: "La respuesta aprobada indica Dallas, Texas, y que los planes son aceptados a nivel nacional.",
  },
  {
    id: 21,
    topic: "objections",
    language: "es",
    question: "En una llamada en español, el cliente pregunta: “¿Quién habla?”. ¿Qué debe decirse primero?",
    options: [
      "Que el banco entregó la información",
      "Que es el departamento de garantía del concesionario",
      "Identificarse como Grupo de Servicios Vehiculares",
      "Saltar el nombre de la compañía por completo",
    ],
    correct: 2,
    explanation: "La identificación inicial debe coincidir con la frase aprobada del script en español.",
  },
  {
    id: 22,
    topic: "objections",
    language: "es",
    question: "En una llamada en español, el cliente dice que ya tiene cobertura. ¿Cuál es el mejor enfoque?",
    options: [
      "Decirle que su cobertura actual no sirve",
      "Revisar posibles beneficios actualizados o adicionales",
      "Decirle que cancele su plan actual",
      "Terminar la llamada porque no puede calificar",
    ],
    correct: 1,
    explanation: "La llamada debe presentarse como una revisión de opciones o beneficios adicionales, no como una obligación de cambiar.",
  },
  {
    id: 23,
    topic: "objections",
    language: "es",
    question: "En una llamada en español, el cliente dice que vendió el vehículo o que fue pérdida total. ¿Qué debe hacer el agente?",
    options: [
      "Marcarlo como transferencia exitosa",
      "Insistir en que el vehículo viejo aún califica",
      "Pedir información de pago primero",
      "Preguntar si actualmente maneja otro vehículo",
    ],
    correct: 3,
    explanation: "Se debe redirigir hacia el vehículo actual y confirmar si está en buenas condiciones de funcionamiento.",
  },
  {
    id: 24,
    topic: "objections",
    language: "es",
    question: "En una llamada en español, el cliente dice que la información del vehículo está incorrecta. ¿Cuál es el mejor manejo?",
    options: [
      "Tratarlo como verificación y revisar el vehículo actual",
      "Decirle al cliente que el archivo siempre está correcto",
      "Saltar la verificación y transferir de todas formas",
      "Marcar la llamada como Do Not Call",
    ],
    correct: 0,
    explanation: "La información incorrecta o desactualizada debe manejarse como una oportunidad de verificación.",
  },
  {
    id: 25,
    topic: "product",
    language: "en",
    question: "What does extended coverage mainly protect against?",
    options: [
      "Mechanical breakdown repairs",
      "Accident liability claims",
      "Bodywork after collisions",
      "Routine oil changes only",
    ],
    correct: 0,
    explanation: "Extended coverage is focused on mechanical breakdown repairs, not accident insurance.",
  },
  {
    id: 26,
    topic: "product",
    language: "en",
    question: "Which vehicle is most likely to qualify?",
    options: [
      "2008 coupe with 70,000 miles",
      "2018 sedan with 95,000 miles",
      "2021 electric vehicle with 30,000 miles",
      "2019 motorcycle with 15,000 miles",
    ],
    correct: 1,
    explanation: "A qualifying vehicle should be 2011 or newer, non-electric, under 175,000 miles, and not an excluded type.",
  },
  {
    id: 27,
    topic: "product",
    language: "en",
    question: "What mileage limit should agents remember?",
    options: [
      "125,000 miles",
      "150,000 miles",
      "175,000 miles",
      "200,000 miles",
    ],
    correct: 2,
    explanation: "Vehicles with more than 175,000 miles cannot be covered.",
  },
  {
    id: 28,
    topic: "product",
    language: "en",
    question: "Which item is excluded from coverage?",
    options: [
      "Engine mechanical repair",
      "Transmission mechanical repair",
      "Covered electrical failure",
      "Bodywork or cosmetic repair",
    ],
    correct: 3,
    explanation: "Bodywork and cosmetic repairs are not covered.",
  },
  {
    id: 29,
    topic: "product",
    language: "en",
    question: "How is factory warranty different from extended coverage?",
    options: [
      "Factory warranty is optional after every repair",
      "Factory warranty comes with new vehicles for a limited term",
      "Factory warranty covers accidents nationwide",
      "Factory warranty starts after extended coverage ends",
    ],
    correct: 1,
    explanation: "Factory warranty usually comes with a new vehicle and lasts for a limited time or mileage.",
  },
  {
    id: 30,
    topic: "product",
    language: "en",
    question: "Where can approved repairs generally be handled?",
    options: [
      "Only at the original dealership",
      "Only at repair shops in Texas",
      "At authorized repair facilities nationwide",
      "Only through the selling bank",
    ],
    correct: 2,
    explanation: "Approved repairs can be handled at authorized repair facilities across the U.S.",
  },
  {
    id: 31,
    topic: "product",
    language: "es",
    question: "En entrenamiento en español, ¿qué vehículo debe considerarse no elegible?",
    options: [
      "Un sedán 2016 con menos de 100,000 millas",
      "Una SUV 2018 en buenas condiciones",
      "Una camioneta 2015 sin luces de advertencia",
      "Un vehículo eléctrico 2020",
    ],
    correct: 3,
    explanation: "Los vehículos eléctricos están excluidos de la cobertura.",
  },
  {
    id: 32,
    topic: "product",
    language: "es",
    question: "En entrenamiento en español, ¿cuál es el año de modelo más antiguo que todavía puede calificar?",
    options: [
      "2011",
      "2009",
      "2008",
      "2010",
    ],
    correct: 0,
    explanation: "Los vehículos fabricados antes de 2011 no pueden ser cubiertos.",
  },
  {
    id: 33,
    topic: "product",
    language: "es",
    question: "En entrenamiento en español, ¿qué se debe confirmar antes de hablar de opciones?",
    options: [
      "Que el cliente tenga el título disponible",
      "Que el préstamo ya esté pagado",
      "Que el vehículo esté funcionando actualmente",
      "Que el cliente sepa el millaje exacto",
    ],
    correct: 2,
    explanation: "La condición de funcionamiento del vehículo es esencial para la elegibilidad.",
  },
  {
    id: 34,
    topic: "product",
    language: "es",
    question: "En entrenamiento en español, ¿qué es correcto sobre el seguro?",
    options: [
      "Reemplaza completamente la cobertura extendida",
      "Cubre accidentes, no fallas mecánicas",
      "Es lo mismo que la garantía de fábrica",
      "Paga cualquier tipo de reparación",
    ],
    correct: 1,
    explanation: "El seguro y la cobertura extendida deben explicarse como productos separados.",
  },
  {
    id: 35,
    topic: "product",
    language: "es",
    question: "En entrenamiento en español, ¿cómo se deben tratar las partes modificadas?",
    options: [
      "Todas las partes modificadas siempre están cubiertas",
      "Cualquier modificación descalifica todo el vehículo",
      "Solo se excluyen modificaciones hechas por el concesionario",
      "Las partes modificadas no están cubiertas, pero otras partes pueden calificar",
    ],
    correct: 3,
    explanation: "Las partes modificadas en sí están excluidas, pero el vehículo aún puede tener partes no modificadas elegibles.",
  },
  {
    id: 36,
    topic: "product",
    language: "es",
    question: "En entrenamiento en español, ¿qué significa “taller autorizado”?",
    options: [
      "Un taller calificado aceptado por el plan",
      "Solo el concesionario donde se vendió el carro",
      "Cualquier mecánico que el cliente elija",
      "Solo un taller ubicado en Dallas",
    ],
    correct: 0,
    explanation: "El plan trabaja con talleres autorizados, no únicamente con un concesionario.",
  },
  {
    id: 37,
    topic: "callflow",
    language: "en",
    question: "What is the first step in a clean transfer flow?",
    options: [
      "Confirm vehicle qualification",
      "Introduce the Service Advisor",
      "Disconnect after dialing",
      "Choose the final disposition",
    ],
    correct: 0,
    explanation: "Qualification comes first, especially vehicle condition.",
  },
  {
    id: 38,
    topic: "callflow",
    language: "en",
    question: "What must happen before the opener dials the transfer?",
    options: [
      "The customer provides the VIN",
      "The customer gives clear approval",
      "The customer accepts a quoted price",
      "The SA confirms availability by chat",
    ],
    correct: 1,
    explanation: "A clean transfer requires customer approval before dialing.",
  },
  {
    id: 39,
    topic: "callflow",
    language: "en",
    question: "Who should speak first when the Service Advisor joins?",
    options: [
      "The opener immediately",
      "The customer only",
      "The Service Advisor",
      "No one until the timer ends",
    ],
    correct: 2,
    explanation: "The Service Advisor should pick up and speak first before the opener introduces the customer.",
  },
  {
    id: 40,
    topic: "callflow",
    language: "en",
    question: "How long should the opener stay after the SA joins?",
    options: [
      "At least 3 seconds",
      "Exactly 5 seconds",
      "Until the customer asks to leave",
      "At least 15 seconds",
    ],
    correct: 3,
    explanation: "The opener should stay at least 15 seconds and confirm both parties are talking.",
  },
  {
    id: 41,
    topic: "callflow",
    language: "en",
    question: "What should the opener do if the SA is silent for about 5 seconds?",
    options: [
      "Disconnect and tag the call as transferred",
      "Say “Hello Service Advisor” to get attention",
      "Tell the customer to call back later",
      "Mute the line until someone speaks",
    ],
    correct: 1,
    explanation: "The opener should call the advisor’s attention to avoid a hang-up and protect the transfer.",
  },
  {
    id: 42,
    topic: "callflow",
    language: "en",
    question: "What should happen if the customer asks the SA for a callback?",
    options: [
      "Tag it as XFER because the SA joined",
      "Tag it as SPANIS automatically",
      "Tag it as Call Back, not XFER",
      "Tag it as Dead Air",
    ],
    correct: 2,
    explanation: "If the customer asks the SA for a callback, it should be Call Back rather than XFER.",
  },
  {
    id: 43,
    topic: "callflow",
    language: "es",
    question: "Para una transferencia en español, ¿qué se debe seleccionar durante el proceso?",
    options: [
      "Blind Transfer antes de hablar con el Asesor",
      "Hangup Both Lines apenas timbra",
      "Do Not Call antes de marcar al asesor",
      "La opción de español antes de completar la transferencia",
    ],
    correct: 3,
    explanation: "Las transferencias en español requieren seleccionar la opción de español dentro del flujo del marcador.",
  },
  {
    id: 44,
    topic: "callflow",
    language: "es",
    question: "En una llamada en español, ¿qué debe hacer el agente mientras espera al asesor?",
    options: [
      "Mantener al cliente conectado con preguntas ligeras sobre el vehículo",
      "Quedarse en silencio hasta que aparezca el asesor",
      "Pedir datos bancarios",
      "Prometer que el precio será bajo",
    ],
    correct: 0,
    explanation: "Las preguntas de espera evitan silencios incómodos y mantienen al cliente conectado.",
  },
  {
    id: 45,
    topic: "callflow",
    language: "es",
    question: "En el protocolo de transferencia en español, ¿qué confirma que la entrega es segura?",
    options: [
      "El agente escuchó solo un timbre",
      "El agente ya presionó transferir",
      "El asesor y el cliente están hablando activamente",
      "El cliente dijo “hola” una vez",
    ],
    correct: 2,
    explanation: "Una entrega segura requiere que ambas partes estén hablando activamente antes de que el agente salga.",
  },
  {
    id: 46,
    topic: "callflow",
    language: "es",
    question: "En llamadas en español, ¿cuándo es incorrecto marcar XFER?",
    options: [
      "Cuando el asesor y el cliente están conectados",
      "Cuando el cliente cuelga antes de una entrega real",
      "Cuando el agente esperó e introdujo correctamente",
      "Cuando el cliente aceptó claramente la transferencia",
    ],
    correct: 1,
    explanation: "Si el cliente cuelga antes de una entrega real, no debe contarse como una transferencia válida.",
  },
  {
    id: 47,
    topic: "callflow",
    language: "es",
    question: "En llamadas en español, ¿qué debe anotar el agente si el Asesor tardó mucho en responder?",
    options: [
      "Que el cliente rechazó toda cobertura",
      "Que el agente omitió la introducción",
      "Que el sistema generó un número equivocado",
      "Que el Asesor tardó en responder después de conectarse",
    ],
    correct: 3,
    explanation: "Si la demora del Asesor creó riesgo, las notas deben explicar esa demora.",
  },
  {
    id: 48,
    topic: "callflow",
    language: "es",
    question: "En llamadas en español, ¿cuál es el rol del agente durante la transferencia?",
    options: [
      "Conectar, introducir, esperar y verificar la conversación",
      "Cotizar el precio final y cerrar la venta",
      "Salir inmediatamente después de presionar transferir",
      "Discutir objeciones mientras habla el Asesor",
    ],
    correct: 0,
    explanation: "El agente debe completar una entrega controlada, no abandonar la llamada.",
  },
  {
    id: 49,
    topic: "dosdonts",
    language: "en",
    question: "Which phrase should agents avoid?",
    options: [
      "This is free",
      "This is an opportunity to review options",
      "The Service Advisor can explain details",
      "Let me verify the vehicle condition",
    ],
    correct: 0,
    explanation: "Agents should not use “free” because it can be misleading.",
  },
  {
    id: 50,
    topic: "dosdonts",
    language: "en",
    question: "Which statement is not allowed?",
    options: [
      "We partner with vehicle registries",
      "The bank gave us your information",
      "The Service Advisor reviews details",
      "I only see finance information",
    ],
    correct: 1,
    explanation: "Agents should not say the bank gave the information.",
  },
  {
    id: 51,
    topic: "dosdonts",
    language: "en",
    question: "Which delivery behavior is required?",
    options: [
      "Shorten the script to save time",
      "Change wording based on preference",
      "Read the script without improvising",
      "Skip the vehicle condition check",
    ],
    correct: 2,
    explanation: "Script compliance means no improvising and no skipping required parts.",
  },
  {
    id: 52,
    topic: "dosdonts",
    language: "en",
    question: "Which disposition fits a completed English transfer?",
    options: [
      "SPXFER",
      "SPANIS",
      "CALLBK",
      "XFER",
    ],
    correct: 3,
    explanation: "XFER is for a valid English call transferred to a Service Advisor.",
  },
  {
    id: 53,
    topic: "dosdonts",
    language: "en",
    question: "Which pause code should be used for a supervisor-requested call?",
    options: [
      "RR",
      "Manage",
      "Lunch",
      "Break",
    ],
    correct: 1,
    explanation: "Manage is used when a supervisor asks the agent to call or talk to them.",
  },
  {
    id: 54,
    topic: "dosdonts",
    language: "en",
    question: "Which pause code fits a restroom pause?",
    options: [
      "CB",
      "Tech",
      "RR",
      "Manage",
    ],
    correct: 2,
    explanation: "RR is the restroom pause code.",
  },
  {
    id: 55,
    topic: "dosdonts",
    language: "es",
    question: "Para una transferencia ciega de cliente en español, ¿qué disposición se debe usar?",
    options: [
      "SPXFER",
      "XFER",
      "CALLBK",
      "SPANIS",
    ],
    correct: 3,
    explanation: "Las transferencias ciegas de clientes en español deben usar SPANIS, no SPXFER.",
  },
  {
    id: 56,
    topic: "dosdonts",
    language: "es",
    question: "¿Cuándo se debe usar SPXFER?",
    options: [
      "Cuando el agente transfiere directamente a un cliente que habla español con un closer en español",
      "Cuando el cliente solo habla español y no ocurre transferencia",
      "Cada vez que el agente escucha español en la llamada",
      "Cuando no hay transferencia directa con un closer en español",
    ],
    correct: 0,
    explanation: "SPXFER solo se usa para una transferencia directa en español hacia un closer o Asesor.",
  },
  {
    id: 57,
    topic: "dosdonts",
    language: "es",
    question: "¿Qué está mal al usar SPXFER para una ruta ciega en español?",
    options: [
      "Siempre mejora la precisión del reporte en español",
      "Es obligatorio para todos los clientes que hablan español",
      "Puede crear una disposición de transferencia incorrecta",
      "Reemplaza la necesidad de notas de transferencia",
    ],
    correct: 2,
    explanation: "Usar SPXFER para transferencias ciegas en español es incorrecto y puede crear violaciones del proceso.",
  },
  {
    id: 58,
    topic: "dosdonts",
    language: "es",
    question: "¿Qué disposición corresponde cuando el cliente pide una llamada más tarde?",
    options: [
      "XFER",
      "CALLBK",
      "DNC",
      "SPXFER",
    ],
    correct: 1,
    explanation: "CALLBK se usa cuando el cliente solicita una llamada de regreso.",
  },
  {
    id: 59,
    topic: "dosdonts",
    language: "es",
    question: "¿Qué disposición corresponde cuando el cliente pide ser removido de la lista de llamadas?",
    options: [
      "NI",
      "DAIR",
      "BLANK",
      "DNC",
    ],
    correct: 3,
    explanation: "DNC se usa cuando el cliente pide no recibir más llamadas.",
  },
  {
    id: 60,
    topic: "dosdonts",
    language: "es",
    question: "¿Qué comportamiento ayuda más a evitar transferencias inválidas?",
    options: [
      "Verificar condición, obtener aprobación, introducir correctamente y esperar",
      "Transferir rápido y marcar XFER apenas timbra la línea",
      "Prometer una espera corta para que el cliente se quede conectado",
      "Salir de la llamada antes de que el Asesor confirme la entrega",
    ],
    correct: 0,
    explanation: "Las transferencias limpias requieren verificación, aprobación, introducción correcta y tiempo suficiente de espera.",
  },
{
  "id": 61,
  "topic": "script",
  "language": "en",
  "question": "What is the safest way to open the call after confirming the customer name?",
  "options": [
    "Identify yourself and Vehicle Services Group",
    "Ask for the VIN immediately",
    "Quote the coverage price first",
    "Tell them the bank requested the call"
  ],
  "correct": 0,
  "explanation": "The opener should identify themselves and Vehicle Services Group before moving through the approved script."
},
{
  "id": 62,
  "topic": "script",
  "language": "en",
  "question": "What should the opener mention when referencing the financed vehicle?",
  "options": [
    "The financing month and year",
    "The full street address",
    "The customer email address",
    "The dealership manager name"
  ],
  "correct": 0,
  "explanation": "The approved opening references the vehicle financed on the month and year shown on the form."
},
{
  "id": 63,
  "topic": "script",
  "language": "en",
  "question": "Which line keeps the transfer setup compliant?",
  "options": [
    "I will introduce you to a Service Advisor. Okay?",
    "This will only take less than a minute.",
    "I am sending you now because you qualify.",
    "The advisor already approved your price."
  ],
  "correct": 0,
  "explanation": "The opener should ask for approval and avoid promising time, price, or guaranteed qualification."
},
{
  "id": 64,
  "topic": "script",
  "language": "en",
  "question": "What should happen after the Service Advisor joins the call?",
  "options": [
    "Stay at least 15 seconds and confirm both parties are talking",
    "Leave immediately after hearing the first ring",
    "Mute the call and wait for the system to disconnect",
    "Ask the customer for payment information"
  ],
  "correct": 0,
  "explanation": "The opener must stay long enough to confirm a real handoff between the customer and advisor."
},
{
  "id": 65,
  "topic": "script",
  "language": "es",
  "question": "¿Cuál es la forma correcta de iniciar el script en español?",
  "options": [
    "Hola, le habla [nombre] de Grupo de Servicios Vehiculares",
    "Hola, llamo del banco que financió su carro",
    "Hola, soy del dealer y vengo a renovar su póliza",
    "Hola, le llamo para venderle un seguro obligatorio"
  ],
  "correct": 0,
  "explanation": "El script en español identifica al opener como parte de Grupo de Servicios Vehiculares."
},
{
  "id": 66,
  "topic": "script",
  "language": "es",
  "question": "Antes de transferir en español, ¿qué debe hacer el opener?",
  "options": [
    "Pedir aprobación clara del cliente",
    "Transferir apenas el cliente conteste",
    "Prometer que será gratis",
    "Decir que el banco pidió la llamada"
  ],
  "correct": 0,
  "explanation": "La aprobación clara del cliente es necesaria antes de transferir."
},
{
  "id": 67,
  "topic": "script",
  "language": "es",
  "question": "¿Qué rol debe mencionar el opener en la línea de transferencia?",
  "options": [
    "Asesor de Servicio",
    "Agente bancario",
    "Vendedor de seguros",
    "Representante del dealer"
  ],
  "correct": 0,
  "explanation": "La línea aprobada conecta al cliente con un Asesor de Servicio."
},
{
  "id": 68,
  "topic": "script",
  "language": "es",
  "question": "¿Qué debe evitar el opener al leer el script?",
  "options": [
    "Cambiar o acortar partes importantes",
    "Usar el nombre del cliente",
    "Controlar el ritmo de voz",
    "Confirmar que el vehículo funciona"
  ],
  "correct": 0,
  "explanation": "La entrega debe respetar el wording del script sin improvisar ni saltar pasos."
},
{
  "id": 69,
  "topic": "objections",
  "language": "en",
  "question": "Customer says, “This sounds like a scam.” What is the best first move?",
  "options": [
    "Stay calm, clarify who you are, and explain the purpose",
    "Argue that the customer is wrong",
    "Transfer immediately so the advisor handles it",
    "Tell them the call is required by law"
  ],
  "correct": 0,
  "explanation": "Scam concerns require calm clarification and trust building, not pressure."
},
{
  "id": 70,
  "topic": "objections",
  "language": "en",
  "question": "Customer says, “Send me something in the mail.” What should the opener do?",
  "options": [
    "Explain the advisor can review the details live first",
    "Promise to mail a full policy today",
    "End the call and mark DNC",
    "Ask for a credit card to send documents"
  ],
  "correct": 0,
  "explanation": "The opener should bridge to the Service Advisor instead of promising documents they cannot send."
},
{
  "id": 71,
  "topic": "objections",
  "language": "en",
  "question": "Customer says, “I already paid for this.” What is the safest response?",
  "options": [
    "Clarify this is a review of possible extended coverage options",
    "Tell them their current plan is invalid",
    "Ask them to cancel the other plan first",
    "Say they must pay again today"
  ],
  "correct": 0,
  "explanation": "Do not attack or invalidate existing coverage. Position it as a review."
},
{
  "id": 72,
  "topic": "objections",
  "language": "en",
  "question": "Customer asks, “Are you my dealership?” What should the opener avoid?",
  "options": [
    "Claiming to work for the dealership",
    "Clarifying the company name",
    "Explaining the purpose of the call",
    "Moving toward a Service Advisor after approval"
  ],
  "correct": 0,
  "explanation": "The opener should not claim to be the dealership or a car brand."
},
{
  "id": 73,
  "topic": "objections",
  "language": "es",
  "question": "El cliente dice: “No me interesa.” ¿Cuál es el mejor manejo inicial?",
  "options": [
    "Reconocerlo y crear curiosidad con una pregunta breve",
    "Colgar inmediatamente",
    "Discutir con el cliente",
    "Transferir sin aprobación"
  ],
  "correct": 0,
  "explanation": "Se debe reconocer la objeción, entenderla y crear curiosidad sin presionar."
},
{
  "id": 74,
  "topic": "objections",
  "language": "es",
  "question": "El cliente pregunta: “¿De dónde sacaron mi información?” ¿Qué respuesta es más segura?",
  "options": [
    "Trabajamos con concesionarios y registros vehiculares",
    "El banco nos dio todo su archivo",
    "Compramos su información en línea",
    "No puedo decirle de dónde salió"
  ],
  "correct": 0,
  "explanation": "No se debe decir que el banco dio la información. Usa dealerships y vehicle registries."
},
{
  "id": 75,
  "topic": "objections",
  "language": "es",
  "question": "El cliente dice: “Ya tengo seguro.” ¿Qué debe aclarar el opener?",
  "options": [
    "El seguro cubre accidentes; esto es para fallas mecánicas",
    "El seguro y la garantía extendida son lo mismo",
    "El seguro se cancela si no activa esto",
    "La garantía extendida es obligatoria"
  ],
  "correct": 0,
  "explanation": "Seguro y cobertura extendida son productos diferentes."
},
{
  "id": 76,
  "topic": "objections",
  "language": "es",
  "question": "El cliente dice: “Estoy ocupado.” ¿Cuál es la mejor respuesta?",
  "options": [
    "Respetar el tiempo y ofrecer callback",
    "Seguir leyendo el script más rápido",
    "Transferir para que el asesor agende",
    "Marcarlo como DNC automáticamente"
  ],
  "correct": 0,
  "explanation": "Si el cliente está ocupado, ofrece una llamada de regreso en vez de forzar el transfer."
},
{
  "id": 77,
  "topic": "product",
  "language": "en",
  "question": "Which vehicle should not be treated as eligible?",
  "options": [
    "A 2020 electric vehicle",
    "A 2017 sedan under 100,000 miles",
    "A 2018 SUV that runs well",
    "A 2015 truck with normal mileage"
  ],
  "correct": 0,
  "explanation": "Electric vehicles are excluded from this coverage."
},
{
  "id": 78,
  "topic": "product",
  "language": "en",
  "question": "What is the key difference between insurance and extended coverage?",
  "options": [
    "Insurance covers accidents; extended coverage focuses on mechanical breakdowns",
    "Both cover the exact same repairs",
    "Extended coverage is required by law",
    "Insurance pays for normal wear repairs only"
  ],
  "correct": 0,
  "explanation": "This distinction prevents customers from confusing insurance with mechanical breakdown coverage."
},
{
  "id": 79,
  "topic": "product",
  "language": "en",
  "question": "Which repair type should agents avoid promising as covered?",
  "options": [
    "Cosmetic bodywork",
    "Engine mechanical failure",
    "Transmission mechanical failure",
    "Authorized covered repairs"
  ],
  "correct": 0,
  "explanation": "Bodywork and cosmetic damage are excluded."
},
{
  "id": 80,
  "topic": "product",
  "language": "en",
  "question": "What mileage limit should be respected before moving forward?",
  "options": [
    "Up to 175,000 miles",
    "Up to 250,000 miles",
    "Any mileage if financed",
    "Only under 50,000 miles"
  ],
  "correct": 0,
  "explanation": "Vehicles with over 175,000 miles should not be treated as eligible."
},
{
  "id": 81,
  "topic": "product",
  "language": "es",
  "question": "¿Qué año de vehículo empieza a ser elegible según la regla básica?",
  "options": [
    "2011 o más nuevo",
    "2005 o más nuevo",
    "Cualquier año si está financiado",
    "Solo 2020 o más nuevo"
  ],
  "correct": 0,
  "explanation": "Vehículos antes de 2011 no califican bajo la regla básica."
},
{
  "id": 82,
  "topic": "product",
  "language": "es",
  "question": "¿Qué tipo de cobertura se está ofreciendo?",
  "options": [
    "Cobertura para fallas mecánicas",
    "Seguro de accidentes",
    "Reparación estética de carrocería",
    "Renovación directa de fábrica"
  ],
  "correct": 0,
  "explanation": "La cobertura extendida se enfoca en fallas mecánicas, no accidentes ni estética."
},
{
  "id": 83,
  "topic": "product",
  "language": "es",
  "question": "¿Dónde se pueden manejar reparaciones aprobadas normalmente?",
  "options": [
    "En talleres autorizados a nivel nacional",
    "Solo en el dealer original",
    "Solo en Dallas",
    "Solo con el banco"
  ],
  "correct": 0,
  "explanation": "Las reparaciones aprobadas pueden manejarse en repair facilities autorizadas en EE.UU."
},
{
  "id": 84,
  "topic": "product",
  "language": "es",
  "question": "Si el vehículo tiene partes modificadas, ¿qué debe recordarse?",
  "options": [
    "Las partes modificadas no se cubren, pero otras partes podrían calificar",
    "Todo el vehículo siempre queda cubierto",
    "Toda modificación mejora la cobertura",
    "Solo se cubren modificaciones del cliente"
  ],
  "correct": 0,
  "explanation": "Las partes modificadas son excluidas, aunque partes no modificadas podrían calificar."
},
{
  "id": 85,
  "topic": "callflow",
  "language": "en",
  "question": "What protects the call while waiting for the Service Advisor?",
  "options": [
    "Keep the customer engaged with light vehicle questions",
    "Stay silent until the advisor speaks",
    "Ask for payment details",
    "Promise the advisor is ready now"
  ],
  "correct": 0,
  "explanation": "Light waiting questions reduce dead air and prevent hang-ups."
},
{
  "id": 86,
  "topic": "callflow",
  "language": "en",
  "question": "If the Service Advisor joins but does not speak, what should the opener do?",
  "options": [
    "Say “Hello Service Advisor” and continue the handoff",
    "Leave immediately",
    "Tag XFER and disconnect",
    "Restart the call from the beginning"
  ],
  "correct": 0,
  "explanation": "Prompting the advisor helps prevent silence and protects the transfer."
},
{
  "id": 87,
  "topic": "callflow",
  "language": "en",
  "question": "What makes a transfer risky or invalid?",
  "options": [
    "Leaving before confirming the SA and customer are talking",
    "Getting approval before dialing",
    "Introducing the customer clearly",
    "Waiting at least 15 seconds"
  ],
  "correct": 0,
  "explanation": "Leaving too early can create an invalid handoff."
},
{
  "id": 88,
  "topic": "callflow",
  "language": "en",
  "question": "What should be done if the customer hangs up before a real SA conversation starts?",
  "options": [
    "Do not treat it as a clean valid XFER",
    "Always tag XFER because the call was dialed",
    "Use SPXFER automatically",
    "Mark DNC immediately"
  ],
  "correct": 0,
  "explanation": "A valid transfer requires a real handoff, not just dialing the advisor."
},
{
  "id": 89,
  "topic": "callflow",
  "language": "es",
  "question": "¿Qué debe pasar antes de marcar al asesor?",
  "options": [
    "El cliente debe dar aprobación clara",
    "El opener debe prometer precio",
    "El cliente debe dar VIN completo",
    "El asesor debe enviar un chat"
  ],
  "correct": 0,
  "explanation": "La aprobación del cliente debe ocurrir antes de marcar la transferencia."
},
{
  "id": 90,
  "topic": "callflow",
  "language": "es",
  "question": "En una transferencia en español, ¿qué debe cuidar el opener?",
  "options": [
    "Usar la ruta/opción correcta de Spanish transfer",
    "Usar SPXFER para todo cliente que habla español",
    "Colgar apenas el asesor conteste",
    "No presentar al cliente"
  ],
  "correct": 0,
  "explanation": "El flujo en español debe seguir la ruta correcta y mantener un handoff limpio."
},
{
  "id": 91,
  "topic": "callflow",
  "language": "es",
  "question": "¿Qué confirma que el handoff fue seguro?",
  "options": [
    "El asesor y el cliente están hablando activamente",
    "El opener escuchó un ring",
    "El cliente dijo hello una vez",
    "El opener presionó transfer"
  ],
  "correct": 0,
  "explanation": "La conversación activa entre asesor y cliente confirma el handoff."
},
{
  "id": 92,
  "topic": "callflow",
  "language": "es",
  "question": "Si el cliente pide callback durante la transferencia, ¿qué debe evitarse?",
  "options": [
    "Marcarlo como XFER válido",
    "Usar CALLBK",
    "Documentar lo ocurrido",
    "Respetar el callback"
  ],
  "correct": 0,
  "explanation": "Si el cliente pide callback, no debe contarse como una transferencia limpia."
},
{
  "id": 93,
  "topic": "dosdonts",
  "language": "en",
  "question": "Which source statement is not allowed?",
  "options": [
    "The bank gave us your file",
    "We partner with dealerships and registries",
    "I only see finance information",
    "The advisor can review the details"
  ],
  "correct": 0,
  "explanation": "Agents should not say the bank gave the customer information."
},
{
  "id": 94,
  "topic": "dosdonts",
  "language": "en",
  "question": "Which word should agents avoid when describing the quote or coverage?",
  "options": [
    "Free",
    "Review",
    "Advisor",
    "Coverage"
  ],
  "correct": 0,
  "explanation": "Using “free” can be misleading and non-compliant."
},
{
  "id": 95,
  "topic": "dosdonts",
  "language": "en",
  "question": "Which disposition rule is correct for blind Spanish routing?",
  "options": [
    "Use SPANIS, not SPXFER",
    "Use SPXFER for every Spanish speaker",
    "Use XFER even if no closer joins",
    "Use DNC if the customer speaks Spanish"
  ],
  "correct": 0,
  "explanation": "SPANIS is for blind Spanish speaker routing; SPXFER is for direct Spanish transfer."
},
{
  "id": 96,
  "topic": "dosdonts",
  "language": "en",
  "question": "What should the rep do when the customer asks to be removed?",
  "options": [
    "Use DNC and handle it professionally",
    "Keep rebutting until they listen",
    "Mark NI only",
    "Transfer to the advisor"
  ],
  "correct": 0,
  "explanation": "Removal requests must be handled as DNC."
},
{
  "id": 97,
  "topic": "dosdonts",
  "language": "es",
  "question": "¿Qué comportamiento evita errores de compliance?",
  "options": [
    "No improvisar ni acortar el script",
    "Prometer que será gratis",
    "Decir que el banco pidió la llamada",
    "Transferir sin aprobación"
  ],
  "correct": 0,
  "explanation": "No improvisar ayuda a mantener consistencia y evitar invalids."
},
{
  "id": 98,
  "topic": "dosdonts",
  "language": "es",
  "question": "¿Qué pause code corresponde al baño/restroom?",
  "options": [
    "RR",
    "Lunch",
    "Manage",
    "CB"
  ],
  "correct": 0,
  "explanation": "RR es el código correcto para restroom."
},
{
  "id": 99,
  "topic": "dosdonts",
  "language": "es",
  "question": "¿Qué pause code corresponde a problemas técnicos o del sistema?",
  "options": [
    "Tech",
    "Break",
    "Lunch",
    "CALLBK"
  ],
  "correct": 0,
  "explanation": "Tech se usa para problemas técnicos o del sistema."
},
{
  "id": 100,
  "topic": "dosdonts",
  "language": "es",
  "question": "¿Qué combinación ayuda a evitar invalid transfers?",
  "options": [
    "Verificar, pedir aprobación, presentar y esperar",
    "Transferir rápido y colgar",
    "Usar SPXFER para todo español",
    "Prometer menos de un minuto"
  ],
  "correct": 0,
  "explanation": "La transferencia limpia requiere verificación, aprobación, introducción y espera suficiente."
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
