import QuestionnaireForm from "../components/hr/QuestionnaireForm";
import { SECTION_TEMPLATES, applyTone } from "../data/policyTemplates";
import { createSection, roleLabel } from "../data/store";

function CustomSectionForm({ role, onSectionCreated }) {
  const template = SECTION_TEMPLATES.custom;

  function handleGenerate({ title, tone, answers }) {
    const content = applyTone(template.generate(answers), tone, title || "Custom Section");
    const section = createSection({
      role,
      sectionType: "custom",
      title: title || "Custom Section",
      content,
      tone,
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
