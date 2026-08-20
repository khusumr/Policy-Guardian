import { useState } from "react";
import { rewordText } from "../Data/aiMock";
import { Select } from "../components/ui/FormControls";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import LoadingDots from "../components/ui/LoadingDots";
import {
  getTickets,
  resolveTicket,
  createTicket,
  getSectionsByRole,
  saveSection,
  getAssignments,
  sendRoleToEmployees,
  roleLabel,
} from "../Data/store";
import { formatShortDate } from "../utils/format";

// Manager feedback lands here as a ticket. HR picks which section it
// applies to, and "Apply with AI & resend" reuses the real /refine-policy
// call (via aiMock's rewordText) to regenerate that section from the
// feedback, saves it, and re-sends the role's policy to everyone it was
// previously assigned to. A "policy_updated" ticket is logged afterward
// standing in for a real email notification, until #9's ticketing/email
// backend exists — clearly labeled as a mock, not a real send.

function FeedbackTicketCard({ ticket, onResolved }) {
  const sections = getSectionsByRole(ticket.role);
  const [sectionId, setSectionId] = useState(sections[0]?.id || "");
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || applying) return;

    setApplying(true);
    try {
      const revised = await rewordText(ticket.body, section.content);
      saveSection({ ...section, content: revised });

      const recipientIds = getAssignments()
        .filter((a) => a.role === ticket.role)
        .map((a) => a.employeeId);

      if (recipientIds.length > 0) {
        sendRoleToEmployees(ticket.role, recipientIds);
      }

      createTicket({
        type: "policy_updated",
        role: ticket.role,
        title: `${roleLabel(ticket.role)} policy updated from feedback`,
        body: `"${section.title}" was regenerated with AI and re-sent to ${recipientIds.length} recipient(s). Notified via email (mock).`,
      });

      resolveTicket(ticket.id);
      onResolved();
    } catch (error) {
      console.error("Failed to apply feedback:", error);
      alert("Failed to regenerate the policy with AI. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="card panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>{ticket.title}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {roleLabel(ticket.role)} · {formatShortDate(ticket.createdAt)}
          </p>
        </div>
        <Tag variant="amber">Open</Tag>
      </div>

      <p style={{ margin: "12px 0" }}>{ticket.body}</p>

      {sections.length === 0 ? (
        <p className="sidebar-empty">No sections exist for this role to apply feedback to.</p>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ maxWidth: 220 }}>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
          <Button variant="primary" size="sm" onClick={handleApply} disabled={applying}>
            {applying ? (
              <>
                Applying <LoadingDots />
              </>
            ) : (
              "Apply with AI & resend"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ReminderTicketCard({ ticket, onResolved }) {
  return (
    <div className="card panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 4px" }}>{ticket.title}</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {formatShortDate(ticket.createdAt)}
          </p>
        </div>
        <Tag variant="amber">Open</Tag>
      </div>

      <p style={{ margin: "12px 0" }}>{ticket.body}</p>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          resolveTicket(ticket.id);
          onResolved();
        }}
      >
        Mark handled
      </Button>
    </div>
  );
}

function Tickets() {
  const [, forceRefresh] = useState(0);
  const refresh = () => forceRefresh((n) => n + 1);

  const tickets = getTickets();
  const open = tickets.filter((t) => t.status === "open" && t.type !== "policy_updated");
  const log = tickets
    .filter((t) => t.type === "policy_updated" || t.status === "resolved")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <div className="page-kicker">Tickets</div>
      <h1 style={{ margin: "0 0 6px" }}>Feedback &amp; Reminders</h1>
      <p className="page-lede">
        Manager feedback and signature reminders land here. Applying feedback uses AI to
        regenerate the affected section and automatically re-sends it.
      </p>

      <h3 style={{ margin: "24px 0 12px" }}>Open ({open.length})</h3>
      {open.length === 0 ? (
        <p className="sidebar-empty">Nothing open.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {open.map((t) =>
            t.type === "feedback" ? (
              <FeedbackTicketCard key={t.id} ticket={t} onResolved={refresh} />
            ) : (
              <ReminderTicketCard key={t.id} ticket={t} onResolved={refresh} />
            )
          )}
        </div>
      )}

      {log.length > 0 && (
        <>
          <h3 style={{ margin: "32px 0 12px" }}>Activity log</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            {log.map((t) => (
              <div key={t.id} style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "var(--color-text-muted)", minWidth: 90 }}>
                  {formatShortDate(t.createdAt)}
                </span>
                <span>
                  {t.title} — {t.body}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Tickets;
