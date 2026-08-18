import { useState } from "react";
import PolicyViewer from "./PolicyViewer";
import Settings from "./Settings";
import TopNav from "../components/ui/TopNav";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import AskPolicyPanel from "../components/intern/AskPolicyPanel";
import { getAssignmentsForEmployee, roleLabel, MOCK_USERS } from "../Data/store";
import { greeting, formattedToday, formatShortDate } from "../utils/format";

const NAV_TABS = [
  { key: "home", label: "Home" },
  { key: "settings", label: "Settings" },
];

function EmployeeDashboard({ user }) {
  const [view, setView] = useState("home"); // "home" | "settings"
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  // Signing a policy mutates the store (localStorage) directly, so this
  // just forces a re-render to pick the change back up.
  const [, forceRefresh] = useState(0);

  const person = MOCK_USERS.find((u) => u.id === user);
  const firstName = person?.name || user;
  const assignments = getAssignmentsForEmployee(user);
  const pendingCount = assignments.filter((a) => a.status !== "signed").length;

  function handleSigned() {
    forceRefresh((n) => n + 1);
    setSelectedAssignment((prev) =>
      prev ? { ...prev, status: "signed", signedAt: new Date().toISOString() } : prev
    );
  }

  return (
    <div>
      <TopNav tabs={NAV_TABS} activeTab={view} onTabChange={setView} userName={firstName} userRole={person?.role || "employee"} />

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
                      <th>Sections</th>
                      <th>Sent</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Policy" style={{ fontWeight: 600 }}>{roleLabel(a.role)}</td>
                        <td data-label="Sections">{a.parts.length}</td>
                        <td data-label="Sent">{formatShortDate(a.sentAt)}</td>
                        <td data-label="Action" style={{ textAlign: "right" }}>
                          {a.status === "signed" ? (
                            <Tag variant="accent">Signed {formatShortDate(a.signedAt)}</Tag>
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
              <AskPolicyPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
