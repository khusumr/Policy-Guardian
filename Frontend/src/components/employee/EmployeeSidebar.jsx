import { roleLabel } from "../../data/store";

function EmployeeSidebar({ assignments, selectedId, onSelect }) {
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
            (assignment.status === "signed" ? "tab tab-signed" : "tab") +
            (selectedId === assignment.id ? " tab-active" : "")
          }
          onClick={() => onSelect(assignment)}
        >
          {roleLabel(assignment.role)} Policy
          <span className="tab-status">
            {assignment.status === "signed" ? "Signed" : "Pending"}
          </span>
        </button>
      ))}
    </div>
  );
}

export default EmployeeSidebar;
