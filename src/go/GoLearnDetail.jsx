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

// ─────────────────────────────────────────────
//  DIALER MOCK COMPONENTS
// ─────────────────────────────────────────────

const mockWrap = {
  width: '100%', maxWidth: 720, margin: '0 auto 28px',
  borderRadius: 12, overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  fontFamily: 'DM Sans, sans-serif',
}
const mockBar = {
  background: '#1e2433', padding: '8px 14px', display: 'flex',
  alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.07)',
}
const mockDot = (c) => ({ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 })
const mockTitle = { fontSize: 12, color: '#6b7280', flex: 1, textAlign: 'center', fontWeight: 600 }
const mockBody = { background: '#f0f2f5', padding: 24 }

function MockWindow({ title, children }) {
  return (
    <div style={mockWrap}>
      <div style={mockBar}>
        <span style={mockDot('#ef4444')} />
        <span style={mockDot('#f59e0b')} />
        <span style={mockDot('#22c55e')} />
        <span style={mockTitle}>{title}</span>
      </div>
      <div style={mockBody}>{children}</div>
    </div>
  )
}

function Caption({ children }) {
  return (
    <div style={{
      fontSize: 12, color: '#9ca3af', textAlign: 'center', maxWidth: 700,
      margin: '-16px auto 24px', lineHeight: 1.5,
      background: 'rgba(249,115,22,0.06)', borderRadius: 6, padding: '6px 12px',
    }}>
      {children}
    </div>
  )
}

function Note({ children }) {
  return (
    <div style={{
      fontSize: 13, color: '#f59e0b', background: 'rgba(245,158,11,0.08)',
      padding: '10px 14px', borderRadius: 8, marginBottom: 16, lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

function OrangeNote({ children }) {
  return (
    <div style={{
      fontSize: 13, color: '#f97316', background: 'rgba(249,115,22,0.08)',
      padding: '10px 14px', borderRadius: 8, marginBottom: 16, lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

// ── Mock: IP Validation ──
function MockIPValidation() {
  return (
    <MockWindow title="Agent Validation Portal">
      <div style={{ maxWidth: 340, margin: '0 auto', background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
        <div style={{ background: '#2d7d46', padding: '10px 0', borderRadius: '8px 8px 0 0', textAlign: 'center', marginBottom: 20, margin: '-28px -28px 20px' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, padding: '12px 0' }}>Agent Validation</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 5 }}>User ID</div>
          <div style={{ border: '1px solid #ccc', borderRadius: 5, padding: '8px 12px', fontSize: 14, color: '#555', background: '#f9f9f9' }}>Enter your assigned ID</div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 5 }}>Password</div>
          <div style={{ border: '1px solid #ccc', borderRadius: 5, padding: '8px 12px', fontSize: 14, color: '#555', background: '#f9f9f9' }}>••••••••••••</div>
        </div>
        <div style={{ background: '#4a7c59', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: 6, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Submit</div>
        <div style={{ textAlign: 'center', background: '#e6f4ec', border: '1px solid #2d7d46', borderRadius: 6, padding: '10px 14px' }}>
          <div style={{ color: '#2d7d46', fontWeight: 800, fontSize: 14 }}>✓ Login Validated</div>
          <div style={{ color: '#2d7d46', fontSize: 13, marginTop: 2 }}>Your IP has been confirmed</div>
        </div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Welcome Screen ──
function MockWelcome() {
  return (
    <MockWindow title="Dialer System — Welcome">
      <div style={{ background: '#1a2340', borderRadius: 10, padding: 28, textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>📞 Auto Warranty Dialer</div>
        <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 28 }}>Powered by Campaign Management System</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f97316', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}>
            👤 Agent Login
          </div>
          <div style={{ background: '#374151', color: '#9ca3af', padding: '12px 28px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            Admin
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: '#4b5563' }}>Select "Agent Login" to continue</div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Phone Login ──
function MockPhoneLogin() {
  return (
    <MockWindow title="Dialer System — Phone Setup">
      <div style={{ maxWidth: 360, margin: '0 auto', background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2340' }}>📞 Phone Setup</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Enter your extension details</div>
        </div>
        {[
          { label: 'Phone Login (Extension)', value: 'Your extension number' },
          { label: 'Phone Password', value: '••••••••' },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{f.label}</div>
            <div style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#6b7280', background: '#f9fafb' }}>{f.value}</div>
          </div>
        ))}
        <div style={{ background: '#f97316', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: 6, fontWeight: 700, fontSize: 14 }}>Submit</div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Campaign Login ──
function MockCampaignLogin() {
  return (
    <MockWindow title="Dialer System — Campaign Selection">
      <div style={{ maxWidth: 400, margin: '0 auto', background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2340' }}>🎯 Select Campaign</div>
        </div>
        {[
          { label: 'Agent Username', value: 'Your username' },
          { label: 'Agent Password', value: '••••••••' },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{f.label}</div>
            <div style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#6b7280', background: '#f9fafb' }}>{f.value}</div>
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Campaign</div>
          <div style={{ border: '2px solid #f97316', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#1a2340', background: '#fff7ed', fontWeight: 600 }}>
            openers2 / openers3 — as instructed by supervisor
          </div>
        </div>
        <div style={{ background: '#f97316', color: '#fff', textAlign: 'center', padding: '10px 0', borderRadius: 6, fontWeight: 700, fontSize: 14 }}>Login</div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Main Dialer (Go Active) ──
function MockGoActive() {
  return (
    <MockWindow title="Dialer System — Main Screen">
      <div style={{ background: '#1a2340', borderRadius: 10, padding: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: '#111827', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>Agent: <span style={{ color: '#f97316', fontWeight: 700 }}>Your Name</span></div>
          <div style={{ background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>● YOU ARE PAUSED</div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>Campaign: openers2</div>
        </div>
        {/* Main area */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 240 }}>
          {/* Left panel */}
          <div style={{ background: '#0f1521', padding: 12, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Controls</div>
            {[
              { label: 'TRANSFER - CONF', color: '#f97316', highlight: true },
              { label: 'PAUSE', color: '#6b7280' },
              { label: 'HOLD', color: '#6b7280' },
              { label: 'HANGUP', color: '#dc2626' },
            ].map((btn, i) => (
              <div key={i} style={{
                background: btn.highlight ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${btn.highlight ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 6, padding: '8px 10px', marginBottom: 7,
                fontSize: 12, fontWeight: btn.highlight ? 700 : 500,
                color: btn.color,
              }}>
                {btn.highlight && '⭐ '}{btn.label}
              </div>
            ))}
          </div>
          {/* Right: lead area */}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lead Information</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 14 }}>
              {[
                { label: 'Name', value: 'John Smith' },
                { label: 'Financed', value: 'March 2022' },
                { label: 'Loan Balance', value: '$XX,XXX' },
                { label: 'State', value: 'TX' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: '#6b7280', minWidth: 90 }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#fdba74' }}>
              💡 To transfer: click <strong>TRANSFER - CONF</strong> on the left panel
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Pause Codes ──
function MockPauseCodes() {
  const codes = [
    { label: 'BREAK', time: '10 min max', color: '#3b82f6' },
    { label: 'RESTROOM', time: '5 min max', color: '#8b5cf6' },
    { label: 'LUNCH', time: '1 hour', color: '#f59e0b' },
    { label: 'CALLBACKS', time: 'As needed', color: '#22c55e' },
    { label: 'TECH ISSUES', time: 'As needed', color: '#ef4444' },
    { label: 'MANAGE', time: 'Supervisor only', color: '#6b7280' },
  ]
  return (
    <MockWindow title="Dialer System — Pause Codes">
      <div style={{ background: '#1a2340', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16, textAlign: 'center' }}>Select the correct pause reason</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {codes.map((c, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `3px solid ${c.color}`, borderRadius: 8, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: c.color }}>{c.time}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: '#ef4444', textAlign: 'center', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '8px 12px' }}>
          ⚠️ MANAGE = only use when a supervisor requests it
        </div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Live Call ──
function MockLiveCall() {
  return (
    <MockWindow title="Dialer System — Live Call">
      <div style={{ background: '#1a2340', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background: '#064e3b', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 700 }}>LIVE CALL IN PROGRESS — 0:47</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 200 }}>
          <div style={{ background: '#0f1521', padding: 12, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Controls</div>
            {[
              { label: 'TRANSFER - CONF', color: '#f97316', highlight: true, note: '← Click here' },
              { label: 'MUTE', color: '#6b7280' },
              { label: 'HOLD', color: '#6b7280' },
              { label: 'HANGUP', color: '#dc2626' },
            ].map((btn, i) => (
              <div key={i} style={{
                background: btn.highlight ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${btn.highlight ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 6, padding: '8px 10px', marginBottom: 7,
                fontSize: 12, fontWeight: btn.highlight ? 800 : 500, color: btn.color,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{btn.label}</span>
                {btn.note && <span style={{ fontSize: 10, color: '#f97316' }}>{btn.note}</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Customer on Line</div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>John Smith</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Vehicle verified ✓ &nbsp;·&nbsp; Approval given ✓</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#86efac' }}>
              ✅ Ready to transfer — click TRANSFER - CONF
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Transfer Functions ──
function MockTransferFunctions({ spanish }) {
  return (
    <MockWindow title={`Dialer System — Transfer${spanish ? ' (Spanish)' : ''}`}>
      <div style={{ background: '#1a2340', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, fontWeight: 700, textTransform: 'uppercase' }}>Transfer / Conference Panel</div>
        {spanish && (
          <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#fdba74', fontWeight: 600 }}>
            ⭐ STEP 1: Select <strong>BlindSpanishXfer</strong> from dropdown below FIRST
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 5 }}>Transfer Type</div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${spanish ? '#f97316' : 'rgba(255,255,255,0.12)'}`, borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#e5e7eb', fontWeight: 600 }}>
            {spanish ? '🇪🇸 BlindSpanishXfer' : '🇺🇸 Standard Transfer'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'DIAL WITH CUSTOMER', color: '#22c55e', step: spanish ? '2' : '1', note: 'Start 3-way' },
            { label: 'LEAVE 3-WAY CALL', color: '#f97316', step: spanish ? '3' : '2', note: 'After 15s min' },
            { label: 'HANGUP XFER LINE', color: '#dc2626', step: '—', note: 'If transfer fails' },
          ].map((btn, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 130,
              background: `rgba(${btn.color === '#22c55e' ? '34,197,94' : btn.color === '#f97316' ? '249,115,22' : '239,68,68'},0.12)`,
              border: `1px solid ${btn.color}33`,
              borderRadius: 8, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>STEP {btn.step}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: btn.color, marginBottom: 3 }}>{btn.label}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{btn.note}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, background: 'rgba(249,115,22,0.06)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#fdba74' }}>
          ⏱️ Stay on 3-way call <strong>at least 15 seconds</strong> — wait for SA & customer to connect before leaving
        </div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Lead Form ──
function MockLeadForm() {
  return (
    <MockWindow title="Dialer System — Lead Form">
      <div style={{ background: '#1a2340', borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'First Name', value: 'John', use: true },
            { label: 'Last Name', value: 'Smith', use: true },
            { label: 'Address', value: '123 Main St', use: false },
            { label: 'City / State', value: 'Austin, TX', use: false },
            { label: 'Origination Date', value: 'March 15, 2022', use: true },
            { label: 'Loan Balance', value: '$XX,XXX', use: true },
            { label: 'Finance Company', value: 'XXXXX Bank', use: false },
            { label: 'Terms of Loan', value: '72 months', use: false },
            { label: 'Plan Cost', value: '$X,XXX', use: false },
            { label: 'Maintenance Date', value: 'XX/XX/XXXX', use: false },
          ].map((f, i) => (
            <div key={i} style={{
              background: f.use ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${f.use ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.15)'}`,
              borderRadius: 7, padding: '8px 12px',
              opacity: f.use ? 1 : 0.55,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: f.use ? '#86efac' : '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: f.use ? '#22c55e' : '#ef4444' }}>{f.use ? '✓ USE' : '✗ SKIP'}</span>
              </div>
              <div style={{ fontSize: 13, color: f.use ? '#e5e7eb' : '#6b7280', fontWeight: f.use ? 600 : 400 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  )
}

// ── Mock: Dispositions ──
function MockDispositions() {
  const disps = [
    { code: 'XFER', label: 'Call Transferred ✓', color: '#22c55e' },
    { code: 'SPXFER', label: 'Spanish Xfer', color: '#3b82f6' },
    { code: 'NI', label: 'Not Interested', color: '#6b7280' },
    { code: 'CALLBK', label: 'Call Back', color: '#f59e0b' },
    { code: 'A', label: 'Answering Machine', color: '#8b5cf6' },
    { code: 'DC', label: 'Disconnected', color: '#ef4444' },
    { code: 'DNC', label: 'Do Not Call', color: '#dc2626' },
    { code: 'WRGNUM', label: 'Wrong Number', color: '#6b7280' },
    { code: 'WRGVEH', label: 'Wrong Vehicle', color: '#6b7280' },
    { code: 'DAIR', label: 'Dead Air', color: '#4b5563' },
    { code: 'LANG', label: 'Language Barrier', color: '#f59e0b' },
    { code: 'BLANK', label: 'No Info on File', color: '#6b7280' },
  ]
  return (
    <MockWindow title="Dialer System — Disposition Screen">
      <div style={{ background: '#1a2340', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14, fontWeight: 700, textTransform: 'uppercase' }}>Select Call Disposition</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {disps.map((d, i) => (
            <div key={i} style={{
              background: d.code === 'XFER' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${d.code === 'XFER' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderLeft: `3px solid ${d.color}`,
              borderRadius: 7, padding: '8px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: d.color, marginBottom: 2 }}>{d.code}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#86efac' }}>
          ✅ XFER = the only successful disposition — use it every time you complete a transfer
        </div>
      </div>
    </MockWindow>
  )
}

// ─────────────────────────────────────────────
//  DIALER GUIDE VIEW — All illustrated, no real credentials / branding
// ─────────────────────────────────────────────
function DialerGuideView() {
  return (
    <div>
      {/* Step 0: IP Validation */}
      <div className="go-block-title">🌐 Step 0 — Validate Your IP (Every Day)</div>
      <Note>⚠️ Do this EVERY DAY before logging in. Go to the validation URL provided by your supervisor — enter your assigned User ID and password, then confirm your IP is validated.</Note>
      <MockIPValidation />
      <Caption>Submit and confirm your IP appears as validated before doing anything else</Caption>

      {/* Step 1: Welcome */}
      <div className="go-block-title" style={{ marginTop: 32 }}>🔐 Step 1 — Welcome Screen</div>
      <MockWelcome />
      <Caption>Click "Agent Login" — not Admin</Caption>

      {/* Step 2: Phone Login */}
      <div className="go-block-title" style={{ marginTop: 8 }}>📞 Step 2 — Phone Setup</div>
      <MockPhoneLogin />
      <Caption>Enter your assigned extension and password, then click Submit</Caption>

      {/* Step 3: Campaign Login */}
      <div className="go-block-title" style={{ marginTop: 8 }}>🎯 Step 3 — Campaign Selection</div>
      <MockCampaignLogin />
      <Caption>Select openers2 or openers3 — your supervisor will tell you which one to use</Caption>

      {/* Go Active */}
      <div className="go-block-title" style={{ marginTop: 32 }}>📡 Main Screen — You Are Paused</div>
      <MockGoActive />
      <Caption>You start as PAUSED. The dialer begins calling automatically. To transfer: click TRANSFER - CONF on the left panel</Caption>

      {/* Pause Codes */}
      <div className="go-block-title" style={{ marginTop: 8 }}>⏸️ Pause Codes</div>
      <MockPauseCodes />
      <Caption>Always select the correct pause code — MANAGE is only for when supervisors request it</Caption>

      {/* Transfer EN */}
      <div className="go-block-title" style={{ marginTop: 32 }}>🇺🇸 How to Transfer — English</div>
      <MockLiveCall />
      <Caption>Step 1: During a live call, click TRANSFER - CONF on the left panel</Caption>
      <MockTransferFunctions spanish={false} />
      <Caption>Step 2: Click DIAL WITH CUSTOMER → wait for SA to pick up and speak first → Step 3: click LEAVE 3-WAY CALL (after 15 seconds minimum)</Caption>

      {/* Transfer ES */}
      <div className="go-block-title" style={{ marginTop: 32 }}>🇪🇸 How to Transfer — Spanish</div>
      <OrangeNote>⚡ For Spanish: select <strong>BlindSpanishXfer</strong> from the dropdown BEFORE clicking Dial with Customer</OrangeNote>
      <MockLiveCall />
      <Caption>Step 1: Click TRANSFER - CONF on the left panel</Caption>
      <MockTransferFunctions spanish={true} />
      <Caption>Step 2: Select BlindSpanishXfer → DIAL WITH CUSTOMER → wait for SA → LEAVE 3-WAY CALL (after 15s)</Caption>

      {/* Lead Form */}
      <div className="go-block-title" style={{ marginTop: 32 }}>📋 How to Read the Lead Form</div>
      <Note>⚠️ Only use the highlighted fields. Never mention the address, finance company name, or terms of loan to the customer.</Note>
      <MockLeadForm />
      <Caption>✓ USE: Name, Origination Date, Loan Balance — ✗ SKIP everything else</Caption>

      {/* Dispositions */}
      <div className="go-block-title" style={{ marginTop: 32 }}>📊 Disposition Screen</div>
      <MockDispositions />
      <Caption>Use ONLY these dispositions. XFER = successful transfer ✓ | NI = not interested | CALLBK = call back | SPXFER = Spanish transfer</Caption>
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