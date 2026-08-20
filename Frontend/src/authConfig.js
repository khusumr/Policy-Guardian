// MSAL configuration for Entra ID (Azure AD) sign-in.
//
// clientId/tenantId come from env vars, not hardcoded here, so the real
// values never land in source control — see .env.example for the expected
// keys and copy it to .env with the real values.
//
// cacheLocation: sessionStorage, not localStorage. Today's mock login has
// zero persistence (a refresh already logs the demo user out), so this is
// the closer match, and it's the standard MSAL guidance to limit how long
// tokens sit in browser storage if XSS ever happens. Tradeoff: signing in
// again is required per tab, and there's no cross-tab SSO. Switch to
// "localStorage" if cross-tab persistence turns out to matter more than that.
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`,
    // window.location.origin rather than a hardcoded localhost URL, so this
    // works in dev and prod alike — as long as whatever origin the app is
    // actually running on (http://localhost:5173 in dev, the deployed
    // Static Web App hostname in prod) is registered in Entra under the
    // "Single-page application" platform, not "Web". The Web platform type
    // does NOT support MSAL.js's redirect flow (PKCE) and login will fail
    // with a redirect URI mismatch even when the URL string matches.
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Scopes for the initial sign-in. "openid" and "profile" are enough to get
// the roles claim onto the ID token — but ONLY because app roles are
// defined on this same app registration (confirmed: the backend's
// ENTRA_CLIENT_ID matches this app's clientId, rather than a separate API
// app registration — see backend/auth.py, which validates an access token
// audienced to this same client id). If the frontend starts sending real
// Authorization: Bearer <token> headers to the backend (it doesn't yet),
// an access token audienced to this app is needed instead, which requires
// a scope from "Expose an API" on the app registration
// (e.g. api://<client-id>/access_as_user) — not confirmed configured as of
// writing. Flagging rather than guessing a scope string that may not exist.
export const loginRequest = {
  scopes: ["openid", "profile"],
};
