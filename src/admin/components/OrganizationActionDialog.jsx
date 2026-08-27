import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { normalizeOrganizationForm, organizationStatusConsequence, shouldCancelOrganizationDialogOnKey, validateOrganizationForm } from '../organizationActions.js'

function EntitySummary({ action }) {
  const entity = action.entity
  if (!entity) return null
  return (
    <div className="admin-dialog__target">
      <strong>{entity.name}</strong>
      <span>{entity.code} · {entity.isActive ? 'Active' : 'Inactive'}</span>
    </div>
  )
}

export function OrganizationActionDialog({ action, departments, submitting, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const editing = action?.type === 'create' || action?.type === 'update'
  const [values, setValues] = useState(() => ({
    code: action?.entity?.code ?? '',
    name: action?.entity?.name ?? '',
    description: action?.entity?.description ?? '',
    departmentId: action?.entity?.departmentId ?? action?.departmentId ?? '',
  }))
  const entityLabel = action?.entityType === 'team' ? 'team' : 'department'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (action && !dialog.open) dialog.showModal()
    if (!action && dialog.open) dialog.close()
  }, [action])

  const activeDepartments = useMemo(() => departments.filter((department) => department.isActive), [departments])
  if (!action) return null

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    if (!editing) {
      onConfirm({ action, active: action.type === 'reactivate' })
      return
    }
    const validation = validateOrganizationForm(values)
    if (validation.error) {
      onConfirm({ action, validationError: validation.error })
      return
    }
    if (action.entityType === 'team' && action.type === 'create' && !values.departmentId) {
      onConfirm({ action, validationError: 'Select one active parent department.' })
      return
    }
    onConfirm({ action, values: { ...normalizeOrganizationForm(values), departmentId: values.departmentId } })
  }
  const title = `${action.type[0].toUpperCase()}${action.type.slice(1)} ${entityLabel}`
  const destructive = action.type === 'deactivate'

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      aria-labelledby="organization-dialog-title"
      aria-describedby="organization-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        if (shouldCancelOrganizationDialogOnKey('Escape', submitting)) onCancel()
      }}
      onClick={(event) => { if (event.target === dialogRef.current && !submitting) onCancel() }}
    >
      <form className="admin-dialog__surface" method="dialog" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="admin-dialog__eyebrow">Confirm organization action</div>
        <h2 id="organization-dialog-title">{title}</h2>
        <EntitySummary action={action} />

        {editing ? <div className="admin-organization-form">
          {action.entityType === 'team' && action.type === 'create' && <label><span>Parent department</span><select value={values.departmentId} onChange={update('departmentId')} autoFocus><option value="">Select an active department</option>{activeDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>}
          {action.entityType === 'team' && action.type === 'update' && <div className="admin-dialog__target"><span>Parent department</span><strong>{action.entity.departmentName}</strong><small>Teams cannot be reparented in this checkpoint.</small></div>}
          <label><span>Code</span><input value={values.code} onChange={update('code')} autoFocus={action.entityType !== 'team' || action.type !== 'create'} placeholder="operations" maxLength={32} /></label>
          <label><span>Name</span><input value={values.name} onChange={update('name')} placeholder="Operations" maxLength={120} /></label>
          <label><span>Description <small>Optional</small></span><textarea value={values.description} onChange={update('description')} maxLength={500} placeholder="Purpose and ownership" /></label>
        </div> : <>
          <p id="organization-dialog-description">{organizationStatusConsequence(action.entityType, action.type === 'reactivate', action.entity)}</p>
          <div className={destructive ? 'admin-dialog__warning' : 'admin-dialog__target'} role="note">
            <strong>{destructive ? 'Dependency protection' : 'Server-authorized reactivation'}</strong>
            <span>Pulse will validate current dependencies and catalog state again before any change.</span>
          </div>
        </>}

        {editing && <p id="organization-dialog-description">Pulse will normalize and validate this record, reject duplicates, append database-owned audit evidence, and then refresh the canonical catalog.</p>}
        {error && <p className="admin-dialog__error" role="alert">{error.message}</p>}
        <div className="admin-dialog__actions">
          <Button type="button" variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant={destructive ? 'danger' : 'primary'} loading={submitting}>Confirm {action.type}</Button>
        </div>
      </form>
    </dialog>
  )
}
