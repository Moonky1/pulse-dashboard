export const ACADEMY_LANG_KEY = 'pulse_academy_lang'

export const LANG_OPTIONS = [
  { id: 'en', label: 'English', short: 'EN', icon: '🇺🇸' },
  { id: 'es', label: 'Español', short: 'ES', icon: '🇪🇸' },
]

export const ACADEMY_COPY = {
  en: {
    navHome: 'Home',
    navGo: 'Pulse GO',
    navAcademy: 'Academy',
    eyebrow: 'Pulse knowledge base',
    title: 'Pulse Academy',
    subtitle:
      'Everything you need to master scripts, objections, product knowledge, QA standards, dispositions, and transfers.',
    searchLabel: 'Search Academy',
    searchPlaceholder: 'Search SPXFER, 15 seconds, not interested, mileage, callbacks...',
    startHere: 'Start here',
    startDesc: 'Use the sidebar or search to find any training topic fast.',
    quickCards: 'Quick access',
    all: 'All',
    noResults: 'No results found',
    results: 'results',
    openGuide: 'Open guide',
    sidebarTitle: 'Academy',
    onThisPage: 'On this page',
    updated: 'Training wiki',
    overview: 'Overview',
    backAcademy: 'Back to Academy',
    sectionLibrary: 'Library',
    searchTip:
      'Tip: search by disposition codes, customer objections, invalid transfer reasons, or product rules.',
  },
  es: {
    navHome: 'Inicio',
    navGo: 'Pulse GO',
    navAcademy: 'Academy',
    eyebrow: 'Base de conocimiento Pulse',
    title: 'Pulse Academy',
subtitle:
  'Todo lo que necesitas para dominar scripts, objeciones, producto, reglas de QA, disposiciones y transferencias.',
    searchLabel: 'Buscar en Academy',
    searchPlaceholder: 'Busca SPXFER, 15 segundos, no interesado, millaje, callbacks...',
    startHere: 'Empieza aquí',
    startDesc: 'Usa la barra lateral o el buscador para encontrar cualquier tema rápido.',
    quickCards: 'Accesos rápidos',
    all: 'Todo',
    noResults: 'Sin resultados',
    results: 'resultados',
    openGuide: 'Abrir guía',
    sidebarTitle: 'Academy',
    onThisPage: 'En esta página',
    updated: 'Wiki de entrenamiento',
    overview: 'Resumen',
    backAcademy: 'Volver a Academy',
    sectionLibrary: 'Biblioteca',
    searchTip:
      'Tip: busca por códigos de disposición, objeciones, razones de invalid transfer o reglas de producto.',
  },
}

export const ACADEMY_SECTIONS = [
  {
    id: 'overview',
    icon: '📚',
    group: 'Core',
    title: { en: 'Welcome', es: 'Bienvenida' },
    desc: {
      en: 'How to use Pulse Academy and what each section is for.',
      es: 'Cómo usar Pulse Academy y para qué sirve cada sección.',
    },
    keywords: 'academy welcome navigation wiki training',
  },
  {
    id: 'script',
    icon: '📋',
    group: 'Training',
    title: { en: 'Scripts', es: 'Scripts' },
    desc: {
      en: 'Official script lines, structure, and transfer setup.',
      es: 'Líneas oficiales del script, estructura y preparación de transferencia.',
    },
    keywords: 'script opener introduction purpose transfer setup service advisor',
  },
  {
    id: 'objections',
    icon: '🛡️',
    group: 'Training',
    title: { en: 'Objections', es: 'Objeciones' },
    desc: {
      en: 'Approved rebuttals and how to keep control of the call.',
      es: 'Respuestas aprobadas y cómo mantener control de la llamada.',
    },
    keywords: 'objection rebuttal not interested scam busy email already coverage',
  },
  {
    id: 'product',
    icon: '📦',
    group: 'Knowledge',
    title: { en: 'Product Knowledge', es: 'Conocimiento del Producto' },
    desc: {
      en: 'Coverage, exclusions, eligibility rules, mileage, and vehicle types.',
      es: 'Cobertura, exclusiones, elegibilidad, millaje y tipos de vehículo.',
    },
    keywords: 'product coverage warranty insurance 175000 miles electric 2011 vehicle',
  },
  {
    id: 'call-flow',
    icon: '📞',
    group: 'Process',
    title: { en: 'Call Flow', es: 'Flujo de Llamada' },
    desc: {
      en: 'The correct call sequence from opening to handoff.',
      es: 'La secuencia correcta desde la apertura hasta el handoff.',
    },
    keywords: 'call flow transfer protocol handoff service advisor 15 seconds',
  },
  {
    id: 'qa-invalid',
    icon: '🚨',
    group: 'QA',
    title: { en: 'QA & Invalid XFER', es: 'QA e Invalid XFER' },
    desc: {
      en: 'What makes transfers valid, invalid, or coaching opportunities.',
      es: 'Qué hace que una transferencia sea válida, inválida o punto de coaching.',
    },
    keywords: 'qa invalid transfer xfer consent handoff no answer callback spanish child',
  },
  {
    id: 'dispositions',
    icon: '🧾',
    group: 'Dialer',
    title: { en: 'Dispositions', es: 'Disposiciones' },
    desc: {
      en: 'When to use XFER, CALLBK, NI, DNC, DAIR, SPANIS, SPXFER, and more.',
      es: 'Cuándo usar XFER, CALLBK, NI, DNC, DAIR, SPANIS, SPXFER y más.',
    },
    keywords: 'disposition xfer callbk ni dnc dair spanis spxfer wrngnu answering machine',
  },
  {
    id: 'dialer',
    icon: '🖥️',
    group: 'Dialer',
    title: { en: 'Dialer Guide', es: 'Guía del Dialer' },
    desc: {
      en: 'Dialer screens, pause codes, and call handling references.',
      es: 'Pantallas del dialer, códigos de pausa y referencias de manejo.',
    },
    keywords: 'dialer pause codes rr lunch tech callback active vici',
  },
  {
    id: 'roleplays',
    icon: '🎭',
    group: 'Practice',
    title: { en: 'Roleplays', es: 'Roleplays' },
    desc: {
      en: 'Training scenarios for wrong person, busy customer, language barrier, and more.',
      es: 'Escenarios para wrong person, busy customer, language barrier y más.',
    },
    keywords: 'roleplay wrong person busy customer language barrier decision maker stroller',
  },
  {
    id: 'mistakes',
    icon: '⚠️',
    group: 'QA',
    title: { en: 'Common Mistakes', es: 'Errores Comunes' },
    desc: {
      en: 'Fast coaching notes for repeated mistakes seen in audits.',
      es: 'Notas rápidas de coaching para errores repetidos en auditorías.',
    },
    keywords: 'common mistakes coaching audit compliance transfer mistakes',
  },
]

export function getSavedAcademyLang() {
  if (typeof window === 'undefined') return 'en'

  const saved = window.localStorage.getItem(ACADEMY_LANG_KEY)
  return saved === 'es' ? 'es' : 'en'
}

export function saveAcademyLang(lang) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACADEMY_LANG_KEY, lang === 'es' ? 'es' : 'en')
}

export function normalizeAcademyId(value) {
  const id = String(value || 'overview').toLowerCase().trim()

  const aliases = {
    home: 'overview',
    welcome: 'overview',
    start: 'overview',
    'script-en': 'script',
    'script-es': 'script',
    scripts: 'script',
    'objections-en': 'objections',
    'objections-es': 'objections',
    rebuttals: 'objections',
    'product-knowledge': 'product',
    productknowledge: 'product',
    coverage: 'product',
    product: 'product',
    callflow: 'call-flow',
    'call-flow': 'call-flow',
    transfer: 'call-flow',
    'qa-invalid': 'qa-invalid',
    qa: 'qa-invalid',
    invalid: 'qa-invalid',
    'invalid-xfer': 'qa-invalid',
    'dos-donts': 'mistakes',
    dosdonts: 'mistakes',
    compliance: 'mistakes',
    dispositions: 'dispositions',
    disposition: 'dispositions',
    'dialer-guide': 'dialer',
    dialer: 'dialer',
    pauses: 'dialer',
    'pause-codes': 'dialer',
    roleplay: 'roleplays',
    roleplays: 'roleplays',
    mistakes: 'mistakes',
  }

  return aliases[id] || id
}

export function getAcademySection(id) {
  const cleanId = normalizeAcademyId(id)
  return ACADEMY_SECTIONS.find((section) => section.id === cleanId) || ACADEMY_SECTIONS[0]
}

export function textFor(entry, lang) {
  if (!entry) return ''
  if (typeof entry === 'string') return entry
  return entry[lang] || entry.en || ''
}

export function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function trimText(value, max = 150) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}...`
}
