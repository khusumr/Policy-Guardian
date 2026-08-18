import { useState } from "react";
import Sidebar from "../components/Sidebar";
import SectionEditor from "./SectionEditor";
import PolicyOverall from "./PolicyOverall";
import SectionGenerate from "./SectionGenerate";
import CustomSectionForm from "./CustomSectionForm";
import IncidentReport from "./IncidentReport";
import UploadPolicyForm from "./UploadPolicyForm";
import Settings from "./Settings";
import PolicyLibrary from "./PolicyLibrary";
import TopNav from "../components/ui/TopNav";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";

import {
  getSections,
  getAssignments,
  getAssignmentsForEmployee,
  getMockUsersByRole,
  getMockManager,
  getExpirationInfo,
  roleLabel,
} from "../Data/store";
import { greeting, formattedToday, formatShortDate, relativeTime } from "../utils/format";

const NAV_TABS = [
  { key: "home", label: "Home" },
  { key: "policies", label: "Policies" },
  { key: "settings", label: "Settings" },
];

function getEmployeeStatus(employeeId) {
  const assignments = getAssignmentsForEmployee(employeeId);

  if (assignments.length === 0) {
    return { variant: "neutral", label: "Not sent" };
  }

  const signed = assignments.find((a) => a.status === "signed");

  if (signed) {
    return { variant: "accent", label: `Signed ${formatShortDate(signed.signedAt)}` };
  }

  return { variant: "amber", label: "Pending" };
}

function HRDashboard({ user }) {
  const [view, setView] = useState("home"); // "home" | "policies" | "settings"
  const [sections, setSections] = useState(getSections());
  const [page, setPage] = useState("home");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [pending, setPending] = useState(null);
  const [customSectionRole, setCustomSectionRole] = useState(null);
  const [uploadRole, setUploadRole] = useState(null);

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

  function handleSelectPending(role, sectionType) {
    setPending({ role, sectionType });
    setPage("generate");
    goToPolicies();
  }

  function handleSelectOverall(role) {
    setSelectedRole(role);
    setPage("overall");
    goToPolicies();
  }

  function handleAddCustomSection(role) {
    setCustomSectionRole(role);
    setPage("customQuestionnaire");
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

  // Employees who belong to a manager's team.
  // Managers themselves are not included in this table.
  const teamMembers = [
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

  const selectedKey =
    page === "overall" && selectedRole
      ? `overall:${selectedRole}`
      : page === "editor" && selectedSection
      ? selectedSection.id
      : page === "generate" && pending
      ? `pending:${pending.role}:${pending.sectionType}`
      : null;

  return (
    <div>
      <TopNav
        tabs={NAV_TABS}
        activeTab={view}
        onTabChange={setView}
        userName="Dana"
        userRole="hr"
      />

      {view === "policies" ? (
        <div className="dashboard">
          <Sidebar
            sections={sections}
            selectedKey={selectedKey}
            onSelectSection={handleSelectSection}
            onSelectPending={handleSelectPending}
            onSelectOverall={handleSelectOverall}
            onAddCustomSection={handleAddCustomSection}
            onAddUpload={handleAddUpload}
            onHome={() => setView("home")}
          />

          <div className="content">
            {page === "editor" && selectedSection ? (
              <SectionEditor section={selectedSection} onUpdated={handleSectionUpdated} />
            ) : page === "overall" && selectedRole ? (
              <PolicyOverall role={selectedRole} sections={sections} />
            ) : page === "generate" && pending ? (
              <SectionGenerate
                role={pending.role}
                sectionType={pending.sectionType}
                onSectionCreated={handleSectionCreated}
              />
            ) : page === "customQuestionnaire" && customSectionRole ? (
              <CustomSectionForm role={customSectionRole} onSectionCreated={handleSectionCreated} />
            ) : page === "upload" && uploadRole ? (
              <UploadPolicyForm role={uploadRole} onSectionCreated={handleSectionCreated} />
            ) : page === "incident" ? (
              <IncidentReport />
            ) : (
              <PolicyLibrary onOpenRole={handleSelectOverall} />
            )}
          </div>
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

                      return (
                        <tr key={member.id}>
                          <td data-label="Employee" style={{ fontWeight: 600 }}>{member.name}</td>
                          <td data-label="Team">{manager ? `${manager.name}'s Team` : "No Team"}</td>
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
