import { useMemo, useState } from 'react'

import { Button } from '../../components/ui/Button.jsx'
import { buildCampaignBranches } from '../businessCatalog.js'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { useBusinessCatalog } from '../hooks/useBusinessCatalog.js'

function Status({ active }) {
  return <span className={`admin-organization-status admin-organization-status--${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>
}

function TeamPill({ team, campaign }) {
  return <TeamBadge teamId={team.id} name={team.name} code={team.code} campaignCode={campaign.code} />
}

function CampaignCard({ campaign }) {
  return (
    <article className="admin-catalog-campaign">
      <header>
        <div><span>Campaign</span><h2>{campaign.name}</h2><p>{campaign.description}</p></div>
        <Status active={campaign.isActive} />
      </header>
      <div className="admin-catalog-campaign__branches">
        {campaign.units.map((unit) => (
          <section className="admin-catalog-unit" key={unit.id}>
            <div><span>Operating unit</span><h3>{unit.name}</h3></div>
            {unit.teams.length
              ? <div className="admin-catalog-pills">{unit.teams.map((team) => <TeamPill key={team.id} team={team} campaign={campaign} />)}</div>
              : <p>No child Teams in this unit.</p>}
          </section>
        ))}
        {campaign.directTeams.length > 0 && (
          <section className="admin-catalog-unit">
            <div><span>Campaign Teams</span><h3>Direct Teams</h3></div>
            <div className="admin-catalog-pills">{campaign.directTeams.map((team) => <TeamPill key={team.id} team={team} campaign={campaign} />)}</div>
          </section>
        )}
      </div>
    </article>
  )
}

export function AdminCampaignsPage() {
  const { catalog, loading, error, refresh } = useBusinessCatalog()
  const [query, setQuery] = useState('')
  const campaigns = useMemo(() => buildCampaignBranches(catalog), [catalog])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return campaigns
    return campaigns.filter((campaign) => [
      campaign.name,
      campaign.code,
      campaign.description,
      ...campaign.units.flatMap((unit) => [unit.name, ...unit.teams.map((team) => team.name)]),
      ...campaign.directTeams.map((team) => team.name),
    ].some((value) => String(value ?? '').toLowerCase().includes(normalized)))
  }, [campaigns, query])

  if (loading && !campaigns.length) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading campaigns" body="Loading Campaigns, operating units and Teams…" /></main>
  if (error && !campaigns.length) return <main className="admin-content"><AdminStatePanel kind="error" title="Campaigns unavailable" body={error.message} onRetry={refresh} /></main>

  return (
    <main className="admin-content admin-content--catalog">
      <div className="admin-page-heading">
        <div><p>Operations</p><h1>Campaigns &amp; units</h1><span>Review the operations Pulse supports, with their operating units and Teams</span></div>
        <Button type="button" variant="secondary" loading={loading} onClick={refresh}>Refresh</Button>
      </div>
      <section className="admin-filter-bar admin-filter-bar--campaigns" aria-label="Campaign filters">
        <label className="admin-search"><span>Search Campaigns</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Campaign, unit, or Team" /></label>
      </section>
      <div className="admin-list-meta" aria-live="polite"><strong>{filtered.length}</strong> of {campaigns.length} Campaigns</div>
      {!campaigns.length
        ? <AdminStatePanel kind="empty" title="No campaigns" body="No campaigns have been added yet." />
        : !filtered.length
          ? <AdminStatePanel kind="empty" title="No matching campaigns" body="Try another Campaign, unit, or Team name." />
          : <div className="admin-catalog-campaigns">{filtered.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div>}
    </main>
  )
}
