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
            {step.type !== 'action' && (
              <span className="go-step-number">{step.id}</span>
            )}
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

  const toggle = (id) => setOpen(open === id ? null : id)

  return (
    <div className="go-objection-list">
      {objections.map((obj) => (
        <div
          key={obj.id}
          className={`go-objection-card ${open === obj.id ? 'open' : ''}`}
          onClick={() => toggle(obj.id)}
        >
          <div className="go-objection-header">
            <span className="go-objection-emoji">{obj.emoji}</span>
            <span className="go-objection-title">
              {lang === 'es' ? obj.titleEs : obj.title}
            </span>
            <span className="go-objection-goal">{obj.goal}</span>
            <span className="go-objection-chevron">▼</span>
          </div>
          <div className="go-objection-body">
            <div className="go-rebuttal-label">
              {lang === 'es' ? 'Respuesta' : 'Rebuttal'}
            </div>
            <div className="go-rebuttal-text">
              {lang === 'es' ? obj.rebuttalEs : obj.rebuttalEn}
            </div>
            {obj.note && (
              <div className="go-rebuttal-note">⚠️ {obj.note}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Product Knowledge View ─── */
function ProductView() {
  const { comparison, canCover, cannotCover, duration } = productKnowledge

  return (
    <div>
      {/* Comparison */}
      <div className="go-block-title">📊 Know the Difference</div>
      <div className="go-product-comparison" style={{ marginBottom: 32 }}>
        {comparison.items.map((item) => (
          <div key={item.name} className="go-product-col">
            <div
              className="go-product-col-title"
              style={{ borderColor: item.color, color: item.color }}
            >
              {item.name}
            </div>
            <ul>
              {item.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Coverage */}
      <div className="go-block-title">🔍 Coverage Eligibility</div>
      <div className="go-coverage-grid">
        <div className="go-coverage-box can">
          <div className="go-coverage-title">✓ What We Cover</div>
          <ul>
            {canCover.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="go-coverage-box cannot">
          <div className="go-coverage-title">✗ What We Cannot Cover</div>
          <ul>
            {cannotCover.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Duration */}
      <div className="go-block-title">⏱️ Duration & Service Process</div>
      <div className="go-protocol-list">
        {duration.points.map((p, i) => (
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
      {/* 4 Steps */}
      <div className="go-block-title">📞 4-Step Call Flow</div>
      <div className="go-flow-steps">
        {callFlow.steps.map((step) => (
          <div key={step.id} className="go-flow-step">
            <div className="go-flow-number">{step.id}</div>
            <div className="go-flow-content">
              <div className="go-flow-title">
                {step.icon} {step.title}
              </div>
              <div className="go-flow-desc">{step.description}</div>
              <div className="go-flow-points">
                {step.keyPoints.map((kp, i) => (
                  <span key={i} className="go-flow-point">{kp}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Protocol */}
      <div className="go-block-title">🔄 Transfer Protocol</div>
      <div className="go-protocol-list" style={{ marginBottom: 32 }}>
        {callFlow.transferProtocol.map((step, i) => (
          <div key={i} className="go-protocol-item">
            <div className="go-protocol-num">{i + 1}</div>
            <div className="go-protocol-text">{step}</div>
          </div>
        ))}
      </div>

      {/* Waiting Questions */}
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
      {/* What NOT to say */}
      <div className="go-block-title">🚫 What NOT to Say</div>
      <div className="go-dont-list">
        {dosAndDonts.donts.map((item, i) => (
          <div key={i} className="go-dont-item">
            <div className="go-dont-rule">{item.rule}</div>
            <div className="go-dont-detail">{item.detail}</div>
          </div>
        ))}
      </div>

      {/* Form fields */}
      <div className="go-block-title">📄 Reading the Form</div>
      <div className="go-coverage-grid" style={{ marginBottom: 32 }}>
        <div className="go-coverage-box can">
          <div className="go-coverage-title">✓ Use These</div>
          <ul>
            {dosAndDonts.formFields.use.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
        <div className="go-coverage-box cannot">
          <div className="go-coverage-title">✗ Ignore These</div>
          <ul>
            {dosAndDonts.formFields.ignore.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Delivery Standards */}
      <div className="go-block-title">🎙️ Script Delivery Standards</div>
      <div className="go-protocol-list" style={{ marginBottom: 32 }}>
        {dosAndDonts.deliveryStandards.map((s, i) => (
          <div key={i} className="go-protocol-item">
            <div className="go-protocol-num">{i + 1}</div>
            <div className="go-protocol-text">{s}</div>
          </div>
        ))}
      </div>

      {/* Practice Structure */}
      <div className="go-block-title">🏋️ Practice Structure</div>
      <div className="go-disposition-grid">
        {dosAndDonts.practiceStructure.map((item, i) => (
          <div key={i} className="go-disposition-item">
            <div className="go-disposition-code">{item.title}</div>
            <div className="go-disposition-desc">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Dialer section */}
      <div className="go-block-title" style={{ marginTop: 32 }}>📟 Disposition Codes</div>
      <div className="go-disposition-grid">
        {dialer.dispositions.map((d) => (
          <div
            key={d.code}
            className={`go-disposition-item ${d.flag || ''}`}
          >
            <div className="go-disposition-code">{d.code}</div>
            <div className="go-disposition-label">{d.label}</div>
            <div className="go-disposition-desc">{d.description}</div>
          </div>
        ))}
      </div>

      {/* Pause Codes */}
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

/* ─── Main Detail Page ─── */
export default function GoLearnDetail() {
  const { id } = useParams()
  const nav = useNavigate()

  const category = learnCategories.find((c) => c.id === id)
  if (!category) {
    return (
      <div className="go-page" style={{ padding: 40, textAlign: 'center' }}>
        <p>Category not found.</p>
        <button className="go-btn go-btn-outline" onClick={() => nav('/go/learn')}>
          Back to Learn
        </button>
      </div>
    )
  }

  const renderContent = () => {
    switch (category.type) {
      case 'script':
        return <ScriptView lang={category.ref} />
      case 'objections':
        return <ObjectionsView lang={category.ref} />
      case 'product':
        return <ProductView />
      case 'callflow':
        return <CallFlowView />
      case 'dosdонts':
        return <DosDontsView />
      default:
        return <p>Content coming soon.</p>
    }
  }

  return (
    <div className="go-page">
      <nav className="go-nav">
        <a className="go-nav-logo" href="/go">
          <span>Pulse</span>
          <span className="go-badge">GO</span>
        </a>
        <button className="go-nav-back" onClick={() => nav('/go/learn')}>
          ← Learn
        </button>
      </nav>

      <div className="go-detail-page">
        <div className="go-detail-header">
          <h1 className="go-detail-title">
            {category.icon} {category.title}
          </h1>
          <p className="go-detail-sub">{category.description}</p>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}