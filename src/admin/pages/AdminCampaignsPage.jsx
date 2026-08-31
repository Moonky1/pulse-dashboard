import { useMemo, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { useCampaignCatalog } from '../hooks/useCampaignCatalog.js'

function CampaignStatus({ active }) {
  return <span className={`admin-organization-status admin-organization-status--${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
}

function CampaignCard({ campaign }) {
  return (
    <article className="admin-organization-card">
      <div className="admin-organization-card__heading">
        <div><span>{campaign.code}</span><h3>{campaign.name}</h3></div>
        <CampaignStatus active={campaign.isActive} />
      </div>
      <p>{campaign.description || 'No campaign description has been added.'}</p>
      <div className="admin-organization-dependencies">
        <span><strong>{campaign.activeTeamCount}</strong> active teams</span>
        <span><strong>{campaign.teamCount}</strong> total teams</span>
      </div>
    </article>
  )
}

export function AdminCampaignsPage() {
  const { campaigns, loading, error, refresh } = useCampaignCatalog()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return campaigns
    return campaigns.filter((campaign) => [campaign.name, campaign.code, campaign.description]
      .some((value) => String(value ?? '').toLowerCase().includes(normalized)))
  }, [campaigns, query])

  if (loading && !campaigns.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading campaigns" body="Reading the protected campaign catalog…" /></main>
  if (error && !campaigns.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Campaigns unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div><p>Operations</p><h1>Campaigns</h1><span>Review the canonical campaign directory. Campaign administration remains read-only; authorization scopes are managed from protected user workflows.</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--campaigns" aria-label="Campaign filters">
        <label className="admin-search"><span>Search campaigns</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, code, or description" /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {campaigns.length} campaigns <span>Protected catalog</span></div>
      {!campaigns.length
        ? <AdminStatePanel kind="empty" title="No campaigns" body="The protected campaign catalog returned no records." />
        : !filtered.length
          ? <AdminStatePanel kind="empty" title="No matching campaigns" body="Adjust the campaign search to broaden these results." />
          : <div className="admin-organization-grid">{filtered.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div>}
    </main>
  )
}
