import { useEffect, useState } from "react";
import PolicyViewer from "./PolicyViewer";
import Settings from "./Settings";
import TopNav from "../components/ui/TopNav";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import PolicyBadge from "../components/badges/PolicyBadge";
import AskPolicyPanel from "../components/intern/AskPolicyPanel";
import { getAssignmentsForEmployee, getAssignment, roleLabel, MOCK_USERS } from "../Data/store";
import { getBadgesForEmployee } from "../Data/badgesApi";
import { greeting, formattedToday, formatShortDate } from "../utils/format";

const NAV_TABS = [
  { key: "home", label: "Home" },
  { key: "settings", label: "Settings" },
];

function EmployeeDashboard({ user, onLogout }) {
  const [view, setView] = useState("home"); // "home" | "settings"
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  // Signing a policy mutates the store (localStorage) directly, so this
  // just forces a re-render to pick the change back up.
  const [, forceRefresh] = useState(0);
  const [badges, setBadges] = useState({}); // assignment id -> {badge, label, variant}

  // `user` is now a real Entra display name/username (see App.jsx), not one
  // of the fake "intern1"/"manager1"-style ids MOCK_USERS and assignments
  // are keyed on. Both lookups below will find nothing for a real account —
  // gracefully (person/assignments just come back empty, no crash), but
  // silently. Needs real identity data from the backend to actually work;
  // not something to fake from the frontend.
  const person = MOCK_USERS.find((u) => u.id === user);
  const firstName = person?.name || user;
  const assignments = getAssignmentsForEmployee(user);

  function loadBadges() {
    getBadgesForEmployee(user, getAssignmentsForEmployee(user)).then((data) => {
      setBadges(Object.fromEntries(data.map((b) => [b.policy_id, b])));
    });
  }

  // Fetches once per mount rather than reactively on `assignments` — that
  // array gets a new reference every render (getAssignmentsForEmployee
  // isn't memoized), so watching it directly would refetch in a loop.
  // handleSigned below re-triggers this explicitly instead, same pattern
  // as forceRefresh already uses for "something in the store changed".
  useEffect(loadBadges, [user]);
  const pendingCount = assignments.filter((a) => a.status !== "signed").length;
  const policyContext = assignments
    .map(
      (a) =>
        `${roleLabel(a.role)} Policy:\n` +
        a.parts.map((p) => `${p.title}\n${p.content}`).join("\n\n")
    )
    .join("\n\n---\n\n");

  function handleSigned() {
    forceRefresh((n) => n + 1);
    setSelectedAssignment((prev) => (prev ? getAssignment(prev.id) : prev));
    loadBadges();
  }

  return (
    <div>
      <TopNav tabs={NAV_TABS} activeTab={view} onTabChange={setView} userName={firstName} userRole={person?.role || "employee"} onLogout={onLogout} />

      {view === "settings" ? (
        <div className="content">
          <Settings />
        </div>
      ) : selectedAssignment ? (
        <div className="content">
          <Button variant="secondary" size="sm" onClick={() => setSelectedAssignment(null)} style={{ marginBottom: 16 }}>
            ← Back
          </Button>
          <PolicyViewer assignment={selectedAssignment} onSigned={handleSigned} />
        </div>
      ) : (
        <div className="content">
          <div className="page-kicker">Your policies</div>
          <div className="page-greeting-row">
            <h1>{greeting()}, {firstName}</h1>
            <span className="page-greeting-date">{formattedToday()}</span>
          </div>
          <p className="page-lede">
            {pendingCount === 0
              ? "You're all signed up. Ask the agent anything about a policy."
              : `${pendingCount} need${pendingCount === 1 ? "s" : ""} your signature. Ask the agent anything before you sign.`}
          </p>

          <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 480px" }}>
              {assignments.length === 0 ? (
                <p className="sidebar-empty">No policies assigned yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Policy</th>
                      <th>Badge</th>
                      <th>Sections</th>
                      <th>Sent</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Policy" style={{ fontWeight: 600 }}>{roleLabel(a.role)}</td>
                        <td data-label="Badge">
                          {badges[a.id] && <PolicyBadge {...badges[a.id]} />}
                        </td>
                        <td data-label="Sections">{a.parts.length}</td>
                        <td data-label="Sent">{formatShortDate(a.sentAt)}</td>
                        <td data-label="Action" style={{ textAlign: "right" }}>
                          {a.status === "signed" ? (
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                              <Tag variant="accent">Signed {formatShortDate(a.signedAt)}</Tag>
                              <Button variant="secondary" size="sm" onClick={() => setSelectedAssignment(a)}>
                                View
                              </Button>
                            </div>
                          ) : (
                            <Button variant="primary" size="sm" onClick={() => setSelectedAssignment(a)}>
                              Read &amp; sign
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ width: 330 }}>
              <AskPolicyPanel policyContext={policyContext} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
