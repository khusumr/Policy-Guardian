import QuestionnaireForm from "../components/hr/QuestionnaireForm";
import { createPolicy } from "../data/store";

// Placeholder "AI generation" from questionnaire answers — swap this out
// for a real API call later, same idea as data/aiMock.js.
function generatePolicyText(answers) {
  return (
    `Purpose\n${answers.purpose || "—"}\n\n` +
    `Who This Applies To\n${answers.audience || "—"}\n\n` +
    `Policy\n${answers.rules || "—"}\n\n` +
    `Exceptions\n${answers.exceptions || "None."}`
  );
}

function Questionnaire({ onPolicyCreated }) {
  function handleGenerate(answers) {
    const title = answers.policyName || "Untitled Policy";
    const content = generatePolicyText(answers);
    const policy = createPolicy({ title, content });
    onPolicyCreated(policy);
  }

  return (
    <div className="questionnaire-page">
      <h1>Questionnaire</h1>
      <p>Answer a few questions and AI will draft the policy for you.</p>
      <QuestionnaireForm onGenerate={handleGenerate} />
    </div>
  );
}

export default Questionnaire;
