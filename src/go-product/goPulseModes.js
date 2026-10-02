// Names and purposes follow the six game modes in Pulse Go Questions (2).docx.
// Availability comes from the protected published catalog, never from this list.
export const PULSE_MODES = Object.freeze([
  {
    key: 'classic', title: 'Classic Quiz', art: 'classic', hosted: true,
    description: {
      en: 'Choose your level and play at your pace.',
      es: 'Elige tu nivel y juega a tu ritmo.',
    },
  },
  {
    key: 'valid-invalid', title: 'Valid or Invalid XFER', art: 'valid', hosted: true,
    description: {
      en: 'Judge consent, handoff, language and advisor connection.',
      es: 'Evalúa el consentimiento, la transferencia, el idioma y la conexión con el asesor.',
    },
  },
  {
    key: 'disposition-trainer', title: 'Dispose It', art: 'disposeit', hosted: true,
    description: {
      en: 'Choose the right disposition for each call scenario.',
      es: 'Elige la disposición correcta para cada situación de llamada.',
    },
  },
  {
    key: 'eligible', title: 'Eligible or Not Eligible', art: 'goal2', hosted: true,
    description: {
      en: 'Decide whether a vehicle qualifies to move forward.',
      es: 'Decide si un vehículo cumple los requisitos para continuar.',
    },
  },
  {
    key: 'objection-battle', title: 'Objection Battle', art: 'objection', hosted: true,
    description: {
      en: 'Choose a safe, effective response to customer objections.',
      es: 'Elige una respuesta segura y eficaz ante las objeciones del cliente.',
    },
  },
  {
    key: 'certification', title: 'Certification Mode', art: 'certification', hosted: false,
    description: {
      en: 'A final review across quality, eligibility and call handling.',
      es: 'Un repaso final de calidad, elegibilidad y manejo de llamadas.',
    },
  },
])
