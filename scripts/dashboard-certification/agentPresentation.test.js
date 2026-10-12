import test from 'node:test'
import assert from 'node:assert/strict'
import { agentDisplayName, englishPerHour, hourlyLabel } from '../../src/dashboard/agentPresentation.js'
test('display names strip only leading team labels without mutating source identity',()=>{
  for(const [name,expected] of [['COL - PETERSON GILLE','PETERSON GILLE'],['ASIA-DONNALYN','DONNALYN'],['ASIA B - ANNA M','ANNA M'],['PH - RALPH','RALPH'],['BAJA TJ - JUAN AGUILAR','JUAN AGUILAR'],['NIC - ANA','ANA'],['PHILIP SMITH','PHILIP SMITH'],['ANA COL','ANA COL']]) {
    const row={vici_user_name:name,agent_code:'1234'}
    assert.equal(agentDisplayName(row),expected);assert.equal(row.vici_user_name,name);assert.equal(row.agent_code,'1234')
  }
})
test('English hourly average uses recorded agent hours and preserves missing values',()=>{
  assert.equal(englishPerHour([{xfer_count:24,time_seconds:28800}]),3)
  assert.equal(englishPerHour([{xfer_count:6,time_seconds:3600},{xfer_count:6,time_seconds:10800}]),3)
  assert.equal(englishPerHour([{xfer_count:0,time_seconds:3600}]),0)
  for(const rows of [[],[{xfer_count:0,time_seconds:0}],[{xfer_count:4,time_seconds:0}],[{xfer_count:4,time_seconds:null}],[{xfer_count:null,time_seconds:3600}]]) assert.equal(englishPerHour(rows),null)
  assert.equal(hourlyLabel(null),'—');assert.equal(hourlyLabel(1.236),'1.24')
})
