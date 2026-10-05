import { Component } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Brand } from './AuthShell.jsx'

export class PageLoadBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="auth-status-page" role="alert">
      <header><Brand compact homePath="/go" /></header>
      <Card level={2} className="auth-status-card auth-status-card--compact">
        <p className="auth-eyebrow">Let’s try again</p>
        <h1>We couldn’t open this page.</h1>
        <p>Reload Pulse to continue.</p>
        <div className="auth-status-actions">
          <Button type="button" onClick={() => window.location.reload()}>Reload Pulse</Button>
        </div>
      </Card>
    </main>
  }
}
