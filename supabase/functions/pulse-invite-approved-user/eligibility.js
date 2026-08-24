const CORPORATE_DOMAIN = "kampaignkings.com";
const ELIGIBLE_STATE = "approved";
const KNOWN_INELIGIBLE_STATES = new Set([
  "pending_review",
  "inviting",
  "invited",
  "linked",
  "inactive",
  "blocked",
  "conflict",
]);

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeCorporateEmail(value) {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return null;
  }

  const domain = normalized.slice(normalized.lastIndexOf("@") + 1);
  return domain === CORPORATE_DOMAIN ? normalized : null;
}

export function evaluateInvitationEligibility(mapping, conflictingMappingCount = 0) {
  if (!mapping) {
    return { eligible: false, status: "not_found", reason: "mapping_not_found" };
  }

  if (mapping.migration_state !== ELIGIBLE_STATE) {
    const state = KNOWN_INELIGIBLE_STATES.has(mapping.migration_state)
      ? mapping.migration_state
      : "ineligible";
    return { eligible: false, status: state, reason: `state_${state}` };
  }

  if (mapping.auth_user_id || mapping.linked_at) {
    return { eligible: false, status: "linked", reason: "already_linked" };
  }

  if (mapping.invited_at) {
    return { eligible: false, status: "invited", reason: "already_invited" };
  }

  const normalizedEmail = normalizeCorporateEmail(mapping.corporate_email);
  if (!normalizedEmail) {
    return {
      eligible: false,
      status: "approved",
      reason: mapping.corporate_email ? "invalid_corporate_email" : "missing_corporate_email",
    };
  }

  if (conflictingMappingCount > 0) {
    return { eligible: false, status: "conflict", reason: "email_mapping_conflict" };
  }

  return { eligible: true, status: "approved", reason: null, normalizedEmail };
}
