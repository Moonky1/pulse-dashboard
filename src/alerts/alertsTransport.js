import {createClient} from '@supabase/supabase-js'
import {agentRequest} from '../go-product/agentGoApi.js'
import {supabase,pulsePublicConfig} from '../utils/supabase.js'
export function createAlertsTransport(kind){
 let client,channel
 return {
  async schedule(){return kind==='public'?supabase.rpc('get_public_pulse_schedule'):kind==='agent'?agentRequest('schedule'):supabase.rpc('get_pulse_schedule')},
  notice:id=>supabase.rpc('get_public_pulse_notice',{requested_id:id}),
  publicPending:()=>supabase.rpc('get_current_public_pulse_notices'),
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
  async subscribePublic(onNotice,onSchedule){
   client ||= createClient(pulsePublicConfig.url,pulsePublicConfig.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
   if(channel)return
   channel=client.channel('pulse-schedule-notices-v1',{config:{private:true}}).on('broadcast',{event:'notice'},({payload})=>onNotice(payload)).on('broadcast',{event:'schedule_changed'},onSchedule).subscribe(status=>{
    if(status==='SUBSCRIBED')void supabase.rpc('get_current_public_pulse_notices').then(result=>{if(!result.error)for(const signal of result.data||[])void onNotice(signal)})
   })
  },
  destroy(){if(client)void client.removeAllChannels();client=null;channel=null},
 }
}
