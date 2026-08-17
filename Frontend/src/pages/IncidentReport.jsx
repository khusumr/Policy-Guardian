import { useEffect, useRef, useState } from "react";
import {
  replyToIncidentMessage,
  summarizeIncident,
  suggestIncidentNextSteps,
} from "../Data/aiMock";

// A private, unshared chat for a manager or HR person to talk through
// an incident, then generate a summary + suggested next steps. Nothing
// here is saved or sent anywhere — it only lives in this component's
// state for the current session.
function IncidentReport() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [nextSteps, setNextSteps] = useState(null);
  const [generating, setGenerating] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const nextMessages = [...messages, { role: "user", text: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    const reply = await replyToIncidentMessage(nextMessages);
    setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    setSending(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    const [summaryText, steps] = await Promise.all([
      summarizeIncident(messages),
      suggestIncidentNextSteps(messages),
    ]);
    setSummary(summaryText);
    setNextSteps(steps);
    setGenerating(false);
  }

  function handleReset() {
    setMessages([]);
    setSummary(null);
    setNextSteps(null);
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="incident-page">
      <h1>Incident Report Assistant</h1>
      <p className="editor-hint">
        Describe what happened in your own words. This conversation isn't saved or sent to
        anyone — it's a private tool to help you think through and document an incident.
      </p>

      <div className="incident-layout">
        <div className="incident-chat panel">
          <div className="incident-messages">
            {messages.length === 0 && (
              <p className="lawyer-empty">Start typing below to describe what happened.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "msg msg-user" : "msg msg-lawyer"}>
                {m.text}
              </div>
            ))}
            {sending && <div className="msg msg-lawyer msg-thinking">…</div>}
            <div ref={chatEndRef} />
          </div>

          <form className="ai-panel-form" onSubmit={handleSend}>
            <input
              placeholder="Describe what happened..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button disabled={sending}>{sending ? "Sending..." : "Send"}</button>
          </form>

          <div className="incident-actions">
            <button
              className="questionnaire-button"
              onClick={handleGenerate}
              disabled={userMessageCount === 0 || generating}
            >
              {generating ? "Generating..." : "Generate Summary Report"}
            </button>
            {(messages.length > 0 || summary) && (
              <button className="link-button" onClick={handleReset}>
                Start over
              </button>
            )}
          </div>
        </div>

        <div className="incident-report panel">
          <h2>Summary Report</h2>
          {!summary ? (
            <p className="sidebar-empty" style={{ color: "var(--color-text-muted)" }}>
              Nothing generated yet. Describe the incident in the chat, then click "Generate
              Summary Report".
            </p>
          ) : (
            <>
              <div className="incident-summary-text">
                {summary.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <h2>Suggested Next Steps</h2>
              <ol className="incident-next-steps">
                {nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default IncidentReport;
