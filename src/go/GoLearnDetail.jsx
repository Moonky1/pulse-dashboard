import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  learnCategories,
  scripts,
  objections,
  productKnowledge,
  callFlow,
  dosAndDonts,
  dialer,
} from './goContent'
import './go.css'

/* ─── Training Image Component ─── */
function TrainingImg({ src, alt, caption }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <img
        src={`/training/${src}`}
        alt={alt}
        style={{
          width: '100%',
          maxWidth: 760,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          display: 'block',
        }}
        onError={e => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
      <div style={{
        display: 'none', width: '100%', maxWidth: 760,
        minHeight: 100, background: '#161a23',
        border: '2px dashed rgba(249,115,22,0.3)', borderRadius: 10,
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, color: '#6b7280', fontSize: 14, padding: 20,
      }}>
        <span>📷 {alt}</span>
        <small style={{ opacity: 0.5 }}>Add file to: public/training/{src}</small>
      </div>
      {caption && (
        <div style={{
          fontSize: 12, color: '#9ca3af', textAlign: 'center',
          maxWidth: 700, lineHeight: 1.5,
          background: 'rgba(249,115,22,0.06)', borderRadius: 6, padding: '6px 12px',
        }}>
          {caption}
        </div>
      )}
    </div>
  )
}

/* ─── Script View ─── */
function ScriptView({ lang }) {
  const script = scripts[lang]
  return (
    <div>
      <div className="go-block-title">📋 {script.flag} {script.title}</div>
      <div className="go-script-steps">
        {script.steps.map((step) => (
          <div key={step.id} className={`go-step-card type-${step.type}`}>
            <div className="go-step-label">{step.label}</div>
            {step.type !== 'action' && <span className="go-step-number">{step.id}</span>}
            <div className="go-step-text">{step.text}</div>
            {step.tip && <div className="go-step-tip">💡 {step.tip}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Objections View ─── */
function ObjectionsView({ lang }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="go-objection-list">
      {objections.map((obj) => (
        <div
          key={obj.id}
          className={`go-objection-card ${open === obj.id ? 'open' : ''}`}
          onClick={() => setOpen(open === obj.id ? null : obj.id)}
        >
          <div className="go-objection-header">
            <span className="go-objection-emoji">{obj.emoji}</span>
            <span className="go-objection-title">{lang === 'es' ? obj.titleEs : obj.title}</span>
            <span className="go-objection-goal">{obj.goal}</span>
            <span className="go-objection-chevron">▼</span>
          </div>
          <div className="go-objection-body">
            <div className="go-rebuttal-label">{lang === 'es' ? 'Respuesta' : 'Rebuttal'}</div>
            <div className="go-rebuttal-text">{lang === 'es' ? obj.rebuttalEs : obj.rebuttalEn}</div>
            {obj.note && <div className="go-rebuttal-note">⚠️ {obj.note}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Product Knowledge View ─── */
function ProductView() {
  return (
    <div>
      <div className="go-block-title">📊 Know the Difference</div>
      <div className="go-product-comparison" style={{ marginBottom: 32 }}>
        {productKnowledge.comparison.items.map((item) => (
          <div key={item.name} className="go-product-col">
            <div className="go-product-col-title" style={{ borderColor: item.color, color: item.color }}>
              {item.name}
            </div>
            <ul>{item.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="go-block-title">🔍 Coverage Eligibility</div>
      <div className="go-coverage-grid">
        <div className="go-coverage-box can">
          <div className="go-coverage-title">✓ What We Cover</div>
          <ul>{productKnowledge.canCover.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
        <div className="go-coverage-box cannot">
          <div className="go-coverage-title">✗ What We Cannot Cover</div>
          <ul>{productKnowledge.cannotCover.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
      </div>
      <div className="go-block-title" style={{ marginTop: 24 }}>⏱️ Duration & Service Process</div>
      <div className="go-protocol-list">
        {productKnowledge.duration.points.map((p, i) => (
          <div key={i} className="go-protocol-item">
            <div className="go-protocol-num">{i + 1}</div>
            <div className="go-protocol-text">{p}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Call Flow View ─── */
function CallFlowView() {
  return (
    <div>
      <div className="go-block-title">📞 4-Step Call Flow</div>
      <div className="go-flow-steps">
        {callFlow.steps.map((step) => (
          <div key={step.id} className="go-flow-step">
            <div className="go-flow-number">{step.id}</div>
            <div className="go-flow-content">
              <div className="go-flow-title">{step.icon} {step.title}</div>
              <div className="go-flow-desc">{step.description}</div>
              <div className="go-flow-points">
                {step.keyPoints.map((kp, i) => <span key={i} className="go-flow-point">{kp}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="go-block-title">🔄 Transfer Protocol</div>
      <div className="go-protocol-list" style={{ marginBottom: 32 }}>
        {callFlow.transferProtocol.map((step, i) => (
          <div key={i} className="go-protocol-item">
            <div className="go-protocol-num">{i + 1}</div>
            <div className="go-protocol-text">{step}</div>
          </div>
        ))}
      </div>
      <div className="go-block-title">⏳ While Waiting for an Advisor</div>
      <div className="go-waiting-list">
        {callFlow.waitingQuestions.map((q, i) => (
          <div key={i} className="go-waiting-item">{q}</div>
        ))}
      </div>
    </div>
  )
}

/* ─── Do's & Don'ts View ─── */
function DosDontsView() {
  return (
    <div>
      <div className="go-block-title">🚫 What NOT to Say</div>
      <div className="go-dont-list">
        {dosAndDonts.donts.map((item, i) => (
          <div key={i} className="go-dont-item">
            <div className="go-dont-rule">{item.rule}</div>
            <div className="go-dont-detail">{item.detail}</div>
          </div>
        ))}
      </div>
      <div className="go-block-title">📄 Reading the Form</div>
      <div className="go-coverage-grid" style={{ marginBottom: 32 }}>
        <div className="go-coverage-box can">
          <div className="go-coverage-title">✓ Use These</div>
          <ul>{dosAndDonts.formFields.use.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
        <div className="go-coverage-box cannot">
          <div className="go-coverage-title">✗ Ignore These</div>
          <ul>{dosAndDonts.formFields.ignore.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
      </div>
      <div className="go-block-title">🎙️ Script Delivery Standards</div>
      <div className="go-protocol-list" style={{ marginBottom: 32 }}>
        {dosAndDonts.deliveryStandards.map((s, i) => (
          <div key={i} className="go-protocol-item">
            <div className="go-protocol-num">{i + 1}</div>
            <div className="go-protocol-text">{s}</div>
          </div>
        ))}
      </div>
      <div className="go-block-title">📟 Disposition Codes</div>
      <div className="go-disposition-grid">
        {dialer.dispositions.map((d) => (
          <div key={d.code} className={`go-disposition-item ${d.flag || ''}`}>
            <div className="go-disposition-code">{d.code}</div>
            <div className="go-disposition-label">{d.label}</div>
            <div className="go-disposition-desc">{d.description}</div>
          </div>
        ))}
      </div>
      <div className="go-block-title" style={{ marginTop: 32 }}>⏸️ Pause Codes</div>
      <div className="go-disposition-grid">
        {dialer.pauseCodes.map((p) => (
          <div key={p.code} className="go-disposition-item">
            <div className="go-disposition-code">{p.label}</div>
            <div className="go-disposition-label">{p.code}</div>
            <div className="go-disposition-desc">{p.desc} ({p.time})</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Dialer Guide View (REAL IMAGES) ─── */
function DialerGuideView() {
  return (
    <div>
      {/* Step 0: IP Validation */}
      <div className="go-block-title">🌐 Step 0 — Validate Your IP (Every Day)</div>
      <div style={{ marginBottom: 16, fontSize: 13, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '10px 14px', borderRadius: 8 }}>
        ⚠️ Do this EVERY DAY before logging in. URL: <strong>https://alwaysbeclosing.ai:444/abc_validation.php</strong> — User: 9996 or 9995 — Password: validateme365
      </div>
      <TrainingImg src="vici-ip-validation.png" alt="VICIbox Agent Validation" caption="Submit and confirm your IP address appears as validated" />

      {/* Step 1: Welcome */}
      <div className="go-block-title" style={{ marginTop: 32 }}>🔐 Step 1 — Welcome Screen</div>
      <TrainingImg src="vici-welcome.png" alt="VICIdial Welcome Screen" caption="Click 'Agent Login' to proceed" />

      {/* Step 2: Phone Login */}
      <div className="go-block-title" style={{ marginTop: 24 }}>📞 Step 2 — Phone Login</div>
      <TrainingImg src="vici-phone-login.png" alt="VICIdial Phone Login" caption="Enter your Phone Login (extension) and Phone Password, then click SUBMIT" />

      {/* Step 3: Campaign Login */}
      <div className="go-block-title" style={{ marginTop: 24 }}>🎯 Step 3 — Campaign Login</div>
      <TrainingImg src="vici-campaign-login.png" alt="VICIdial Campaign Login" caption="Enter your credentials and select your campaign: openers2 or openers3 (as instructed by your supervisor)" />

      {/* Go Active */}
      <div className="go-block-title" style={{ marginTop: 24 }}>📡 Main Dialer Screen — Go Active</div>
      <TrainingImg src="vici-go-active.png" alt="Dialer Main Screen - YOU ARE PAUSED" caption="Once logged in you will see YOU ARE PAUSED. To transfer a call, click TRANSFER - CONF on the left panel." />

      {/* Pause Codes */}
      <div className="go-block-title" style={{ marginTop: 24 }}>⏸️ Pause Codes</div>
      <TrainingImg src="vici-pause-codes.png" alt="Dialer Pause Codes" caption="Always use the correct pause code. Break = 10min max | RR = 5min max | Lunch = 1hr | Manage = only when supervisor requests" />

      {/* How to Transfer - English */}
      <div className="go-block-title" style={{ marginTop: 24 }}>🇺🇸 How to Transfer — English</div>
      <TrainingImg src="vici-live-call.png" alt="Live Call Screen with Transfer-Conf" caption="1. During a LIVE CALL, click TRANSFER - CONF on the left panel" />
      <TrainingImg src="vici-transfer-functions.png" alt="Transfer Conference Functions" caption="2. Click DIAL WITH CUSTOMER → Wait for SA to pick up and speak first → 3. Click LEAVE 3-WAY CALL (stay at least 15 seconds before leaving)" />

      {/* How to Transfer - Spanish */}
      <div className="go-block-title" style={{ marginTop: 24 }}>🇪🇸 How to Transfer — Spanish</div>
      <div style={{ fontSize: 13, color: '#f97316', background: 'rgba(249,115,22,0.08)', padding: '8px 14px', borderRadius: 8, marginBottom: 12 }}>
        ⚡ For Spanish: Select <strong>BlindSpanishXfer</strong> from the dropdown BEFORE clicking Dial with Customer
      </div>
      <TrainingImg src="vici-live-call.png" alt="Live Call - Spanish Transfer" caption="1. Click TRANSFER - CONF on the left panel" />
      <TrainingImg src="vici-transfer-functions.png" alt="Transfer Functions - Select Spanish" caption="2. Select BlindSpanishXfer from dropdown → DIAL WITH CUSTOMER → wait for SA → LEAVE 3-WAY CALL" />

      {/* Lead Form */}
      <div className="go-block-title" style={{ marginTop: 24 }}>📋 How to Read the Lead Form</div>
      <TrainingImg src="vici-lead-form.png" alt="VICIdial Lead Form" caption="✓ USE: First/Last Name, Origination Date, Loan Balance — ✗ NEVER mention: Address, Finance Company, Terms of Loan" />

      {/* Dispositions */}
      <div className="go-block-title" style={{ marginTop: 24 }}>📊 Disposition Screen</div>
      <TrainingImg src="vici-dispositions.png" alt="Call Dispositions" caption="Use ONLY these dispositions. XFER = successful transfer ✓ | NI = not interested | CALLBK = call back | SPXFER = Spanish transfer" />
    </div>
  )
}

/* ─── Main Detail Page ─── */
export default function GoLearnDetail() {
  const { id } = useParams()
  const nav = useNavigate()

  const category = learnCategories.find((c) => c.id === id)
  if (!category) {
    return (
      <div className="go-page" style={{ padding: 40, textAlign: 'center' }}>
        <p>Category not found.</p>
        <button className="go-btn go-btn-outline" onClick={() => nav('/go/learn')}>Back to Learn</button>
      </div>
    )
  }

  const renderContent = () => {
    switch (category.type) {
      case 'script':     return <ScriptView lang={category.ref} />
      case 'objections': return <ObjectionsView lang={category.ref} />
      case 'product':    return <ProductView />
      case 'callflow':   return <CallFlowView />
      case 'dosdонts':   return <DosDontsView />
      case 'dialer':     return <DialerGuideView />
      default:           return <p>Content coming soon.</p>
    }
  }

  return (
    <div className="go-page">
      <nav className="go-nav">
        <a className="go-nav-logo" href="/go">
          <span>Pulse</span>
          <span className="go-badge">GO</span>
        </a>
        <button className="go-nav-back" onClick={() => nav('/go/learn')}>← Learn</button>
      </nav>
      <div className="go-detail-page">
        <div className="go-detail-header">
          <h1 className="go-detail-title">{category.icon} {category.title}</h1>
          <p className="go-detail-sub">{category.description}</p>
        </div>
        {renderContent()}
      </div>
    </div>
  )
}