import { createClient } from 'npm:@supabase/supabase-js@2.105.1'
import { createViciImportHandler } from './handler.mjs'
Deno.serve(createViciImportHandler({ env: name => Deno.env.get(name), createClient }))
