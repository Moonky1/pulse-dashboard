import mexicoFlag from '../../public/flags/mexico.png'
import unitedStatesFlag from '../../public/flags/united-states.svg'

export function GoFlag({ language }) {
  if (language !== 'en' && language !== 'es') return null
  const name = language === 'es' ? 'México' : 'United States'
  return <img className="go-flag" src={language === 'es' ? mexicoFlag : unitedStatesFlag} alt={name} />
}
