import { useEffect, useRef, useState } from "react";
import Highlighter from "../components/ai/Highlighter";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import PolicyHistoryPanel from "../components/PolicyHistoryPanel";
import CitationsPanel from "../components/CitationsPanel";
import { saveSection, restoreSectionVersion } from "../data/store";
import { SECTION_TEMPLATES } from "../data/policyTemplates";

// Edits one section of one role's policy. The body is a contentEditable
// surface (not a <textarea>) wrapped in Highlighter, so selecting text
// uses a real window.getSelection() listener — the same select-to-ask/
// reword interaction PolicyViewer uses for employees reading a signed
// policy. contentEditable is uncontrolled: content is only pushed into
// the DOM when switching sections, never on every keystroke, or the
// cursor would jump to the start on each render.

function SectionEditor({ section, onUpdated }) {
  const [content, setContent] = useState(section.content);
  const [highlightedText, setHighlightedText] = useState("");
  // Only one side panel can be open at a time — opening one closes any other.
  const [activePanel, setActivePanel] = useState(null); // null | "ask" | "reword" | "history" | "citations"
  const [savedNote, setSavedNote] = useState(false);
  const [currentSection, setCurrentSection] = useState(section);
  const editableRef = useRef(null);
  const template = SECTION_TEMPLATES[section.sectionType];
  const citations = template?.citations || [];

  useEffect(() => {
    setContent(section.content);
    setCurrentSection(section);
    if (editableRef.current) {
      editableRef.current.innerText = section.content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  function handleInput() {
    setContent(editableRef.current.innerText);
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
    const next = content.replace(highlightedText, newText);
    setContent(next);
    if (editableRef.current) editableRef.current.innerText = next;
    setActivePanel(null);
  }

  function handleRestore(historyIndex) {
    const restored = restoreSectionVersion(currentSection.id, historyIndex);
    if (!restored) return;
    setCurrentSection(restored);
    setContent(restored.content);
    if (editableRef.current) editableRef.current.innerText = restored.content;
    onUpdated(restored);
    setActivePanel(null);
  }

  return (
    <div className="policy-editor">
      <h1>{section.title}</h1>
      <p className="editor-hint">
        {section.role} section · {currentSection.tone || "Professional"} tone · Highlight text
        below to ask AI about it or have AI reword it.
      </p>

      <Highlighter
        onAskAI={(text) => {
          setHighlightedText(text);
          setActivePanel("ask");
        }}
        onReword={(text) => {
          setHighlightedText(text);
          setActivePanel("reword");
        }}
      >
        <div
          ref={editableRef}
          className="policy-editor-textarea"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
        />
      </Highlighter>

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
          highlightedText={highlightedText}
          allowApply={activePanel === "reword"}
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
