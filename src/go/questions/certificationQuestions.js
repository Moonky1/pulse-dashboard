export const certificationQuestions = [
  {
    "id": "certification-en-001",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer confirms the vehicle runs well, but when the agent says, “I’ll connect you now,” the customer replies, “Wait, connect me to who?” What is the best action?",
    "options": [
      "Dial anyway because the customer already confirmed the vehicle.",
      "Clarify that it is a Service Advisor who will review the options, then ask for permission to connect.",
      "Mark XFER because the customer did not say no.",
      "Tell the customer it will only take a few seconds."
    ],
    "correct": 1,
    "explanation": "The customer must understand the handoff before consent can be clean."
  },
  {
    "id": "certification-en-002",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks, “Is this from my bank?” The agent says, “Yes, your lender asked us to call,” then gets consent and completes the transfer. What should QA flag?",
    "options": [
      "Nothing, because the transfer was completed.",
      "The agent waited too long before dialing.",
      "The agent used an unsupported bank/lender claim.",
      "The customer should have been marked DAIR."
    ],
    "correct": 2,
    "explanation": "A completed handoff does not fix risky source wording."
  },
  {
    "id": "certification-en-003",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says they are busy. The agent says, “No worries, this is guaranteed to take less than a minute,” and the customer agrees to transfer. Valid or invalid?",
    "options": [
      "Valid, because the customer agreed.",
      "Invalid/risky, because the agent used an unsupported time promise to get consent.",
      "Valid only if the Service Advisor speaks first.",
      "Valid because busy objections can be ignored."
    ],
    "correct": 1,
    "explanation": "Consent should not be obtained through promises the agent cannot control."
  },
  {
    "id": "certification-en-004",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks for Spanish before the transfer. The agent still connects them to an English Service Advisor and marks it as English XFER. What is the best evaluation?",
    "options": [
      "Valid XFER because the customer was connected.",
      "Valid XFER if the opener spoke English.",
      "Invalid English XFER; the customer requested Spanish before the handoff.",
      "DAIR because Spanish was requested."
    ],
    "correct": 2,
    "explanation": "Language preference must be respected before transfer."
  },
  {
    "id": "certification-en-005",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer speaks English with the Service Advisor for about 20 seconds after a proper handoff, then asks if Spanish is available. How should QA view the English transfer?",
    "options": [
      "Likely valid, because meaningful English communication happened first.",
      "Always invalid because Spanish was mentioned.",
      "SPANIS only, no matter what happened before.",
      "DAIR because the language changed."
    ],
    "correct": 0,
    "explanation": "A later Spanish request does not automatically erase a completed English handoff."
  },
  {
    "id": "certification-en-006",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer owns a 2020 Tesla with 38,000 miles, runs perfectly, and agrees to hear options. What should the agent know?",
    "options": [
      "It qualifies because the mileage is low.",
      "It qualifies because the customer agreed.",
      "It is not clean eligible because it is electric.",
      "The Service Advisor can ignore the rule."
    ],
    "correct": 2,
    "explanation": "Electric vehicles are excluded even with low mileage."
  },
  {
    "id": "certification-en-007",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer has a 2016 gas SUV with 171,000 miles, but the check engine light came on today and the vehicle shakes when accelerating. What is the safest path?",
    "options": [
      "Treat it as clean eligible because it is under the mileage limit.",
      "Clarify the current issue and avoid pushing it as clean eligible.",
      "Promise the Service Advisor will cover the issue.",
      "Mark XFER because the year qualifies."
    ],
    "correct": 1,
    "explanation": "Current mechanical issues must be clarified before transfer."
  },
  {
    "id": "certification-en-008",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "A customer says, “I sold that car last year, but I do have a 2019 Honda Accord with 92,000 miles that runs fine.” What should the agent do?",
    "options": [
      "End the call as wrong vehicle immediately.",
      "Transfer based on the old vehicle.",
      "Verify the current vehicle and continue only if it meets the rules.",
      "Mark DNC because the original file was wrong."
    ],
    "correct": 2,
    "explanation": "Wrong old data can become a verification path if the current vehicle qualifies."
  },
  {
    "id": "certification-en-009",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says, “I’m interested, but I cannot talk right now. Call me after work.” The agent transfers anyway because the customer showed interest. What is the issue?",
    "options": [
      "Interest is not consent for an immediate transfer.",
      "The customer should have been marked A.",
      "The vehicle automatically became ineligible.",
      "The agent should have promised a discount."
    ],
    "correct": 0,
    "explanation": "A callback request should not be forced into a transfer."
  },
  {
    "id": "certification-en-010",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The Service Advisor joins the 3-way call but stays silent. The customer says, “Hello?” What should the agent do?",
    "options": [
      "Leave immediately because the advisor joined.",
      "Prompt the advisor and control the handoff before leaving.",
      "Mark XFER without speaking.",
      "Hang up on the customer."
    ],
    "correct": 1,
    "explanation": "The agent must prevent dead air and confirm an active handoff."
  },
  {
    "id": "certification-en-011",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer hangs up while the agent is dialing the Service Advisor, before the Service Advisor speaks to the customer. What should the agent avoid?",
    "options": [
      "Using Hung Up Both Lines / Call Back handling.",
      "Protecting the Service Advisor from dead air.",
      "Leaving the 3-way call and counting it as XFER.",
      "Documenting the outcome correctly."
    ],
    "correct": 2,
    "explanation": "If the customer is gone before the handoff, it is not a clean XFER."
  },
  {
    "id": "certification-en-012",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "A customer hears the opening, says “No thanks,” and disconnects. The agent marks DAIR. What is wrong?",
    "options": [
      "DAIR is for voicemail only.",
      "The customer made live contact and rejected the call, so NI fits better.",
      "It should always be XFER.",
      "It should be SPXFER."
    ],
    "correct": 1,
    "explanation": "DAIR is not for a live rejection after the customer hears the call purpose."
  },
  {
    "id": "certification-en-013",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says, “Stop calling me or I’ll report this number.” What is the correct disposition path?",
    "options": [
      "NI",
      "CALLBK",
      "DNC",
      "A"
    ],
    "correct": 2,
    "explanation": "Stop-calling requests and threats should be handled as DNC."
  },
  {
    "id": "certification-en-014",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The call reaches an automated voicemail greeting saying the person is unavailable. What disposition fits?",
    "options": [
      "A - Answering Machine",
      "DAIR - Dead Air",
      "NI - Not Interested",
      "WN - Wrong Number"
    ],
    "correct": 0,
    "explanation": "Voicemail or automated answering systems should be marked as A."
  },
  {
    "id": "certification-en-015",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The person who answers says, “Wrong number. I do not know that person or that vehicle.” What disposition fits best?",
    "options": [
      "WRNGVE",
      "WN",
      "NI",
      "CALLBK"
    ],
    "correct": 1,
    "explanation": "If the person or number is wrong, WN fits better than wrong vehicle."
  },
  {
    "id": "certification-en-016",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The correct customer answers but says, “That vehicle is not mine. I drive a different car now.” What should the agent do first?",
    "options": [
      "Mark WN immediately.",
      "Verify whether the current vehicle may qualify.",
      "Transfer based on the old vehicle.",
      "Say the file cannot be wrong."
    ],
    "correct": 1,
    "explanation": "If the person is correct but the vehicle changed, verify the current vehicle."
  },
  {
    "id": "certification-en-017",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks, “Will this lower my monthly payment?” What is the safest answer?",
    "options": [
      "“Yes, that is the goal.”",
      "“Your payment will definitely be lower.”",
      "“The Service Advisor can review available options, but I cannot promise a lower payment.”",
      "“Your lender already approved it.”"
    ],
    "correct": 2,
    "explanation": "The agent must not promise savings or lender approval."
  },
  {
    "id": "certification-en-018",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks, “Is this required by law?” What should the agent say?",
    "options": [
      "“Yes, it is required.”",
      "“No, this is an optional coverage review. The Service Advisor can explain the options.”",
      "“Your bank requires it.”",
      "“You must continue to keep your vehicle legal.”"
    ],
    "correct": 1,
    "explanation": "The call must not be presented as legal or mandatory."
  },
  {
    "id": "certification-en-019",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks if their current engine issue from last week will be covered. What should the agent avoid?",
    "options": [
      "Saying the Service Advisor can review options.",
      "Clarifying that they cannot promise coverage for existing issues.",
      "Promising the existing engine issue will be fixed.",
      "Staying calm and transparent."
    ],
    "correct": 2,
    "explanation": "Agents cannot promise coverage for current or previous issues."
  },
  {
    "id": "certification-en-020",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer has a 2014 Mercedes-Benz sedan with 124,000 miles, gas, running well, no warning lights. Which evaluation is safest?",
    "options": [
      "Excluded because all luxury brands are excluded.",
      "Potentially eligible because luxury brand alone does not automatically exclude it.",
      "Invalid because all Mercedes vehicles are electric.",
      "Not eligible because it is older than 2020."
    ],
    "correct": 1,
    "explanation": "A luxury brand alone is not the same as an exotic exclusion."
  },
  {
    "id": "certification-en-021",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer has a 2019 Lamborghini with 21,000 miles and no issues. What should the agent remember?",
    "options": [
      "Low mileage makes it clean eligible.",
      "Exotic exceptions can be excluded.",
      "The customer’s consent overrides vehicle type.",
      "It qualifies because it is newer than 2011."
    ],
    "correct": 1,
    "explanation": "Exotic vehicles such as Lamborghini should not be treated as clean eligible."
  },
  {
    "id": "certification-en-022",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "A 2015 Nissan Sentra has 130,000 miles and needs an oil change. It runs normally. What is the safest view?",
    "options": [
      "Routine maintenance alone does not automatically block eligibility.",
      "Oil changes are always fully covered.",
      "The vehicle is not eligible because maintenance is due.",
      "It should be marked WRNGVE."
    ],
    "correct": 0,
    "explanation": "Routine maintenance is not the same as a current major mechanical failure."
  },
  {
    "id": "certification-en-023",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "A 2018 gas SUV has 89,000 miles but was in a crash last week, and the customer only wants collision body damage fixed. What is safest?",
    "options": [
      "Promise body damage coverage.",
      "Treat the collision issue as clean eligible.",
      "Avoid presenting accident/body damage as covered.",
      "Mark it as a Spanish transfer."
    ],
    "correct": 2,
    "explanation": "Accident and body damage are not the focus of mechanical coverage."
  },
  {
    "id": "certification-en-024",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says they only speak Spanish. The agent does not complete a Spanish handoff. What disposition is most appropriate?",
    "options": [
      "XFER",
      "SPANIS",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "SPANIS fits when Spanish is needed and no Spanish transfer is completed."
  },
  {
    "id": "certification-en-025",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks for Spanish and is connected directly with a Spanish Service Advisor. What disposition fits?",
    "options": [
      "SPXFER",
      "SPANIS",
      "DAIR",
      "NI"
    ],
    "correct": 0,
    "explanation": "SPXFER fits when the Spanish transfer is completed."
  },
  {
    "id": "certification-en-026",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer agrees to transfer, but before the Service Advisor joins, says, “Actually, I changed my mind.” What should the agent do?",
    "options": [
      "Keep transferring because consent was given earlier.",
      "Treat the earlier consent as final.",
      "Stop and do not transfer unless renewed consent is given.",
      "Mark XFER because the dial started."
    ],
    "correct": 2,
    "explanation": "Consent can be withdrawn before the handoff."
  },
  {
    "id": "certification-en-027",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "A co-signer answers and says, “I’m on the loan, but I do not make decisions for the vehicle.” What is the safest path?",
    "options": [
      "Transfer because co-signers always qualify.",
      "Ask for the decision maker or arrange a callback.",
      "Mark XFER after vehicle confirmation.",
      "Tell them they must decide today."
    ],
    "correct": 1,
    "explanation": "Being on file does not always mean decision-making authority."
  },
  {
    "id": "certification-en-028",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "A child answers and says their parent is not home, but agrees to “hear options.” What should the agent do?",
    "options": [
      "Ask for an adult decision maker or a callback time.",
      "Transfer because someone agreed.",
      "Mark it as valid XFER.",
      "Ask the child for payment details."
    ],
    "correct": 0,
    "explanation": "A child cannot provide valid decision-making consent."
  },
  {
    "id": "certification-en-029",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says, “I don’t understand.” The agent repeats the same sentence faster and starts dialing. What should QA flag?",
    "options": [
      "Strong call control.",
      "Failure to clarify understanding before transfer.",
      "Proper rebuttal.",
      "Correct callback handling."
    ],
    "correct": 1,
    "explanation": "Confusion must be resolved before clean consent."
  },
  {
    "id": "certification-en-030",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks, “Can you send me the plan by email first?” What should the agent avoid?",
    "options": [
      "Saying the Service Advisor can review available information.",
      "Promising to send policy documents the agent cannot provide.",
      "Asking if they are okay speaking with the Service Advisor.",
      "Clarifying the vehicle."
    ],
    "correct": 1,
    "explanation": "Agents should not promise documents or emails they cannot control."
  },
  {
    "id": "certification-en-031",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer asks, “How much is it monthly?” before qualification is finished. What is best?",
    "options": [
      "Quote the cheapest monthly amount.",
      "Say it is free if they listen.",
      "Explain that the Service Advisor reviews options and pricing after qualification.",
      "Say the bank already set the price."
    ],
    "correct": 2,
    "explanation": "Pricing should be bridged to the Service Advisor, not guessed or promised."
  },
  {
    "id": "certification-en-032",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The agent says, “The advisor will approve you today.” Why is that risky?",
    "options": [
      "It promises approval the agent cannot guarantee.",
      "It confirms the vehicle too slowly.",
      "It makes the customer speak first.",
      "It is required wording."
    ],
    "correct": 0,
    "explanation": "Agents should not promise approval or outcome."
  },
  {
    "id": "certification-en-033",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says they have a 2012 sedan with 174,500 miles, runs well, gas, no warning lights. What is the safest conclusion?",
    "options": [
      "It appears basically eligible to continue.",
      "It is excluded because it is before 2011.",
      "It is excluded because all sedans are excluded.",
      "It is invalid because mileage is under the limit."
    ],
    "correct": 0,
    "explanation": "It meets the basic year, mileage, type, and running-condition path."
  },
  {
    "id": "certification-en-034",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says they have a 2016 SUV with 149,000 miles, but the transmission will not shift into gear. What should the agent avoid?",
    "options": [
      "Clarifying the current issue.",
      "Treating it as clean eligible.",
      "Asking whether it is drivable.",
      "Avoiding promises."
    ],
    "correct": 1,
    "explanation": "A vehicle that cannot shift may not be in good running condition."
  },
  {
    "id": "certification-en-035",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer has a 2013 gas minivan with 172,900 miles, runs well, but does not know exact mileage. What is the safest move?",
    "options": [
      "Assume it is fine and transfer.",
      "Say mileage does not matter.",
      "Clarify mileage carefully before treating it as qualified.",
      "Mark DNC."
    ],
    "correct": 2,
    "explanation": "When mileage is close to the limit, the agent should not assume."
  },
  {
    "id": "certification-en-036",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "During the transfer, the agent introduces the customer before the Service Advisor says anything. What is the risk?",
    "options": [
      "The advisor may not be ready, and the handoff may be uncontrolled.",
      "The vehicle becomes ineligible.",
      "The call becomes voicemail.",
      "The disposition becomes DNC."
    ],
    "correct": 0,
    "explanation": "The Service Advisor should answer first before the introduction."
  },
  {
    "id": "certification-en-037",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The Service Advisor says hello, the customer says hello, and then both go silent. What should the agent do before leaving?",
    "options": [
      "Leave immediately because two hellos happened.",
      "Confirm the conversation is active or prompt the handoff.",
      "Mark SPANIS.",
      "Ask for payment details."
    ],
    "correct": 1,
    "explanation": "Two greetings alone may not prove an active handoff."
  },
  {
    "id": "certification-en-038",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says, “I already have a warranty.” Which response is safest?",
    "options": [
      "“Cancel it and take this one.”",
      "“Your warranty is useless.”",
      "“This may be a review of updated or additional options; the Service Advisor can explain.”",
      "“This will replace it for cheaper.”"
    ],
    "correct": 2,
    "explanation": "Existing coverage should be handled as a review, not attacked or replaced by promise."
  },
  {
    "id": "certification-en-039",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer says, “I do not want my information shared.” What is the best response path?",
    "options": [
      "Respect the concern and continue only if the customer is comfortable giving consent.",
      "Transfer quickly before they object more.",
      "Tell them they have no choice.",
      "Say their information is already public."
    ],
    "correct": 0,
    "explanation": "Privacy concerns require care and consent."
  },
  {
    "id": "certification-en-040",
    "mode": "certification",
    "topic": "certification",
    "language": "en",
    "question_type": "mc",
    "question": "The customer qualifies, gives clear consent, the Service Advisor speaks first, the agent introduces the customer, the customer and advisor actively talk, and the agent waits before leaving. What is the best evaluation?",
    "options": [
      "Invalid because the agent waited.",
      "Valid XFER.",
      "DAIR.",
      "CALLBK."
    ],
    "correct": 1,
    "explanation": "This is the clean transfer flow: eligibility, consent, advisor first, introduction, active handoff, and proper wait."
  },
  {
    "id": "certification-es-001",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente confirma que el vehículo funciona bien, pero cuando el agente dice: “Lo voy a conectar ahora,” el cliente responde: “Espere, ¿conectarme con quién?” ¿Cuál es la mejor acción?",
    "options": [
      "Marcar de todas formas porque el cliente ya confirmó el vehículo.",
      "Aclarar que es un Service Advisor que revisará las opciones y luego pedir permiso para conectarlo.",
      "Marcar XFER porque el cliente no dijo que no.",
      "Decirle al cliente que solo tomará unos segundos."
    ],
    "correct": 1,
    "explanation": "El cliente debe entender el handoff antes de que el consentimiento sea limpio."
  },
  {
    "id": "certification-es-002",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pregunta: “¿Esto viene de mi banco?” El agente dice: “Sí, su lender nos pidió llamarlo,” luego obtiene consentimiento y completa la transferencia. ¿Qué debería marcar QA?",
    "options": [
      "Nada, porque la transferencia se completó.",
      "El agente esperó demasiado antes de marcar.",
      "El agente usó una afirmación no aprobada sobre banco/lender.",
      "El cliente debió marcarse como DAIR."
    ],
    "correct": 2,
    "explanation": "Un handoff completado no corrige un wording riesgoso sobre la fuente de información."
  },
  {
    "id": "certification-es-003",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice que está ocupado. El agente dice: “No se preocupe, le garantizo que esto toma menos de un minuto,” y el cliente acepta la transferencia. ¿Válida o inválida?",
    "options": [
      "Válida, porque el cliente aceptó.",
      "Inválida/riesgosa, porque el agente usó una promesa de tiempo no aprobada para obtener consentimiento.",
      "Válida solo si el Service Advisor habla primero.",
      "Válida porque las objeciones de ocupado se pueden ignorar."
    ],
    "correct": 1,
    "explanation": "El consentimiento no debe obtenerse con promesas que el agente no puede controlar."
  },
  {
    "id": "certification-es-004",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pide español antes de la transferencia. El agente igual lo conecta con un Service Advisor en inglés y lo marca como English XFER. ¿Cuál es la mejor evaluación?",
    "options": [
      "XFER válido porque el cliente fue conectado.",
      "XFER válido si el opener habló inglés.",
      "English XFER inválido; el cliente pidió español antes del handoff.",
      "DAIR porque pidió español."
    ],
    "correct": 2,
    "explanation": "La preferencia de idioma debe respetarse antes de transferir."
  },
  {
    "id": "certification-es-005",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente habla en inglés con el Service Advisor por unos 20 segundos después de un handoff correcto, luego pregunta si hay español disponible. ¿Cómo debería verlo QA?",
    "options": [
      "Probablemente válido, porque primero hubo comunicación real en inglés.",
      "Siempre inválido porque se mencionó español.",
      "SPANIS solamente, sin importar lo que pasó antes.",
      "DAIR porque cambió el idioma."
    ],
    "correct": 0,
    "explanation": "Una solicitud de español después no borra automáticamente un handoff en inglés ya completado."
  },
  {
    "id": "certification-es-006",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente tiene un Tesla 2020 con 38,000 millas, funciona perfecto y acepta escuchar opciones. ¿Qué debe saber el agente?",
    "options": [
      "Califica porque el millaje es bajo.",
      "Califica porque el cliente aceptó.",
      "No es elegible limpio porque es eléctrico.",
      "El Service Advisor puede ignorar la regla."
    ],
    "correct": 2,
    "explanation": "Los vehículos eléctricos están excluidos incluso con bajo millaje."
  },
  {
    "id": "certification-es-007",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente tiene una SUV de gasolina 2016 con 171,000 millas, pero la luz de check engine se prendió hoy y el vehículo tiembla al acelerar. ¿Cuál es el camino más seguro?",
    "options": [
      "Tratarlo como elegible limpio porque está debajo del límite de millas.",
      "Aclarar el problema actual y evitar empujarlo como elegible limpio.",
      "Prometer que el Service Advisor cubrirá el problema.",
      "Marcar XFER porque el año califica."
    ],
    "correct": 1,
    "explanation": "Los problemas mecánicos actuales deben aclararse antes de transferir."
  },
  {
    "id": "certification-es-008",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Un cliente dice: “Vendí ese carro el año pasado, pero tengo un Honda Accord 2019 con 92,000 millas que funciona bien.” ¿Qué debe hacer el agente?",
    "options": [
      "Terminar la llamada como wrong vehicle inmediatamente.",
      "Transferir basado en el vehículo viejo.",
      "Verificar el vehículo actual y continuar solo si cumple las reglas.",
      "Marcar DNC porque el archivo original estaba mal."
    ],
    "correct": 2,
    "explanation": "Información vieja incorrecta puede abrir una verificación si el vehículo actual califica."
  },
  {
    "id": "certification-es-009",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice: “Estoy interesado, pero no puedo hablar ahora. Llámeme después del trabajo.” El agente transfiere igual porque el cliente mostró interés. ¿Cuál es el problema?",
    "options": [
      "Interés no es consentimiento para una transferencia inmediata.",
      "El cliente debió marcarse como A.",
      "El vehículo automáticamente se volvió inelegible.",
      "El agente debió prometer un descuento."
    ],
    "correct": 0,
    "explanation": "Una solicitud de callback no debe forzarse como transferencia."
  },
  {
    "id": "certification-es-010",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El Service Advisor entra a la llamada de 3 vías, pero se queda en silencio. El cliente dice: “Hello?” ¿Qué debe hacer el agente?",
    "options": [
      "Salir inmediatamente porque el advisor ya entró.",
      "Ayudar a activar el handoff y controlar la conexión antes de salir.",
      "Marcar XFER sin hablar.",
      "Colgarle al cliente."
    ],
    "correct": 1,
    "explanation": "El agente debe evitar dead air y confirmar un handoff activo."
  },
  {
    "id": "certification-es-011",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente cuelga mientras el agente está marcando al Service Advisor, antes de que el Service Advisor hable con el cliente. ¿Qué debe evitar el agente?",
    "options": [
      "Usar Hung Up Both Lines / Call Back handling.",
      "Proteger al Service Advisor de dead air.",
      "Salir de la llamada de 3 vías y contarlo como XFER.",
      "Documentar el resultado correctamente."
    ],
    "correct": 2,
    "explanation": "Si el cliente ya no está antes del handoff, no es un XFER limpio."
  },
  {
    "id": "certification-es-012",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Un cliente escucha la apertura, dice “No gracias” y cuelga. El agente marca DAIR. ¿Qué está mal?",
    "options": [
      "DAIR es solo para voicemail.",
      "Hubo contacto en vivo y el cliente rechazó la llamada, entonces NI encaja mejor.",
      "Siempre debe ser XFER.",
      "Debe ser SPXFER."
    ],
    "correct": 1,
    "explanation": "DAIR no es para un rechazo en vivo después de que el cliente escuchó el propósito de la llamada."
  },
  {
    "id": "certification-es-013",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice: “Dejen de llamarme o voy a reportar este número.” ¿Cuál es la disposición correcta?",
    "options": [
      "NI",
      "CALLBK",
      "DNC",
      "A"
    ],
    "correct": 2,
    "explanation": "Solicitudes de no llamar y amenazas deben manejarse como DNC."
  },
  {
    "id": "certification-es-014",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "La llamada cae en un voicemail automático diciendo que la persona no está disponible. ¿Qué disposición corresponde?",
    "options": [
      "A - Answering Machine",
      "DAIR - Dead Air",
      "NI - Not Interested",
      "WN - Wrong Number"
    ],
    "correct": 0,
    "explanation": "Voicemail o sistemas automáticos de contestadora deben marcarse como A."
  },
  {
    "id": "certification-es-015",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "La persona que contesta dice: “Número equivocado. No conozco a esa persona ni ese vehículo.” ¿Qué disposición encaja mejor?",
    "options": [
      "WRNGVE",
      "WN",
      "NI",
      "CALLBK"
    ],
    "correct": 1,
    "explanation": "Si la persona o el número son incorrectos, WN encaja mejor que wrong vehicle."
  },
  {
    "id": "certification-es-016",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente correcto contesta pero dice: “Ese vehículo no es mío. Manejo otro carro ahora.” ¿Qué debe hacer primero el agente?",
    "options": [
      "Marcar WN inmediatamente.",
      "Verificar si el vehículo actual podría calificar.",
      "Transferir basado en el vehículo viejo.",
      "Decir que el archivo no puede estar mal."
    ],
    "correct": 1,
    "explanation": "Si la persona es correcta pero el vehículo cambió, se debe verificar el vehículo actual."
  },
  {
    "id": "certification-es-017",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pregunta: “¿Esto bajará mi pago mensual?” ¿Cuál es la respuesta más segura?",
    "options": [
      "“Sí, ese es el objetivo.”",
      "“Su pago definitivamente será más bajo.”",
      "“El Service Advisor puede revisar las opciones disponibles, pero no puedo prometer un pago más bajo.”",
      "“Su lender ya lo aprobó.”"
    ],
    "correct": 2,
    "explanation": "El agente no debe prometer ahorros ni aprobación del lender."
  },
  {
    "id": "certification-es-018",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pregunta: “¿Esto es requerido por ley?” ¿Qué debería decir el agente?",
    "options": [
      "“Sí, es requerido.”",
      "“No, esto es una revisión opcional de cobertura. El Service Advisor puede explicar las opciones.”",
      "“Su banco lo requiere.”",
      "“Debe continuar para mantener su vehículo legal.”"
    ],
    "correct": 1,
    "explanation": "La llamada no debe presentarse como legal u obligatoria."
  },
  {
    "id": "certification-es-019",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pregunta si su problema actual de motor de la semana pasada será cubierto. ¿Qué debe evitar el agente?",
    "options": [
      "Decir que el Service Advisor puede revisar opciones.",
      "Aclarar que no puede prometer cobertura para problemas existentes.",
      "Prometer que el problema existente del motor será arreglado.",
      "Mantener la calma y ser transparente."
    ],
    "correct": 2,
    "explanation": "Los agentes no pueden prometer cobertura para problemas actuales o previos."
  },
  {
    "id": "certification-es-020",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente tiene un Mercedes-Benz sedán 2014 con 124,000 millas, de gasolina, funcionando bien y sin luces de advertencia. ¿Cuál evaluación es más segura?",
    "options": [
      "Excluido porque todas las marcas de lujo están excluidas.",
      "Potencialmente elegible porque una marca de lujo por sí sola no lo excluye automáticamente.",
      "Inválido porque todos los Mercedes son eléctricos.",
      "No elegible porque es más viejo que 2020."
    ],
    "correct": 1,
    "explanation": "Una marca de lujo no es lo mismo que una exclusión exótica."
  },
  {
    "id": "certification-es-021",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente tiene un Lamborghini 2019 con 21,000 millas y sin problemas. ¿Qué debe recordar el agente?",
    "options": [
      "El bajo millaje lo hace elegible limpio.",
      "Las excepciones exóticas pueden estar excluidas.",
      "El consentimiento del cliente anula el tipo de vehículo.",
      "Califica porque es más nuevo que 2011."
    ],
    "correct": 1,
    "explanation": "Vehículos exóticos como Lamborghini no deben tratarse como elegibles limpios."
  },
  {
    "id": "certification-es-022",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Un Nissan Sentra 2015 tiene 130,000 millas y necesita cambio de aceite. Funciona normal. ¿Cuál es la visión más segura?",
    "options": [
      "Mantenimiento rutinario por sí solo no bloquea automáticamente la elegibilidad.",
      "Los cambios de aceite siempre están totalmente cubiertos.",
      "El vehículo no es elegible porque necesita mantenimiento.",
      "Debe marcarse como WRNGVE."
    ],
    "correct": 0,
    "explanation": "Mantenimiento rutinario no es lo mismo que una falla mecánica mayor actual."
  },
  {
    "id": "certification-es-023",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Una SUV de gasolina 2018 tiene 89,000 millas, pero tuvo un choque la semana pasada y el cliente solo quiere arreglar daño de carrocería por colisión. ¿Qué es lo más seguro?",
    "options": [
      "Prometer cobertura para el daño de carrocería.",
      "Tratar el daño de colisión como elegible limpio.",
      "Evitar presentar daños de accidente/carrocería como cubiertos.",
      "Marcarlo como transferencia en español."
    ],
    "correct": 2,
    "explanation": "Daños de accidente y carrocería no son el enfoque de la cobertura mecánica."
  },
  {
    "id": "certification-es-024",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice que solo habla español. El agente no completa un handoff en español. ¿Qué disposición es más apropiada?",
    "options": [
      "XFER",
      "SPANIS",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "SPANIS encaja cuando se necesita español y no se completa una transferencia en español."
  },
  {
    "id": "certification-es-025",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pide español y es conectado directamente con un Service Advisor en español. ¿Qué disposición corresponde?",
    "options": [
      "SPXFER",
      "SPANIS",
      "DAIR",
      "NI"
    ],
    "correct": 0,
    "explanation": "SPXFER encaja cuando se completa la transferencia en español."
  },
  {
    "id": "certification-es-026",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente acepta la transferencia, pero antes de que entre el Service Advisor dice: “La verdad cambié de opinión.” ¿Qué debe hacer el agente?",
    "options": [
      "Seguir transfiriendo porque ya había dado consentimiento antes.",
      "Tratar el consentimiento anterior como final.",
      "Detenerse y no transferir a menos que el cliente vuelva a dar permiso.",
      "Marcar XFER porque ya empezó a marcar."
    ],
    "correct": 2,
    "explanation": "El consentimiento puede retirarse antes del handoff."
  },
  {
    "id": "certification-es-027",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Un co-signer contesta y dice: “Estoy en el préstamo, pero no tomo decisiones sobre el vehículo.” ¿Cuál es el camino más seguro?",
    "options": [
      "Transferir porque los co-signers siempre califican.",
      "Preguntar por la persona que decide o coordinar callback.",
      "Marcar XFER después de confirmar el vehículo.",
      "Decirle que debe decidir hoy."
    ],
    "correct": 1,
    "explanation": "Estar en el archivo no siempre significa tener autoridad para decidir."
  },
  {
    "id": "certification-es-028",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Un niño contesta y dice que su papá o mamá no está en casa, pero acepta “escuchar opciones.” ¿Qué debe hacer el agente?",
    "options": [
      "Preguntar por un adulto que pueda decidir o por un horario de callback.",
      "Transferir porque alguien aceptó.",
      "Marcarlo como XFER válido.",
      "Pedirle información de pago al niño."
    ],
    "correct": 0,
    "explanation": "Un niño no puede dar consentimiento válido como decision maker."
  },
  {
    "id": "certification-es-029",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice: “No entiendo.” El agente repite la misma frase más rápido y empieza a marcar. ¿Qué debería marcar QA?",
    "options": [
      "Buen control de llamada.",
      "No aclarar el entendimiento antes de transferir.",
      "Rebuttal correcto.",
      "Manejo correcto de callback."
    ],
    "correct": 1,
    "explanation": "La confusión debe resolverse antes de un consentimiento limpio."
  },
  {
    "id": "certification-es-030",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pregunta: “¿Me puede enviar el plan por email primero?” ¿Qué debe evitar el agente?",
    "options": [
      "Decir que el Service Advisor puede revisar la información disponible.",
      "Prometer enviar documentos de póliza que el agente no puede proveer.",
      "Preguntar si está de acuerdo en hablar con el Service Advisor.",
      "Aclarar el vehículo."
    ],
    "correct": 1,
    "explanation": "Los agentes no deben prometer documentos o emails que no controlan."
  },
  {
    "id": "certification-es-031",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente pregunta: “¿Cuánto es mensual?” antes de terminar la calificación. ¿Qué es lo mejor?",
    "options": [
      "Dar el monto mensual más barato.",
      "Decir que es gratis si escucha.",
      "Explicar que el Service Advisor revisa opciones y precios después de la calificación.",
      "Decir que el banco ya fijó el precio."
    ],
    "correct": 2,
    "explanation": "Los precios deben llevarse al Service Advisor, no adivinarse ni prometerse."
  },
  {
    "id": "certification-es-032",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El agente dice: “El advisor lo va a aprobar hoy.” ¿Por qué es riesgoso?",
    "options": [
      "Promete una aprobación que el agente no puede garantizar.",
      "Confirma el vehículo demasiado lento.",
      "Hace que el cliente hable primero.",
      "Es wording obligatorio."
    ],
    "correct": 0,
    "explanation": "Los agentes no deben prometer aprobación ni resultado."
  },
  {
    "id": "certification-es-033",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice que tiene un sedán 2012 con 174,500 millas, funciona bien, es de gasolina y no tiene luces de advertencia. ¿Cuál es la conclusión más segura?",
    "options": [
      "Parece básicamente elegible para continuar.",
      "Está excluido porque es antes de 2011.",
      "Está excluido porque todos los sedanes están excluidos.",
      "Es inválido porque el millaje está debajo del límite."
    ],
    "correct": 0,
    "explanation": "Cumple con año, millaje, tipo y condición básica de funcionamiento."
  },
  {
    "id": "certification-es-034",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice que tiene una SUV 2016 con 149,000 millas, pero la transmisión no entra en cambio. ¿Qué debe evitar el agente?",
    "options": [
      "Aclarar el problema actual.",
      "Tratarlo como elegible limpio.",
      "Preguntar si se puede manejar.",
      "Evitar promesas."
    ],
    "correct": 1,
    "explanation": "Un vehículo que no cambia de marcha puede no estar en buena condición de funcionamiento."
  },
  {
    "id": "certification-es-035",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente tiene una minivan de gasolina 2013 con 172,900 millas, funciona bien, pero no sabe el millaje exacto. ¿Cuál es el movimiento más seguro?",
    "options": [
      "Asumir que está bien y transferir.",
      "Decir que el millaje no importa.",
      "Aclarar cuidadosamente el millaje antes de tratarlo como calificado.",
      "Marcar DNC."
    ],
    "correct": 2,
    "explanation": "Cuando el millaje está cerca del límite, el agente no debe asumir."
  },
  {
    "id": "certification-es-036",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "Durante la transferencia, el agente presenta al cliente antes de que el Service Advisor diga algo. ¿Cuál es el riesgo?",
    "options": [
      "El advisor puede no estar listo y el handoff puede quedar fuera de control.",
      "El vehículo se vuelve inelegible.",
      "La llamada se convierte en voicemail.",
      "La disposición se vuelve DNC."
    ],
    "correct": 0,
    "explanation": "El Service Advisor debe contestar primero antes de la presentación."
  },
  {
    "id": "certification-es-037",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El Service Advisor dice hello, el cliente dice hello, y luego ambos quedan en silencio. ¿Qué debe hacer el agente antes de salir?",
    "options": [
      "Salir inmediatamente porque ya hubo dos hellos.",
      "Confirmar que la conversación esté activa o ayudar con el handoff.",
      "Marcar SPANIS.",
      "Pedir información de pago."
    ],
    "correct": 1,
    "explanation": "Dos saludos por sí solos pueden no probar que el handoff esté activo."
  },
  {
    "id": "certification-es-038",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice: “Ya tengo warranty.” ¿Qué respuesta es más segura?",
    "options": [
      "“Cancélela y tome esta.”",
      "“Su warranty no sirve.”",
      "“Esto puede ser una revisión de opciones actualizadas o adicionales; el Service Advisor puede explicarlo.”",
      "“Esto la va a reemplazar por algo más barato.”"
    ],
    "correct": 2,
    "explanation": "La cobertura existente debe manejarse como una revisión, no atacarse ni prometer reemplazo."
  },
  {
    "id": "certification-es-039",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente dice: “No quiero que compartan mi información.” ¿Cuál es el mejor camino de respuesta?",
    "options": [
      "Respetar la preocupación y continuar solo si el cliente se siente cómodo dando consentimiento.",
      "Transferir rápido antes de que objete más.",
      "Decirle que no tiene opción.",
      "Decir que su información ya es pública."
    ],
    "correct": 0,
    "explanation": "Las preocupaciones de privacidad requieren cuidado y consentimiento."
  },
  {
    "id": "certification-es-040",
    "mode": "certification",
    "topic": "certification",
    "language": "es",
    "question_type": "mc",
    "question": "El cliente califica, da consentimiento claro, el Service Advisor habla primero, el agente presenta al cliente, el cliente y el advisor hablan activamente, y el agente espera antes de salir. ¿Cuál es la mejor evaluación?",
    "options": [
      "Inválida porque el agente esperó.",
      "XFER válido.",
      "DAIR.",
      "CALLBK."
    ],
    "correct": 1,
    "explanation": "Este es el flujo limpio: elegibilidad, consentimiento, advisor primero, presentación, handoff activo y espera correcta."
  }
]
