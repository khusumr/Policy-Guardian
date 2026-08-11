import { useState } from "react";

// Renders whatever fields a section template defines. `type: "select"`
// renders a dropdown (e.g. "how many days" as 1-7); anything else
// renders a textarea.

function QuestionnaireForm({ fields, initialTitle, onGenerate, submitLabel = "Generate Section" }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [answers, setAnswers] = useState({});

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate({ title, answers });
  }

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit}>
      <div className="questionnaire-field">
        <label>Section title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Work From Home"
        />
      </div>

      {fields.map((field) => (
        <div className="questionnaire-field" key={field.key}>
          <label>{field.label}</label>

          {field.type === "select" ? (
            <select
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
            </select>
          ) : (
            <textarea
              placeholder={field.placeholder || ""}
              value={answers[field.key] || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          )}
        </div>
      ))}

      <button className="questionnaire-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export default QuestionnaireForm;
