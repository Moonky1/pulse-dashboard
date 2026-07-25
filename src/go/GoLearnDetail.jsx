import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  scripts,
  objections,
  productKnowledge,
  callFlow,
  dosAndDonts,
  dialer,
  roleplayScenarios,
} from './goContent'
import {
  ACADEMY_COPY,
  ACADEMY_SECTIONS,
  LANG_OPTIONS,
  getAcademySection,
  getSavedAcademyLang,
  normalizeAcademyId,
  saveAcademyLang,
  textFor,
} from './academyData'
import './Academy.css'

const PRODUCT_ES = {
  comparison: [
    {
      name: 'Garantía de Fábrica',
      points: [
        'Viene con vehículos nuevos.',
        'Suele durar cerca de 3 años o 36,000 millas.',
        'Cubre defectos del fabricante.',
        'Expira y no se renueva como garantía de fábrica.',
      ],
    },
    {
      name: 'Cobertura Extendida',
      points: [
        'No es obligatoria.',
        'Cubre reparaciones mecánicas después de la garantía de fábrica.',
        'Es un producto opcional.',
        'Eso es lo que se revisa con el Asesor de Servicio.',
      ],
    },
    {
      name: 'Seguro',
      points: [
        'Es obligatorio para manejar legalmente en EE.UU.',
        'Cubre accidentes, robo, daño y responsabilidad.',
        'No cubre fallas mecánicas.',
        'Es un producto completamente diferente.',
      ],
    },
  ],
  canCover: [
    'Motor y transmisión.',
    'Vehículos fabricados en 2011 o después.',
    'Vehículos con hasta 175,000 millas.',
    'Vehículos que todavía funcionan correctamente.',
    'Cobertura por 100,000 o más millas adicionales.',
    'Reparaciones en talleres autorizados a nivel nacional.',
    'Partes no modificadas en vehículos con modificaciones.',
  ],
  cannotCover: [
    'Vehículos eléctricos.',
    'Vehículos anteriores a 2011.',
    'Vehículos con más de 175,000 millas.',
    'Carrocería o reparaciones cosméticas.',
    'Daños por colisión o accidente.',
    'Bombillos y piezas de desgaste normal.',
    'Las partes modificadas como tal.',
    'Motocicletas, trailers y excepciones exóticas.',
  ],
}

const CALL_FLOW_ES = [
  {
    id: 1,
    icon: '👋',
    title: 'Introducción e información financiera',
    description:
      'Saluda al cliente por su nombre, identifícate con la compañía y menciona el mes y año de financiación.',
    keyPoints: ['Usa el nombre del cliente', 'Usa mes y año del formulario', 'Suena seguro'],
  },
  {
    id: 2,
    icon: '🚗',
    title: 'Verificación de condición del vehículo',
    description:
      'Pregunta si el vehículo todavía está en buenas condiciones de funcionamiento. Esto confirma elegibilidad.',
    keyPoints: ['Espera la respuesta', 'El vehículo debe funcionar', 'No saltes este paso'],
  },
  {
    id: 3,
    icon: '📋',
    title: 'Preparación de transferencia',
    description:
      'Explica que necesitas conectar al cliente con un Asesor de Servicio y consigue aprobación primero.',
    keyPoints: ['Obtén aprobación clara', 'Nunca transfieras sin consentimiento', 'Sé directo y natural'],
  },
  {
    id: 4,
    icon: '🔄',
    title: 'Transferencia profesional',
    description:
      'Espera a que el Asesor de Servicio conteste y hable primero. Luego presenta al cliente y permanece en línea.',
    keyPoints: ['El SA habla primero', 'Presenta al cliente correctamente', 'Confirma el handoff antes de salir'],
  },
]

const TRANSFER_PROTOCOL_ES = [
  'Confirma primero que el vehículo califica.',
  'Obtén aprobación clara del cliente para transferir.',
  'Inicia la transferencia y permanece en la línea.',
  'Espera a que el Asesor de Servicio conteste y hable primero.',
  'Presenta al cliente por nombre.',
  'Permanece al menos 15 segundos y confirma que ambos están hablando.',
]

const WAITING_QUESTIONS_ES = [
  '¿Su vehículo ha recibido mantenimiento recientemente?',
  '¿Ha notado ruidos inusuales en el motor o transmisión?',
  '¿Ha tenido reparaciones o fallas recientes?',
  '¿El vehículo enciende sin problema?',
  '¿Ha visto alguna luz de advertencia en el tablero?',
  '¿Los frenos responden correctamente?',
  '¿Está satisfecho con el rendimiento del vehículo?',
  '¿El vehículo tiene modificaciones o upgrades?',
]

const QA_RULES = {
  en: [
    {
      title: 'Clear consent before transfer',
      body: 'A vehicle condition answer is not transfer approval. The customer must clearly agree to speak with the Service Advisor.',
    },
    {
      title: 'Service Advisor must speak first',
      body: 'Do not introduce the customer before the Service Advisor joins and speaks. The handoff must be controlled.',
    },
    {
      title: '15-second handoff',
      body: 'Stay on the line long enough to confirm the Service Advisor and customer are actively talking.',
    },
    {
      title: 'No child / no non-decision maker',
      body: 'A child, wrong person, or co-signer who cannot decide should not be treated as a clean transfer.',
    },
    {
      title: 'No immediate Spanish issue',
      body: 'If the customer immediately needs Spanish and no English SA conversation happens, the English XFER is not clean.',
    },
    {
      title: 'Callbacks are not clean XFERs',
      body: 'If the customer asks the Service Advisor for a callback or hangs up before a real conversation, use callback handling.',
    },
  ],
  es: [
    {
      title: 'Consentimiento claro antes de transferir',
      body: 'Que el cliente diga que el vehículo funciona no significa que aprobó la transferencia. Debe aceptar hablar con el Asesor de Servicio.',
    },
    {
      title: 'El Asesor de Servicio debe hablar primero',
      body: 'No presentes al cliente antes de que el Asesor entre y hable. El handoff debe estar controlado.',
    },
    {
      title: 'Handoff de 15 segundos',
      body: 'Permanece en línea el tiempo suficiente para confirmar que el Asesor y el cliente están hablando activamente.',
    },
    {
      title: 'No niños / no persona sin decisión',
      body: 'Un menor, persona equivocada o co-signer que no decide no debe tratarse como transferencia limpia.',
    },
    {
      title: 'No problema inmediato de idioma',
      body: 'Si el cliente pide español de inmediato y no hay conversación en inglés con el SA, no es un English XFER limpio.',
    },
    {
      title: 'Callbacks no son XFER limpio',
      body: 'Si el cliente pide callback con el Asesor o cuelga antes de una conversación real, corresponde manejo de callback.',
    },
  ],
}

const COMMON_MISTAKES = {
  en: [
    ['Skipping customer questions', 'Questions like “how much?”, “who are you?”, or “is this my bank?” must be clarified before transfer.'],
    ['Overpromising cost', 'Avoid saying it is free, guaranteed, approved, or that payments will go down.'],
    ['Weak language check', 'If the customer does not understand English clearly, ask for preferred language instead of forcing the call.'],
    ['Leaving too early', 'Do not leave immediately when the Service Advisor joins. Confirm both lines are connected and talking.'],
    ['Wrong disposition', 'SPANIS, SPXFER, CALLBK, NI, DNC, DAIR, and XFER must be used based on what actually happened.'],
  ],
  es: [
    ['Ignorar preguntas del cliente', 'Preguntas como “¿cuánto cuesta?”, “¿quiénes son?” o “¿esto es de mi banco?” deben aclararse antes de transferir.'],
    ['Prometer costos o resultados', 'Evita decir que es gratis, garantizado, aprobado o que los pagos van a bajar.'],
    ['No revisar idioma', 'Si el cliente no entiende bien inglés, pregunta su idioma de preferencia en vez de forzar la llamada.'],
    ['Salir demasiado rápido', 'No salgas apenas entra el Asesor. Confirma que ambas líneas están conectadas y hablando.'],
    ['Disposición incorrecta', 'SPANIS, SPXFER, CALLBK, NI, DNC, DAIR y XFER deben usarse según lo que realmente ocurrió.'],
  ],
}

const DISPOSITION_ES = {
  A: 'Máquina contestadora, voicemail o sistema automático.',
  BLANK: 'Archivo sin información útil del cliente.',
  CALLBK: 'El cliente pidió una llamada de regreso o no pudo continuar.',
  DAIR: 'Dead Air real: no hay respuesta útil en la línea.',
  DNC: 'El cliente pidió no recibir más llamadas o ser removido.',
  NI: 'El cliente no está interesado o rechaza continuar.',
  SPANIS: 'Ruta ciega por cliente que pide español cuando no hay transferencia directa a SA español.',
  SPXFER: 'Transferencia directa en español con Asesor de Servicio en español.',
  WRNGNU: 'Número equivocado o información incorrecta en el archivo.',
  XFER: 'Transferencia limpia en inglés con handoff correcto.',
}

function DetailShell({ lang, setLang, section, children, toc }) {
  const navigate = useNavigate()
  const copy = ACADEMY_COPY[lang]

  const goHome = () => {
    const loggedIn = Boolean(localStorage.getItem('pulse_user'))
    navigate(loggedIn ? '/dashboard' : '/')
  }

  const changeLang = (nextLang) => {
    setLang(nextLang)
    saveAcademyLang(nextLang)
  }

  return (
    <div className="ac-page">
      <div className="ac-stars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="ac-topnav">
        <button className="ac-nav-btn" onClick={() => navigate('/academy')}>
          ← {copy.backAcademy}
        </button>

        <nav className="ac-nav-pill">
          <button onClick={goHome}>{copy.navHome}</button>
          <button onClick={() => navigate('/go')}>{copy.navGo}</button>
          <button className="active" onClick={() => navigate('/academy')}>
            {copy.navAcademy}
          </button>
        </nav>

        <div className="ac-lang-switch">
          {LANG_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={lang === option.id ? 'active' : ''}
              onClick={() => changeLang(option.id)}
            >
              <span>{option.icon}</span>
              {option.short}
            </button>
          ))}
        </div>
      </header>

      <main className="ac-detail-layout">
        <aside className="ac-sidebar ac-detail-side">
          <div className="ac-sidebar-head">
            <strong>{copy.sidebarTitle}</strong>
            <span>{copy.sectionLibrary}</span>
          </div>

          <div className="ac-side-list">
            {ACADEMY_SECTIONS.map((item) => (
              <button
                key={item.id}
                className={item.id === section.id ? 'active' : ''}
                onClick={() => navigate(`/academy/${item.id}`)}
              >
                <span>{item.icon}</span>
                <b>{textFor(item.title, lang)}</b>
              </button>
            ))}
          </div>
        </aside>

        <article className="ac-article">
          <section className="ac-article-hero">
            <span className="ac-article-icon">{section.icon}</span>
            <div>
              <span className="ac-eyebrow">{section.group}</span>
              <h1>{textFor(section.title, lang)}</h1>
              <p>{textFor(section.desc, lang)}</p>
            </div>
          </section>

          {children}
        </article>

        <aside className="ac-toc">
          <span>{copy.onThisPage}</span>
          {toc.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </aside>
      </main>
    </div>
  )
}

function OverviewContent({ lang }) {
  const blocks = lang === 'es'
    ? [
        ['Busca rápido', 'Usa palabras como SPXFER, 15 segundos, DNC, millaje, idioma, callback o Service Advisor.'],
        ['Aprende el proceso', 'Lee Script, Call Flow y QA antes de practicar en Pulse GO.'],
        ['Corrige errores', 'Usa Common Mistakes y QA Invalid XFER para coaching directo.'],
      ]
    : [
        ['Search fast', 'Use terms like SPXFER, 15 seconds, DNC, mileage, language, callback, or Service Advisor.'],
        ['Learn the process', 'Read Script, Call Flow, and QA before practicing in Pulse GO.'],
        ['Fix mistakes', 'Use Common Mistakes and QA Invalid XFER for direct coaching.'],
      ]

  return (
    <div className="ac-content-stack">
      <section id="start" className="ac-panel">
        <span className="ac-kicker">{lang === 'es' ? 'Cómo usarlo' : 'How to use it'}</span>
        <h2>{lang === 'es' ? 'Academy es la wiki oficial de Pulse' : 'Academy is the official Pulse wiki'}</h2>
        <p>
          {lang === 'es'
            ? 'Aquí se organiza el contenido que los agentes necesitan para entender el proceso, prepararse para trainings y reducir invalid transfers.'
            : 'This is where agents can understand the process, prepare for training, and reduce invalid transfers.'}
        </p>
      </section>

      <section id="quick-paths" className="ac-info-grid">
        {blocks.map(([title, body]) => (
          <div key={title} className="ac-info-card">
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function ScriptContent({ lang }) {
  const script = scripts?.[lang] || scripts?.en

  return (
    <div className="ac-content-stack">
      <section id="script-lines" className="ac-panel">
        <span className="ac-kicker">{script.flag} {script.title}</span>
        <h2>{lang === 'es' ? 'Script palabra por palabra' : 'Word-for-word script'}</h2>
        <p>
          {lang === 'es'
            ? 'La idea es sonar natural sin cambiar el mínimo requerido del proceso.'
            : 'The goal is to sound natural without changing the required process.'}
        </p>
      </section>

      <section id="steps" className="ac-step-list">
        {script.steps.map((step) => (
          <div key={step.id} className={`ac-step-card ${step.type}`}>
            <span className="ac-step-num">{String(step.id).padStart(2, '0')}</span>
            <div>
              <small>{step.type}</small>
              <h3>{step.label}</h3>
              <p>{step.text}</p>
              {step.tip && <em>💡 {step.tip}</em>}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function ObjectionsContent({ lang }) {
  return (
    <section id="rebuttals" className="ac-card-grid detail">
      {objections.map((item) => (
        <div key={item.id} className="ac-topic-card">
          <span>{item.emoji}</span>
          <small>{item.goal}</small>
          <h3>{lang === 'es' ? item.titleEs : item.title}</h3>
          <p>{lang === 'es' ? item.rebuttalEs : item.rebuttalEn}</p>
        </div>
      ))}
    </section>
  )
}

function ProductContent({ lang }) {
  const comparison = lang === 'es' ? PRODUCT_ES.comparison : productKnowledge.comparison.items
  const canCover = lang === 'es' ? PRODUCT_ES.canCover : productKnowledge.canCover.items
  const cannotCover = lang === 'es' ? PRODUCT_ES.cannotCover : productKnowledge.cannotCover.items

  return (
    <div className="ac-content-stack">
      <section id="comparison" className="ac-card-grid detail three">
        {comparison.map((item) => (
          <div key={item.name} className="ac-topic-card">
            <span>📦</span>
            <h3>{item.name}</h3>
            <ul>
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="coverage" className="ac-two-col">
        <div className="ac-topic-card good">
          <span>✅</span>
          <h3>{lang === 'es' ? 'Lo que sí se puede cubrir' : productKnowledge.canCover.title}</h3>
          <ul>
            {canCover.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="ac-topic-card bad">
          <span>🚫</span>
          <h3>{lang === 'es' ? 'Lo que no se puede cubrir' : productKnowledge.cannotCover.title}</h3>
          <ul>
            {cannotCover.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>
    </div>
  )
}

function CallFlowContent({ lang }) {
  const steps = lang === 'es' ? CALL_FLOW_ES : callFlow.steps
  const transferProtocol = lang === 'es' ? TRANSFER_PROTOCOL_ES : callFlow.transferProtocol
  const waitingQuestions = lang === 'es' ? WAITING_QUESTIONS_ES : callFlow.waitingQuestions

  return (
    <div className="ac-content-stack">
      <section id="flow" className="ac-step-list">
        {steps.map((step) => (
          <div key={step.id} className="ac-step-card flow">
            <span className="ac-step-num">{step.icon}</span>
            <div>
              <small>{lang === 'es' ? `Paso ${step.id}` : `Step ${step.id}`}</small>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <div className="ac-chip-row">
                {step.keyPoints.map((point) => <span key={point}>{point}</span>)}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section id="handoff" className="ac-panel">
        <span className="ac-kicker">{lang === 'es' ? 'Protocolo de transferencia' : 'Transfer protocol'}</span>
        <h2>{lang === 'es' ? 'Checklist de handoff limpio' : 'Clean handoff checklist'}</h2>
        <div className="ac-mini-grid">
          {transferProtocol.map((item, index) => (
            <div key={item} className="ac-mini-card">
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="waiting" className="ac-panel">
        <span className="ac-kicker">{lang === 'es' ? 'Mientras espera' : 'While waiting'}</span>
        <h2>{lang === 'es' ? 'Preguntas para evitar silencio' : 'Questions to avoid silence'}</h2>
        <div className="ac-mini-grid">
          {waitingQuestions.map((item) => (
            <div key={item} className="ac-mini-card"><span>{item}</span></div>
          ))}
        </div>
      </section>
    </div>
  )
}

function QAContent({ lang }) {
  return (
    <section id="rules" className="ac-card-grid detail">
      {QA_RULES[lang].map((item) => (
        <div key={item.title} className="ac-topic-card danger">
          <span>🚨</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </section>
  )
}

function DispositionsContent({ lang }) {
  return (
    <div className="ac-content-stack">
      <section id="dispositions" className="ac-card-grid detail">
        {dialer.dispositions.map((item) => (
          <div key={item.code} className="ac-topic-card code">
            <span>{item.code}</span>
            <h3>{item.label}</h3>
            <p>{lang === 'es' ? DISPOSITION_ES[item.code] || item.description : item.description}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function DialerContent({ lang }) {
  return (
    <div className="ac-content-stack">
      <section id="pause-codes" className="ac-panel">
        <span className="ac-kicker">{lang === 'es' ? 'Códigos de pausa' : 'Pause codes'}</span>
        <h2>{lang === 'es' ? 'Uso correcto de pausas' : 'Correct pause usage'}</h2>

        <div className="ac-mini-grid">
          {dialer.pauseCodes.map((item) => (
            <div key={`${item.code}-${item.label}`} className="ac-mini-card">
              <strong>{item.label}</strong>
              <span>{item.code}</span>
              <small>{item.time} · {item.desc}</small>
            </div>
          ))}
        </div>
      </section>

      <section id="visual-guide" className="ac-panel">
        <span className="ac-kicker">{lang === 'es' ? 'Guía visual' : 'Visual guide'}</span>
        <h2>{lang === 'es' ? 'Referencias del dialer' : 'Dialer references'}</h2>
        <p>
          {lang === 'es'
            ? 'Aquí puedes conectar después capturas de Vici, disposiciones y pantallas de login.'
            : 'This section can connect Vici screenshots, dispositions, and login screens later.'}
        </p>
      </section>
    </div>
  )
}

function RoleplaysContent({ lang }) {
  const items = (roleplayScenarios || [])
    .filter((item) => !item.language || item.language === lang)
    .slice(0, 16)

  if (!items.length) {
    return (
      <section className="ac-panel">
        <h2>{lang === 'es' ? 'Roleplays listos para crear' : 'Roleplays ready to build'}</h2>
        <p>
          {lang === 'es'
            ? 'Aún no hay escenarios filtrados para este idioma. Podemos agregarlos por topic.'
            : 'No filtered scenarios for this language yet. We can add them by topic.'}
        </p>
      </section>
    )
  }

  return (
    <section id="roleplay-list" className="ac-card-grid detail">
      {items.map((item) => (
        <div key={item.id} className="ac-topic-card">
          <span>🎭</span>
          <small>{item.topic}</small>
          <h3>{item.customer || item.question}</h3>
          <p>{item.question || item.outcome}</p>
        </div>
      ))}
    </section>
  )
}

function MistakesContent({ lang }) {
  return (
    <section id="mistakes" className="ac-card-grid detail">
      {COMMON_MISTAKES[lang].map(([title, body]) => (
        <div key={title} className="ac-topic-card warning">
          <span>⚠️</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      ))}
    </section>
  )
}

function getToc(id, lang) {
  const map = {
    overview: [
      ['#start', lang === 'es' ? 'Cómo usarlo' : 'How to use it'],
      ['#quick-paths', lang === 'es' ? 'Rutas rápidas' : 'Quick paths'],
    ],
    script: [
      ['#script-lines', lang === 'es' ? 'Script' : 'Script'],
      ['#steps', lang === 'es' ? 'Pasos' : 'Steps'],
    ],
    objections: [['#rebuttals', lang === 'es' ? 'Rebuttals' : 'Rebuttals']],
    product: [
      ['#comparison', lang === 'es' ? 'Comparación' : 'Comparison'],
      ['#coverage', lang === 'es' ? 'Cobertura' : 'Coverage'],
    ],
    'call-flow': [
      ['#flow', lang === 'es' ? 'Flujo' : 'Flow'],
      ['#handoff', lang === 'es' ? 'Handoff' : 'Handoff'],
      ['#waiting', lang === 'es' ? 'Espera' : 'Waiting'],
    ],
    'qa-invalid': [['#rules', lang === 'es' ? 'Reglas QA' : 'QA rules']],
    dispositions: [['#dispositions', lang === 'es' ? 'Disposiciones' : 'Dispositions']],
    dialer: [
      ['#pause-codes', lang === 'es' ? 'Pausas' : 'Pause codes'],
      ['#visual-guide', lang === 'es' ? 'Guía visual' : 'Visual guide'],
    ],
    roleplays: [['#roleplay-list', 'Roleplays']],
    mistakes: [['#mistakes', lang === 'es' ? 'Errores' : 'Mistakes']],
  }

  return (map[id] || map.overview).map(([href, label]) => ({ href, label }))
}

export default function GoLearnDetail() {
  const { id } = useParams()
  const [lang, setLang] = useState(() => getSavedAcademyLang())

  const cleanId = normalizeAcademyId(id)
  const section = useMemo(() => getAcademySection(cleanId), [cleanId])
  const toc = useMemo(() => getToc(section.id, lang), [section.id, lang])

  const content = {
    overview: <OverviewContent lang={lang} />,
    script: <ScriptContent lang={lang} />,
    objections: <ObjectionsContent lang={lang} />,
    product: <ProductContent lang={lang} />,
    'call-flow': <CallFlowContent lang={lang} />,
    'qa-invalid': <QAContent lang={lang} />,
    dispositions: <DispositionsContent lang={lang} />,
    dialer: <DialerContent lang={lang} />,
    roleplays: <RoleplaysContent lang={lang} />,
    mistakes: <MistakesContent lang={lang} />,
  }[section.id] || <OverviewContent lang={lang} />

  return (
    <DetailShell lang={lang} setLang={setLang} section={section} toc={toc}>
      {content}
    </DetailShell>
  )
}
