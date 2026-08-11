import { useState } from "react";
import { sendRoleToEmployees, getMockUsersForRole, getAssignmentStatsForRole, roleLabel } from "../data/store";
import ExpirationTimeline from "../components/ExpirationTimeline";
import SignaturesPieChart from "../components/SignaturesPieChart";

// Shows every section for a role stitched into one document, and sends
// that combined document to whoever holds that role.

function PolicyOverall({ role, sections }) {
  const [sent, setSent] = useState(false);
  const roleSections = sections.filter((s) => s.role === role);
  const recipients = getMockUsersForRole(role);
  const stats = getAssignmentStatsForRole(role);

  function handleSend() {
    sendRoleToEmployees(role, recipients);
    setSent(true);
  }

  return (
    <div className="policy-editor">
      <h1>{roleLabel(role)} — Overall Policy</h1>
      <p className="editor-hint">
        All sections for the {roleLabel(role)} role, combined into one document.
      </p>

      <div className="overall-stats-row">
        <div className="card panel">
          <SignaturesPieChart signed={stats.signed} total={stats.total} />
        </div>
        <div className="card panel">
          {roleSections.length > 0 ? (
            <ExpirationTimeline sections={roleSections} />
          ) : (
            <p className="sidebar-empty">No sections yet, so nothing to track.</p>
          )}
        </div>
      </div>

      {roleSections.length === 0 ? (
        <p className="sidebar-empty">No sections yet. Add one from the sidebar.</p>
      ) : (
        <div className="overall-sections">
          {roleSections.map((section) => (
            <div className="overall-section" key={section.id}>
              <h2>{section.title}</h2>
              {section.content.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="policy-editor-actions">
        <button
          className="send-button"
          onClick={handleSend}
          disabled={roleSections.length === 0 || recipients.length === 0}
        >
          Send to Employees
        </button>
      </div>

      {recipients.length === 0 && (
        <p className="ai-suggestion-note">
          No employee accounts exist for the {roleLabel(role)} role yet in this demo, so this
          can't be sent. (Only the "employee" role has a matching login — see MOCK_USERS_BY_ROLE
          in data/store.js.)
        </p>
      )}

      {sent && <p className="sent-confirmation">Sent to employees.</p>}
    </div>
  );
}

export default PolicyOverall;
