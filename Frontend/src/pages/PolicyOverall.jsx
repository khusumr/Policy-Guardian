import { useState } from "react";
import {
  sendRoleToEmployees,
  getMockUsersByRole,
  roleLabel,
  getMockManager,
} from "../data/store";

// Shows every section for a role stitched into one document.
// HR can select specific people and send the policy to them.

function PolicyOverall({ role, sections }) {
  const [sent, setSent] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  const roleSections = sections.filter((s) => s.role === role);
  const recipients = getMockUsersByRole(role);

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
      <h1>{roleLabel(role)} — Overall Policy</h1>

      <p className="editor-hint">
        All sections for the {roleLabel(role)} role, combined into one
        document.
      </p>

      {roleSections.length === 0 ? (
        <p className="sidebar-empty">
          No sections yet. Add one from the sidebar.
        </p>
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
                <button onClick={selectAll}>
                  Select All
                </button>

                <button onClick={clearAll}>
                  Clear
                </button>
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

              <button
                className="send-button"
                onClick={handleSend}
                disabled={selectedRecipients.length === 0}
              >
                Send Policy
              </button>
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
    </div>
  );
}

export default PolicyOverall;