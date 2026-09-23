import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { AdminStatePanel } from '../components/AdminStatePanel.jsx'
import { LifecycleBadge } from '../components/LifecycleBadge.jsx'
import { RoleScopeList } from '../components/RoleScopeList.jsx'
import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { TeamBadge } from '../components/TeamBadge.jsx'
import { useBusinessCatalog } from '../hooks/useBusinessCatalog.js'
import { useManagedUsers } from '../hooks/useManagedUsers.js'
import { leadershipGroup, teamTone } from '../visualIdentity.js'

function MemberCard({ member, directory }) {
  const destination = member.status === 'pending_approval' ? `/admin/pending/${member.id}` : `/admin/users/${member.id}`
  return (
    <Link className="admin-team-member" to={destination}>
      <StaffAvatar name={member.fullName} customAvatarPath={member.customAvatarPath} googleAvatarUrl={member.googleAvatarUrl} avatarUpdatedAt={member.avatarUpdatedAt} />
      <span className="admin-team-member__identity"><strong>{member.fullName}</strong><small>{member.positionName || 'Position not assigned'}</small></span>
      <RoleScopeList roles={member.roles} directory={directory} compact />
      <LifecycleBadge status={member.status} />
      <span className="admin-row-arrow" aria-hidden="true">→</span>
    </Link>
  )
}

function MemberGroup({ title, members, directory }) {
  if (!members.length) return null
  return <section className="admin-team-profile__member-group"><div className="admin-team-profile__section-heading"><h2>{title}</h2><span>{members.length}</span></div><div className="admin-team-members">{members.map((member) => <MemberCard key={member.id} member={member} directory={directory} />)}</div></section>
}

export function AdminTeamProfilePage() {
  const { teamId } = useParams()
  const catalogState = useBusinessCatalog()
  const peopleState = useManagedUsers({ includeDetails: true })
  const { catalog } = catalogState
  const team = useMemo(() => catalog.teams.find((item) => item.id === teamId) ?? null, [catalog.teams, teamId])
  const campaign = useMemo(() => catalog.campaigns.find((item) => item.id === team?.campaignId) ?? null, [catalog.campaigns, team])
  const unit = useMemo(() => catalog.operatingUnits.find((item) => item.id === team?.operatingUnitId) ?? null, [catalog.operatingUnits, team])
  const department = useMemo(() => catalog.departments.find((item) => item.id === team?.departmentId) ?? null, [catalog.departments, team])
  const area = useMemo(() => catalog.businessAreas.find((item) => item.id === team?.businessAreaId) ?? null, [catalog.businessAreas, team])
  const members = useMemo(() => peopleState.users.filter((person) => person.primaryTeamId === teamId || person.teamId === teamId), [peopleState.users, teamId])
  const leadership = members.filter((member) => leadershipGroup(member.positionName) === 'leadership')
  const staff = members.filter((member) => leadershipGroup(member.positionName) === 'staff')

  const loading = catalogState.loading || peopleState.loading
  const error = catalogState.error || peopleState.error
  if (loading && !team) return <main className="admin-content"><AdminStatePanel kind="loading" title="Loading Team" body="Getting the Team profile…" /></main>
  if (error && !team) return <main className="admin-content"><AdminStatePanel kind="error" title="Team unavailable" body={error.message} onRetry={() => Promise.all([catalogState.refresh(), peopleState.refresh()])} /></main>
  if (!team) return <main className="admin-content"><AdminStatePanel kind="error" title="Team not found" body="This Team is not available in the current organization catalog." /></main>

  const tone = teamTone({ code: team.code, campaignCode: campaign?.code })
  return (
    <main className="admin-content admin-content--team-profile">
      <Link className="admin-back-link" to={campaign ? '/admin/campaigns' : '/admin/organization'}>← Back to {campaign ? 'Campaigns' : 'organization'}</Link>
      <header className={`admin-team-profile__hero admin-team-profile__hero--${tone}`}>
        <div className="admin-team-profile__mark" aria-hidden="true"><span /></div>
        <div><p>Team profile</p><h1>{team.name}</h1><div className="admin-team-profile__path">{[area?.name, department?.name || campaign?.name, unit?.name].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div></div>
        <dl><div><dt>Members</dt><dd>{members.length}</dd></div><div><dt>Status</dt><dd>{team.isActive ? 'Active' : 'Inactive'}</dd></div></dl>
        <Button type="button" variant="secondary" loading={loading} onClick={() => Promise.all([catalogState.refresh(), peopleState.refresh()])}>Refresh</Button>
      </header>

      <div className="admin-team-profile__overview">
        <section><p className="admin-section-label">Overview</p><h2>Where this Team works</h2><dl><div><dt>Business area</dt><dd>{area?.name || 'Not assigned'}</dd></div><div><dt>Department</dt><dd>{department?.name || 'Not applicable'}</dd></div><div><dt>Campaign</dt><dd>{campaign?.name || 'Not applicable'}</dd></div><div><dt>Operating unit</dt><dd>{unit?.name || 'Direct placement'}</dd></div></dl><TeamBadge teamId={team.id} name={team.name} code={team.code} campaignCode={campaign?.code} linked={false} /></section>
        <section><p className="admin-section-label">Quality coverage</p><h2>QA support</h2><div className="admin-team-profile__empty"><strong>No QA coverage recorded</strong><span>Coverage will appear here when an authoritative assignment is available.</span></div></section>
        <section><p className="admin-section-label">Activity</p><h2>Recent Team activity</h2><div className="admin-team-profile__empty"><strong>No recent Team activity</strong><span>Audited Team events will appear here when a Team-specific activity contract is available.</span></div></section>
      </div>

      {!members.length ? <AdminStatePanel kind="empty" title="No Team members yet" body="Assigned Staff will appear here." /> : <div className="admin-team-profile__members"><MemberGroup title="Leadership" members={leadership} directory={peopleState.directory} /><MemberGroup title="Staff" members={staff} directory={peopleState.directory} /></div>}
    </main>
  )
}
