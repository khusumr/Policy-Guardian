import { useRef, useState } from "react";

// Wraps plain rendered text (NOT form inputs) and shows a floating
// "Ask AI / Reword" toolbar when the user selects some of it.
// Uses window.getSelection, which only works on real DOM text —
// for a <textarea> use selectionStart/selectionEnd instead
// (see PolicyEditor.jsx).

function Highlighter({ children, onAskAI, onReword }) {
  const containerRef = useRef(null);
  const [toolbar, setToolbar] = useState(null); // { text, top, left }

  function handleMouseUp() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";

    if (!text || !containerRef.current) {
      setToolbar(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setToolbar(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setToolbar({
      text,
      top: rect.top - containerRect.top - 45,
      left: rect.left - containerRect.left,
    });
  }

  return (
    <div className="highlighter" ref={containerRef} onMouseUp={handleMouseUp}>
      {children}

      {toolbar && (
        <div
          className="highlight-toolbar"
          style={{ top: toolbar.top, left: toolbar.left }}
        >
          <button
            onClick={() => {
              onAskAI(toolbar.text);
              setToolbar(null);
            }}
          >
            Ask AI
          </button>
          <button
            onClick={() => {
              onReword(toolbar.text);
              setToolbar(null);
            }}
          >
            Reword
          </button>
        </div>
      )}
    </div>
  );
}

export default Highlighter;
