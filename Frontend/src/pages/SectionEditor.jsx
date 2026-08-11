import { useRef, useState } from "react";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import { saveSection } from "../data/store";

// Edits one section of one role's policy. Uses a <textarea>, not
// rendered text, so it can't use the Highlighter component
// (window.getSelection doesn't see into form inputs). Instead it
// tracks selectionStart/selectionEnd directly.

function SectionEditor({ section, onUpdated }) {
  const [content, setContent] = useState(section.content);
  const [selection, setSelection] = useState({ text: "", start: 0, end: 0 });
  const [aiMode, setAiMode] = useState(null); // null | "ask" | "reword"
  const [savedNote, setSavedNote] = useState(false);
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
    const updated = { ...section, content, updatedAt: new Date().toISOString() };
    saveSection(updated);
    onUpdated(updated);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  }

  function handleApplyReword(newText) {
    setContent(
      (prev) => prev.slice(0, selection.start) + newText + prev.slice(selection.end)
    );
    setAiMode(null);
  }

  return (
    <div className="policy-editor">
      <h1>{section.title}</h1>
      <p className="editor-hint">
        {section.role} section · Highlight text below, then ask AI about it or have AI reword it.
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
      </div>

      {savedNote && <p className="sent-confirmation">Saved.</p>}

      <p className="editor-note">
        This section saves on its own. Go to the "Overall" tab for the {section.role} role to
        review the full combined policy and send it to employees.
      </p>

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

export default SectionEditor;
