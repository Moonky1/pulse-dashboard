import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { StudioShell, StudioAccessState } from '../studio/StudioShell.jsx'
import { useStudioAccess } from '../studio/hooks/useStudioAccess.js'
import { useUnsavedChanges } from '../studio/hooks/useUnsavedChanges.js'
import { draftFromDetails, emptyDraft, validateAudience } from '../studio/builderModel.js'
import { getTrainingContentAuthoringDetails, getTrainingFilterOptions, updateTrainingContentDraft, publishTrainingContent, createTrainingContentRevision, archiveTrainingContent } from '../training/trainingApi.js'
import { resolveTrainingAuthoringDestination } from '../training/authoringDestination.js'
import { simulationRpc, simulationScreenUrl, uploadSimulationScreen, uploadSimulationAudio, cleanRaster } from './simulationApi.js'
import { ViciAudioEditor } from './ViciAudioEditor.jsx'
import { ViciAudio } from './ViciAudio.jsx'
import { ViciClipImporter } from './ViciClipImporter.jsx'
import { simulationTemplate, practiceTemplate, randomDispositionTemplate, OPENER_TEAMS, serializableSteps, validateSimulationSteps } from './templates.js'
import { viciScreenFile, viciScreenSvg } from './viciScreens.js'
import { VICI_PRACTICES } from './viciPractice.js'
import { SimulationStage } from './SimulationStage.jsx'
import '../studio/studio.css'
import './simulations.css'

const blank = () => ({ ...emptyDraft(), contentType: 'simulation' })
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export function SimulationBuilder() {
  const { contentId } = useParams(), navigate = useNavigate(), access = useStudioAccess()
  const [details, setDetails] = useState(null), [options, setOptions] = useState(null), [draft, setDraft] = useState(blank)
  const [steps, setSteps] = useState([]), [savedSteps, setSavedSteps] = useState([]), [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0), [screenUrl, setScreenUrl] = useState(null), [screenError, setScreenError] = useState(null)
  const [preview, setPreview] = useState(false), [previewIndex, setPreviewIndex] = useState(0), [previewFeedback, setPreviewFeedback] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [scenario, setScenario] = useState(null), [protocol,setProtocol] = useState(3)
  const [audio,setAudio]=useState([])
  const lock = useRef(false), savedDestination = useRef(null), previewDialog = useRef(null)
  const base = details ? draftFromDetails(details) : blank()
  const basicsDirty = !same(base, draft), stepsDirty = !same(serializableSteps(steps), savedSteps)
  const dirty = basicsDirty || stepsDirty, confirmLeave = useUnsavedChanges(dirty, savedDestination)
  const capabilities = details?.capabilities || access.capabilities
  const enabled = resolveTrainingAuthoringDestination(supabase.supabaseUrl).allowed
  const editable = enabled && !busy && !loading && (contentId ? details?.capabilities?.can_edit : access.capabilities?.can_create)
  const activeIndex = preview ? previewIndex : index, activeStep = steps[activeIndex]
  const screenMode = activeStep?.screen, mediaId = activeStep?.screen_media_id, hasStep = !!activeStep
  useEffect(() => {
    if (!preview) return
    const previous = document.activeElement
    previewDialog.current.showModal()
    return () => previous?.focus()
  }, [preview])
  useEffect(() => {
    if (access.state !== 'allowed') return
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const [filters, read, simulation] = await Promise.all([
        getTrainingFilterOptions(supabase, 'studio'), contentId ? getTrainingContentAuthoringDetails(supabase, contentId) : Promise.resolve({ data: null }),
        contentId ? simulationRpc('get_simulation_authoring', { requested_content_id: contentId }) : Promise.resolve({ data: null }),
      ])
      if (!active) return
      setOptions(filters.data); setDetails(read.data); setDraft(read.data ? { ...draftFromDetails(read.data), positionIds: [] } : blank())
      setScenario(simulation.data?.scenario || null); setProtocol(simulation.data?.workflow_version || 3)
      setAudio(simulation.data?.audio || [])
      const next = serializableSteps(simulation.data?.steps || [])
      setSteps(next); setSavedSteps(next); setIndex(0); setError(filters.error || read.error || simulation.error); setLoading(false)
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [access.state, contentId, revision])
  useEffect(() => {
    let active = true
    async function load() {
      setScreenUrl(null); setScreenError(null)
      if (!hasStep) return
      if (screenMode) { setScreenUrl('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(viciScreenSvg(screenMode))); return }
      if (!mediaId) return
      try { const url = await simulationScreenUrl('staff', contentId, mediaId); if (active) setScreenUrl(url) }
      catch (e) { if (active) setScreenError(e.message) }
    }
    const timer = setTimeout(load, 0), refresh = setInterval(load, 90_000)
    return () => { active = false; clearTimeout(timer); clearInterval(refresh) }
  }, [contentId, screenMode, mediaId, hasStep])
  function changeDraft(change) { if (editable) setDraft(d => ({ ...d, ...change })) }
  function changeStep(change) { if (editable) setSteps(s => s.map((step, i) => i === index ? { ...step, ...change } : step)) }
  async function run(action) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(null); setNotice('')
    try { await action() } catch (e) { setError({ message: e.message || 'Studio is unavailable. Your unsaved draft is kept.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  async function saveBasics() {
    const invalid = draft.title.trim().length < 2 || draft.title.length > 180 ? 'Add a title (2–180 characters).' : !draft.topicIds.length ? 'Choose at least one topic.' : validateAudience(draft, options, capabilities)
    if (invalid) { setError({ message: invalid }); return }
    await run(async () => {
      const result = contentId ? await updateTrainingContentDraft(supabase, contentId, { ...draft, positionIds: [], expectedUpdatedAt: details.content.updated_at }) : await simulationRpc('create_simulation_draft', {
        requested_title: draft.title.trim(), requested_description: draft.description.trim() || null, requested_language: draft.language,
        requested_topic_ids: draft.topicIds, requested_scope_type: draft.scopeType, requested_campaign_id: draft.campaignId || null,
        requested_team_id: draft.teamId || null, requested_position_ids: [],
      }, { authoring: true })
      if (result.error) { setError(result.error); return }
      const id = contentId || result.data.id
      if (!contentId) { savedDestination.current = '/studio/simulations/' + id; navigate(savedDestination.current, { replace: true }); return }
      const read = await getTrainingContentAuthoringDetails(supabase, id)
      if (read.error) { setError({ message: 'Saved, but reload is required before another change.' }); return }
      setDetails(read.data); setDraft(draftFromDetails(read.data)); setNotice('Basics and audience saved.')
    })
  }
  async function loadTemplate(name) {
    if (!editable || !contentId || (steps.length && !window.confirm('Replace these draft steps with this template? Saved published versions are not changed.'))) return
    await run(async () => {
      const next = name==='random'?randomDispositionTemplate():practiceTemplate(name), media = new Map()
      for (const step of next) {
        if (!media.has(step.screen)) media.set(step.screen, await uploadSimulationScreen(contentId, await viciScreenFile(step.screen)))
        step.screen_media_id = media.get(step.screen)
      }
      setSteps(next); setScenario(name); setProtocol(name==='random'?4:3); setIndex(0); setNotice('Practice loaded. Review its team and steps, then save.')
    })
  }
  async function upload(file) {
    if (!file || !editable) return
    await run(async () => { const id = await uploadSimulationScreen(contentId, await cleanRaster(file)); setSteps(s => s.map((step, i) => i === index ? { ...step, screen_media_id: id, screen: undefined } : step)); setNotice('Private screen uploaded. Save steps to bind it to this step.') })
  }
  async function saveSteps() {
    if (!scenario) { setError({ message: 'Choose a reviewed practice template first.' }); return }
    const invalid = validateSimulationSteps(steps)
    if (invalid) { setError({ message: invalid }); return }
    await run(async () => {
      const result = await simulationRpc('replace_simulation_steps', { requested_content_id: contentId, requested_steps: serializableSteps(steps), expected_updated_at: details.content.updated_at }, { authoring: true })
      if (result.error) { setError(result.error); return }
      const configured = await simulationRpc(protocol===4?'configure_vici_random_case':protocol===3?'configure_vici_practice':'configure_vici_challenge', { requested_content_id: contentId, ...(protocol===4?{requested_disposition:steps[1].expected_value,requested_explanation:steps[1].success_feedback}:{requested_scenario:scenario}), expected_updated_at: result.data.updated_at }, { authoring: true })
      if (configured.error) { setError(configured.error); setRevision(v => v + 1); return }
      const [read, simulation] = await Promise.all([getTrainingContentAuthoringDetails(supabase, contentId), simulationRpc('get_simulation_authoring', { requested_content_id: contentId })])
      if (read.error || simulation.error) { setError({ message: 'Saved, but reload is required before continuing.' }); return }
      setDetails(read.data); setDraft({...draftFromDetails(read.data),positionIds:[]}); const next = serializableSteps(simulation.data.steps); setSteps(next); setSavedSteps(next); setNotice('All steps saved. Review the draft preview before publishing.')
    })
  }
  async function publish() {
    setConfirmation(null)
    await run(async () => {
      const result = await publishTrainingContent(supabase, contentId, details.content.updated_at)
      if (result.error) { setError(result.error); return }
      setRevision(v => v + 1); setNotice('Published to the selected audience. Previous versions and results are preserved.')
    })
  }
  async function attachAudio(cue,file,confirmed) {
    await run(async()=>{
      const mediaId=file?await uploadSimulationAudio(contentId,file,confirmed):null
      const result=await simulationRpc('configure_vici_audio',{requested_content_id:contentId,requested_cue:cue,requested_media_id:mediaId,expected_updated_at:details.content.updated_at},{authoring:true})
      if(result.error){setError(result.error);return}
      setRevision(v=>v+1);setNotice(mediaId?'Private clip attached.':'Clip removed from this draft. Historical versions are preserved.')
    })
  }
  async function createUpdate() {
    await run(async () => {
      const result = await createTrainingContentRevision(supabase, contentId)
      if (result.error) { setError(result.error); return }
      navigate('/studio/simulations/' + result.data[0].id)
    })
  }
  if (access.state !== 'allowed') return <StudioAccessState access={access} />
  return <StudioShell confirmLeave={confirmLeave}><div className="sim-builder">
    <Link to="/academy/simulations" className="sim-back">← Open VICI Simulator · manual dialer</Link>
    <header className="sim-heading"><div><p className="sim-eyebrow">Interactive training · Studio</p><h1>{draft.title || 'Build a simulation'}</h1><p>Familiar screens. Clear steps. Safe practice.</p></div><span className="studio-status">{details?.content.status || 'New draft'} · {busy ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}</span></header>
    {loading ? <p role="status">Opening the simulation…</p> : <>
      {error && <div className="sim-error" role="alert"><p>{error.message}</p><button onClick={() => { if (confirmLeave()) setRevision(v => v + 1) }}>Reload saved version</button></div>}
      {notice && <p className="sim-hint" role="status">{notice}</p>}
      {!enabled && <p className="sim-hint">Read-only: authoring is not enabled for this destination.</p>}
      {!contentId&&capabilities?.can_create&&<ViciClipImporter options={options} disabled={!editable}/>}
      <details className="sim-panel" open={!contentId}><summary>Basics & audience</summary><fieldset disabled={!editable} className="studio-fields">
        <label>Title<input value={draft.title} maxLength={180} onChange={e => changeDraft({ title: e.target.value })} /></label>
        <label>Description<textarea rows={2} value={draft.description} maxLength={2000} onChange={e => changeDraft({ description: e.target.value })} /></label>
        <label>Language<select aria-label="Language" value={draft.language} disabled={!!contentId && Number(details?.content.version_number) > 1} onChange={e => changeDraft({ language: e.target.value })}><option value="en">English</option><option value="es">Español</option></select></label>
        <fieldset className="studio-checks"><legend>Topics</legend>{options?.topics?.map(t => <label key={t.id}><input type="checkbox" checked={draft.topicIds.includes(t.id)} onChange={e => changeDraft({ topicIds: e.target.checked ? [...draft.topicIds, t.id] : draft.topicIds.filter(id => id !== t.id) })} />{t.name}</label>)}</fieldset>
        <p className="sim-hint">Learners: Openers only. SPXFER: Colombia, Central America and Venezuela. SPANIS: Asia, Philippines and Mexico. English and SPXFER require 15 seconds of advisor introduction.</p>
        <label>Audience<select aria-label="Audience" value={draft.scopeType} onChange={e => changeDraft({ scopeType: e.target.value, campaignId: '', teamId: '' })}><option value="">Choose an audience</option>{!!options?.teams?.length && <option value="team">An Opener team</option>}</select></label>
        {draft.scopeType === 'team' && <label>Team<select aria-label="Team" value={draft.teamId} onChange={e => changeDraft({ teamId: e.target.value })}><option value="">Choose a team</option>{options?.teams?.filter(t => OPENER_TEAMS.includes(t.code)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
        {draft.scopeType === 'campaign' && <label>Campaign<select aria-label="Campaign" value={draft.campaignId} onChange={e => changeDraft({ campaignId: e.target.value })}><option value="">Choose a campaign</option>{options?.campaigns?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
      </fieldset><button className="sim-primary" disabled={!editable || (!!contentId && !basicsDirty)} onClick={() => void saveBasics()}>{contentId ? 'Save basics & audience' : 'Save draft & add steps'} →</button></details>
      {contentId && <>
        <section className="sim-panel"><div className="sim-section-title"><div><h2>Workflow</h2><p>Keep team-specific processes separate. Nothing here places a real call.</p>{scenario && <Link to={'/academy/simulations/preview/'+scenario}>Open manual dialer reference →</Link>}</div><button disabled={busy || !steps.length} onClick={() => { const invalid = validateSimulationSteps(steps); if (invalid) { setError({ message: invalid }); return } setPreviewIndex(0); setPreviewFeedback(''); setPreview(true) }}>Draft preview →</button></div>
          {editable && <div className="sim-template-picker"><button onClick={()=>void loadTemplate('random')}>Random Dispositions · private clip</button>{Object.entries(VICI_PRACTICES).map(([key,item])=><button key={key} onClick={()=>void loadTemplate(key)}>{item.title}</button>)}<button disabled={steps.length >= 100} onClick={() => { setSteps(s => [...s, { ...simulationTemplate('callback')[0], screen: undefined, screen_media_id: null, prompt: '', source_note: '' }]); setIndex(steps.length) }}>+ Add step</button></div>}
          {scenario==='random'&&<p className="sim-caption">Each draft holds one private clip. In step 2, choose its reviewed disposition and write the explanation in Correct feedback. All published clips appear as Random Dispositions; learners see the answer only after Submit. SPANIS is limited to local-transfer teams.</p>}
          {editable && <p className="sim-caption">Use fictitious data only. Published versions and learner history stay unchanged.</p>}
          {!!steps.length && <div className="sim-step-layout"><nav className="sim-step-list" aria-label="Simulation steps">{steps.map((step, i) => <button key={i} aria-current={index === i ? 'step' : undefined} onClick={() => setIndex(i)}><span>{String(i + 1).padStart(2, '0')}</span><div>{step.prompt || 'New step'}<small>{step.interaction}</small></div></button>)}</nav><section>
            <StepEditor key={index} step={steps[index]} steps={steps} index={index} disabled={!editable} url={screenUrl} screenError={screenError} onChange={changeStep} onUpload={file => void upload(file)} />
            {editable && <div className="sim-step-actions"><button disabled={!index || steps.some(s => Object.keys(s.branches).length)} onClick={() => { setSteps(s => { const next = [...s]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next }); setIndex(i => i - 1) }}>Move up</button><button disabled={index === steps.length - 1 || steps.some(s => Object.keys(s.branches).length)} onClick={() => { setSteps(s => { const next = [...s]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next }); setIndex(i => i + 1) }}>Move down</button><button disabled={steps.some(s => Object.keys(s.branches).length)} onClick={() => { if (window.confirm('Remove this draft step?')) { setSteps(s => s.filter((_, i) => i !== index)); setIndex(0) } }}>Remove step</button></div>}
          </section></div>}
          <div className="studio-savebar"><span>{steps.length} steps · {stepsDirty ? 'Unsaved' : 'Saved'}</span><button className="sim-primary" disabled={!editable || !stepsDirty || !steps.length || basicsDirty} onClick={() => void saveSteps()}>Save steps</button>{capabilities?.can_publish && <button disabled={busy || dirty || !!validateSimulationSteps(steps)} onClick={() => setConfirmation('publish')}>Review & publish →</button>}</div>
        </section>
        {[3,4].includes(protocol)&&scenario&&<><ViciAudioEditor key={scenario} scenario={scenario} clips={audio} disabled={!editable||dirty} onAttach={attachAudio} onRemove={cue=>void attachAudio(cue,null,false)}/>{audio.map(clip=><ViciAudio key={clip.media_id} kind="staff" contentId={contentId} clip={clip} startedAt="author-preview" onIntro={()=>{}}/>)}</>}
        {details?.content.status === 'published' && enabled && <p className="sim-update"><span>This version is preserved. Edit in a new draft update.</span><button disabled={busy} onClick={() => void createUpdate()}>Edit update</button></p>}
        {capabilities?.can_archive && enabled && <button disabled={busy} onClick={() => setConfirmation('archive')}>Archive simulation</button>}
      </>}
    </>}
    {preview && <dialog ref={previewDialog} className="sim-preview" onCancel={() => setPreview(false)} aria-label="Simulation draft preview"><header><div><strong>Draft preview · Not recorded</strong><p>No learner attempt, score or completion is saved.</p></div><button autoFocus onClick={() => setPreview(false)}>Close preview</button></header>{steps[previewIndex] ? <><h2>{steps[previewIndex].prompt}</h2><p role="status">{previewFeedback}</p>{screenError ? <p role="alert">{screenError}</p> : <SimulationStage key={previewIndex} step={steps[previewIndex]} url={screenUrl} onAnswer={value => {
      const step = steps[previewIndex], expected = step.expected_value
      const correct = step.interaction === 'info' || (typeof value === 'object' ? step.regions.some(r => r.id === expected && value.x >= r.x && value.x <= r.x + r.w && value.y >= r.y && value.y <= r.y + r.h) : value === expected || ['choice', 'select'].includes(step.interaction) && !!step.branches[value])
      setPreviewFeedback(correct ? step.success_feedback || 'Correct.' : step.retry_feedback || 'Try again.')
      if (correct) setPreviewIndex(step.branches[value] ? step.branches[value] - 1 : previewIndex + 1)
    }} />}</> : <section className="sim-empty"><h2>Preview complete</h2><p>This did not create a learner result.</p><button onClick={() => { setPreviewIndex(0); setPreviewFeedback('') }}>Preview again</button></section>}</dialog>}
    {confirmation && <Confirm action={confirmation} draft={draft} steps={steps} options={options} onCancel={() => setConfirmation(null)} onConfirm={() => confirmation === 'publish' ? void publish() : void run(async () => { setConfirmation(null); const result = await archiveTrainingContent(supabase, contentId); if (result.error) setError(result.error); else setRevision(v => v + 1) })} />}
  </div></StudioShell>
}

function StepEditor({ step, steps, index, disabled, url, screenError, onChange, onUpload }) {
  const [drawing, setDrawing] = useState(false)
  return <div className="sim-step-editor"><fieldset className="studio-fields" disabled={disabled}>
    <div className="studio-two-columns"><label>Interaction<select value={step.interaction} onChange={e => onChange({ interaction: e.target.value, expected_value: null, options: [], branches: {} })}>{['info', 'click', 'text', 'select', 'choice', 'action'].map(t => <option key={t}>{t}</option>)}</select></label><label>Instruction<textarea value={step.prompt} rows={2} maxLength={2000} onChange={e => onChange({ prompt: e.target.value })} /></label></div>
    <label>Screen upload<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { onUpload(e.target.files[0]); e.target.value = '' }} /></label><p className="sim-caption">Use only fictitious/sanitized data. Uploads are private; real customer records and credentials are not permitted.</p>
    <label>Reuse a screen<select value={step.screen_media_id || ''} onChange={e => onChange({ screen_media_id: e.target.value || null, screen: undefined })}><option value="">No screen</option>{[...new Map(steps.filter(s => s.screen_media_id).map((s, i) => [s.screen_media_id, { id: s.screen_media_id, label: `Screen from step ${i + 1}` }])).values()].map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
  </fieldset>
    {screenError && <p role="alert" className="sim-error">{screenError}</p>}
    {url && <><button disabled={disabled} aria-pressed={drawing} onClick={() => setDrawing(v => !v)}>{drawing ? 'Stop drawing' : 'Draw a target on the screen'}</button><p className="sim-caption">Drag a rectangle over a button or input. Fine-tune its percentages below.</p><SimulationStage step={step} url={url} drawing onRegion={area => { if (!drawing || disabled) return; const id = 'target_' + (step.regions.length + 1); onChange({ regions: [...step.regions, { id, label: 'New target', ...area }] }) }} /></>}
    <fieldset className="studio-fields" disabled={disabled}><details className="sim-target-editor"><summary>Targets · {step.regions.length}</summary>{step.regions.map((r, ri) => <div key={r.id} className="sim-region-fields"><label>Target label<input value={r.label} maxLength={120} onChange={e => onChange({ regions: step.regions.map((a, i) => i === ri ? { ...a, label: e.target.value } : a) })} /></label>{['x', 'y', 'w', 'h'].map(axis => <label key={axis}>{axis.toUpperCase()} %<input type="number" min={0} max={100} step={.1} value={+(r[axis] * 100).toFixed(2)} onChange={e => onChange({ regions: step.regions.map((a, i) => i === ri ? { ...a, [axis]: Number(e.target.value) / 100 } : a) })} /></label>)}<button onClick={() => onChange({ regions: step.regions.filter((_, i) => i !== ri) })}>Remove target</button></div>)}<button onClick={() => onChange({ regions: [...step.regions, { id: 'target_' + crypto.randomUUID().slice(0, 8), label: 'New target', x: .1, y: .1, w: .15, h: .05 }] })}>+ Add target by coordinates</button></details>
    {['choice', 'select', 'action'].includes(step.interaction) && <label>Options · one per line<textarea rows={3} value={step.options.join('\n')} onChange={e => onChange({ options: e.target.value.split('\n'), branches: {} })} /></label>}
    {step.interaction !== 'info' && <label>Expected {step.interaction === 'click' ? 'target' : 'value'}{['click', 'select', 'choice', 'action'].includes(step.interaction) ? <select value={step.expected_value || ''} onChange={e => onChange({ expected_value: e.target.value })}><option value="">Choose expected answer</option>{(step.interaction === 'click' ? step.regions.map(r => ({ value: r.id, label: r.label })) : step.options.map(value => ({ value, label: value }))).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <input value={step.expected_value || ''} maxLength={500} onChange={e => onChange({ expected_value: e.target.value })} />}</label>}
    <label>Hint<textarea value={step.hint || ''} maxLength={1000} onChange={e => onChange({ hint: e.target.value })} /></label><div className="studio-two-columns"><label>Correct feedback<input value={step.success_feedback || ''} maxLength={1000} onChange={e => onChange({ success_feedback: e.target.value })} /></label><label>Retry feedback<input value={step.retry_feedback || ''} maxLength={1000} onChange={e => onChange({ retry_feedback: e.target.value })} /></label></div><label>Source / team notes<input value={step.source_note || ''} maxLength={1000} onChange={e => onChange({ source_note: e.target.value })} /></label>
    {['choice', 'select'].includes(step.interaction) && <details><summary>Optional branching · later steps only</summary><p className="sim-caption">A branch option is a valid path and advances to the chosen step. Remove branches before reordering/removing steps.</p>{step.options.filter(Boolean).map(option => <label key={option}>After “{option}”<select value={step.branches[option] || ''} onChange={e => { const next = { ...step.branches }; if (e.target.value) next[option] = Number(e.target.value); else delete next[option]; onChange({ branches: next }) }}><option value="">No branch</option>{steps.map((_, i) => i > index ? <option key={i} value={i + 1}>Step {i + 1}</option> : null)}</select></label>)}</details>}
  </fieldset></div>
}
function Confirm({ action, draft, steps, options, onCancel, onConfirm }) {
  const ref = useRef(null)
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus() }, [])
  const audience = draft.scopeType === 'team' ? options?.teams.find(t => t.id === draft.teamId)?.name : draft.scopeType === 'campaign' ? options?.campaigns.find(c => c.id === draft.campaignId)?.name : 'Everyone'
  return <dialog ref={ref} className="sim-confirm" onCancel={onCancel} aria-label="Simulation publication confirmation"><h2>{action === 'publish' ? 'Publish this reviewed workflow?' : 'Archive this simulation?'}</h2><p>{draft.title} · {steps.length} steps · Audience: {audience}</p><p>{action === 'publish' ? 'Confirm that this process belongs to the selected team and that all screens use fictitious data. Previous versions and results remain intact.' : 'New learners will no longer see it. Its history is preserved.'}</p><div><button onClick={onCancel}>Cancel</button><button className="sim-primary" onClick={onConfirm}>{action === 'publish' ? 'Confirm publish' : 'Confirm archive'}</button></div></dialog>
}
