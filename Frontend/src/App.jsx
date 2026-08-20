import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import AccessDenied from "./pages/AccessDenied";
import { getPrefs } from "./Data/store";
import { applyPrefs } from "./utils/applyPrefs";
import { resolveDashboard } from "./roleConfig";
import "./App.css";

const DASHBOARDS = {
  hr: HRDashboard,
  manager: ManagerDashboard,
  engineer: EngineerDashboard,
  employee: EmployeeDashboard,
};

function App() {
  const { instance, accounts } = useMsal();
  const [view, setView] = useState("landing"); // "landing" | "login" — only matters while signed out

  // Dev-only bypass account — see Login.jsx's DEV_MOCK_LOGIN flag. Stays
  // null (and unreachable) unless that flag is on; real MSAL accounts
  // below take priority regardless, so this never masks a real sign-in.
  const [devUser, setDevUser] = useState(null); // { name, dashboardKey } | null

  useEffect(() => {
    applyPrefs(getPrefs());
  }, []);

  function handleLogout() {
    if (devUser) {
      setDevUser(null);
      return;
    }
    // logoutRedirect clears MSAL's own cache (not just app state) before
    // navigating away, so there's no stale token left behind in
    // sessionStorage after signing out.
    instance.logoutRedirect();
  }

  const account = accounts[0];
  const roles = account?.idTokenClaims?.roles;
  const dashboardKey = devUser ? devUser.dashboardKey : resolveDashboard(roles);
  const Dashboard = dashboardKey ? DASHBOARDS[dashboardKey] : null;

  // Best available display name/identifier from the token — NOT the same
  // thing as the old fake "manager1"/"intern1" login strings. Dashboards
  // that look up mock org-chart data by that old id (see the comments in
  // ManagerDashboard.jsx and EmployeeDashboard.jsx) won't find a match for
  // a real account and will just show empty team/assignment lists until
  // the backend supplies real identity data — that's expected for now, not
  // a bug to chase here.
  const displayIdentity = devUser ? devUser.name : account?.name || account?.username;
  const isSignedIn = !!devUser || !!account;

  if (!isSignedIn) {
    return view === "landing" ? (
      <Landing onGetStarted={() => setView("login")} />
    ) : (
      <Login onDevSignIn={setDevUser} />
    );
  }

  return Dashboard ? (
    <Dashboard user={displayIdentity} onLogout={handleLogout} />
  ) : (
    <AccessDenied roles={roles} onLogout={handleLogout} />
  );
}

export default App;
