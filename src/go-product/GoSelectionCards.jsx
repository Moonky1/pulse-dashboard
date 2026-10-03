import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { classicLevelDescription } from './goClassicCatalog.js'
import { GoFlag } from './GoFlag.jsx'
import { PULSE_MODES } from './goPulseModes.js'
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

export function GoCatalogSection({ title, description, children, creators = false }) {
  return <section className="go-catalog-section" aria-label={title}>
    <header><h2>{title}</h2>{description && <p>{description}</p>}</header>
    <div className={`go-game-choices${creators ? ' go-game-choices--creators' : ''}`}>{children}</div>
  </section>
}

export function GoCreator({ item, system = false }) {
  if (system) return <p className="go-card-creator go-card-creator--pulse">Pulse original</p>
  if (!item?.creator_display) return null
  return <p className="go-card-creator">{item.language === 'es' ? 'Creado por' : 'Created by'} <strong>{item.creator_display}</strong></p>
}

export function GoPulseModeChoices({ language, classicReady, modeItems = {}, onClassic, onMode, host = false, creating = null }) {
  return PULSE_MODES.map(mode => {
    const item = modeItems[mode.key]
    const ready = mode.key === 'classic' ? classicReady : !!item
    const playable = ready && (!host || mode.hosted)
    const action = playable
      ? mode.key === 'classic' ? (language === 'es' ? 'Elegir nivel' : 'Choose level')
        : host ? (language === 'es' ? 'Crear sala' : 'Create room') : (language === 'es' ? 'Jugar' : 'Play')
      : ready && !mode.hosted && host ? (language === 'es' ? 'Solo individual' : 'Individual only')
        : (language === 'es' ? 'En desarrollo' : 'In development')
    const content = <>
      <img src={GO_ART[mode.art]} alt="" />
      <h2>{mode.title}</h2>
      <p>{mode.description[language] || mode.description.en}</p>
      <GoCreator system />
      <span className={`go-game-choice__action${playable ? '' : ' go-game-choice__action--pending'}`}>
        {creating === item?.id ? (language === 'es' ? 'Creando…' : 'Creating…') : action}{playable && creating !== item?.id && ' →'}
      </span>
    </>
    return playable
      ? <button className="go-game-choice" data-mode={mode.key} type="button" disabled={creating !== null} onClick={() => mode.key === 'classic' ? onClassic() : onMode(mode.key, item)} key={mode.key}>{content}</button>
      : <article className="go-game-choice go-game-choice--pending" data-mode={mode.key} key={mode.key}>{content}</article>
  })
}

export function GoClassicLevelCard({ item, onCreate, creating }) {
  const host = typeof onCreate === 'function'
  return <article className="go-content-card go-content-card--classic-level go-content-card--centered" key={item.id}>
    <div className="go-card-visual"><span className="go-card-art"><img src={GO_ART[item.level]} alt="" /></span></div>
    <h2>{item.levelLabel}</h2>
    <p>{classicLevelDescription(item.language, item.level)}</p>
    <div className="go-card-stat"><span aria-hidden="true">🎯</span><strong>10</strong> {item.language === 'es' ? 'por ronda' : 'per round'}</div>
    <GoCreator item={item} />
    {host
      ? <Button loading={creating === item.id} disabled={creating !== null} onClick={() => onCreate(item.id)}>{item.language === 'es' ? 'Crear sala' : 'Create room'}</Button>
      : <Link to={`/go/practice/${item.id}`}>{item.language === 'es' ? 'Jugar' : 'Play'}</Link>}
  </article>
}
