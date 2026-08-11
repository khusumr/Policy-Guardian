import { useState } from "react";
import Highlighter from "../components/ai/Highlighter";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import { signAssignment, roleLabel } from "../data/store";

function PolicyViewer({ assignment, onSigned }) {
  const [aiMode, setAiMode] = useState(null); // null | "ask" | "reword"
  const [highlightedText, setHighlightedText] = useState("");

  function handleSign() {
    signAssignment(assignment.id);
    onSigned();
  }

  return (
    <div className="policy-viewer">
      <h1>{roleLabel(assignment.role)} Policy</h1>

      {assignment.status === "signed" ? (
        <p className="signed-note">
          Signed on {new Date(assignment.signedAt).toLocaleDateString()}
        </p>
      ) : (
        <p className="pending-note">Highlight any text to ask AI about it.</p>
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
          <div className="policy-text" key={part.sectionId}>
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
