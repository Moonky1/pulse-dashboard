import { createClient } from "npm:@supabase/supabase-js@2";

import {
  UUID_PATTERN,
  evaluateInvitationEligibility,
  normalizeCorporateEmail,
} from "./eligibility.js";
import { executeInvitation } from "./invitation.js";

const REDIRECT_URL = "https://pulse-kk.com/auth/callback";

const jsonResponse = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

async function digest(value) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function secretsMatch(provided, expected) {
  if (!provided || !expected || expected.length < 32) return false;

  const [providedDigest, expectedDigest] = await Promise.all([
    digest(provided),
    digest(expected),
  ]);
  let difference = 0;
  for (let index = 0; index < expectedDigest.length; index += 1) {
    difference |= providedDigest[index] ^ expectedDigest[index];
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  const operatorSecret = Deno.env.get("PULSE_INVITE_OPERATOR_SECRET") ?? "";
  const suppliedSecret = request.headers.get("x-pulse-operator-secret") ?? "";

  if (!(await secretsMatch(suppliedSecret, operatorSecret))) {
    return jsonResponse({ ok: false, eligible: false, error: "unauthorized" }, 401);
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, eligible: false, error: "method_not_allowed" }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, eligible: false, error: "invalid_json" }, 400);
  }

  const isPlainObject =
    payload !== null && typeof payload === "object" && !Array.isArray(payload);
  const keys = isPlainObject ? Object.keys(payload) : [];
  if (
    !isPlainObject ||
    keys.length !== 1 ||
    keys[0] !== "legacy_user_id" ||
    typeof payload.legacy_user_id !== "string" ||
    !UUID_PATTERN.test(payload.legacy_user_id)
  ) {
    return jsonResponse({ ok: false, eligible: false, error: "invalid_request" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, eligible: false, error: "server_misconfigured" }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: mapping, error: mappingError } = await supabaseAdmin
    .from("pulse_auth_links")
    .select("legacy_user_id, corporate_email, migration_state, auth_user_id, invited_at, linked_at, updated_at")
    .eq("legacy_user_id", payload.legacy_user_id)
    .maybeSingle();

  if (mappingError) {
    return jsonResponse({ ok: false, eligible: false, error: "lookup_failed" }, 500);
  }

  if (!mapping) {
    return jsonResponse({
      ok: true,
      eligible: false,
      status: "not_found",
      legacy_user_id: payload.legacy_user_id,
      reason: "mapping_not_found",
    }, 404);
  }

  let conflictingMappingCount = 0;
  const normalizedEmail = normalizeCorporateEmail(mapping.corporate_email);
  if (normalizedEmail) {
    const { count, error: conflictError } = await supabaseAdmin
      .from("pulse_auth_links")
      .select("legacy_user_id", { count: "exact", head: true })
      .ilike("corporate_email", normalizedEmail)
      .neq("legacy_user_id", mapping.legacy_user_id);

    if (conflictError) {
      return jsonResponse({ ok: false, eligible: false, error: "lookup_failed" }, 500);
    }
    conflictingMappingCount = count ?? 0;
  }

  const result = evaluateInvitationEligibility(mapping, conflictingMappingCount);
  if (!result.eligible) {
    return jsonResponse({ ok: true, eligible: false, status: result.status,
      legacy_user_id: mapping.legacy_user_id, ...(result.reason ? { reason: result.reason } : {}) });
  }

  const requestId = crypto.randomUUID();
  const claimId = crypto.randomUUID();
  console.log(JSON.stringify({ requestId, legacyUserId: mapping.legacy_user_id, stage: "eligible" }));

  const execution = await executeInvitation({
    mapping: { ...mapping, corporate_email: result.normalizedEmail },
    claimId,
    claim: async () => {
      const { data, error } = await supabaseAdmin.from("pulse_auth_links")
        .update({ migration_state: "inviting", invitation_claim_id: claimId, invitation_claimed_at: new Date().toISOString() })
        .eq("legacy_user_id", mapping.legacy_user_id).eq("migration_state", "approved")
        .eq("updated_at", mapping.updated_at).is("auth_user_id", null).is("invited_at", null).is("linked_at", null)
        .select("legacy_user_id").maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    invite: async (email) => {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: REDIRECT_URL });
      if (error) throw error;
      return data.user;
    },
    finalize: async (user) => {
      const { data, error } = await supabaseAdmin.from("pulse_auth_links")
        .update({ migration_state: "invited", auth_user_id: user.id, auth_created_at: user.created_at ?? null,
          invited_at: new Date().toISOString(), invitation_claim_id: null, invitation_claimed_at: null })
        .eq("legacy_user_id", mapping.legacy_user_id).eq("migration_state", "inviting")
        .eq("invitation_claim_id", claimId).select("legacy_user_id").maybeSingle();
      return !error && Boolean(data);
    },
    release: async () => {
      const { data, error } = await supabaseAdmin.from("pulse_auth_links")
        .update({ migration_state: "approved", invitation_claim_id: null, invitation_claimed_at: null })
        .eq("legacy_user_id", mapping.legacy_user_id).eq("migration_state", "inviting")
        .eq("invitation_claim_id", claimId).select("legacy_user_id").maybeSingle();
      return !error && Boolean(data);
    },
  });
  console.log(JSON.stringify({ requestId, legacyUserId: mapping.legacy_user_id,
    stage: "complete", outcome: execution.code, ...(execution.authUserId ? { authUserId: execution.authUserId } : {}) }));
  return jsonResponse({
    ok: execution.ok,
    eligible: true,
    status: execution.ok ? "invited" : "invitation_not_completed",
    legacy_user_id: mapping.legacy_user_id,
    code: execution.code,
    ...(execution.reconciliationRequired ? { reconciliation_required: true } : {}),
  }, execution.ok ? 200 : 409);
});
