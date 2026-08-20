import { useEffect, useState } from "react";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import { getPrefs } from "./Data/store";
import { applyPrefs } from "./utils/applyPrefs";
import "./App.css";

function App() {
  const [user, setUser] = useState(() => localStorage.getItem("loggedInUser"));

  useEffect(() => {
    applyPrefs(getPrefs());
  }, []);

  function handleSetUser(username) {
    if (username) {
      localStorage.setItem("loggedInUser", username);
    } else {
      localStorage.removeItem("loggedInUser");
    }

    setUser(username);
  }

  return (
    <>
      {user === null ? (
        <Login setUser={handleSetUser} />
      ) : user === "hr" ? (
        <HRDashboard user={user} onLogout={() => handleSetUser(null)} />
      ) : user === "manager1" || user === "manager2" ? (
        <ManagerDashboard user={user} onLogout={() => handleSetUser(null)} />
      ) : user === "engineer1" || user === "engineer2" ? (
        <EngineerDashboard user={user} onLogout={() => handleSetUser(null)} />
      ) : (
        <EmployeeDashboard user={user} onLogout={() => handleSetUser(null)} />
      )}
    </>
  );
}

export default App;
