import {createContext,useContext} from 'react'
export const PulseAlertsContext=createContext({schedule:null,alert:null,error:null,armed:false,now:Date.now(),timezone:'America/Los_Angeles'})
export const usePulseAlerts=()=>useContext(PulseAlertsContext)
