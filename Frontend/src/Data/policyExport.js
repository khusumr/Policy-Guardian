// Saves the exact, currently-edited section content to the backend
// (not a regenerated version — see PolicyRequest.content on the backend)
// and downloads it as a PDF or DOCX.

import { BACKEND_URL, ORG_ID, POLICY_TYPE_MAP } from "./backendConfig";

async function saveSectionToBackend(section) {
  const requirements = Object.values(section.answers || {}).filter(Boolean);
  if (requirements.length === 0) {
    requirements.push(section.title || "Policy");
  }

  const response = await fetch(`${BACKEND_URL}/policies?org_id=${ORG_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: "Bug Busters",
      policy_type: POLICY_TYPE_MAP[section.sectionType] || "Custom Section",
      tone: section.tone || "Professional",
      requirements,
      content: section.content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save policy for export (${response.status})`);
  }

  return response.json();
}

async function downloadBlob(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to export file (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

export async function exportSection(section, format) {
  const saved = await saveSectionToBackend(section);
  const filename = `${(section.title || "policy").replace(/[^a-z0-9-_ ]/gi, "").trim()}.${format}`;

  await downloadBlob(
    `${BACKEND_URL}/policies/${ORG_ID}/${saved.id}/export/${format}`,
    filename
  );
}
