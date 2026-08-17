import { useState } from "react";
import { askAIAboutText, rewordText } from "../../Data/aiMock";

// allowApply controls whether a "reword" response can be applied back
// into the source document. HR's editor passes allowApply — employees
// viewing a signed policy just see the suggestion, since they can't
// change the official policy text themselves.

function AIResponsePanel({
  mode, // "ask" | "reword"
  highlightedText,
  onClose,
  onApplyReword = () => {},
  allowApply = false,
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    const result =
      mode === "ask"
        ? await askAIAboutText(input || "What does this mean?", highlightedText)
        : await rewordText(input || "Make it clearer", highlightedText);

    setResponse(result);
    setLoading(false);
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3>{mode === "ask" ? "Ask AI" : "Reword with AI"}</h3>
        <button className="ai-panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="ai-panel-quote">"{highlightedText}"</div>

      <form onSubmit={handleSubmit} className="ai-panel-form">
        <input
          placeholder={
            mode === "ask"
              ? "Ask a question about this text..."
              : "Describe how to change it (e.g. 'make it friendlier')"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button disabled={loading}>{loading ? "Thinking..." : "Submit"}</button>
      </form>

      {response && (
        <div className="ai-panel-response">
          <p>{response}</p>

          {mode === "reword" && allowApply && (
            <button
              className="ai-apply-button"
              onClick={() => onApplyReword(response)}
            >
              Apply to Policy
            </button>
          )}

          {mode === "reword" && !allowApply && (
            <p className="ai-suggestion-note">
              This is a suggestion only — HR would need to update the policy
              for it to take effect.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AIResponsePanel;
