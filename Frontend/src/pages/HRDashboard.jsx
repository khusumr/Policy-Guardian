import { useState } from "react";
import Sidebar from "../components/Sidebar";
import SectionEditor from "./SectionEditor";
import PolicyOverall from "./PolicyOverall";
import SectionGenerate from "./SectionGenerate";
import CustomSectionForm from "./CustomSectionForm";
import IncidentReport from "./IncidentReport";
import UploadPolicyForm from "./UploadPolicyForm";

import {
  getSections,
  getAssignmentsForEmployee,
  getMockUsersByRole,
  getMockManager,
} from "../data/store";

function HRDashboard({ user }) {
  const [sections, setSections] = useState(getSections());

  // Top-level nav: "home" is the full-width overview (no sidebar),
  // "policies" brings back the role tabs + section sidebar.
  const [view, setView] = useState("home");
  const [homePage, setHomePage] = useState("overview"); // "overview" | "incident"

  const [page, setPage] = useState(null); // "editor" | "overall" | "generate" | "customQuestionnaire" | "upload"
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

  function getEmployeeStatus(employeeId) {
    const assignments = getAssignmentsForEmployee(employeeId);

    if (assignments.length === 0) {
      return {
        text: "No Policy",
        className: "status-none",
      };
    }

    const signed = assignments.some(
      (assignment) => assignment.status === "signed"
    );

    return signed
      ? {
          text: "✓ Signed",
          className: "status-signed",
        }
      : {
          text: "Pending",
          className: "status-pending",
        };
  }

  // Employees who belong to a manager's team.
  // Managers themselves are not included in this table.
  const teamMembers = [
    ...getMockUsersByRole("intern"),
    ...getMockUsersByRole("engineer"),
  ];

  const selectedKey =
    page === "overall" && selectedRole
      ? `overall:${selectedRole}`
      : page === "editor" && selectedSection
      ? selectedSection.id
      : page === "generate" && pending
      ? `pending:${pending.role}:${pending.sectionType}`
      : null;

  return (
    <div className="hr-shell">
      <nav className="top-nav">
        <button
          className={
            "top-nav-tab" + (view === "home" ? " top-nav-tab-active" : "")
          }
          onClick={() => {
            setView("home");
            setHomePage("overview");
          }}
        >
          Home
        </button>

        <button
          className={
            "top-nav-tab" +
            (view === "policies" ? " top-nav-tab-active" : "")
          }
          onClick={() => setView("policies")}
        >
          Policies
        </button>
      </nav>

      <div className="dashboard">
        {view === "policies" && (
          <Sidebar
            sections={sections}
            selectedKey={selectedKey}
            onSelectSection={handleSelectSection}
            onSelectPending={handleSelectPending}
            onSelectOverall={handleSelectOverall}
            onAddCustomSection={handleAddCustomSection}
            onAddUpload={handleAddUpload}
          />
        )}

        <div className="content">
          {view === "home" ? (
            homePage === "incident" ? (
              <IncidentReport />
            ) : (
              <>
                <h1>HR Dashboard</h1>
                <p>Welcome {user}</p>

                <section className="dashboard-section team-section">
                  <div className="section-header">
                    <h2>Policy Signing Status</h2>

                    <p>
                      View who has signed their assigned policies
                      and which team they belong to.
                    </p>
                  </div>

                  <div className="team-list">
                    <div className="team-row team-header">
                      <span>Employee</span>
                      <span>Team</span>
                      <span>Role</span>
                      <span>Status</span>
                    </div>

                    {teamMembers.map((member) => {
                      const manager = member.managerId
                        ? getMockManager(member.managerId)
                        : null;

                      const status = getEmployeeStatus(member.id);

                      return (
                        <div
                          className="team-row"
                          key={member.id}
                        >
                          <span>{member.name}</span>

                          <span>
                            {manager
                              ? `${manager.name}'s Team`
                              : "No Team"}
                          </span>

                          <span>{member.role}</span>

                          <span className={status.className}>
                            {status.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="dashboard-section incident-section">
                  <h2>Incident Report</h2>

                  <p>
                    Create a report about an incident and get suggested
                    next steps.
                  </p>

                  <button
                    className="incident-report-button"
                    onClick={() => setHomePage("incident")}
                  >
                    Incident Report
                  </button>
                </section>
              </>
            )
          ) : page === "editor" && selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onUpdated={handleSectionUpdated}
            />
          ) : page === "overall" && selectedRole ? (
            <PolicyOverall
              role={selectedRole}
              sections={sections}
            />
          ) : page === "generate" && pending ? (
            <SectionGenerate
              role={pending.role}
              sectionType={pending.sectionType}
              onSectionCreated={handleSectionCreated}
            />
          ) : page === "customQuestionnaire" && customSectionRole ? (
            <CustomSectionForm
              role={customSectionRole}
              onSectionCreated={handleSectionCreated}
            />
          ) : page === "upload" && uploadRole ? (
            <UploadPolicyForm
              role={uploadRole}
              onSectionCreated={handleSectionCreated}
            />
          ) : (
            <p className="sidebar-empty">
              Select a role and policy from the sidebar to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HRDashboard;
