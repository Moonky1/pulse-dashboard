import assert from "node:assert/strict";
import test from "node:test";
import { executeInvitation } from "./invitation.js";

const mapping = { corporate_email: "pilot@kampaignkings.com" };
const authUser = { id: crypto.randomUUID(), created_at: "2026-08-23T00:00:00Z" };
const run = (overrides = {}) => executeInvitation({
  mapping, claimId: crypto.randomUUID(), claim: async () => true,
  invite: async () => authUser, finalize: async () => true, release: async () => true,
  ...overrides,
});

test("successful mocked invitation", async () => assert.equal((await run()).code, "INVITED"));
test("duplicate concurrent claim is rejected before Auth", async () => {
  let called = false;
  const result = await run({ claim: async () => false, invite: async () => { called = true; } });
  assert.equal(result.code, "INVITATION_ALREADY_CLAIMED"); assert.equal(called, false);
});
test("definitive Auth failure releases claim", async () => {
  let released = false;
  const result = await run({ invite: async () => { throw { status: 400, message: "invalid" }; }, release: async () => { released = true; return true; } });
  assert.equal(result.code, "AUTH_INVITATION_FAILED"); assert.equal(released, true);
});
test("existing account remains claimed for reconciliation", async () => {
  let released = false;
  const result = await run({ invite: async () => { throw { status: 422, message: "already registered" }; }, release: async () => { released = true; } });
  assert.equal(result.code, "AUTH_ACCOUNT_EXISTS"); assert.equal(released, false);
});
test("database persistence failure requires reconciliation", async () => {
  const result = await run({ finalize: async () => false });
  assert.equal(result.code, "RECONCILIATION_REQUIRED");
});
