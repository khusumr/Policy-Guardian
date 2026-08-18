import { useState } from "react";
import PolicyViewer from "./PolicyViewer";
import Settings from "./Settings";
import TopNav from "../components/ui/TopNav";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import ManagerCoverageDonut from "../components/ManagerCoverageDonut";
import {
  getAssignmentsForEmployee,
  getMockTeam,
  getMockManager,
  roleLabel,
} from "../Data/store";
import { greeting, formattedToday, formatShortDate } from "../utils/format";

const NAV_TABS = [
  { key: "home", label: "Home" },
  { key: "settings", label: "Settings" },
];

function ManagerDashboard({ user }) {
  const [view, setView] = useState("home"); // "home" | "settings"
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  // Signing a policy mutates the store (localStorage) directly, so this
  // just forces a re-render to pick the change back up.
  const [, forceRefresh] = useState(0);

  const manager = getMockManager(user);
  const teamMembers = getMockTeam(user).map((member) => ({
    ...member,
    assignments: getAssignmentsForEmployee(member.id),
  }));

  function refresh() {
    forceRefresh((n) => n + 1);
  }

  function handleSigned() {
    refresh();
    setSelectedAssignment((prev) =>
      prev ? { ...prev, status: "signed", signedAt: new Date().toISOString() } : prev
    );
  }

  const rows = teamMembers.flatMap((member) =>
    member.assignments.length === 0
      ? [{ member, policyLabel: "—", status: { variant: "neutral", label: "Not sent" } }]
      : member.assignments.map((a) => ({
          member,
          policyLabel: `${roleLabel(a.role)} Policy`,
          status:
            a.status === "signed"
              ? { variant: "accent", label: `Signed ${formatShortDate(a.signedAt)}` }
              : { variant: "amber", label: "Pending" },
        }))
  );

  const donutCounts = { signed: 0, pending: 0, notSent: 0 };
  teamMembers.forEach((m) => {
    if (m.assignments.length === 0) donutCounts.notSent++;
    else if (m.assignments.some((a) => a.status === "signed")) donutCounts.signed++;
    else donutCounts.pending++;
  });

  return (
    <div>
      <TopNav tabs={NAV_TABS} activeTab={view} onTabChange={setView} userName={manager?.name || user} userRole="manager" />

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
          <div className="page-kicker">{manager?.name ? `${manager.name}'s Team` : "Your Team"}</div>
          <div className="page-greeting-row">
            <h1>{greeting()}, {manager?.name || user}</h1>
            <span className="page-greeting-date">{formattedToday()}</span>
          </div>
          <p className="page-lede">
            {teamMembers.length} report{teamMembers.length === 1 ? "" : "s"}. You can nudge and send, but not edit policy text.
          </p>

          <div style={{ display: "flex", gap: 56, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 480px" }}>
              {rows.length === 0 ? (
                <p className="sidebar-empty">No team members yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Role</th>
                      <th>Policy</th>
                      <th style={{ textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={`${row.member.id}-${i}`}>
                        <td data-label="Report" style={{ fontWeight: 600 }}>{row.member.name}</td>
                        <td data-label="Role">{roleLabel(row.member.role)}</td>
                        <td data-label="Policy">{row.policyLabel}</td>
                        <td data-label="Status" style={{ textAlign: "right" }}>
                          <Tag variant={row.status.variant}>{row.status.label}</Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <Button variant="primary" disabled title="Not implemented in this build">
                  Send reminder
                </Button>
                <Button variant="secondary" disabled title="Not implemented in this build">
                  Assign a policy
                </Button>
              </div>
            </div>

            <div style={{ width: 250 }}>
              <h4 style={{ margin: "0 0 14px" }}>Signature coverage</h4>
              <ManagerCoverageDonut {...donutCounts} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
