import { useState } from "react";
import QuestionnaireForm from "../components/hr/QuestionnaireForm";
import { SECTION_TEMPLATES } from "../data/policyTemplates";
import { createSection, roleLabel } from "../data/store";

function SectionGenerate({ role, sectionType, onSectionCreated }) {
  const [showForm, setShowForm] = useState(false);
  const template = SECTION_TEMPLATES[sectionType];

  async function handleGenerate({ title, tone, answers }) {
    try {
      const requirements = Object.values(answers).filter(Boolean);

      const policyType =
        sectionType === "security"
          ? "Security Policy"
          : template.label;

      const response = await fetch(
        "https://app-ai-policy-backend.azurewebsites.net/generate-policy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: "Bug Busters",
            policy_type: policyType,
            tone,
            requirements,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();

      const section = createSection({
        role,
        sectionType,
        title: title || template.label,
        content: data.policy,
        tone,
        answers,
      });

      onSectionCreated(section);
    } catch (error) {
      console.error("Policy generation failed:", error);
      alert("Failed to generate policy. Please try again.");
    }
  }

  return (
    <div className="questionnaire-page">
      <h1>{template.label}</h1>

      <p className="editor-hint">
        {roleLabel(role)}
        {template.description ? ` · ${template.description}` : ""}
      </p>

      {!showForm ? (
        <>
          <p>
            This section hasn't been created for the {roleLabel(role)} role yet.
          </p>

          <button
            className="questionnaire-button"
            onClick={() => setShowForm(true)}
          >
            Start Questionnaire
          </button>
        </>
      ) : (
        <QuestionnaireForm
          fields={template.fields}
          initialTitle={template.label}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}

export default SectionGenerate;