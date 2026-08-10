import { useRef, useState } from "react";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import { savePolicy, sendPolicyToEmployees, MOCK_EMPLOYEES } from "../data/store";

// Note: this uses a <textarea>, not rendered text, so it can't use the
// Highlighter component (window.getSelection doesn't see into form
// inputs). Instead it tracks selectionStart/selectionEnd directly.

function PolicyEditor({ policy, onUpdated }) {
  const [content, setContent] = useState(policy.content);
  const [sent, setSent] = useState(false);
  const [selection, setSelection] = useState({ text: "", start: 0, end: 0 });
  const [aiMode, setAiMode] = useState(null); // null | "ask" | "reword"
  const textareaRef = useRef(null);

  function handleSelect() {
    const el = textareaRef.current;
    if (!el) return;

    setSelection({
      text: el.value.slice(el.selectionStart, el.selectionEnd),
      start: el.selectionStart,
      end: el.selectionEnd,
    });
  }

  function handleSave() {
    savePolicy({ ...policy, content });
    onUpdated({ ...policy, content });
  }

  function handleSend() {
    handleSave();
    sendPolicyToEmployees(policy.id, MOCK_EMPLOYEES);
    setSent(true);
  }

  function handleApplyReword(newText) {
    setContent(
      (prev) => prev.slice(0, selection.start) + newText + prev.slice(selection.end)
    );
    setAiMode(null);
  }

  return (
    <div className="policy-editor">
      <h1>{policy.title}</h1>
      <p className="editor-hint">
        Highlight text below, then ask AI about it or have AI reword it.
      </p>

      <textarea
        ref={textareaRef}
        className="policy-editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onSelect={handleSelect}
      />

      <div className="ai-selection-actions">
        <button disabled={!selection.text} onClick={() => setAiMode("ask")}>
          Ask AI about selection
        </button>
        <button disabled={!selection.text} onClick={() => setAiMode("reword")}>
          Reword selection
        </button>
      </div>

      <div className="policy-editor-actions">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
        <button className="send-button" onClick={handleSend}>
          Send to Employees
        </button>
      </div>

      {sent && <p className="sent-confirmation">Sent to employees.</p>}

      {aiMode && (
        <AIResponsePanel
          mode={aiMode}
          highlightedText={selection.text}
          allowApply
          onClose={() => setAiMode(null)}
          onApplyReword={handleApplyReword}
        />
      )}
    </div>
  );
}

export default PolicyEditor;
