#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { createInterface } from 'node:readline/promises'
import process from 'node:process'
import { executeOperatorCommand } from './operator.js'

function publicConfig() {
  const url = process.env.PULSE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.PULSE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('set PULSE_SUPABASE_URL and PULSE_SUPABASE_PUBLISHABLE_KEY')
  return { url, key }
}

async function readHidden(label) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error('interactive terminal required for password input')
  process.stdout.write(label)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve, reject) => {
    let value = ''
    const finish = () => {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdout.write('\n')
    }
    const onData = (buffer) => {
      for (const char of buffer.toString('utf8')) {
        if (char === '\u0003') { finish(); reject(new Error('cancelled')); return }
        if (char === '\r' || char === '\n') { finish(); resolve(value); return }
        if (char === '\u007f' || char === '\b') { value = value.slice(0, -1); continue }
        if (char >= ' ') value += char
      }
    }
    process.stdin.on('data', onData)
  })
}

function printResult(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

async function main() {
  const { url, key } = publicConfig()
  const emailPrompt = createInterface({ input: process.stdin, output: process.stdout })
  const email = (await emailPrompt.question('Operator company email: ')).trim().toLowerCase()
  emailPrompt.close()
  const password = await readHidden('Password: ')
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  try {
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw new Error('operator authentication failed')
    const result = await executeOperatorCommand({
      client,
      args: process.argv.slice(2),
      output: (summary) => printResult(summary),
      confirm: async (phrase) => {
        process.stdout.write(`Type exactly: ${phrase}\n`)
        return (await rl.question('Confirmation: ')) === phrase
      },
    })
    printResult(result)
  } finally {
    await client.auth.signOut().catch(() => {})
    rl.close()
  }
}

main().catch((error) => {
  process.stderr.write(`Pulse operator error: ${error.message}\n`)
  process.exitCode = 1
})
