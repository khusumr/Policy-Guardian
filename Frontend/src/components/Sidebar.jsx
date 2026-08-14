import { useState } from "react";
import { getAllRoles, addRole } from "../data/store";
import { SECTION_TEMPLATES } from "../data/policyTemplates";

// The 4 built-in templates always show up as tabs under every role,
// whether or not that section has been generated yet. "Custom" isn't
// fixed-slot — a role can have any number of custom sections, added
// individually — so it's listed separately.
const FIXED_SECTION_TYPES = Object.keys(SECTION_TEMPLATES).filter((k) => k !== "custom");

function Sidebar({
  sections,
  selectedKey,
  onSelectSection,
  onSelectPending,
  onSelectOverall,
  onAddCustomSection,
  onOpenIncidentReport,
}) {
  const roles = getAllRoles();
  const [expanded, setExpanded] = useState(() => new Set(roles.map((r) => r.id)));
  const [newRoleInput, setNewRoleInput] = useState("");
  const [, forceUpdate] = useState(0);

  function toggle(roleId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  function handleAddRole(e) {
    e.preventDefault();
    const id = addRole(newRoleInput);
    if (id) {
      setNewRoleInput("");
      setExpanded((prev) => new Set(prev).add(id));
      forceUpdate((n) => n + 1); // re-render so getAllRoles() picks up the new role
    }
  }

  return (
    <div className="sidebar">
      <h2>Policies</h2>

      <form className="custom-role-form sidebar-new-role-form" onSubmit={handleAddRole}>
        <input
          placeholder="+ New role (e.g. Contractor)"
          value={newRoleInput}
          onChange={(e) => setNewRoleInput(e.target.value)}
        />
        <button type="submit" disabled={!newRoleInput.trim()}>
          Add
        </button>
      </form>

      {roles.map((role) => {
        const isOpen = expanded.has(role.id);
        const roleSections = sections.filter((s) => s.role === role.id);
        const customSections = roleSections.filter((s) => s.sectionType === "custom");

        return (
          <div className="role-folder" key={role.id}>
            <button className="role-folder-header" onClick={() => toggle(role.id)}>
              <span className="role-folder-chevron">{isOpen ? "▾" : "▸"}</span>
              <span className="role-folder-label">{role.label}</span>
              <span className="role-folder-count">{roleSections.length}</span>
            </button>

            {isOpen && (
              <div className="role-folder-body">
                <button
                  className={
                    "tab tab-nested" + (selectedKey === `overall:${role.id}` ? " tab-active" : "")
                  }
                  onClick={() => onSelectOverall(role.id)}
                >
                  Overall
                </button>

                {FIXED_SECTION_TYPES.map((type) => {
                  const template = SECTION_TEMPLATES[type];
                  const section = roleSections.find((s) => s.sectionType === type);
                  const isSelected = section
                    ? selectedKey === section.id
                    : selectedKey === `pending:${role.id}:${type}`;

                  return (
                    <button
                      key={type}
                      className={
                        "tab tab-nested" +
                        (isSelected ? " tab-active" : "") +
                        (!section ? " tab-pending" : "")
                      }
                      onClick={() =>
                        section ? onSelectSection(section) : onSelectPending(role.id, type)
                      }
                    >
                      {template.label}
                      {!section && <span className="tab-status">Not started</span>}
                    </button>
                  );
                })}

                {customSections.map((section) => (
                  <button
                    key={section.id}
                    className={
                      "tab tab-nested" + (selectedKey === section.id ? " tab-active" : "")
                    }
                    onClick={() => onSelectSection(section)}
                  >
                    {section.title}
                  </button>
                ))}

                <button
                  className="tab tab-nested tab-add"
                  onClick={() => onAddCustomSection(role.id)}
                >
                  + Add custom section
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Placeholder entry point — your teammate can move/restyle this
          button wherever they like; the important part is just calling
          onOpenIncidentReport(). */}
      {onOpenIncidentReport && (
        <button className="tab sidebar-incident-link" onClick={onOpenIncidentReport}>
          🚨 Incident Report
        </button>
      )}
    </div>
  );
}

export default Sidebar;
