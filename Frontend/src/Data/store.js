// Lightweight stand-in for a real backend. Everything is persisted to
// localStorage so HR and Employee views (in the same browser) can share
// data. Swap these functions for real API calls once a backend exists —
// nothing outside this file needs to change.
//
// Model:
// - A "section" is one part of a policy (e.g. "Work From Home",
//   "Code of Conduct"), authored via a questionnaire template, and
//   tagged with the role it applies to (employee / manager / hr / ...).
// - The "Overall" view for a role combines all of that role's sections
//   into one document. Sending it snapshots the sections into an
//   assignment so later edits don't silently change what someone
//   already signed.

const SECTIONS_KEY = "app_sections";
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

// ----- Roles -----
// A small built-in set, but any string can be used as a role — creating
// a section with a new role automatically gives it its own folder in
// the sidebar (see getAllRoles below).

export const BUILT_IN_ROLES = [
  { id: "intern", label: "Intern" },
  { id: "engineer", label: "Engineer" },
  { id: "manager", label: "Manager" },
  { id: "hr", label: "HR" },
];

// Which real logins can receive a given role's policy. This demo only
// has "hr" and "emp" logins (see Login.jsx), so only the "employee"
// role has anyone to actually send to. Extend this once more logins
// exist.
const MOCK_USERS_BY_ROLE = {
  employee: ["emp"],
};

export function getMockUsersForRole(role) {
  return MOCK_USERS_BY_ROLE[role] || [];
}

const EXTRA_ROLES_KEY = "app_extra_roles";

// Custom roles someone typed in via "+ New role", stored separately so
// the folder persists even before it has any sections in it.
export function getExtraRoles() {
  return read(EXTRA_ROLES_KEY, []); // [{ id, label }]
}

export function addRole(label) {
  const trimmed = label.trim();
  const id = trimmed.toLowerCase().replace(/\s+/g, "_");
  if (!id) return null;

  const alreadyBuiltIn = BUILT_IN_ROLES.find((r) => r.id === id);
  const extra = getExtraRoles();
  if (!alreadyBuiltIn && !extra.find((r) => r.id === id)) {
    extra.push({ id, label: trimmed });
    write(EXTRA_ROLES_KEY, extra);
  }
  return id;
}

export function roleLabel(role) {
  if (!role) return "Unknown";
  const known = BUILT_IN_ROLES.find((r) => r.id === role);
  if (known) return known.label;
  const extra = getExtraRoles().find((r) => r.id === role);
  if (extra) return extra.label;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// Built-in roles always show up, plus any custom role added via
// "+ New role" or already in use by a section, so a folder never
// disappears once it exists or has something in it.
export function getAllRoles() {
  const used = new Set(getSections().map((s) => s.role));
  const map = new Map();
  BUILT_IN_ROLES.forEach((r) => map.set(r.id, r.label));
  getExtraRoles().forEach((r) => map.set(r.id, r.label));
  used.forEach((id) => {
    if (!map.has(id)) map.set(id, roleLabel(id));
  });
  return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
}

// ----- Sections (one part of a role's policy, authored by HR) -----

export function getSections() {
  return read(SECTIONS_KEY, []);
}

export function getSectionsByRole(role) {
  return getSections().filter((s) => s.role === role);
}

export function getSection(id) {
  return getSections().find((s) => s.id === id) || null;
}

export function saveSection(section) {
  const sections = getSections();
  const index = sections.findIndex((s) => s.id === section.id);

  if (index === -1) {
    sections.push(section);
  } else {
    sections[index] = section;
  }

  write(SECTIONS_KEY, sections);
  return section;
}

export function createSection({ role, sectionType, title, content, answers }) {
  const section = {
    id: `section_${Date.now()}`,
    role,
    sectionType,
    title,
    content,
    answers: answers || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveSection(section);
}

export function deleteSection(id) {
  write(SECTIONS_KEY, getSections().filter((s) => s.id !== id));
}

// ----- Assignments (a role's full set of sections, sent to an employee) -----

export function getAssignments() {
  return read(ASSIGNMENTS_KEY, []).filter((a) => a && a.role && Array.isArray(a.parts));
}

export function getAssignmentsForEmployee(employeeId) {
  return getAssignments().filter((a) => a.employeeId === employeeId);
}

// Snapshots the role's current sections into `parts` on each assignment,
// so this is what the employee actually views and signs, independent of
// later edits to the underlying sections.
export function sendRoleToEmployees(role, employeeIds) {
  const sections = getSectionsByRole(role);
  const parts = sections.map((s) => ({
    sectionId: s.id,
    title: s.title,
    content: s.content,
  }));

  const assignments = getAssignments();

  employeeIds.forEach((employeeId) => {
    const existing = assignments.find(
      (a) => a.role === role && a.employeeId === employeeId
    );

    if (existing) {
      existing.parts = parts;
      existing.sentAt = new Date().toISOString();
      existing.status = "pending";
      existing.signedAt = null;
    } else {
      assignments.push({
        id: `assign_${role}_${employeeId}`,
        role,
        employeeId,
        parts,
        status: "pending",
        sentAt: new Date().toISOString(),
        signedAt: null,
      });
    }
  });

  write(ASSIGNMENTS_KEY, assignments);
  return parts;
}

// ----- Expiration / review cycle -----
// Every section is due for review a fixed number of days after it was
// created. Swap REVIEW_CYCLE_DAYS out for a per-section field later if
// different section types need different cycles.

const REVIEW_CYCLE_DAYS = 365;

export function getExpirationInfo(section) {
  const created = new Date(section.createdAt).getTime();
  const expires = created + REVIEW_CYCLE_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const totalMs = expires - created;
  const elapsedMs = now - created;
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const daysRemaining = Math.ceil((expires - now) / (24 * 60 * 60 * 1000));

  let status = "ok";
  if (daysRemaining <= 0) status = "overdue";
  else if (daysRemaining <= 30) status = "soon";

  return { expiresAt: new Date(expires).toISOString(), percentElapsed, daysRemaining, status };
}

// ----- Signature stats (for the "% signed" chart) -----

export function getAssignmentStatsForRole(role) {
  const assignments = getAssignments().filter((a) => a.role === role);
  const total = assignments.length;
  const signed = assignments.filter((a) => a.status === "signed").length;
  return { signed, total };
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