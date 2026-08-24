import assert from "node:assert/strict";
import test from "node:test";
import { evaluateLink, performLink } from "./linking.js";

const user = { id: crypto.randomUUID(), email: "pilot@kampaignkings.com", email_confirmed_at: "2026-08-23T00:00:00Z" };
const invited = { auth_user_id: user.id, corporate_email: "PILOT@kampaignkings.com", migration_state: "invited" };

test("valid invited user may link", () => assert.deepEqual(evaluateLink(user, invited), { ok: true, alreadyLinked: false }));
test("linked mapping is idempotent", () => assert.deepEqual(evaluateLink(user, { ...invited, migration_state: "linked" }), { ok: true, alreadyLinked: true }));
test("email mismatch is rejected", () => assert.equal(evaluateLink({ ...user, email: "other@kampaignkings.com" }, invited).code, "EMAIL_MISMATCH"));
test("wrong Auth user is rejected", () => assert.equal(evaluateLink({ ...user, id: crypto.randomUUID() }, invited).code, "AUTH_ID_MISMATCH"));
test("unverified user is rejected", () => assert.equal(evaluateLink({ id: user.id, email: user.email }, invited).code, "UNVERIFIED_AUTH_USER"));
test("missing mapping is rejected", () => assert.equal(evaluateLink(user, null).code, "MAPPING_NOT_FOUND"));
test("blocked inactive and conflict states are rejected", () => {
  for (const migration_state of ["blocked", "inactive", "conflict"]) assert.equal(evaluateLink(user, { ...invited, migration_state }).ok, false);
});
test("mocked invited mapping transitions successfully", async () => {
  let updated = false;
  const result = await performLink(evaluateLink(user, invited), async () => { updated = true; return true; });
  assert.deepEqual(result, { ok: true, status: "linked" }); assert.equal(updated, true);
});
test("mocked concurrent mapping change is rejected", async () => {
  const result = await performLink(evaluateLink(user, invited), async () => false);
  assert.equal(result.code, "MAPPING_CHANGED");
});
