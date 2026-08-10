import { useState } from "react";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";
import PolicyViewer from "./PolicyViewer";
import { getAssignmentsForEmployee, getPolicies } from "../data/store";

function EmployeeDashboard({ user }) {
  const [assignments, setAssignments] = useState(getAssignmentsForEmployee(user));
  const [policies] = useState(getPolicies());
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  function refresh() {
    setAssignments(getAssignmentsForEmployee(user));
  }

  function handleSigned() {
    refresh();
    setSelectedAssignment((prev) =>
      prev ? { ...prev, status: "signed", signedAt: new Date().toISOString() } : prev
    );
  }

  const selectedPolicy = selectedAssignment
    ? policies.find((p) => p.id === selectedAssignment.policyId)
    : null;

  return (
    <div className="dashboard">
      <EmployeeSidebar
        assignments={assignments}
        policies={policies}
        onSelect={setSelectedAssignment}
      />

      <div className="content">
        {selectedAssignment && selectedPolicy ? (
          <PolicyViewer
            policy={selectedPolicy}
            assignment={selectedAssignment}
            onSigned={handleSigned}
          />
        ) : (
          <>
            <h1>Welcome {user}</h1>
            <p>Select a policy from the sidebar to view it.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
