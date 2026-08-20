import { BACKEND_URL } from "./backendConfig";
import { getAuthHeader } from "./authToken";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trim(text, max = 120) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}


// --------------------------------------------------
// Ask AI About Selected Policy Text
// --------------------------------------------------

export async function askAIAboutText(question, highlightedText) {
  const authHeader = await getAuthHeader();

  const response = await fetch(
    `${BACKEND_URL}/ask-ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
      },
      body: JSON.stringify({
        highlighted_text: highlightedText,
        question,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();

  return data.answer;
}


// --------------------------------------------------
// Reword Selected Policy Text
// --------------------------------------------------

export async function rewordText(instruction, highlightedText) {
  const authHeader = await getAuthHeader();

  const response = await fetch(
    `${BACKEND_URL}/refine-policy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
      },
      body: JSON.stringify({
        current_policy: highlightedText,
        instruction,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();

  return data.policy;
}


// --------------------------------------------------
// Incident Report AI
// --------------------------------------------------

export async function replyToIncidentMessage(conversationSoFar) {
  await delay(500);

  const turnCount = conversationSoFar.filter(
    (m) => m.role === "user"
  ).length;

  if (turnCount === 1) {
    return "Thanks for sharing that. Can you tell me when and where this happened?";
  }

  if (turnCount === 2) {
    return "Got it. Who else was involved or witnessed it, if anyone?";
  }

  return 'Understood — feel free to add anything else, or click "Generate Summary Report" when you\'re ready.';
}


export async function summarizeIncident(conversation) {
  await delay(900);

  const transcript = conversation
    .filter((m) => m.role === "user")
    .map((m) => m.text)
    .join(" ");

  return (
    `Overview\n${trim(transcript, 260) || "No details were provided."}\n\n` +
    `This is a placeholder summary generated from the conversation above — connect a real AI ` +
    `backend to produce an accurate, well-structured incident report.`
  );
}


export async function suggestIncidentNextSteps() {
  await delay(700);

  return [
    "Write down the specifics while they're fresh — dates, times, names, and direct quotes if possible.",
    "Determine whether this needs to be escalated to HR, Legal, or Security based on severity.",
    "Preserve any relevant evidence (emails, messages, screenshots, photos).",
    "Check in with anyone involved or affected within the next 24–48 hours.",
    "Placeholder next steps — connect a real AI backend for guidance tailored to this specific incident.",
  ];
}