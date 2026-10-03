import { Link } from 'react-router-dom'

import { ProductHeader } from '../../components/ProductHeader.jsx'
import './ProductDashboardPage.css'

export function ProductDashboardPage() {
  return <div className="pulse-product-surface pulse-dashboard-page">
    <ProductHeader />
    <main className="pulse-dashboard-page__main">
      <div className="pulse-dashboard-page__symbol" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><rect x="9" y="10" width="46" height="44" rx="12" stroke="currentColor" strokeWidth="2" /><path d="M19 43V34m13 9V22m13 21V29" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /><path d="M18 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></div>
      <p className="pulse-dashboard-page__eyebrow">KAMPAIGN KINGS · PULSE</p>
      <h1>Dashboard</h1>
      <p>A clearer view of your team is on the way.</p>
      <span className="pulse-dashboard-page__status">IN DEVELOPMENT</span>
      <Link to="/workspace">Back to Workspace <span aria-hidden="true">↗</span></Link>
    </main>
  </div>
}
