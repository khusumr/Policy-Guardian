import { useState } from "react";
import { askAIAboutText } from "../../Data/aiMock";
import { Input } from "../ui/FormControls";

// The seeded example from the design mock, shown before the user asks
// anything of their own.
const SEED_MESSAGES = [
  { role: "user", text: "How many days can I work from home?" },
  {
    role: "agent",
    text: "Two days a week, Tuesday excepted.",
    citation: "Source: Work From Home v2, Section 2.1",
  },
];

// Grounds the question in the employee's own assigned policy text via
// the real /ask-ai backend, instead of a canned placeholder response.
function AskPolicyPanel({ policyContext }) {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const answer = await askAIAboutText(
        question,
        policyContext || "No policy has been assigned to this employee yet."
      );
      setMessages((prev) => [...prev, { role: "agent", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: err.message || "Sorry, I couldn't reach the policy agent — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agent-panel">
      <h4 style={{ margin: 0 }}>Ask the policy agent</h4>

      <div className="agent-thread">
        {messages.map((m, i) => (
          <div
            key={i}
            className={"agent-msg " + (m.role === "user" ? "agent-msg-user" : "agent-msg-reply")}
          >
            {m.text}
            {m.citation && <div className="agent-msg-citation">{m.citation}</div>}
          </div>
        ))}
        {loading && <div className="agent-msg agent-msg-reply">Thinking…</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          placeholder="Ask about a policy…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
      </form>
    </div>
  );
}

export default AskPolicyPanel;
