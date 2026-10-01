import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { classicLevelDescription } from './goClassicCatalog.js'
import { GoFlag } from './GoFlag.jsx'
import { GO_ART } from './goVisualAssets.js'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

export function GoSelectionHeading({ eyebrow, title, description, art }) {
  return <section className="go-page-heading go-page-heading--selection">
    {art && <img src={art} alt="" />}
    <p className="go-eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    {description && <p>{description}</p>}
  </section>
}

export function GoLanguageChoices({ onSelect }) {
  return <section className="go-language-choices" aria-label="Choose game language">
    {LANGUAGES.map(choice => <button className="go-language-choice" type="button" key={choice.code} onClick={() => onSelect(choice.code)}>
      <span className="go-language-choice__flag"><GoFlag language={choice.code} /></span>
      <strong>{choice.label}</strong>
      <span className="go-language-choice__arrow" aria-hidden="true">→</span>
    </button>)}
  </section>
}

export function GoSelectionBack({ onClick, children }) {
  return <div className="go-selection-back"><button type="button" onClick={onClick}>← {children}</button></div>
}

export function GoCatalogSection({ title, description, children }) {
  return <section className="go-catalog-section" aria-label={title}>
    <header><h2>{title}</h2><p>{description}</p></header>
    <div className="go-game-choices">{children}</div>
  </section>
}

export function GoCreator({ item, system = false }) {
  if (system) return <p className="go-card-creator go-card-creator--pulse">Pulse original</p>
  if (!item?.creator_display) return null
  return <p className="go-card-creator">{item.language === 'es' ? 'Creado por' : 'Created by'} <strong>{item.creator_display}</strong></p>
}

export function GoClassicModeChoice({ language, onClick }) {
  return <button className="go-game-choice" type="button" onClick={onClick}>
    <img src={GO_ART.classic} alt="" />
    <h2>Classic Quiz</h2>
    <p>{language === 'es' ? 'Elige tu nivel y juega a tu ritmo.' : 'Choose your level and play at your pace.'}</p>
    <GoCreator system />
    <span className="go-game-choice__action">{language === 'es' ? 'Elegir nivel' : 'Choose level'} →</span>
  </button>
}

export function GoClassicLevelCard({ item, onCreate, creating }) {
  const host = typeof onCreate === 'function'
  return <article className="go-content-card go-content-card--classic-level go-content-card--centered" key={item.id}>
    <div className="go-card-visual"><span className="go-card-art"><img src={GO_ART[item.level]} alt="" /></span></div>
    <h2>{item.levelLabel}</h2>
    <p>{classicLevelDescription(item.language, item.level)}</p>
    <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>10</strong> {item.language === 'es' ? 'por ronda · banco de 40' : 'per round · 40 in the bank'}</div>
    <GoCreator item={item} />
    {host
      ? <Button loading={creating === item.id} disabled={creating !== null} onClick={() => onCreate(item.id)}>{item.language === 'es' ? 'Crear sala' : 'Create room'}</Button>
      : <Link to={`/go/practice/${item.id}`}>{item.language === 'es' ? 'Jugar' : 'Play'}</Link>}
  </article>
}
