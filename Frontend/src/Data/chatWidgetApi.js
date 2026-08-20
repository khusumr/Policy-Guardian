// Stub for the mini chat widget's replies. Deliberately NOT shaped like a
// backend contract (compare incidentApi.js/signatureApi.js/badgesApi.js,
// which mock a real or invented endpoint) — the task is explicit that
// backend wiring for this one is separate, later work. This just returns
// a canned response so the widget is demonstrable now.

const CANNED_REPLIES = [
  "Thanks for reaching out! Once you sign in, I can help you find the right policy or answer questions about what applies to you.",
  "Good question — that'll depend on your role and which policies you've been assigned. Sign in to get a tailored answer.",
  "I'm just a placeholder for now, but once wired up I'll be able to answer that directly.",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function askChatWidget(message) {
  await delay(500);
  const index = message.length % CANNED_REPLIES.length;
  return CANNED_REPLIES[index];
}
