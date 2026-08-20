import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import { getPrefs } from "./Data/store";
import { applyPrefs } from "./utils/applyPrefs";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("landing"); // "landing" | "login" — only matters while signed out

  useEffect(() => {
    applyPrefs(getPrefs());
  }, []);

  return (
    <>
      {user === null ? (
        view === "landing" ? (
          <Landing onGetStarted={() => setView("login")} />
        ) : (
          <Login setUser={setUser} />
        )
      ) : user === "hr" ? (
        <HRDashboard user={user} onLogout={() => setUser(null)} />
      ) : user === "manager1" || user === "manager2" ? (
        <ManagerDashboard user={user} onLogout={() => setUser(null)} />
      ) : user === "engineer1" || user === "engineer2" ? (
        <EngineerDashboard user={user} onLogout={() => setUser(null)} />
      ) : (
        <EmployeeDashboard user={user} onLogout={() => setUser(null)} />
      )}
    </>
  );
}

export default App;
