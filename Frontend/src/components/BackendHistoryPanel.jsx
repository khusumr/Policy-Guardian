import { useEffect, useState } from "react";
import { getPolicyHistory } from "../Data/policyExport";

function formatDate(iso) {
  if (!iso) return "Unknown time";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Shows the *backend's* version history for a section — distinct from
// the local PolicyHistoryPanel, which tracks edits made before anything
// was ever exported. This only has entries once a section has been
// exported (PDF/DOCX) at least twice, since the first export creates
// the backend record and each export after that PATCHes it.
function BackendHistoryPanel({ policyId, onClose }) {
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getPolicyHistory(policyId)
      .then((data) => {
        if (!cancelled) setVersions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load history.");
      });

    return () => {
      cancelled = true;
    };
  }, [policyId]);

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3>Backend Version History</h3>
        <button className="ai-panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      <p className="ai-suggestion-note">
        Snapshots saved each time this section was exported as a PDF or DOCX after the first
        time — not every edit, just every export.
      </p>

      {error && <p className="ai-suggestion-note">{error}</p>}

      {!error && versions === null && <p className="sidebar-empty">Loading…</p>}

      {versions && versions.length === 0 && (
        <p className="sidebar-empty">No earlier exported versions yet — export again after an edit to see one here.</p>
      )}

      {versions && versions.length > 0 && (
        <div className="history-list">
          {versions
            .slice()
            .reverse()
            .map((v) => (
              <div className="history-entry" key={v.id}>
                <div className="history-entry-meta">
                  <span className="history-entry-label">Version {v.version}</span>
                  <span className="history-entry-date">{formatDate(v.created_at)}</span>
                </div>
                <div className="history-entry-tone">
                  {v.edited_by ? `Edited by ${v.edited_by}` : "Edited"} · {v.tone} tone
                </div>
                <p className="history-entry-preview">{v.content}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default BackendHistoryPanel;
