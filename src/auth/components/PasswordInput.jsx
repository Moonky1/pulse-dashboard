import { useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="auth-password-field">
      <Input {...props} type={visible ? 'text' : 'password'} />
      <Button
        className="auth-password-toggle"
        type="button"
        variant="ghost"
        size="sm"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? 'Hide' : 'Show'}
      </Button>
    </div>
  )
}
