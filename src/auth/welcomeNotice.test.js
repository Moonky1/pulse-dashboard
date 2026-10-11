import test from 'node:test'
import assert from 'node:assert/strict'
import {markWelcome,clearWelcome,hasWelcome} from './welcomeNotice.js'
import {readFileSync} from 'node:fs'
const fake = () => { const values = new Map(); return {values,setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)} }
test('welcome intent stores only timestamp, expires and is consumed without identity or authorization',()=>{
  const store = fake()
  assert.equal(hasWelcome(1000,store),false)
  markWelcome(1000,store)
  assert.deepEqual([...store.values.values()],['1000'])
  assert.equal(hasWelcome(1000,store),true)
  assert.equal(hasWelcome(301000,store),false)
  assert.equal(hasWelcome(999,store),false)
  clearWelcome(store)
  assert.equal(hasWelcome(1100,store),false)
})
test('blocked storage never breaks sign-in',()=>{
  const store={setItem(){throw Error()},getItem(){throw Error()},removeItem(){throw Error()}}
  assert.doesNotThrow(()=>markWelcome(1000,store))
  assert.doesNotThrow(()=>clearWelcome(store))
  assert.equal(hasWelcome(1000,store),false)
})
test('actual password and Google wrappers clear cosmetic intent on errors and preserve service results',async()=>{
  const source=readFileSync(new URL('./AuthProvider.jsx',import.meta.url),'utf8').replace(/\r\n/g,'\n')
  for(const [method,service,arg] of [['signIn','signInWithPassword','credentials'],['signInGoogle','signInWithGoogle','options']]){
    const start=source.indexOf(`const ${method} = useCallback(`)+`const ${method} = useCallback(`.length
    const body=source.slice(start,source.indexOf('}, [client])',start)+1)
    for(const mode of ['success','error','throw']){
      const events=[], result={data:{synthetic:true},error:mode==='error'?new Error('synthetic'):null}
      const call=new Function('client','setProfileError','setInvitationNotice','markWelcome','clearWelcome',service,`return (${body});`)({},()=>{},()=>{},()=>events.push('mark'),()=>events.push('clear'),async(_client,input)=>{assert.equal(input.kind,arg);if(mode==='throw')throw Error('synthetic');return result})
      if(mode==='throw') await assert.rejects(call({kind:arg}),/synthetic/)
      else assert.equal(await call({kind:arg}),result)
      assert.deepEqual(events,mode==='success'?['mark']:['mark','clear'])
    }
  }
})
