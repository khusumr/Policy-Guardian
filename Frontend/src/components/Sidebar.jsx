// HR-side sidebar. Policies now come from the store instead of being
// hardcoded, and there's a "+ New Policy" tab that opens the questionnaire.

function Sidebar({ policies, onSelectPolicy, onNewPolicy }) {
  return (
    <div className="sidebar">
      <h2>Policies</h2>

      <button className="tab new-policy-tab" onClick={onNewPolicy}>
        + New Policy
      </button>

      {policies.length === 0 && (
        <p className="sidebar-empty">No policies yet.</p>
      )}

      {policies.map((policy) => (
        <button
          key={policy.id}
          className="tab"
          onClick={() => onSelectPolicy(policy)}
        >
          {policy.title}
        </button>
      ))}
    </div>
  );
}

export default Sidebar;
