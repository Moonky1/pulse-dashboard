import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  gameModes,
  quizQuestions,
  gameChallengeBank,
} from './goContent'
import './GoQuizPlay.css'

const CLASSIC_COUNT = 10
const SPEED_COUNT = 15
const CERTIFICATION_COUNT = 25
const DEFAULT_TIME = 30
const SPEED_TIME = 15

const OPTION_STYLES = [
  { color: '#ef4444', shape: '▲' },
  { color: '#3b82f6', shape: '◆' },
  { color: '#f59e0b', shape: '●' },
  { color: '#22c55e', shape: '■' },
  { color: '#a855f7', shape: '⬟' },
  { color: '#38bdf8', shape: '✦' },
]

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']


const SPANISH_TEXT = {
  1: {
    question: '¿Qué nombre de compañía debe usar el opener en la introducción en inglés?',
    options: ['Vehicle Services Group', 'Vehicle Service Center', 'Auto Warranty Department', 'Coverage Review Team'],
    explanation: 'La introducción en inglés identifica al caller como parte de Vehicle Services Group.',
  },
  2: {
    question: '¿Qué detalle financiero pertenece a la línea de apertura?',
    options: ['La dirección del dealership', 'El mes y año de financiamiento', 'El porcentaje APR mostrado', 'El ZIP code del cliente'],
    explanation: 'El opener debe mencionar el vehículo financiado en el mes y año correspondiente.',
  },
  3: {
    question: '¿Qué debe verificarse antes de avanzar hacia una transferencia?',
    options: ['Que el cliente sepa el VIN', 'Que la dirección esté actualizada', 'Que el vehículo esté funcionando bien', 'Que el cliente tenga recibos de reparación'],
    explanation: 'El opener debe confirmar que el vehículo sigue en buenas condiciones de funcionamiento.',
  },
  4: {
    question: '¿Qué línea coincide mejor con el propósito aprobado?',
    options: ['Su banco nos pidió renovar la garantía de fábrica hoy', 'El dealership quiere venderle una póliza nueva', 'Estamos llamando para confirmar su seguro', 'Nuestros registros muestran que la garantía extendida aún no ha sido activada'],
    explanation: 'La línea de propósito habla de la garantía extendida del vehículo, no del banco ni del seguro.',
  },
  5: {
    question: '¿Qué debe hacer el opener antes de iniciar la transferencia?',
    options: ['Pedir el VIN completo', 'Obtener aprobación clara del cliente', 'Dar el precio mensual exacto', 'Leer la dirección del dealership'],
    explanation: 'El cliente debe aprobar claramente la transferencia antes de que el opener marque.',
  },
  6: {
    question: '¿Qué línea de handoff es la más profesional?',
    options: ['Tengo a alguien aquí. Tome esta llamada ahora.', 'Esta persona quiere precios. Explíquele.', 'Hello Service Advisor, I have the customer on the line. Can you please assist?', 'El cliente está listo, así que voy a salir de la llamada.'],
    explanation: 'El handoff debe presentar al cliente con el Service Advisor de forma clara.',
  },
  7: {
    question: 'Para el script en español, ¿qué nombre de compañía debe usarse?',
    options: ['Centro Nacional de Bancos', 'Departamento de Seguros del Dealer', 'Garantía Directa del Fabricante', 'Grupo de Servicios Vehiculares'],
    explanation: 'El script en español identifica al caller como Grupo de Servicios Vehiculares.',
  },
  8: {
    question: '¿Qué verifica el opener en español antes de transferir?',
    options: ['Que el vehículo esté en buenas condiciones de funcionamiento', 'Que el cliente tenga seguro completo', 'Que el préstamo esté pagado', 'Que la dirección coincida con el archivo'],
    explanation: 'El script en español también requiere verificar la condición del vehículo.',
  },
  9: {
    question: '¿Cuál es el significado aprobado de la línea de transferencia en español?',
    options: ['Enviar al cliente directamente al dealership para precios', 'Pasar la llamada a billing antes de verificar elegibilidad', 'Conectar al cliente con un Asesor de Servicio para revisar calificación', 'Pedir al cliente que llame luego de revisar el vehículo'],
    explanation: 'La línea conecta al cliente con un Asesor de Servicio para revisar su calificación.',
  },
  10: {
    question: 'En el script en español, ¿cuándo debe transferir el opener?',
    options: ['Tan pronto el cliente conteste', 'Después de que el cliente dé aprobación', 'Antes de confirmar que el vehículo funciona', 'Solo después de dar el costo del plan'],
    explanation: 'La aprobación es necesaria antes de transferir, tanto en inglés como en español.',
  },
  11: {
    question: '¿Qué handoff en español se acerca más a la línea aprobada?',
    options: ['Hola, ventas, este cliente quiere saber el precio final.', 'Buenas, le dejo a esta persona porque está interesada.', 'Asesor, tome esta llamada mientras yo cuelgo.', 'Hola, Asesor de Servicio, tengo al cliente en la línea. ¿Podría asistir?'],
    explanation: 'El handoff en español debe presentar claramente al cliente con el Asesor de Servicio.',
  },
  12: {
    question: '¿Qué debe evitar el opener al entregar cualquiera de los dos scripts?',
    options: ['Acortar o improvisar las palabras', 'Hablar con ritmo controlado', 'Usar claramente el nombre del cliente', 'Sonar seguro con la información financiera'],
    explanation: 'Los estándares de delivery exigen no acortar ni improvisar el script.',
  },
  13: {
    question: 'Un cliente dice: “No me interesa.” ¿Cuál es el primer movimiento más fuerte?',
    options: ['Preguntar por qué y crear curiosidad', 'Terminar la llamada de inmediato', 'Discutir que necesita cobertura', 'Saltar directo a la transferencia'],
    explanation: 'El opener debe hacer una pregunta, entender el motivo y trabajar desde ahí.',
  },
  14: {
    question: 'Un cliente pregunta: “¿De dónde obtuvieron mi información?” ¿Qué debes decir?',
    options: ['Su banco nos envió su perfil de préstamo hoy', 'Trabajamos con dealerships y registros vehiculares a nivel nacional', 'Compramos el archivo a otra compañía', 'El sistema no muestra esa información'],
    explanation: 'La respuesta aprobada menciona dealerships y registros vehiculares, no el banco.',
  },
  15: {
    question: 'Un cliente pregunta: “¿Qué vehículo?” ¿Cuál es la mejor respuesta?',
    options: ['Puedo ver la marca y modelo exactos, pero no puedo decirlos', 'Usted debería saber de qué vehículo hablamos', 'Solo veo información financiera; el Service Advisor puede revisar los detalles completos', 'Esa pregunta no importa para esta llamada'],
    explanation: 'Sé transparente sobre la información disponible y haz bridge al Service Advisor.',
  },
  16: {
    question: 'Un cliente pregunta: “¿Cuánto cuesta?” ¿Qué debe evitar el opener?',
    options: ['Mencionar que el millaje puede afectar el costo', 'Mover la llamada hacia el Service Advisor', 'Explicar que el precio varía', 'Dar un precio exacto'],
    explanation: 'El opener no debe dar precios exactos; el Service Advisor revisa el costo.',
  },
  17: {
    question: 'Un cliente dice: “Ya tengo seguro.” ¿Qué diferencia importa más?',
    options: ['El seguro y la cobertura extendida son lo mismo', 'El seguro cubre accidentes; esto cubre fallas mecánicas', 'El seguro reemplaza cualquier cobertura de reparación', 'La cobertura extendida es obligatoria como el seguro'],
    explanation: 'El seguro y la cobertura extendida son productos diferentes.',
  },
  18: {
    question: 'Un cliente dice: “Estoy ocupado.” ¿Cuál es el mejor control?',
    options: ['Apurar el script completo', 'Decir que solo tomará segundos', 'Ofrecer un horario de callback que funcione mejor', 'Seguir hablando hasta que responda'],
    explanation: 'Respeta el tiempo del cliente y ofrece una opción de callback.',
  },
  19: {
    question: 'En una llamada en español, el cliente dice que no le interesa. ¿Qué debe hacer primero el opener?',
    options: ['Transferir sin más explicación', 'Marcar SPXFER inmediatamente', 'Decirle que está cometiendo un error', 'Hacer una pregunta rápida para entender por qué'],
    explanation: 'La misma lógica aplica: preguntar por qué y trabajar con la respuesta.',
  },
  20: {
    question: 'En una llamada en español, el cliente pregunta dónde está ubicada la compañía. ¿Qué respuesta es aprobada?',
    options: ['La sede está en Dallas, Texas', 'La oficina está dentro del dealership', 'La oficina del banco maneja la póliza', 'La ubicación cambia según el estado del cliente'],
    explanation: 'La respuesta aprobada es Dallas, Texas, con operación nacional.',
  },
  21: {
    question: 'En una llamada en español, el cliente pregunta: “¿Quién habla?” ¿Qué debe ir primero?',
    options: ['Decir que el banco dio la información', 'Decir que es el departamento de garantías del dealership', 'Identificarse como Grupo de Servicios Vehiculares', 'Omitir completamente el nombre de la compañía'],
    explanation: 'La primera identificación debe coincidir con el script aprobado en español.',
  },
  22: {
    question: 'En una llamada en español, el cliente dice que ya tiene cobertura. ¿Cuál es el mejor enfoque?',
    options: ['Decirle que su cobertura actual no sirve', 'Revisar posibles beneficios actualizados o adicionales', 'Decirle que cancele su plan actual', 'Terminar porque no puede calificar'],
    explanation: 'La llamada debe posicionarse como revisión de opciones o beneficios adicionales.',
  },
  23: {
    question: 'En una llamada en español, el cliente dice que vendió el vehículo o fue pérdida total. ¿Qué debe hacer el opener?',
    options: ['Marcarlo como transferencia exitosa', 'Insistir en que el vehículo anterior califica', 'Pedir primero información de pago', 'Preguntar si actualmente maneja otro vehículo'],
    explanation: 'Redirige hacia el vehículo actual y verifica si está funcionando bien.',
  },
  24: {
    question: 'En una llamada en español, el cliente dice que la información del vehículo está mal. ¿Cuál es el mejor enfoque?',
    options: ['Tratarlo como verificación y revisar el vehículo actual', 'Decirle que el archivo siempre está correcto', 'Saltar el vehicle check y transferir', 'Marcar la llamada como Do Not Call'],
    explanation: 'La información errónea o vieja debe manejarse como verificación.',
  },
  25: {
    question: '¿Contra qué protege principalmente la cobertura extendida?',
    options: ['Reparaciones por fallas mecánicas', 'Reclamos de responsabilidad por accidentes', 'Carrocería después de choques', 'Solo cambios de aceite rutinarios'],
    explanation: 'La cobertura extendida se enfoca en reparaciones por fallas mecánicas.',
  },
  26: {
    question: '¿Qué vehículo tiene más probabilidad de calificar?',
    options: ['Coupé 2008 con 70,000 millas', 'Sedán 2018 con 95,000 millas', 'Vehículo eléctrico 2021 con 30,000 millas', 'Motocicleta 2019 con 15,000 millas'],
    explanation: 'Debe ser 2011 o más nuevo, no eléctrico, menor de 175,000 millas y no motocicleta.',
  },
  27: {
    question: '¿Qué límite de millaje deben recordar los agentes?',
    options: ['125,000 millas', '150,000 millas', '175,000 millas', '200,000 millas'],
    explanation: 'Los vehículos con más de 175,000 millas no pueden cubrirse.',
  },
  28: {
    question: '¿Qué elemento está excluido de la cobertura?',
    options: ['Reparación mecánica de motor', 'Reparación mecánica de transmisión', 'Falla eléctrica cubierta', 'Carrocería o reparación cosmética'],
    explanation: 'Carrocería y reparaciones cosméticas están excluidas.',
  },
  29: {
    question: '¿En qué se diferencia la factory warranty de la cobertura extendida?',
    options: ['La factory warranty es opcional después de cada reparación', 'La factory warranty viene con vehículos nuevos por un término limitado', 'La factory warranty cubre accidentes a nivel nacional', 'La factory warranty empieza después de la cobertura extendida'],
    explanation: 'La factory warranty normalmente viene con vehículos nuevos y dura por tiempo o millaje limitado.',
  },
  30: {
    question: '¿Dónde se pueden manejar generalmente las reparaciones aprobadas?',
    options: ['Solo en el dealership original', 'Solo en talleres de Texas', 'En repair facilities autorizadas a nivel nacional', 'Solo mediante el banco vendedor'],
    explanation: 'Las reparaciones aprobadas pueden manejarse en repair facilities autorizadas en EE.UU.',
  },
  31: {
    question: '¿Qué vehículo debe tratarse como no elegible?',
    options: ['Un sedán 2016 con menos de 100,000 millas', 'Una SUV 2018 en buenas condiciones', 'Una truck 2015 sin warning lights', 'Un vehículo eléctrico 2020'],
    explanation: 'Los vehículos eléctricos están excluidos de cobertura.',
  },
  32: {
    question: '¿Cuál es el año más antiguo que todavía puede calificar?',
    options: ['2011', '2009', '2008', '2010'],
    explanation: 'Los vehículos fabricados antes de 2011 no pueden cubrirse.',
  },
  33: {
    question: '¿Qué debe confirmarse antes de hablar de opciones?',
    options: ['Que el cliente tenga el título disponible', 'Que el préstamo esté pagado', 'Que el vehículo esté funcionando actualmente', 'Que el cliente sepa el millaje exacto'],
    explanation: 'La condición de funcionamiento del vehículo es esencial para la elegibilidad.',
  },
  34: {
    question: '¿Qué es cierto sobre el seguro?',
    options: ['Reemplaza completamente la cobertura extendida', 'Cubre accidentes, no fallas mecánicas', 'Es lo mismo que factory warranty', 'Paga todo tipo de reparación'],
    explanation: 'El seguro y la cobertura extendida deben explicarse como productos separados.',
  },
  35: {
    question: '¿Cómo deben tratarse las partes modificadas?',
    options: ['Todas las partes modificadas siempre están cubiertas', 'Cualquier modificación descalifica todo el vehículo', 'Solo modificaciones del dealership están excluidas', 'Las partes modificadas no se cubren, pero otras partes pueden calificar'],
    explanation: 'Las partes modificadas están excluidas, pero el vehículo puede tener partes no modificadas elegibles.',
  },
  36: {
    question: '¿Qué significa “authorized repair facility”?',
    options: ['Un taller calificado aceptado por el plan', 'Solo el dealership donde se vendió el carro', 'Cualquier mecánico que el cliente elija', 'Solo un taller ubicado en Dallas'],
    explanation: 'El plan está diseñado para repair facilities autorizadas, no solo un dealership.',
  },
  37: {
    question: '¿Cuál es el primer paso en un flujo de transferencia limpio?',
    options: ['Confirmar la calificación del vehículo', 'Presentar al Service Advisor', 'Desconectar después de marcar', 'Elegir la disposición final'],
    explanation: 'La calificación va primero, especialmente la condición del vehículo.',
  },
  38: {
    question: '¿Qué debe pasar antes de que el opener marque la transferencia?',
    options: ['El cliente proporciona el VIN', 'El cliente da aprobación clara', 'El cliente acepta un precio cotizado', 'El SA confirma disponibilidad por chat'],
    explanation: 'Una transferencia limpia requiere aprobación del cliente antes de marcar.',
  },
  39: {
    question: '¿Quién debe hablar primero cuando el Service Advisor entra?',
    options: ['El opener inmediatamente', 'Solo el cliente', 'El Service Advisor', 'Nadie hasta que el timer termine'],
    explanation: 'El Service Advisor debe contestar y hablar primero antes de que el opener presente al cliente.',
  },
  40: {
    question: '¿Cuánto tiempo debe quedarse el opener después de que entra el SA?',
    options: ['Al menos 3 segundos', 'Exactamente 5 segundos', 'Hasta que el cliente pida salir', 'Al menos 15 segundos'],
    explanation: 'El opener debe quedarse al menos 15 segundos y confirmar que ambas partes están hablando.',
  },
  41: {
    question: '¿Qué debe hacer el opener si el SA queda en silencio por unos 5 segundos?',
    options: ['Desconectar y marcar la llamada como transferida', 'Decir “Hello Service Advisor” para llamar su atención', 'Decirle al cliente que llame luego', 'Mutear la línea hasta que alguien hable'],
    explanation: 'El opener debe llamar la atención del advisor para evitar hang-up y proteger la transferencia.',
  },
  42: {
    question: '¿Qué debe pasar si el cliente le pide callback al SA?',
    options: ['Marcar XFER porque el SA entró', 'Marcar SPANIS automáticamente', 'Marcar Call Back, no XFER', 'Marcar Dead Air'],
    explanation: 'Si el cliente pide callback con el SA, debe ser Call Back y no XFER.',
  },
  43: {
    question: 'Para una transferencia en español, ¿qué debe seleccionarse durante el proceso?',
    options: ['Blind Transfer antes de hablar con el SA', 'Hangup Both Lines apenas suene', 'Do Not Call antes de marcar al advisor', 'La opción Spanish antes de completar la transferencia'],
    explanation: 'Las transferencias en español requieren seleccionar la opción Spanish en el dialer.',
  },
  44: {
    question: 'En una llamada en español, ¿qué debe hacer el opener mientras espera al advisor?',
    options: ['Mantener al cliente engaged con preguntas ligeras del vehículo', 'Quedarse callado hasta que aparezca el advisor', 'Pedir detalles bancarios', 'Prometer que el precio será bajo'],
    explanation: 'Las waiting questions evitan dead air y mantienen conectado al cliente.',
  },
  45: {
    question: 'Para el protocolo de transferencia en español, ¿qué confirma que el handoff es seguro?',
    options: ['El opener escucha un solo ring', 'El opener ya presionó transfer', 'El advisor y el cliente están hablando activamente', 'El cliente dijo “hello” una vez'],
    explanation: 'Un handoff seguro requiere que ambas partes estén hablando activamente antes de salir.',
  },
  46: {
    question: 'En llamadas en español, ¿cuándo está mal marcar XFER?',
    options: ['Cuando advisor y cliente están conectados', 'Cuando el cliente cuelga antes de un handoff real', 'Cuando el opener esperó y presentó correctamente', 'Cuando el cliente aceptó claramente la transferencia'],
    explanation: 'Un hang-up antes de un handoff real no debe tratarse como XFER válido.',
  },
  47: {
    question: 'En llamadas en español, ¿qué debe anotar el opener si el SA tardó demasiado en responder?',
    options: ['Que el cliente rechazó toda cobertura', 'Que el opener saltó la introducción', 'Que el sistema creó un wrong number', 'Que el SA demoró la respuesta después de conectar'],
    explanation: 'Si la demora del SA generó riesgo, las notas deben explicar la respuesta tardía.',
  },
  48: {
    question: 'En llamadas en español, ¿cuál es el rol del opener durante la transferencia?',
    options: ['Conectar, presentar, esperar y verificar la conversación', 'Dar precio final y cerrar la venta', 'Salir inmediatamente después de presionar transfer', 'Rebatir objeciones mientras el SA habla'],
    explanation: 'El opener debe completar un handoff controlado, no abandonar la llamada.',
  },
  49: {
    question: '¿Qué frase deben evitar los agents?',
    options: ['Esto es gratis', 'Esta es una oportunidad para revisar opciones', 'El Service Advisor puede explicar los detalles', 'Déjeme verificar la condición del vehículo'],
    explanation: 'Los agents no deben usar “gratis/free” porque puede ser engañoso.',
  },
  50: {
    question: '¿Qué statement no está permitido?',
    options: ['Trabajamos con registros vehiculares', 'El banco nos dio su información', 'El Service Advisor revisa los detalles', 'Solo veo información financiera'],
    explanation: 'Los agents no deben decir que el banco dio la información.',
  },
  51: {
    question: '¿Qué comportamiento de delivery es requerido?',
    options: ['Acortar el script para ahorrar tiempo', 'Cambiar wording según preferencia', 'Leer el script sin improvisar', 'Saltar el vehicle condition check'],
    explanation: 'Cumplimiento del script significa no improvisar ni saltar pasos requeridos.',
  },
  52: {
    question: '¿Qué disposición corresponde a una transferencia en inglés completada?',
    options: ['SPXFER', 'SPANIS', 'CALLBK', 'XFER'],
    explanation: 'XFER se usa para una llamada en inglés transferida válidamente al Service Advisor.',
  },
  53: {
    question: '¿Qué pause code se usa cuando un supervisor pide una llamada?',
    options: ['RR', 'Manage', 'Lunch', 'Break'],
    explanation: 'Manage se usa cuando un supervisor pide que el agent llame o hable con ellos.',
  },
  54: {
    question: '¿Qué pause code corresponde al restroom?',
    options: ['CB', 'Tech', 'RR', 'Manage'],
    explanation: 'RR es el pause code de restroom.',
  },
  55: {
    question: 'Para una transferencia blind Spanish, ¿qué disposición debe usarse?',
    options: ['SPXFER', 'XFER', 'LANG', 'SPANIS'],
    explanation: 'Las blind Spanish transfers deben usar SPANIS, no SPXFER.',
  },
  56: {
    question: '¿Cuándo debe usarse SPXFER?',
    options: ['Cuando el rep transfiere directamente a un cliente en español con un Spanish closer', 'Cuando el cliente solo habla español y no hay transferencia', 'Cada vez que el opener escucha español en la línea', 'Cuando hay language barrier sin handoff'],
    explanation: 'SPXFER solo se usa para transferencia directa en español a un closer/advisor.',
  },
  57: {
    question: '¿Qué problema hay al usar SPXFER para blind Spanish routing?',
    options: ['Siempre mejora la precisión del reporte en español', 'Es obligatorio para todo Spanish speaker', 'Puede crear una disposición de transferencia incorrecta', 'Reemplaza la necesidad de notas'],
    explanation: 'Usar SPXFER para blind Spanish transfers es incorrecto y puede crear violations.',
  },
  58: {
    question: '¿Qué disposición corresponde a un cliente que pide llamada más tarde?',
    options: ['XFER', 'CALLBK', 'DNC', 'SPXFER'],
    explanation: 'CALLBK se usa cuando el cliente pide callback.',
  },
  59: {
    question: '¿Qué disposición corresponde a un cliente que pide ser removido de la lista?',
    options: ['NI', 'DAIR', 'BLANK', 'DNC'],
    explanation: 'DNC se usa cuando el cliente pide que no lo llamen más.',
  },
  60: {
    question: '¿Qué comportamiento evita mejor las transferencias inválidas?',
    options: ['Verificar condición, obtener aprobación, presentar correctamente y esperar', 'Transferir rápido y marcar XFER apenas suene la línea', 'Prometer una espera corta para que el cliente se quede', 'Salir de la llamada antes de que el advisor confirme el handoff'],
    explanation: 'Las transferencias limpias requieren verificación, aprobación, presentación correcta y espera.',
  },
  'ob-001': {
    question: 'El cliente dice: “No estoy interesado.” ¿Cuál es la respuesta más fuerte?',
    options: ['Entiendo. Muchas personas pensaban igual antes de ver los costos de reparación.', 'Entiendo. Puedo terminar la llamada y actualizar el archivo ahora.', 'Entiendo. El advisor igual tendrá que revisarlo hoy.', 'Entiendo. Puede decidir después de que termine todo el script.'],
    explanation: 'Reconoce la objeción, crea curiosidad y conecta con el valor frente a costos de reparación.',
  },
  'ob-002': {
    question: 'El cliente pregunta: “¿De dónde obtuvieron mi información?” Elige la dirección aprobada.',
    options: ['Trabajamos con dealerships y registros vehiculares a nivel nacional.', 'El banco nos envió el archivo después de revisar el préstamo.', 'Su dealership nos dio el registro para esta llamada.', 'El sistema asignó el número sin mostrar la fuente.'],
    explanation: 'No digas que el banco dio la información. Usa dealerships y registros vehiculares.',
  },
  'ob-003': {
    question: 'El cliente dice: “Ya tengo seguro.” ¿Qué debes aclarar?',
    options: ['El seguro cubre accidentes; esto es para fallas mecánicas.', 'El seguro trabaja con nosotros cuando se activa la póliza.', 'El seguro puede expirar si la cobertura no se revisa pronto.', 'El seguro cubre reparaciones, pero esto baja el deducible.'],
    explanation: 'Seguro y cobertura extendida son productos diferentes.',
  },
  'ob-004': {
    question: 'El cliente pregunta: “¿Cuánto cuesta?” ¿Cuál es el bridge más limpio?',
    options: ['Depende del millaje y hábitos de manejo; el advisor puede revisarlo.', 'Empieza bajo, y el advisor puede bajarlo aún más hoy.', 'Normalmente es más barato que el seguro, según el vehículo.', 'No es algo que pueda discutir hasta después de la transferencia.'],
    explanation: 'No des precios exactos. Haz bridge al Service Advisor para pricing.',
  },
  'ob-005': {
    question: 'El cliente pregunta: “¿Qué vehículo?” ¿Qué debe decir el opener?',
    options: ['Solo veo información financiera; el Service Advisor tiene los detalles completos.', 'Puedo ver el vehículo, pero necesito que el advisor confirme el modelo.', 'El vehículo aparece en el registro que recibimos para la llamada.', 'El vehículo exacto no importa hasta generar la cotización.'],
    explanation: 'Sé transparente: los openers ven información financiera, no todos los detalles del vehículo.',
  },
  'ob-006': {
    question: 'El cliente dice: “Estoy ocupado.” ¿Qué debes hacer?',
    options: ['Respetarlo y ofrecer una ventana de callback que le funcione mejor.', 'Continuar rápido porque la revisión solo toma un momento.', 'Transferir primero para que el advisor programe el callback.', 'Marcarlo not interested si no se queda en línea.'],
    explanation: 'No fuerces una transferencia con clientes ocupados. Ofrece callback.',
  },
  'ob-007': {
    question: 'El cliente dice: “Ya tengo cobertura.” ¿Cuál es la posición más segura?',
    options: ['Revisar si hay beneficios actualizados o adicionales disponibles.', 'Explicar que su plan actual probablemente no cubre suficiente.', 'Pedirle que cancele la cobertura actual antes de comparar.', 'Decir que la llamada es requerida aunque ya tenga cobertura.'],
    explanation: 'No ataques la cobertura existente. Preséntalo como revisión o comparación.',
  },
  'ob-008': {
    question: 'El cliente dice: “Ese no es mi vehículo.” ¿Qué debe pasar después?',
    options: ['Reconocer que la info puede estar desactualizada y verificar el vehículo actual.', 'Transferir de todos modos para que el advisor corrija el registro.', 'Decir que el registro del dealership suele ser más preciso.', 'Marcar wrong number y pasar al siguiente lead.'],
    explanation: 'La información del vehículo puede estar desactualizada. Redirige al vehículo actual cuando aplique.',
  },
  'ob-009': {
    question: 'Un cliente en español dice que solo habla español. ¿Qué debes hacer para una ruta blind Spanish?',
    options: ['Usar SPANIS cuando sea una ruta blind Spanish speaker.', 'Usar SPXFER porque el cliente habla español.', 'Usar XFER porque aún puede transferirse.', 'Usar LANG porque el opener no puede continuar en inglés.'],
    explanation: 'Las blind Spanish Xfers deben usar SPANIS, no SPXFER.',
  },
  'ob-010': {
    question: 'El cliente se pone grosero y usa profanity. ¿Cuál es la respuesta correcta?',
    options: ['Mantener la calma, pedir que pare y cerrar respetuosamente si continúa.', 'Subir un poco el tono para que entienda la advertencia.', 'Seguir rebatiendo hasta que dé una respuesta final.', 'Transferir antes de que el cliente cuelgue.'],
    explanation: 'Mantén profesionalismo y nunca discutas con el cliente.',
  },
  'sf-001': { question: 'Completa la apertura: “Hi, [client name], this is [your name] with the ____.”', options: ['Vehicle Services Group', 'Vehicle Warranty Center', 'Dealer Services Office', 'Coverage Review Team'], explanation: 'El nombre aprobado en la apertura es Vehicle Services Group.' },
  'sf-002': { question: 'Completa la línea: “We are calling about the vehicle you financed on ____.”', options: ['mes y año', 'préstamo y término', 'fecha y dirección', 'marca y modelo'], explanation: 'Usa el mes y año de financiamiento del formulario.' },
  'sf-003': { question: 'Completa la verificación: “Is your vehicle still in ____?”', options: ['buenas condiciones de funcionamiento', 'estatus activo de financiamiento', 'rango de factory warranty', 'el mismo estado registrado'], explanation: 'La condición de funcionamiento debe confirmarse antes de transferir.' },
  'sf-004': { question: 'Completa el transfer setup: “I would need to get you on with a ____.”', options: ['Service Advisor', 'coverage operator', 'verification agent', 'warranty specialist'], explanation: 'El rol correcto es Service Advisor.' },
  'sf-005': { question: 'Antes de transferir, el opener debe esperar que el cliente diga algo como ____.', options: ['okay o sure', 'maybe o later', 'wait o hold on', 'no o not now'], explanation: 'Transfiere solo después de aprobación clara del cliente.' },
  'sf-006': { question: 'Completa la introducción al SA: “Hello Service Advisor, I have ____ on the line.”', options: ['el nombre del cliente', 'el número de póliza', 'un warranty lead', 'una pregunta de precio'], explanation: 'Usa el nombre del cliente durante el handoff.' },
  'sf-007': { question: 'Completa la apertura en español: “Le habla [tu nombre] de ____.”', options: ['Grupo de Servicios Vehiculares', 'Centro de Garantías del Banco', 'Departamento del Concesionario', 'Equipo de Protección Nacional'], explanation: 'El script en español usa Grupo de Servicios Vehiculares.' },
  'sf-008': { question: 'Completa la línea en español: “Lo voy a comunicar con un ____.”', options: ['Asesor de Servicio', 'Agente de Banco', 'Supervisor de Cuenta', 'Representante de Ventas'], explanation: 'El término correcto en español es Asesor de Servicio.' },
  'sf-009': { question: 'Completa la regla de cumplimiento: “No debes ____ el script.”', options: ['acortar ni improvisar', 'repetir ni practicar', 'leer ni memorizar', 'pausar ni controlar'], explanation: 'Los agents no deben acortar ni improvisar el script oficial.' },
  'sf-010': { question: 'Completa la regla de espera: quedarse al menos ____ después de que entra el SA.', options: ['15 segundos', '5 segundos', '30 segundos', '60 segundos'], explanation: 'El opener debe quedarse al menos 15 segundos y confirmar que ambos hablan.' },
  'dt-001': { question: 'El cliente solo habla español y es una ruta blind Spanish. ¿Qué disposición corresponde?', options: ['SPANIS', 'SPXFER', 'XFER', 'LANG'], explanation: 'Las rutas blind Spanish usan SPANIS - Spanish Speaker.' },
  'dt-002': { question: 'Transfieres directamente un cliente en español a un Spanish closer. ¿Qué disposición corresponde?', options: ['SPXFER', 'SPANIS', 'CALLBK', 'LANG'], explanation: 'SPXFER solo es para transferencia directa en español a un closer.' },
  'dt-003': { question: 'El cliente pide ser removido de la lista de llamadas. ¿Qué disposición corresponde?', options: ['DNC', 'NI', 'DC', 'BLANK'], explanation: 'DNC es para solicitudes de removal.' },
  'dt-004': { question: 'El número ya no está en servicio. ¿Qué disposición corresponde?', options: ['DC', 'WRGNUM', 'DAIR', 'A'], explanation: 'DC significa disconnected number.' },
  'dt-005': { question: 'La llamada conecta, pero nadie responde. ¿Qué disposición corresponde?', options: ['DAIR', 'A', 'NI', 'CALLBK'], explanation: 'DAIR significa dead air.' },
  'dt-006': { question: 'El cliente pide recibir una llamada más tarde hoy. ¿Qué disposición corresponde?', options: ['CALLBK', 'NI', 'DNC', 'XFER'], explanation: 'Usa CALLBK cuando el cliente pide callback.' },
  'dt-007': { question: 'El número pertenece a alguien que no tiene relación con el archivo. ¿Qué disposición corresponde?', options: ['WRGNUM', 'WRGVEH', 'BLANK', 'LANG'], explanation: 'WRGNUM se usa para wrong number.' },
  'dt-008': { question: 'Los datos del vehículo no coinciden con el vehículo del cliente. ¿Qué disposición corresponde?', options: ['WRGVEH', 'WRGNUM', 'NI', 'DC'], explanation: 'WRGVEH significa wrong vehicle information.' },
  'dt-009': { question: 'La llamada cae en voicemail o answering machine. ¿Qué disposición corresponde?', options: ['A', 'DAIR', 'CALLBK', 'BLANK'], explanation: 'A es Answering Machine.' },
  'dt-010': { question: 'El cliente rechaza y no pide callback. ¿Qué disposición corresponde?', options: ['NI', 'CALLBK', 'DNC', 'XFER'], explanation: 'NI se usa cuando el cliente no está interesado.' },
  'vi-001': { question: 'El opener verificó que el vehículo funciona, obtuvo aprobación clara, presentó al cliente y esperó 15 segundos mientras ambos hablaban.', options: ['XFER válido', 'XFER inválido', 'Call Back', 'Solo SPANIS'], explanation: 'Esto sigue el proceso de transferencia limpio.' },
  'vi-002': { question: 'El opener transfirió antes de que el cliente aceptara claramente hablar con el Service Advisor.', options: ['XFER inválido', 'XFER válido', 'Call Back', 'Answering Machine'], explanation: 'La aprobación del cliente es requerida antes de transferir.' },
  'vi-003': { question: 'El SA entró y el cliente dijo que estaba ocupado y le pidió callback al SA.', options: ['Call Back', 'XFER válido', 'SPXFER', 'Not Interested'], explanation: 'Si el cliente pide callback con el SA, no debe marcarse como XFER.' },
  'vi-004': { question: 'El cliente colgó después de que el SA empezó a hablar, antes de que hubiera una conversación real.', options: ['Call Back', 'XFER válido', 'DNC', 'Wrong Vehicle'], explanation: 'Si el handoff no se completó limpiamente, evita marcarlo como XFER.' },
  'vi-005': { question: 'El opener saltó la pregunta de running condition y transfirió después de que el cliente dijo “okay”.', options: ['XFER inválido', 'XFER válido', 'Call Back', 'Wrong Number'], explanation: 'La condición del vehículo debe verificarse antes de transferir.' },
  'vi-006': { question: 'El SA no habló después de 5 segundos, así que el opener dijo “Hello Service Advisor” para evitar dead air.', options: ['Proceso correcto', 'Acción inválida', 'Usar SPANIS', 'Terminar la llamada'], explanation: 'Llamar la atención del SA después del silencio ayuda a evitar hang-ups.' },
  'vi-007': { question: 'El opener prometió que la transferencia tomaría “solo unos minutos” antes de hablar con el SA.', options: ['Riesgo de inválido', 'Proceso válido', 'Rebuttal correcto', 'Línea requerida'], explanation: 'No prometas tiempos específicos antes de que el SA hable.' },
  'vi-008': { question: 'El rep usó SPXFER para un blind Spanish speaker que no fue transferido directamente a un Spanish closer.', options: ['Disposición incorrecta', 'Disposición correcta', 'XFER válido', 'Factory review'], explanation: 'Las rutas blind Spanish deben usar SPANIS, no SPXFER.' },
  'vi-009': { question: 'El cliente confirmó que el vehículo tiene warning lights y problemas mecánicos actuales antes de transferir.', options: ['No transferir', 'Transferir normalmente', 'Usar solo XFER', 'Usar SPXFER'], explanation: 'Problemas mecánicos actuales pueden afectar la elegibilidad; no procede como transferencia limpia.' },
  'vi-010': { question: 'El opener presentó al cliente con el SA, pero salió inmediatamente antes de confirmar que ambos hablaban.', options: ['Riesgo de inválido', 'XFER válido', 'Atajo correcto', 'Proceso de callback'], explanation: 'El opener debe quedarse lo suficiente para confirmar un handoff limpio.' },
  'tp-001': { question: 'Arma el orden correcto de una transferencia limpia.', steps: ['Confirmar calificación del vehículo', 'Obtener aprobación del cliente para transferir', 'Iniciar la transferencia y quedarse en línea', 'Esperar a que el Service Advisor hable primero', 'Presentar al cliente por nombre', 'Quedarse al menos 15 segundos y confirmar que ambos hablan'], explanation: 'Un handoff válido requiere calificación, aprobación, conexión con SA, presentación correcta y tiempo suficiente de espera.' },
  'tp-002': { question: 'Ordena las primeras cuatro acciones principales del script.', steps: ['Saludar al cliente e identificarte', 'Mencionar el mes y año de financiamiento', 'Dar la línea de propósito de garantía extendida', 'Preguntar si el vehículo está en buenas condiciones'], explanation: 'El script debe moverse de intro, a referencia financiera, a propósito, a elegibilidad.' },
  'tp-003': { question: 'Ordena las acciones de handoff con el SA.', steps: ['El cliente da aprobación', 'Marcar al Service Advisor', 'Esperar a que el advisor hable primero', 'Presentar claramente al cliente', 'Quedarse y confirmar que la conversación empezó'], explanation: 'No presentes antes de que el advisor hable y no salgas demasiado temprano.' },
  'tp-004': { question: 'Ordena el flujo de transferencia en español.', steps: ['Verificar que el vehículo esté funcionando bien', 'Decirle al cliente que lo presentarás con un Asesor de Servicio', 'Esperar aprobación del cliente', 'Seleccionar la ruta correcta de Spanish transfer', 'Esperar al advisor y presentar al cliente'], explanation: 'Las transferencias en español también requieren verificación, aprobación y presentación limpia al advisor.' },
  'tp-005': { question: 'Ordena el proceso cuando el SA queda en silencio después de conectar.', steps: ['Quedarse en la llamada de 3 vías', 'Esperar brevemente a que el SA responda', 'Decir “Hello Service Advisor” si no responde', 'Completar la introducción cuando el SA responda', 'Agregar nota de que el SA tardó más de lo esperado'], explanation: 'Llamar la atención del advisor después del silencio protege la llamada y ayuda a documentar.' },
  'rp-001': { customer: '¿Quién habla? No reconozco este número.', question: 'Elige la mejor respuesta del opener.', options: ['Le habla [tu nombre] de Vehicle Services Group.', 'Es la oficina de garantías llamando por su cuenta.', 'Es una revisión requerida para su vehículo financiado.', 'Somos la compañía que maneja su plan vehicular.'], explanation: 'Bien. Te identificaste sin exagerar ni sonar sospechoso.' },
  'rp-002': { customer: 'Ya le dije a alguien que no estaba interesado.', question: 'Elige la mejor forma de reabrir la conversación.', options: ['Entiendo. Su cuenta puede tener opciones actualizadas ahora.', 'Entiendo. Esta vez el advisor puede explicarlo mejor.', 'Entiendo. El archivo requiere una revisión final.', 'Entiendo. Seré breve y lo transfiero ahora.'], explanation: 'Bien. Esto da una razón para la nueva llamada sin presionar al cliente.' },
  'rp-003': { customer: '¿De qué vehículo me habla?', question: 'Elige la respuesta más segura.', options: ['Solo veo información financiera, no la marca o modelo exacto.', 'Debe ser el vehículo conectado a su registro más reciente.', 'El advisor lo sabrá cuando lo transfiera.', 'Es el vehículo conectado con su pago mensual.'], explanation: 'Bien. Eres honesto sobre lo que puedes ver y guías hacia el advisor.' },
  'rp-004': { customer: 'Está bien, pero solo tengo un minuto.', question: 'Elige el siguiente paso más limpio.', options: ['Confirmar aprobación y evitar prometer tiempo exacto.', 'Prometer que tomará menos de un minuto.', 'Transferir inmediatamente antes de que cambie de opinión.', 'Saltar la pregunta de condición del vehículo para ahorrar tiempo.'], explanation: 'Bien. No prometas tiempo ni saltes verificaciones requeridas.' },
  'rp-005': { customer: 'Quíteme de su lista.', question: 'Elige el manejo correcto.', options: ['Confirmar la remoción de forma educada y usar DNC.', 'Hacer una pregunta más antes de removerlo.', 'Usar NI porque no está interesado.', 'Transferir al advisor para la remoción.'], explanation: 'Bien. Las solicitudes de removal se manejan profesionalmente y se marcan DNC.' },
  'rp-006': { customer: 'Ya tengo seguro full coverage.', question: 'Elige la mejor explicación del producto.', options: ['El seguro cubre accidentes; esto cubre fallas mecánicas.', 'El seguro ayuda con claims; esto baja el costo del seguro.', 'El seguro es requerido; esto es requerido para vehículos financiados.', 'El seguro y la cobertura extendida funcionan igual.'], explanation: 'Bien. Una diferencia clara del producto evita confusión y objeciones.' },
  'rp-007': { customer: 'Cliente en español necesita ruta, pero no hay transferencia directa a Spanish closer.', question: 'Elige la lógica correcta de disposición.', options: ['Usar SPANIS porque es una ruta blind Spanish speaker.', 'Usar SPXFER porque el cliente habla español.', 'Usar LANG porque no fue posible en inglés.', 'Usar XFER porque puede transferirse después.'], explanation: 'Bien. SPXFER solo es para transferencia directa en español a un closer.' },
  'rp-008': { customer: 'El Service Advisor entra, pero queda en silencio varios segundos.', question: 'Elige la mejor acción del opener.', options: ['Decir “Hello Service Advisor” y continuar el handoff.', 'Colgar rápido para dejar al cliente con el advisor.', 'Decirle al cliente que el advisor está ocupado y marcar XFER.', 'Reiniciar la transferencia sin decirle nada al SA.'], explanation: 'Bien. Llama la atención del SA para evitar dead air y documenta si es necesario.' },
}

function resolveDisplayLanguage(raw, languageMode, index = 0) {
  const language = normalizeLanguage(languageMode)
  if (language === 'en') return 'en'
  if (language === 'es') return 'es'
  return index % 2 === 0 ? 'en' : 'es'
}

function localizeQuestion(raw, languageMode, index = 0) {
  const displayLanguage = resolveDisplayLanguage(raw, languageMode, index)
  if (displayLanguage !== 'es') return raw

  const translated = SPANISH_TEXT[raw.id]
  if (!translated) return raw

  return {
    ...raw,
    ...translated,
    language: 'es',
    options: translated.options || raw.options,
    steps: translated.steps || raw.steps,
    explanation: translated.explanation || translated.outcome || raw.explanation || raw.outcome,
    outcome: translated.outcome || translated.explanation || raw.outcome,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalizeTopic(raw) {
  const value = (raw || 'all').toLowerCase()

  if (value === 'all') return 'all'
  if (value === 'script') return 'script'
  if (value === 'objections') return 'objections'
  if (value === 'product') return 'product'
  if (value === 'product-knowledge') return 'product'
  if (value === 'callflow') return 'callflow'
  if (value === 'call-flow') return 'callflow'
  if (value === 'dosdonts') return 'dosdonts'
  if (value === 'dos-donts') return 'dosdonts'
  if (value === 'dosdонts') return 'dosdonts'

  return 'all'
}

function normalizeLanguage(raw) {
  const value = (raw || 'mixed').toLowerCase()
  if (value === 'english') return 'en'
  if (value === 'spanish') return 'es'
  if (value === 'en') return 'en'
  if (value === 'es') return 'es'
  return 'mixed'
}

function normalizeMode(raw) {
  const value = (raw || 'classic').toLowerCase()
  const valid = [
    'classic',
    'objection-battle',
    'script-fill',
    'transfer-protocol',
    'disposition-trainer',
    'valid-invalid',
    'speed-round',
    'certification',
    'roleplay',
  ]

  return valid.includes(value) ? value : 'classic'
}

function getModeMeta(modeId) {
  return gameModes.find((mode) => mode.id === modeId) || gameModes.find((mode) => mode.id === 'classic') || {
    id: 'classic',
    label: 'Classic Quiz',
    icon: '🧠',
  }
}

function getQuestionCount(modeId) {
  if (modeId === 'speed-round') return SPEED_COUNT
  if (modeId === 'certification') return CERTIFICATION_COUNT
  if (modeId === 'transfer-protocol') return 5
  if (modeId === 'roleplay') return 8
  return CLASSIC_COUNT
}

function getTimePerQuestion(modeId) {
  if (modeId === 'speed-round') return SPEED_TIME
  return DEFAULT_TIME
}

function filterByLanguage(pool, languageMode) {
  const language = normalizeLanguage(languageMode)
  if (language === 'mixed') return pool

  const exact = pool.filter((q) => q.language === language)
  if (exact.length > 0) return exact

  return pool
}

function filterClassicPool(topicId, languageMode) {
  const topic = normalizeTopic(topicId)
  const byTopic = topic === 'all'
    ? quizQuestions
    : quizQuestions.filter((q) => q.topic === topic)

  const language = normalizeLanguage(languageMode)
  if (language === 'mixed') return byTopic

  const exact = byTopic.filter((q) => q.language === language)
  if (exact.length >= CLASSIC_COUNT) return exact

  const fill = byTopic.filter((q) => !exact.some((picked) => picked.id === q.id))
  return [...exact, ...fill]
}

function toMultipleChoice(raw, index, languageMode = 'mixed') {
  const localized = localizeQuestion(raw, languageMode, index)
  const mappedOptions = localized.options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }))

  const shuffledOptions = shuffle(mappedOptions)
  const correctIndex = shuffledOptions.findIndex((opt) => opt.originalIndex === localized.correct)

  return {
    ...localized,
    roundId: `${localized.id}-${index}`,
    kind: 'multiple-choice',
    options: shuffledOptions.map((opt) => opt.text),
    correctIndex,
  }
}

function toOrderQuestion(raw, index, languageMode = 'mixed') {
  const localized = localizeQuestion(raw, languageMode, index)
  const shuffledSteps = shuffle(
    localized.steps.map((text, originalIndex) => ({
      text,
      originalIndex,
    }))
  )

  return {
    ...localized,
    roundId: `${localized.id}-${index}`,
    kind: 'order',
    shuffledSteps,
  }
}

function buildQuestions(modeId, topicId, languageMode) {
  const mode = normalizeMode(modeId)
  const count = getQuestionCount(mode)

  if (mode === 'classic') {
    const pool = filterClassicPool(topicId, languageMode)
    let finalPool = [...pool]

    if (finalPool.length < count) {
      const remaining = quizQuestions.filter((q) => !finalPool.some((picked) => picked.id === q.id))
      finalPool = [...finalPool, ...shuffle(remaining)]
    }

    return shuffle(finalPool).slice(0, count).map((q, i) => toMultipleChoice(q, i, languageMode))
  }

  if (mode === 'speed-round') {
    const speedPool = quizQuestions.filter((q) => [
      'script',
      'callflow',
      'dosdonts',
      'product',
    ].includes(q.topic))

    return shuffle(filterByLanguage(speedPool, languageMode))
      .slice(0, count)
      .map((q, i) => toMultipleChoice(q, i, languageMode))
  }

  if (mode === 'certification') {
    const certifiedPool = filterByLanguage(quizQuestions, languageMode)
    const base = certifiedPool.length >= count ? certifiedPool : quizQuestions
    return shuffle(base).slice(0, count).map((q, i) => toMultipleChoice(q, i, languageMode))
  }

  if (mode === 'transfer-protocol') {
    return shuffle(filterByLanguage(gameChallengeBank['transfer-protocol'] || [], languageMode))
      .slice(0, count)
      .map((q, i) => toOrderQuestion(q, i, languageMode))
  }

  const challengePool = filterByLanguage(gameChallengeBank[mode] || [], languageMode)
  const base = challengePool.length > 0 ? challengePool : quizQuestions

  return shuffle(base).slice(0, count).map((q, i) => toMultipleChoice(q, i, languageMode))
}

function getQuestionTitle(q, modeId) {
  if (modeId === 'roleplay') return q.customer || q.question
  return q.question
}

function getExplanation(q, modeId) {
  if (modeId === 'roleplay') return q.outcome || q.explanation
  return q.explanation
}

function getScoreLabel(modeId, pct) {
  if (modeId === 'certification') {
    return pct >= 80
      ? { label: '🏅 Certified!', color: '#22c55e' }
      : { label: '📚 Not Certified Yet', color: '#ef4444' }
  }

  if (pct >= 85) return { label: '🔥 Elite!', color: '#22c55e' }
  if (pct >= 70) return { label: '🎉 Strong!', color: '#38bdf8' }
  if (pct >= 60) return { label: '👍 Good Job', color: '#f97316' }
  return { label: '📚 Keep Studying', color: '#ef4444' }
}

function getWeakTopics(questions, results) {
  const missed = questions.filter((_, index) => results[index] && !results[index].correct)
  const counts = missed.reduce((acc, q) => {
    const key = q.topic || 'general'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic)
}

// ── Web Audio sounds ──
function useSound() {
  const ctx = useRef(null)

  const getCtx = () => {
    if (!ctx.current) {
      ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    return ctx.current
  }

  const beep = (freq, dur, type = 'sine', vol = 0.3) => {
    try {
      const ac = getCtx()
      const o = ac.createOscillator()
      const g = ac.createGain()

      o.connect(g)
      g.connect(ac.destination)

      o.frequency.value = freq
      o.type = type

      g.gain.setValueAtTime(vol, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)

      o.start()
      o.stop(ac.currentTime + dur)
    } catch {}
  }

  return useMemo(() => ({
    correct: () => {
      beep(600, 0.1)
      setTimeout(() => beep(900, 0.15), 100)
    },
    wrong: () => beep(180, 0.4, 'sawtooth', 0.2),
    tick: () => beep(440, 0.05, 'square', 0.15),
    timeout: () => beep(220, 0.5, 'triangle', 0.2),
    start: () => {
      beep(400, 0.08)
      setTimeout(() => beep(500, 0.08), 100)
      setTimeout(() => beep(700, 0.15), 200)
    },
  }), [])
}

export default function GoQuizPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const modeId = normalizeMode(params.get('mode'))
  const topicId = params.get('topic') || 'all'
  const languageMode = params.get('lang') || 'mixed'
  const sound = useSound()

  const [questions] = useState(() => buildQuestions(modeId, topicId, languageMode))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [orderSelection, setOrderSelection] = useState([])
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getTimePerQuestion(modeId))
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const timerRef = useRef(null)
  const started = useRef(false)

  const q = questions[idx]
  const totalQuestions = questions.length || getQuestionCount(modeId)
  const score = results.filter((r) => r.correct).length
  const modeMeta = getModeMeta(modeId)
  const timePerQ = getTimePerQuestion(modeId)

  useEffect(() => {
    if (!started.current) {
      sound.start()
      started.current = true
    }
  }, [])

  const recordResult = useCallback((payload) => {
    setResults((prev) => [...prev, payload])
  }, [])

  const doTimeout = useCallback(() => {
    if (answered) return

    sound.timeout()
    setAnswered(true)
    setShowExplanation(true)
    recordResult({ correct: false, timedOut: true, topic: q?.topic })
  }, [answered, q?.topic, recordResult, sound])

  useEffect(() => {
    if (done || answered) {
      clearInterval(timerRef.current)
      return
    }

    setTimeLeft(timePerQ)

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 6 && t > 1) sound.tick()

        if (t <= 1) {
          clearInterval(timerRef.current)
          doTimeout()
          return 0
        }

        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [idx, done, answered, doTimeout, sound, timePerQ])

  const handleSelect = (i) => {
    if (answered || !q) return

    clearInterval(timerRef.current)
    setSelected(i)
    setAnswered(true)
    setShowExplanation(true)

    const correct = i === q.correctIndex

    if (correct) sound.correct()
    else sound.wrong()

    recordResult({ correct, topic: q.topic })
  }

  const handleOrderPick = (step) => {
    if (answered) return

    setOrderSelection((prev) => {
      if (prev.some((item) => item.originalIndex === step.originalIndex)) return prev
      return [...prev, step]
    })
  }

  const handleOrderUndo = () => {
    if (answered) return
    setOrderSelection((prev) => prev.slice(0, -1))
  }

  const handleOrderSubmit = () => {
    if (answered || !q || orderSelection.length !== q.shuffledSteps.length) return

    clearInterval(timerRef.current)
    setAnswered(true)
    setShowExplanation(true)

    const correct = orderSelection.every((step, index) => step.originalIndex === index)

    if (correct) sound.correct()
    else sound.wrong()

    recordResult({ correct, topic: q.topic })
  }

  const handleNext = () => {
    if (idx + 1 >= totalQuestions) {
      setDone(true)
      return
    }

    setIdx((prev) => prev + 1)
    setSelected(null)
    setOrderSelection([])
    setAnswered(false)
    setShowExplanation(false)
  }

  const timerPct = (timeLeft / timePerQ) * 100
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316'

  if (!q) {
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>
        </nav>
        <div className="gqp-results">
          <div className="gqp-results-grade">No questions found</div>
          <button className="gqp-btn-primary" onClick={() => navigate('/go/quiz')}>Back to Games</button>
        </div>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((score / totalQuestions) * 100)
    const grade = getScoreLabel(modeId, pct)
    const weakTopics = getWeakTopics(questions, results)

    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>
        </nav>

        <div className="gqp-results">
          <div className="gqp-results-mode">{modeMeta.icon} {modeMeta.label}</div>
          <div className="gqp-results-score" style={{ color: grade.color }}>{pct}%</div>
          <div className="gqp-results-grade" style={{ color: grade.color }}>{grade.label}</div>

          <div className="gqp-results-row">
            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#22c55e' }}>{score}</span>
              <span className="gqp-results-lbl">Correct</span>
            </div>

            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#ef4444' }}>{totalQuestions - score}</span>
              <span className="gqp-results-lbl">Missed</span>
            </div>

            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#6b7280' }}>{totalQuestions}</span>
              <span className="gqp-results-lbl">Total</span>
            </div>
          </div>

          {modeId === 'certification' && (
            <div className="gqp-cert-box">
              <strong>{pct >= 80 ? 'Passed certification' : 'Needs another review'}</strong>
              <span>Passing score: 80%</span>
            </div>
          )}

          {weakTopics.length > 0 && (
            <div className="gqp-weak-box">
              <strong>Review next:</strong>
              <span>{weakTopics.join(' • ')}</span>
            </div>
          )}

          <div className="gqp-results-actions">
            <button className="gqp-btn-primary" onClick={() => window.location.reload()}>🔄 Try Again</button>
            <button className="gqp-btn-outline" onClick={() => navigate('/go/quiz')}>Change Game</button>
            <button className="gqp-btn-outline" onClick={() => navigate('/go/learn')}>📚 Review</button>
          </div>
        </div>
      </div>
    )
  }

  const answerWasCorrect = selected === q.correctIndex
  const explanation = getExplanation(q, modeId)

  return (
    <div className="gqp-page">
      <nav className="gqp-nav">
        <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gqp-nav-text">Pulse</span>
          <span className="gqp-nav-badge">GO</span>
        </div>

        <div className="gqp-nav-meta">
          <span className="gqp-nav-mode">{modeMeta.icon} {modeMeta.label}</span>
          <span className="gqp-nav-counter">{idx + 1} / {totalQuestions}</span>
          <span className="gqp-nav-timer" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>

        <button className="gqp-nav-exit" onClick={() => navigate('/go/quiz')}>✕ Exit</button>
      </nav>

      <div className="gqp-timer-bar">
        <div className="gqp-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      <div className="gqp-dots">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`gqp-dot ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}
          />
        ))}
      </div>

      <main className={`gqp-card ${q.kind === 'order' ? 'is-order' : ''}`}>
        <div className="gqp-topic-badge">{q.topic || modeId}</div>

        {modeId === 'roleplay' && q.customer && (
          <div className="gqp-customer-line">
            <span>Customer says</span>
            <strong>“{q.customer}”</strong>
          </div>
        )}

        <h1 className="gqp-question">{getQuestionTitle(q, modeId)}</h1>

        {modeId === 'roleplay' && q.customer && (
          <p className="gqp-roleplay-prompt">{q.question}</p>
        )}

        {q.kind === 'order' ? (
          <>
            <div className="gqp-order-layout">
              <section className="gqp-order-pool">
                <h3>Available steps</h3>
                {q.shuffledSteps.map((step) => {
                  const used = orderSelection.some((item) => item.originalIndex === step.originalIndex)
                  return (
                    <button
                      key={step.originalIndex}
                      className={`gqp-order-step ${used ? 'used' : ''}`}
                      onClick={() => handleOrderPick(step)}
                      disabled={used || answered}
                    >
                      {step.text}
                    </button>
                  )
                })}
              </section>

              <section className="gqp-order-answer">
                <h3>Your order</h3>
                {orderSelection.length === 0 && <p className="gqp-order-empty">Pick the steps in the correct sequence.</p>}
                {orderSelection.map((step, index) => (
                  <div key={`${step.originalIndex}-${index}`} className="gqp-order-picked">
                    <span>{index + 1}</span>
                    <p>{step.text}</p>
                  </div>
                ))}
              </section>
            </div>

            {!answered && (
              <div className="gqp-order-actions">
                <button className="gqp-btn-outline" onClick={handleOrderUndo} disabled={orderSelection.length === 0}>Undo</button>
                <button
                  className="gqp-btn-primary"
                  onClick={handleOrderSubmit}
                  disabled={orderSelection.length !== q.shuffledSteps.length}
                >
                  Submit Order
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="gqp-options">
            {q.options.map((opt, i) => {
              const style = OPTION_STYLES[i] || OPTION_STYLES[0]
              const isCorrectOption = i === q.correctIndex
              const isSelected = selected === i
              const reveal = answered
              let stateClass = ''

              if (reveal && isCorrectOption) stateClass = 'correct'
              else if (reveal && isSelected && !isCorrectOption) stateClass = 'wrong'
              else if (reveal) stateClass = 'dim'

              return (
                <button
                  key={i}
                  className={`gqp-option ${stateClass}`}
                  style={{ '--opt-color': style.color }}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                >
                  <span className="gqp-option-shape">{style.shape}</span>
                  <span className="gqp-option-letter">{LETTERS[i]}</span>
                  <span className="gqp-option-text">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {showExplanation && (
          <div className={`gqp-explanation ${(answerWasCorrect || (q.kind === 'order' && results[results.length - 1]?.correct)) ? 'ok' : 'no'}`}>
            <strong>
              {(answerWasCorrect || (q.kind === 'order' && results[results.length - 1]?.correct)) ? '✅ Correct' : '❌ Review this'}
            </strong>
            <p>{explanation || 'Review the related training section before trying again.'}</p>

            {q.kind === 'order' && (
              <div className="gqp-correct-order">
                <b>Correct order:</b>
                {q.steps.map((step, index) => (
                  <span key={step}>{index + 1}. {step}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {answered && (
          <button className="gqp-next" onClick={handleNext}>
            {idx + 1 >= totalQuestions ? 'See Results →' : 'Next →'}
          </button>
        )}
      </main>
    </div>
  )
}
