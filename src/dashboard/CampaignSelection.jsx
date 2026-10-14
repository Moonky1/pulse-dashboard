import { campaignLabel } from './reportDatasets.js'
export function CampaignSelection({ scope, kind, campaigns, setCampaigns, confirmed, setConfirmed, busy }) {
  const available = scope?.campaigns || []
  return <fieldset className="dash-campaign-selection" disabled={busy}><legend>{kind === 'run_test' ? 'Run test · OP5 / OP6' : 'Campaigns in this export'}</legend>
    {kind !== 'run_test' && <><button type="button" onClick={() => {setCampaigns([...available]); setConfirmed(false)}}>All campaigns</button><div className="dash-campaign-options">{available.map(c => <label key={c}><input type="checkbox" checked={campaigns.includes(c)} onChange={e => {setCampaigns(e.target.checked ? [...campaigns,c] : campaigns.filter(v=>v!==c)); setConfirmed(false)}}/>{campaignLabel(c)}</label>)}</div></>}
    <label className="dash-campaign-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I exported {kind === 'run_test' ? 'only OP5 and OP6' : campaigns.length === available.length ? 'all campaigns' : campaigns.map(campaignLabel).join(' / ') || 'the campaigns selected above'} with these same filters.</label>
  </fieldset>
}
