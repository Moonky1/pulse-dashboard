export const validInvalidQuestions = [
  {
    "id": "valid-invalid-en-001",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent verifies the vehicle, asks the customer if they are okay speaking with a Service Advisor, the customer says yes, the Service Advisor speaks first, and the agent stays on the 3-way call while both lines are connected. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The customer gave consent, the Service Advisor spoke first, and the handoff was completed correctly."
  },
  {
    "id": "valid-invalid-en-002",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer confirms the vehicle is running, but the agent transfers immediately without asking if the customer agrees to speak with a Service Advisor. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. Vehicle confirmation is not transfer consent."
  },
  {
    "id": "valid-invalid-en-003",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent dials the Service Advisor, hears the Service Advisor answer, introduces the customer, but leaves the 3-way call after only a few seconds. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The agent must confirm the handoff is actually active before leaving."
  },
  {
    "id": "valid-invalid-en-004",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer hangs up while the agent is dialing the Service Advisor, before the Service Advisor speaks with the customer. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The customer never completed a real handoff with the Service Advisor."
  },
  {
    "id": "valid-invalid-en-005",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer gives clear approval to be transferred. The Service Advisor answers first, the agent introduces the customer, and the customer speaks with the Service Advisor before later asking for Spanish. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The English handoff already happened before the later Spanish request."
  },
  {
    "id": "valid-invalid-en-006",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer and agent speak in English, but as soon as the Service Advisor says hello, the customer immediately asks for Spanish and no English conversation happens with the Service Advisor. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The English Service Advisor conversation did not actually start."
  },
  {
    "id": "valid-invalid-en-007",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The person who answers says, “This is not my car, you have the wrong number,” but the agent still transfers them to a Service Advisor. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. Wrong person or wrong vehicle should not be transferred as a clean XFER."
  },
  {
    "id": "valid-invalid-en-008",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says they already have coverage and they are not interested. The agent still pushes the transfer without solving the objection or getting clear agreement. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. A clear rejection without consent is not a clean transfer."
  },
  {
    "id": "valid-invalid-en-009",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks, “How much is it?” The agent says the Service Advisor can explain the available options, asks if they are okay speaking with them, and the customer agrees. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The agent did not promise a price and got permission to connect the customer."
  },
  {
    "id": "valid-invalid-en-010",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent tells the customer, “This will only take less than a minute,” and uses that promise to convince the customer to accept the transfer. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. Agents should not use unsupported time promises to force the transfer."
  },
  {
    "id": "valid-invalid-en-011",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent asks the customer if they want to hear the coverage options. The customer says “Sure” and stays on the line while the Service Advisor starts the conversation. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. “Sure” can be consent if the customer understands they are being connected."
  },
  {
    "id": "valid-invalid-en-012",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent asks, “Is the vehicle running fine?” The customer says yes. The agent treats that yes as permission to transfer and dials the Service Advisor. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. Saying yes about the vehicle is not consent to transfer."
  },
  {
    "id": "valid-invalid-en-013",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says they are busy. The agent asks if a Service Advisor can explain the options now, but the customer says no and asks for a callback. The agent transfers anyway. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The customer refused the live handoff and requested a callback."
  },
  {
    "id": "valid-invalid-en-014",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says they are busy. The agent handles it professionally, the customer then agrees to speak with the Service Advisor now, and the handoff is completed correctly. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The objection was handled and the customer gave clear permission."
  },
  {
    "id": "valid-invalid-en-015",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent connects the Service Advisor, but the Service Advisor is silent and the customer receives dead air. The agent leaves the 3-way call anyway. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. Dead air is not a successful handoff."
  },
  {
    "id": "valid-invalid-en-016",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The Service Advisor answers first, the agent introduces the customer, the customer responds, and both continue speaking while the agent waits before leaving. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. This is the correct handoff flow."
  },
  {
    "id": "valid-invalid-en-017",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "A child answers the phone and says their parent is not available. The agent still transfers the child to a Service Advisor. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. A child or non-decision maker should not be transferred as a valid customer."
  },
  {
    "id": "valid-invalid-en-018",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says the decision maker is their spouse. The spouse joins the call, confirms the vehicle, agrees to hear the options, and the handoff is completed correctly. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The decision maker joined, gave consent, and completed the handoff."
  },
  {
    "id": "valid-invalid-en-019",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks where the agent got their information. The agent says they work with vehicle records and dealership-related information, continues professionally, gets consent, and completes the handoff. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The agent handled the concern without making risky claims."
  },
  {
    "id": "valid-invalid-en-020",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks where the agent got their information. The agent says, “Your bank sent us your file,” even though that is not approved, then transfers the customer. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The agent used an unsupported claim to move the customer into the transfer."
  },
  {
    "id": "valid-invalid-en-021",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer agrees to speak with a Service Advisor, but while waiting, they say, “Actually, I changed my mind. I do not want to talk to anyone else.” The agent transfers anyway. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The customer withdrew consent before the handoff."
  },
  {
    "id": "valid-invalid-en-022",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks what the Service Advisor will do. The agent explains that the Service Advisor will review available options, asks for permission to connect, and the customer agrees. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The agent clarified the role and got consent before dialing."
  },
  {
    "id": "valid-invalid-en-023",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer is confused and says, “I do not understand what this is.” The agent ignores the concern and transfers because the customer said “okay” earlier. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. Confusion must be clarified before consent can be clean."
  },
  {
    "id": "valid-invalid-en-024",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says, “Okay, you can connect me,” the Service Advisor answers, and the customer speaks with the Service Advisor in English after the agent introduces them. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The customer gave consent and the English handoff happened."
  },
  {
    "id": "valid-invalid-en-025",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks if they have to buy today. The agent says, “Yes, you need to decide today,” then transfers them. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The agent made the call sound mandatory and pressured the customer."
  },
  {
    "id": "valid-invalid-en-026",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks if they have to buy today. The agent says the Service Advisor can review options and the customer decides, then asks permission to connect. The customer agrees. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The agent avoided pressure and got clear consent."
  },
  {
    "id": "valid-invalid-en-027",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says the vehicle does not start and is currently at home. The agent still treats the customer as qualified and transfers as a clean XFER. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. A vehicle that does not currently run should not be treated as clean eligible."
  },
  {
    "id": "valid-invalid-en-028",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer has a qualifying vehicle, agrees to hear the options, and stays connected while the Service Advisor begins the conversation. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. Eligibility, consent, and handoff were handled properly."
  },
  {
    "id": "valid-invalid-en-029",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks for Spanish before the transfer. The agent does not speak Spanish and still transfers to an English Service Advisor as an English XFER. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The customer requested Spanish before the English handoff."
  },
  {
    "id": "valid-invalid-en-030",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer speaks English with the opener, agrees to transfer, and has a real English conversation with the Service Advisor before any language concern comes up. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. A real English Service Advisor conversation happened."
  },
  {
    "id": "valid-invalid-en-031",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent dials the Service Advisor while the customer is still asking, “Who are you connecting me to?” Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The agent should clarify who the customer is being connected to before dialing."
  },
  {
    "id": "valid-invalid-en-032",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer asks who they are being connected to. The agent explains it is a Service Advisor who can review the options, then gets permission to continue. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The customer understood the handoff and agreed."
  },
  {
    "id": "valid-invalid-en-033",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says they sold the vehicle last year. The agent transfers them anyway because the phone number is correct. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The vehicle on file no longer belongs to the customer."
  },
  {
    "id": "valid-invalid-en-034",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says the vehicle on file is wrong, but then verifies their current qualifying vehicle and agrees to speak with the Service Advisor. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The agent verified a current qualifying vehicle and got consent."
  },
  {
    "id": "valid-invalid-en-035",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The agent connects the Service Advisor, but leaves before confirming that the customer and Service Advisor are actually speaking. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The agent must confirm an active handoff before leaving."
  },
  {
    "id": "valid-invalid-en-036",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The Service Advisor answers, the agent introduces the customer, the customer responds, and the agent stays while both lines are active. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The handoff was active and properly completed."
  },
  {
    "id": "valid-invalid-en-037",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says they are at work and asks for a callback. The agent transfers anyway because the customer already confirmed the vehicle. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. A callback request should not be forced into a transfer."
  },
  {
    "id": "valid-invalid-en-038",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says they are at work, but after a safe rebuttal they agree to speak with the Service Advisor now. The handoff is completed properly. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The customer changed from a time objection to clear consent."
  },
  {
    "id": "valid-invalid-en-039",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says, “This sounds like a scam.” The agent gets defensive, says “Your bank told us to call,” and transfers. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 1,
    "explanation": "Invalid XFER. The agent used risky wording and did not handle the concern safely."
  },
  {
    "id": "valid-invalid-en-040",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "en",
    "question_type": "binary",
    "question": "The customer says, “This sounds like a scam.” The agent stays calm, explains the call purpose, avoids bank/lender claims, gets permission to connect, and completes the handoff. Valid or invalid XFER?",
    "options": [
      "Valid XFER",
      "Invalid XFER"
    ],
    "correct": 0,
    "explanation": "Valid XFER. The concern was handled safely and consent was obtained."
  },
  {
    "id": "valid-invalid-es-001",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente verifica el vehículo, pregunta si el cliente está de acuerdo en hablar con un Service Advisor, el cliente dice que sí, el Service Advisor habla primero y el agente espera en la llamada de 3 vías mientras ambas líneas están conectadas. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El cliente dio consentimiento, el Service Advisor habló primero y el handoff se completó correctamente."
  },
  {
    "id": "valid-invalid-es-002",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente confirma que el vehículo funciona, pero el agente transfiere de inmediato sin preguntarle si acepta hablar con un Service Advisor. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Confirmar el vehículo no es consentimiento para transferir."
  },
  {
    "id": "valid-invalid-es-003",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente llama al Service Advisor, escucha que contesta, presenta al cliente, pero sale de la llamada de 3 vías después de pocos segundos. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El agente debe confirmar que el handoff esté activo antes de salir."
  },
  {
    "id": "valid-invalid-es-004",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente cuelga mientras el agente está llamando al Service Advisor, antes de que el Service Advisor hable con el cliente. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El cliente nunca completó un handoff real con el Service Advisor."
  },
  {
    "id": "valid-invalid-es-005",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente acepta claramente ser transferido. El Service Advisor contesta primero, el agente presenta al cliente y el cliente habla con el Service Advisor antes de pedir español después. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El handoff en inglés ya ocurrió antes de que el cliente pidiera español."
  },
  {
    "id": "valid-invalid-es-006",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente y el agente hablan en inglés, pero apenas el Service Advisor saluda, el cliente inmediatamente pide español y no hay conversación en inglés con el Service Advisor. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. La conversación en inglés con el Service Advisor no llegó a comenzar."
  },
  {
    "id": "valid-invalid-es-007",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "La persona que contesta dice: “Ese no es mi carro, tienen el número equivocado,” pero el agente igual la transfiere con un Service Advisor. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Persona equivocada o vehículo equivocado no debe transferirse como XFER limpio."
  },
  {
    "id": "valid-invalid-es-008",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que ya tiene cobertura y no está interesado. El agente sigue empujando la transferencia sin resolver la objeción ni obtener acuerdo claro. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Un rechazo claro sin consentimiento no es transferencia limpia."
  },
  {
    "id": "valid-invalid-es-009",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta: “¿Cuánto cuesta?” El agente dice que el Service Advisor puede explicar las opciones disponibles, pregunta si está de acuerdo en hablar con él, y el cliente acepta. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El agente no prometió precio y obtuvo permiso para conectar al cliente."
  },
  {
    "id": "valid-invalid-es-010",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente le dice al cliente: “Esto tomará menos de un minuto,” y usa esa promesa para convencerlo de aceptar la transferencia. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. No se deben usar promesas de tiempo no aprobadas para forzar el transfer."
  },
  {
    "id": "valid-invalid-es-011",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente pregunta si el cliente quiere escuchar las opciones de cobertura. El cliente dice “Sure” y se mantiene en línea mientras el Service Advisor inicia la conversación. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. “Sure” puede ser consentimiento si el cliente entiende que será conectado."
  },
  {
    "id": "valid-invalid-es-012",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente pregunta: “¿El vehículo está funcionando bien?” El cliente dice que sí. El agente toma ese sí como permiso para transferir y llama al Service Advisor. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Decir sí sobre el vehículo no es consentimiento para transferir."
  },
  {
    "id": "valid-invalid-es-013",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que está ocupado. El agente pregunta si un Service Advisor puede explicar las opciones ahora, pero el cliente dice que no y pide callback. El agente transfiere de todas formas. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El cliente rechazó el handoff en vivo y pidió callback."
  },
  {
    "id": "valid-invalid-es-014",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que está ocupado. El agente lo maneja profesionalmente, el cliente luego acepta hablar con el Service Advisor ahora, y el handoff se completa correctamente. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. La objeción fue manejada y el cliente dio permiso claro."
  },
  {
    "id": "valid-invalid-es-015",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente conecta al Service Advisor, pero el Service Advisor queda en silencio y el cliente recibe dead air. El agente sale de la llamada de 3 vías de todas formas. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Dead air no es un handoff exitoso."
  },
  {
    "id": "valid-invalid-es-016",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El Service Advisor contesta primero, el agente presenta al cliente, el cliente responde y ambos continúan hablando mientras el agente espera antes de salir. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. Ese es el flujo correcto del handoff."
  },
  {
    "id": "valid-invalid-es-017",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "Un niño contesta el teléfono y dice que su papá o mamá no está disponible. El agente aun así transfiere al niño con un Service Advisor. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Un niño o persona que no decide no debe transferirse como cliente válido."
  },
  {
    "id": "valid-invalid-es-018",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que quien decide es su esposo/a. El esposo/a entra a la llamada, confirma el vehículo, acepta escuchar las opciones y el handoff se completa correctamente. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. La persona que decide entró, dio consentimiento y completó el handoff."
  },
  {
    "id": "valid-invalid-es-019",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta de dónde sacaron su información. El agente dice que trabajan con registros de vehículos e información relacionada con dealerships, continúa profesionalmente, obtiene consentimiento y completa el handoff. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El agente manejó la preocupación sin usar afirmaciones riesgosas."
  },
  {
    "id": "valid-invalid-es-020",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta de dónde sacaron su información. El agente dice: “Su banco nos mandó su archivo,” aunque eso no está aprobado, y luego transfiere al cliente. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El agente usó una afirmación no aprobada para mover al cliente al transfer."
  },
  {
    "id": "valid-invalid-es-021",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente acepta hablar con un Service Advisor, pero mientras espera dice: “La verdad cambié de opinión. No quiero hablar con nadie más.” El agente transfiere igual. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El cliente retiró el consentimiento antes del handoff."
  },
  {
    "id": "valid-invalid-es-022",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta qué hará el Service Advisor. El agente explica que revisará opciones disponibles, pide permiso para conectarlo y el cliente acepta. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El agente aclaró el rol y obtuvo consentimiento antes de marcar."
  },
  {
    "id": "valid-invalid-es-023",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente está confundido y dice: “No entiendo qué es esto.” El agente ignora la preocupación y transfiere porque el cliente había dicho “okay” antes. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. La confusión debe aclararse antes de considerar limpio el consentimiento."
  },
  {
    "id": "valid-invalid-es-024",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice: “Okay, puede conectarme,” el Service Advisor contesta y el cliente habla con el Service Advisor en inglés después de que el agente los presenta. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El cliente dio consentimiento y el handoff en inglés ocurrió."
  },
  {
    "id": "valid-invalid-es-025",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta si tiene que comprar hoy. El agente dice: “Sí, debe decidir hoy,” y luego lo transfiere. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El agente hizo sonar la llamada obligatoria y presionó al cliente."
  },
  {
    "id": "valid-invalid-es-026",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta si tiene que comprar hoy. El agente dice que el Service Advisor puede revisar opciones y que el cliente decide, luego pide permiso para conectarlo. El cliente acepta. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El agente evitó presión y obtuvo consentimiento claro."
  },
  {
    "id": "valid-invalid-es-027",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que el vehículo no prende y está en casa. El agente aun así lo trata como calificado y transfiere como XFER limpio. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Un vehículo que no funciona actualmente no debe tratarse como elegible limpio."
  },
  {
    "id": "valid-invalid-es-028",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente tiene un vehículo que califica, acepta escuchar las opciones y queda conectado mientras el Service Advisor inicia la conversación. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. Elegibilidad, consentimiento y handoff fueron manejados correctamente."
  },
  {
    "id": "valid-invalid-es-029",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pide español antes de la transferencia. El agente no habla español y aun así lo transfiere a un Service Advisor en inglés como English XFER. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El cliente pidió español antes del handoff en inglés."
  },
  {
    "id": "valid-invalid-es-030",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente habla inglés con el opener, acepta el transfer y tiene una conversación real en inglés con el Service Advisor antes de cualquier preocupación de idioma. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. Sí hubo una conversación real en inglés con el Service Advisor."
  },
  {
    "id": "valid-invalid-es-031",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente llama al Service Advisor mientras el cliente todavía pregunta: “¿Con quién me está conectando?” ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El agente debe aclarar con quién conecta al cliente antes de marcar."
  },
  {
    "id": "valid-invalid-es-032",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente pregunta con quién será conectado. El agente explica que es un Service Advisor que puede revisar las opciones y luego obtiene permiso para continuar. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El cliente entendió el handoff y aceptó."
  },
  {
    "id": "valid-invalid-es-033",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que vendió el vehículo el año pasado. El agente transfiere igual porque el número de teléfono es correcto. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El vehículo en el archivo ya no pertenece al cliente."
  },
  {
    "id": "valid-invalid-es-034",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que el vehículo en el archivo está mal, pero luego verifica su vehículo actual que sí califica y acepta hablar con el Service Advisor. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El agente verificó un vehículo actual que califica y obtuvo consentimiento."
  },
  {
    "id": "valid-invalid-es-035",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El agente conecta al Service Advisor, pero sale antes de confirmar que el cliente y el Service Advisor realmente están hablando. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El agente debe confirmar un handoff activo antes de salir."
  },
  {
    "id": "valid-invalid-es-036",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El Service Advisor contesta, el agente presenta al cliente, el cliente responde y el agente espera mientras ambas líneas están activas. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El handoff estuvo activo y se completó correctamente."
  },
  {
    "id": "valid-invalid-es-037",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que está en el trabajo y pide callback. El agente transfiere igual porque el cliente ya confirmó el vehículo. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. Una solicitud de callback no debe forzarse como transferencia."
  },
  {
    "id": "valid-invalid-es-038",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice que está en el trabajo, pero después de un rebuttal seguro acepta hablar con el Service Advisor ahora. El handoff se completa correctamente. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. El cliente pasó de objeción de tiempo a consentimiento claro."
  },
  {
    "id": "valid-invalid-es-039",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice: “Esto suena como una estafa.” El agente se pone defensivo, dice “Su banco nos pidió llamarlo,” y transfiere. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 1,
    "explanation": "Transferencia inválida. El agente usó wording riesgoso y no manejó la preocupación de forma segura."
  },
  {
    "id": "valid-invalid-es-040",
    "mode": "valid-invalid",
    "topic": "valid-invalid",
    "language": "es",
    "question_type": "binary",
    "question": "El cliente dice: “Esto suena como una estafa.” El agente mantiene la calma, explica el propósito, evita mencionar banco/lender, obtiene permiso para conectar y completa el handoff. ¿Transferencia válida o inválida?",
    "options": [
      "Transferencia válida",
      "Transferencia inválida"
    ],
    "correct": 0,
    "explanation": "Transferencia válida. La preocupación fue manejada de forma segura y hubo consentimiento."
  }
]
