import { staffInitials } from '../peopleViewModel.js'

export function StaffAvatar({ name, size = 'md' }) {
  return <span className={`admin-staff-avatar admin-staff-avatar--${size}`} aria-hidden="true">{staffInitials(name)}</span>
}
