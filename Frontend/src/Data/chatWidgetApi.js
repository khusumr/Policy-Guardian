// Client for the mini chat widget's backend, POST /chat (see
// backend/chat_agent.py). No auth headers here on purpose — the widget
// renders on the public Landing page (no signed-in user yet) as well as
// HRDashboard, and the endpoint itself has no auth dependency to match.

import { BACKEND_URL } from "./backendConfig";

export async function askChatWidget(message) {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();
  return data.answer;
}
