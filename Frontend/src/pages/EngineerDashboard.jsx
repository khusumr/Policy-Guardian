import TopNav from "../components/ui/TopNav";
import Tag from "../components/ui/Tag";
import { MOCK_USERS } from "../Data/store";

// Deliberately a stub — the design handoff leaves the Engineer role
// unspecified on purpose ("scoped but not built"), so this mirrors that
// rather than inventing scope for it.
function EngineerDashboard({ user }) {
  const person = MOCK_USERS.find((u) => u.id === user);

  return (
    <div>
      <TopNav tabs={[]} activeTab={null} onTabChange={() => {}} userName={person?.name || user} userRole="engineer" />

      <div className="content" style={{ maxWidth: 485 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>Engineer view</h2>
          <Tag variant="neutral">Work in progress</Tag>
        </div>
        <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: "0 0 26px", lineHeight: 1.5 }}>
          Scoped for the next round — for now it reuses the intern surface without the signing
          actions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="page-kicker" style={{ marginBottom: 6 }}>Planned</div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              Security policy acknowledgement · on-call and incident escalation · repository
              access rules · a link out to the incident chatbot
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 14 }}>
            <div className="page-kicker" style={{ marginBottom: 6 }}>Open question</div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              Does an engineer need to see their whole team's status, or only their own?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EngineerDashboard;
