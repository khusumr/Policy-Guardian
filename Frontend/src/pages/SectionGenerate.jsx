import { useState } from "react";
import QuestionnaireForm from "../components/hr/QuestionnaireForm";
import { SECTION_TEMPLATES } from "../data/policyTemplates";
import { createSection, roleLabel } from "../data/store";

// Shown the first time someone clicks a fixed-template tab (Work From
// Home, PTO, etc.) that hasn't been generated for this role yet. A
// button reveals the questionnaire; submitting it creates the section,
// and from then on the sidebar tab opens straight into SectionEditor.
function SectionGenerate({ role, sectionType, onSectionCreated }) {
  const [showForm, setShowForm] = useState(false);
  const template = SECTION_TEMPLATES[sectionType];

  function handleGenerate({ title, answers }) {
    const content = template.generate(answers);
    const section = createSection({
      role,
      sectionType,
      title: title || template.label,
      content,
      answers,
    });
    onSectionCreated(section);
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
          <p>This section hasn't been created for the {roleLabel(role)} role yet.</p>
          <button className="questionnaire-button" onClick={() => setShowForm(true)}>
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
