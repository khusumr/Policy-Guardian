import { useState } from "react";
import RadioCard from "../components/ui/RadioCard";
import { Field, Input } from "../components/ui/FormControls";
import Button from "../components/ui/Button";

const ROLES = [
  { key: "hr", title: "HR", description: "Full authoring + tracking", demoUser: "hr" },
  { key: "manager", title: "Manager", description: "Team signing status", demoUser: "alice" },
  { key: "intern", title: "Intern", description: "Read, ask, sign", demoUser: "charlie" },
  { key: "engineer", title: "Engineer", description: "Read, ask, sign", demoUser: "ethan" },
];

// Demo credentials — swap for real auth once a backend exists.
const USERS = {
  hr: "hr",
  alice: "manager1",
  bob: "manager2",
  charlie: "intern1",
  david: "intern2",
  ethan: "engineer1",
  fiona: "intern3",
  george: "engineer2",
};

function Login({ setUser }) {
  const [role, setRole] = useState(ROLES[0].key);
  const [username, setUsername] = useState(ROLES[0].demoUser);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function selectRole(r) {
    setRole(r.key);
    setUsername(r.demoUser);
  }

  function login(e) {
    e.preventDefault();

    if (USERS[username] && password === "1234") {
      setError("");
      setUser(USERS[username]);
    } else {
      setError("Incorrect username or password.");
    }
  }

  const activeRole = ROLES.find((r) => r.key === role);

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
            Draft, cite and circulate company policy — then track who has
            actually signed it.
          </p>
        </div>

        <form className="login-form-panel" onSubmit={login}>
          <h2>Sign in</h2>
          <p className="login-form-lede">Choose the workspace you are signing in to.</p>

          <div className="login-role-grid">
            {ROLES.map((r) => (
              <RadioCard
                key={r.key}
                name="role"
                value={r.key}
                checked={role === r.key}
                onChange={() => selectRole(r)}
                title={r.title}
                description={r.description}
              />
            ))}
          </div>

          <div className="login-fields">
            <Field label="Username">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          </div>

          {error && <p className="login-error">{error}</p>}

          <Button variant="primary" block type="submit">
            Sign in as {activeRole.title}
          </Button>

          <p className="login-footnote">
            Single sign-on and magic links are out of scope for this demo.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
