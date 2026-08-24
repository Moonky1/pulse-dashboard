export function classifyAuthFailure(error) {
  const message = `${error?.message ?? ""}`.toLowerCase();
  if (message.includes("already") || message.includes("registered") || message.includes("exist")) {
    return "AUTH_ACCOUNT_EXISTS";
  }
  if (!error?.status || error.status === 408 || error.status === 429 || error.status >= 500) {
    return "AUTH_RESULT_UNKNOWN";
  }
  return "AUTH_INVITATION_FAILED";
}

export async function executeInvitation({ mapping, claimId, claim, invite, finalize, release }) {
  if (!(await claim())) return { ok: false, code: "INVITATION_ALREADY_CLAIMED" };

  let authUser;
  try {
    authUser = await invite(mapping.corporate_email);
  } catch (error) {
    const code = classifyAuthFailure(error);
    if (code === "AUTH_INVITATION_FAILED" && !(await release())) {
      return { ok: false, code: "RECONCILIATION_REQUIRED", reconciliationRequired: true };
    }
    return { ok: false, code, reconciliationRequired: code !== "AUTH_INVITATION_FAILED" };
  }

  if (!authUser?.id) {
    return { ok: false, code: "AUTH_RESULT_UNKNOWN", reconciliationRequired: true };
  }

  if (!(await finalize(authUser))) {
    return {
      ok: false,
      code: "RECONCILIATION_REQUIRED",
      reconciliationRequired: true,
      authUserId: authUser.id,
      claimId,
    };
  }
  return { ok: true, code: "INVITED", authUserId: authUser.id };
}
