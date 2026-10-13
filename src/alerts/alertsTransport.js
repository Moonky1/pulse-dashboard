import {createClient} from '@supabase/supabase-js'
import {agentRequest} from '../go-product/agentGoApi.js'
import {supabase,pulsePublicConfig} from '../utils/supabase.js'
export function createAlertsTransport(kind){
 let client,channel
 return {
  async schedule(){return kind==='agent'?agentRequest('schedule'):supabase.rpc('get_pulse_schedule')},
  connect:(connectionId)=>agentRequest('alertConnect',{connectionId}),
  pending:(leaseId)=>agentRequest('alertPending',{leaseId}),
  claim:(leaseId,occurrenceId,requestId)=>agentRequest('alertClaim',{leaseId,occurrenceId,requestId}),
  receipt:(leaseId,occurrenceId,state)=>agentRequest('alertReceipt',{leaseId,occurrenceId,state}),
  close:(leaseId)=>agentRequest('alertClose',{leaseId}),
  async subscribe(lease,onAlarm,onSchedule){
   client ||= createClient(pulsePublicConfig.url,pulsePublicConfig.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
   await client.realtime.setAuth(lease.token)
   if(channel)return
   channel=client.channel(lease.topic,{config:{private:true}}).on('broadcast',{event:'alarm'},({payload})=>onAlarm(payload)).on('broadcast',{event:'schedule_changed'},onSchedule).subscribe(status=>{
    if(status==='SUBSCRIBED')void agentRequest('alertPending',{leaseId:lease.lease_id}).then(result=>{if(!result.error)for(const signal of result.data||[])void onAlarm(signal)})
   })
  },
  destroy(){if(client)void client.removeAllChannels();client=null;channel=null},
 }
}
