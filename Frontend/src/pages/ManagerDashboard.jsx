import { useState } from "react";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";
import PolicyViewer from "./PolicyViewer";
import { getAssignmentsForEmployee } from "../data/store";

function ManagerDashboard({ user }) {
  const [assignments, setAssignments] = useState(
    getAssignmentsForEmployee(user)
  );

  const [selectedAssignment, setSelectedAssignment] = useState(null);

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
        ) : (
          <>
            <h1>Manager Dashboard</h1>
            <p>Welcome {user}</p>

            <section className="dashboard-section team-section">
              <div className="section-header">
                <h2>Team Members</h2>
                <p>
                  View the policy signing status of your team.
                </p>
              </div>

              <div className="team-list">
                <div className="team-row team-header">
                  <span>Employee</span>
                  <span>Policy</span>
                  <span>Status</span>
                </div>

                {/* Temporary test data */}
                <div className="team-row">
                  <span>Alice</span>
                  <span>Code of Conduct</span>
                  <span className="status-signed">✓ Signed</span>
                </div>

                <div className="team-row">
                  <span>Bob</span>
                  <span>Code of Conduct</span>
                  <span className="status-pending">Pending</span>
                </div>

                <div className="team-row">
                  <span>Charlie</span>
                  <span>Code of Conduct</span>
                  <span className="status-signed">✓ Signed</span>
                </div>

                <div className="team-row">
                  <span>David</span>
                  <span>Code of Conduct</span>
                  <span className="status-pending">Pending</span>
                </div>
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
                onClick={() => {}}
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