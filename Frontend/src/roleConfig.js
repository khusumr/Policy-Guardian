// Maps the Entra `roles` claim (account.idTokenClaims.roles) to which
// dashboard a signed-in user lands on.
//
// "HR" and "Manager" are confirmed real values — backend/main.py already
// calls require_role("HR") and require_role("HR", "Manager") on the
// signature endpoints, so those exact strings are load-bearing on the
// backend today. The other three are still placeholders (obviously-fake
// on purpose, so nobody mistakes them for real ones) — nothing in the
// repo has used an Employee/Intern/Engineer role string yet to confirm
// against. Replace once they show up in a real token or a teammate
// confirms the manifest values, then delete this note.
export const ROLE_TO_DASHBOARD = {
  HR: "hr",
  Manager: "manager",
  TODO_REPLACE_WITH_REAL_ENGINEER_ROLE_VALUE: "engineer",
  TODO_REPLACE_WITH_REAL_EMPLOYEE_ROLE_VALUE: "employee",
  TODO_REPLACE_WITH_REAL_INTERN_ROLE_VALUE: "employee",
};

// A user can hold zero, one, or multiple app roles. When there's more than
// one dashboard match, this order decides which one wins — adjust if the
// intended precedence differs (e.g. someone who is both Manager and HR).
const DASHBOARD_PRIORITY = ["hr", "manager", "engineer", "employee"];

// Returns which dashboard key ("hr" | "manager" | "engineer" | "employee")
// a set of Entra roles should land on, or null if none of the caller's
// roles map to anything — the null case is the "access denied / no role
// assigned" fallback, not a crash.
export function resolveDashboard(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return null;

  const matched = roles
    .map((role) => ROLE_TO_DASHBOARD[role])
    .filter(Boolean);

  if (matched.length === 0) return null;

  return DASHBOARD_PRIORITY.find((d) => matched.includes(d)) || matched[0];
}
