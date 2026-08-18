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
  const [user, setUser] = useState(null);

  useEffect(() => {
    applyPrefs(getPrefs());
  }, []);

  return (
    <>
      {user === null ? (
        <Login setUser={setUser} />
      ) : user === "hr" ? (
        <HRDashboard user={user} />
      ) : user === "manager1" || user === "manager2" ? (
        <ManagerDashboard user={user} />
      ) : user === "engineer1" || user === "engineer2" ? (
        <EngineerDashboard user={user} />
      ) : (
        <EmployeeDashboard user={user} />
      )}
    </>
  );
}

export default App;
