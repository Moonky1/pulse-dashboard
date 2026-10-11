import { useEffect, useState } from 'react'
import { clearWelcome, hasWelcome } from '../auth/welcomeNotice.js'
import { PulseOrb } from './ui/PulseOrb.jsx'
import './WelcomeToast.css'

// Mounted only in the trusted active Staff shell, never on the login form.
export function WelcomeToast({ name }) {
  const [visible,setVisible] = useState(()=>hasWelcome())
  useEffect(()=>{
    clearWelcome()
    if (!visible) return
    const timer = setTimeout(()=>setVisible(false),2000)
    return ()=>clearTimeout(timer)
  },[visible])
  if (!visible) return null
  const firstName = (name || '').trim().split(/\s+/)[0]
  return <aside className="pulse-welcome-toast" role="status" aria-live="polite"><PulseOrb size="sm"/><div><span>GOOD TO SEE YOU</span><strong>{firstName ? `Welcome, ${firstName}` : 'Welcome to Pulse'}</strong></div><span className="pulse-welcome-spark" aria-hidden="true">✦</span></aside>
}
