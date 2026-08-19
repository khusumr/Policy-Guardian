import { useState } from "react";
import { TONE_OPTIONS } from "../../Data/policyTemplates";
import { Field, Input, Textarea, Select } from "../ui/FormControls";
import Button from "../ui/Button";
import LoadingDots from "../ui/LoadingDots";

// Renders whatever fields a section template defines. `type: "select"`
// renders a dropdown (e.g. "how many days" as 1-7) with an "Other…"
// option that swaps in a free-text box; anything else renders a
// textarea. Picking "Other" just writes straight into answers[field.key]
// like any other answer, so it flows into template.generate(answers)
// (and the AI generation call) exactly the way a custom section's
// free-form answers do — no separate handling needed downstream.
//
// Tone options come from TONE_OPTIONS (Professional/Formal/Friendly/
// Simple) rather than the mockup's Plain/Formal/Legal — these match the
// backend's Tone enum so a value picked here works with a real
// /generate-policy call without a mapping step.

const OTHER_VALUE = "__other__";

function QuestionnaireForm({ fields, initialTitle, onGenerate, submitLabel = "Generate Section" }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [answers, setAnswers] = useState({});
  const [otherActive, setOtherActive] = useState({}); // { [fieldKey]: boolean }
  // Real generation hits Azure OpenAI and can take 30-40+ seconds — this
  // is the only thing standing between that wait and it reading as a
  // dead button.
  const [submitting, setSubmitting] = useState(false);

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectChange(field, value) {
    if (value === OTHER_VALUE) {
      setOtherActive((prev) => ({ ...prev, [field.key]: true }));
      updateField(field.key, "");
    } else {
      setOtherActive((prev) => ({ ...prev, [field.key]: false }));
      updateField(field.key, value);
    }
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
          required
        />
      </Field>

      <Field label="Tone">
        <Select value={tone} onChange={(e) => setTone(e.target.value)} required>
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
            <>
              <Select
                value={otherActive[field.key] ? OTHER_VALUE : answers[field.key] || ""}
                onChange={(e) => handleSelectChange(field, e.target.value)}
                required
              >
                <option value="" disabled>
                  Select an option
                </option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value={OTHER_VALUE}>Other…</option>
              </Select>
              {otherActive[field.key] && (
                <Textarea
                  placeholder="Describe your own answer…"
                  value={answers[field.key] || ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  required
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          ) : (
            <Textarea
              placeholder={field.placeholder || ""}
              value={answers[field.key] || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              required
            />
          )}
        </Field>
      ))}

      <Button variant="primary" type="submit" disabled={submitting} style={{ alignSelf: "flex-start" }}>
        {submitting ? (
          <>
            Generating (can take 30-40s) <LoadingDots />
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

export default QuestionnaireForm;
