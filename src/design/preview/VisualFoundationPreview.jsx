import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { PulseOrb } from '../../components/ui/PulseOrb.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import './preview.css'

const palette = [
  ['Canvas', '#05070d'],
  ['Surface 1', '#0c101a'],
  ['Surface 2', '#111622'],
  ['Surface 3', '#171d2b'],
  ['Primary', '#7c68ff'],
  ['Electric blue', '#4b8dff'],
  ['Success', '#4dca8a'],
  ['Warning', '#e7b75a'],
  ['Error', '#f0737d'],
]

const navGroups = [
  ['Workspace', ['Overview', 'Analytics', 'Rankings', 'Teams', 'Commissions']],
  ['Apps', ['Pulse GO', 'Studio', 'Academy']],
  ['System', ['Settings', 'Support', 'Admin']],
]

const feedback = [
  ['success', 'Profile approved', 'Identity and permissions are ready.'],
  ['warning', 'Review required', 'This account needs an organization assignment.'],
  ['error', 'Permission denied', 'Your current role cannot perform this action.'],
  ['info', 'Sync in progress', 'Fresh data will appear here automatically.'],
]

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  }
  return <svg className="preview-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function Section({ eyebrow, title, description, children, id }) {
  return (
    <section className="preview-section" id={id}>
      <header className="preview-section__header">
        <p className="preview-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  )
}

function PreviewSidebar() {
  return (
    <aside className="preview-sidebar" aria-label="Application navigation preview">
      <div className="preview-brand">
        <PulseOrb size="sm" />
        <span>Pulse</span>
      </div>
      <nav>
        {navGroups.map(([group, items]) => (
          <div className="preview-nav-group" key={group}>
            <p>{group}</p>
            {items.map((item, index) => (
              <button className={group === 'Workspace' && index === 0 ? 'is-active' : ''} key={item} type="button">
                <span className="preview-nav-icon" aria-hidden="true">{item.slice(0, 1)}</span>
                <span>{item}</span>
                {item === 'Admin' && <span className="preview-nav-lock">•</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="preview-user">
        <span className="preview-avatar">SK</span>
        <span><strong>Simon</strong><small>Super Admin</small></span>
        <span className="preview-user__more">•••</span>
      </div>
    </aside>
  )
}

function AuthConcept() {
  return (
    <Card level={1} className="auth-concept">
      <div className="auth-concept__visual">
        <div className="auth-concept__brand"><PulseOrb size="sm" /><span>Pulse</span></div>
        <div className="auth-concept__orb"><PulseOrb size="xl" active /></div>
        <div className="auth-concept__copy">
          <Badge tone="info" dot>Secure workspace</Badge>
          <h3>One identity.<br />Every part of Pulse.</h3>
          <p>Designed for clarity, security, and focused work across Kampaign Kings.</p>
        </div>
        <p className="auth-concept__foot">Kampaign Kings internal platform</p>
      </div>
      <div className="auth-concept__panel">
        <div className="auth-mobile-brand"><PulseOrb size="sm" /><span>Pulse</span></div>
        <div className="auth-concept__heading">
          <p className="preview-eyebrow">Welcome back</p>
          <h3>Sign in to Pulse</h3>
          <p>Use your verified company identity.</p>
        </div>
        <div className="auth-concept__form">
          <Input id="preview-auth-email" type="email" label="Email address" placeholder="name@company.com" leading={<Icon name="mail" size={16} />} />
          <Input id="preview-auth-password" type="password" label="Password" placeholder="Enter your password" leading={<Icon name="lock" size={16} />} />
          <div className="auth-form-meta"><label><input type="checkbox" /> <span>Keep me signed in</span></label><button type="button">Forgot password?</button></div>
          <Button size="lg">Continue <Icon name="arrow" size={17} /></Button>
        </div>
        <div className="auth-concept__divider"><span>New to Pulse?</span></div>
        <Button variant="secondary" size="lg">Create an account</Button>
        <p className="auth-concept__legal">Access is granted only after company approval.</p>
      </div>
    </Card>
  )
}

export default function VisualFoundationPreview() {
  return (
    <div className="preview-page">
      <header className="preview-hero">
        <div className="preview-hero__halo" aria-hidden="true" />
        <nav className="preview-hero__nav" aria-label="Design preview navigation">
          <a className="preview-brand" href="#top"><PulseOrb size="sm" /><span>Pulse</span></a>
          <span className="preview-version">Visual foundation · UI-0</span>
        </nav>
        <div className="preview-hero__content" id="top">
          <div>
            <p className="preview-eyebrow">Pulse design system</p>
            <h1>Precision,<br /><span>with a pulse.</span></h1>
            <p className="preview-hero__lede">A calm, high-performance visual language for the next generation of Kampaign Kings’ internal platform.</p>
            <div className="preview-hero__actions"><Button size="lg">Explore foundation <Icon name="arrow" size={17} /></Button><Button variant="ghost" size="lg">View principles</Button></div>
          </div>
          <div className="preview-hero__mark"><PulseOrb size="xl" active /><span className="preview-orbit preview-orbit--one" /><span className="preview-orbit preview-orbit--two" /></div>
        </div>
        <div className="preview-principles">
          <span>01 <strong>Calm authority</strong></span>
          <span>02 <strong>Disciplined depth</strong></span>
          <span>03 <strong>Immediate response</strong></span>
          <span>04 <strong>Accessible by default</strong></span>
        </div>
      </header>

      <main className="preview-main">
        <Section eyebrow="01 · Foundations" title="Color and light" description="Dark neutral surfaces carry the interface. Violet and blue communicate action; spectral light is reserved for signature moments.">
          <div className="palette-grid">
            {palette.map(([name, value]) => <div className="palette-chip" key={name}><span style={{ background: value }} /><strong>{name}</strong><code>{value}</code></div>)}
            <div className="palette-chip palette-chip--spectral"><span /><strong>Spectral</strong><code>signature only</code></div>
          </div>
        </Section>

        <Section eyebrow="02 · Typography" title="Clear at every altitude" description="A local-first system font stack removes boot-time font requests while retaining a premium corporate voice.">
          <Card className="type-specimen">
            <div className="type-display"><span>Display · 76/76</span><strong>Work with clarity.</strong></div>
            <div className="type-row"><span>Heading 1</span><h2>The operating system for your team.</h2></div>
            <div className="type-row"><span>Heading 3</span><h3>Campaign performance</h3></div>
            <div className="type-row"><span>Body</span><p>Focus on the signal. Pulse keeps operational data, learning, and collaboration in one precise workspace.</p></div>
            <div className="type-row"><span>Numeric</span><strong className="type-numeric">98.42%</strong></div>
          </Card>
        </Section>

        <Section eyebrow="03 · Actions" title="Buttons and controls" description="Controls use measured contrast and tactile motion—never oversized glow.">
          <Card className="component-stage">
            <div className="component-row"><Button>Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Remove access</Button><Button variant="secondary" iconOnly aria-label="Notifications"><Icon name="bell" /></Button></div>
            <div className="component-row"><Button loading>Processing</Button><Button disabled>Unavailable</Button><Button size="sm">Small</Button><Button size="lg">Large action</Button></div>
          </Card>
        </Section>

        <Section eyebrow="04 · Forms" title="Designed for trust" description="Every state is legible, keyboard-visible, and prepared for the new authentication experience.">
          <div className="form-grid">
            <Input id="preview-name" label="Full name" placeholder="Enter your full name" hint="Use the name your team knows you by." />
            <Input id="preview-email" type="email" label="Email address" defaultValue="simon@kampaignkings.com" success="Email format looks good." />
            <Input id="preview-invalid" type="password" label="Password" defaultValue="short" error="Use at least 12 characters." />
            <Input id="preview-disabled" label="Employee ID" defaultValue="Assigned after approval" disabled />
            <label className="preview-select-field"><span>Department</span><select defaultValue="corporate"><option value="corporate">Corporate</option><option value="operations">Operations</option></select><small>Server-authorized selection</small></label>
            <label className="preview-textarea-field"><span>Review note</span><textarea placeholder="Add an optional note" rows="3" /></label>
          </div>
          <div className="choice-row">
            <label className="preview-check"><input type="checkbox" defaultChecked /><span>Checkbox</span></label>
            <label className="preview-check"><input type="radio" name="preview-radio" defaultChecked /><span>Radio choice</span></label>
            <label className="preview-switch"><input type="checkbox" defaultChecked /><span aria-hidden="true" /><strong>Notifications</strong></label>
          </div>
        </Section>

        <Section eyebrow="05 · Application shell" title="Quiet navigation, strong orientation" description="The system scales from a 264px productivity sidebar to a compact mobile navigation surface.">
          <Card className="shell-preview">
            <PreviewSidebar />
            <div className="shell-content">
              <header className="shell-topbar"><div><p>Workspace</p><h3>Overview</h3></div><div className="shell-actions"><button aria-label="Search"><Icon name="search" /></button><button aria-label="Notifications"><Icon name="bell" /></button><span className="preview-avatar">SK</span></div></header>
              <div className="shell-dashboard">
                <div className="metric-grid">
                  <Card className="metric-card"><span>Active agents</span><strong>148</strong><small className="metric-up">↑ 8.4% this week</small></Card>
                  <Card className="metric-card"><span>Conversion</span><strong>18.7%</strong><small>Target 20%</small></Card>
                  <Card className="metric-card"><span>Quality score</span><strong>94.2</strong><small className="metric-up">↑ 2.1 points</small></Card>
                </div>
                <Card className="chart-card"><div className="chart-card__heading"><div><span>Performance</span><strong>Weekly signal</strong></div><Badge tone="success" dot>Live</Badge></div><div className="chart-bars" aria-label="Decorative chart preview">{[38,55,46,68,63,82,76,92,71,88,84,96].map((height, i)=><span key={i} style={{ height: `${height}%` }} />)}</div></Card>
              </div>
            </div>
          </Card>
        </Section>

        <Section eyebrow="06 · Data and status" title="Dense enough for work" description="Cards, tables, badges, empty states, and loading treatments share one surface grammar.">
          <div className="data-grid">
            <Card className="table-card">
              <div className="table-card__head"><div><p className="preview-eyebrow">Team health</p><h3>Approval queue</h3></div><Button variant="secondary" size="sm">Review all</Button></div>
              <div className="preview-table" role="table" aria-label="Approval queue preview">
                {[['MC','Maria Chen','Operations','pending'],['JL','Jordan Lee','Quality','success'],['AR','Alex Rivera','Corporate','warning']].map(([initials,name,team,tone])=><div className="preview-table__row" role="row" key={name}><span className="preview-avatar">{initials}</span><span><strong>{name}</strong><small>{team}</small></span><Badge tone={tone} dot>{tone === 'success' ? 'Active' : tone === 'pending' ? 'Pending' : 'Review'}</Badge><button aria-label={`More actions for ${name}`}>•••</button></div>)}
              </div>
            </Card>
            <Card className="empty-card"><div className="empty-card__icon"><Icon name="spark" size={22} /></div><h3>Nothing needs attention</h3><p>New requests and operational warnings will appear here.</p><Button variant="secondary" size="sm">Refresh</Button></Card>
          </div>
          <div className="badge-row"><Badge>Neutral</Badge><Badge tone="success" dot>Active</Badge><Badge tone="warning" dot>Review</Badge><Badge tone="error" dot>Blocked</Badge><Badge tone="info" dot>Syncing</Badge><Badge tone="pending" dot>Pending</Badge><Spinner /></div>
          <div className="skeleton-card"><span /><span /><span /></div>
        </Section>

        <Section eyebrow="07 · Feedback" title="States that belong" description="Feedback uses the same borders, surfaces, icon weight, and semantic hierarchy as the rest of Pulse.">
          <div className="feedback-grid">{feedback.map(([tone,title,copy])=><div className={`feedback-item feedback-item--${tone}`} key={tone}><span className="feedback-item__mark" aria-hidden="true" /><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div>
        </Section>

        <Section eyebrow="08 · Authentication" title="A premium first impression" description="Desktop balances a signature brand moment with a focused form. Mobile removes decoration before it compromises speed or clarity.">
          <AuthConcept />
        </Section>

        <footer className="preview-footer"><div className="preview-brand"><PulseOrb size="sm" /><span>Pulse</span></div><p>Visual Foundation · Local preview only · No backend connections</p></footer>
      </main>
    </div>
  )
}
