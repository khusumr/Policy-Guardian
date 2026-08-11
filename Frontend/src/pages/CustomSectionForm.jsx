import QuestionnaireForm from "../components/hr/QuestionnaireForm";
import { SECTION_TEMPLATES } from "../data/policyTemplates";
import { createSection, roleLabel } from "../data/store";

function CustomSectionForm({ role, onSectionCreated }) {
  const template = SECTION_TEMPLATES.custom;

  function handleGenerate({ title, answers }) {
    const content = template.generate(answers);
    const section = createSection({
      role,
      sectionType: "custom",
      title: title || "Custom Section",
      content,
      answers,
    });
    onSectionCreated(section);
  }

  return (
    <div className="questionnaire-page">
      <h1>New Custom Section</h1>
      <p className="editor-hint">{roleLabel(role)}</p>
      <QuestionnaireForm fields={template.fields} initialTitle="" onGenerate={handleGenerate} />
    </div>
  );
}

export default CustomSectionForm;
