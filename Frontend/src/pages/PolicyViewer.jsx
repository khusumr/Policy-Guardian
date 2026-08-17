import { useState } from "react";
import Highlighter from "../components/ai/Highlighter";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import { signAssignment, roleLabel } from "../Data/store";

// Jump-to-section anchors so a multi-part policy (WFH + PTO + Code of
// Conduct, etc. all stitched together) is easy to navigate instead of
// forcing a long scroll to find one part.
function sectionAnchorId(sectionId) {
  return `policy-part-${sectionId}`;
}

function PolicyViewer({ assignment, onSigned }) {
  const [aiMode, setAiMode] = useState(null); // null | "ask" | "reword"
  const [highlightedText, setHighlightedText] = useState("");

  function handleSign() {
    signAssignment(assignment.id);
    onSigned();
  }

  function handleJump(e, sectionId) {
    e.preventDefault();
    document.getElementById(sectionAnchorId(sectionId))?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="policy-viewer">
      <div className="policy-viewer-header">
        <h1>{roleLabel(assignment.role)} Policy</h1>

        {assignment.status === "signed" ? (
          <p className="signed-note">
            Signed on {new Date(assignment.signedAt).toLocaleDateString()}
          </p>
        ) : (
          <p className="pending-note">Highlight any text to ask AI about it.</p>
        )}
      </div>

      {assignment.parts.length > 1 && (
        <nav className="policy-toc" aria-label="Jump to section">
          <span className="policy-toc-label">Jump to</span>
          {assignment.parts.map((part) => (
            <a
              key={part.sectionId}
              href={`#${sectionAnchorId(part.sectionId)}`}
              onClick={(e) => handleJump(e, part.sectionId)}
            >
              {part.title}
            </a>
          ))}
        </nav>
      )}

      <Highlighter
        onAskAI={(text) => {
          setHighlightedText(text);
          setAiMode("ask");
        }}
        onReword={(text) => {
          setHighlightedText(text);
          setAiMode("reword");
        }}
      >
        {assignment.parts.map((part) => (
          <div className="policy-text" id={sectionAnchorId(part.sectionId)} key={part.sectionId}>
            <h2>{part.title}</h2>
            {part.content.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ))}
      </Highlighter>

      {assignment.status !== "signed" && (
        <button className="sign-button" onClick={handleSign}>
          Sign & Accept
        </button>
      )}

      {aiMode && (
        <AIResponsePanel
          mode={aiMode}
          highlightedText={highlightedText}
          onClose={() => setAiMode(null)}
        />
      )}
    </div>
  );
}

export default PolicyViewer;
