import {
  quizQuestions,
  classicQuestions,
  objectionBattleQuestions,
  validInvalidQuestions,
  disposeItQuestions,
  eligibleQuestions,
  certificationQuestions,
} from './questions'
import { scripts, dialer } from './goContent'

const DEFAULT_COUNT = 10
const LTRS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function cleanText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function makeTextBlob(question) {
  return cleanText([
    question?.question,
    question?.topic,
    question?.language,
    question?.explanation,
    ...(Array.isArray(question?.options) ? question.options : []),
  ].join(' '))
}

export function normalizeTopic(value) {
  const clean = cleanText(value || 'all').replace(/[^a-z0-9]/g, '')

  if (!clean || clean === 'all') return 'all'
  if (clean === 'script' || clean === 'scripts') return 'script'
  if (clean === 'objections' || clean === 'objection' || clean === 'rebuttals') return 'objections'
  if (clean === 'product' || clean === 'productknowledge' || clean === 'coverage') return 'product'
  if (clean === 'callflow' || clean === 'call') return 'callflow'
  if (clean === 'dosdonts' || clean === 'dosanddonts' || clean === 'compliance') return 'dosdonts'
  if (clean === 'disposeit' || clean === 'disposition' || clean === 'dispositions' || clean === 'dialer') {
    return 'disposeit'
  }
if (clean === 'eligible' || clean === 'eligibility' || clean === 'eligibleornoteligible') {
  return 'eligible'
}

if (clean === 'certification' || clean === 'certified') {
  return 'certification'
}
  return 'all'
}

export function normalizeLang(value) {
  const clean = cleanText(value || 'mixed')

  if (clean === 'en' || clean === 'english') return 'en'
  if (clean === 'es' || clean === 'spanish') return 'es'

  return 'mixed'
}

export function normalizeGame(value) {
  const clean = cleanText(value || 'classic').replace(/[^a-z0-9]/g, '')

  if (clean === 'scriptfill') return 'script-fill'
  if (clean === 'validinvalid') return 'valid-invalid'
  if (clean === 'objectionbattle') return 'objection-battle'
  if (clean === 'dispositiontrainer' || clean === 'disposeit') return 'disposition-trainer'
  if (clean === 'eligible' || clean === 'eligibility' || clean === 'eligibleornoteligible') return 'eligible'
  if (clean === 'certification' || clean === 'certified') return 'certification'

  return 'classic'
}

export function normalizeQuestionStyle(value) {
  const clean = cleanText(value || 'mc').trim()

  if (['mixed', 'mix', 'varied', 'variety'].includes(clean)) return 'mixed'

  return 'mc'
}

export function normalizeDifficulty(value) {
  const clean = cleanText(value || 'all').replace(/[^a-z0-9]/g, '')

  if (!clean || clean === 'all') return 'all'
  if (clean === 'easy' || clean === 'facil' || clean === 'fácil') return 'easy'
  if (clean === 'medium' || clean === 'medio' || clean === 'media') return 'medium'
  if (clean === 'advanced' || clean === 'hard' || clean === 'dificil' || clean === 'difícil') {
    return 'advanced'
  }

  return 'all'
}

export function getQuestionKind(question) {
  const rawKind = cleanText(
    question?.question_type ||
    question?.questionType ||
    question?.answerType ||
    question?.type ||
    question?.style ||
    'mc'
  ).replace(/[^a-z0-9]/g, '')

  if (['short', 'shortanswer', 'text', 'input'].includes(rawKind)) return 'short'
  if (
    ['binary', 'two', 'twochoice', 'validinvalid', 'truefalse'].includes(rawKind) ||
    (Array.isArray(question?.options) && question.options.length === 2)
  ) {
    return 'binary'
  }

  return 'mc'
}

export function questionFitsStyle(question, questionStyle) {
  const kind = getQuestionKind(question)
  const hasOptions = Array.isArray(question?.options) && question.options.length >= 2

  if (kind === 'short') return false
  if (questionStyle === 'mixed') return hasOptions

  return kind === 'mc' && Array.isArray(question?.options) && question.options.length >= 3
}

export function hashSeed(value) {
  let hash = 2166136261
  const text = String(value || 'pulse-go')

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return hash >>> 0
}

export function seededRandom(seed) {
  let t = seed + 0x6d2b79f5

  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function deterministicShuffle(array, seedText) {
  const copy = [...array]
  const random = seededRandom(hashSeed(seedText))

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function buildGeneratedScriptQuestions() {
  const questions = []
  const enSteps = scripts?.en?.steps || []
  const esSteps = scripts?.es?.steps || []

  enSteps.forEach((step) => {
    if (!step?.text || step.type === 'action') return

    questions.push({
      id: `script-fill-en-${step.id}`,
      mode: 'script-fill',
      topic: 'script',
      language: 'en',
      question: `Complete the script line: ${step.label}`,
      options: [
        step.text,
        'The bank already approved your new plan.',
        'The advisor will lower your payment today.',
        'This is required to keep driving legally.',
      ],
      correct: 0,
      explanation: step.tip || 'Use the approved script meaning without adding unsupported claims.',
    })
  })

  esSteps.forEach((step) => {
    if (!step?.text || step.type === 'action') return

    questions.push({
      id: `script-fill-es-${step.id}`,
      mode: 'script-fill',
      topic: 'script',
      language: 'es',
      question: `Completa la línea del script: ${step.label}`,
      options: [
        step.text,
        'El banco ya aprobó su nuevo plan.',
        'El Asesor le bajará el pago hoy.',
        'Esto es obligatorio para poder manejar legalmente.',
      ],
      correct: 0,
      explanation: step.tip || 'Mantén el significado aprobado del script sin agregar promesas.',
    })
  })

  return questions
}

function buildGeneratedDispositionQuestions() {
  const dispositionQuestions = []
  const dispositions = dialer?.dispositions || []

  const enScenarios = {
    A: 'The call goes to voicemail or an answering machine.',
    BLANK: 'The file has no usable customer information.',
    CALLBK: 'The customer says they are busy and still will not continue after callback handling.',
    DAIR: 'The line connects, but nobody responds at all.',
    DNC: 'The customer says, “Stop calling me.”',
    NI: 'The customer hears the purpose and refuses to continue.',
    SPANIS: 'The customer asks for Spanish, but there is no direct Spanish Service Advisor handoff.',
    SPXFER: 'The customer is transferred directly to a Spanish Service Advisor.',
    WN: 'The person says this is the wrong number.',
    WRNGVE: 'The customer says the vehicle on file is not their vehicle.',
    XFER: 'The customer is cleanly connected to a Service Advisor after proper handoff.',
  }

  const esScenarios = {
    A: 'La llamada cae en voicemail o máquina contestadora.',
    BLANK: 'El archivo no tiene información útil del cliente.',
    CALLBK: 'El cliente dice que está ocupado y no quiere continuar después del manejo de callback.',
    DAIR: 'La llamada conecta, pero nadie responde.',
    DNC: 'El cliente dice: “No me llamen más.”',
    NI: 'El cliente escucha el propósito y rechaza continuar.',
    SPANIS: 'El cliente pide español, pero no hay handoff directo con un Asesor en español.',
    SPXFER: 'El cliente es transferido directamente a un Asesor de Servicio en español.',
    WN: 'La persona dice que es número equivocado.',
    WRNGVE: 'El cliente dice que el vehículo del archivo no es su vehículo.',
    XFER: 'El cliente queda conectado limpiamente con un Asesor después del handoff correcto.',
  }

  const codes = dispositions.map((item) => item.code)
  const uniqueCodes = [...new Set(codes)]

  const makeOptions = (correctCode, seed) => {
    const wrongCodes = deterministicShuffle(
      uniqueCodes.filter((code) => code !== correctCode),
      seed
    ).slice(0, 3)

    return deterministicShuffle([correctCode, ...wrongCodes], `${seed}:options`)
  }

  dispositions.forEach((item) => {
    const correctCode = item.code
    const enOptions = makeOptions(correctCode, `en:${correctCode}`)
    const esOptions = makeOptions(correctCode, `es:${correctCode}`)

    dispositionQuestions.push({
      id: `dispo-en-${correctCode}`,
      mode: 'disposition-trainer',
      topic: 'disposeit',
      language: 'en',
      question: enScenarios[correctCode] || `Which disposition fits ${item.label}?`,
      options: enOptions,
      correct: enOptions.findIndex((code) => code === correctCode),
      explanation: `${correctCode} = ${item.label}. ${item.description}`,
    })

    dispositionQuestions.push({
      id: `dispo-es-${correctCode}`,
      mode: 'disposition-trainer',
      topic: 'disposeit',
      language: 'es',
      question: esScenarios[correctCode] || `¿Qué disposición corresponde a ${item.label}?`,
      options: esOptions,
      correct: esOptions.findIndex((code) => code === correctCode),
      explanation: `${correctCode} = ${item.label}. ${item.description}`,
    })
  })

  return dispositionQuestions
}

function isValidInvalidQuestion(question) {
  const blob = makeTextBlob(question)

  const hasTransferSignal =
    blob.includes('xfer') ||
    blob.includes('transfer') ||
    blob.includes('transferencia') ||
    blob.includes('handoff') ||
    blob.includes('service advisor') ||
    blob.includes('advisor') ||
    blob.includes('asesor')

  const hasValiditySignal =
    blob.includes('valid') ||
    blob.includes('invalid') ||
    blob.includes('invalido') ||
    blob.includes('inválido') ||
    blob.includes('clean') ||
    blob.includes('limpio') ||
    blob.includes('no limpio') ||
    blob.includes('estado')

  return hasTransferSignal && hasValiditySignal
}

function isDispositionQuestion(question) {
  const blob = makeTextBlob(question)

  return (
    normalizeTopic(question?.topic) === 'disposeit' ||
    blob.includes('disposition') ||
    blob.includes('disposicion') ||
    blob.includes('disposición') ||
    blob.includes('callbk') ||
    blob.includes('dnc') ||
    blob.includes('dair') ||
    blob.includes('spanis') ||
    blob.includes('spxfer') ||
    blob.includes('wrong number') ||
    blob.includes('wrng') ||
    blob.includes('not interested')
  )
}

const GENERATED_QUESTIONS = [
  ...buildGeneratedScriptQuestions(),
  ...buildGeneratedDispositionQuestions(),
]

const DIRECT_MODE_QUESTIONS = [
  ...objectionBattleQuestions,
  ...validInvalidQuestions,
  ...disposeItQuestions,
  ...eligibleQuestions,
  ...certificationQuestions,
]

const ALL_QUESTIONS = [
  ...quizQuestions,
  ...DIRECT_MODE_QUESTIONS,
  ...GENERATED_QUESTIONS,
]

function languageOk(question, lang) {
  const wantedLang = normalizeLang(lang)
  if (wantedLang === 'mixed') return true
  return String(question?.language || 'en') === wantedLang
}

function topicOk(question, topic) {
  const wantedTopic = normalizeTopic(topic)
  if (wantedTopic === 'all') return true
  return normalizeTopic(question?.topic) === wantedTopic
}

function usableChoiceQuestion(question) {
  return (
    getQuestionKind(question) !== 'short' &&
    Array.isArray(question?.options) &&
    question.options.length >= 2
  )
}

function modeFilePool(source, { lang }) {
  return source.filter(
    (question) =>
      languageOk(question, lang) &&
      usableChoiceQuestion(question)
  )
}

function difficultyOk(question, difficulty) {
  const wantedDifficulty = normalizeDifficulty(difficulty)
  if (wantedDifficulty === 'all') return true

  return normalizeDifficulty(question?.difficulty) === wantedDifficulty
}

function poolClassic({ topic, lang, questionStyle, difficulty = 'all' }) {
  const wantedStyle = normalizeQuestionStyle(questionStyle)
  const source = classicQuestions.length ? classicQuestions : quizQuestions

  return source.filter(
    (question) =>
      languageOk(question, lang) &&
      topicOk(question, topic) &&
      difficultyOk(question, difficulty) &&
      questionFitsStyle(question, wantedStyle)
  )
}

function poolScriptFill({ lang }) {
  const generated = ALL_QUESTIONS.filter(
    (question) =>
      languageOk(question, lang) &&
      question?.mode === 'script-fill' &&
      usableChoiceQuestion(question)
  )

  const backup = quizQuestions.filter(
    (question) =>
      languageOk(question, lang) &&
      normalizeTopic(question?.topic) === 'script' &&
      usableChoiceQuestion(question)
  )

  return generated.length ? generated : backup
}

function poolValidInvalid({ lang }) {
  const direct = modeFilePool(validInvalidQuestions, { lang })

  if (direct.length) return direct

  return ALL_QUESTIONS.filter(
    (question) =>
      languageOk(question, lang) &&
      isValidInvalidQuestion(question) &&
      usableChoiceQuestion(question)
  )
}

function poolObjectionBattle({ lang }) {
  const direct = modeFilePool(objectionBattleQuestions, { lang })

  if (direct.length) return direct

  return quizQuestions.filter(
    (question) =>
      languageOk(question, lang) &&
      normalizeTopic(question?.topic) === 'objections' &&
      usableChoiceQuestion(question)
  )
}

function poolDispositionTrainer({ lang }) {
  const direct = modeFilePool(disposeItQuestions, { lang })

  if (direct.length) return direct

  const generated = ALL_QUESTIONS.filter(
    (question) =>
      languageOk(question, lang) &&
      question?.mode === 'disposition-trainer' &&
      usableChoiceQuestion(question)
  )

  const existing = quizQuestions.filter(
    (question) =>
      languageOk(question, lang) &&
      isDispositionQuestion(question) &&
      usableChoiceQuestion(question)
  )

  return [...generated, ...existing]
}

function poolEligible({ lang }) {
  const direct = modeFilePool(eligibleQuestions, { lang })

  if (direct.length) return direct

  return quizQuestions.filter(
    (question) =>
      languageOk(question, lang) &&
      normalizeTopic(question?.topic) === 'product' &&
      usableChoiceQuestion(question)
  )
}

function poolCertification({ lang, questionStyle, difficulty = 'all' }) {
  const direct = modeFilePool(certificationQuestions, { lang })

  if (direct.length) return direct

  const buckets = [
    poolClassic({ topic: 'script', lang, questionStyle, difficulty }),
    poolObjectionBattle({ lang }),
    poolValidInvalid({ lang }),
    poolDispositionTrainer({ lang }),
    poolEligible({ lang }),
poolClassic({ topic: 'callflow', lang, questionStyle, difficulty }),
poolClassic({ topic: 'dosdonts', lang, questionStyle, difficulty }),
  ]

  return buckets.flatMap((bucket, index) =>
    deterministicShuffle(bucket, `certification-bucket-${index}`).slice(0, 4)
  )
}
export function getQuestionPool({
  game = 'classic',
  topic = 'all',
  lang = 'mixed',
  questionStyle = 'mc',
  difficulty = 'all',
} = {}) {
  const wantedGame = normalizeGame(game)

  if (wantedGame === 'script-fill') return poolScriptFill({ lang })
  if (wantedGame === 'valid-invalid') return poolValidInvalid({ lang })
  if (wantedGame === 'objection-battle') return poolObjectionBattle({ lang })
if (wantedGame === 'disposition-trainer') return poolDispositionTrainer({ lang })
if (wantedGame === 'eligible') return poolEligible({ lang })
if (wantedGame === 'certification') return poolCertification({ lang, questionStyle, difficulty })
return poolClassic({ topic, lang, questionStyle, difficulty })
}

export function expandPoolToCount(pool, count, seed) {
  if (!Array.isArray(pool) || pool.length === 0) return []

  const wantedCount = Number.isFinite(Number(count)) ? Number(count) : DEFAULT_COUNT

  if (pool.length >= wantedCount) return deterministicShuffle(pool, seed).slice(0, wantedCount)

  const expanded = []
  let round = 0

  while (expanded.length < wantedCount) {
    expanded.push(...deterministicShuffle(pool, `${seed}:repeat:${round}`))
    round += 1
    if (round > 50) break
  }

  return expanded.slice(0, wantedCount)
}

export function buildQuestionIds({
  game = 'classic',
  topic = 'all',
  lang = 'mixed',
  questionStyle = 'mc',
  difficulty = 'all',
  seed = 'pulse-go',
  count = DEFAULT_COUNT,
} = {}) {
  const pool = getQuestionPool({ game, topic, lang, questionStyle, difficulty })
  return expandPoolToCount(pool, count, seed).map((question) => question.id)
}

export function getQuestionById(id) {
  const wantedId = String(id)
  return ALL_QUESTIONS.find((question) => String(question.id) === wantedId) || null
}

export function buildDisplayQuestion(rawQuestion, seed) {
  if (!rawQuestion) return null

  const options = Array.isArray(rawQuestion.options) ? rawQuestion.options : []
  const mappedOptions = options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }))

  const shuffledOptions = deterministicShuffle(mappedOptions, seed)
  const correct = shuffledOptions.findIndex((option) => option.originalIndex === rawQuestion.correct)

  return {
    ...rawQuestion,
    options: shuffledOptions.map((option) => option.text),
    correctIndex: correct,
    correct,
  }
}

export function buildQuestionSet({
  game = 'classic',
  topic = 'all',
  lang = 'mixed',
  questionStyle = 'mc',
  difficulty = 'all',
  seed = `${Date.now()}`,
  count = DEFAULT_COUNT,
} = {}) {
  const questionIds = buildQuestionIds({
    game,
    topic,
    lang,
    questionStyle,
    difficulty,
    seed,
    count,
  })

  return questionIds
    .map((id, index) => {
      const rawQuestion = getQuestionById(id)
      return buildDisplayQuestion(rawQuestion, `${seed}:${id}:${index}`)
    })
    .filter(Boolean)
}

export function getQuestionPoolDebug({
  game = 'classic',
  topic = 'all',
  lang = 'mixed',
  questionStyle = 'mc',
  difficulty = 'all',
} = {}) {
  const pool = getQuestionPool({ game, topic, lang, questionStyle, difficulty })

  return {
    game: normalizeGame(game),
    topic: normalizeTopic(topic),
    lang: normalizeLang(lang),
    questionStyle: normalizeQuestionStyle(questionStyle),
    difficulty: normalizeDifficulty(difficulty),
    count: pool.length,
    ids: pool.map((question) => question.id),
    topics: [...new Set(pool.map((question) => normalizeTopic(question.topic)))],
    languages: [...new Set(pool.map((question) => String(question.language || 'en')))],
    letters: LTRS,
  }
}
