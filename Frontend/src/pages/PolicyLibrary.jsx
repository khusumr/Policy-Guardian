import { useState } from "react";
import { getAllRoles, getSections, getAssignments, getExpirationInfo, roleLabel } from "../Data/store";
import { Input } from "../components/ui/FormControls";
import Tag from "../components/ui/Tag";

// The Policies tab's landing view — an overview across every role that
// has at least one section, with a text search across section content.
// The mockup's version also has an audience-filter sidebar and a peer-
// benchmark blurb; the sidebar's job is already done by the existing
// role/section Sidebar next to this content, and there's no peer data
// source to draw a real benchmark from, so this sticks to what the
// store actually knows.
function PolicyLibrary({ onOpenRole }) {
  const [query, setQuery] = useState("");

  const allSections = getSections();
  const allAssignments = getAssignments();
  const q = query.trim().toLowerCase();

  const rows = getAllRoles()
    .map((role) => {
      const roleSections = allSections.filter((s) => s.role === role.id);
      if (roleSections.length === 0) return null;

      const roleAssignments = allAssignments.filter((a) => a.role === role.id);
      const signed = roleAssignments.filter((a) => a.status === "signed").length;
      const coverage = roleAssignments.length === 0 ? null : Math.round((signed / roleAssignments.length) * 100);

      const soonest = roleSections
        .map((s) => ({ section: s, info: getExpirationInfo(s) }))
        .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining)[0];

      return { role, roleSections, coverage, soonest };
    })
    .filter(Boolean)
    .filter((row) => {
      if (!q) return true;
      if (row.role.label.toLowerCase().includes(q)) return true;
      return row.roleSections.some(
        (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
      );
    });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 28, flexWrap: "wrap" }}>
        <Input
          placeholder='Search policy text, e.g. "monitor allowance"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 420 }}
        />
      </div>

      <h3 style={{ margin: "0 0 16px" }}>
        {rows.length} live polic{rows.length === 1 ? "y" : "ies"}
      </h3>

      {rows.length === 0 ? (
        <p className="sidebar-empty">
          {q ? "No policies match that search." : "No policies yet — build one from the sidebar."}
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Sections</th>
              <th>Expires</th>
              <th style={{ textAlign: "right" }}>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ role, roleSections, coverage, soonest }) => (
              <tr
                key={role.id}
                onClick={() => onOpenRole?.(role.id)}
                style={{ cursor: onOpenRole ? "pointer" : "default" }}
              >
                <td data-label="Policy" style={{ fontWeight: 600 }}>{roleLabel(role.id)}</td>
                <td data-label="Sections">{roleSections.length}</td>
                <td data-label="Expires">
                  {!soonest ? (
                    "—"
                  ) : soonest.info.status === "overdue" ? (
                    <Tag variant="accent-2">Review overdue</Tag>
                  ) : soonest.info.status === "soon" ? (
                    <Tag variant="accent-2">{soonest.info.daysRemaining}d left</Tag>
                  ) : (
                    `${soonest.info.daysRemaining}d left`
                  )}
                </td>
                <td data-label="Coverage" style={{ textAlign: "right" }}>{coverage === null ? "Not sent" : `${coverage}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PolicyLibrary;
