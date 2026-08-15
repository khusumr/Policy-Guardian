import { useState } from "react";
import { createSection, roleLabel } from "../data/store";

// Lets HR bring an existing policy document into the app as a normal
// section, so it gets the same editor, AI features (ask/reword), and
// history tracking as an AI-generated one. Reads the file as plain
// text client-side — .txt/.md only, no .docx/.pdf parsing.

function UploadPolicyForm({ role, onSectionCreated }) {
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setContent("");

    const reader = new FileReader();
    reader.onload = () => {
      setContent(reader.result);
      setFileName(file.name);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.onerror = () => setError("Couldn't read that file. Try a plain .txt or .md file.");
    reader.readAsText(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!content) return;

    const section = createSection({
      role,
      sectionType: "uploaded",
      title: title || fileName || "Uploaded Policy",
      content,
      tone: "Professional",
      answers: {},
    });
    onSectionCreated(section);
  }

  return (
    <div className="questionnaire-page">
      <h1>Upload Existing Policy</h1>
      <p className="editor-hint">
        {roleLabel(role)} · Upload a plain text policy document (.txt or .md) to bring it into the
        editor alongside generated sections.
      </p>

      <form className="questionnaire-form" onSubmit={handleSubmit}>
        <div className="questionnaire-field">
          <label>File</label>
          <input type="file" accept=".txt,.md,text/plain" onChange={handleFileChange} />
        </div>

        {error && <p className="ai-suggestion-note">{error}</p>}

        {content && (
          <>
            <div className="questionnaire-field">
              <label>Section title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Existing Remote Work Policy"
              />
            </div>

            <div className="questionnaire-field">
              <label>Preview</label>
              <p className="upload-preview">{content}</p>
            </div>
          </>
        )}

        <button className="questionnaire-button" type="submit" disabled={!content}>
          Add to Policies
        </button>
      </form>
    </div>
  );
}

export default UploadPolicyForm;
