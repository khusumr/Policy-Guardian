import { useState } from "react";
import Highlighter from "../components/ai/Highlighter";
import AIResponsePanel from "../components/ai/AIResponsePanel";
import { Textarea } from "../components/ui/FormControls";
import Button from "../components/ui/Button";
import { signAssignment, createTicket, roleLabel } from "../Data/store";
import SignatureCapture from "../components/signature/SignatureCapture";
import SignatureDisplay from "../components/signature/SignatureDisplay";
import LoadingDots from "../components/ui/LoadingDots";
import { signPolicy } from "../Data/signatureApi";
import { ORG_ID } from "../Data/backendConfig";

// Jump-to-section anchors so a multi-part policy (WFH + PTO + Code of
// Conduct, etc. all stitched together) is easy to navigate instead of
// forcing a long scroll to find one part.
function sectionAnchorId(sectionId) {
  return `policy-part-${sectionId}`;
}

function PolicyViewer({ assignment, onSigned, allowFeedback = false }) {
  const [aiMode, setAiMode] = useState(null); // null | "ask"
  const [highlightedText, setHighlightedText] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signatureMode, setSignatureMode] = useState("type"); // "type" | "draw"
  const [drawingDataUrl, setDrawingDataUrl] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  const canSign =
    signerName.trim() && agreed && (signatureMode === "type" || !!drawingDataUrl);

  function handleSendFeedback(e) {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    createTicket({
      type: "feedback",
      role: assignment.role,
      title: `Feedback on ${roleLabel(assignment.role)} Policy`,
      body: feedbackText.trim(),
    });

    setFeedbackText("");
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  }

  async function handleSign(e) {
    e.preventDefault();
    if (!canSign || signing) return;

    setSigning(true);
    setSignError("");

    try {
      // Signs at the assignment level (see Data/signatureApi.js for why) —
      // assignment.id stands in for policy_id until the bundled-vs-per-
      // policy signing model is reconciled with the backend.
      await signPolicy(ORG_ID, assignment.id, signerName.trim());
      signAssignment(assignment.id, signerName.trim(), {
        mode: signatureMode,
        drawingDataUrl: signatureMode === "draw" ? drawingDataUrl : null,
      });
      onSigned();
    } catch (err) {
      setSignError(err.message || "Failed to save your signature. Please try again.");
    } finally {
      setSigning(false);
    }
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
          <>
            <p className="signed-note">
              Signed{assignment.signedBy ? ` by ${assignment.signedBy}` : ""} on{" "}
              {new Date(assignment.signedAt).toLocaleDateString()}
            </p>
            <SignatureDisplay signature={assignment.signature} signedBy={assignment.signedBy} />
          </>
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
          <SignatureCapture
            mode={signatureMode}
            onModeChange={setSignatureMode}
            typedName={signerName}
            onTypedNameChange={setSignerName}
            onDrawingChange={setDrawingDataUrl}
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

          {signError && <p className="sign-error">{signError}</p>}

          <button type="submit" className="sign-button" disabled={!canSign || signing}>
            {signing ? <LoadingDots /> : "Sign & Accept"}
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

      {allowFeedback && (
        <div className="card panel" style={{ marginTop: 24 }}>
          <h3 style={{ margin: "0 0 6px" }}>Send feedback to HR</h3>
          <p className="editor-hint">
            Flag anything that should change — HR will see this and can update the policy.
          </p>
          <form onSubmit={handleSendFeedback} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Textarea
              placeholder="e.g. The PTO carryover section is unclear about partial days..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <Button
              variant="secondary"
              type="submit"
              disabled={!feedbackText.trim()}
              style={{ alignSelf: "flex-start" }}
            >
              Send feedback
            </Button>
            {feedbackSent && <p className="sent-confirmation">Feedback sent to HR.</p>}
          </form>
        </div>
      )}
    </div>
  );
}

export default PolicyViewer;
