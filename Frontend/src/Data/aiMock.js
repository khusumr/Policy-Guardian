function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trim(text, max = 120) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export async function askAIAboutText(question, highlightedText) {
  await delay(600);

  return (
    `Here's a plain-language take on the highlighted section: "${trim(highlightedText)}"\n\n` +
    `Regarding your question — "${question}" — this clause generally means employees ` +
    `should follow the stated rule under normal conditions, with exceptions handled by ` +
    `HR case-by-case. (Placeholder response — connect a real AI backend to replace this.)`
  );
}

export async function rewordText(instruction, highlightedText) {
  await delay(700);

  return (
    `Reworded version:\n\n` +
    `${highlightedText}\n\n` +
    `Instruction: ${instruction}\n\n` +
    `(Placeholder response — connect a real AI backend to replace this.)`
  );
}

// Incident Report AI

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

// Lawyer Chat AI

export async function askLawyer(question) {
  await delay(700);

  return (
    `Disclaimer: this is a placeholder legal assistant for prototyping only, not real legal advice.\n\n` +
    `Regarding "${trim(question, 80)}" — you'd want a licensed employment attorney to confirm this for ` +
    `your specific state and industry, but generally a clause like this should reference the applicable ` +
    `state and federal requirements explicitly. (Placeholder response — connect a real legal AI backend ` +
    `to replace this.)`
  );
}