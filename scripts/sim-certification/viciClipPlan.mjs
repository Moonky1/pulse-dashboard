// Staff-only rollout plan, never imported by the learner bundle. No recording bytes.
// These labels follow the supplied filenames and the trainer's explicit review.
// Import still requires permission/anonymization confirmation and scoped authoring.
export const VICI_CLIP_PLAN = Object.freeze([
  { file:'Answering Machine.mp3', disposition:'A', teams:'all-openers', explanation:'An automated voicemail greeting is Answering Machine (A). A full voicemail box also uses A.' },
  { file:'DNC Do not Call.mp3', disposition:'DNC', teams:'all-openers', explanation:'The customer asks not to be called again. Use DNC — DO NOT CALL.' },
  { file:'DNC 2.mp3', disposition:'DNC', teams:'all-openers', explanation:'The customer requests no further calls. Use DNC — DO NOT CALL.' },
  { file:'Spanis.mp3', disposition:'SPANIS', teams:'local-spanish-openers', explanation:'For Asia, Philippines and Mexico, Spanish-speaking callers use the local transfer process and SPANIS — Spanish Speaker, not SPXFER.' },
  { file:'Dead Air.mp3', disposition:'DAIR', teams:'all-openers', explanation:'The connected call contains silence with no customer response. Use DAIR — Dead Air.' },
  { file:'I cant talk right now.mp3', disposition:'CALLBK', teams:'all-openers', explanation:'The trainer reviewed this particular practice clip as CALLBK — Call Back. Being unable to talk is not itself a Do Not Call request.', trainerOverride:true },
  { file:'NI 1.mp3', disposition:'NI', teams:'all-openers', explanation:'The customer declines interest. Use NI — Not Interested.' },
])
