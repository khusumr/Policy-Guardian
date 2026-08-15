import { useRef, useState } from "react";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import PolicyHistoryPanel from "../components/PolicyHistoryPanel";
import CitationsPanel from "../components/CitationsPanel";
import { saveSection, restoreSectionVersion } from "../data/store";
import { SECTION_TEMPLATES } from "../data/policyTemplates";

// Edits one section of one role's policy. Uses a <textarea>, not
// rendered text, so it can't use the Highlighter component
// (window.getSelection doesn't see into form inputs). Instead it
// tracks selectionStart/selectionEnd directly.

function SectionEditor({ section, onUpdated }) {
  const [content, setContent] = useState(section.content);
  const [selection, setSelection] = useState({ text: "", start: 0, end: 0 });
  // Only one side panel can be open at a time — opening one closes any other.
  const [activePanel, setActivePanel] = useState(null); // null | "ask" | "reword" | "history" | "citations"
  const [savedNote, setSavedNote] = useState(false);
  const [currentSection, setCurrentSection] = useState(section);
  const textareaRef = useRef(null);
  const template = SECTION_TEMPLATES[section.sectionType];
  const citations = template?.citations || [];

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
    const updated = { ...currentSection, content, updatedAt: new Date().toISOString() };
    const saved = saveSection(updated);
    setCurrentSection(saved);
    onUpdated(saved);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  }

  function handleApplyReword(newText) {
    setContent(
      (prev) => prev.slice(0, selection.start) + newText + prev.slice(selection.end)
    );
    setActivePanel(null);
  }

  function handleRestore(historyIndex) {
    const restored = restoreSectionVersion(currentSection.id, historyIndex);
    if (!restored) return;
    setCurrentSection(restored);
    setContent(restored.content);
    onUpdated(restored);
    setActivePanel(null);
  }

  return (
    <div className="policy-editor">
      <h1>{section.title}</h1>
      <p className="editor-hint">
        {section.role} section · {currentSection.tone || "Professional"} tone · Highlight text
        below, then ask AI about it or have AI reword it.
      </p>

      <textarea
        ref={textareaRef}
        className="policy-editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onSelect={handleSelect}
      />

      <div className="ai-selection-actions">
        <button disabled={!selection.text} onClick={() => setActivePanel("ask")}>
          Ask AI about selection
        </button>
        <button disabled={!selection.text} onClick={() => setActivePanel("reword")}>
          Reword selection
        </button>
      </div>

      <div className="policy-editor-actions">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
        <button className="history-button" onClick={() => setActivePanel("history")}>
          History{(currentSection.history || []).length > 0 && ` (${currentSection.history.length})`}
        </button>
        {citations.length > 0 && (
          <button className="history-button" onClick={() => setActivePanel("citations")}>
            Citations ({citations.length})
          </button>
        )}
      </div>

      {savedNote && <p className="sent-confirmation">Saved.</p>}

      <p className="editor-note">
        This section saves on its own. Go to the "Overall" tab for the {section.role} role to
        review the full combined policy and send it to employees.
      </p>

      {(activePanel === "ask" || activePanel === "reword") && (
        <AIResponsePanel
          mode={activePanel}
          highlightedText={selection.text}
          allowApply
          onClose={() => setActivePanel(null)}
          onApplyReword={handleApplyReword}
        />
      )}

      {activePanel === "history" && (
        <PolicyHistoryPanel
          section={currentSection}
          onClose={() => setActivePanel(null)}
          onRestore={handleRestore}
        />
      )}

      {activePanel === "citations" && (
        <CitationsPanel
          label={template?.label || section.title}
          citations={citations}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}

export default SectionEditor;
