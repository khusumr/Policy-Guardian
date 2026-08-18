import { useState } from "react";
import { TONE_OPTIONS } from "../../Data/policyTemplates";
import { Field, Input, Textarea, Select } from "../ui/FormControls";
import Button from "../ui/Button";

// Renders whatever fields a section template defines. `type: "select"`
// renders a dropdown (e.g. "how many days" as 1-7); anything else
// renders a textarea.
//
// Tone options come from TONE_OPTIONS (Professional/Formal/Friendly/
// Simple) rather than the mockup's Plain/Formal/Legal — these match the
// backend's Tone enum so a value picked here works with a real
// /generate-policy call without a mapping step.

function QuestionnaireForm({ fields, initialTitle, onGenerate, submitLabel = "Generate Section" }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [answers, setAnswers] = useState({});
  // Real generation hits Azure OpenAI and can take 30-40+ seconds — this
  // is the only thing standing between that wait and it reading as a
  // dead button.
  const [submitting, setSubmitting] = useState(false);

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await onGenerate({ title, tone, answers });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <Field label="Section title">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Work From Home"
        />
      </Field>

      <Field label="Tone">
        <Select value={tone} onChange={(e) => setTone(e.target.value)}>
          {TONE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      </Field>

      {fields.map((field) => (
        <Field label={field.label} key={field.key}>
          {field.type === "select" ? (
            <Select
              value={answers[field.key] || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
            >
              <option value="" disabled>
                Select an option
              </option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          ) : (
            <Textarea
              placeholder={field.placeholder || ""}
              value={answers[field.key] || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          )}
        </Field>
      ))}

      <Button variant="primary" type="submit" disabled={submitting} style={{ alignSelf: "flex-start" }}>
        {submitting ? "Generating… (can take 30-40s)" : submitLabel}
      </Button>
    </form>
  );
}

export default QuestionnaireForm;
