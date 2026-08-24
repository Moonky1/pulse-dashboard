import assert from "node:assert/strict";
import test from "node:test";

import { evaluateInvitationEligibility, normalizeCorporateEmail } from "./eligibility.js";

const approved = {
  migration_state: "approved",
  corporate_email: "pilot@kampaignkings.com",
  auth_user_id: null,
  invited_at: null,
  linked_at: null,
};

test("accepts a valid approved mapping", () => {
  assert.equal(evaluateInvitationEligibility(approved).eligible, true);
});

test("normalizes approved corporate email", () => {
  assert.equal(
    normalizeCorporateEmail("  PILOT@KAMPAIGNKINGS.COM "),
    "pilot@kampaignkings.com",
  );
});

test("rejects nonexistent, blocked, inactive, and conflict mappings", () => {
  assert.equal(evaluateInvitationEligibility(null).reason, "mapping_not_found");
  for (const migration_state of ["blocked", "inactive", "conflict"]) {
    assert.equal(
      evaluateInvitationEligibility({ ...approved, migration_state }).eligible,
      false,
    );
  }
});

test("rejects missing or invalid email", () => {
  assert.equal(
    evaluateInvitationEligibility({ ...approved, corporate_email: null }).reason,
    "missing_corporate_email",
  );
  assert.equal(
    evaluateInvitationEligibility({ ...approved, corporate_email: "pilot@example.com" }).reason,
    "invalid_corporate_email",
  );
});

test("rejects already invited or linked mappings", () => {
  assert.equal(
    evaluateInvitationEligibility({ ...approved, invited_at: "2026-08-23T00:00:00Z" }).reason,
    "already_invited",
  );
  assert.equal(
    evaluateInvitationEligibility({ ...approved, auth_user_id: crypto.randomUUID() }).reason,
    "already_linked",
  );
});

test("rejects a conflicting normalized email", () => {
  assert.equal(evaluateInvitationEligibility(approved, 1).reason, "email_mapping_conflict");
});
