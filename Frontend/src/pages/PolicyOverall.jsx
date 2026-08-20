import { useState } from "react";
import {
  sendRoleToEmployees,
  getMockUsersByRole,
  getAssignmentsForEmployee,
  roleLabel,
  getMockManager,
} from "../Data/store";
import { formatShortDate } from "../utils/format";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";

// Shows every section for a role stitched into one document.
// HR can select specific people and send the policy to them, and see
// who has already signed (the per-policy view of signatures — the
// per-employee view lives on the HR home / Teams tables).

function PolicyOverall({ role, sections, onViewRecord, onEditSection, onAddSection }) {
  const [sent, setSent] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  const roleSections = sections.filter((s) => s.role === role);
  const recipients = getMockUsersByRole(role);
  const signatures = recipients
    .map((person) => ({
      person,
      assignment: getAssignmentsForEmployee(person.id).find((a) => a.role === role),
    }))
    .filter((row) => row.assignment);

  function toggleRecipient(userId) {
    setSelectedRecipients((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );

    setSent(false);
  }

  function selectAll() {
    setSelectedRecipients(recipients.map((person) => person.id));
    setSent(false);
  }

  function clearAll() {
    setSelectedRecipients([]);
    setSent(false);
  }

  function handleSend() {
    sendRoleToEmployees(role, selectedRecipients);
    setSent(true);
  }

  return (
    <div className="policy-editor">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1>{roleLabel(role)} — Overall Policy</h1>

          <p className="editor-hint">
            All sections for the {roleLabel(role)} role, combined into one
            document.
          </p>
        </div>

        {onAddSection && (
          <Button variant="secondary" size="sm" onClick={() => onAddSection(role)}>
            + Add Section
          </Button>
        )}
      </div>

      {roleSections.length === 0 ? (
        <p className="sidebar-empty">
          No sections yet. Add one from the Home page.
        </p>
      ) : (
        <div className="overall-sections">
          {roleSections.map((section) => (
            <div className="overall-section" key={section.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>{section.title}</h2>
                {onEditSection && (
                  <button className="link-button" onClick={() => onEditSection(section)}>
                    Edit
                  </button>
                )}
              </div>

              {section.content.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {roleSections.length > 0 && (
        <div className="card panel recipient-panel">
          <h2>Send Policy</h2>

          <p className="editor-hint">
            Select who should receive this policy.
          </p>

          {recipients.length === 0 ? (
            <p className="sidebar-empty">
              No users currently have the {roleLabel(role)} role.
            </p>
          ) : (
            <>
              <div className="recipient-actions">
                <Button variant="secondary" size="sm" onClick={selectAll}>
                  Select All
                </Button>

                <Button variant="secondary" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              </div>

              <div className="recipient-list">
                {recipients.map((person) => {
                  const manager = person.managerId
                    ? getMockManager(person.managerId)
                    : null;

                  return (
                    <label
                      key={person.id}
                      className="recipient-row"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(person.id)}
                        onChange={() => toggleRecipient(person.id)}
                      />

                      <span className="recipient-name">
                        {person.name}
                      </span>

                      {manager && (
                        <span className="recipient-team">
                          {manager.name}'s Team
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <p>
                <strong>{selectedRecipients.length}</strong>{" "}
                {selectedRecipients.length === 1
                  ? "person"
                  : "people"}{" "}
                selected
              </p>

              <Button
                variant="primary"
                onClick={handleSend}
                disabled={selectedRecipients.length === 0}
              >
                Send Policy
              </Button>
            </>
          )}

          {sent && (
            <p className="sent-confirmation">
              Policy sent to {selectedRecipients.length}{" "}
              {selectedRecipients.length === 1
                ? "person"
                : "people"}.
            </p>
          )}
        </div>
      )}

      {signatures.length > 0 && (
        <div className="card panel recipient-panel" style={{ marginTop: 24 }}>
          <h2>Signatures</h2>
          <p className="editor-hint">
            Everyone this policy has been sent to, and whether they've signed it.
          </p>

          <table className="table">
            <thead>
              <tr>
                <th>Person</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map(({ person, assignment }) => {
                const isSigned = assignment.status === "signed";
                return (
                  <tr
                    key={person.id}
                    onClick={isSigned ? () => onViewRecord?.(assignment, person.name) : undefined}
                    style={{ cursor: isSigned ? "pointer" : "default" }}
                  >
                    <td data-label="Person" style={{ fontWeight: 600 }}>{person.name}</td>
                    <td data-label="Status" style={{ textAlign: "right" }}>
                      {isSigned ? (
                        <Tag variant="accent">Signed {formatShortDate(assignment.signedAt)}</Tag>
                      ) : (
                        <Tag variant="amber">Pending</Tag>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PolicyOverall;