import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { supabase } from '../utils/supabase.js'
import { createTrainingContentDraft, updateTrainingContentDraft, replaceTrainingQuestions, getTrainingContentAuthoringDetails, getTrainingFilterOptions, publishTrainingContent, archiveTrainingContent } from '../training/trainingApi.js'
import { validateQuestions } from '../training/questionValidation.js'
import { useStudioAccess } from './hooks/useStudioAccess.js'
import { useUnsavedChanges } from './hooks/useUnsavedChanges.js'
import { StudioShell, StudioAccessState } from './StudioShell.jsx'
import { QuestionEditor } from './QuestionEditor.jsx'
import { StudioPreview } from './StudioPreview.jsx'
import { StudioReview } from './StudioReview.jsx'
import { draftFromDetails, questionsFromDetails, emptyDraft, validateBasics, validateAudience, typeLabel } from './builderModel.js'
import './studio.css'

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export function StudioBuilder() {
  const { contentId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const access = useStudioAccess()
  const [draft, setDraft] = useState(emptyDraft)
  const [questions, setQuestions] = useState([])
  const [details, setDetails] = useState(null)
  const [options, setOptions] = useState(null)
  const [step, setStep] = useState(location.state?.step ?? 0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [review, setReview] = useState(null)
  const [preview, setPreview] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [revision, setRevision] = useState(0)
  const savedDraft = details ? draftFromDetails(details) : emptyDraft()
  const savedQuestions = details ? questionsFromDetails(details) : []
  const basicsDirty = !same(draft, savedDraft)
  const questionsDirty = !same(questions, savedQuestions)
  const dirty = basicsDirty || questionsDirty
  const savedDestination = useRef(null)
  const confirmLeave = useUnsavedChanges(dirty, savedDestination)
  const capabilities = details?.capabilities || access.capabilities
  const supported = !details || ['quiz', 'assessment'].includes(details.content.content_type)
  const editable = supported && (contentId ? !!details?.capabilities?.can_edit : !!access.capabilities?.can_create)
  const blocked = busy || loading || error?.code === 'stale_draft' || error?.code === 'reload_required'
  useEffect(() => {
    let current = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const [filters, read] = await Promise.all([getTrainingFilterOptions(supabase, 'studio'), contentId ? getTrainingContentAuthoringDetails(supabase, contentId) : Promise.resolve({ data: null })])
      if (!current) return
      setOptions(filters.data)
      setError(read.error || filters.error || null)
      setDetails(read.data)
      setDraft(read.data ? draftFromDetails(read.data) : emptyDraft())
      setQuestions(read.data ? questionsFromDetails(read.data) : [])
      setReview(null)
      if (read.data && (!read.data.capabilities.can_edit || !['quiz', 'assessment'].includes(read.data.content.content_type))) { setStep(3); setReview(read.data) }
      setLoading(false)
    }, 0)
    return () => { current = false; clearTimeout(timer) }
  }, [contentId, revision])
  function changeDraft(change) { if (editable && !blocked) { setDraft(d => ({ ...d, ...change })); setReview(null); setNotice('') } }
  function changeQuestions(next) { if (editable && !blocked) { setQuestions(next); setReview(null); setNotice('') } }
  function fail(message) { setError({ code: 'validation', message }); return false }
  async function run(action) {
    if (lock.current || blocked) return
    lock.current = true; setBusy(true); setError(null); setNotice('')
    try { await action() } catch { setError({ code: 'unavailable', message: 'We couldn’t reach Studio. Your unsaved work is still here.' }) }
    finally { lock.current = false; setBusy(false) }
  }
  async function readAfterSave(id, section) {
    const read = await getTrainingContentAuthoringDetails(supabase, id)
    if (read.error) { setError({ code: 'reload_required', message: 'The save succeeded, but we couldn’t reload it. Reload before continuing.' }); return null }
    setDetails(read.data)
    if (section === 'basics') setDraft(draftFromDetails(read.data))
    if (section === 'questions') setQuestions(questionsFromDetails(read.data))
    setReview(null)
    setNotice(section === 'basics' ? 'Basics & Audience saved.' : 'Questions saved.')
    return read.data
  }
  async function saveBasics() {
    if (!editable) return
    const invalid = validateBasics(draft) || validateAudience(draft, options, capabilities)
    if (invalid) return fail(invalid)
    await run(async () => {
      const result = contentId ? await updateTrainingContentDraft(supabase, contentId, { ...draft, expectedUpdatedAt: details.content.updated_at }) : await createTrainingContentDraft(supabase, draft)
      if (result.error) { setError(result.error); return }
      const row = result.data[0]
      if (!contentId) {
        // A committed ID is retained even if the subsequent canonical read fails.
        setDetails({ content: { ...row, content_type: draft.contentType, title: draft.title, description: draft.description, language: draft.language }, topics: draft.topicIds.map(id => ({ id })), audience: { scope_type: draft.scopeType, campaign_id: draft.campaignId, team_id: draft.teamId }, position_targets: draft.positionIds.map(id => ({ id })), questions: [], capabilities })
        setStep(2)
        savedDestination.current = '/studio/content/' + row.id
        navigate('/studio/content/' + row.id, { replace: true, state: { step: 2 } })
      } else await readAfterSave(contentId, 'basics')
    })
  }
  async function saveQuestions() {
    if (!editable || !contentId) return
    const invalid = validateQuestions(questions, details.topics.map(t => t.id))
    if (invalid) return fail(invalid)
    await run(async () => {
      const result = await replaceTrainingQuestions(supabase, contentId, questions, details.content.updated_at)
      if (result.error) { setError(result.error); return }
      await readAfterSave(contentId, 'questions')
    })
  }
  async function openReview() {
    if (!contentId || dirty) return fail('Save Basics & Audience and Questions before reviewing.')
    await run(async () => {
      const read = await getTrainingContentAuthoringDetails(supabase, contentId)
      if (read.error) { setError(read.error); return }
      setDetails(read.data); setDraft(draftFromDetails(read.data)); setQuestions(questionsFromDetails(read.data)); setReview(read.data); setStep(3)
    })
  }
  async function performAction() {
    if (!supported || !contentId || dirty || !review || (confirmation === 'publish' && !review.capabilities.can_publish) || (confirmation === 'archive' && !review.capabilities.can_archive)) return
    const action = confirmation
    setConfirmation(null)
    await run(async () => {
      const result = action === 'publish' ? await publishTrainingContent(supabase, contentId, review.content.updated_at) : await archiveTrainingContent(supabase, contentId)
      if (result.error) { setError(result.error); setReview(null); return }
      const read = await readAfterSave(contentId, 'questions')
      if (read) { setDraft(draftFromDetails(read)); setReview(read); setNotice(action === 'publish' ? 'Published. Ready for your learners.' : 'Archived. Its history is kept.') }
    })
  }
  if (access.state !== 'allowed') return <StudioAccessState access={access} />
  const topics = options?.topics?.filter(t => draft.topicIds.includes(t.id)) || []
  return <StudioShell confirmLeave={confirmLeave}>
    <div className="studio-builder-heading"><Link to="/studio">← Your library</Link><span className="studio-status">{details?.content.status || 'New item'}</span></div>
    <header className="studio-heading studio-heading--builder"><div><p className="studio-eyebrow">Pulse Studio</p><h1>{draft.title || 'Start with an idea.'}</h1></div><div className="studio-save-status" aria-live="polite">{busy ? 'Saving / loading…' : dirty ? 'Unsaved changes' : details ? 'Saved' : ''}</div></header>
    {loading ? <p role="status">Opening your item…</p> : <>
      {error && <div className="studio-error" role="alert"><p>{error.message}</p>{['stale_draft', 'reload_required', 'unavailable'].includes(error.code) && <Button variant="secondary" onClick={() => { if (confirmLeave()) { setReview(null); setRevision(v => v + 1) } }}>Reload latest</Button>}</div>}
      {notice && <p className="studio-notice" role="status">{notice}</p>}
      {(!contentId || details) && <>
        {!draft.contentType ? <section className="studio-type-choice"><h2>What do you want to create?</h2><div>{[['quiz','Quiz','Interactive questions for learning and practice.'],['assessment','Assessment','Check knowledge and understanding.']].map(([value,label,description]) => <button key={value} disabled={!editable} onClick={() => changeDraft({ contentType: value })}><span aria-hidden="true">{value === 'quiz' ? '✦' : '✓'}</span><h3>{label}</h3><p>{description}</p><strong>Start {label.toLowerCase()} →</strong></button>)}</div></section> : <>
          <nav className="studio-steps" aria-label="Builder steps">{['Basics','Audience','Questions','Review'].map((name,i) => <button key={name} aria-current={step === i ? 'step' : undefined} disabled={busy || (i >= 2 && !contentId) || (!editable && i !== 3)} onClick={() => i === 3 ? void openReview() : setStep(i)}><span>{i + 1}</span>{name}</button>)}</nav>
          {step === 0 && <section className="studio-editor-panel"><h2>The essentials</h2><fieldset disabled={!editable || blocked} className="studio-fields"><label>Title<input maxLength={180} value={draft.title} onChange={e => changeDraft({ title: e.target.value })} placeholder="Give it a good name" /></label><label>Description <small>Optional</small><textarea aria-label="Description" rows={3} maxLength={2000} value={draft.description} onChange={e => changeDraft({ description: e.target.value })} placeholder="A little context goes a long way." /></label><div className="studio-two-columns"><label>Type<select disabled={!!contentId} value={draft.contentType} onChange={e => changeDraft({ contentType: e.target.value })}><option value="quiz">Quiz</option><option value="assessment">Assessment</option></select></label><label>Language<select aria-label="Language" value={draft.language} onChange={e => changeDraft({ language: e.target.value })}><option value="en">English</option><option value="es">Español</option></select></label></div><fieldset className="studio-checks"><legend>Topics</legend>{options?.topics?.map(t => <label key={t.id}><input type="checkbox" checked={draft.topicIds.includes(t.id)} onChange={e => changeDraft({ topicIds: e.target.checked ? [...draft.topicIds, t.id] : draft.topicIds.filter(id => id !== t.id) })} />{t.name}</label>)}{!options?.topics?.length && <p>No topics are available yet.</p>}</fieldset></fieldset><div className="studio-savebar"><span>{contentId ? basicsDirty ? 'Basics & Audience: unsaved' : 'Basics & Audience: saved' : 'Choose an audience next to save your first draft.'}</span><Button disabled={!editable || blocked} onClick={() => { const invalid = validateBasics(draft); if (invalid) fail(invalid); else { setError(null); setStep(1) } }}>Continue to Audience</Button></div></section>}
          {step === 1 && <section className="studio-editor-panel"><h2>Who is this for?</h2><fieldset disabled={!editable || blocked} className="studio-fields"><label>Audience<select aria-label="Audience" value={draft.scopeType} onChange={e => changeDraft({ scopeType: e.target.value, campaignId: '', teamId: '' })}><option value="">Choose an audience</option>{capabilities?.can_create_global && <option value="global">Everyone</option>}{!!options?.campaigns?.length && <option value="campaign">A campaign</option>}{!!options?.teams?.length && <option value="team">A team</option>}</select></label>{draft.scopeType === 'campaign' && <label>Campaign<select aria-label="Campaign" value={draft.campaignId} onChange={e => changeDraft({ campaignId: e.target.value })}><option value="">Choose a campaign</option>{options?.campaigns?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}{draft.scopeType === 'team' && <label>Team<select aria-label="Team" value={draft.teamId} onChange={e => changeDraft({ teamId: e.target.value })}><option value="">Choose a team</option>{options?.teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}<fieldset className="studio-checks"><legend>Job positions <small>Optional · leave empty for all positions</small></legend>{options?.positions?.map(p => <label key={p.id}><input type="checkbox" checked={draft.positionIds.includes(p.id)} onChange={e => changeDraft({ positionIds: e.target.checked ? [...draft.positionIds, p.id] : draft.positionIds.filter(id => id !== p.id) })} />{p.name}</label>)}</fieldset></fieldset><div className="studio-savebar"><span>{basicsDirty ? 'Basics & Audience: unsaved' : 'Basics & Audience: saved'}</span><Button disabled={!editable || blocked || (contentId && !basicsDirty)} onClick={() => void saveBasics()}>{contentId ? 'Save Basics & Audience' : 'Save draft & add questions'}</Button></div></section>}
          {step === 2 && <section className="studio-editor-panel"><div className="studio-section-heading"><div><h2>Make every question count.</h2><p>Clear questions. Useful explanations. A little curiosity.</p></div><Button variant="secondary" disabled={busy || !questions.length} onClick={() => setPreview({ content: { title: draft.title }, questions })}>Preview</Button></div>{basicsDirty && <p className="studio-notice">Basics & Audience have unsaved changes. Questions save against the last saved topics.</p>}<QuestionEditor questions={questions} onChange={changeQuestions} topics={basicsDirty ? details.topics : topics} disabled={!editable || blocked} /><div className="studio-savebar"><span>{questionsDirty ? 'Questions: unsaved' : 'Questions: saved'}</span><Button disabled={!editable || blocked || !questionsDirty} onClick={() => void saveQuestions()}>Save Questions</Button><Button variant="secondary" disabled={blocked || dirty} onClick={() => void openReview()}>Review</Button></div></section>}
          {step === 3 && <section className="studio-editor-panel"><div className="studio-section-heading"><div><h2>{details?.content.status === 'draft' ? 'One last look.' : typeLabel(draft.contentType) + ' details'}</h2><p>{details?.content.status === 'draft' ? 'Review the saved version before it reaches your learners.' : 'This item is read-only.'}</p></div><Button variant="secondary" disabled={!review || busy} onClick={() => setPreview(review)}>Preview</Button></div>{review ? <StudioReview details={review} /> : <Button onClick={() => void openReview()} disabled={blocked || dirty}>Load latest review</Button>}<div className="studio-savebar">{supported && review?.capabilities.can_publish && <Button disabled={blocked || dirty || !review.questions.length} onClick={() => setConfirmation('publish')}>Publish</Button>}{supported && review?.capabilities.can_archive && <Button variant="secondary" disabled={blocked} onClick={() => setConfirmation('archive')}>Archive</Button>}</div></section>}
        </>}
      </>}
    </>}
    {preview && <StudioPreview details={preview} onClose={() => setPreview(null)} />}
    {confirmation && <ActionConfirmation action={confirmation} onCancel={() => setConfirmation(null)} onConfirm={() => void performAction()} />}
  </StudioShell>
}

function ActionConfirmation({ action, onCancel, onConfirm }) {
  const ref = useRef(null)
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus() }, [])
  return <dialog ref={ref} className="studio-preview" onCancel={onCancel} aria-label={action === 'publish' ? 'Publish confirmation' : 'Archive confirmation'}><h2>{action === 'publish' ? 'Ready to publish?' : 'Archive this item?'}</h2><p>{action === 'publish' ? 'The reviewed version will become available to its audience. Published items can’t be edited.' : 'Archived items are no longer available to learners, but their history is kept.'}</p><div className="studio-savebar"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={onConfirm}>{action === 'publish' ? 'Confirm publish' : 'Confirm archive'}</Button></div></dialog>
}
