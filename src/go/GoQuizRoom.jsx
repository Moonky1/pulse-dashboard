import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { quizQuestions } from './goContent'
import './GoQuizRoom.css'

const QUESTION_COUNT = 10
const POLL_MS = 1200
const TIMER_MS = 120
const Q_TIME = 30
const RESULT_SEC = 5

const AVATARS = [
  '🦊', '🐺', '🦁', '🐯', '🐻',
  '🦅', '🐬', '🦋', '🐲', '🦄',
  '🐸', '🐧', '🦩', '🐙', '🐼',
  '🦒', '🐨', '🐔', '🦉', '🦓',
]

const OPTS = [
  { c: '#ef4444', s: '▲' },
  { c: '#3b82f6', s: '◆' },
  { c: '#f59e0b', s: '●' },
  { c: '#22c55e', s: '■' },
]

const LTRS = ['A', 'B', 'C', 'D']

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function normalizeTopic(value) {
  const clean = String(value || 'all').toLowerCase()

  if (clean === 'all') return 'all'
  if (clean === 'script') return 'script'
  if (clean === 'objections') return 'objections'
  if (clean === 'product') return 'product'
  if (clean === 'product-knowledge') return 'product'
  if (clean === 'callflow') return 'callflow'
  if (clean === 'call-flow') return 'callflow'
  if (clean === 'dosdonts') return 'dosdonts'
  if (clean === 'dos-donts') return 'dosdonts'

  return 'all'
}

function normalizeLang(value) {
  const clean = String(value || 'mixed').toLowerCase()

  if (clean === 'en' || clean === 'english') return 'en'
  if (clean === 'es' || clean === 'spanish') return 'es'

  return 'mixed'
}

function hashSeed(value) {
  let hash = 2166136261

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return hash >>> 0
}

function seededRandom(seed) {
  let t = seed + 0x6d2b79f5

  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function deterministicShuffle(array, seedText) {
  const copy = [...array]
  const random = seededRandom(hashSeed(seedText))

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function getQ(id) {
  return quizQuestions.find((q) => q.id === id) || null
}

function buildQuestionIds(topic, lang, seed) {
  const wantedTopic = normalizeTopic(topic)
  const wantedLang = normalizeLang(lang)

  let pool = quizQuestions.filter((q) => {
    const topicOk = wantedTopic === 'all' || normalizeTopic(q.topic) === wantedTopic
    const langOk = wantedLang === 'mixed' || String(q.language || 'en') === wantedLang
    return topicOk && langOk
  })

  if (pool.length < QUESTION_COUNT && wantedLang !== 'mixed') {
    const sameTopicAnyLang = quizQuestions.filter((q) => {
      const topicOk = wantedTopic === 'all' || normalizeTopic(q.topic) === wantedTopic
      return topicOk && !pool.some((item) => item.id === q.id)
    })

    pool = [...pool, ...sameTopicAnyLang]
  }

  if (pool.length < QUESTION_COUNT) {
    const extra = quizQuestions.filter((q) => !pool.some((item) => item.id === q.id))
    pool = [...pool, ...extra]
  }

  return deterministicShuffle(pool, seed)
    .slice(0, QUESTION_COUNT)
    .map((q) => q.id)
}

function buildDisplayQuestion(rawQuestion, roomCode, currentIndex) {
  if (!rawQuestion) return null

  const mappedOptions = rawQuestion.options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }))

  const shuffledOptions = deterministicShuffle(
    mappedOptions,
    `${roomCode}:${rawQuestion.id}:${currentIndex}`
  )

  const correct = shuffledOptions.findIndex(
    (option) => option.originalIndex === rawQuestion.correct
  )

  return {
    ...rawQuestion,
    options: shuffledOptions.map((option) => option.text),
    correct,
  }
}

function calcTimeLeft(startedAt) {
  if (!startedAt) return Q_TIME

  const startedMs = new Date(startedAt).getTime()

  if (!Number.isFinite(startedMs)) return Q_TIME

  return Math.max(0, Q_TIME - (Date.now() - startedMs) / 1000)
}

function rankPlayers(players) {
  return [...players]
    .filter((p) => !p.is_kicked)
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0)
      return new Date(a.joined_at || 0).getTime() - new Date(b.joined_at || 0).getTime()
    })
}

function useSound() {
  const ctx = useRef(null)

  const getCtx = () => {
    if (!ctx.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      ctx.current = new AudioContext()
    }

    return ctx.current
  }

  const tone = (frequency, duration, type = 'sine', volume = 0.12, delay = 0) => {
    try {
      const audio = getCtx()
      if (!audio) return

      if (audio.state === 'suspended') audio.resume()

      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const startAt = audio.currentTime + delay

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startAt)

      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

      oscillator.connect(gain)
      gain.connect(audio.destination)

      oscillator.start(startAt)
      oscillator.stop(startAt + duration + 0.03)
    } catch {
      // Browser can block audio until user interaction.
    }
  }

  return {
    correct: () => {
      tone(620, 0.1)
      tone(920, 0.14, 'sine', 0.14, 0.1)
    },
    wrong: () => tone(180, 0.28, 'sawtooth', 0.08),
    tick: () => tone(500, 0.035, 'square', 0.025),
    start: () => {
      tone(420, 0.08)
      tone(620, 0.1, 'sine', 0.13, 0.13)
      tone(820, 0.14, 'sine', 0.14, 0.27)
    },
    join: () => {
      tone(520, 0.08)
      tone(780, 0.12, 'sine', 0.12, 0.08)
    },
    kick: () => tone(170, 0.24, 'sawtooth', 0.08),
    ding: () => {
      tone(760, 0.08)
      tone(980, 0.12, 'sine', 0.12, 0.08)
    },
    finish: () => {
      tone(420, 0.1)
      tone(560, 0.1, 'sine', 0.12, 0.12)
      tone(720, 0.18, 'sine', 0.13, 0.25)
    },
    epic: () => {
      tone(392, 0.1, 'sine', 0.12)
      tone(523, 0.12, 'sine', 0.13, 0.13)
      tone(659, 0.14, 'sine', 0.14, 0.27)
      tone(784, 0.24, 'sine', 0.15, 0.43)
      tone(1046, 0.34, 'triangle', 0.08, 0.58)
    },
  }
}

export default function GoQuizRoom() {
  const params = useParams()
  const [urlParams] = useSearchParams()
  const nav = useNavigate()
  const snd = useSound()

  const code = normalizeCode(params.code)
  const isHost = urlParams.get('host') === 'true'
  const topic = normalizeTopic(urlParams.get('topic') || 'all')
  const lang = normalizeLang(urlParams.get('lang') || 'mixed')

  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState('')

  const [joined, setJoined] = useState(isHost)
  const [playerId, setPlayerId] = useState('')
  const [myName, setMyName] = useState('')
  const [myAvatar, setMyAvatar] = useState('🦊')

  const [joinName, setJoinName] = useState('')
  const [joinAvatar, setJoinAvatar] = useState('🦊')
  const [joinError, setJoinError] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)

  const [picked, setPicked] = useState(null)
  const [timeLeft, setTimeLeft] = useState(Q_TIME)
  const [resultCount, setResultCount] = useState(RESULT_SEC)
  const [busy, setBusy] = useState(false)
  const [kickBusy, setKickBusy] = useState('')
  const [cancelBusy, setCancelBusy] = useState(false)

  const actionLockRef = useRef(false)
  const timerRef = useRef(null)
  const resultTimerRef = useRef(null)
  const lastTickRef = useRef(null)
  const previousStateRef = useRef('')
  const previousPlayerCountRef = useRef(0)
  const finishSoundPlayedRef = useRef(false)

  const activePlayers = useMemo(() => players.filter((p) => !p.is_kicked), [players])
  const rankedPlayers = useMemo(() => rankPlayers(players), [players])
  const totalPlayers = activePlayers.length
  const answeredPlayers = activePlayers.filter((p) => p.answered).length

  const currentQuestionId = room?.question_ids?.[room?.current_q || 0]
  const rawQuestion = currentQuestionId ? getQ(currentQuestionId) : null
  const currentQ = buildDisplayQuestion(rawQuestion, code, room?.current_q || 0)

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === playerId) || null,
    [players, playerId]
  )

  const fetchPlayers = useCallback(async () => {
    if (!code) return

    const { data, error } = await supabase
      .from('pulse_go_players')
      .select('*')
      .eq('room_code', code)
      .order('joined_at', { ascending: true })

    if (!error) setPlayers(data || [])
  }, [code])

  const createHostRoom = useCallback(async () => {
    const questionIds = buildQuestionIds(topic, lang, `${code}:${Date.now()}`)

    const { data, error } = await supabase
      .from('pulse_go_rooms')
      .insert({
        code,
        state: 'lobby',
        topic,
        lang,
        question_ids: questionIds,
        current_q: 0,
        question_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      setFatalError(error.message || 'Could not create room.')
      return null
    }

    setRoom(data)
    return data
  }, [code, topic, lang])

  const fetchRoom = useCallback(async () => {
    if (!code) return null

    const { data, error } = await supabase
      .from('pulse_go_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error) {
      setFatalError(error.message || 'Could not load room.')
      return null
    }

    if (!data && isHost) {
      return createHostRoom()
    }

    if (!data && !isHost) {
      setRoom(null)
      return null
    }

    setRoom(data)
    return data
  }, [code, isHost, createHostRoom])

  const refreshAll = useCallback(async () => {
    const loadedRoom = await fetchRoom()
    if (loadedRoom) await fetchPlayers()
    setLoading(false)
  }, [fetchRoom, fetchPlayers])

  useEffect(() => {
    refreshAll()

    const fallback = setInterval(refreshAll, POLL_MS)

    const channel = supabase
      .channel(`pulse-go-room-${code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pulse_go_rooms',
          filter: `code=eq.${code}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setRoom(null)
            nav('/go')
            return
          }

          if (payload.new) setRoom(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pulse_go_players',
          filter: `room_code=eq.${code}`,
        },
        () => {
          fetchPlayers()
        }
      )
      .subscribe()

    return () => {
      clearInterval(fallback)
      supabase.removeChannel(channel)
    }
  }, [code, nav, refreshAll, fetchPlayers])

  useEffect(() => {
    const saved = localStorage.getItem(`pulse_go_player_${code}`)
    if (!saved || isHost) return

    try {
      const parsed = JSON.parse(saved)
      if (!parsed?.id) return

      setPlayerId(parsed.id)
      setMyName(parsed.name || '')
      setMyAvatar(parsed.avatar || '🦊')
      setJoined(true)
    } catch {
      localStorage.removeItem(`pulse_go_player_${code}`)
    }
  }, [code, isHost])

  useEffect(() => {
    if (!currentPlayer || isHost) return

    if (currentPlayer.is_kicked) {
      snd.kick()
      localStorage.removeItem(`pulse_go_player_${code}`)
      alert('You were removed from this room by the host.')
      nav('/go')
    }
  }, [currentPlayer, isHost, snd, code, nav])

  useEffect(() => {
    const count = activePlayers.length

    if (isHost && room?.state === 'lobby' && count > previousPlayerCountRef.current) {
      snd.join()
    }

    previousPlayerCountRef.current = count
  }, [activePlayers.length, isHost, room?.state, snd])

  useEffect(() => {
    if (!room) return

    if (room.state !== previousStateRef.current) {
      if (room.state === 'question') {
        snd.start()
        setPicked(null)
        setResultCount(RESULT_SEC)
        actionLockRef.current = false
        lastTickRef.current = null
      }

      if (room.state === 'showAnswer') {
        snd.ding()
      }

      if (room.state === 'finished' && !finishSoundPlayedRef.current) {
        finishSoundPlayedRef.current = true

        const myRank = rankedPlayers.findIndex((p) => p.id === playerId) + 1
        const topResult = isHost || myRank === 1 || myRank === 2 || myRank === 3

        if (topResult) snd.epic()
        else snd.finish()
      }

      previousStateRef.current = room.state
    }
  }, [room?.state, rankedPlayers, playerId, isHost, snd, room])

  const showAnswer = useCallback(async () => {
    if (!isHost || !room || actionLockRef.current || busy) return

    actionLockRef.current = true
    setBusy(true)

    const { error } = await supabase
      .from('pulse_go_rooms')
      .update({
        state: 'showAnswer',
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)

    if (error) {
      actionLockRef.current = false
      setFatalError(error.message || 'Could not show answer.')
    }

    setBusy(false)
  }, [isHost, room, busy, code])

  const nextQuestion = useCallback(async () => {
    if (!isHost || !room || busy) return

    setBusy(true)
    actionLockRef.current = false

    const nextIndex = (room.current_q || 0) + 1
    const totalQuestions = room.question_ids?.length || QUESTION_COUNT

    if (nextIndex >= totalQuestions) {
      const { error } = await supabase
        .from('pulse_go_rooms')
        .update({
          state: 'finished',
          updated_at: new Date().toISOString(),
        })
        .eq('code', code)

      if (error) setFatalError(error.message || 'Could not finish game.')

      setBusy(false)
      return
    }

    await supabase
      .from('pulse_go_players')
      .update({
        answered: false,
        last_answer: null,
        last_time_left: null,
        updated_at: new Date().toISOString(),
      })
      .eq('room_code', code)
      .eq('is_kicked', false)

    const { error } = await supabase
      .from('pulse_go_rooms')
      .update({
        state: 'question',
        current_q: nextIndex,
        question_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)

    if (error) setFatalError(error.message || 'Could not go to next question.')

    setBusy(false)
  }, [isHost, room, busy, code])

  useEffect(() => {
    clearInterval(timerRef.current)

    if (!room || room.state !== 'question') return

    timerRef.current = setInterval(() => {
      const left = calcTimeLeft(room.question_started_at)
      const display = Math.ceil(left)

      setTimeLeft(left)

      if (display <= 5 && display > 0 && display !== lastTickRef.current) {
        lastTickRef.current = display
        snd.tick()
      }

      if (isHost && left <= 0 && !actionLockRef.current) {
        showAnswer()
      }
    }, TIMER_MS)

    return () => clearInterval(timerRef.current)
  }, [room?.state, room?.question_started_at, isHost, showAnswer, snd, room])

  useEffect(() => {
    if (!isHost || !room || room.state !== 'question') return
    if (actionLockRef.current) return
    if (totalPlayers <= 0) return

    if (answeredPlayers >= totalPlayers) {
      const timeout = setTimeout(() => {
        showAnswer()
      }, 350)

      return () => clearTimeout(timeout)
    }

    return undefined
  }, [isHost, room, answeredPlayers, totalPlayers, showAnswer])

  useEffect(() => {
    clearInterval(resultTimerRef.current)

    if (!room || room.state !== 'showAnswer') return

    setResultCount(RESULT_SEC)

    resultTimerRef.current = setInterval(() => {
      setResultCount((current) => {
        if (current <= 1) {
          clearInterval(resultTimerRef.current)
          if (isHost) nextQuestion()
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => clearInterval(resultTimerRef.current)
  }, [room?.state, room?.current_q, isHost, nextQuestion, room])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearInterval(resultTimerRef.current)
    }
  }, [])

  const handleJoin = async () => {
    const cleanName = joinName.trim().slice(0, 20)

    if (!cleanName || joinBusy) return

    setJoinBusy(true)
    setJoinError('')

    const loadedRoom = await fetchRoom()

    if (!loadedRoom) {
      setJoinError('Room not found.')
      setJoinBusy(false)
      return
    }

    if (loadedRoom.state === 'cancelled') {
      setJoinError('This game was closed by the host.')
      setJoinBusy(false)
      return
    }

    if (loadedRoom.state !== 'lobby') {
      setJoinError('Game already started.')
      setJoinBusy(false)
      return
    }

    const { data, error } = await supabase
      .from('pulse_go_players')
      .insert({
        room_code: code,
        name: cleanName,
        avatar: joinAvatar,
        score: 0,
        answered: false,
        last_answer: null,
        last_time_left: null,
        is_kicked: false,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      setJoinError(
        error.message?.toLowerCase().includes('duplicate')
          ? 'Name taken. Try another name.'
          : error.message || 'Could not join room.'
      )
      setJoinBusy(false)
      return
    }

    localStorage.setItem(
      `pulse_go_player_${code}`,
      JSON.stringify({
        id: data.id,
        name: data.name,
        avatar: data.avatar,
      })
    )

    setPlayerId(data.id)
    setMyName(data.name)
    setMyAvatar(data.avatar)
    setJoined(true)
    snd.join()
    await fetchPlayers()

    setJoinBusy(false)
  }

  const hostStart = async () => {
    if (!isHost || busy || totalPlayers <= 0) return

    setBusy(true)
    finishSoundPlayedRef.current = false
    actionLockRef.current = false

    let questionIds = room?.question_ids || []

    if (!Array.isArray(questionIds) || questionIds.length < QUESTION_COUNT) {
      questionIds = buildQuestionIds(topic, lang, `${code}:${Date.now()}`)
    }

    await supabase.from('pulse_go_answers').delete().eq('room_code', code)

    await supabase
      .from('pulse_go_players')
      .update({
        score: 0,
        answered: false,
        last_answer: null,
        last_time_left: null,
        updated_at: new Date().toISOString(),
      })
      .eq('room_code', code)
      .eq('is_kicked', false)

    const { error } = await supabase
      .from('pulse_go_rooms')
      .update({
        state: 'question',
        question_ids: questionIds,
        current_q: 0,
        question_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)

    if (error) setFatalError(error.message || 'Could not start game.')

    setBusy(false)
  }

  const handleKickPlayer = async (targetPlayer) => {
    if (!isHost || !targetPlayer?.id || kickBusy) return

    const ok = window.confirm(`Remove ${targetPlayer.name} from this room?`)
    if (!ok) return

    setKickBusy(targetPlayer.id)

    const { error } = await supabase
      .from('pulse_go_players')
      .update({
        is_kicked: true,
        answered: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetPlayer.id)

    if (error) {
      alert(error.message || 'Could not remove player.')
    } else {
      snd.kick()
      await fetchPlayers()
    }

    setKickBusy('')
  }

  const cancelGame = async () => {
    if (!isHost || !room || cancelBusy) return

    const ok = window.confirm('Cancel this game for everyone? Players will be sent back to Pulse GO.')
    if (!ok) return

    setCancelBusy(true)

    const { data, error } = await supabase
      .from('pulse_go_rooms')
      .update({
        state: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)
      .select('*')
      .single()

    if (error) {
      alert(error.message || 'Could not cancel the game.')
    } else {
      setRoom(data)
      snd.kick()
    }

    setCancelBusy(false)
  }

  const handleAnswer = async (answerIndex) => {
    if (!room || room.state !== 'question') return
    if (!currentPlayer || currentPlayer.is_kicked) return
    if (picked !== null || currentPlayer.answered) return
    if (!currentQ) return

    setPicked(answerIndex)

    const left = Math.max(0, Math.ceil(calcTimeLeft(room.question_started_at)))
    const correct = answerIndex === currentQ.correct
    const points = correct ? 1000 + left * 50 : 0

    const { error: answerError } = await supabase
      .from('pulse_go_answers')
      .upsert(
        {
          room_code: code,
          player_id: currentPlayer.id,
          question_index: room.current_q || 0,
          question_id: currentQ.id,
          answer: answerIndex,
          correct,
          time_left: left,
          points,
        },
        {
          onConflict: 'room_code,player_id,question_index',
          ignoreDuplicates: true,
        }
      )

    if (answerError) {
      console.error(answerError)
    }

    const newScore = (currentPlayer.score || 0) + points

    const { error: playerError } = await supabase
      .from('pulse_go_players')
      .update({
        score: newScore,
        answered: true,
        last_answer: answerIndex,
        last_time_left: left,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentPlayer.id)

    if (playerError) {
      console.error(playerError)
    }

    if (correct) snd.correct()
    else snd.wrong()

    await fetchPlayers()
  }

  const resetRoomToLobby = async () => {
    if (!isHost || !room) return

    setBusy(true)

    const questionIds = buildQuestionIds(topic, lang, `${code}:${Date.now()}`)

    await supabase.from('pulse_go_answers').delete().eq('room_code', code)

    await supabase
      .from('pulse_go_players')
      .delete()
      .eq('room_code', code)

    const { error } = await supabase
      .from('pulse_go_rooms')
      .update({
        state: 'lobby',
        question_ids: questionIds,
        current_q: 0,
        question_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)

    if (error) setFatalError(error.message || 'Could not reset room.')

    setBusy(false)
  }

  const timeDisplay = Math.ceil(timeLeft)
  const timeColor = timeDisplay <= 5 ? '#ef4444' : timeDisplay <= 10 ? '#f59e0b' : '#b9d6ff'
  const timePct = Math.max(0, Math.min(100, (timeLeft / Q_TIME) * 100))
  const state = room?.state || 'lobby'
  const isCorrect = !isHost && picked === currentQ?.correct
  const showCancelButton = isHost && room && !['cancelled', 'finished'].includes(state)

  const cancelButton = showCancelButton ? (
    <button
      className="grm-cancel-game"
      onPointerDown={cancelGame}
      disabled={cancelBusy}
    >
      {cancelBusy ? 'Cancelling...' : 'Cancel Game'}
    </button>
  ) : null

  const goHomeAfterClosed = () => {
    localStorage.removeItem(`pulse_go_player_${code}`)
    nav('/go')
  }

  if (loading) {
    return (
      <div className="grm grm-center">
        <div className="grm-spin">⏳ Loading room <b>{code}</b>...</div>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div className="grm grm-center">
        <div className="grm-join-box">
          <h2>Room error</h2>
          <p className="grm-err">{fatalError}</p>
          <button className="grm-btn-join" onPointerDown={() => nav('/go')}>
            Back Home
          </button>
        </div>
      </div>
    )
  }

  if (!room && !isHost) {
    return (
      <div className="grm grm-center">
        <div className="grm-join-box">
          <div className="grm-code-display">
            <small>Room Code</small>
            <strong>{code}</strong>
          </div>
          <p className="grm-err">Room not found. Ask the host to create it again.</p>
          <button className="grm-btn-join" onPointerDown={() => nav('/go')}>
            Back Home
          </button>
        </div>
      </div>
    )
  }

  if (state === 'cancelled') {
    return (
      <div className="grm grm-cancelled">
        <div className="grm-closed-card">
          <div className="grm-closed-icon">🚫</div>
          <h1>Game Closed</h1>
          <p>The host closed this Pulse GO game. Start again from the home screen.</p>

          <button onPointerDown={goHomeAfterClosed}>
            Back to Pulse GO
          </button>
        </div>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="grm grm-join">
        <div className="grm-join-box">
          <div className="grm-code-display">
            <small>Room Code</small>
            <strong>{code}</strong>
          </div>

          <p className="grm-join-hint">Pick your avatar and enter your name</p>

          <div className="grm-av-grid">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                className={`grm-av ${joinAvatar === avatar ? 'on' : ''}`}
                onPointerDown={() => setJoinAvatar(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>

          <input
            className="grm-input"
            type="text"
            placeholder="Your name"
            value={joinName}
            onChange={(event) => setJoinName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
            maxLength={20}
            autoFocus
          />

          {joinError && <p className="grm-err">{joinError}</p>}

          <button
            className="grm-btn-join"
            onPointerDown={handleJoin}
            disabled={!joinName.trim() || joinBusy}
          >
            {joinBusy ? 'Joining...' : `${joinAvatar} Join Room →`}
          </button>
        </div>
      </div>
    )
  }

  if (state === 'lobby') {
    return (
      <div className="grm grm-lobby">
        {cancelButton}

        <div className="grm-lobby-bar">
          Join at <b>pulse-kk.com/go</b> &nbsp;·&nbsp; Code:{' '}
          <span className="grm-lobby-code">{code}</span>
        </div>

        <div className="grm-lobby-body">
          <h1 className="grm-lobby-title">
            {isHost ? '⏳ Waiting for players...' : `${myAvatar} You're in!`}
          </h1>

          <div className="grm-lobby-grid">
            {activePlayers.length === 0 && (
              <p className="grm-muted">No players yet — share the code!</p>
            )}

            {activePlayers.map((player) => (
              <div key={player.id} className="grm-lobby-chip">
                <span>{player.avatar}</span>
                <span>{player.name}</span>

                {isHost && (
                  <button
                    className="grm-kick-btn"
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      handleKickPlayer(player)
                    }}
                    disabled={kickBusy === player.id}
                    title={`Remove ${player.name}`}
                  >
                    {kickBusy === player.id ? '...' : '×'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="grm-lobby-count">
            {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} ready
          </p>

          {isHost && (
            <button
              className="grm-btn-start"
              onPointerDown={hostStart}
              disabled={totalPlayers === 0 || busy}
            >
              🚀 {busy ? 'Starting...' : 'Start Game'}
            </button>
          )}

          {!isHost && (
            <p className="grm-muted" style={{ marginTop: 16 }}>
              Waiting for host to start...
            </p>
          )}
        </div>
      </div>
    )
  }

  if (state === 'question') {
    return (
      <div className="grm grm-q">
        {cancelButton}

        <div className="grm-tbar">
          <div className="grm-tfill" style={{ width: `${timePct}%`, background: timeColor }} />
        </div>

        <div className="grm-qmeta">
          <span className="grm-qnum">
            {(room.current_q || 0) + 1}/{room.question_ids?.length || QUESTION_COUNT}
          </span>
          <span className="grm-qtimer" style={{ color: timeColor }}>
            {timeDisplay}s
          </span>
          <span
            className="grm-qans"
            style={{
              color: answeredPlayers === totalPlayers && totalPlayers > 0 ? '#22c55e' : '#b9d6ff',
            }}
          >
            {answeredPlayers}/{totalPlayers} ✓
          </span>
        </div>

        <div className="grm-qtext">{currentQ?.question || 'Loading question...'}</div>

        {!isHost && (
          <div className="grm-opts">
            {currentQ?.options.map((option, index) => (
              <button
                key={index}
                className={`grm-opt ${picked === index ? 'sel' : ''} ${
                  picked !== null && picked !== index ? 'dim' : ''
                }`}
                style={{ '--c': OPTS[index]?.c || '#b9d6ff' }}
                onPointerDown={() => handleAnswer(index)}
                disabled={picked !== null || currentPlayer?.answered}
              >
                <span className="grm-os">{OPTS[index]?.s || '◆'}</span>
                <span className="grm-ol">{LTRS[index]}</span>
                <span className="grm-ot">{option}</span>
              </button>
            ))}

            {(picked !== null || currentPlayer?.answered) && (
              <div className="grm-waiting">
                ⏳ Answered! Waiting for others... ({answeredPlayers}/{totalPlayers})
              </div>
            )}
          </div>
        )}

        {isHost && (
          <div className="grm-host-q">
            <div className="grm-auto-badge">
              ⚡ Auto-advances when all players answer or time runs out
            </div>

            <div className="grm-bars">
              {currentQ?.options.map((option, index) => {
                const count = activePlayers.filter(
                  (player) => player.answered && player.last_answer === index
                ).length

                return (
                  <div key={index} className="grm-bar-row">
                    <span className="grm-bar-lbl" style={{ color: OPTS[index]?.c || '#b9d6ff' }}>
                      {OPTS[index]?.s || '◆'} {LTRS[index]}
                    </span>

                    <div className="grm-bar-bg">
                      <div
                        className="grm-bar-fill"
                        style={{
                          width: `${answeredPlayers > 0 ? (count / answeredPlayers) * 100 : 0}%`,
                          background: OPTS[index]?.c || '#b9d6ff',
                        }}
                      />
                    </div>

                    <span className="grm-bar-n">{count}</span>
                  </div>
                )
              })}
            </div>

            <p className="grm-host-status">
              {answeredPlayers === totalPlayers && totalPlayers > 0
                ? '✅ All answered!'
                : `${Math.max(0, totalPlayers - answeredPlayers)} still thinking...`}
            </p>

            <button
              className="grm-btn-skip"
              onPointerDown={showAnswer}
              disabled={busy}
            >
              {busy ? 'Loading...' : 'Skip →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (state === 'showAnswer') {
    return (
      <div className="grm grm-answer">
        {cancelButton}

        {!isHost && (
          <div className={`grm-result-banner ${isCorrect ? 'ok' : 'no'}`}>
            {isCorrect ? '✅ Correct!' : picked === null ? "⏱️ Time's up!" : '❌ Wrong'}
          </div>
        )}

        {isHost && <h2 className="grm-answer-h">📊 Results</h2>}

        <div className="grm-ring-wrap">
          <svg viewBox="0 0 48 48" className="grm-ring-svg">
            <circle cx="24" cy="24" r="20" className="grm-ring-bg" />
            <circle
              cx="24"
              cy="24"
              r="20"
              className="grm-ring-fg"
              strokeDasharray={`${(resultCount / RESULT_SEC) * 125.7} 125.7`}
            />
          </svg>

          <span className="grm-ring-n">{resultCount}</span>
        </div>

        <p className="grm-ring-label">Next in...</p>

        <div className="grm-answer-opts">
          {currentQ?.options.map((option, index) => (
            <div
              key={index}
              className={`grm-aopt ${index === currentQ.correct ? 'correct' : ''} ${
                !isHost && picked === index && index !== currentQ.correct ? 'wrong' : ''
              }`}
              style={{ '--c': OPTS[index]?.c || '#b9d6ff' }}
            >
              <span className="grm-aopt-s">{OPTS[index]?.s || '◆'}</span>
              <span className="grm-ol">{LTRS[index]}</span>
              <span className="grm-aopt-t">{option}</span>
              {index === currentQ.correct && <span className="grm-aopt-check">✓</span>}
            </div>
          ))}
        </div>

        {currentQ?.explanation && <div className="grm-exp">💡 {currentQ.explanation}</div>}

        <div className="grm-mini-lb">
          <div className="grm-mini-lb-hd">🏆 Leaderboard</div>

          {rankedPlayers.slice(0, 6).map((player, index) => (
            <div key={player.id} className={`grm-mini-row ${player.id === playerId ? 'me' : ''}`}>
              <span className="grm-mini-r">{index + 1}</span>
              <span className="grm-mini-a">{player.avatar}</span>
              <span className="grm-mini-n">{player.name}</span>
              <span className="grm-mini-s">{(player.score || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            className="grm-btn-skip"
            onPointerDown={() => {
              clearInterval(resultTimerRef.current)
              nextQuestion()
            }}
            disabled={busy}
          >
            {busy
              ? 'Loading...'
              : (room.current_q || 0) + 1 >= (room.question_ids?.length || QUESTION_COUNT)
              ? '🏁 Finish now'
              : '▶ Next now'}
          </button>
        )}
      </div>
    )
  }

  if (state === 'finished') {
    const top = rankedPlayers.slice(0, 3)

    return (
      <div className="grm grm-finished">
        <h1 className="grm-finished-h">🏆 Final Results</h1>
        <p className="grm-muted">
          {code} · {totalPlayers} player{totalPlayers !== 1 ? 's' : ''}
        </p>

        <div className="grm-podium">
          {[top[1], top[0], top[2]].map((player, index) =>
            player ? (
              <div key={player.id} className={`grm-pod ${['second', 'first', 'third'][index]}`}>
                <span style={{ fontSize: index === 1 ? 48 : 32 }}>{player.avatar}</span>
                <span className="grm-pod-name">{player.name}</span>
                <div className="grm-pod-block">{['🥈', '🥇', '🥉'][index]}</div>
                <span className="grm-pod-score">{(player.score || 0).toLocaleString()}</span>
              </div>
            ) : (
              <div key={index} />
            )
          )}
        </div>

        {rankedPlayers.length > 3 && (
          <div className="grm-full-lb">
            {rankedPlayers.slice(3).map((player, index) => (
              <div key={player.id} className={`grm-lb-row ${player.id === playerId ? 'me' : ''}`}>
                <span className="grm-lb-r">{index + 4}</span>
                <span className="grm-lb-a">{player.avatar}</span>
                <span className="grm-lb-n">{player.name}</span>
                <span className="grm-lb-s">{(player.score || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {!isHost && currentPlayer && (
          <p className="grm-my-result">
            Your score: <strong>{(currentPlayer.score || 0).toLocaleString()} pts</strong>
            &nbsp;·&nbsp; Rank #{rankedPlayers.findIndex((p) => p.id === currentPlayer.id) + 1} of{' '}
            {totalPlayers}
          </p>
        )}

        <div className="grm-finished-btns">
          {isHost && (
            <button className="grm-btn-primary" onPointerDown={resetRoomToLobby} disabled={busy}>
              🔄 New Game
            </button>
          )}

          <button className="grm-btn-outline" onPointerDown={() => nav('/go')}>
            Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grm grm-center">
      <p className="grm-muted">Syncing... ({state})</p>
    </div>
  )
}