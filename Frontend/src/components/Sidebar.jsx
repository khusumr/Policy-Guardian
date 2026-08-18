import { useState } from "react";
import { getAllRoles, addRole } from "../data/store";
import { SECTION_TEMPLATES } from "../data/policyTemplates";

const FIXED_SECTION_TYPES = Object.keys(SECTION_TEMPLATES).filter(
  (k) => k !== "custom"
);

function Sidebar({
  sections,
  selectedKey,
  onSelectSection,
  onSelectPending,
  onSelectOverall,
  onAddCustomSection,
  onAddUpload,
}) {
  const roles = getAllRoles();
  const [activeRole, setActiveRole] = useState(roles[0]?.id ?? null);
  const [addingRole, setAddingRole] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");

  function handleAddRole(e) {
    e.preventDefault();

    const id = addRole(newRoleInput);

    if (id) {
      setNewRoleInput("");
      setAddingRole(false);
      setActiveRole(id);
      // A brand-new role has no sections yet — land on its (empty)
      // Overall view rather than leaving the content pane on whatever
      // was showing for the previous role.
      onSelectOverall(id);
    }
  }

  const role = roles.find((r) => r.id === activeRole) || roles[0] || null;
  const roleSections = role
    ? sections.filter((s) => s.role === role.id)
    : [];

  const customSections = roleSections.filter(
    (s) => s.sectionType === "custom"
  );

  const uploadedSections = roleSections.filter(
    (s) => s.sectionType === "uploaded"
  );

  return (
    <div className="sidebar">
      <h2>Policies</h2>

      <div className="role-tabs">
        {roles.map((r) => (
          <button
            key={r.id}
            className={
              "role-tab" + (r.id === role?.id ? " role-tab-active" : "")
            }
            onClick={() => {
              setActiveRole(r.id);
              setAddingRole(false);
            }}
          >
            {r.label}
          </button>
        ))}

        <button
          className="role-tab role-tab-add"
          onClick={() => setAddingRole((v) => !v)}
          aria-label="Add role"
          aria-expanded={addingRole}
        >
          +
        </button>
      </div>

      {addingRole && (
        <form className="role-tab-form" onSubmit={handleAddRole}>
          <input
            autoFocus
            placeholder="New role name"
            value={newRoleInput}
            onChange={(e) => setNewRoleInput(e.target.value)}
          />

          <button type="submit" disabled={!newRoleInput.trim()}>
            Add
          </button>
        </form>
      )}

      {role ? (
        <div className="role-section-list">
          <button
            className={
              "tab tab-nested" +
              (selectedKey === `overall:${role.id}` ? " tab-active" : "")
            }
            onClick={() => onSelectOverall(role.id)}
          >
            <span className="tab-label">Overall</span>
          </button>

          {FIXED_SECTION_TYPES.map((type) => {
            const template = SECTION_TEMPLATES[type];

            const section = roleSections.find(
              (s) => s.sectionType === type
            );

            const isSelected = section
              ? selectedKey === section.id
              : selectedKey === `pending:${role.id}:${type}`;

            return (
              <button
                key={type}
                className={
                  "tab tab-nested" + (isSelected ? " tab-active" : "")
                }
                onClick={() =>
                  section
                    ? onSelectSection(section)
                    : onSelectPending(role.id, type)
                }
              >
                <span className="tab-label">{template.label}</span>

                {!isSelected &&
                  (section ? (
                    <span
                      className="tab-dot"
                      aria-label="Generated"
                    />
                  ) : (
                    <span className="tab-pill">Not started</span>
                  ))}
              </button>
            );
          })}

          {customSections.map((section) => (
            <button
              key={section.id}
              className={
                "tab tab-nested" +
                (selectedKey === section.id ? " tab-active" : "")
              }
              onClick={() => onSelectSection(section)}
            >
              <span className="tab-label">{section.title}</span>

              {selectedKey !== section.id && (
                <span className="tab-dot" aria-label="Generated" />
              )}
            </button>
          ))}

          {uploadedSections.map((section) => (
            <button
              key={section.id}
              className={
                "tab tab-nested" +
                (selectedKey === section.id ? " tab-active" : "")
              }
              onClick={() => onSelectSection(section)}
            >
              <span className="tab-label">{section.title}</span>

              {selectedKey !== section.id && (
                <span className="tab-dot" aria-label="Generated" />
              )}
            </button>
          ))}

          <button
            className="tab tab-nested tab-add"
            onClick={() => onAddCustomSection(role.id)}
          >
            + Add custom section
          </button>

          <button
            className="tab tab-nested tab-add"
            onClick={() => onAddUpload(role.id)}
          >
            + Upload existing policy
          </button>
        </div>
      ) : (
        <p className="sidebar-empty">No roles yet. Use + to add one.</p>
      )}
    </div>
  );
}

export default Sidebar;
