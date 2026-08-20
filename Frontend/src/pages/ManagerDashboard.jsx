import { useState } from "react";
import PolicyViewer from "./PolicyViewer";
import Settings from "./Settings";
import TopNav from "../components/ui/TopNav";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import { Field, Select } from "../components/ui/FormControls";
import ManagerCoverageDonut from "../components/ManagerCoverageDonut";
import {
  getAssignmentsForEmployee,
  getAssignment,
  getMockTeam,
  getMockManager,
  getAllRoles,
  getSectionsByRole,
  sendRoleToEmployees,
  createTicket,
  roleLabel,
} from "../Data/store";
import { greeting, formattedToday, formatShortDate } from "../utils/format";

const NAV_TABS = [
  { key: "home", label: "Home" },
  { key: "settings", label: "Settings" },
];

function ManagerDashboard({ user, onLogout }) {
  const [view, setView] = useState("home"); // "home" | "settings"
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRole, setAssignRole] = useState("");
  const [assignRecipients, setAssignRecipients] = useState([]);
  const [assignSent, setAssignSent] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  // Signing a policy mutates the store (localStorage) directly, so this
  // just forces a re-render to pick the change back up.
  const [, forceRefresh] = useState(0);

  const manager = getMockManager(user);
  const myAssignments = getAssignmentsForEmployee(user);
  const teamMembers = getMockTeam(user).map((member) => ({
    ...member,
    assignments: getAssignmentsForEmployee(member.id),
  }));

  // Only offer policies HR has actually built at least one section for.
  const assignableRoles = getAllRoles().filter((r) => getSectionsByRole(r.id).length > 0);

  function refresh() {
    forceRefresh((n) => n + 1);
  }

  function handleSigned() {
    refresh();
    setSelectedAssignment((prev) => (prev ? getAssignment(prev.id) : prev));
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

  const pendingMembers = teamMembers.filter(
    (m) => m.assignments.length > 0 && m.assignments.some((a) => a.status !== "signed")
  );

  const donutCounts = { signed: 0, pending: 0, notSent: 0 };
  teamMembers.forEach((m) => {
    if (m.assignments.length === 0) donutCounts.notSent++;
    else if (m.assignments.some((a) => a.status === "signed")) donutCounts.signed++;
    else donutCounts.pending++;
  });

  function handleSendReminder() {
    createTicket({
      type: "reminder",
      role: null,
      title: `Reminder: ${pendingMembers.length} pending signature${pendingMembers.length === 1 ? "" : "s"}`,
      body: `${manager?.name || "A manager"} requested a nudge for: ${pendingMembers
        .map((m) => m.name)
        .join(", ")}.`,
    });

    setReminderNote(
      `Reminder sent to ${pendingMembers.length} report${pendingMembers.length === 1 ? "" : "s"} with a pending signature.`
    );
    setTimeout(() => setReminderNote(""), 3000);
  }

  function toggleRecipient(id) {
    setAssignRecipients((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setAssignSent(false);
  }

  function handleAssignPolicy(e) {
    e.preventDefault();
    if (!assignRole || assignRecipients.length === 0) return;

    sendRoleToEmployees(assignRole, assignRecipients);
    setAssignSent(true);
    setAssignRecipients([]);
    refresh();
  }

  return (
    <div>
      <TopNav tabs={NAV_TABS} activeTab={view} onTabChange={setView} userName={manager?.name || user} userRole="manager" onLogout={onLogout} />

      {view === "settings" ? (
        <div className="content">
          <Settings />
        </div>
      ) : selectedAssignment ? (
        <div className="content">
          <Button variant="secondary" size="sm" onClick={() => setSelectedAssignment(null)} style={{ marginBottom: 16 }}>
            ← Back
          </Button>
          <PolicyViewer assignment={selectedAssignment} onSigned={handleSigned} allowFeedback />
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

          {myAssignments.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ margin: "0 0 4px" }}>Your policies</h3>
              <p style={{ margin: "0 0 16px", color: "var(--color-text-muted)", fontSize: 14 }}>
                Policies HR has assigned to you directly.
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Sent</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myAssignments.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Policy" style={{ fontWeight: 600 }}>{roleLabel(a.role)}</td>
                      <td data-label="Sent">{formatShortDate(a.sentAt)}</td>
                      <td data-label="Action" style={{ textAlign: "right" }}>
                        {a.status === "signed" ? (
                          <Button variant="secondary" size="sm" onClick={() => setSelectedAssignment(a)}>
                            View
                          </Button>
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
            </div>
          )}

          <div style={{ display: "flex", gap: 56, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 480px" }}>
              <h3 style={{ margin: "0 0 4px" }}>Team status</h3>
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

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Button
                    variant="primary"
                    onClick={handleSendReminder}
                    disabled={pendingMembers.length === 0}
                    title={pendingMembers.length === 0 ? "No pending signatures on your team" : undefined}
                  >
                    Send reminder
                  </Button>
                  <Button variant="secondary" onClick={() => setAssignOpen((v) => !v)}>
                    Assign a policy
                  </Button>
                  {reminderNote && <span className="sent-confirmation">{reminderNote}</span>}
                </div>

                {assignOpen && (
                  <div className="card panel" style={{ maxWidth: 420 }}>
                    <h4 style={{ margin: 0 }}>Assign a policy</h4>

                    {assignableRoles.length === 0 || teamMembers.length === 0 ? (
                      <p className="sidebar-empty">
                        {teamMembers.length === 0
                          ? "You have no reports to assign a policy to."
                          : "HR hasn't built any policies yet."}
                      </p>
                    ) : (
                      <form onSubmit={handleAssignPolicy} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Field label="Policy">
                          <Select value={assignRole} onChange={(e) => { setAssignRole(e.target.value); setAssignSent(false); }} required>
                            <option value="" disabled>Select a policy</option>
                            {assignableRoles.map((r) => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Recipients">
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {teamMembers.map((m) => (
                              <label key={m.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                                <input
                                  type="checkbox"
                                  checked={assignRecipients.includes(m.id)}
                                  onChange={() => toggleRecipient(m.id)}
                                />
                                {m.name}
                              </label>
                            ))}
                          </div>
                        </Field>

                        <Button
                          variant="primary"
                          type="submit"
                          disabled={!assignRole || assignRecipients.length === 0}
                          style={{ alignSelf: "flex-start" }}
                        >
                          Send policy
                        </Button>

                        {assignSent && <p className="sent-confirmation">Policy assigned.</p>}
                      </form>
                    )}
                  </div>
                )}
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
