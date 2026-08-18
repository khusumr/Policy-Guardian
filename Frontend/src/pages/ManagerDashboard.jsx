import { useState } from "react";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";
import PolicyViewer from "./PolicyViewer";
import IncidentReport from "./IncidentReport";
import {
  getAssignmentsForEmployee,
  getMockTeam,
  getMockManager,
} from "../data/store";

function ManagerDashboard({ user }) {
    const [assignments, setAssignments] = useState(
        getAssignmentsForEmployee(user)
    );

    const [page, setPage] = useState("home");
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const manager = getMockManager(user);
    const teamMembers = getMockTeam(user).map((member) => {
        const memberAssignments = getAssignmentsForEmployee(member.id);

        return {
            ...member,
            assignments: memberAssignments,
        };
   });

  function refresh() {
    setAssignments(getAssignmentsForEmployee(user));
  }

  function handleSigned() {
    refresh();

    setSelectedAssignment((prev) =>
      prev
        ? {
            ...prev,
            status: "signed",
            signedAt: new Date().toISOString(),
          }
        : prev
    );
  }

  function goHome() {
    setSelectedAssignment(null);
    setPage("home");
  }

  return (
    <div className="dashboard">
      <EmployeeSidebar
        assignments={assignments}
        selectedId={selectedAssignment?.id ?? null}
        onSelect={setSelectedAssignment}
        onHome={goHome}
      />

      <div className="content">
        {selectedAssignment ? (
          <PolicyViewer
            assignment={selectedAssignment}
            onSigned={handleSigned}
          />
        ) : page === "incident" ? (
          <IncidentReport />
        ) : (
          <>
            <h1>Manager Dashboard</h1>
            <p>Welcome {manager?.name || user}</p>

            <section className="dashboard-section team-section">
                <div className="section-header">
                    <h2>Team Members</h2>
                    <p>View the policy signing status of your team.</p>
                </div>

                <div className="team-list">
                    <div className="team-row team-header">
                    <span>Employee</span>
                    <span>Role</span>
                    <span>Status</span>
                    </div>

                    {teamMembers.map((member) => (
                    <div className="team-row" key={member.id}>
                        <span>{member.name}</span>
                        <span>{member.role}</span>
                        <span
                            className={
                                member.assignments.some(
                                (assignment) => assignment.status === "signed"
                                )
                                ? "status-signed"
                                : "status-pending"
                            }
                            >
                            {member.assignments.some(
                                (assignment) => assignment.status === "signed"
                            )
                                ? "✓ Signed"
                                : "Pending"}
                        </span>
                    </div>
                    ))}
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
                onClick={() => setPage("incident")}
              >
                Incident Report
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;