// Sends a .pdf/.docx file to the backend's real text-extraction endpoint
// and returns the extracted plain text. (.txt/.md files don't need this —
// UploadPolicyForm reads those directly in the browser.)

import { BACKEND_URL, ORG_ID, POLICY_TYPE_MAP } from "./backendConfig";

export async function extractTextFromFile(file, sectionType) {
  const formData = new FormData();
  formData.append("company_name", "Bug Busters");
  formData.append("policy_type", POLICY_TYPE_MAP[sectionType] || "Custom Section");
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/policies/${ORG_ID}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail || `Failed to extract text from file (${response.status})`);
  }

  const saved = await response.json();
  return saved.content;
}
