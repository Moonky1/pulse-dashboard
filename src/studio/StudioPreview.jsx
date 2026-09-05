import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'

// Presentation only. No client, RPC, attempt, result or grading path exists here.
export function StudioPreview({ details, onClose }) {
  const dialog = useRef(null)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const previous = document.activeElement
    dialog.current.showModal()
    return () => previous?.focus()
  }, [])
  const question = details.questions[index]
  return <dialog ref={dialog} className="studio-preview" onCancel={onClose} onClose={onClose} aria-label="Learner preview">
    <div className="studio-preview-head"><span>Preview</span><Button variant="ghost" onClick={onClose} aria-label="Close preview">×</Button></div>
    <p className="studio-eyebrow">{details.content.title}</p>
    {question ? <div key={index}><p>Question {index + 1} of {details.questions.length}</p><h2>{question.prompt}</h2>
      {question.question_type === 'text' ? <label>Your answer<input placeholder="Type your answer" /></label> : <fieldset className="studio-preview-answers"><legend className="studio-sr-only">Choose an answer</legend>{(question.question_type === 'true_false' ? ['True', 'False'] : question.answer_options).map((answer, i) => <label key={i}><input type="radio" name="preview-answer" />{answer}</label>)}</fieldset>}
      <div className="studio-savebar"><Button variant="ghost" disabled={!index} onClick={() => setIndex(i => i - 1)}>Previous question</Button><Button disabled={index === details.questions.length - 1} onClick={() => setIndex(i => i + 1)}>Next question</Button></div>
    </div> : <p>Add questions to preview them here.</p>}
    <small>This is a preview. Nothing is recorded.</small>
  </dialog>
}
