import { useEffect, useState } from 'react'

export function ViciAdvisor({ startedAt, serverNow }) {
  const [received]=useState(Date.now), [now,setNow]=useState(Date.now)
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(id)},[])
  const elapsed=startedAt?Math.max(0,Math.floor(((serverNow?Date.parse(serverNow)+now-received:now)-Date.parse(startedAt))/1000)):0
  return <div className="vici-advisor" role="status">Service Advisor introduction · {Math.min(elapsed,15)} / 15 seconds</div>
}
