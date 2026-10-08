import { supabase } from '../utils/supabase.js'
import { agentRequest } from '../go-product/agentGoApi.js'
import { assertTrainingAuthoringDestination } from '../training/authoringDestination.js'
import { normalizeTrainingError } from '../training/trainingApi.js'

export async function simulationRpc(name, args, { authoring = false } = {}) {
  if (authoring) {
    try { assertTrainingAuthoringDestination(supabase.supabaseUrl) } catch { return { data: null, error: { code: 'authoring_blocked', message: 'Authoring is not enabled for this destination.' } } }
  }
  try {
    const { data, error } = await supabase.rpc(name, args)
    return { data, error: normalizeTrainingError(error) }
  } catch { return { data: null, error: { code: 'unavailable', message: 'Simulation unavailable. Your saved progress is kept.' } } }
}
export function simulationRequest(kind, action, args = {}) {
  if (kind === 'agent') return agentRequest('simulation' + action, args)
  if (kind !== 'staff') return Promise.resolve({ data: null, error: { code: 'access_denied', message: 'Sign in to continue.' } })
  const calls = {
    Catalog: ['list_simulations', { requested_limit: args.limit ?? 50, requested_offset: args.offset ?? 0 }],
    History: ['get_simulation_history', { requested_limit: args.limit ?? 50 }],
    Start: ['start_simulation', { requested_content_id: args.contentId, requested_restart: args.restart ?? false }],
    Attempt: ['get_simulation_attempt', { requested_attempt_id: args.attemptId }],
    Action: ['submit_simulation_action', { requested_attempt_id: args.attemptId, requested_step_id: args.stepId,
      expected_state_version: args.version, requested_request_id: args.requestId, requested_kind: args.kind, requested_value: args.value ?? null }],
  }
  return calls[action] ? simulationRpc(...calls[action]) : Promise.resolve({ data: null, error: { code: 'invalid_request', message: 'Invalid simulation action.' } })
}
export async function simulationScreenUrl(kind, contentId, mediaId, attemptId = null) {
  const result = kind === 'agent'
    ? await agentRequest('simulationScreen', { contentId, mediaId, attemptId })
    : await supabase.functions.invoke('pulse-simulation-media', { body: { action: 'read', contentId, mediaId, attemptId } })
  const url = result.data?.url
  if (result.error || typeof url !== 'string') throw new Error('This screen is unavailable. Reload to try again.')
  const parsed = new URL(url)
  if (parsed.origin !== new URL(supabase.supabaseUrl).origin || !parsed.pathname.startsWith('/storage/v1/object/sign/training-media/')) throw new Error('Screen unavailable.')
  return url
}
export async function uploadSimulationScreen(contentId, file) {
  assertTrainingAuthoringDestination(supabase.supabaseUrl)
  if (!(file instanceof File) || file.type !== 'image/png' || file.size > 4_194_304) throw new Error('Choose a PNG screen under 4 MB.')
  const body = new FormData()
  body.set('action', 'upload'); body.set('contentId', contentId); body.set('file', file)
  const { data, error } = await supabase.functions.invoke('pulse-simulation-media', { body })
  if (error || !data?.mediaId) throw new Error('The screen could not be uploaded. Your draft is kept.')
  return data.mediaId
}
export async function simulationAudioUrl(kind,contentId,mediaId,attemptId=null) {
  const result=kind==='agent'?await agentRequest('simulationAudio',{contentId,mediaId,attemptId}):await supabase.functions.invoke('pulse-simulation-media',{body:{action:'readAudio',contentId,mediaId}})
  const url=result.data?.url
  if(result.error||typeof url!=='string')throw new Error('Practice audio is unavailable. Reload to retry.')
  const parsed=new URL(url)
  if(parsed.origin!==new URL(supabase.supabaseUrl).origin||!parsed.pathname.startsWith('/storage/v1/object/sign/training-media/'))throw new Error('Audio unavailable.')
  return url
}
export async function uploadSimulationAudio(contentId,file,confirmed) {
  assertTrainingAuthoringDestination(supabase.supabaseUrl)
  if(!confirmed||!(file instanceof File)||file.type!=='audio/wav'||file.size>2646044)throw new Error('Use an authorized, anonymized clip of up to 60 seconds.')
  const body=new FormData();body.set('action','uploadAudio');body.set('contentId',contentId);body.set('confirmed','yes');body.set('file',file)
  const {data,error}=await supabase.functions.invoke('pulse-simulation-media',{body})
  if(error||!data?.mediaId)throw new Error('The private clip could not be uploaded.')
  return data.mediaId
}
// Re-encode a permitted local raster, not SVG/HTML, to strip ancillary metadata.
export async function cleanRaster(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file?.type) || file.size > 4_194_304) throw new Error('Choose a PNG, JPEG or WebP under 4 MB, without real customer data.')
  const image = await createImageBitmap(file)
  try {
    if (image.width > 4096 || image.height > 4096 || image.width * image.height > 4_194_304) throw new Error('Use a smaller screen (maximum 4 million pixels).')
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    canvas.getContext('2d').drawImage(image, 0, 0)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Image could not be prepared.')
    return new File([blob], 'training-screen.png', { type: 'image/png' })
  } finally { image.close() }
}
