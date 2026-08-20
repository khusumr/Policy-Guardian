import { useMsal } from "@azure/msal-react";
import Button from "../components/ui/Button";
import { loginRequest } from "../authConfig";

function Login() {
  const { instance } = useMsal();

  function login() {
    instance.loginRedirect(loginRequest);
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
        </div>
      </div>
    </div>
  );
}

export default Login;
