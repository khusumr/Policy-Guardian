import { useState } from "react";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function login(e) {
    e.preventDefault();

    if (
      (username === "hr" || username === "emp") &&
      password === "1234"
    ) {
      setUser(username);
    } else {
      alert("Incorrect username or password.");
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={login}>
        <h1>AI Policy Generator</h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button>Login</button>
      </form>
    </div>
  );
}

export default Login;