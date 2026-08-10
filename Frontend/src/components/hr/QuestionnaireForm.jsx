import { useState } from "react";

const fields = [
  { key: "policyName", label: "Policy name", placeholder: "e.g. Work From Home" },
  { key: "purpose", label: "What is the purpose of this policy?", placeholder: "" },
  { key: "audience", label: "Who does it apply to?", placeholder: "e.g. all full-time employees" },
  { key: "rules", label: "What are the key rules or requirements?", placeholder: "" },
  { key: "exceptions", label: "Any exceptions or special cases?", placeholder: "Optional" },
];

function QuestionnaireForm({ onGenerate }) {
  const [answers, setAnswers] = useState({});

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate(answers);
  }

  return (
    <form className="questionnaire-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div className="questionnaire-field" key={field.key}>
          <label>{field.label}</label>
          <textarea
            placeholder={field.placeholder}
            value={answers[field.key] || ""}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
        </div>
      ))}

      <button className="questionnaire-button" type="submit">
        Generate Policy
      </button>
    </form>
  );
}

export default QuestionnaireForm;
