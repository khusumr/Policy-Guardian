import { useState } from "react";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      {user === null ? (
        <Login setUser={setUser} />
      ) : user === "hr" ? (
        <HRDashboard user={user} />
      ) : user === "manager1" || user === "manager2" ? (
        <ManagerDashboard user={user} />
      ) : (
        <EmployeeDashboard user={user} />
      )}
    </>
  );
}

export default App;
