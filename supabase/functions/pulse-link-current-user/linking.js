export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function evaluateLink(user, mapping) {
  if (!user?.id || !user.email || !(user.email_confirmed_at || user.confirmed_at)) {
    return { ok: false, code: "UNVERIFIED_AUTH_USER" };
  }
  if (!mapping) return { ok: false, code: "MAPPING_NOT_FOUND" };
  if (mapping.auth_user_id !== user.id) return { ok: false, code: "AUTH_ID_MISMATCH" };
  if (normalizeEmail(mapping.corporate_email) !== normalizeEmail(user.email)) {
    return { ok: false, code: "EMAIL_MISMATCH" };
  }
  if (mapping.migration_state === "linked") return { ok: true, alreadyLinked: true };
  if (mapping.migration_state !== "invited") {
    return { ok: false, code: `STATE_${String(mapping.migration_state).toUpperCase()}` };
  }
  return { ok: true, alreadyLinked: false };
}

export async function performLink(decision, update) {
  if (!decision.ok) return { ok: false, code: decision.code };
  if (decision.alreadyLinked) return { ok: true, status: "already_linked" };
  return (await update())
    ? { ok: true, status: "linked" }
    : { ok: false, code: "MAPPING_CHANGED" };
}
