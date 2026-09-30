export function GoFlag({ language }) {
  if (language !== 'en' && language !== 'es') return null
  const name = language === 'es' ? 'México' : 'United States'
  return <img className="go-flag" src={language === 'es' ? '/flags/mexico.png' : '/flags/united-states.svg'} alt={name} />
}
