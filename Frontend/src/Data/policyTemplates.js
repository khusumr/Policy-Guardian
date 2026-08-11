// Templates for each kind of policy "section". Each template defines
// the questions HR answers as multiple choice (a select with fixed
// options — e.g. "how many days" as 1-7) and a generate() function
// that turns those answers into policy text.
//
// The "Custom Section" template is intentionally left as free text —
// it exists specifically for cases the other templates don't cover,
// so its questions can't be pinned to a fixed option list in advance.
//
// Placeholder "AI generation" — swap generate() out for a real API
// call later, same idea as data/aiMock.js.

export const SECTION_TEMPLATES = {
  work_from_home: {
    label: "Work From Home",
    description: "Remote work eligibility and expectations",
    fields: [
      {
        key: "daysPerWeek",
        label: "How many days per week can employees work from home?",
        type: "select",
        options: ["1", "2", "3", "4", "5", "6", "7"],
      },
      {
        key: "eligibility",
        label: "Who is eligible for this policy?",
        type: "select",
        options: [
          "All full-time employees",
          "Full-time employees after a 90-day probation period",
          "Managers and above only",
          "Case-by-case approval only",
        ],
      },
      {
        key: "coreHours",
        label: "Are there required core hours or check-in expectations?",
        type: "select",
        options: [
          "No required core hours",
          "Must be online 10am–3pm local time",
          "Must be online during standard business hours (9am–5pm)",
          "Must be available for scheduled meetings only",
        ],
      },
      {
        key: "equipment",
        label: "What equipment or reimbursement is provided?",
        type: "select",
        options: [
          "Company provides laptop and monitor only",
          "Company provides full home office setup (desk, chair, monitor)",
          "Employees receive a monthly stipend for equipment",
          "No equipment or reimbursement provided",
        ],
      },
      {
        key: "exceptions",
        label: "Any exceptions or special cases?",
        type: "select",
        options: [
          "None",
          "New hires must work onsite for first 30 days",
          "Roles requiring in-person work are excluded",
          "Exceptions granted case-by-case by manager approval",
        ],
      },
    ],
    generate(answers) {
      return (
        `Purpose\nThis section defines when and how employees may work from home.\n\n` +
        `Days Per Week\nEmployees may work from home up to ${answers.daysPerWeek || "—"} day(s) per week.\n\n` +
        `Eligibility\n${answers.eligibility || "—"}\n\n` +
        `Core Hours & Check-Ins\n${answers.coreHours || "—"}\n\n` +
        `Equipment & Reimbursement\n${answers.equipment || "—"}\n\n` +
        `Exceptions\n${answers.exceptions || "None."}`
      );
    },
  },

  pto: {
    label: "Paid Time Off",
    description: "Vacation, sick leave, and holiday policy",
    fields: [
      {
        key: "daysPerYear",
        label: "How many PTO days per year?",
        type: "select",
        options: ["5", "10", "15", "20", "25", "30", "Unlimited"],
      },
      {
        key: "accrual",
        label: "How does PTO accrue?",
        type: "select",
        options: [
          "Full allotment granted at start of year",
          "Accrues monthly (divided evenly across 12 months)",
          "Accrues per pay period",
          "Accrues based on tenure/years of service",
        ],
      },
      {
        key: "requestProcess",
        label: "How should employees request time off?",
        type: "select",
        options: [
          "Submit request through HR software at least 2 weeks in advance",
          "Email manager directly for approval",
          "Submit via Slack/Teams request form",
          "No formal process — verbal approval from manager",
        ],
      },
      {
        key: "carryover",
        label: "Can unused PTO carry over to the next year?",
        type: "select",
        options: ["Yes", "No", "Partial"],
      },
      {
        key: "exceptions",
        label: "Any exceptions?",
        type: "select",
        options: [
          "None",
          "Blackout dates during peak business periods",
          "Manager approval required for more than 5 consecutive days",
          "Case-by-case exceptions granted by HR",
        ],
      },
    ],
    generate(answers) {
      return (
        `Purpose\nThis section defines paid time off entitlements and how to use them.\n\n` +
        `Annual Allowance\nEmployees receive ${answers.daysPerYear || "—"} PTO day(s) per year.\n\n` +
        `Accrual\n${answers.accrual || "—"}\n\n` +
        `Requesting Time Off\n${answers.requestProcess || "—"}\n\n` +
        `Carryover\nUnused PTO carryover: ${answers.carryover || "—"}.\n\n` +
        `Exceptions\n${answers.exceptions || "None."}`
      );
    },
  },

  code_of_conduct: {
    label: "Code of Conduct",
    description: "Expected behavior and reporting process",
    fields: [
      {
        key: "purpose",
        label: "What is the purpose of this code of conduct?",
        type: "select",
        options: [
          "To promote a respectful and professional workplace",
          "To ensure legal and ethical compliance",
          "To protect company reputation and assets",
          "To set clear behavioral expectations for all employees",
        ],
      },
      {
        key: "expectations",
        label: "What behavior is expected?",
        type: "select",
        options: [
          "Treat colleagues with respect and professionalism",
          "Maintain honesty and integrity in all business dealings",
          "Avoid conflicts of interest",
          "Follow all applicable laws and company policies",
        ],
      },
      {
        key: "violations",
        label: "What happens in the case of a violation?",
        type: "select",
        options: [
          "Verbal warning, followed by written warning if repeated",
          "Immediate termination for serious violations",
          "Escalation to HR for investigation",
          "Disciplinary action up to and including termination",
        ],
      },
      {
        key: "reporting",
        label: "How should issues be reported?",
        type: "select",
        options: [
          "Report to direct manager",
          "Report to HR via confidential hotline",
          "Report through anonymous online reporting form",
          "Report to any member of leadership",
        ],
      },
    ],
    generate(answers) {
      return (
        `Purpose\n${answers.purpose || "—"}\n\n` +
        `Expected Behavior\n${answers.expectations || "—"}\n\n` +
        `Violations\n${answers.violations || "—"}\n\n` +
        `Reporting Concerns\n${answers.reporting || "—"}`
      );
    },
  },

  expenses: {
    label: "Expense Reimbursement",
    description: "What can be expensed and how to submit it",
    fields: [
      {
        key: "eligibleExpenses",
        label: "What expenses are eligible for reimbursement?",
        type: "select",
        options: [
          "Travel, meals, and lodging for business trips",
          "Office supplies and equipment",
          "Professional development and training",
          "Client entertainment and business meals",
        ],
      },
      {
        key: "approvalLimit",
        label: "Spending limit that requires pre-approval",
        type: "select",
        options: ["$50", "$100", "$250", "$500", "$1000+"],
      },
      {
        key: "submissionProcess",
        label: "How should employees submit expenses?",
        type: "select",
        options: [
          "Submit receipts through expense software within 30 days",
          "Email receipts to finance team",
          "Submit paper expense reports monthly",
          "Use company credit card — no reimbursement needed",
        ],
      },
      {
        key: "timeline",
        label: "Reimbursement timeline",
        type: "select",
        options: ["Weekly", "Bi-weekly", "Monthly"],
      },
    ],
    generate(answers) {
      return (
        `Eligible Expenses\n${answers.eligibleExpenses || "—"}\n\n` +
        `Pre-Approval\nExpenses over ${answers.approvalLimit || "—"} require pre-approval.\n\n` +
        `Submission Process\n${answers.submissionProcess || "—"}\n\n` +
        `Reimbursement Timeline\n${answers.timeline || "—"}`
      );
    },
  },

  custom: {
    label: "Custom Section",
    description: "Write your own section using free-form questions",
    fields: [
      {
        key: "purpose",
        label: "What is the purpose of this section?",
        type: "textarea",
      },
      {
        key: "audience",
        label: "Who does it apply to?",
        type: "textarea",
        placeholder: "e.g. all full-time employees",
      },
      {
        key: "rules",
        label: "What are the key rules or requirements?",
        type: "textarea",
      },
      {
        key: "exceptions",
        label: "Any exceptions or special cases?",
        type: "textarea",
        placeholder: "Optional",
      },
    ],
    generate(answers) {
      return (
        `Purpose\n${answers.purpose || "—"}\n\n` +
        `Who This Applies To\n${answers.audience || "—"}\n\n` +
        `Policy\n${answers.rules || "—"}\n\n` +
        `Exceptions\n${answers.exceptions || "None."}`
      );
    },
  },
};