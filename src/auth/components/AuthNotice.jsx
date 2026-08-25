export function AuthNotice({ tone = 'error', children }) {
  return <div className={`auth-notice auth-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>
}
