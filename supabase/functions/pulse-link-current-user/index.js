import { createClient } from "npm:@supabase/supabase-js@2";
import { evaluateLink, performLink } from "./linking.js";

const allowedOrigins = new Set(["https://pulse-kk.com"]);
const responseHeaders = (request) => ({
  "Access-Control-Allow-Origin": allowedOrigins.has(request.headers.get("origin")) ? request.headers.get("origin") : "https://pulse-kk.com",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Vary": "Origin",
});
const respond = (request, body, status = 200) => Response.json(body, { status, headers: responseHeaders(request) });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(request) });
  if (request.method !== "POST") return respond(request, { ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return respond(request, { ok: false, error: "UNAUTHORIZED" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond(request, { ok: false, error: "SERVER_MISCONFIGURED" }, 500);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return respond(request, { ok: false, error: "UNAUTHORIZED" }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: mapping, error: lookupError } = await admin.from("pulse_auth_links")
    .select("legacy_user_id, legacy_book_id, legacy_row_index, legacy_name, legacy_team, legacy_role, legacy_agent_ext, corporate_email, auth_user_id, migration_state, auth_created_at")
    .eq("auth_user_id", user.id).maybeSingle();
  if (lookupError) return respond(request, { ok: false, error: "LOOKUP_FAILED" }, 500);

  const decision = evaluateLink(user, mapping);
  if (!decision.ok) return respond(request, { ok: false, error: decision.code }, decision.code === "MAPPING_NOT_FOUND" ? 404 : 409);

  const linkResult = await performLink(decision, async () => {
    const { data, error } = await admin.from("pulse_auth_links")
      .update({ migration_state: "linked", linked_at: new Date().toISOString(), auth_created_at: mapping.auth_created_at || user.created_at || null })
      .eq("legacy_user_id", mapping.legacy_user_id).eq("auth_user_id", user.id)
      .eq("migration_state", "invited").select("legacy_user_id").maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }).catch(() => ({ ok: false, code: "LINK_FAILED" }));
  if (!linkResult.ok) return respond(request, { ok: false, error: linkResult.code }, linkResult.code === "LINK_FAILED" ? 500 : 409);

  return respond(request, { ok: true, status: linkResult.status, profile: {
    legacy_user_id: mapping.legacy_user_id, name: mapping.legacy_name,
    team: mapping.legacy_team, role: mapping.legacy_role,
    agentExt: mapping.legacy_agent_ext, rowIndex: mapping.legacy_row_index,
    bookId: mapping.legacy_book_id,
  } });
});
