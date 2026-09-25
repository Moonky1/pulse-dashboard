import { Link } from 'react-router-dom'

import { ProductTopbar } from '../components/ProductNavigation.jsx'
import { useAuth } from '../AuthProvider.jsx'
import './productSurface.css'

const FUTURE_AREAS = [
  { title: 'Transfers & Xfers', detail: 'Transfer activity will appear when the operational data is connected.' },
  { title: 'Teams & performance', detail: 'A reliable view of team progress belongs here, without estimated numbers.' },
  { title: 'Goals & trends', detail: 'Historical progress will appear after its source is approved.' },
  { title: 'Alerts', detail: 'Important changes will surface here when notification rules are ready.' },
]

export function DashboardPage() {
  const { profile } = useAuth()
  const name = profile?.display_name || profile?.full_name || 'there'
  return <div className="product-surface"><ProductTopbar /><main className="product-content product-dashboard">
    <div className="product-page-heading"><p className="product-kicker">Dashboard</p><h1>Good to see you, {name}</h1><span>Your Pulse overview starts here</span></div>
    <section className="product-dashboard__feature" aria-labelledby="dashboard-overview-title">
      <div><p className="product-kicker">Overview</p><h2 id="dashboard-overview-title">The whole day, one clear view</h2><p>Operational data is not connected to Dashboard yet. As each source is approved, this space will show what matters without guessing.</p></div>
      <div className="product-dashboard__feature-mark" aria-hidden="true"><span /></div>
    </section>
    <div className="product-dashboard__section-heading"><h2>What will live here</h2><span>Connected data only</span></div>
    <div className="product-dashboard__grid">{FUTURE_AREAS.map((area) => <section className="product-dashboard__panel" key={area.title}><span className="product-dashboard__panel-orbit" aria-hidden="true" /><h3>{area.title}</h3><p>{area.detail}</p><span className="product-dashboard__not-ready">Not connected yet</span></section>)}</div>
    <section className="product-dashboard__continue"><div><p className="product-kicker">Keep moving</p><h2>Learning and creation are ready now</h2></div><div><Link to="/go">Open Pulse GO <span aria-hidden="true">↗</span></Link><Link to="/studio">Open Studio <span aria-hidden="true">↗</span></Link></div></section>
  </main></div>
}
