import { msalInstance } from "../msalInstance";
import { loginRequest } from "../authConfig";

// Gets a ready-to-use "Bearer <token>" header value for the signed-in
// account, or null if nobody's signed in. Real backend calls need this —
// several endpoints (see backend/main.py's require_role/get_current_user
// dependencies) reject unauthenticated requests outright.
//
// This sends the ID token, not a separate access token. That's
// deliberate, not a shortcut: backend/auth.py validates generically
// (signature via Entra's JWKS, audience == this app's client id, issuer)
// without checking whether the token is an ID token or an access token,
// and an ID token already satisfies all three. Getting a real access
// token instead would need a scope from "Expose an API" on the app
// registration, which isn't configured — this avoids depending on that.
//
// acquireTokenSilent (not reading a token off the account object
// directly) so this always returns a current, non-expired token, using
// MSAL's cache and refreshing through an invisible iframe if needed.
export async function getAuthHeader() {
  const account = msalInstance.getAllAccounts()[0];
  if (!account) return null;

  const result = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account,
  });

  return `Bearer ${result.idToken}`;
}
