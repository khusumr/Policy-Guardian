// Client for the real policy-signature backend contract. Confirmed by
// reading backend/models.py + backend/main.py on the (as-of-writing
// unmerged) maria-entra-auth branch:
//   POST /policies/{org_id}/{policy_id}/sign   body: { signed_name }
//   GET  /policies/{org_id}/{policy_id}/signed-by-me
//   GET  /policies/{org_id}/{policy_id}/signatures
//
// Two real gaps here, flagged rather than papered over:
//
// 1. The real endpoint only accepts `signed_name` (a string) — there's no
//    field for a drawn signature image. This UI supports drawing anyway
//    (per the task), and the drawn image is captured and displayed
//    locally, but only the typed name currently has anywhere to go on
//    the real backend. Raise with backend if the drawn image needs to be
//    persisted server-side too.
//
// 2. The real endpoint signs one policy_id (== one StoredPolicy, e.g. just
//    "Work From Home"). Today's UI signs one *assignment*, which can
//    bundle several sections into one combined document (see
//    PolicyViewer.jsx). This mock keeps signing at the assignment level
//    to match the existing HR-tracking flow (Data/store.js's
//    signAssignment) — reconciling that against real per-policy signing
//    is a coordination item for whoever owns the bundling model, not
//    resolved here.
//
// USE_MOCKS is on since the real endpoint isn't merged to main yet. The
// auth gap noted above is resolved though — Data/authToken.js sends the
// ID token as the Bearer token, which backend/auth.py accepts (it
// validates generically, doesn't require a separate access-token scope).
// Flip USE_MOCKS once the endpoint itself is live.

import { getAuthHeader } from "./authToken";

const USE_MOCKS = true;
const BACKEND_URL = "https://app-ai-policy-backend.azurewebsites.net";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function signPolicy(orgId, policyId, signedName) {
  if (USE_MOCKS) {
    await delay(500);
    return {
      policy_id: policyId,
      signer_user_id: "mock-user",
      signer_roles: [],
      signed_name: signedName,
      signed_at: new Date().toISOString(),
    };
  }

  const authHeader = await getAuthHeader();

  const response = await fetch(`${BACKEND_URL}/policies/${orgId}/${policyId}/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader && { Authorization: authHeader }),
    },
    body: JSON.stringify({ signed_name: signedName }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.json();
}
