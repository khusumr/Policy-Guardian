function EmployeeSidebar({ assignments, policies, onSelect }) {
  function policyTitle(policyId) {
    const policy = policies.find((p) => p.id === policyId);
    return policy ? policy.title : "Untitled Policy";
  }

  return (
    <div className="sidebar">
      <h2>My Policies</h2>

      {assignments.length === 0 && (
        <p className="sidebar-empty">No policies yet.</p>
      )}

      {assignments.map((assignment) => (
        <button
          key={assignment.id}
          className={
            assignment.status === "signed" ? "tab tab-signed" : "tab"
          }
          onClick={() => onSelect(assignment)}
        >
          {policyTitle(assignment.policyId)}
          <span className="tab-status">
            {assignment.status === "signed" ? "Signed" : "Pending"}
          </span>
        </button>
      ))}
    </div>
  );
}

export default EmployeeSidebar;
