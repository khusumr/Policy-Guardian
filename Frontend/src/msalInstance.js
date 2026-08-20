import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

// Single shared instance — main.jsx renders <MsalProvider> with this, and
// Data/authToken.js (a plain module, not a component, so it can't use the
// useMsal() hook) imports the same instance to acquire tokens for real
// backend calls.
export const msalInstance = new PublicClientApplication(msalConfig);
