import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      {user === null ? (
        <Login setUser={setUser} />
      ) : (
        <Dashboard user={user} />
      )}
    </>
  );
}

export default App;