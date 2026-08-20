import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import Button from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/FormControls";
import { loginRequest } from "../authConfig";

// Dev-only escape hatch, gated off by default (see .env.example) — real
// Entra sign-in is blocked right now on an org-side admin-consent grant
// that has nothing to do with this app's code (see App.jsx/authConfig.js
// for the full story). This lets local development continue without
// waiting on that. Never true in a deployed build.
const DEV_MOCK_LOGIN = import.meta.env.VITE_DEV_MOCK_LOGIN === "true";

const DEV_DASHBOARDS = [
  { key: "hr", label: "HR" },
  { key: "manager", label: "Manager" },
  { key: "engineer", label: "Engineer" },
  { key: "employee", label: "Employee / Intern" },
];

function Login({ onDevSignIn }) {
  const { instance } = useMsal();
  const [showDev, setShowDev] = useState(false);
  const [devName, setDevName] = useState("Dev User");
  const [devDashboard, setDevDashboard] = useState(DEV_DASHBOARDS[0].key);

  function login() {
    instance.loginRedirect(loginRequest);
  }

  function handleDevSignIn(e) {
    e.preventDefault();
    if (!devName.trim()) return;
    onDevSignIn({ name: devName.trim(), dashboardKey: devDashboard });
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand-panel">
          <div className="login-wordmark">
            Policy
            <br />
            Guardian
          </div>
          <div className="login-subtitle">AI Policy Generator</div>
          <p className="login-lede">
            Sign in with your organization account — which dashboard you land on
            depends on the role(s) assigned to you in Entra ID.
          </p>
        </div>

        <div className="login-form-panel">
          <h2>Sign in</h2>
          <p className="login-form-lede">
            Use your organization's Microsoft account to continue.
          </p>

          <Button variant="primary" block onClick={login}>
            Sign in with Microsoft
          </Button>

          <p className="login-footnote">
            Don't have access yet? Ask your admin to assign you a role in Entra ID.
          </p>

          {DEV_MOCK_LOGIN && (
            <div className="dev-login-bypass">
              <button type="button" className="link-button" onClick={() => setShowDev((s) => !s)}>
                {showDev ? "Hide" : "Show"} dev bypass (local only)
              </button>

              {showDev && (
                <form onSubmit={handleDevSignIn} className="dev-login-form">
                  <Field label="Name">
                    <Input value={devName} onChange={(e) => setDevName(e.target.value)} />
                  </Field>
                  <Field label="Dashboard">
                    <Select value={devDashboard} onChange={(e) => setDevDashboard(e.target.value)}>
                      {DEV_DASHBOARDS.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button variant="secondary" size="sm" block type="submit">
                    Continue as dev user
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
