import { OPENER_TEAMS, RANDOM_DISPOSITIONS, randomDispositionTemplate, practiceTemplate, serializableSteps } from './templates.js'
import { VICI_PRACTICES } from './viciPractice.js'

export const LOCAL_SPANISH_TEAMS = OPENER_TEAMS.filter(code=>!['colombia','central_america','venezuela'].includes(code))
export const MANUAL_IMPORT_PRACTICES = ['english','spxfer','asia','callback','login','mock']
const uuid = value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value||'')
export function buildViciImportPlan({ clips,manual,teams,topicId,confirmed }) {
  if(!confirmed)throw new Error('Confirm permission and removal of personal data first.')
  if(!uuid(topicId)||!Array.isArray(teams)||!teams.length||teams.length>8||teams.some(t=>!uuid(t.id)||!OPENER_TEAMS.includes(t.code))||new Set(teams.map(t=>t.id)).size!==teams.length)throw new Error('Choose a topic and available Opener teams.')
  if(!Array.isArray(clips)||clips.length>16||!Array.isArray(manual)||manual.some(s=>!MANUAL_IMPORT_PRACTICES.includes(s))||new Set(manual).size!==manual.length)throw new Error('Choose up to 16 clips and supported manual practices.')
  const tasks=[]
  for(const clip of clips){
    if(!clip.file||!clip.file.size||clip.file.size>25*1024*1024||!RANDOM_DISPOSITIONS.includes(clip.disposition)||typeof clip.explanation!=='string'||clip.explanation.trim().length<2||clip.explanation.length>1000)throw new Error('Review a disposition and explanation for each bounded clip.')
    const eligible=teams.filter(t=>clip.disposition!=='SPANIS'||LOCAL_SPANISH_TEAMS.includes(t.code))
    if(!eligible.length)throw new Error('SPANIS requires an available local-transfer team.')
    for(const team of eligible)tasks.push({scenario:'random',title:'Random Dispositions',team,clip})
  }
  for(const scenario of manual)for(const team of teams){
    if(scenario==='asia'&&!LOCAL_SPANISH_TEAMS.includes(team.code)||scenario==='spxfer'&&LOCAL_SPANISH_TEAMS.includes(team.code))continue
    tasks.push({scenario,title:VICI_PRACTICES[scenario].title,team})
  }
  if(!tasks.length||tasks.length>200)throw new Error('Choose at least one practice to prepare.')
  return tasks
}

// Calls only the existing scoped Staff authoring/media contracts, never raw tables.
// A failure stops the batch. Known draft IDs stay visible; there is no blind retry.
export async function publishViciImportTask(task,topicId,services,onProgress) {
  const rpc=async(name,args)=>{const result=await services.rpc(name,args);if(result.error)throw new Error(result.error.message);if(!result.data)throw new Error('Authoring response unavailable. Review Studio before retrying.');return result.data}
  const created=await rpc('create_simulation_draft',{requested_title:task.title,requested_description:null,requested_language:'en',requested_topic_ids:[topicId],requested_scope_type:'team',requested_campaign_id:null,requested_team_id:task.team.id,requested_position_ids:[]})
  const contentId=created.id
  if(!uuid(contentId)||!created.updated_at)throw new Error('Draft response unavailable. Review Studio before retrying.')
  onProgress({contentId,stage:'draft'})
  const capabilities=await rpc('get_studio_capabilities',{requested_content_id:contentId})
  if(!capabilities.can_publish)throw new Error('Publishing is not permitted for this draft. Continue with an authorized publisher in Studio.')
  const steps=task.scenario==='random'?randomDispositionTemplate(task.clip.disposition):practiceTemplate(task.scenario),media=new Map()
  if(task.clip)steps[1].success_feedback=task.clip.explanation.trim()
  for(const step of steps){if(!media.has(step.screen))media.set(step.screen,await services.screen(contentId,step.screen));step.screen_media_id=media.get(step.screen)}
  let saved=await rpc('replace_simulation_steps',{requested_content_id:contentId,requested_steps:serializableSteps(steps),expected_updated_at:created.updated_at})
  saved=await rpc(task.scenario==='random'?'configure_vici_random_case':'configure_vici_practice',{requested_content_id:contentId,expected_updated_at:saved.updated_at,...(task.clip?{requested_disposition:task.clip.disposition,requested_explanation:task.clip.explanation.trim()}:{requested_scenario:task.scenario})})
  if(task.clip){const mediaId=await services.audio(contentId,task.clip.file);saved=await rpc('configure_vici_audio',{requested_content_id:contentId,requested_cue:'customer',requested_media_id:mediaId,expected_updated_at:saved.updated_at})}
  await rpc('publish_training_content',{requested_content_id:contentId,expected_updated_at:saved.updated_at})
  onProgress({contentId,stage:'published'})
  return contentId
}
