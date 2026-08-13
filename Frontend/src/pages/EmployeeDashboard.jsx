import { useState } from "react";
import EmployeeSidebar from "../components/employee/EmployeeSidebar";
import PolicyViewer from "./PolicyViewer";
import { getAssignmentsForEmployee } from "../data/store";

function EmployeeDashboard({ user }) {
  const [assignments, setAssignments] = useState(getAssignmentsForEmployee(user));
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

  function goHome() {
    setSelectedAssignment(null);
  }

  return (
    <div className="dashboard">
      <EmployeeSidebar
        assignments={assignments}
        selectedId={selectedAssignment?.id}
        onSelect={setSelectedAssignment}
      />

      <div className="content">
        {selectedAssignment ? (
          <PolicyViewer assignment={selectedAssignment} onSigned={handleSigned} />
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
