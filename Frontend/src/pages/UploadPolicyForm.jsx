import { useState } from "react";
import { createSection, roleLabel } from "../Data/store";
import { Field, Input } from "../components/ui/FormControls";
import Button from "../components/ui/Button";

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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
        <Field label="File">
          <input type="file" accept=".txt,.md,text/plain" onChange={handleFileChange} />
        </Field>

        {error && <p className="ai-suggestion-note">{error}</p>}

        {content && (
          <>
            <Field label="Section title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Existing Remote Work Policy"
              />
            </Field>

            <Field label="Preview">
              <p className="upload-preview">{content}</p>
            </Field>
          </>
        )}

        <Button variant="primary" type="submit" disabled={!content} style={{ alignSelf: "flex-start" }}>
          Add to Policies
        </Button>
      </form>
    </div>
  );
}

export default UploadPolicyForm;
