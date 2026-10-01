// Names and purposes follow the six game modes in Pulse Go Questions (2).docx.
// Only Classic has a released game contract; the other banks remain editorial drafts.
export const PULSE_MODES = Object.freeze([
  {
    key: 'classic', title: 'Classic Quiz', art: 'classic', playable: true,
    description: {
      en: 'Choose your level and play at your pace.',
      es: 'Elige tu nivel y juega a tu ritmo.',
    },
  },
  {
    key: 'valid-xfer', title: 'Valid or Invalid XFER', art: 'valid', playable: false,
    description: {
      en: 'Judge consent, handoff, language and advisor connection.',
      es: 'Evalúa el consentimiento, la transferencia, el idioma y la conexión con el asesor.',
    },
  },
  {
    key: 'dispose-it', title: 'Dispose It', art: 'disposeit', playable: false,
    description: {
      en: 'Choose the right disposition for each call scenario.',
      es: 'Elige la disposición correcta para cada situación de llamada.',
    },
  },
  {
    key: 'eligible', title: 'Eligible or Not Eligible', art: 'goal2', playable: false,
    description: {
      en: 'Decide whether a vehicle qualifies to move forward.',
      es: 'Decide si un vehículo cumple los requisitos para continuar.',
    },
  },
  {
    key: 'objection', title: 'Objection Battle', art: 'objection', playable: false,
    description: {
      en: 'Choose a safe, effective response to customer objections.',
      es: 'Elige una respuesta segura y eficaz ante las objeciones del cliente.',
    },
  },
  {
    key: 'certification', title: 'Certification Mode', art: 'certification', playable: false,
    description: {
      en: 'A final review across quality, eligibility and call handling.',
      es: 'Un repaso final de calidad, elegibilidad y manejo de llamadas.',
    },
  },
])
