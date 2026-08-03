export const STUDIO_GAME_MODES = [
  {
    id: 'classic',
    title: 'Classic Quiz',
    description:
      'The original Pulse GO experience with exactly 10 questions.',
    image: '/emojis/classic.webp',
    badge: 'AVAILABLE',
    enabled: true,
    questionCount: 10,
    features: [
      '10 questions',
      'Text, image, audio and True / False',
      'Optional Lives Mode',
    ],
  },
  {
    id: 'valid-invalid',
    title: 'Valid or Invalid XFER',
    description:
      'Decide whether each transfer should count as valid or invalid.',
    image: '/emojis/correct.webp',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'objection-battle',
    title: 'Objection Battle',
    description:
      'Choose the strongest rebuttal before the timer runs out.',
    image: '/emojis/objection.webp',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'disposition-trainer',
    title: 'Dispose It',
    description:
      'Select the correct disposition for each call scenario.',
    image: '/emojis/disposeit.webp',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'eligible',
    title: 'Eligible or Not Eligible',
    description:
      'Decide whether the vehicle and customer can move forward.',
    image: '/emojis/vehiclee.png',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'certification',
    title: 'Certification Mode',
    description:
      'A controlled final assessment with stricter scoring rules.',
    image: '/emojis/certification.webp',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'hidden-word',
    title: 'Hidden Word',
    description:
      'Guess the hidden word while letters and hints are revealed.',
    icon: '🧩',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'type-answer',
    title: 'Type the Answer',
    description:
      'Write the correct answer instead of selecting an option.',
    icon: '⌨️',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'put-in-order',
    title: 'Put It in Order',
    description:
      'Arrange steps, events or call-flow actions correctly.',
    icon: '↕️',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'match-up',
    title: 'Match Up',
    description:
      'Connect situations, definitions and related concepts.',
    icon: '🔗',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'find-mistake',
    title: 'Find the Mistake',
    description:
      'Analyze a call, text, image or audio and identify the error.',
    icon: '🔍',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'scenario-challenge',
    title: 'Scenario Challenge',
    description:
      'Make decisions through a branching training situation.',
    icon: '🎭',
    badge: 'COMING SOON',
    enabled: false,
  },
  {
    id: 'rapid-fire',
    title: 'Rapid Fire',
    description:
      'Answer fast questions and build a scoring streak.',
    icon: '⚡',
    badge: 'COMING SOON',
    enabled: false,
  },
]

export function getStudioGameMode(gameModeId) {
  return (
    STUDIO_GAME_MODES.find(
      (gameMode) => gameMode.id === gameModeId
    ) || STUDIO_GAME_MODES[0]
  )
}
