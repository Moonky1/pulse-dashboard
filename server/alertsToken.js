import { createHmac } from 'node:crypto'
import { Buffer } from 'node:buffer'

// Server-only utility (outside api routes). No Staff identity, cookie or service key.
export function signAlertsToken(lease, secret, supabaseUrl, now=Date.now()) {
  if (typeof secret !== 'string' || secret.length<32) throw new Error('Alerts signing is not configured')
  if (!/^[0-9a-f-]{36}$/i.test(lease?.lease_id || '')) throw new Error('Invalid alert lease')
  const issued=Math.floor(now/1000), expiry=Math.min(issued+180,Math.floor(Date.parse(lease.expires_at)/1000))
  if (!Number.isFinite(expiry) || expiry<=issued) throw new Error('Alert lease expired')
  const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')
  const payload=Buffer.from(JSON.stringify({iss:new URL('/auth/v1',supabaseUrl).href,aud:'authenticated',role:'authenticated',
    sub:lease.lease_id,pulse_alert_lease:lease.lease_id,iat:issued,exp:expiry})).toString('base64url')
  const body=header+'.'+payload
  return body+'.'+createHmac('sha256',secret).update(body).digest('base64url')
}
