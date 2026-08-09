import { useState } from "react";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      {user === null ? (
        <Login setUser={setUser} />
      ) : (
        <HRDashboard user={user} />
      )}
    </>
  );
}

export default App;