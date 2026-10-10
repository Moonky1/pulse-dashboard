import { createClient } from 'npm:@supabase/supabase-js@2.105.1'
import { createViciCollectorHandler } from './handler.mjs'

Deno.serve(createViciCollectorHandler({ env: name => Deno.env.get(name), createClient }))
