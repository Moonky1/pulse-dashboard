import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WelcomeToast } from '../../src/components/WelcomeToast.jsx'
import { markWelcome } from '../../src/auth/welcomeNotice.js'
import '../../src/design/globals.css'
if (!['localhost','127.0.0.1'].includes(location.hostname)) throw Error('Local synthetic review only')
export function Review() {
  const [key,setKey] = useState(0),[name,setName] = useState('Simon Test')
  return <main style={{padding:40}}><h1>Local UI review · synthetic session</h1><label>Name<input aria-label="Welcome name" value={name} onChange={e=>setName(e.target.value)}/></label><button onClick={()=>{markWelcome();setKey(n=>n+1)}}>Simulate successful sign-in</button><button onClick={()=>setKey(n=>n+1)}>Simulate navigation</button><button>Page stays usable</button><WelcomeToast key={key} name={name}/></main>
}
createRoot(document.getElementById('root')).render(<StrictMode><Review/></StrictMode>)
