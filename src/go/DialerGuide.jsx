import './DialerGuide.css'

const DIALER_COPY = {
  en: {
    hero: {
      eyebrow: 'DIALER ONBOARDING',
      title: 'Dialer Guide',
      description:
        'Follow the process in order, from validating your connection to selecting the correct call disposition.',
    },

    validateIp: {
      eyebrow: 'BEFORE YOU START',
      title: 'Validate your IP',
      description:
        'Your connection must be validated before you can log in to VICIdial.',
      steps: [
        'Open the IP validation page provided by the company.',
        'Ask your supervisor or team leader for the assigned validation credentials.',
        'Enter only the credentials they provide.',
        'Confirm that the validation was completed successfully before continuing.',
      ],
      noteTitle: 'Credentials',
      note:
        'Do not use the example credentials shown in training images. Your supervisor or team leader will provide the correct information.',
    },

    login: {
      eyebrow: 'LOGIN',
      title: 'Log in to VICIdial',
      description:
        'Complete these three steps using the login information assigned to you.',
      steps: [
        {
          number: '01',
          title: 'Open Agent Login',
          description:
            'On the VICIdial welcome screen, select Agent Login.',
          image: '/training/vici-welcome.png',
          alt: 'VICIdial welcome screen showing Agent Login',
          instructions: [
            'Open the VICIdial welcome page.',
            'Click Agent Login.',
          ],
        },
        {
          number: '02',
          title: 'Enter phone credentials',
          description:
            'Enter the phone login and phone password assigned to you.',
          image: '/training/vici-phone-login.png',
          alt: 'VICIdial phone login screen',
          instructions: [
            'Enter your assigned Phone Login.',
            'Enter your assigned Phone Password.',
            'Click Submit.',
          ],
        },
        {
          number: '03',
          title: 'Select your campaign',
          description:
            'Use your agent credentials and select the campaign assigned by management.',
          image: '/training/vici-campaign-login.png',
          alt: 'VICIdial campaign login screen',
          instructions: [
            'Enter your assigned User Login.',
            'Enter your assigned User Password.',
            'Select the campaign assigned to you, normally OP2 or OP3.',
            'Click Submit.',
          ],
        },
      ],
    },

    active: {
      eyebrow: 'READY FOR CALLS',
      title: 'Go active',
      description:
        'Once VICIdial finishes loading, confirm that you are active and ready to receive calls.',
      steps: [
        'Check the status displayed on the left side of the dialer.',
        'If the screen says You Are Paused, click the option to go active.',
        'Confirm that your status changes before waiting for calls.',
        'Do not remain paused unless you are using an approved pause code.',
      ],
    },

    transferEnglish: {
      eyebrow: 'CALL TRANSFER',
      title: 'How to transfer — English',
      description:
        'Use this process when transferring an English-speaking customer to a Service Advisor.',
      steps: [
        'Click Transfer-Conf.',
        'Dial or select the assigned English transfer route.',
        'Wait for the Service Advisor to answer and speak first.',
        'Introduce the customer only after the Service Advisor responds.',
        'Stay on the line and confirm that both sides are actively talking.',
        'Remain connected for at least 15 seconds before leaving.',
      ],
    },

    transferSpanish: {
      eyebrow: 'CALL TRANSFER',
      title: 'How to transfer — Spanish',
      description:
        'Use the Spanish transfer route when the customer needs a Spanish-speaking Service Advisor.',
      steps: [
        'Click Transfer-Conf.',
        'Select or dial the assigned Spanish transfer route.',
        'Wait for the Spanish-speaking Service Advisor to answer first.',
        'Do not introduce the customer before the Service Advisor speaks.',
        'Confirm that the customer and Service Advisor are communicating.',
        'Remain connected long enough to confirm a clean handoff.',
      ],
    },

    lead: {
      eyebrow: 'CUSTOMER INFORMATION',
      title: 'How to read a lead',
      description:
        'Review the important fields before and during the call so you can explain the financing information correctly.',
      fields: [
        {
          label: 'Loan Monthly Cost',
          value: 'The customer’s monthly payment.',
        },
        {
          label: 'Origination Date',
          value: 'The month, day, and year when the loan started.',
        },
        {
          label: 'Loan Balance',
          value: 'The current or total remaining loan amount.',
        },
        {
          label: 'Vehicle information',
          value:
            'Review the vehicle year, make, model, mileage, and basic customer information.',
        },
      ],
    },

    pauses: {
      eyebrow: 'DIALER STATUS',
      title: 'Pause codes',
      description:
        'Use only the pause code that accurately represents what you are doing.',
      steps: [
        'BREAK is only for an approved scheduled break.',
        'CB is used when working on callbacks.',
        'LUNCH is only for the approved lunch period.',
        'MANAGE is used when management asks you to complete another task.',
        'RR is only for restroom time.',
        'TECH is used for approved technical or system issues.',
      ],
    },

    dispositions: {
      eyebrow: 'CALL RESULT',
      title: 'Call dispositions',
      description:
        'Select the disposition that accurately represents the final result of the call.',
      quickTitle: 'Quick disposition reference',
      quickText:
        'Use the call disposition window to select the correct outcome after every call.',
      fullTitle: 'Full disposition list',
      fullText:
        'Review the complete list when you are unsure which option applies. Ask a supervisor before selecting an incorrect result.',
    },
  },

  es: {
    hero: {
      eyebrow: 'ENTRENAMIENTO DEL DIALER',
      title: 'Guía del Dialer',
      description:
        'Sigue el proceso en orden, desde validar tu conexión hasta seleccionar la disposición correcta de la llamada.',
    },

    validateIp: {
      eyebrow: 'ANTES DE EMPEZAR',
      title: 'Valida tu IP',
      description:
        'Tu conexión debe estar validada antes de poder iniciar sesión en VICIdial.',
      steps: [
        'Abre la página de validación de IP proporcionada por la compañía.',
        'Pídele a tu supervisor o team leader los datos de validación asignados.',
        'Ingresa únicamente las credenciales que te proporcionen.',
        'Confirma que la validación fue exitosa antes de continuar.',
      ],
      noteTitle: 'Credenciales',
      note:
        'No uses las credenciales de ejemplo que aparecen en las imágenes de entrenamiento. Tu supervisor o team leader te dará la información correcta.',
    },

    login: {
      eyebrow: 'INICIO DE SESIÓN',
      title: 'Inicia sesión en VICIdial',
      description:
        'Completa estos tres pasos usando la información de acceso que te fue asignada.',
      steps: [
        {
          number: '01',
          title: 'Abre Agent Login',
          description:
            'En la pantalla de bienvenida de VICIdial, selecciona Agent Login.',
          image: '/training/vici-welcome.png',
          alt: 'Pantalla de bienvenida de VICIdial mostrando Agent Login',
          instructions: [
            'Abre la página de bienvenida de VICIdial.',
            'Haz clic en Agent Login.',
          ],
        },
        {
          number: '02',
          title: 'Ingresa los datos del teléfono',
          description:
            'Usa el phone login y phone password que te fueron asignados.',
          image: '/training/vici-phone-login.png',
          alt: 'Pantalla de phone login de VICIdial',
          instructions: [
            'Ingresa tu Phone Login asignado.',
            'Ingresa tu Phone Password asignado.',
            'Haz clic en Submit.',
          ],
        },
        {
          number: '03',
          title: 'Selecciona tu campaña',
          description:
            'Usa tus credenciales de agente y selecciona la campaña asignada por management.',
          image: '/training/vici-campaign-login.png',
          alt: 'Pantalla de selección de campaña de VICIdial',
          instructions: [
            'Ingresa tu User Login asignado.',
            'Ingresa tu User Password asignado.',
            'Selecciona la campaña que te asignaron, normalmente OP2 u OP3.',
            'Haz clic en Submit.',
          ],
        },
      ],
    },

    active: {
      eyebrow: 'LISTO PARA LLAMADAS',
      title: 'Ponte activo',
      description:
        'Cuando VICIdial termine de cargar, confirma que estás activo y listo para recibir llamadas.',
      steps: [
        'Revisa el estado que aparece en el lado izquierdo del dialer.',
        'Si la pantalla muestra You Are Paused, selecciona la opción para ponerte activo.',
        'Confirma que tu estado cambió antes de esperar llamadas.',
        'No permanezcas en pausa a menos que estés usando un código autorizado.',
      ],
    },

    transferEnglish: {
      eyebrow: 'TRANSFERENCIA',
      title: 'Cómo transferir — Inglés',
      description:
        'Usa este proceso para transferir a un cliente que continuará en inglés con el Service Advisor.',
      steps: [
        'Haz clic en Transfer-Conf.',
        'Marca o selecciona la ruta de transferencia en inglés asignada.',
        'Espera a que el Service Advisor conteste y hable primero.',
        'Presenta al cliente únicamente después de que el Service Advisor responda.',
        'Permanece en línea y confirma que ambos estén hablando activamente.',
        'Espera al menos 15 segundos antes de salir de la llamada.',
      ],
    },

    transferSpanish: {
      eyebrow: 'TRANSFERENCIA',
      title: 'Cómo transferir — Español',
      description:
        'Usa la ruta de español cuando el cliente necesite un Service Advisor que hable español.',
      steps: [
        'Haz clic en Transfer-Conf.',
        'Selecciona o marca la ruta de transferencia en español asignada.',
        'Espera a que el Service Advisor en español conteste primero.',
        'No presentes al cliente antes de que el Service Advisor hable.',
        'Confirma que el cliente y el Service Advisor estén comunicándose.',
        'Permanece conectado el tiempo suficiente para confirmar un handoff limpio.',
      ],
    },

    lead: {
      eyebrow: 'INFORMACIÓN DEL CLIENTE',
      title: 'Cómo leer un lead',
      description:
        'Revisa los campos importantes antes y durante la llamada para explicar correctamente la información financiera.',
      fields: [
        {
          label: 'Loan Monthly Cost',
          value: 'El pago mensual del cliente.',
        },
        {
          label: 'Origination Date',
          value: 'El mes, día y año en que comenzó el préstamo.',
        },
        {
          label: 'Loan Balance',
          value: 'El saldo actual o monto restante del préstamo.',
        },
        {
          label: 'Información del vehículo',
          value:
            'Revisa el año, marca, modelo, millaje y la información básica del cliente.',
        },
      ],
    },

    pauses: {
      eyebrow: 'ESTADO DEL DIALER',
      title: 'Códigos de pausa',
      description:
        'Utiliza únicamente el código de pausa que represente correctamente lo que estás haciendo.',
      steps: [
        'BREAK se utiliza solamente para un break programado y aprobado.',
        'CB se utiliza cuando estás trabajando en callbacks.',
        'LUNCH se utiliza únicamente durante el horario de lunch aprobado.',
        'MANAGE se utiliza cuando management te pide realizar otra tarea.',
        'RR se utiliza solamente para ir al restroom.',
        'TECH se utiliza para problemas técnicos o del sistema aprobados.',
      ],
    },

    dispositions: {
      eyebrow: 'RESULTADO DE LA LLAMADA',
      title: 'Disposiciones de llamada',
      description:
        'Selecciona la disposición que represente correctamente el resultado final de la llamada.',
      quickTitle: 'Referencia rápida',
      quickText:
        'Usa la ventana de disposiciones para seleccionar el resultado correcto después de cada llamada.',
      fullTitle: 'Lista completa de disposiciones',
      fullText:
        'Revisa la lista completa cuando no estés seguro de qué opción corresponde. Consulta con un supervisor antes de seleccionar un resultado incorrecto.',
    },
  },
}

function GuideImage({ src, alt }) {
  return (
    <figure className="dg-image-frame">
      <img
        className="dg-image"
        src={src}
        alt={alt}
        loading="lazy"
      />
    </figure>
  )
}

function InstructionList({ items }) {
  return (
    <ol className="dg-instruction-list">
      {items.map((item, index) => (
        <li key={item}>
          <span className="dg-instruction-number">
            {String(index + 1).padStart(2, '0')}
          </span>

          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function GuideHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <header className="dg-section-heading">
      <span className="dg-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>

      {description ? (
        <p>{description}</p>
      ) : null}
    </header>
  )
}

function LoginStep({ step }) {
  return (
    <article className="dg-login-step">
      <div className="dg-step-heading">
        <span className="dg-step-number">
          {step.number}
        </span>

        <div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </div>
      </div>

      <GuideImage
        src={step.image}
        alt={step.alt}
      />

      <InstructionList items={step.instructions} />
    </article>
  )
}

export default function DialerGuide({ lang = 'en' }) {
  const copy =
    DIALER_COPY[lang] || DIALER_COPY.en

  return (
    <div className="dg-guide">
      <section
        id="dialer-intro"
        className="dg-hero"
      >
        <span className="dg-eyebrow">
          {copy.hero.eyebrow}
        </span>

        <h2>{copy.hero.title}</h2>
        <p>{copy.hero.description}</p>
      </section>

      <section
        id="validate-ip"
        className="dg-section dg-section-important"
      >
        <GuideHeading {...copy.validateIp} />

        <GuideImage
          src="/training/vici-ip-validation.png"
          alt={
            lang === 'es'
              ? 'Pantalla de validación de IP'
              : 'IP validation screen'
          }
        />

        <InstructionList
          items={copy.validateIp.steps}
        />

        <aside className="dg-note">
          <strong>
            {copy.validateIp.noteTitle}
          </strong>

          <p>{copy.validateIp.note}</p>
        </aside>
      </section>

      <section
        id="login"
        className="dg-section"
      >
        <GuideHeading {...copy.login} />

        <div className="dg-login-list">
          {copy.login.steps.map((step) => (
            <LoginStep
              key={step.number}
              step={step}
            />
          ))}
        </div>
      </section>

      <section
        id="go-active"
        className="dg-section"
      >
        <GuideHeading {...copy.active} />

        <GuideImage
          src="/training/vici-go-active.png"
          alt={
            lang === 'es'
              ? 'Pantalla de VICIdial mostrando estado en pausa'
              : 'VICIdial screen showing paused status'
          }
        />

        <InstructionList
          items={copy.active.steps}
        />
      </section>

      <section
        id="transfer-english"
        className="dg-section"
      >
        <GuideHeading
          {...copy.transferEnglish}
        />

        <GuideImage
          src="/training/vici-live-call.png"
          alt={
            lang === 'es'
              ? 'Pantalla de llamada en vivo para transferencia en inglés'
              : 'Live call screen for an English transfer'
          }
        />

        <InstructionList
          items={copy.transferEnglish.steps}
        />
      </section>

      <section
        id="transfer-spanish"
        className="dg-section"
      >
        <GuideHeading
          {...copy.transferSpanish}
        />

        <GuideImage
          src="/training/vici-transfer-functions.png"
          alt={
            lang === 'es'
              ? 'Funciones de transferencia para una llamada en español'
              : 'Transfer functions for a Spanish call'
          }
        />

        <InstructionList
          items={copy.transferSpanish.steps}
        />
      </section>

      <section
        id="read-lead"
        className="dg-section"
      >
        <GuideHeading {...copy.lead} />

        <GuideImage
          src="/training/vici-lead-form.png"
          alt={
            lang === 'es'
              ? 'Formulario del lead con información financiera y del vehículo'
              : 'Lead form with financial and vehicle information'
          }
        />

        <div className="dg-field-grid">
          {copy.lead.fields.map((field) => (
            <article
              key={field.label}
              className="dg-field-card"
            >
              <strong>{field.label}</strong>
              <p>{field.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="pause-codes"
        className="dg-section"
      >
        <GuideHeading {...copy.pauses} />

        <GuideImage
          src="/training/vici-pauses-codes.png"
          alt={
            lang === 'es'
              ? 'Lista de códigos de pausa de VICIdial'
              : 'VICIdial pause code list'
          }
        />

        <InstructionList
          items={copy.pauses.steps}
        />
      </section>

      <section
        id="dispositions"
        className="dg-section"
      >
        <GuideHeading
          {...copy.dispositions}
        />

        <div className="dg-disposition-list">
          <article className="dg-visual-card">
            <div className="dg-visual-card-heading">
              <span>01</span>

              <div>
                <h3>
                  {copy.dispositions.quickTitle}
                </h3>

                <p>
                  {copy.dispositions.quickText}
                </p>
              </div>
            </div>

            <GuideImage
              src="/training/vici-dispositions.png"
              alt={
                lang === 'es'
                  ? 'Ventana rápida de disposiciones de llamada'
                  : 'Quick call disposition window'
              }
            />
          </article>

          <article className="dg-visual-card">
            <div className="dg-visual-card-heading">
              <span>02</span>

              <div>
                <h3>
                  {copy.dispositions.fullTitle}
                </h3>

                <p>
                  {copy.dispositions.fullText}
                </p>
              </div>
            </div>

            <GuideImage
              src="/training/vici-dispositions-full.png"
              alt={
                lang === 'es'
                  ? 'Lista completa de disposiciones de llamada'
                  : 'Full call disposition list'
              }
            />
          </article>
        </div>
      </section>
    </div>
  )
}