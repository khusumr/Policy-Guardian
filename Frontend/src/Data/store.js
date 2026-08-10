// Lightweight stand-in for a real backend. Everything is persisted to
// localStorage so HR and Employee views (in the same browser) can share
// data. Swap these functions for real API calls once a backend exists —
// nothing outside this file needs to change.

const POLICIES_KEY = "app_policies";
const ASSIGNMENTS_KEY = "app_assignments";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ----- Policies (authored by HR) -----

export function getPolicies() {
  return read(POLICIES_KEY, []);
}

export function getPolicy(id) {
  return getPolicies().find((p) => p.id === id) || null;
}

export function savePolicy(policy) {
  const policies = getPolicies();
  const index = policies.findIndex((p) => p.id === policy.id);

  if (index === -1) {
    policies.push(policy);
  } else {
    policies[index] = policy;
  }

  write(POLICIES_KEY, policies);
  return policy;
}

export function createPolicy({ title, content }) {
  const policy = {
    id: `policy_${Date.now()}`,
    title,
    content,
    createdAt: new Date().toISOString(),
  };
  return savePolicy(policy);
}

// ----- Assignments (a policy sent to an employee) -----

export function getAssignments() {
  return read(ASSIGNMENTS_KEY, []);
}

export function getAssignmentsForEmployee(employeeId) {
  return getAssignments().filter((a) => a.employeeId === employeeId);
}

export function sendPolicyToEmployees(policyId, employeeIds) {
  const assignments = getAssignments();

  employeeIds.forEach((employeeId) => {
    const exists = assignments.find(
      (a) => a.policyId === policyId && a.employeeId === employeeId
    );

    if (!exists) {
      assignments.push({
        id: `assign_${policyId}_${employeeId}`,
        policyId,
        employeeId,
        status: "pending",
        sentAt: new Date().toISOString(),
        signedAt: null,
      });
    }
  });

  write(ASSIGNMENTS_KEY, assignments);
}

export function signAssignment(assignmentId) {
  const assignments = getAssignments();
  const assignment = assignments.find((a) => a.id === assignmentId);

  if (assignment) {
    assignment.status = "signed";
    assignment.signedAt = new Date().toISOString();
    write(ASSIGNMENTS_KEY, assignments);
  }

  return assignment;
}

// No real user/employee system yet — this app only has "hr" and "emp"
// logins (see Login.jsx), so we just mock a single employee to send to.
export const MOCK_EMPLOYEES = ["emp"];
