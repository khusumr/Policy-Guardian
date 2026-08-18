// Shared config for the handful of frontend calls that talk directly to
// the real backend (policy save/export/upload) rather than local storage.

export const BACKEND_URL = "https://app-ai-policy-backend.azurewebsites.net";
export const ORG_ID = "bug-busters";

// Frontend sectionType -> backend PolicyType enum value.
export const POLICY_TYPE_MAP = {
  work_from_home: "Work From Home",
  pto: "Paid Time Off",
  code_of_conduct: "Code of Conduct",
  expenses: "Expense Reimbursement",
  security: "Security Policy",
  custom: "Custom Section",
  uploaded: "Custom Section",
};
