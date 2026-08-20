import { useState } from "react";
import QuestionnaireForm from "../components/hr/QuestionnaireForm";
import Button from "../components/ui/Button";
import { SECTION_TEMPLATES } from "../Data/policyTemplates";
import { createSection, roleLabel } from "../Data/store";
import { getAuthHeader } from "../Data/authToken";

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

      const authHeader = await getAuthHeader();

      const response = await fetch(
        "https://app-ai-policy-backend.azurewebsites.net/generate-policy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader && { Authorization: authHeader }),
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
      <h2 style={{ margin: "0 0 6px", fontSize: 30 }}>{template.label}</h2>

      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 28px" }}>
        {roleLabel(role)}
        {template.description ? ` · ${template.description}` : ""}
      </p>

      {!showForm ? (
        <>
          <p>
            This section hasn't been created for the {roleLabel(role)} role yet.
          </p>

          <Button variant="primary" onClick={() => setShowForm(true)}>
            Start Questionnaire
          </Button>
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