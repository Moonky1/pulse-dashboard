// Only an ephemeral display marker. No identity, presence or delivery tracking.
export async function claimPublicNotice(id,expiresAt,storage,locks=globalThis.navigator?.locks){
 const claim=()=>{try{const area=storage||globalThis.localStorage,at=Date.now(),key='pulse_public_notices_v1';const stored=JSON.parse(area.getItem(key)||'{}');const recent=Object.fromEntries(Object.entries(stored).filter(([,expiry])=>Number(expiry)>at).slice(-199));if(recent[id])return false;recent[id]=Date.parse(expiresAt);area.setItem(key,JSON.stringify(recent));return true}catch{return true}}
 return locks?.request?locks.request('pulse-public-notice-'+id,claim):claim()
}
