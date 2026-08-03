export const CLASSIC_QUESTION_COUNT = 10

export const STUDIO_QUESTION_TYPES = [
  {
    id: 'text',
    title: 'Text',
    description:
      'Classic A, B, C and D question.',
    icon: 'T',
  },
  {
    id: 'image',
    title: 'Image',
    description:
      'Show an image above the answers.',
    icon: '🖼️',
  },
  {
    id: 'audio',
    title: 'Audio',
    description:
      'Play an audio clip before answering.',
    icon: '🎧',
  },
  {
    id: 'true-false',
    title: 'True / False',
    description:
      'Two-option statement question.',
    icon: '✓',
  },
]

export function getTrueFalseOptions(language) {
  if (language === 'es') {
    return [
      'Verdadero',
      'Falso',
    ]
  }

  if (language === 'mixed') {
    return [
      'True / Verdadero',
      'False / Falso',
    ]
  }

  return [
    'True',
    'False',
  ]
}

export function createBlankStudioQuestion(
  position,
  language = 'en'
) {
  return {
    id: null,
    position,

    questionType:
      'text',

    prompt:
      '',

    mediaUrl:
      '',

    mediaPath:
      '',

    mediaFile:
      null,

    mediaPreviewUrl:
      '',

    removedMediaPath:
      '',

    options: [
      '',
      '',
      '',
      '',
    ],

    correctIndex:
      0,

    explanation:
      '',

    timerOverride:
      null,

    pointsOverride:
      null,
  }
}

export function normalizeStudioQuestion(
  row,
  language = 'en'
) {
  const questionType = [
    'text',
    'image',
    'audio',
    'true-false',
  ].includes(row?.question_type)
    ? row.question_type
    : row?.questionType || 'text'

  const expectedLength =
    questionType === 'true-false'
      ? 2
      : 4

  const rawOptions =
    Array.isArray(row?.options)
      ? row.options
      : []

  const fallbackOptions =
    questionType === 'true-false'
      ? getTrueFalseOptions(language)
      : [
          '',
          '',
          '',
          '',
        ]

  const options = Array.from(
    {
      length:
        expectedLength,
    },
    (_, index) =>
      String(
        rawOptions[index] ??
          fallbackOptions[index] ??
          ''
      )
  )

  const correctIndex = Number(
    row?.correct_index ??
      row?.correctIndex ??
      0
  )

  const mediaUrl = String(
    row?.media_url ??
      row?.mediaUrl ??
      ''
  )

  return {
    id:
      row?.id || null,

    position:
      Number(row?.position || 1),

    questionType,

    prompt:
      String(row?.prompt || ''),

    mediaUrl,

    mediaPath:
      String(
        row?.media_path ??
          row?.mediaPath ??
          ''
      ),

    mediaFile:
      null,

    mediaPreviewUrl:
      mediaUrl,

    removedMediaPath:
      '',

    options,

    correctIndex:
      correctIndex >= 0 &&
      correctIndex < expectedLength
        ? correctIndex
        : 0,

    explanation:
      String(
        row?.explanation || ''
      ),

    timerOverride:
      row?.timer_override ??
      row?.timerOverride ??
      null,

    pointsOverride:
      row?.points_override ??
      row?.pointsOverride ??
      null,
  }
}

export function createClassicQuestionSet(
  rows = [],
  language = 'en'
) {
  const byPosition = new Map(
    (
      Array.isArray(rows)
        ? rows
        : []
    ).map((row) => [
      Number(row?.position),

      normalizeStudioQuestion(
        row,
        language
      ),
    ])
  )

  return Array.from(
    {
      length:
        CLASSIC_QUESTION_COUNT,
    },
    (_, index) => {
      const position =
        index + 1

      return (
        byPosition.get(position) ||
        createBlankStudioQuestion(
          position,
          language
        )
      )
    }
  )
}

export function getStudioQuestionErrors(
  question
) {
  const errors = []

  if (
    !String(
      question?.prompt || ''
    ).trim()
  ) {
    errors.push(
      'Add the question text.'
    )
  }

  if (
    [
      'image',
      'audio',
    ].includes(
      question?.questionType
    ) &&
    !question?.mediaFile &&
    !String(
      question?.mediaUrl ||
        question?.mediaPreviewUrl ||
        ''
    ).trim()
  ) {
    errors.push(
      question.questionType === 'image'
        ? 'Upload an image.'
        : 'Upload an audio file.'
    )
  }

  const expectedLength =
    question?.questionType === 'true-false'
      ? 2
      : 4

  const options =
    Array.isArray(question?.options)
      ? question.options.slice(
          0,
          expectedLength
        )
      : []

  if (
    options.length !== expectedLength ||
    options.some(
      (option) =>
        !String(option || '').trim()
    )
  ) {
    errors.push(
      question?.questionType ===
        'true-false'
        ? 'Choose True or False labels.'
        : 'Complete all four answers.'
    )
  }

  const correctIndex = Number(
    question?.correctIndex
  )

  if (
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= expectedLength
  ) {
    errors.push(
      'Choose the correct answer.'
    )
  }

  return errors
}

export function isStudioQuestionComplete(
  question
) {
  return (
    getStudioQuestionErrors(question)
      .length === 0
  )
}

export function validateClassicQuestions(
  questions
) {
  const normalized =
    Array.isArray(questions)
      ? questions
      : []

  const errors = normalized.map(
    (question) => ({
      position:
        question.position,

      errors:
        getStudioQuestionErrors(
          question
        ),
    })
  )

  const invalid = errors.filter(
    (item) =>
      item.errors.length > 0
  )

  return {
    valid:
      normalized.length ===
        CLASSIC_QUESTION_COUNT &&
      invalid.length === 0,

    invalid,

    firstInvalidPosition:
      invalid[0]?.position || null,
  }
}