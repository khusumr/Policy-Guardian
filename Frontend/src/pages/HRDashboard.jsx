import { useState } from "react";
import SectionEditor from "./SectionEditor";
import PolicyOverall from "./PolicyOverall";
import PolicyChatCreate from "./PolicyChatCreate";
import IncidentReport from "./IncidentReport";
import UploadPolicyForm from "./UploadPolicyForm";
import Settings from "./Settings";
import PolicyLibrary from "./PolicyLibrary";
import SignedRecord from "./SignedRecord";
import TopNav from "../components/ui/TopNav";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import { Select } from "../components/ui/FormControls";

import {
  getSections,
  getAssignments,
  getAssignmentsForEmployee,
  getMockUsersByRole,
  getMockManager,
  getMockTeam,
  getExpirationInfo,
  getAllRoles,
  roleLabel,
} from "../Data/store";
import { greeting, formattedToday, formatShortDate, relativeTime } from "../utils/format";

const NAV_TABS = [
  { key: "home", label: "Home" },
  { key: "policies", label: "Policies" },
  { key: "teams", label: "Teams" },
  { key: "settings", label: "Settings" },
];

function getEmployeeStatus(employeeId) {
  const assignments = getAssignmentsForEmployee(employeeId);

  if (assignments.length === 0) {
    return { variant: "neutral", label: "Not sent", assignment: null };
  }

  const signed = assignments.find((a) => a.status === "signed");

  if (signed) {
    return { variant: "accent", label: `Signed ${formatShortDate(signed.signedAt)}`, assignment: signed };
  }

  return { variant: "amber", label: "Pending", assignment: assignments[0] };
}

function RoleActionRow({ label, actionLabel, onStart }) {
  const roles = getAllRoles();
  const [role, setRole] = useState(roles[0]?.id || "");

  return (
    <div className="panel" style={{ padding: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 130 }}>{label}</span>
      <Select value={role} onChange={(e) => setRole(e.target.value)} style={{ maxWidth: 140 }}>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </Select>
      <Button variant="secondary" size="sm" type="button" disabled={!role} onClick={() => onStart(role)}>
        {actionLabel}
      </Button>
    </div>
  );
}

function HRDashboard({ user, onLogout }) {
  const [view, setView] = useState("home"); // "home" | "policies" | "settings"
  const [sections, setSections] = useState(getSections());
  const [page, setPage] = useState("home");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newSectionRole, setNewSectionRole] = useState(null);
  const [uploadRole, setUploadRole] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null); // { assignment, employeeName }

  function handleViewRecord(assignment, employeeName) {
    if (assignment.status !== "signed") return;
    setViewingRecord({ assignment, employeeName });
  }

  function refreshSections() {
    setSections(getSections());
  }

  function goToPolicies() {
    setView("policies");
  }

  function handleSelectSection(section) {
    setSelectedSection(section);
    setPage("editor");
    goToPolicies();
  }

  function handleSelectOverall(role) {
    setSelectedRole(role);
    setPage("overall");
    goToPolicies();
  }

  function handleStartNewSection(role) {
    setNewSectionRole(role);
    setPage("newSection");
    goToPolicies();
  }

  function handleAddUpload(role) {
    setUploadRole(role);
    setPage("upload");
    goToPolicies();
  }

  function handleSectionCreated(section) {
    refreshSections();
    setSelectedSection(section);
    setPage("editor");
  }

  function handleSectionUpdated(section) {
    refreshSections();
    setSelectedSection(section);
  }

  const teamMembers = [
    ...getMockUsersByRole("manager"),
    ...getMockUsersByRole("intern"),
    ...getMockUsersByRole("engineer"),
  ];

  const allAssignments = getAssignments();
  const signedCount = allAssignments.filter((a) => a.status === "signed").length;
  const signedPercent =
    allAssignments.length === 0 ? 0 : Math.round((signedCount / allAssignments.length) * 100);
  const pendingReviewCount = allAssignments.length - signedCount;
  const livePolicyRoles = new Set(allAssignments.map((a) => a.role));

  const soonestExpiring = sections
    .map((s) => ({ section: s, info: getExpirationInfo(s) }))
    .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining)[0];

  const activity = [
    ...sections.map((s) => ({
      at: s.updatedAt,
      text: `AI agent updated ${roleLabel(s.role)} · ${s.title}`,
    })),
    ...allAssignments.map((a) => ({
      at: a.sentAt,
      text: `${roleLabel(a.role)} policy sent to employees`,
    })),
  ]
    .filter((a) => a.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 3);

  return (
    <div>
      <TopNav
        tabs={NAV_TABS}
        activeTab={view}
        onTabChange={setView}
        userName="Dana"
        userRole="hr"
        onLogout={onLogout}
      />

      {viewingRecord ? (
        <div className="content">
          <SignedRecord
            assignment={viewingRecord.assignment}
            employeeName={viewingRecord.employeeName}
            onBack={() => setViewingRecord(null)}
          />
        </div>
      ) : view === "policies" ? (
        <div className="content">
          {page === "editor" && selectedSection ? (
            <SectionEditor key={selectedSection.id} section={selectedSection} onUpdated={handleSectionUpdated} />
          ) : page === "overall" && selectedRole ? (
            <PolicyOverall
              key={selectedRole}
              role={selectedRole}
              sections={sections}
              onViewRecord={handleViewRecord}
              onEditSection={handleSelectSection}
              onAddSection={handleStartNewSection}
            />
          ) : page === "newSection" && newSectionRole ? (
            <PolicyChatCreate key={newSectionRole} role={newSectionRole} onSectionCreated={handleSectionCreated} />
          ) : page === "upload" && uploadRole ? (
            <UploadPolicyForm key={uploadRole} role={uploadRole} onSectionCreated={handleSectionCreated} />
          ) : page === "incident" ? (
            <IncidentReport />
          ) : (
            <PolicyLibrary onOpenRole={handleSelectOverall} />
          )}
        </div>
      ) : view === "teams" ? (
        <div className="content">
          <div className="page-kicker">Teams</div>
          <h1 style={{ margin: "0 0 6px" }}>Managers &amp; their reports</h1>
          <p className="page-lede">
            Every manager's team, grouped together, with each person's signing status.
          </p>

          {getMockUsersByRole("manager").length === 0 ? (
            <p className="sidebar-empty">No managers yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {getMockUsersByRole("manager").map((manager) => {
                const reports = getMockTeam(manager.id);
                const managerStatus = getEmployeeStatus(manager.id);

                const managerSigned = managerStatus.assignment?.status === "signed";

                return (
                  <div key={manager.id}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
                      onClick={managerSigned ? () => handleViewRecord(managerStatus.assignment, manager.name) : undefined}
                    >
                      <h3 style={{ margin: 0 }}>{manager.name}'s Team</h3>
                      <Tag
                        variant={managerStatus.variant}
                        style={{ cursor: managerSigned ? "pointer" : "default" }}
                      >
                        Manager · {managerStatus.label}
                      </Tag>
                    </div>

                    {reports.length === 0 ? (
                      <p className="sidebar-empty">No reports yet.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th style={{ textAlign: "right" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((member) => {
                            const status = getEmployeeStatus(member.id);
                            const isSigned = status.assignment?.status === "signed";
                            return (
                              <tr
                                key={member.id}
                                onClick={isSigned ? () => handleViewRecord(status.assignment, member.name) : undefined}
                                style={{ cursor: isSigned ? "pointer" : "default" }}
                              >
                                <td data-label="Employee" style={{ fontWeight: 600 }}>{member.name}</td>
                                <td data-label="Role">{roleLabel(member.role)}</td>
                                <td data-label="Status" style={{ textAlign: "right" }}>
                                  <Tag variant={status.variant}>{status.label}</Tag>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : view === "settings" ? (
        <div className="content">
          <Settings />
        </div>
      ) : (
        <div className="content">
          <div className="page-kicker">HR Dashboard</div>
          <div className="page-greeting-row">
            <h1>
              {greeting()}, {user === "hr" ? "Dana" : user}
            </h1>
            <span className="page-greeting-date">{formattedToday()}</span>
          </div>
          <p className="page-lede">
            {livePolicyRoles.size} polic{livePolicyRoles.size === 1 ? "y" : "ies"} live,{" "}
            {pendingReviewCount} awaiting signature.
          </p>

          <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 480px" }}>
              <div className="stat-row">
                <div>
                  <div className="stat-value">{livePolicyRoles.size}</div>
                  <div className="stat-label">Live policies</div>
                </div>
                <div>
                  <div className="stat-value" style={{ color: "var(--color-accent-700)" }}>
                    {signedPercent}
                    <span style={{ fontSize: 22 }}>%</span>
                  </div>
                  <div className="stat-label">Signed</div>
                </div>
                <div>
                  <div className="stat-value">{pendingReviewCount}</div>
                  <div className="stat-label">Pending review</div>
                </div>
                <div>
                  <div className="stat-value" style={{ color: "var(--color-accent-2-700)" }}>
                    {soonestExpiring ? soonestExpiring.info.daysRemaining : "—"}
                  </div>
                  <div className="stat-label">
                    {soonestExpiring ? `Days to ${soonestExpiring.section.title} expiry` : "Days to expiry"}
                  </div>
                </div>
              </div>

              <h3 style={{ margin: "0 0 4px" }}>Policy signing status</h3>
              <p style={{ margin: "0 0 16px", color: "var(--color-text-muted)", fontSize: 14 }}>
                Who has signed their assigned policies, and which team they belong to.
              </p>

              {teamMembers.length === 0 ? (
                <p className="sidebar-empty">No employees yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Team</th>
                      <th>Role</th>
                      <th style={{ textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => {
                      const manager = member.managerId ? getMockManager(member.managerId) : null;
                      const status = getEmployeeStatus(member.id);

                      const isSigned = status.assignment?.status === "signed";

                      return (
                        <tr
                          key={member.id}
                          onClick={isSigned ? () => handleViewRecord(status.assignment, member.name) : undefined}
                          style={{ cursor: isSigned ? "pointer" : "default" }}
                        >
                          <td data-label="Employee" style={{ fontWeight: 600 }}>{member.name}</td>
                          <td data-label="Team">
                            {member.role === "manager" ? "—" : manager ? `${manager.name}'s Team` : "No Team"}
                          </td>
                          <td data-label="Role">{roleLabel(member.role)}</td>
                          <td data-label="Status" style={{ textAlign: "right" }}>
                            <Tag variant={status.variant}>{status.label}</Tag>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ width: 330, display: "flex", flexDirection: "column", gap: 40 }}>
              <div>
                <h3 style={{ margin: "0 0 4px" }}>Incident report</h3>
                <p style={{ margin: "0 0 16px", color: "var(--color-text-muted)", fontSize: 14 }}>
                  Describe an incident and get suggested next steps, cited against the relevant policy.
                </p>
                <Button
                  variant="danger"
                  onClick={() => {
                    setPage("incident");
                    goToPolicies();
                  }}
                >
                  File an incident report
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <RoleActionRow label="New policy section" actionLabel="Start" onStart={handleStartNewSection} />
                <RoleActionRow label="Upload a policy" actionLabel="Upload" onStart={handleAddUpload} />
              </div>

              <div>
                <h3 style={{ margin: "0 0 12px" }}>Recent activity</h3>
                {activity.length === 0 ? (
                  <p className="sidebar-empty">Nothing yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 13 }}>
                    {activity.map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "var(--color-text-muted)", minWidth: 52 }}>
                          {relativeTime(a.at)}
                        </span>
                        <span>{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
