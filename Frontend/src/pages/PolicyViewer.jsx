import { useState } from "react";
import Highlighter from "../components/ai/Highlighter";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import { Input } from "../components/ui/FormControls";
import { signAssignment, roleLabel } from "../Data/store";

// Jump-to-section anchors so a multi-part policy (WFH + PTO + Code of
// Conduct, etc. all stitched together) is easy to navigate instead of
// forcing a long scroll to find one part.
function sectionAnchorId(sectionId) {
  return `policy-part-${sectionId}`;
}

function PolicyViewer({ assignment, onSigned }) {
  const [aiMode, setAiMode] = useState(null); // null | "ask"
  const [highlightedText, setHighlightedText] = useState("");
  const [signerName, setSignerName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const canSign = signerName.trim() && agreed;

  function handleSign(e) {
    e.preventDefault();
    if (!canSign) return;
    signAssignment(assignment.id, signerName.trim());
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
            Signed{assignment.signedBy ? ` by ${assignment.signedBy}` : ""} on{" "}
            {new Date(assignment.signedAt).toLocaleDateString()}
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
        <form onSubmit={handleSign} className="sign-form">
          <Input
            placeholder="Type your full name to sign"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            required
            style={{ maxWidth: 320 }}
          />
          <label className="sign-agree">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            I have read and agree to this policy
          </label>
          <button type="submit" className="sign-button" disabled={!canSign}>
            Sign & Accept
          </button>
        </form>
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
