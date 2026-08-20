import { useState } from "react";
import { askChatWidget } from "../../Data/chatWidgetApi";

// Small floating chat widget — a corner button that opens a slide-over
// panel. Frontend only for now (see Data/chatWidgetApi.js); backend
// wiring is separate, later work. Props let it be dropped onto any page
// with different copy rather than hardcoding one page's framing.
function MiniChatWidget({ title = "Chat with us", placeholder = "Ask a question..." }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    const answer = await askChatWidget(question);
    setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    setLoading(false);
  }

  return (
    <>
      <button
        className="chat-widget-button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="ai-panel chat-widget-panel">
          <div className="ai-panel-header">
            <h3>{title}</h3>
            <button className="ai-panel-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="lawyer-messages">
            {messages.length === 0 && (
              <p className="lawyer-empty">Ask us anything — we're happy to help.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "msg msg-user" : "msg msg-lawyer"}>
                {m.text}
              </div>
            ))}
            {loading && <div className="msg msg-lawyer msg-thinking">Thinking…</div>}
          </div>

          <form className="ai-panel-form" onSubmit={handleSubmit}>
            <input
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button disabled={loading}>{loading ? "Thinking..." : "Send"}</button>
          </form>
        </div>
      )}
    </>
  );
}

export default MiniChatWidget;
