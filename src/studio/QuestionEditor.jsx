import { Button } from '../components/ui/Button.jsx'
import { newQuestion, orderedQuestions } from './builderModel.js'

export function QuestionEditor({ questions, onChange, topics, disabled }) {
  const update = (index, changes) => onChange(questions.map((q, i) => i === index ? { ...q, ...changes } : q))
  const move = (index, direction) => {
    const next = [...questions]
    ;[next[index], next[index + direction]] = [next[index + direction], next[index]]
    onChange(orderedQuestions(next))
  }
  return <div className="studio-questions">
    {questions.map((q, index) => <fieldset className="studio-question" key={index} disabled={disabled}>
      <legend>Question {index + 1}</legend>
      <div className="studio-question-toolbar"><label>Type<select aria-label="Type" value={q.question_type} onChange={e => update(index, { question_type: e.target.value, answer_options: e.target.value === 'multiple_choice' ? ['', ''] : [], correct_answer: e.target.value === 'multiple_choice' ? 0 : e.target.value === 'true_false' ? true : [''] })}><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option><option value="text">Text answer</option></select></label>
        <div className="studio-inline-actions"><Button variant="ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label={'Move question ' + (index + 1) + ' up'}>↑</Button><Button variant="ghost" disabled={index === questions.length - 1} onClick={() => move(index, 1)} aria-label={'Move question ' + (index + 1) + ' down'}>↓</Button><Button variant="ghost" onClick={() => onChange(orderedQuestions(questions.filter((_, i) => i !== index)))}>Remove question</Button></div>
      </div>
      <label>Prompt<textarea aria-label="Prompt" rows={2} maxLength={2000} value={q.prompt} onChange={e => update(index, { prompt: e.target.value })} placeholder="What would you like to ask?" /></label>
      {q.question_type === 'multiple_choice' && <div className="studio-options"><p>Options · select the correct answer</p>{q.answer_options.map((option, oi) => <div className="studio-option" key={oi}><input type="radio" name={'answer-' + index} aria-label={'Correct answer: option ' + (oi + 1)} checked={q.correct_answer === oi} onChange={() => update(index, { correct_answer: oi })} /><input aria-label={'Option ' + (oi + 1)} maxLength={1000} value={option} onChange={e => update(index, { answer_options: q.answer_options.map((v, i) => i === oi ? e.target.value : v) })} /><Button variant="ghost" aria-label={'Remove option ' + (oi + 1)} disabled={q.answer_options.length <= 2} onClick={() => update(index, { answer_options: q.answer_options.filter((_, i) => i !== oi), correct_answer: q.correct_answer === oi ? 0 : q.correct_answer > oi ? q.correct_answer - 1 : q.correct_answer })}>×</Button></div>)}<Button variant="ghost" disabled={q.answer_options.length >= 8} onClick={() => update(index, { answer_options: [...q.answer_options, ''] })}>+ Add option</Button></div>}
      {q.question_type === 'true_false' && <label>Correct answer<select aria-label="Correct answer" value={String(q.correct_answer)} onChange={e => update(index, { correct_answer: e.target.value === 'true' })}><option value="true">True</option><option value="false">False</option></select></label>}
      {q.question_type === 'text' && <label>Accepted answers<textarea aria-label="Accepted answers" rows={3} value={q.correct_answer.join('\n')} onChange={e => update(index, { correct_answer: e.target.value.split('\n') })} placeholder="One accepted answer per line" /><small>One answer per line. Capitalization and spaces at the beginning or end are ignored; the rest must match.</small></label>}
      <label>Explanation <small>Optional</small><textarea aria-label="Explanation" rows={2} maxLength={4000} value={q.explanation} onChange={e => update(index, { explanation: e.target.value })} placeholder="Help the answer make sense." /></label>
      <fieldset className="studio-checks"><legend>Topics</legend>{topics.map(t => <label key={t.id}><input type="checkbox" checked={q.topic_ids.includes(t.id)} onChange={e => update(index, { topic_ids: e.target.checked ? [...q.topic_ids, t.id] : q.topic_ids.filter(id => id !== t.id) })} />{t.name}</label>)}</fieldset>
    </fieldset>)}
    <Button disabled={disabled || questions.length >= 100} variant="secondary" onClick={() => onChange(orderedQuestions([...questions, newQuestion(topics.map(t => t.id))]))}>+ Add question</Button><small>{questions.length} / 100 questions</small>
  </div>
}
